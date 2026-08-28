import { supabase } from "@framework/integrations/supabase/client";
import { CurrentUser } from "@framework/types/auth";

export const getUserProfile = async (email: string) => {
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
        applicationuserrole (
          applicationuserroleid,
          role (
            roleid,
            rolename,
            rolescreen (
              screenid,
              readflag,
              writeflag,
              deleteflag
            )
          )
        )
      )
    `,
    )
    .eq("primaryemail", email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

// *** put in utils
const isWithinDateRange = (
  startDate: string | null,
  endDate: string | null,
): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    if (today < start) return false;
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    if (today > end) return false;
  }

  return true;
};

type LoadUserResult =
  | { success: true; user?: CurrentUser }
  | {
      success: false;
      reason: "not_found" | "employment_inactive";
    };

type UserProfile = NonNullable<Awaited<ReturnType<typeof getUserProfile>>>;
// applicationuser is a to-ONE embed now (fk_applicationuser_organizationuser is unique), so it
// resolves to a single object rather than an array.
type RoleAssignment = NonNullable<
  NonNullable<UserProfile["applicationuser"]>["applicationuserrole"]
>[number];
type RoleScreenRow = NonNullable<
  NonNullable<RoleAssignment["role"]>["rolescreen"]
>[number];

export const resolveCurrentUser = async (authUser: {
  id: string;
  email?: string;
}): Promise<LoadUserResult> => {
  // The profile lookup is keyed on primaryemail, so no email means no possible match. Bail here
  // rather than querying with undefined, which matches nothing and reports "not_found" —
  // indistinguishable from a genuinely absent profile.
  if (!authUser.email) {
    return { success: false, reason: "not_found" };
  }

  const profile = await getUserProfile(authUser.email);

  if (!profile) {
    return { success: false, reason: "not_found" };
  }

  if (
    !isWithinDateRange(profile.employmentstartdate, profile.employmentenddate)
  ) {
    return { success: false, reason: "employment_inactive" };
  }

  const appUser = profile.applicationuser;

  // Every assignment counts, and there is nothing left to filter on. `_secure` dropped
  // applicationuser.access{start,end}date and applicationuserrole.{start,end}date (hence no
  // "access_inactive" reason), and `role` dropped `isenabled` — so a role can no longer be
  // disabled, and the employment window on organizationuser above is the only gate of any kind.
  const roleAssignments = appUser?.applicationuserrole ?? [];

  const roles = roleAssignments
    .map((aur: RoleAssignment) => aur.role?.rolename)
    .filter(Boolean) as string[];

  // Keyed by screenid, which is a uuid — _arch moved to uuid ids alongside _secure.
  type ScreenAccessMap = Record<
    string,
    { read: boolean; write: boolean; delete: boolean }
  >;
  const screenAccess: ScreenAccessMap = {};

  roleAssignments.forEach((aur: RoleAssignment) => {
    aur.role?.rolescreen?.forEach((rs: RoleScreenRow) => {
      if (!screenAccess[rs.screenid]) {
        screenAccess[rs.screenid] = {
          read: false,
          write: false,
          delete: false,
        };
      }
      if (rs.readflag) screenAccess[rs.screenid].read = true;
      if (rs.writeflag) screenAccess[rs.screenid].write = true;
      if (rs.deleteflag) screenAccess[rs.screenid].delete = true;
    });
  });

  return {
    success: true,
    user: {
      id: authUser.id,
      organizationUserId: profile.organizationuserid,
      fullname: profile.fullname ?? "",
      email: profile.primaryemail ?? "",
      roles,
      screenAccess,
    },
  };
};
