/**
 * Stepper — the frame for a multi-step process: a form split into stages, a guided setup flow.
 *
 * Renders, top to bottom: a progress rail of one equal-width segment per step, an optional
 * "Step 1 of 4 — Contact" counter, the current step's title + description, its content, then a
 * Back/Continue footer. Only the active step's content is mounted, so a multi-step form keeps its
 * `useForm` instance above the `Stepper`, not inside a step's `content` — an unmounted field loses
 * whatever react-hook-form was holding for it.
 *
 * ```tsx
 * <Stepper
 *   steps={[
 *     { id: "contact", title: "Your information", name: "Contact", content: <ContactFields />, onBeforeNext: () => form.trigger(["name", "email"]) },
 *     { id: "review", title: "Review", content: <ReviewSummary /> },
 *   ]}
 *   currentStep={step}
 *   onStepChange={setStep}
 *   onComplete={form.handleSubmit(onSubmit)}
 *   isSubmitting={isPending}
 * />
 * ```
 *
 * **Controlled, and form-library-agnostic on purpose.** The page owns `currentStep`; `Stepper`
 * never imports react-hook-form or any other form/data library — `.claude/rules/components-rules.md`
 * keeps `ui/` free of both. A step blocks Continue by returning `false` (or a Promise resolving
 * false) from `onBeforeNext`, which a form step wires to `form.trigger([...fields])`; `Stepper`
 * only awaits the result; it never inspects why. `onBeforeNext` never runs on Back — a user may
 * always retreat past a step that hasn't validated yet.
 *
 * **Continue stays enabled even when the step is invalid.** A disabled button that never says why
 * is worse than one that reveals the inline `FieldError`s on click — the guard is the validation
 * gate, not the button's disabled state.
 *
 * The rail has no numbered circles and its segments are not clickable — Back/Continue are the only
 * navigation. Segments up to and including `currentStep` are filled (`bg-primary`); the rest are
 * `bg-muted`. The rail is `aria-hidden`; the counter line (or, when hidden, a dedicated `sr-only`
 * line) is what a screen reader announces instead.
 */
import { useState } from "react";
import { PiCaretLeft } from "react-icons/pi";

import { cn } from "@framework/lib/shadcn/shadcn-utils";
import { Button } from "@framework/components/ui/button";

type StepperStep = {
  id: string;
  /** Heading shown above the step's content. */
  title: string;
  /** Short name for the "Step 1 of 4 — Contact" counter. Falls back to `title`. */
  name?: string;
  /** Smaller line under the title. */
  description?: string;
  content: React.ReactNode;
  /**
   * Guard run before leaving this step forward. Return (or resolve to) false to stay put — a
   * form step wires this to react-hook-form's `trigger([...fields])`. Never runs on Back.
   */
  onBeforeNext?: () => boolean | Promise<boolean>;
};

type StepperProps = {
  steps: StepperStep[];
  /** 0-based, owned by the page. */
  currentStep: number;
  onStepChange: (step: number) => void;
  /** Runs instead of onStepChange from the last step, once its guard passes. */
  onComplete: () => void;
  /** Spinner on the primary button while the page's submit mutation runs. */
  isSubmitting?: boolean;
  /** The "Step 1 of 4 — Contact" line above the title. */
  showStepCounter?: boolean;
  backLabel?: string;
  nextLabel?: string;
  submitLabel?: string;
  className?: string;
};

const Stepper = ({
  steps,
  currentStep,
  onStepChange,
  onComplete,
  isSubmitting = false,
  showStepCounter = true,
  backLabel = "Back",
  nextLabel = "Continue",
  submitLabel = "Submit",
  className,
}: StepperProps) => {
  const [guardPending, setGuardPending] = useState(false);
  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const busy = isSubmitting || guardPending;

  const handleBack = () => {
    if (currentStep > 0) {
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = async () => {
    if (step.onBeforeNext) {
      setGuardPending(true);
      const canProceed = await step.onBeforeNext();
      setGuardPending(false);
      if (!canProceed) {
        return;
      }
    }

    if (isLastStep) {
      onComplete();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  return (
    <div data-slot="stepper" className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-4">
        <ol aria-hidden="true" data-slot="stepper-rail" className="flex gap-2">
          {steps.map((s, index) => (
            <li
              key={s.id}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index <= currentStep ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </ol>
        <p className="sr-only" role="status">
          Step {currentStep + 1} of {steps.length}: {step.name ?? step.title}
        </p>

        <div className="space-y-1">
          {showStepCounter ? (
            <p aria-hidden="true" className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length} —{" "}
              {step.name ?? step.title}
            </p>
          ) : null}
          <h2 className="font-heading text-title-lg font-medium">
            {step.title}
          </h2>
          {step.description ? (
            <p className="text-sm text-muted-foreground">{step.description}</p>
          ) : null}
        </div>
      </div>

      {step.content}

      <div className="flex justify-between gap-3 border-t border-border pt-6">
        <Button
          type="button"
          variant="ghost"
          startIcon={<PiCaretLeft />}
          disabled={currentStep === 0 || busy}
          onClick={handleBack}
        >
          {backLabel}
        </Button>
        <Button type="button" isLoading={busy} onClick={handleNext}>
          {isLastStep ? submitLabel : nextLabel}
        </Button>
      </div>
    </div>
  );
};

export { Stepper };
export type { StepperProps, StepperStep };
