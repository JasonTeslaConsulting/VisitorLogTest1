import { supabase } from "@framework/integrations/supabase/client";
import type {
  CountryDialCodeOption,
  CreateVisitPayload,
  EquipmentTypeOption,
  ListVisitsParams,
  Visit,
  VisitEquipmentItem,
  VisitHostOption,
  VisitPurposeOption,
} from "@/types/visitor";

type RawVisitEquipment = {
  visitorequipmentid: string;
  itemtypeid: string;
  itemdescription: string;
  quantity: number;
  serialnumber: string | null;
};

type RawVisit = {
  visitorregisterid: string;
  fullname: string;
  organization: string | null;
  emailaddress: string | null;
  mobilenumber: string | null;
  mobilenumbercountrydialid: string | null;
  entrydate: string;
  exitdate: string | null;
  exitloggedby: string | null;
  exitloggeddate: string | null;
  hostid: string;
  visitpurposeid: string;
  isprivacypolicyread: boolean;
  isconsentvideorecord: boolean;
  visitorequipment: RawVisitEquipment[];
};

type RawVisitHostOption = { organizationuserid: string; fullname: string };
type RawReferenceDataOption = {
  referencedataid: string;
  referencedataname: string;
};

type RawCountryDialCodeOption = {
  countrydialid: string;
  countrydialcode: string;
  countryname: string;
  isdefault: boolean;
};

// NOTE: `get_visitor_policy_text`'s SQL isn't defined in docs/plan/db-setup.md (only the three
// lookup RPCs in §3 are) — its return column names are inferred from the unit spec's description
// ("returns two rows keyed by settingname"), not confirmed against a live schema. Verify these
// column names when U002 wires this up end to end.
type RawPolicySetting = { settingname: string; settingvalue: string };

function mapVisitEquipment(raw: RawVisitEquipment): VisitEquipmentItem {
  return {
    visitorEquipmentId: raw.visitorequipmentid,
    itemTypeId: raw.itemtypeid,
    itemDescription: raw.itemdescription,
    quantity: raw.quantity,
    serialNumber: raw.serialnumber,
  };
}

function mapVisit(raw: RawVisit): Visit {
  return {
    visitorRegisterId: raw.visitorregisterid,
    fullName: raw.fullname,
    organization: raw.organization,
    emailAddress: raw.emailaddress,
    mobileNumber: raw.mobilenumber,
    mobileNumberCountryDialId: raw.mobilenumbercountrydialid,
    entryDate: raw.entrydate,
    exitDate: raw.exitdate,
    exitLoggedBy: raw.exitloggedby,
    exitLoggedDate: raw.exitloggeddate,
    hostId: raw.hostid,
    visitPurposeId: raw.visitpurposeid,
    isPrivacyPolicyRead: raw.isprivacypolicyread,
    isConsentVideoRecord: raw.isconsentvideorecord,
    equipment: (raw.visitorequipment ?? []).map(mapVisitEquipment),
  };
}

function mapVisitHostOption(raw: RawVisitHostOption): VisitHostOption {
  return { organizationUserId: raw.organizationuserid, fullName: raw.fullname };
}

function mapReferenceDataOption(
  raw: RawReferenceDataOption,
): VisitPurposeOption | EquipmentTypeOption {
  return {
    referenceDataId: raw.referencedataid,
    referenceDataName: raw.referencedataname,
  };
}

function mapCountryDialCodeOption(
  raw: RawCountryDialCodeOption,
): CountryDialCodeOption {
  return {
    countryDialId: raw.countrydialid,
    countryDialCode: raw.countrydialcode,
    countryName: raw.countryname,
    isDefault: raw.isdefault,
  };
}

export async function listVisits(
  params: ListVisitsParams,
): Promise<{ rows: Visit[]; count: number }> {
  const from = (params.page - 1) * params.perPage;
  const to = from + params.perPage - 1;

  let query = supabase
    .schema("_visitor")
    .from("visitorregister")
    .select(
      `
      visitorregisterid,
      fullname,
      organization,
      emailaddress,
      mobilenumber,
      mobilenumbercountrydialid,
      entrydate,
      exitdate,
      exitloggedby,
      exitloggeddate,
      hostid,
      visitpurposeid,
      isprivacypolicyread,
      isconsentvideorecord,
      visitorequipment (
        visitorequipmentid,
        itemtypeid,
        itemdescription,
        quantity,
        serialnumber
      )
    `,
      { count: "exact" },
    );

  query =
    params.status === "active"
      ? query.is("exitdate", null)
      : query.not("exitdate", "is", null);

  if (params.search) query = query.ilike("fullname", `%${params.search}%`);
  if (params.hostId) query = query.eq("hostid", params.hostId);

  query = params.sort
    ? query.order(params.sort.field, {
        ascending: params.sort.direction === "asc",
      })
    : query.order("entrydate", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return {
    rows: (data as unknown as RawVisit[]).map(mapVisit),
    count: count ?? 0,
  };
}

export async function logVisitExit(
  visitorRegisterId: string,
  exitLoggedBy: string,
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .schema("_visitor")
    .from("visitorregister")
    .update({ exitdate: now, exitloggedby: exitLoggedBy, exitloggeddate: now })
    .eq("visitorregisterid", visitorRegisterId);

  if (error) throw new Error(error.message);
}

// Does not send createdby/modifiedby — see docs/plan/units/001-visitor-domain-foundation.md's
// `## Data source` note on the anon insert path relying on the DB default.
export async function createVisit(
  payload: CreateVisitPayload,
): Promise<{ visitorRegisterId: string }> {
  const { data: visit, error: visitError } = await supabase
    .schema("_visitor")
    .from("visitorregister")
    .insert({
      fullname: payload.fullName,
      organization: payload.organization,
      emailaddress: payload.emailAddress,
      mobilenumber: payload.mobileNumber,
      mobilenumbercountrydialid: payload.mobileNumberCountryDialId,
      hostid: payload.hostId,
      visitpurposeid: payload.visitPurposeId,
      isprivacypolicyread: payload.isPrivacyPolicyRead,
      isconsentvideorecord: payload.isConsentVideoRecord,
      privacypolicycontent: payload.privacyPolicyContent,
      consentvideocontent: payload.consentVideoContent,
    })
    .select("visitorregisterid")
    .single();

  if (visitError) throw new Error(visitError.message);

  if (payload.equipment.length > 0) {
    const { error: equipmentError } = await supabase
      .schema("_visitor")
      .from("visitorequipment")
      .insert(
        payload.equipment.map((item) => ({
          visitorregisterid: visit.visitorregisterid,
          itemtypeid: item.itemTypeId,
          itemdescription: item.itemDescription,
          quantity: item.quantity,
          serialnumber: item.serialNumber ?? null,
        })),
      );

    if (equipmentError) throw new Error(equipmentError.message);
  }

  return { visitorRegisterId: visit.visitorregisterid };
}

// NOTE: `list_visit_hosts`/`list_visit_purposes`/`list_equipment_item_types`/
// `get_visitor_policy_text` are `public` schema RPCs per docs/plan/db-setup.md §3, but are not yet
// present in the generated `src/integrations/supabase/types.ts` (that file must be regenerated,
// never hand-edited, once the RPCs exist in the database — see .claude/rules/architecture-rules.md
// and .claude/skills/gen-supabase-types/SKILL.md). `rpc` below is a narrow, file-local re-typing of
// `supabase.rpc` (avoiding `any`, which is banned outside dateTimeUtils.ts by this repo's eslint
// config) that lets these four calls compile ahead of that regeneration; drop it once
// `npm run gen-supabase-types` picks the functions up and call `supabase.rpc(...)` directly.
type UntypedRpc = (
  fn: string,
) => Promise<{ data: unknown; error: { message: string } | null }>;
// A function wrapper, not a bound reference captured at module load — `supabase` is a lazy Proxy
// that reads appConfig on first property access (client.ts), and this module is imported eagerly
// by the route registry's import.meta.glob before appConfig.initialize() resolves. Accessing
// `supabase.rpc` at module scope (`supabase.rpc.bind(supabase)`) crashed the app on every route
// before React ever mounted; deferring the access into the call itself keeps it lazy.
const rpc: UntypedRpc = (fn) => (supabase.rpc as unknown as UntypedRpc)(fn);

export async function listVisitHosts(): Promise<VisitHostOption[]> {
  const { data, error } = await rpc("list_visit_hosts");
  if (error) throw new Error(error.message);
  return (data as RawVisitHostOption[]).map(mapVisitHostOption);
}

export async function listVisitPurposes(): Promise<VisitPurposeOption[]> {
  const { data, error } = await rpc("list_visit_purposes");
  if (error) throw new Error(error.message);
  return (data as RawReferenceDataOption[]).map(mapReferenceDataOption);
}

export async function listEquipmentItemTypes(): Promise<EquipmentTypeOption[]> {
  const { data, error } = await rpc("list_equipment_item_types");
  if (error) throw new Error(error.message);
  return (data as RawReferenceDataOption[]).map(mapReferenceDataOption);
}

export async function getPolicyText(): Promise<{
  privacyPolicyText: string;
  videoConsentText: string;
}> {
  const { data, error } = await rpc("get_visitor_policy_text");
  if (error) throw new Error(error.message);

  const rows = data as RawPolicySetting[];
  const privacyPolicyText =
    rows.find((row) => row.settingname === "PrivacyPolicyText")?.settingvalue ??
    "";
  const videoConsentText =
    rows.find((row) => row.settingname === "VideoConsentText")?.settingvalue ??
    "";

  return { privacyPolicyText, videoConsentText };
}

export async function listCountryDialCodes(): Promise<CountryDialCodeOption[]> {
  const { data, error } = await rpc("list_country_dial_codes");
  if (error) throw new Error(error.message);
  return (data as RawCountryDialCodeOption[]).map(mapCountryDialCodeOption);
}
