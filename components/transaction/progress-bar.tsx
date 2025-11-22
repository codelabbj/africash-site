"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressBarProps {
  currentStep: number
  totalSteps: number
  type?: "deposit" | "withdrawal"
  className?: string
}

const stepLabels = {
  deposit: ["Plateforme", "ID Pari", "Réseau", "Téléphone", "Montant"],
  withdrawal: ["Plateforme", "ID Pari", "Réseau", "Téléphone", "Montant"],
}

export function TransactionProgressBar({ currentStep, totalSteps, type = "deposit", className }: ProgressBarProps) {
  const labels = stepLabels[type] || stepLabels.deposit
  const primaryColor = type === "deposit" ? "emerald" : "orange"

  return (
    <div className={cn("w-full", className)}>
      {/* Step Indicators */}
      <div className="relative flex items-center justify-between mb-3 sm:mb-4">
        {/* Connection Lines */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10">
          <div
            className={cn(
              "h-full transition-all duration-300",
              type === "deposit" ? "bg-emerald-500" : "bg-orange-500"
            )}
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>

        {/* Step Circles */}
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          const isPending = stepNumber > currentStep

          return (
            <div key={stepNumber} className="flex flex-col items-center flex-1 relative z-10">
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 transition-all duration-300",
                  isCompleted &&
                    cn(
                      type === "deposit"
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "bg-orange-500 border-orange-500 text-white"
                    ),
                  isCurrent &&
                    cn(
                      type === "deposit"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20"
                        : "bg-orange-50 dark:bg-orange-950/30 border-orange-500 text-orange-600 dark:text-orange-400 ring-2 ring-orange-500/20"
                    ),
                  isPending && "bg-background border-border text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">{stepNumber}</span>
                )}
              </div>

              {/* Step Label */}
              <div className="mt-2 sm:mt-2.5 text-center max-w-[80px] sm:max-w-[100px]">
                <p
                  className={cn(
                    "text-[10px] sm:text-xs font-medium transition-colors",
                    isCompleted || isCurrent
                      ? cn(
                          type === "deposit" ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400"
                        )
                      : "text-muted-foreground"
                  )}
                >
                  {labels[index] || `Étape ${stepNumber}`}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Current Step Info */}
      <div className="text-center">
        <p className="text-xs sm:text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Étape {currentStep}</span> sur {totalSteps}
        </p>
      </div>
    </div>
  )
}
