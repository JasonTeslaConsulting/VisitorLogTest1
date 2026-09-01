---
app_name: Visitor Log
auth_method: password
viewport: desktop-first
multi_tenant: false
gates: required
owner_initials: jl
remote_configured: true
planned_on: 2026-09-01
unit_count: 8
---

## Overview

Visitor log for Tesla Consulting's office. A visitor registers themselves on arrival through a
public, unauthenticated form — no navbar, kiosk/QR-friendly — recording who they are, when they
arrived, their purpose, their host, and any equipment they brought in. Three authenticated pages
sit behind that: staff see the visits they host, the office manager sees every visit and checks
people out, and a user admin manages accounts and role assignments.

The database schema already exists (`_visitor.visitorregister`, `_visitor.visitorequipment`) with
RLS helper functions (`is_current_host`, `is_visitor_admin`, `can_access_visitorregister`) that map
directly onto the staff/office-manager split — this app is built against a live schema, not a
greenfield data model. See `docs/plan/db-setup.md` for the prerequisite SQL (exposing `_visitor`,
grants, RPCs, seed rows) that must run before any unit touching it can return data.

## Entities

| Entity | Key fields | Relationships |
| --- | --- | --- |
| `visitorregister` | fullname, organization, email, mobilenumber, entrydate, exitdate, hostid, visitpurposeid, isprivacypolicyread, isconsentvideorecord | belongs to a host (`_secure.organizationuser`), has many `visitorequipment` |
| `visitorequipment` | itemtypeid, itemdescription, quantity, serialnumber | belongs to one `visitorregister` |
| `organizationuser` / `applicationuser` (existing, `_secure`) | fullname, primaryemail, employmentstartdate/enddate | one org user has zero-or-one application user; deactivation = setting `employmentenddate` |
| `role` / `applicationuserrole` (existing, `_secure`) | rolename, rolecode | many-to-many between application users and roles |

## Roles

| Role | Grants |
| --- | --- |
| `Staff` | Sign in, see and check out only the visits where they are the host |
| `Office Manager` | Everything Staff can do, plus every visit regardless of host, plus the on-site-today view |
| `User Admin` | Add users, edit role assignments, deactivate users, edit role→screen permissions |

## Permission matrix

| Entity / action | Staff | Office Manager | User Admin |
| --- | --- | --- | --- |
| Visitor registration (public) | — (public, no auth) | — | — |
| Own hosted visits — read | ✅ | ✅ | — |
| Own hosted visits — check out | ✅ | ✅ | — |
| All visits — read | — | ✅ | — |
| All visits — check out | — | ✅ | — |
| On-site-today dashboard | — | ✅ | — |
| Users — read/add/edit roles/deactivate | — | — | ✅ |
| Role→screen permissions — read/write | — | — | ✅ |

## Navigation map

```
/register                 public, no navbar (kiosk/QR entry point)
/visits                   Staff        "My Visits"
/visits/manager           Office Mgr   "All Visits"
/visits/today             Office Mgr   "On Site Today"
/admin/users              User Admin   "Users"
/admin/roles              User Admin   "Roles & Permissions"
```

Nav is DB-driven (`_arch.menu` → `_arch.screen` → `_arch.module`, matched on `screen.urladdress`),
so each row above also needs `_arch` module/screen/menu rows and a matching `_secure.rolescreen`
grant — see `docs/plan/db-setup.md`.

## Page inventory

| Page | Route | Access | Unit |
| --- | --- | --- | --- |
| Public visitor registration | `/register` | public | U002 |
| My visits | `/visits` | `Staff` | U003 |
| All visits | `/visits/manager` | `Office Manager` | U004 |
| On site today | `/visits/today` | `Office Manager` | U005 |
| User management | `/admin/users` | `User Admin` | U007 |
| Roles & permissions | `/admin/roles` | `User Admin` | U008 |

## Out of scope

- Visitor self-checkout (only a host or office manager logs an exit)
- Email/Teams notification to the host on arrival
- Badge or pass printing
- A linkable `/visits/:id` detail route (equipment shows via an expandable table row instead)
- Editing policy/consent text from inside the app (lives in `_sysconfig.configurationsetting`,
  edited via the Supabase dashboard)
- Visitor photo capture
- Multi-site / multi-tenant

## Assumptions

`visitorregister`'s generated `Relationships` array is empty, so these foreign keys are inferred
from column naming and from the RLS helper function signatures, not from a declared constraint —
confirmed in `docs/plan/db-setup.md` before U001 builds:

- `visitorregister.hostid` → `_secure.organizationuser.organizationuserid` (supported by
  `is_current_host(target_hostid)`)
- `visitorregister.visitpurposeid` and `visitorequipment.itemtypeid` → `_common.referencedata`
- `visitorregister.mobilenumbercountrydialid` → `_common.countrydialcode.countrydialid`

Neither `gh` nor `tea` is installed, so `.claude/skills/build-app/SKILL.md` will push `unit/*`
branches but cannot open pull requests — each unit is merged to `main` by hand after review.
