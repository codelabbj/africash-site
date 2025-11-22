"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Ticket, Copy, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { couponApi, platformApi } from "@/lib/api-client"
import type { Coupon, Platform } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default function CouponPage() {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchCoupons()
    fetchPlatforms()
  }, [])

  // Refetch data when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchCoupons()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchPlatforms = async () => {
    try {
      const data = await platformApi.getAll()
      setPlatforms(data)
    } catch (error) {
      console.error("Error fetching platforms:", error)
    }
  }

  const fetchCoupons = async () => {
    setIsLoading(true)
    try {
      const data = await couponApi.getAll(1)
      setCoupons(data.results)
    } catch (error) {
      console.error("Error fetching coupons:", error)
      toast.error("Erreur lors du chargement des coupons")
    } finally {
      setIsLoading(false)
    }
  }

  const getPlatformName = (betAppId: string) => {
    const platform = platforms.find((p) => p.id === betAppId)
    return platform?.name || "Plateforme inconnue"
  }

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    toast.success("Code copié dans le presse-papiers")
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Veuillez vous connecter pour voir vos coupons</p>
      </div>
    )
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
              <Ticket className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Mes Coupons</h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  Gérez vos codes promo et coupons
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <Card className="border-border/50">
            <CardContent className="flex items-center justify-center py-16 sm:py-20">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Coupons List */}
            {coupons.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                <h2 className="text-base sm:text-lg font-semibold text-foreground">Mes coupons</h2>
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  {coupons.map((coupon) => (
                    <Card key={coupon.id} className="border-border/50 hover:border-primary/30 transition-all duration-200 hover:shadow-md">
                      <CardHeader className="p-4 sm:p-5 pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg break-words font-mono text-foreground mb-1">
                              {coupon.code}
                            </CardTitle>
                            <CardDescription className="text-xs sm:text-sm">
                              {getPlatformName(coupon.bet_app)}
                            </CardDescription>
                          </div>
                          <Badge variant="secondary" className="flex-shrink-0 text-[10px] sm:text-xs">
                            Coupon
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-5 pt-0 space-y-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground pb-2 border-b border-border/50">
                          <span>Créé le:</span>
                          <span className="font-medium text-foreground/70">
                            {format(new Date(coupon.created_at), "dd MMM yyyy", { locale: fr })}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full h-9 text-xs sm:text-sm border-border/50 hover:bg-primary hover:text-primary-foreground"
                          onClick={() => copyToClipboard(coupon.code)}
                        >
                          {copiedCode === coupon.code ? (
                            <>
                              <Check className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Copié
                            </>
                          ) : (
                            <>
                              <Copy className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Copier le code
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-4">
                    <Ticket className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm sm:text-base font-medium text-foreground/70">Aucun coupon disponible</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                    Vos coupons apparaîtront ici
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

