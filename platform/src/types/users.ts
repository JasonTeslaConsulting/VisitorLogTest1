import type { Role } from "./roles";

export type ApplicationUserRole = {
  applicationuserroleid: string;
  roleid: string;
  role: Role;
};

export type ApplicationUser = {
  applicationuserid: string;
  /** uuid of the Supabase auth account — _secure.applicationuser.authuserid */
  authuserid: string;
  applicationuserrole: ApplicationUserRole[];
};

export type OrgUser = {
  organizationuserid: string;
  fullname: string;
  displayname: string;
  primaryemail: string;
  employmentstartdate: string;
  employmentenddate: string | null;
  /** to-ONE: fk_applicationuser_organizationuser is unique, so this is an object, not a list */
  applicationuser: ApplicationUser | null;
};
