export type NavScreen = {
  /** uuid — _arch.screen.screenid */
  screenid: string;
  screenname: string;
  screentitle: string;
  urladdress: string;
  menuicon: string | null;
  menuorder: number | null;
};

export type NavModule = {
  /** uuid — _arch.module.moduleid */
  moduleid: string;
  modulename: string;
  sortorder: number | null;
  screens: NavScreen[];
};
