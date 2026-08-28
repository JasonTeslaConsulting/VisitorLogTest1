import { useEffect } from "react";
import { toast } from "@framework/components/ui/toast";
import { Toaster } from "@framework/components/ui/sonner";
import { TooltipProvider } from "@framework/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@framework/contexts/AuthContext";
import { AppRouter } from "@framework/routes/AppRouter";
import { ThemeProvider } from "@framework/contexts/ThemeContext";
import { appConfig } from "@framework/app/appConfig";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // ← disable retries
    },
  },
});

// Module scope, not state or sessionStorage, so the notice appears ONCE PER PAGE LOAD.
// - Not per mount: StrictMode double-invokes effects in dev, and two identical toasts about a
//   static config file is just noise.
// - Not sessionStorage: a hard refresh should say it again. Suppressing it for the rest of the
//   tab's life would hide the one signal a developer has, and in a genuinely misconfigured
//   deployment the first visitor is not the only person who needs to know.
let configNoticeShown = false;

// Why a notice and not a thrown error or a fallback mode: with placeholder credentials the app is
// in a state that is *correct* for a fresh clone and *wrong* for a deployment, and only a human
// can tell which. So the framework neither crashes (see AuthContext's guarded subscription) nor
// invents a backend-free code path — it boots, degrades to signed-out, and says why. Static and
// sample pages are then browsable, which is what makes the template usable before anyone has a
// database, including while developing the framework itself.
const SupabaseConfigNotice = () => {
  useEffect(() => {
    if (configNoticeShown || appConfig.isSupabaseConfigured) return;
    configNoticeShown = true;
    toast.warning("Supabase is not configured", {
      description:
        "Set supabaseUrl and supabasePublishableKey in public/config/app.json. Static and sample pages work; signing in and anything that reads data will not.",
      duration: Infinity,
      closeButton: true,
    });
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <SupabaseConfigNotice />
          <AppRouter />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
