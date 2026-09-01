export type VisitStatus = "active" | "past";

export type VisitEquipmentItem = {
  visitorEquipmentId: string;
  itemTypeId: string;
  itemDescription: string;
  quantity: number;
  serialNumber: string | null;
};

export type Visit = {
  visitorRegisterId: string;
  fullName: string;
  organization: string | null;
  emailAddress: string | null;
  mobileNumber: string | null;
  mobileNumberCountryDialId: string | null;
  entryDate: string;
  exitDate: string | null;
  exitLoggedBy: string | null;
  exitLoggedDate: string | null;
  hostId: string;
  visitPurposeId: string;
  isPrivacyPolicyRead: boolean;
  isConsentVideoRecord: boolean;
  equipment: VisitEquipmentItem[];
};

export type VisitHostOption = { organizationUserId: string; fullName: string };
export type VisitPurposeOption = {
  referenceDataId: string;
  referenceDataName: string;
};
export type EquipmentTypeOption = {
  referenceDataId: string;
  referenceDataName: string;
};

export type CreateVisitEquipmentInput = {
  itemTypeId: string;
  itemDescription: string;
  quantity: number;
  serialNumber?: string;
};

export type CreateVisitPayload = {
  fullName: string;
  organization?: string;
  emailAddress?: string;
  mobileNumber?: string;
  mobileNumberCountryDialId?: string;
  hostId: string;
  visitPurposeId: string;
  isPrivacyPolicyRead: boolean;
  isConsentVideoRecord: boolean;
  privacyPolicyContent: string;
  consentVideoContent: string;
  equipment: CreateVisitEquipmentInput[];
};

export type ListVisitsParams = {
  page: number;
  perPage: number;
  status: VisitStatus;
  search?: string;
  hostId?: string;
  sort?: { field: string; direction: "asc" | "desc" } | null;
};

export type CountryDialCodeOption = {
  countryDialId: string;
  countryDialCode: string;
  countryName: string;
  isDefault: boolean;
};
