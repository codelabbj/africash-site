"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, User, Save, Eye, EyeOff, Lock, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { authApi } from "@/lib/api-client"
import type { User } from "@/lib/types"
import { toast } from "react-hot-toast"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const profileSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phone: z.string().min(8, "Numéro de téléphone invalide"),
})

const passwordSchema = z
  .object({
    old_password: z.string().min(1, "L'ancien mot de passe est requis"),
    new_password: z.string().min(6, "Le nouveau mot de passe doit contenir au moins 6 caractères"),
    confirm_new_password: z.string().min(6, "La confirmation est requise"),
  })
  .refine((data) => data.new_password === data.confirm_new_password, {
    message: "Les nouveaux mots de passe ne correspondent pas",
    path: ["confirm_new_password"],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const router = useRouter()
  const { user: authUser, login } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  })

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    if (!authUser) {
      router.push("/login")
      return
    }
    fetchProfile()
  }, [authUser, router])

  const fetchProfile = async () => {
    setIsLoading(true)
    try {
      const userData = await authApi.getProfile()
      setProfile(userData)
      reset({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        phone: userData.phone || "",
      })
    } catch (error) {
      console.error("Error fetching profile:", error)
      toast.error("Erreur lors du chargement du profil")
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    try {
      const updatedUser = await authApi.updateProfile(data)
      setProfile(updatedUser)
      
      // Update auth context with new user data
      if (authUser) {
        login(
          localStorage.getItem("access_token") || "",
          localStorage.getItem("refresh_token") || "",
          updatedUser
        )
      }
      
      toast.success("Profil mis à jour avec succès!")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Erreur lors de la mise à jour du profil")
    } finally {
      setIsSubmitting(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordFormData) => {
    setIsChangingPassword(true)
    try {
      await authApi.changePassword({
        old_password: data.old_password,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      })
      toast.success("Mot de passe modifié avec succès!")
      resetPassword()
      setShowOldPassword(false)
      setShowNewPassword(false)
      setShowConfirmPassword(false)
    } catch (error) {
      console.error("Error changing password:", error)
      toast.error("Erreur lors de la modification du mot de passe")
    } finally {
      setIsChangingPassword(false)
    }
  }

  if (!authUser) {
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto w-full px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6">
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
      {/* Header */}
        <div className="pb-2 sm:pb-3 border-b border-border/50">
          <div className="flex items-start sm:items-center gap-2 sm:gap-3 mb-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight truncate">Mon profil</h1>
                <p className="text-[11px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">
          Gérez vos informations personnelles
        </p>
              </div>
            </div>
          </div>
      </div>

      {/* Profile Information Card */}
      <Card className="border-border/50">
        <CardHeader className="p-3 sm:p-4 md:p-5 pb-2 sm:pb-3 border-b border-border/50">
          <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">Informations personnelles</CardTitle>
          <CardDescription className="text-[11px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
            Modifiez vos informations de profil
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="first_name" className="text-[11px] sm:text-xs md:text-sm font-medium">
                  Prénom
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="Votre prénom"
                  {...register("first_name")}
                  disabled={isSubmitting}
                  className="h-11 sm:h-10 text-sm touch-manipulation"
                />
                {errors.first_name && (
                  <p className="text-[10px] sm:text-xs text-destructive mt-0.5">
                    {errors.first_name.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="last_name" className="text-[11px] sm:text-xs md:text-sm font-medium">
                  Nom
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Votre nom"
                  {...register("last_name")}
                  disabled={isSubmitting}
                  className="h-11 sm:h-10 text-sm touch-manipulation"
                />
                {errors.last_name && (
                  <p className="text-[10px] sm:text-xs text-destructive mt-0.5">
                    {errors.last_name.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="email" className="text-[11px] sm:text-xs md:text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="votre@email.com"
                {...register("email")}
                disabled={isSubmitting}
                className="h-11 sm:h-10 text-sm touch-manipulation"
              />
              {errors.email && (
                <p className="text-[10px] sm:text-xs text-destructive mt-0.5">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="phone" className="text-[11px] sm:text-xs md:text-sm font-medium">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+225 01 02 03 04 05"
                {...register("phone")}
                disabled={isSubmitting}
                className="h-11 sm:h-10 text-sm touch-manipulation"
              />
              {errors.phone && (
                <p className="text-[10px] sm:text-xs text-destructive mt-0.5">{errors.phone.message}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={isSubmitting}
                className="w-full sm:flex-initial h-11 sm:h-10 text-sm border-border/50 touch-manipulation"
              >
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:flex-1 h-11 sm:h-10 text-sm touch-manipulation">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Enregistrement...</span>
                    <span className="sm:hidden">Enregistrement</span>
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card className="border-border/50">
        <CardHeader className="p-3 sm:p-4 md:p-5 pb-2 sm:pb-3 border-b border-border/50">
          <CardTitle className="text-sm sm:text-base md:text-lg font-semibold flex items-center gap-2">
            <Lock className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <span className="truncate">Changer le mot de passe</span>
          </CardTitle>
          <CardDescription className="text-[11px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
            Modifiez votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-5">
          <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="old_password" className="text-[11px] sm:text-xs md:text-sm font-medium">
                Ancien mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="old_password"
                  type={showOldPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...registerPassword("old_password")}
                  disabled={isChangingPassword}
                  className="h-11 sm:h-10 text-sm pr-10 touch-manipulation"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 sm:h-10 w-10 hover:bg-transparent touch-manipulation"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  disabled={isChangingPassword}
                >
                  {showOldPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.old_password && (
                <p className="text-[10px] sm:text-xs text-destructive mt-0.5">
                  {passwordErrors.old_password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="new_password" className="text-[11px] sm:text-xs md:text-sm font-medium">
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...registerPassword("new_password")}
                  disabled={isChangingPassword}
                  className="h-11 sm:h-10 text-sm pr-10 touch-manipulation"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 sm:h-10 w-10 hover:bg-transparent touch-manipulation"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isChangingPassword}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.new_password && (
                <p className="text-[10px] sm:text-xs text-destructive mt-0.5">
                  {passwordErrors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="confirm_new_password" className="text-[11px] sm:text-xs md:text-sm font-medium">
                Confirmer le nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirm_new_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...registerPassword("confirm_new_password")}
                  disabled={isChangingPassword}
                  className="h-11 sm:h-10 text-sm pr-10 touch-manipulation"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-11 sm:h-10 w-10 hover:bg-transparent touch-manipulation"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isChangingPassword}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {passwordErrors.confirm_new_password && (
                <p className="text-[10px] sm:text-xs text-destructive mt-0.5">
                  {passwordErrors.confirm_new_password.message}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPassword()
                  setShowOldPassword(false)
                  setShowNewPassword(false)
                  setShowConfirmPassword(false)
                }}
                disabled={isChangingPassword}
                className="w-full sm:flex-initial h-11 sm:h-10 text-sm border-border/50 touch-manipulation"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isChangingPassword}
                className="w-full sm:flex-1 h-11 sm:h-10 text-sm touch-manipulation"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Modification...</span>
                    <span className="sm:hidden">Modification</span>
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Modifier le mot de passe</span>
                    <span className="sm:hidden">Modifier</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information Card */}
      {profile && (
        <Card className="border-border/50">
          <CardHeader className="p-3 sm:p-4 md:p-5 pb-2 sm:pb-3 border-b border-border/50">
            <CardTitle className="text-sm sm:text-base md:text-lg font-semibold">Informations du compte</CardTitle>
            <CardDescription className="text-[11px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
              Informations en lecture seule
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="py-1.5 sm:py-2">
                <Label className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">Nom d'utilisateur</Label>
                <p className="text-sm sm:text-base font-medium mt-1 text-foreground break-words">{profile.username}</p>
              </div>
              
              <div className="py-1.5 sm:py-2">
                <Label className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">Date d'inscription</Label>
                <p className="text-sm sm:text-base font-medium mt-1 text-foreground break-words">
                  {format(new Date(profile.date_joined), "dd MMMM yyyy", { locale: fr })}
                </p>
              </div>
              <div className="py-1.5 sm:py-2">
                <Label className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">Dernière connexion</Label>
                <p className="text-sm sm:text-base font-medium mt-1 text-foreground break-words">
                  {profile.last_login
                    ? format(new Date(profile.last_login), "dd MMMM yyyy à HH:mm", { locale: fr })
                    : "Jamais"}
                </p>
              </div>
              {profile.referral_code && (
                <div className="py-1.5 sm:py-2 sm:col-span-2">
                  <Label className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">Code de parrainage</Label>
                  <p className="text-sm sm:text-base font-medium mt-1 font-mono text-foreground break-all">
                    {profile.referral_code}
                  </p>
                </div>
              )}
              {profile.bonus_available !== undefined && (
                <div className="py-1.5 sm:py-2 sm:col-span-2">
                  <Label className="text-[11px] sm:text-xs md:text-sm text-muted-foreground">Bonus disponible</Label>
                  <p className="text-sm sm:text-base font-medium mt-1 text-foreground">
                    {profile.bonus_available.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "XOF",
                      minimumFractionDigits: 0,
                    })}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}

