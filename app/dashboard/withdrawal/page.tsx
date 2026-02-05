"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { TransactionProgressBar } from "@/components/transaction/progress-bar"
import { ConfirmationDialog } from "@/components/transaction/confirmation-dialog"
import { PlatformStep } from "@/components/transaction/steps/platform-step"
import { BetIdStep } from "@/components/transaction/steps/bet-id-step"
import { NetworkStep } from "@/components/transaction/steps/network-step"
import { PhoneStep } from "@/components/transaction/steps/phone-step"
import { AmountStep } from "@/components/transaction/steps/amount-step"
import { transactionApi } from "@/lib/api-client"
import type { Platform, UserAppId, Network, UserPhone } from "@/lib/types"
import { toast } from "react-hot-toast"
import { extractTimeErrorMessage } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function WithdrawalPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Step management
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 5

  // Form data
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [selectedBetId, setSelectedBetId] = useState<UserAppId | null>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
  const [selectedPhone, setSelectedPhone] = useState<UserPhone | null>(null)
  const [amount, setAmount] = useState(0)
  const [withdriwalCode, setWithdriwalCode] = useState("")

  // Confirmation dialog
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if not authenticated
  if (!user) {
    router.push("/login")
    return null
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      setIsConfirmationOpen(true)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleConfirmTransaction = async () => {
    if (!selectedPlatform || !selectedBetId || !selectedNetwork || !selectedPhone) {
      toast.error("Données manquantes pour la transaction")
      return
    }

    setIsSubmitting(true)
    try {
      await transactionApi.createWithdrawal({
        amount,
        phone_number: selectedPhone.phone,
        app: selectedPlatform.id,
        user_app_id: selectedBetId.user_app_id,
        network: selectedNetwork.id,
        withdriwal_code: withdriwalCode,
        source: "web"
      })

      toast.success("Retrait initié avec succès!")

      router.push("/dashboard")
    } catch (error: any) {
      // Check for rate limit error (error_time_message)
      const timeErrorMessage = extractTimeErrorMessage(error)
      if (timeErrorMessage) {
        toast.error(timeErrorMessage)
      } else {
        toast.error("Erreur lors de la création du retrait")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== null
      case 2:
        return selectedBetId !== null
      case 3:
        return selectedNetwork !== null
      case 4:
        return selectedPhone !== null
      case 5:
        return amount > 0 && selectedPlatform &&
          withdriwalCode.length >= 4 &&
          amount >= selectedPlatform.minimun_with &&
          amount <= selectedPlatform.max_win
      default:
        return false
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PlatformStep
            selectedPlatform={selectedPlatform}
            onSelect={setSelectedPlatform}
            onNext={handleNext}
            type="withdrawal"
          />
        )
      case 2:
        return (
          <BetIdStep
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            onSelect={setSelectedBetId}
            onNext={handleNext}
          />
        )
      case 3:
        return (
          <NetworkStep
            selectedNetwork={selectedNetwork}
            onSelect={setSelectedNetwork}
            onNext={handleNext}
            type="withdrawal"
          />
        )
      case 4:
        return (
          <PhoneStep
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            onSelect={setSelectedPhone}
            onNext={handleNext}
          />
        )
      case 5:
        return (
          <AmountStep
            amount={amount}
            setAmount={setAmount}
            withdriwalCode={withdriwalCode}
            setWithdriwalCode={setWithdriwalCode}
            selectedPlatform={selectedPlatform}
            selectedBetId={selectedBetId}
            selectedNetwork={selectedNetwork}
            selectedPhone={selectedPhone}
            type="withdrawal"
            onNext={handleNext}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-6">
      <div className="space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Header */}
        <div className="pb-2 border-b border-border/50">
          <div className="flex items-center gap-3 mb-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Effectuer un retrait</h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Remplissez les informations pour effectuer votre retrait</p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <TransactionProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          type="withdrawal"
        />

        {/* Current Step */}
        <div className="min-h-[280px] sm:min-h-[320px] lg:min-h-[400px] overflow-x-hidden">
          {renderCurrentStep()}
        </div>

        {/* Navigation - Show Previous button for steps 2-5 */}
        {currentStep > 1 && currentStep <= 5 && (
          <div className="flex justify-start pt-2 sm:pt-3">
            <Button
              variant="outline"
              onClick={handlePrevious}
              className="flex items-center gap-2 h-9 sm:h-10 text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Précédent</span>
            </Button>
          </div>
        )}

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={isConfirmationOpen}
          onClose={() => setIsConfirmationOpen(false)}
          onConfirm={handleConfirmTransaction}
          transactionData={{
            amount,
            phone_number: selectedPhone?.phone || "",
            app: selectedPlatform?.id || "",
            user_app_id: selectedBetId?.user_app_id || "",
            network: selectedNetwork?.id || 0,
            withdriwal_code: withdriwalCode,
          }}
          type="withdrawal"
          platformName={selectedPlatform?.name || ""}
          networkName={selectedNetwork?.public_name || ""}
          isLoading={isSubmitting}
        />

      </div>
    </div>
  )
}