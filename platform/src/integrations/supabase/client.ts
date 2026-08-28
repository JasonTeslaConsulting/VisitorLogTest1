import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { appConfig } from "@framework/app/appConfig";

// NOTE ON THE ONE INVERTED DEPENDENCY
//
// This is framework code importing an *app-owned* file via the `@/` alias, not `@framework/` —
// `@/integrations/supabase/types` is generated per portal by `npm run gen-supabase-types` and
// stays at its original app path; only `client.ts` itself moved under `platform/`. That direction
// is normally forbidden (platform/framework.json), and it is allowed here as a declared contract
// — see `appContracts` in that manifest, which `npm run framework:verify` enforces.
//
// Why it is the right shape rather than a leak: the generator emits ONE `Database` type covering the
// framework's schemas (`_arch`, `_secure`) and the app's (`public`) together, and this module
// exports a SINGLE `supabase` proxy typed by it. Whichever `Database` parameterises the client is
// what every consumer sees — so if the framework hand-declared its own for `_arch`/`_secure`, it
// would strip the app's tables from the shared client and break every app service. A generated
// description of a schema both sides share belongs to both sides.
//
// What this costs: a portal must keep `_arch` and `_secure` in its `--schema` list when
// regenerating. `framework:verify` asserts exactly that, so dropping one fails loudly here instead
// of as a runtime error later.

let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const config = appConfig.config;
    const supabaseUrl = config.supabase.supabaseUrl;
    const supabasePublishableKey = config.supabase.supabasePublishableKey;

    if (!supabaseUrl || !supabasePublishableKey) {
      throw new Error(
        "Error getting Supabase client. Supabase configuration not loaded.",
      );
    }

    supabaseInstance = createClient<Database>(
      supabaseUrl,
      supabasePublishableKey,
    );
  }

  return supabaseInstance;
};

// do this to ensure appConfig is loaded first
export const supabase = new Proxy(
  {},
  {
    get: (target, prop) => {
      return Reflect.get(getSupabaseClient(), prop as string | symbol);
    },
  },
) as ReturnType<typeof createClient<Database>>;
