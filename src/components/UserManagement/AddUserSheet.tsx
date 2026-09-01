import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@framework/components/ui/button";
import { DatePicker } from "@framework/components/ui/DatePicker";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@framework/components/ui/field";
import { Input } from "@framework/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@framework/components/ui/sheet";
import { toast } from "@framework/components/ui/toast";
import { UnsavedChangesDialog } from "@framework/components/ui/UnsavedChangesDialog";
import { useUnsavedChangesGuard } from "@framework/hooks/useUnsavedChangesGuard";
import { DateTimeUtils } from "@framework/lib";

import { useAddPortalUser } from "@/hooks/users/useUserMutations";

const addUserFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  primaryEmail: z.string().email("Invalid email address"),
  employmentStartDate: z.string().min(1, "Employment start date is required"),
});

type AddUserFormValues = z.infer<typeof addUserFormSchema>;

type AddUserSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
};

export const AddUserSheet = ({
  open,
  onOpenChange,
  onSuccess,
}: AddUserSheetProps) => {
  const { mutate: addPortalUser, isPending } = useAddPortalUser();

  const form = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserFormSchema),
    defaultValues: {
      fullName: "",
      primaryEmail: "",
      employmentStartDate: DateTimeUtils.formatDateStd(new Date()),
    },
  });

  const guard = useUnsavedChangesGuard({ when: form.formState.isDirty });

  const onSubmit = (values: AddUserFormValues) => {
    addPortalUser(values, {
      onSuccess: () => {
        toast.success("User added");
        form.reset();
        onSuccess();
      },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <Sheet open={open} onOpenChange={guard.guardOpenChange(onOpenChange)}>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Add user</SheetTitle>
        </SheetHeader>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <FieldGroup className="flex-1 px-4">
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
              name="primaryEmail"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="primaryEmail">
                    Primary email <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="primaryEmail"
                    type="email"
                    aria-invalid={fieldState.invalid || undefined}
                    {...field}
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="employmentStartDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel htmlFor="employmentStartDate">
                    Employment start date{" "}
                    <span className="text-destructive">*</span>
                  </FieldLabel>
                  <DatePicker
                    id="employmentStartDate"
                    value={field.value}
                    onChange={field.onChange}
                    error={fieldState.error?.message}
                  />
                </Field>
              )}
            />
          </FieldGroup>

          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => guard.requestClose(() => onOpenChange(false))}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              Add user
            </Button>
          </SheetFooter>
        </form>

        <UnsavedChangesDialog guard={guard} />
      </SheetContent>
    </Sheet>
  );
};
