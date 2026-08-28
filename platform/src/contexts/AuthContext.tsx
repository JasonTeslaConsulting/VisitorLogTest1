import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@framework/integrations/supabase/client";
import { CurrentUser } from "@framework/types/auth";
import { resolveCurrentUser } from "@framework/services/auth";
import { AUTH } from "@framework/lib/constants/app";
import { appConfig } from "@framework/app/appConfig";
import { toast } from "@framework/components/ui/toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AuthMode = "entra" | "otp" | "password";

// Dev-only stand-in for a signed-in user, so a page behind ProtectedRoute can be opened with
// no real account. `import.meta.env.DEV` is replaced with `false` at build time, so this whole
// branch — and this object — are eliminated from `npm run build` output; see
// docs/architecture/auth.md § Dev auth bypass. The email/fullname strings double as the
// sentinel CI greps the production bundle for.
const DEV_USER: CurrentUser = {
  id: "00000000-0000-0000-0000-000000000000",
  // Falsy on purpose — useNavMenu is `enabled: !!organizationUserId`, so this skips the nav
  // query instead of firing one against an unconfigured Supabase project. The id is a uuid
  // string, so the empty string is what's falsy here; any placeholder uuid would fire the query.
  organizationUserId: "",
  fullname: "Dev User (auth bypassed)",
  email: "dev-auth-bypass@localhost",
  roles: (import.meta.env.VITE_DEV_AUTH_ROLES ?? "").split(",").filter(Boolean),
  // Every screen granted: the purpose is to see the page. Unset VITE_DEV_AUTH to test denial
  // states instead — hasScreenAccess() returns false for any screenid this doesn't cover.
  screenAccess: new Proxy(
    {},
    { get: () => ({ read: true, write: true, delete: true }) },
  ) as CurrentUser["screenAccess"],
};

type AuthContextType = {
  currentUser: CurrentUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  authMode: AuthMode;
  login: (email?: string) => Promise<{ error: string | null } | void>;
  loginWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  verifyOtp: (
    email: string,
    token: string,
  ) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  hasRole: (roleName: string) => boolean;
  hasScreenAccess: (
    screenId: string,
    flag?: "read" | "write" | "delete",
  ) => boolean;
};

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Read at render time — appConfig is initialized before React mounts
  const authMode = (appConfig.config.app?.authMode ?? "entra") as AuthMode;

  useEffect(() => {
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_AUTH === "true") {
      console.warn(
        "[AuthContext] Dev auth bypass active — you are not really signed in.",
      );
      toast.warning("Dev auth bypass active — you are not really signed in.");
      setCurrentUser(DEV_USER);
      setLoading(false);
      return;
    }

    const loadUser = async () => {
      try {
        const {
          data: { user: verifiedUser },
          error,
        } = await supabase.auth.getUser();

        if (error || !verifiedUser) {
          setCurrentUser(null);
          return;
        }

        const result = await resolveCurrentUser(verifiedUser);

        if (result.success === false) {
          console.warn("[AuthContext] Login rejected:", result.reason);
          await supabase.auth.signOut();
          setCurrentUser(null);
          return;
        }

        setCurrentUser(result.user);
      } catch (err) {
        console.error("[AuthContext] Failed to load user:", err);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    // GUARDED, and that guard is load-bearing. This is the first thing in the provider to touch
    // `supabase`, and the client is built lazily on first property access — so this is where an
    // unbuildable client surfaces, an empty `supabasePublishableKey` in public/config/app.json
    // being the ordinary case. It used to sit unguarded in the effect body: loadUser() above has
    // its own try/catch, but a throw here escaped the effect and took the whole shell down with
    // it, which is why placeholder config made even the PUBLIC sample routes unreachable. The
    // same crash would hit a correctly-configured deployment on any transient failure to
    // construct the client, so this is not only about placeholders.
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      subscription = supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT" || !session) {
          setCurrentUser(null);
          setLoading(false);
          return;
        }

        if (
          event === "INITIAL_SESSION" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED"
        ) {
          loadUser();
        }
      }).data.subscription;
    } catch (err) {
      // Settle as signed-out rather than leaving `loading` true: ProtectedRoute renders
      // <LoadingScreen /> for the whole time it is, so hanging here shows a spinner forever
      // instead of a page. App.tsx explains the likely cause to the user; this just makes sure
      // the shell reaches a state.
      console.error(
        "[AuthContext] Supabase client unavailable — continuing signed out:",
        err,
      );
      setCurrentUser(null);
      setLoading(false);
    }

    return () => subscription?.unsubscribe();
  }, []);

  // Entra: triggers Azure OAuth redirect — returns void
  // OTP: sends 6-digit code — returns { error } so caller can handle failure
  const login = useCallback(
    async (email?: string): Promise<{ error: string | null } | void> => {
      const mode = appConfig.config.app?.authMode ?? "entra";

      if (mode === "otp") {
        if (!email) return { error: "Email is required" };

        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { shouldCreateUser: false },
        });

        if (error) {
          toast.error(error.message);
          return { error: error.message };
        }
        return { error: null };
      }

      // Entra — triggers redirect, never returns an error to the caller
      await supabase.auth.signInWithOAuth({
        provider: "azure",
        options: {
          scopes: AUTH.AZURE_SCOPES,
          redirectTo: AUTH.REDIRECT_URL,
        },
      });
    },
    [],
  );

  // Dev mode only — email + password login, no email required
  // onAuthStateChange fires SIGNED_IN → loadUser() handles the rest
  const loginWithPassword = useCallback(
    async (
      email: string,
      password: string,
    ): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

  // OTP mode only — verifies the 6-digit code from email
  // onAuthStateChange fires SIGNED_IN after success → loadUser() handles the rest
  const verifyOtp = useCallback(
    async (email: string, token: string): Promise<{ error: string | null }> => {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });
      if (error) return { error: error.message };
      return { error: null };
    },
    [],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  }, []);

  const hasRole = useCallback(
    (roleName: string) => currentUser?.roles.includes(roleName) ?? false,
    [currentUser],
  );

  const hasScreenAccess = useCallback(
    (screenId: string, flag: "read" | "write" | "delete" = "read") => {
      if (!currentUser?.screenAccess) return false;
      const access = currentUser.screenAccess[screenId];
      if (!access) return false;
      return access[flag];
    },
    [currentUser],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        loading,
        authMode,
        login,
        loginWithPassword,
        verifyOtp,
        logout,
        hasRole,
        hasScreenAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
