export type PortalUserRole = {
  applicationUserRoleId: string;
  roleId: string;
  roleName: string;
};

export type PortalUser = {
  organizationUserId: string;
  fullName: string;
  displayName: string | null;
  primaryEmail: string;
  employmentStartDate: string;
  employmentEndDate: string | null;
  /** null until a Supabase auth account exists — created out-of-band, not by this app. */
  applicationUserId: string | null;
  authUserId: string | null;
  roles: PortalUserRole[];
};

export type AssignableRole = {
  roleId: string;
  roleName: string;
};

export type AddPortalUserPayload = {
  fullName: string;
  primaryEmail: string;
  /** _secure.organizationuser.employmentstartdate is NOT NULL. */
  employmentStartDate: string;
  /** Optional — a Supabase auth account may not exist yet at creation time. */
  authUserId?: string;
};
