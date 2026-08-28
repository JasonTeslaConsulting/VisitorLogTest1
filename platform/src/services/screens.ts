import { supabase } from "@framework/integrations/supabase/client";

export const getScreens = async () => {
  const { data, error } = await supabase
    .schema("_arch")
    .from("screen")
    .select("screenid, screenname, screentitle, sortorder")
    .order("sortorder", { ascending: true });

  if (error) throw error;
  return data;
};
