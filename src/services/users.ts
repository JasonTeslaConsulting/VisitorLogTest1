import { supabase } from "@framework/integrations/supabase/client";
import {
  addRoleToUser,
  getRoles,
  getUsers,
  removeRoleFromUser,
} from "@framework/services/users";
import type {
  AddPortalUserPayload,
  AssignableRole,
  PortalUser,
  PortalUserRole,
} from "@/types/users";

type RawRole = { roleid: string; rolename: string };

type RawApplicationUserRole = {
  applicationuserroleid: string;
  roleid: string;
  role: RawRole;
};

type RawApplicationUser = {
  applicationuserid: string;
  authuserid: string | null;
  applicationuserrole: RawApplicationUserRole[];
} | null;

type RawOrganizationUser = {
  organizationuserid: string;
  fullname: string;
  displayname: string | null;
  primaryemail: string;
  employmentstartdate: string;
  employmentenddate: string | null;
  applicationuser: RawApplicationUser;
};

function mapPortalUserRole(raw: RawApplicationUserRole): PortalUserRole {
  return {
    applicationUserRoleId: raw.applicationuserroleid,
    roleId: raw.roleid,
    roleName: raw.role.rolename,
  };
}

function mapPortalUser(raw: RawOrganizationUser): PortalUser {
  const appUser = raw.applicationuser;

  return {
    organizationUserId: raw.organizationuserid,
    fullName: raw.fullname,
    displayName: raw.displayname,
    primaryEmail: raw.primaryemail,
    employmentStartDate: raw.employmentstartdate,
    employmentEndDate: raw.employmentenddate,
    applicationUserId: appUser?.applicationuserid ?? null,
    authUserId: appUser?.authuserid ?? null,
    roles: appUser?.applicationuserrole.map(mapPortalUserRole) ?? [],
  };
}

function mapAssignableRole(raw: RawRole): AssignableRole {
  return { roleId: raw.roleid, roleName: raw.rolename };
}

export async function listUsers(): Promise<PortalUser[]> {
  const data = await getUsers();
  return (data as unknown as RawOrganizationUser[]).map(mapPortalUser);
}

export async function listAssignableRoles(): Promise<AssignableRole[]> {
  const data = await getRoles();
  return (data as RawRole[]).map(mapAssignableRole);
}

// Does not call the framework's `addUser` — that helper types `authuserid` as required, but
// this app made `_secure.applicationuser.authuserid` nullable (auth accounts are created
// out-of-band). Replicates its two-step organizationuser -> applicationuser insert here instead,
// per docs/plan/units/006-users-domain-foundation.md. Audit columns are left to the `_secure`
// defaults, same as the framework's own addUser.
export async function addPortalUser(
  payload: AddPortalUserPayload,
): Promise<{ organizationUserId: string; applicationUserId: string }> {
  const { data: organization, error: organizationError } = await supabase
    .schema("_secure")
    .from("organization")
    .select("organizationid")
    .limit(1)
    .single();

  if (organizationError) throw new Error(organizationError.message);

  const { data: orgUser, error: orgUserError } = await supabase
    .schema("_secure")
    .from("organizationuser")
    .insert({
      fullname: payload.fullName,
      primaryemail: payload.primaryEmail,
      organizationid: organization.organizationid,
      employmentstartdate: payload.employmentStartDate,
    })
    .select("organizationuserid")
    .single();

  if (orgUserError) throw new Error(orgUserError.message);

  const { data: appUser, error: appUserError } = await supabase
    .schema("_secure")
    .from("applicationuser")
    .insert({
      organizationuserid: orgUser.organizationuserid,
      authuserid: payload.authUserId ?? null,
    })
    .select("applicationuserid")
    .single();

  if (appUserError) throw new Error(appUserError.message);

  return {
    organizationUserId: orgUser.organizationuserid,
    applicationUserId: appUser.applicationuserid,
  };
}

// Only gate `resolveCurrentUser()` checks (docs/architecture/auth.md) — sufficient on its own to
// lock the user out on their next request. Does not touch `applicationuserrole` rows: they're left
// in place so a future "reactivate" wouldn't need to reassign everything from scratch.
export async function deactivateUser(
  organizationUserId: string,
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  const { error } = await supabase
    .schema("_secure")
    .from("organizationuser")
    .update({ employmentenddate: today })
    .eq("organizationuserid", organizationUserId);

  if (error) throw new Error(error.message);
}

export async function assignRole({
  applicationUserId,
  roleId,
}: {
  applicationUserId: string;
  roleId: string;
}): Promise<void> {
  await addRoleToUser({ applicationuserid: applicationUserId, roleid: roleId });
}

export async function unassignRole(
  applicationUserRoleId: string,
): Promise<void> {
  await removeRoleFromUser(applicationUserRoleId);
}
