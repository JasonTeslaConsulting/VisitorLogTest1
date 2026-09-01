import { useEffect, useRef } from "react";
import { Controller, useFieldArray, type Control } from "react-hook-form";
import { PiX } from "react-icons/pi";

import { Button } from "@framework/components/ui/button";
import { Input } from "@framework/components/ui/input";
import { Field, FieldError, FieldLabel } from "@framework/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@framework/components/ui/select";
import { toast } from "@framework/components/ui/toast";

import { useEquipmentItemTypes } from "@/hooks/visitor/useVisitLookups";
import type { RegisterFormValues } from "@/components/Register/RegisterForm";

type EquipmentFieldArrayProps = {
  control: Control<RegisterFormValues>;
};

export const EquipmentFieldArray = ({ control }: EquipmentFieldArrayProps) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "equipment",
  });
  const itemTypesQuery = useEquipmentItemTypes();

  const itemTypesErrorToasted = useRef(false);
  useEffect(() => {
    if (itemTypesErrorToasted.current) return;
    if (itemTypesQuery.isError) {
      itemTypesErrorToasted.current = true;
      toast.error("Unable to load equipment item types. Please try again.");
    }
  }, [itemTypesQuery.isError]);

  const itemTypePlaceholder = itemTypesQuery.isLoading
    ? "Loading…"
    : itemTypesQuery.isError
      ? "Unable to load options"
      : "Select an item type";

  return (
    <div className="flex flex-col gap-4">
      {fields.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-md border border-border p-3 sm:flex-row sm:items-start"
        >
          <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name={`equipment.${index}.itemTypeId`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`equipment-${index}-itemType`}>
                    Item type <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={
                      itemTypesQuery.isLoading || itemTypesQuery.isError
                    }
                  >
                    <SelectTrigger
                      id={`equipment-${index}-itemType`}
                      aria-invalid={fieldState.invalid || undefined}
                    >
                      <SelectValue placeholder={itemTypePlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {itemTypesQuery.data?.map((option) => (
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
              )}
            />

            <Controller
              control={control}
              name={`equipment.${index}.itemDescription`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`equipment-${index}-description`}>
                    Description <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={`equipment-${index}-description`}
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`equipment.${index}.quantity`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`equipment-${index}-quantity`}>
                    Quantity <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={`equipment-${index}-quantity`}
                    type="number"
                    min={1}
                    aria-invalid={fieldState.invalid || undefined}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value}
                    onChange={(event) =>
                      field.onChange(event.target.valueAsNumber)
                    }
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={control}
              name={`equipment.${index}.serialNumber`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor={`equipment-${index}-serial`}>
                    Serial number
                  </FieldLabel>
                  <Input
                    id={`equipment-${index}-serial`}
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove item"
            onClick={() => remove(index)}
          >
            <PiX className="size-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={() =>
          append({
            itemTypeId: "",
            itemDescription: "",
            quantity: 1,
            serialNumber: "",
          })
        }
      >
        + Add item
      </Button>
    </div>
  );
};
