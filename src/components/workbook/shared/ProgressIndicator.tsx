"use client";

import { useWorkbookContext } from "../WorkbookContext";
import { useLocale } from "@/components/LocaleProvider";
import { Check } from "@phosphor-icons/react";

export default function ProgressIndicator() {
  const { state, dispatch } = useWorkbookContext();
  const { t } = useLocale();

  const steps = [
    {
      id: "selection",
      label: "Select",
      shortLabel: t.common.loading
    },
    {
      id: "configuration",
      label: "Configure",
      shortLabel: "Config"
    },
    {
      id: "practice",
      label: "Practice",
      shortLabel: "Practice"
    }
  ];

  const currentStepIndex = steps.findIndex((step) => step.id === state.wizardStep);

  const handleStepClick = (stepId: string, stepIndex: number) => {
    // Only allow clicking on previous steps (to go back)
    if (stepIndex < currentStepIndex) {
      if (stepId === "selection") {
        dispatch({ type: "RESET_WIZARD" });
      } else if (stepId === "configuration") {
        dispatch({ type: "GO_TO_CONFIG" });
      }
    }
  };

  return (
    <div className="flex items-center justify-center gap-4">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const isClickable = index < currentStepIndex;

        return (
          <div key={step.id} className="flex items-center gap-4">
            {/* Step indicator */}
            <button
              onClick={() => handleStepClick(step.id, index)}
              disabled={!isClickable}
              className={`flex items-center gap-2 transition ${
                isClickable ? "cursor-pointer" : "cursor-default"
              }`}
            >
              {/* Circle */}
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                  isActive
                    ? "border-ink bg-ink text-paper"
                    : isCompleted
                    ? "border-moss bg-moss text-paper"
                    : "border-ink/20 bg-paper text-ink/40"
                }`}
              >
                {isCompleted ? (
                  <Check size={16} weight="bold" />
                ) : (
                  <span className="text-xs font-semibold">{index + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-semibold ${
                  isActive ? "text-ink" : isCompleted ? "text-moss" : "text-ink/40"
                }`}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`h-px w-12 transition ${
                  isCompleted ? "bg-moss" : "bg-ink/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
