# Visitor Log — database prerequisites

This is the **one prerequisites doc** the app-plan interview asked for: every piece of database
setup the eight units in `docs/plan/units/` depend on, in the order it needs to run. Nothing here
is applied automatically — this repo never applies migrations for you
(`docs/architecture/user-administration.md` § Known gap makes the same point about `_arch`/
`_secure`/`_common`). Run each section's SQL in the Supabase SQL editor for this project
(`hauccbcyondtbmzscuiw`) before the unit that needs it builds.

**Critical path:** nothing in Section 1 exists yet, and nothing built against `_visitor` can even
return a row until it's done — run Section 1 through 3 before U001, and Section 8 before U002's
form actually works end to end (U001 itself builds fine without it — see its own Deviations).

Column names throughout are taken from the already-generated `src/integrations/supabase/types.ts`
— this schema exists; nothing here is `CREATE TABLE`.

**Append-only, oldest to newest:** sections are numbered in the order they were written, never
renumbered or edited in place once run. New SQL discovered while building a later unit always
becomes a **new section appended after the last one**, even if it logically belongs earlier (e.g.
another RPC) — never spliced into an existing section. This means the newest thing to run is always
the highest-numbered section at the bottom, and if you've already run everything through section
`N`, you only need to check for sections above `N`, not re-read the whole file for changes.

---

## 1. Expose the `_visitor` schema

Not SQL — a dashboard setting. PostgREST currently reports:

> Only the following schemas are exposed: public, graphql_public, _arch, _common, _secure

In the Supabase dashboard: **Settings → API → Exposed schemas**, add `_visitor` to the list, save,
and wait for PostgREST to reload (usually automatic within a few seconds; a manual "restart" is in
the same settings page if it doesn't).

## 2. Grants and RLS policies on `_visitor`

The three RLS helper functions already exist in this schema
(`_visitor.is_current_host`, `_visitor.is_visitor_admin`, `_visitor.can_access_visitorregister`) —
this section only adds grants and policies that call them; it does not redefine them.

```sql
-- Schema usage
grant usage on schema _visitor to anon, authenticated;

-- anon: insert-only, for the public registration form (U002)
grant insert on _visitor.visitorregister to anon;
grant insert on _visitor.visitorequipment to anon;

-- authenticated: read + update (check-out), row-scoped by RLS below
grant select, update on _visitor.visitorregister to authenticated;
grant select, insert, update on _visitor.visitorequipment to authenticated;

alter table _visitor.visitorregister enable row level security;
alter table _visitor.visitorequipment enable row level security;

-- Public insert: RLS still applies to anon inserts, so an explicit permissive policy is required
-- even though the table has no anon SELECT policy at all (an insert-only actor never needs one).
create policy visitorregister_public_insert
  on _visitor.visitorregister for insert
  to anon
  with check (true);

create policy visitorequipment_public_insert
  on _visitor.visitorequipment for insert
  to anon
  with check (true);

-- Staff read/update their own hosted visits; office managers read/update every visit.
create policy visitorregister_read
  on _visitor.visitorregister for select
  to authenticated
  using (_visitor.is_current_host(hostid) or _visitor.is_visitor_admin());

create policy visitorregister_checkout
  on _visitor.visitorregister for update
  to authenticated
  using (_visitor.is_current_host(hostid) or _visitor.is_visitor_admin())
  with check (_visitor.is_current_host(hostid) or _visitor.is_visitor_admin());

-- Equipment inherits its parent visit's access via can_access_visitorregister().
create policy visitorequipment_read
  on _visitor.visitorequipment for select
  to authenticated
  using (_visitor.can_access_visitorregister(visitorregisterid));
```

`created_by`/`modifiedby` on both tables default to the DB (see `docs/architecture/auth.md` §
"Audit columns are written by the database") — for the anon insert path specifically, confirm what
`createdby`/`modifiedby` default to when there is no `auth.uid()` (anon has none). If those columns
default to `public.current_orguser()` the same way `_secure` does, that function needs a
null-safe fallback for an anonymous request, or the insert must supply a literal instead of relying
on the default — check this before U002 builds and adjust the policy/default rather than the
client.

## 3. Public lookup RPCs

Anon has no grant on `_secure` or `_common` (confirmed: `permission denied for schema`), so the
form calls two `SECURITY DEFINER` functions in `public` instead of querying the staff directory
directly — this is what keeps `_secure.organizationuser`'s emails and phone numbers private from
an anonymous visitor.

```sql
create or replace function public.list_visit_hosts()
returns table (organizationuserid uuid, fullname text)
language sql
security definer
set search_path = public
as $$
  select organizationuserid, fullname
  from _secure.organizationuser
  where employmentenddate is null or employmentenddate >= current_date
  order by fullname;
$$;

grant execute on function public.list_visit_hosts() to anon, authenticated;

create or replace function public.list_visit_purposes()
returns table (referencedataid uuid, referencedataname text)
language sql
security definer
set search_path = public
as $$
  select rd.referencedataid, rd.referencedataname
  from _common.referencedata rd
  join _common.referencedatatype rdt
    on rdt.referencedatatypeid = rd.referencedatatypeid
  where rdt.referencedatatypename = 'VisitPurpose'
    and rd.active
  order by rd.sortorder;
$$;

grant execute on function public.list_visit_purposes() to anon, authenticated;
```

A third lookup — equipment item types — is read the same way, reusing `list_visit_purposes`'s
shape with a different `referencedatatypename`:

```sql
create or replace function public.list_equipment_item_types()
returns table (referencedataid uuid, referencedataname text)
language sql
security definer
set search_path = public
as $$
  select rd.referencedataid, rd.referencedataname
  from _common.referencedata rd
  join _common.referencedatatype rdt
    on rdt.referencedatatypeid = rd.referencedatatypeid
  where rdt.referencedatatypename = 'EquipmentItemType'
    and rd.active
  order by rd.sortorder;
$$;

grant execute on function public.list_equipment_item_types() to anon, authenticated;
```

## 4. Reference data — visit purposes and equipment item types

```sql
insert into _common.referencedatatype (referencedatatypename)
values ('VisitPurpose'), ('EquipmentItemType')
on conflict do nothing;

insert into _common.referencedata (referencedatatypeid, referencedataname, referencedatavalue, sortorder)
select referencedatatypeid, v.name, v.name, v.sortorder
from _common.referencedatatype, (values
  ('Meeting', 1),
  ('Interview', 2),
  ('Delivery', 3),
  ('Contractor / Maintenance', 4),
  ('Other', 5)
) as v(name, sortorder)
where referencedatatypename = 'VisitPurpose';

insert into _common.referencedata (referencedatatypeid, referencedataname, referencedatavalue, sortorder)
select referencedatatypeid, v.name, v.name, v.sortorder
from _common.referencedatatype, (values
  ('Laptop', 1),
  ('Phone / Tablet', 2),
  ('Camera / Recording equipment', 3),
  ('Tools', 4),
  ('Other', 5)
) as v(name, sortorder)
where referencedatatypename = 'EquipmentItemType';
```

Adjust the option lists to match what reception actually wants before running this — these are
placeholders, not requirements gathered from the user.

Note: these two inserts still rely on `createdby`/`modifiedby`'s DB default rather than naming
`'setup'` explicitly, unlike every insert from Section 5 onward — see that section's note on why.
Add the same two columns here too if this hits the same failure when run outside PostgREST.

## 5. Policy and consent text

```sql
insert into _sysconfig.configurationgroup (configurationgroupname, createdby, modifiedby)
values ('VisitorLog', 'setup', 'setup')
on conflict do nothing;

insert into _sysconfig.configurationsetting
  (configurationgroupid, configurationsettingname, configurationsettingdescription,
   attributedatatypeid, configurationsettingvaluetext, createdby, modifiedby)
select
  cg.configurationgroupid,
  v.name,
  v.description,
  (select attributedatatypeid from _common.attributedatatype where attributedatatypename = 'varchar' limit 1),
  v.value,
  'setup',
  'setup'
from _sysconfig.configurationgroup cg, (values
  ('PrivacyPolicyText', 'Privacy policy shown on the visitor registration form',
    'Replace with the real privacy policy text.'),
  ('VideoConsentText', 'Video/CCTV consent text shown on the visitor registration form',
    'Replace with the real video consent text.')
) as v(name, description, value)
where cg.configurationgroupname = 'VisitorLog';
```

`createdby`/`modifiedby` are set to the literal `'setup'` here instead of left to their DB default.
`docs/architecture/auth.md` notes those columns default to `public.current_orguser()` — which
resolves from an authenticated Supabase session (`auth.uid()`/RLS context) and has nothing to
resolve when this SQL runs directly against Postgres (DBeaver, `psql`, the Supabase SQL editor's
service-role connection) rather than through PostgREST. Every insert from here on names them
explicitly for the same reason.

`attributedatatypename = 'varchar'` is confirmed against the real `_common.attributedatatype` rows
— its values are literal type strings (`varchar`, `boolean`, `integer`, `date`, `datetime`, `time`,
`money`, `numeric(25,N)` at several scales), not a generic `'Text'` label. `varchar` is the row that
pairs with `configurationsettingvaluetext`.

`getPolicyText()` (U001) reads these two settings by name and the app snapshots the returned text
into `visitorregister.privacypolicycontent`/`consentvideocontent` on submit — this is the source of
truth the interview asked for ("`_sysconfig.configurationsetting` yea").

## 6. Roles

```sql
insert into _secure.role (rolecode, rolename, createdby, modifiedby)
values
  ('STAFF', 'Staff', 'setup', 'setup'),
  ('OFFICE_MANAGER', 'Office Manager', 'setup', 'setup'),
  ('USER_ADMIN', 'User Admin', 'setup', 'setup')
on conflict (rolecode) do nothing;
```

`src/lib/constants/roles.ts` (U001) must use these exact `rolename` values — `resolveCurrentUser()`
builds `roles[]` from `role.rolename`, not `rolecode`.

Grant yourself (or whoever tests the build) at least one role before U003 onward, or every guarded
route bounces at `ProtectedRoute`:

```sql
insert into _secure.applicationuserrole (applicationuserid, roleid, createdby, modifiedby)
select au.applicationuserid, r.roleid, 'setup', 'setup'
from _secure.applicationuser au
join _secure.organizationuser ou on ou.organizationuserid = au.organizationuserid
join _secure.role r on r.rolename = 'Office Manager'
where ou.primaryemail = '<your-email-here>';
```

## 7. Navigation — `_arch` module/screen/menu + `_secure.rolescreen`

One module (`Visitor Log`) holding the visitor-facing screens, one (`Administration`) holding the
admin screens — or reuse an existing module if one already fits; check `_arch.module` first.

```sql
insert into _arch.module (modulename, sortorder, createdby, modifiedby)
values ('Visitor Log', 10, 'setup', 'setup'), ('Administration', 20, 'setup', 'setup')
on conflict do nothing;

-- Screens — urladdress must match each unit's `route:` frontmatter exactly.
insert into _arch.screen (moduleid, screenname, screentitle, urladdress, sortorder, createdby, modifiedby)
select m.moduleid, v.name, v.title, v.url, v.sortorder, 'setup', 'setup'
from _arch.module m, (values
  ('Visitor Log', 'MyVisits',    'My Visits',           '/visits',         1),
  ('Visitor Log', 'AllVisits',   'All Visits',          '/visits/manager', 2),
  ('Visitor Log', 'OnSiteToday', 'On Site Today',       '/visits/today',   3),
  ('Administration', 'Users',    'Users',               '/admin/users',    1),
  ('Administration', 'Roles',    'Roles & Permissions', '/admin/roles',    2)
) as v(module, name, title, url, sortorder)
where m.modulename = v.module;

-- Menu entries — one per screen, menuicon values are MENU_ICON_MAP keys
-- (platform/src/app/layout/MenuIcon.tsx), e.g. "Home", not "PiHouse".
insert into _arch.menu (screenid, menuname, menudescription, menuicon, menuorder, createdby, modifiedby)
select s.screenid, s.screentitle, s.screentitle, v.icon, s.sortorder, 'setup', 'setup'
from _arch.screen s, (values
  ('/visits', 'ClipboardCheck'),
  ('/visits/manager', 'ClipboardList'),
  ('/visits/today', 'Calendar'),
  ('/admin/users', 'Users'),
  ('/admin/roles', 'Shield')
) as v(url, icon)
where s.urladdress = v.url;

-- Screen access — Staff sees only "My Visits"; Office Manager sees the other two visitor
-- screens; User Admin sees both admin screens. readflag only — none of these five pages has a
-- write/delete distinction at the screen level (mutations are row actions, gated by RLS).
insert into _secure.rolescreen (roleid, screenid, readflag, writeflag, deleteflag, createdby, modifiedby)
select r.roleid, s.screenid, true, v.write, v.write, 'setup', 'setup'
from _secure.role r, _arch.screen s, (values
  ('Staff', '/visits', false),
  ('Office Manager', '/visits/manager', true),
  ('Office Manager', '/visits/today', false),
  ('User Admin', '/admin/users', true),
  ('User Admin', '/admin/roles', true)
) as v(role, url, write)
where r.rolename = v.role
  and s.urladdress = v.url;
```

`useNavMenu()` renders whatever `_arch.menu`/`screen`/`module` rows exist regardless of role — the
navbar itself doesn't filter by `rolescreen` (confirm this against
`platform/src/hooks/menu/useNavMenu.ts` before relying on it; if it does filter, the query above is
still correct, just redundant with that filter rather than the only gate). The route-level
`required_role` guard (`ProtectedRoute`) is what actually blocks a Staff user from loading
`/visits/manager` even if they somehow saw a link to it.

---

## 8. Additional RPCs — added after the initial setup pass

Sections 1–7 above are the original setup pass. Everything below is new SQL discovered as later
units were built, appended here rather than spliced into an earlier section — **once you've run a
section, this doc never edits it again; a later addition always becomes a new numbered section at
the end.** If you've already run every section through the highest number you last saw, you only
need to run what's below that point next time, not re-read the whole doc looking for a change.

### 8.1 — `get_visitor_policy_text()` (needed by U001/U002)

`_sysconfig` is not in the exposed schema list from Section 1, and anon/authenticated have no
grant on it either — the public registration form can only reach the policy/consent text through
this RPC, the same as Section 3's three lookups. Depends on Section 5's `VisitorLog`
configuration group existing, which it does by the time you reach this section in order.

```sql
create or replace function public.get_visitor_policy_text()
returns table (settingname text, settingvalue text)
language sql
security definer
set search_path = public
as $$
  select cs.configurationsettingname, cs.configurationsettingvaluetext
  from _sysconfig.configurationsetting cs
  join _sysconfig.configurationgroup cg
    on cg.configurationgroupid = cs.configurationgroupid
  where cg.configurationgroupname = 'VisitorLog';
$$;

grant execute on function public.get_visitor_policy_text() to anon, authenticated;
```

`getPolicyText()` (U001) calls this RPC and maps its two rows
(`PrivacyPolicyText`/`VideoConsentText`) into `{ privacyPolicyText, videoConsentText }` — it never
queries `_sysconfig` directly.

### 8.2 — `list_country_dial_codes()` (needed by U002)

Covers the mobile-number country dial code for U002's public form. `countrydialcode` has a real FK
to `country` (`fk_countrydialcode_country`), so this one embeds safely once inside the RPC's own
definer context — the RPC boundary is what anon actually needs, not the embed.

```sql
create or replace function public.list_country_dial_codes()
returns table (
  countrydialid uuid,
  countrydialcode text,
  countryname text,
  isdefault boolean
)
language sql
security definer
set search_path = public
as $$
  select cdc.countrydialid, cdc.countrydialcode, c.countryname, c.isdefault
  from _common.countrydialcode cdc
  join _common.country c on c.countryid = cdc.countryid
  order by c.isdefault desc, c.countryname;
$$;

grant execute on function public.list_country_dial_codes() to anon, authenticated;
```

`listCountryDialCodes()` (U002, added to U001's `src/services/visitor.ts`) calls this and maps it
to `{ countryDialId, countryDialCode, countryName, isDefault }[]`; the form pre-selects the row
where `isDefault` is true.

---

## Verifying each section

After Section 1–3, this should return `[]` (empty, not a permission error) as `anon`:

```bash
curl -s -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/rpc/list_visit_purposes" -X POST -H "Content-Type: application/json" -d '{}'
```

After Section 6–7, signing in as a user with the `Office Manager` role should show "All Visits" and
"On Site Today" in the navbar, and `/visits` should render for a `Staff`-only account without
bouncing to `/`.

After Section 8, this should also return `[]` as `anon`:

```bash
curl -s -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/rpc/get_visitor_policy_text" -X POST -H "Content-Type: application/json" -d '{}'
curl -s -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/rpc/list_country_dial_codes" -X POST -H "Content-Type: application/json" -d '{}'
```
