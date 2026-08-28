export type CurrentUser = {
  id: string;
  /** uuid — _secure.organizationuser.organizationuserid */
  organizationUserId: string;
  fullname: string;
  email: string;
  roles: string[];
  /** keyed by _arch.screen.screenid, a uuid */
  screenAccess: Record<
    string,
    { read: boolean; write: boolean; delete: boolean }
  >;
};

export type ScreenAccessMap = Record<
  string,
  { read: boolean; write: boolean; delete: boolean }
>;
