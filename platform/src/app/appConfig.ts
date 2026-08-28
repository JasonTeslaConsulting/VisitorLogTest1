// Load config from public/config/app.json into appConfig object

const __configuration = {
  supabase: {
    supabaseUrl: "",
    supabasePublishableKey: "",
  },
  app: {
    authMode: "entra", // "entra" | "otp" | "password"
    paginationOptions: [10, 25, 50, 100, 200],
    companyName: "",
    portalName: "",
    // Navbar's leading home icon — a MENU_ICON_MAP key (see MenuIcon.tsx), not a
    // Phosphor component name. An unmapped value renders the PiCircle fallback and
    // warns in dev; `npm run docs:check` reports it too.
    homeIcon: "Home",
    enableSample: false,
  },
};

const __appConfig = {
  // Load App Configuration
  initialize: async function () {
    const filePath = "/config/app.json";
    const url =
      window.location.protocol +
      "//" +
      window.location.host +
      (filePath[0].startsWith("/") ? filePath : `/${filePath}`);
    const result = await fetch(`${url}?t=${Date.now()}`);
    if (!result.ok) {
      console.error(`Cannot load configuration file at ${url}`);
      return {
        success: false,
        errorMessage: "Cannot load configuration (#ER0001)",
      };
    }
    //
    try {
      const item = await result.json();
      // Logger.debug(`Downloaded json file ${filePath} in ${Date.now() - startTs}ms`, item)

      for (const prop1 in item) {
        const source1 = item[prop1];
        if (Array.isArray(source1)) {
          __configuration[prop1] = source1;
        } else if (typeof source1 === "object") {
          for (const prop2 in source1) {
            const value2 = source1[prop2];
            if (typeof value2 === "object") {
              for (const prop3 in value2) {
                const value3 = value2[prop3];
                __configuration[prop1][prop2][prop3] = value3;
              }
            } else {
              __configuration[prop1][prop2] = value2;
            }
          }
        } else {
          __configuration[prop1] = source1;
        }
      }

      // console.log("Loaded config", __configuration)

      return { success: true };
    } catch (e) {
      console.error("Cannot parse config json data", e);
      return { success: false, errorMessage: "Cannot parse config json data" };
    }
  },
  //
  get config() {
    return __configuration;
  },
  // Whether app.json actually carries THIS portal's Supabase project, rather than the template's
  // placeholders. Both markers are exact, not heuristic: `app:init` writes the key as "" unless
  // --supabase-key was passed, and the URL keeps its [SUPABASE-PROJECT-ID] token until a human
  // fills it in (see docs/COMMANDS.md § "Supabase credentials").
  //
  // Nothing branches its behaviour on this — the framework does not have a second, backend-free
  // code path, deliberately. It exists so the app can EXPLAIN the situation instead of failing
  // mutely: without a client, `supabase.auth.*` throws, every service rejects, and a developer
  // browsing the sample gallery has no way to tell a config gap from a broken build. See App.tsx.
  get isSupabaseConfigured() {
    const { supabaseUrl, supabasePublishableKey } = __configuration.supabase;
    return Boolean(
      supabaseUrl &&
      supabasePublishableKey &&
      !supabaseUrl.includes("[SUPABASE-PROJECT-ID]"),
    );
  },
};

export const appConfig = __appConfig;
