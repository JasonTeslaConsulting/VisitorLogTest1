import { supabase } from "@framework/integrations/supabase/client";

export const getUsers = async () => {
  const { data, error } = await supabase
    .schema("_secure")
    .from("organizationuser")
    .select(
      `
      organizationuserid,
      fullname,
      displayname,
      primaryemail,
      employmentstartdate,
      employmentenddate,
      applicationuser (
        applicationuserid,
        authuserid,
        applicationuserrole (
          applicationuserroleid,
          roleid,
          role (
            roleid,
            rolename
          )
        )
      )
    `,
    )
    .order("fullname", { ascending: true });

  if (error) throw error;
  return data;
};

export const getRoles = async () => {
  const { data, error } = await supabase
    .schema("_secure")
    .from("role")
    .select("roleid, rolename")
    .order("rolename", { ascending: true });

  if (error) throw error;
  return data;
};

// Audit columns (createdby/createddate/modifiedby/modifieddate) are deliberately not sent from
// here: _secure defaults them to public.current_orguser() / now(), which the client cannot spoof.
// Note a column DEFAULT does not fire on UPDATE — keeping modified* current on an update needs a
// BEFORE UPDATE trigger DB-side, not a value from the browser.
export const addUser = async ({
  fullname,
  primaryemail,
  organizationid,
  employmentstartdate,
  authuserid,
}: {
  fullname: string;
  primaryemail: string;
  organizationid: string;
  /** required — _secure.organizationuser.employmentstartdate is NOT NULL, and it is the
   *  only date range resolveCurrentUser() still checks at login */
  employmentstartdate: string;
  authuserid: string;
}) => {
  // insert organizationuser first
  const { data: orgUser, error: orgError } = await supabase
    .schema("_secure")
    .from("organizationuser")
    .insert({
      fullname,
      primaryemail,
      organizationid,
      employmentstartdate,
    })
    .select()
    .single();

  if (orgError) throw orgError;

  // insert applicationuser linked to the new organizationuser
  const { data: appUser, error: appError } = await supabase
    .schema("_secure")
    .from("applicationuser")
    .insert({
      organizationuserid: orgUser.organizationuserid,
      authuserid,
    })
    .select()
    .single();

  if (appError) throw appError;

  return { orgUser, appUser };
};

export const addRoleToUser = async ({
  applicationuserid,
  roleid,
}: {
  applicationuserid: string;
  roleid: string;
}) => {
  const { data, error } = await supabase
    .schema("_secure")
    .from("applicationuserrole")
    .insert({
      applicationuserid,
      roleid,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeRoleFromUser = async (applicationuserroleid: string) => {
  const { error } = await supabase
    .schema("_secure")
    .from("applicationuserrole")
    .delete()
    .eq("applicationuserroleid", applicationuserroleid);

  if (error) throw error;
};
