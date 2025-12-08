"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Gift, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { bonusApi, settingsApi } from "@/lib/api-client"
import type { Bonus } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function BonusPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const checkSettings = async () => {
      try {
        const settings = await settingsApi.get()
        const enabled = settings?.referral_bonus === true
        setReferralBonusEnabled(enabled)
        
        if (!enabled) {
          // Redirect to dashboard if referral bonus is disabled
          router.push("/dashboard")
          return
        }
        
        // If enabled, fetch bonuses
        fetchBonuses()
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
        router.push("/dashboard")
      } finally {
        setIsLoadingSettings(false)
      }
    }
    
    if (user) {
      checkSettings()
    }
  }, [user, router])

  const fetchBonuses = async () => {
    setIsLoading(true)
    try {
      const data = await bonusApi.getAll(1)
      setBonuses(data.results)
    } catch (error) {
      console.error("Error fetching bonuses:", error)
      toast.error("Erreur lors du chargement des bonus")
    } finally {
      setIsLoading(false)
    }
  }

  // Refetch data when the page gains focus
  useEffect(() => {
    if (!referralBonusEnabled) return
    
    const handleFocus = () => {
      fetchBonuses()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [referralBonusEnabled])

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!referralBonusEnabled) {
    return null // Will redirect
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 lg:px-6">
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
            <div className="flex items-center gap-2 sm:gap-3 flex-1">
              <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Mes bonus</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">Consultez vos bonus de parrainage</p>
              </div>
            </div>
          </div>
      </div>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg font-semibold">Historique des bonus</CardTitle>
            <CardDescription className="text-xs sm:text-sm mt-1">Liste de tous vos bonus reçus</CardDescription>
        </CardHeader>
          <CardContent className="p-4 sm:p-5 lg:p-6">
          {isLoading ? (
              <div className="flex items-center justify-center py-16 sm:py-20">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </div>
          ) : bonuses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                <div className="p-3 rounded-full bg-muted/50 mb-4">
                  <Gift className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                </div>
                <p className="text-sm sm:text-base font-medium text-foreground/70">Aucun bonus enregistré</p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">Vos bonus de parrainage apparaîtront ici</p>
            </div>
          ) : (
              <div className="space-y-2.5 sm:space-y-3">
              {bonuses.map((bonus) => (
                  <Card key={bonus.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                    <CardContent className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs sm:text-sm font-semibold">
                            {parseFloat(bonus.amount).toLocaleString("fr-FR", {
                              style: "currency",
                              currency: "XOF",
                              minimumFractionDigits: 0,
                            })}
                          </Badge>
                        </div>
                          <p className="text-sm sm:text-base font-medium text-foreground">
                          {bonus.reason_bonus || "Bonus de parrainage"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(bonus.created_at), "dd MMMM yyyy à HH:mm", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  )
}

