export const STALE_TIMES = {
  STATIC: 5 * 60 * 1000,
  STANDARD: 2 * 60 * 1000,
  FREQUENT: 30 * 1000,
  REALTIME: 0,
} as const;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
} as const;

export const AUTH = {
  AZURE_SCOPES: "email",
  REDIRECT_URL: `${window.location.origin}/home`,
  REDIRECT_PATH: "/home",
  LOGIN_PATH: "/",
};
