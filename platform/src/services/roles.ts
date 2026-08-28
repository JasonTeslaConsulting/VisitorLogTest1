import { supabase } from "@framework/integrations/supabase/client";

export const getRoles = async () => {
  const { data, error } = await supabase
    .schema("_secure")
    .from("role")
    .select(
      `
      roleid,
      rolename,
      rolecode,
      roledescription,
      systemroleflag,
      rolescreen (
        rolescreenid,
        screenid,
        readflag,
        writeflag,
        deleteflag
      )
    `,
    )
    .order("rolename", { ascending: true });

  if (error) throw error;
  return data;
};

// Audit columns (createdby/createddate/modifiedby/modifieddate) are deliberately not sent from
// here: _secure defaults them to public.current_orguser() / now(), which the client cannot spoof.
// Note a column DEFAULT does not fire on UPDATE — keeping modified* current on an update needs a
// BEFORE UPDATE trigger DB-side, not a value from the browser.
export const insertRole = async ({
  rolename,
  rolecode,
  roledescription,
}: {
  rolename: string;
  rolecode: string;
  roledescription: string;
}) => {
  const { data, error } = await supabase
    .schema("_secure")
    .from("role")
    .insert({
      rolename,
      rolecode,
      roledescription,
      systemroleflag: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// No `isenabled`: _secure.role dropped that column, so a role can no longer be disabled.
export const updateRole = async ({
  roleid,
  roledescription,
}: {
  roleid: string;
  roledescription: string;
}) => {
  const { error } = await supabase
    .schema("_secure")
    .from("role")
    .update({
      roledescription,
    })
    .eq("roleid", roleid);

  if (error) throw error;
};

export const deleteRole = async (roleid: string) => {
  const { error } = await supabase
    .schema("_secure")
    .from("role")
    .delete()
    .eq("roleid", roleid);

  if (error) throw error;
};

export const upsertRoleScreen = async ({
  roleid,
  screenid,
  readflag,
  writeflag,
  deleteflag,
  rolescreenid,
}: {
  roleid: string;
  /** uuid — _arch moved to uuid ids alongside _secure */
  screenid: string;
  readflag: boolean;
  writeflag: boolean;
  deleteflag: boolean;
  rolescreenid?: string;
}) => {
  if (rolescreenid) {
    const { error } = await supabase
      .schema("_secure")
      .from("rolescreen")
      .update({
        readflag,
        writeflag,
        deleteflag,
      })
      .eq("rolescreenid", rolescreenid);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .schema("_secure")
      .from("rolescreen")
      .insert({
        roleid,
        screenid,
        readflag,
        writeflag,
        deleteflag,
      });

    if (error) throw error;
  }
};

export const deleteRoleScreen = async (rolescreenid: string) => {
  const { error } = await supabase
    .schema("_secure")
    .from("rolescreen")
    .delete()
    .eq("rolescreenid", rolescreenid);

  if (error) throw error;
};
