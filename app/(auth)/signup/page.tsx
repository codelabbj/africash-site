"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { authApi, settingsApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"

const baseSignupSchema = z.object({
  first_name: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  last_name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  re_password: z.string().min(6, "Confirmation requise"),
})

type SignupFormData = z.infer<typeof baseSignupSchema> & {
  referral_code?: string
}

export default function SignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralBonusEnabled, setReferralBonusEnabled] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingsApi.get()
        setReferralBonusEnabled(settings?.referral_bonus === true)
      } catch (error) {
        console.error("Error fetching settings:", error)
        setReferralBonusEnabled(false)
      } finally {
        setIsLoadingSettings(false)
      }
    }
    fetchSettings()
  }, [])

  const signupSchema = referralBonusEnabled
    ? baseSignupSchema
        .extend({
          referral_code: z.string().optional(),
        })
        .refine((data) => data.password === data.re_password, {
          message: "Les mots de passe ne correspondent pas",
          path: ["re_password"],
        })
    : baseSignupSchema.refine((data) => data.password === data.re_password, {
        message: "Les mots de passe ne correspondent pas",
        path: ["re_password"],
      })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true)
    try {
      const registrationData: any = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        re_password: data.re_password,
      }
      
      // Only include referral_code if referral bonus is enabled and code is provided
      if (referralBonusEnabled && data.referral_code) {
        registrationData.referral_code = data.referral_code
      }
      
      await authApi.register(registrationData)
      toast.success("Compte créé avec succès! Veuillez vous connecter.")
      router.push("/login")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Signup error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <Card className="border-border/50 shadow-xl">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50 shadow-xl overflow-hidden">
      <CardHeader className="space-y-2 px-6 sm:px-8 pt-8 sm:pt-10 pb-6 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-center">Créer un compte</CardTitle>
        <CardDescription className="text-center text-sm sm:text-base">Remplissez le formulaire pour créer votre compte</CardDescription>
      </CardHeader>
      <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="text-sm font-semibold">Prénom</Label>
              <Input id="first_name" type="text" placeholder="Jean" {...register("first_name")} disabled={isLoading} className="h-12 text-base border-2 focus:border-primary transition-colors" />
              {errors.first_name && <p className="text-xs text-destructive mt-1">{errors.first_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="text-sm font-semibold">Nom</Label>
              <Input id="last_name" type="text" placeholder="Dupont" {...register("last_name")} disabled={isLoading} className="h-12 text-base border-2 focus:border-primary transition-colors" />
              {errors.last_name && <p className="text-xs text-destructive mt-1">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemple@email.com"
              {...register("email")}
              disabled={isLoading}
              className="h-12 text-base border-2 focus:border-primary transition-colors"
            />
            {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-semibold">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+225 01 02 03 04 05"
              {...register("phone")}
              disabled={isLoading}
              className="h-12 text-base border-2 focus:border-primary transition-colors"
            />
            {errors.phone && <p className="text-xs text-destructive mt-1">{errors.phone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
                className="h-12 text-base border-2 focus:border-primary transition-colors pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.password && <p className="text-xs text-destructive mt-1">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="re_password" className="text-sm font-semibold">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="re_password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register("re_password")}
                disabled={isLoading}
                className="h-12 text-base border-2 focus:border-primary transition-colors pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {errors.re_password && <p className="text-xs text-destructive mt-1">{errors.re_password.message}</p>}
          </div>

          {referralBonusEnabled && (
            <div className="space-y-2">
              <Label htmlFor="referral_code" className="text-sm font-semibold">Code de parrainage (optionnel)</Label>
              <Input
                id="referral_code"
                type="text"
                placeholder="Entrez un code de parrainage"
                {...register("referral_code")}
                disabled={isLoading}
                className="h-12 text-base border-2 focus:border-primary transition-colors"
              />
              {errors.referral_code && <p className="text-xs text-destructive mt-1">{errors.referral_code.message}</p>}
            </div>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer mon compte"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 px-6 sm:px-8 pb-8">
        <div className="text-sm text-muted-foreground text-center">
          Vous avez déjà un compte?{" "}
          <Link href="/login" className="text-primary hover:underline font-semibold">
            Se connecter
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
