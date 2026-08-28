// Framework-owned. Describes the `_arch` role-screen permission model (readflag/writeflag/
// deleteflag on `_arch.rolescreen`), not any one portal's policy — which is why it lives here
// and `ROLES` lives in the app-owned `./roles.ts`. See docs/architecture/user-administration.md.
export const PERMISSION_OPTIONS = [
  { value: "no-access", label: "No Access" },
  { value: "read-only", label: "Read Only" },
  { value: "read-write-delete", label: "Read, Write & Delete" },
] as const;
