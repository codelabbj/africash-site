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
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { authApi } from "@/lib/api-client"
import { toast } from "react-hot-toast"
import { Loader2, Eye, EyeOff, Download, ArrowLeft } from "lucide-react"
import { setupNotifications } from "@/lib/fcm-helper"

const loginSchema = z.object({
  email_or_phone: z.string().min(1, "Email ou téléphone requis"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

const forgotPasswordEmailSchema = z.object({
  email: z.string().email("Email invalide"),
})

const forgotPasswordOtpSchema = z.object({
  otp: z.string().min(4, "Le code OTP doit contenir au moins 4 caractères"),
})

const forgotPasswordNewPasswordSchema = z.object({
  new_password: z.string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins une majuscule")
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins une minuscule")
    .regex(/[0-9]/, "Le mot de passe doit contenir au moins un chiffre"),
  confirm_new_password: z.string(),
}).refine((data) => data.new_password === data.confirm_new_password, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_new_password"],
})

type ForgotPasswordEmailFormData = z.infer<typeof forgotPasswordEmailSchema>
type ForgotPasswordOtpFormData = z.infer<typeof forgotPasswordOtpSchema>
type ForgotPasswordNewPasswordFormData = z.infer<typeof forgotPasswordNewPasswordSchema>

const APK_DOWNLOAD_URL = "/app-v1.0.5.apk"
const APK_FILE_NAME = "Africash-v1.0.5.apk"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  
  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1) // 1: email, 2: otp, 3: new password
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("")
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("")
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const forgotPasswordEmailForm = useForm<ForgotPasswordEmailFormData>({
    resolver: zodResolver(forgotPasswordEmailSchema),
  })

  const forgotPasswordOtpForm = useForm<ForgotPasswordOtpFormData>({
    resolver: zodResolver(forgotPasswordOtpSchema),
  })

  const forgotPasswordNewPasswordForm = useForm<ForgotPasswordNewPasswordFormData>({
    resolver: zodResolver(forgotPasswordNewPasswordSchema),
  })

  // Load remembered credentials on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email")
    const rememberedPassword = localStorage.getItem("remembered_password")
    if (rememberedEmail && rememberedPassword) {
      setValue("email_or_phone", rememberedEmail)
      setValue("password", rememberedPassword)
      setRememberMe(true)
    }
  }, [setValue])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("remembered_email", data.email_or_phone)
        localStorage.setItem("remembered_password", data.password)
      } else {
        localStorage.removeItem("remembered_email")
        localStorage.removeItem("remembered_password")
      }

      // Step 1: Authenticate user
      const response = await authApi.login(data.email_or_phone, data.password)
      login(response.access, response.refresh, response.data)
      
      // Step 2: Show success toast first
      toast.success("Connexion réussie!")
      
      // Step 3: Request notification permission (shows native browser prompt)
      try {
        const userId = response.data?.id
        
        if (userId) {
          // Add small delay to ensure page is ready
          await new Promise(resolve => setTimeout(resolve, 100))
          
          console.log('[Login] Setting up notifications for user:', userId)
          const fcmToken = await setupNotifications(userId)
          
          if (fcmToken) {
            toast.success("Notifications activées!")
            console.log('[Login] FCM Token registered:', fcmToken.substring(0, 20) + '...')
          } else {
            console.log('[Login] No FCM token - permission might be denied or not granted')
          }
        }
      } catch (fcmError) {
        // Non-critical error - don't block login
        console.error('[Login] Error setting up notifications:', fcmError)
      }
      
      // Step 4: Redirect to dashboard
      // Wait a bit more to ensure notification prompt completes if shown
      await new Promise(resolve => setTimeout(resolve, 300))
      router.push("/dashboard")
    } catch (error) {
      // Error is handled by api interceptor
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPasswordEmailSubmit = async (data: ForgotPasswordEmailFormData) => {
    setIsForgotPasswordLoading(true)
    try {
      await authApi.sendOtp(data.email)
      setForgotPasswordEmail(data.email)
      toast.success("Code OTP envoyé à votre email")
      setForgotPasswordStep(2)
    } catch (error) {
      console.error("Send OTP error:", error)
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  const handleForgotPasswordOtpSubmit = async (data: ForgotPasswordOtpFormData) => {
    setForgotPasswordOtp(data.otp)
    toast.success("Code OTP vérifié avec succès")
    setForgotPasswordStep(3)
  }

  const handleForgotPasswordNewPasswordSubmit = async (data: ForgotPasswordNewPasswordFormData) => {
    setIsForgotPasswordLoading(true)
    try {
      await authApi.resetPassword({
        otp: forgotPasswordOtp,
        new_password: data.new_password,
        confirm_new_password: data.confirm_new_password,
      })
      toast.success("Mot de passe réinitialisé avec succès")
      // Reset forgot password states
      setIsForgotPassword(false)
      setForgotPasswordStep(1)
      setForgotPasswordEmail("")
      setForgotPasswordOtp("")
      forgotPasswordEmailForm.reset()
      forgotPasswordOtpForm.reset()
      forgotPasswordNewPasswordForm.reset()
    } catch (error) {
      console.error("Reset password error:", error)
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  const renderForgotPasswordForm = () => {
    if (forgotPasswordStep === 1) {
      return (
        <form onSubmit={forgotPasswordEmailForm.handleSubmit(handleForgotPasswordEmailSubmit)} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="forgot_email" className="text-sm font-semibold">Email</Label>
            <Input
              id="forgot_email"
              type="email"
              placeholder="exemple@email.com"
              {...forgotPasswordEmailForm.register("email")}
              disabled={isForgotPasswordLoading}
              className="h-12 text-base border-2 focus:border-primary transition-colors"
            />
            {forgotPasswordEmailForm.formState.errors.email && (
              <p className="text-xs text-destructive mt-1">
                {forgotPasswordEmailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer le code OTP"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setIsForgotPassword(false)
              setForgotPasswordStep(1)
              forgotPasswordEmailForm.reset()
            }}
            disabled={isForgotPasswordLoading}
          >
            Retour à la connexion
          </Button>
        </form>
      )
    }

    if (forgotPasswordStep === 2) {
      return (
        <form onSubmit={forgotPasswordOtpForm.handleSubmit(handleForgotPasswordOtpSubmit)} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-sm font-semibold">Code OTP</Label>
            <Input
              id="otp"
              type="text"
              placeholder="Entrez le code reçu par email"
              {...forgotPasswordOtpForm.register("otp")}
              disabled={isForgotPasswordLoading}
              className="h-12 text-base border-2 focus:border-primary transition-colors"
            />
            {forgotPasswordOtpForm.formState.errors.otp && (
              <p className="text-xs text-destructive mt-1">
                {forgotPasswordOtpForm.formState.errors.otp.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Vérification...
              </>
            ) : (
              "Vérifier le code"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setForgotPasswordStep(1)}
            disabled={isForgotPasswordLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </form>
      )
    }

    if (forgotPasswordStep === 3) {
      return (
        <form onSubmit={forgotPasswordNewPasswordForm.handleSubmit(handleForgotPasswordNewPasswordSubmit)} className="space-y-5 sm:space-y-6">
          <div className="space-y-2">
            <Label htmlFor="new_password" className="text-sm font-semibold">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNewPassword ? "text" : "password"}
                placeholder="••••••••"
                {...forgotPasswordNewPasswordForm.register("new_password")}
                disabled={isForgotPasswordLoading}
                className="h-12 text-base border-2 focus:border-primary transition-colors pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isForgotPasswordLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {forgotPasswordNewPasswordForm.formState.errors.new_password && (
              <p className="text-xs text-destructive mt-1">
                {forgotPasswordNewPasswordForm.formState.errors.new_password.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm_new_password" className="text-sm font-semibold">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_new_password"
                type={showConfirmNewPassword ? "text" : "password"}
                placeholder="••••••••"
                {...forgotPasswordNewPasswordForm.register("confirm_new_password")}
                disabled={isForgotPasswordLoading}
                className="h-12 text-base border-2 focus:border-primary transition-colors pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                disabled={isForgotPasswordLoading}
              >
                {showConfirmNewPassword ? (
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Eye className="h-5 w-5 text-muted-foreground" />
                )}
              </Button>
            </div>
            {forgotPasswordNewPasswordForm.formState.errors.confirm_new_password && (
              <p className="text-xs text-destructive mt-1">
                {forgotPasswordNewPasswordForm.formState.errors.confirm_new_password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all"
            disabled={isForgotPasswordLoading}
          >
            {isForgotPasswordLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Réinitialisation...
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => setForgotPasswordStep(2)}
            disabled={isForgotPasswordLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
        </form>
      )
    }

    return null
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50 shadow-xl overflow-hidden">
        <CardHeader className="space-y-2 px-6 sm:px-8 pt-8 sm:pt-10 pb-6 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-center">
            {isForgotPassword ? "Réinitialisation du mot de passe" : "Connexion"}
          </CardTitle>
          <CardDescription className="text-center text-sm sm:text-base">
            {isForgotPassword
              ? forgotPasswordStep === 1
                ? "Entrez votre email pour recevoir un code de vérification"
                : forgotPasswordStep === 2
                ? "Entrez le code OTP reçu par email"
                : "Entrez votre nouveau mot de passe"
              : "Entrez vos identifiants pour accéder à votre compte"}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 sm:px-8 pb-6 sm:pb-8 pt-6">
          {isForgotPassword ? (
            renderForgotPasswordForm()
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email_or_phone" className="text-sm font-semibold">Email ou Téléphone</Label>
                <Input
                  id="email_or_phone"
                  type="text"
                  placeholder="exemple@email.com ou +225..."
                  {...register("email_or_phone")}
                  disabled={isLoading}
                  className="h-12 text-base border-2 focus:border-primary transition-colors"
                />
                {errors.email_or_phone && <p className="text-xs text-destructive mt-1">{errors.email_or_phone.message}</p>}
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember_me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember_me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Se souvenir de moi
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(true)
                    setForgotPasswordStep(1)
                  }}
                  className="text-sm text-primary hover:underline font-semibold"
                  disabled={isLoading}
                >
                  Mot de passe oublié?
                </button>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-3 px-6 sm:px-8 pb-8">
          {!isForgotPassword && (
            <div className="text-sm text-muted-foreground text-center">
              Pas encore de compte?{" "}
              <Link href="/signup" className="text-primary hover:underline font-semibold">
                Créer un compte
              </Link>
            </div>
          )}
        </CardFooter>
      </Card>

      <Card className="border-border/50 shadow-md">
        <CardContent className="p-6">
          <Button
            asChild
            variant="outline"
            className="w-full h-12 text-base font-medium flex items-center justify-center gap-2 border-2 hover:bg-muted/50 transition-all"
          >
            <a href={APK_DOWNLOAD_URL} download={APK_FILE_NAME} className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Télécharger l'application mobile
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
