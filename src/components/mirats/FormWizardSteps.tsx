import { useState } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: number;
  title: string;
  description?: string;
}

interface FormWizardStepsProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function FormWizardSteps({ steps, currentStep, className }: FormWizardStepsProps) {
  return (
    <nav aria-label="Progress" className={cn("mb-6 px-4 py-4", className)}>
      <ol role="list" className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <li key={step.id} className={cn(
              "relative flex flex-1 flex-col items-center",
              idx !== steps.length - 1 && "after:content-[''] after:absolute after:top-4 after:left-[50%] after:w-full after:h-[2px] after:bg-muted"
            )}>
              <div className="relative z-10 flex h-8 w-8 items-center justify-center">
                {isCompleted ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-4 w-4" />
                  </div>
                ) : isCurrent ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-sm ring-4 ring-primary/10">
                    <span className="text-xs font-bold">{step.id}</span>
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted bg-background text-muted-foreground">
                    <span className="text-xs font-bold">{step.id}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-2 text-center">
                <span className={cn(
                  "block text-[10px] font-bold uppercase tracking-wider",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  Bước {step.id}
                </span>
                <span className={cn(
                  "block text-xs font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
              
              {/* Connector line for completed state */}
              {idx !== steps.length - 1 && isCompleted && (
                <div className="absolute top-4 left-[50%] h-[2px] w-full bg-primary transition-all duration-300" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
