export type RoleScreen = {
  rolescreenid: string;
  /** uuid — _arch.screen.screenid */
  screenid: string;
  readflag: boolean;
  writeflag: boolean;
  deleteflag: boolean;
};

export type Screen = {
  /** uuid — _arch.screen.screenid */
  screenid: string;
  screenname: string;
  screentitle: string;
  sortorder: number;
};

export type PermissionDraft = {
  readflag: boolean;
  writeflag: boolean;
  deleteflag: boolean;
  rolescreenid?: string;
};

export type Role = {
  roleid: string;
  rolename: string;
  /** required, and unique per role — _secure.role dropped roleuniqueid in its favour */
  rolecode: string;
  roledescription: string;
  systemroleflag: boolean;
  rolescreen: RoleScreen[];
};
