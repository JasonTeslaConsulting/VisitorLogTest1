import { useEffect, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@framework/components/ui/button";
import { Input } from "@framework/components/ui/input";
import { Checkbox } from "@framework/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@framework/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxFieldLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@framework/components/ui/combobox";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@framework/components/ui/popover";
import { toast } from "@framework/components/ui/toast";

import {
  useCountryDialCodes,
  usePolicyText,
  useVisitHosts,
  useVisitPurposes,
} from "@/hooks/visitor/useVisitLookups";
import { useCreateVisit } from "@/hooks/visitor/useVisitMutations";
import type { CreateVisitPayload } from "@/types/visitor";
import { EquipmentFieldArray } from "@/components/Register/EquipmentFieldArray";

const equipmentItemSchema = z.object({
  itemTypeId: z.string().min(1, "Item type is required"),
  itemDescription: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  serialNumber: z.string().optional(),
});

const registerFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  organization: z.string().optional(),
  emailAddress: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
  countryDialId: z.string().optional(),
  mobileNumber: z.string().optional(),
  hostId: z.string().min(1, "Host is required"),
  visitPurposeId: z.string().min(1, "Visit purpose is required"),
  // zod v4 renamed z.literal()'s error-customization param from `errorMap` to `message`
  // (the unit spec's schema predates this repo's zod version) — same validation, same message.
  isPrivacyPolicyRead: z.literal(true, {
    message: "You must confirm you have read the privacy policy",
  }),
  isConsentVideoRecord: z.literal(true, {
    message: "You must consent to video recording",
  }),
  equipment: z.array(equipmentItemSchema),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

type RegisterFormProps = {
  onSuccess: () => void;
};

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const hostsQuery = useVisitHosts();
  const purposesQuery = useVisitPurposes();
  const dialCodesQuery = useCountryDialCodes();
  const policyQuery = usePolicyText();
  const { mutate: submitVisit, isPending } = useCreateVisit();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    // isPrivacyPolicyRead/isConsentVideoRecord are typed `true` (z.literal(true)) since the
    // schema must reject an unchecked box, but the form has to start unchecked — cast around
    // the mismatch rather than weakening the schema's validation type.
    defaultValues: {
      fullName: "",
      organization: "",
      emailAddress: "",
      countryDialId: "",
      mobileNumber: "",
      hostId: "",
      visitPurposeId: "",
      isPrivacyPolicyRead: false,
      isConsentVideoRecord: false,
      equipment: [],
    } as unknown as RegisterFormValues,
  });

  // Pre-select the isDefault dial code once the lookup resolves, without overwriting a value
  // the visitor may have already picked while it was loading.
  const defaultDialApplied = useRef(false);
  useEffect(() => {
    if (defaultDialApplied.current || !dialCodesQuery.data) return;
    defaultDialApplied.current = true;
    if (form.getValues("countryDialId")) return;
    const defaultOption = dialCodesQuery.data.find(
      (option) => option.isDefault,
    );
    if (defaultOption) {
      form.setValue("countryDialId", defaultOption.countryDialId);
    }
  }, [dialCodesQuery.data, form]);

  // One toast per mount, no matter how many of the lookups fail.
  const lookupErrorToasted = useRef(false);
  useEffect(() => {
    if (lookupErrorToasted.current) return;
    if (hostsQuery.isError || purposesQuery.isError || dialCodesQuery.isError) {
      lookupErrorToasted.current = true;
      toast.error("Unable to load some form options. Please try again.");
    }
  }, [hostsQuery.isError, purposesQuery.isError, dialCodesQuery.isError]);

  const hostOptions =
    hostsQuery.data?.map((host) => ({
      value: host.organizationUserId,
      label: host.fullName,
    })) ?? [];

  const dialCodeOptions =
    dialCodesQuery.data?.map((option) => ({
      value: option.countryDialId,
      label: `${option.countryName} (${option.countryDialCode})`,
    })) ?? [];

  const onSubmit = (values: RegisterFormValues) => {
    const payload: CreateVisitPayload = {
      fullName: values.fullName,
      organization: values.organization || undefined,
      emailAddress: values.emailAddress || undefined,
      mobileNumber: values.mobileNumber || undefined,
      mobileNumberCountryDialId: values.countryDialId || undefined,
      hostId: values.hostId,
      visitPurposeId: values.visitPurposeId,
      isPrivacyPolicyRead: values.isPrivacyPolicyRead,
      isConsentVideoRecord: values.isConsentVideoRecord,
      privacyPolicyContent: policyQuery.data?.privacyPolicyText ?? "",
      consentVideoContent: policyQuery.data?.videoConsentText ?? "",
      equipment: values.equipment.map((item) => ({
        itemTypeId: item.itemTypeId,
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        serialNumber: item.serialNumber || undefined,
      })),
    };

    submitVisit(payload, {
      onSuccess: () => onSuccess(),
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <FieldGroup>
        <Controller
          control={form.control}
          name="fullName"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="fullName">
                Full name <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="fullName"
                aria-invalid={fieldState.invalid || undefined}
                {...field}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="organization"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="organization">Organization</FieldLabel>
              <Input
                id="organization"
                aria-invalid={fieldState.invalid || undefined}
                {...field}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="emailAddress"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel htmlFor="emailAddress">Email</FieldLabel>
              <Input
                id="emailAddress"
                type="email"
                aria-invalid={fieldState.invalid || undefined}
                {...field}
              />
              <FieldError>{fieldState.error?.message}</FieldError>
            </Field>
          )}
        />

        {/* Country dial code + mobile number — inline compound field per
            .claude/skills/build-form-page/SKILL.md § Responsiveness. */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="w-full sm:w-2/5">
            <Controller
              control={form.control}
              name="countryDialId"
              render={({ field, fieldState }) => {
                const selected =
                  dialCodeOptions.find(
                    (option) => option.value === field.value,
                  ) ?? null;
                const placeholder = dialCodesQuery.isLoading
                  ? "Loading…"
                  : dialCodesQuery.isError
                    ? "Unable to load options"
                    : "Select";

                return (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <Combobox
                      items={dialCodeOptions}
                      value={selected}
                      onValueChange={(item) =>
                        field.onChange(item?.value ?? "")
                      }
                      disabled={
                        dialCodesQuery.isLoading || dialCodesQuery.isError
                      }
                    >
                      <ComboboxFieldLabel>Country code</ComboboxFieldLabel>
                      <ComboboxTrigger
                        aria-invalid={fieldState.invalid || undefined}
                      >
                        <ComboboxValue placeholder={placeholder} />
                      </ComboboxTrigger>
                      <ComboboxContent>
                        <ComboboxInput placeholder="Search countries" />
                        <ComboboxEmpty>No countries found.</ComboboxEmpty>
                        <ComboboxList>
                          {(option: (typeof dialCodeOptions)[number]) => (
                            <ComboboxItem key={option.value} value={option}>
                              {option.label}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </Field>
                );
              }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Controller
              control={form.control}
              name="mobileNumber"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="mobileNumber">Mobile number</FieldLabel>
                  <Input
                    id="mobileNumber"
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>
        </div>

        <Controller
          control={form.control}
          name="hostId"
          render={({ field, fieldState }) => {
            const selected =
              hostOptions.find((option) => option.value === field.value) ??
              null;
            const placeholder = hostsQuery.isLoading
              ? "Loading…"
              : hostsQuery.isError
                ? "Unable to load options"
                : "Select a host";

            return (
              <Field data-invalid={fieldState.invalid || undefined}>
                <Combobox
                  items={hostOptions}
                  value={selected}
                  onValueChange={(item) => field.onChange(item?.value ?? "")}
                  disabled={hostsQuery.isLoading || hostsQuery.isError}
                >
                  <ComboboxFieldLabel>
                    Host <span className="text-destructive">*</span>
                  </ComboboxFieldLabel>
                  <ComboboxTrigger
                    aria-invalid={fieldState.invalid || undefined}
                  >
                    <ComboboxValue placeholder={placeholder} />
                  </ComboboxTrigger>
                  <ComboboxContent>
                    <ComboboxInput placeholder="Search hosts" />
                    <ComboboxEmpty>No hosts found.</ComboboxEmpty>
                    <ComboboxList>
                      {(option: (typeof hostOptions)[number]) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            );
          }}
        />

        <Controller
          control={form.control}
          name="visitPurposeId"
          render={({ field, fieldState }) => {
            const placeholder = purposesQuery.isLoading
              ? "Loading…"
              : purposesQuery.isError
                ? "Unable to load options"
                : "Select a purpose";

            return (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel htmlFor="visitPurposeId">
                  Visit purpose <span className="text-destructive">*</span>
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={purposesQuery.isLoading || purposesQuery.isError}
                >
                  <SelectTrigger
                    id="visitPurposeId"
                    aria-invalid={fieldState.invalid || undefined}
                  >
                    <SelectValue placeholder={placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {purposesQuery.data?.map((option) => (
                      <SelectItem
                        key={option.referenceDataId}
                        value={option.referenceDataId}
                      >
                        {option.referenceDataName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </Field>
            );
          }}
        />

        <EquipmentFieldArray control={form.control} />

        <Controller
          control={form.control}
          name="isPrivacyPolicyRead"
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid || undefined}
            >
              <Checkbox
                id="isPrivacyPolicyRead"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.invalid || undefined}
              />
              <FieldContent>
                <div className="flex flex-wrap items-center gap-x-2">
                  <FieldLabel htmlFor="isPrivacyPolicyRead">
                    I have read the privacy policy{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto min-w-0 p-0 text-xs"
                        />
                      }
                    >
                      View policy
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverHeader>
                        <PopoverTitle>Privacy policy</PopoverTitle>
                      </PopoverHeader>
                      <p className="text-sm text-muted-foreground">
                        {policyQuery.data?.privacyPolicyText}
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="isConsentVideoRecord"
          render={({ field, fieldState }) => (
            <Field
              orientation="horizontal"
              data-invalid={fieldState.invalid || undefined}
            >
              <Checkbox
                id="isConsentVideoRecord"
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                aria-invalid={fieldState.invalid || undefined}
              />
              <FieldContent>
                <div className="flex flex-wrap items-center gap-x-2">
                  <FieldLabel htmlFor="isConsentVideoRecord">
                    I consent to video recording{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          variant="link"
                          className="h-auto min-w-0 p-0 text-xs"
                        />
                      }
                    >
                      View details
                    </PopoverTrigger>
                    <PopoverContent>
                      <PopoverHeader>
                        <PopoverTitle>Video consent</PopoverTitle>
                      </PopoverHeader>
                      <p className="text-sm text-muted-foreground">
                        {policyQuery.data?.videoConsentText}
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <div className="border-t border-border pt-3">
          <Button type="submit" className="w-full" isLoading={isPending}>
            Register
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};
