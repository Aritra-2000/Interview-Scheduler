"use client"
export const dynamic = 'force-dynamic'
import { signIn, useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar, Loader2, ShieldCheck, Sparkles } from "lucide-react"

export default function Login() {
  const { status } = useSession()
  const router = useRouter()
  const sp = useSearchParams()
  const error = sp.get("error")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard")
    }
  }, [status, router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn("google", { callbackUrl: "/dashboard" })
    } catch (error) {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "OAuthSignin": return "Error occurred during sign in. Please try again."
      case "OAuthCallback": return "Error occurred during callback. Please try again."
      case "OAuthCreateAccount": return "Could not create account. Please try again."
      default: return "An error occurred. Please try again."
    }
  }

  return (
    <div className="min-h-screen bg-[#020203] text-slate-200 flex items-center justify-center p-4 selection:bg-indigo-500/30 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] relative z-10 flex flex-col items-center">
        {/* Brand */}
        <div className="mb-12 flex items-center gap-4 group cursor-pointer">
          <div className="w-14 h-14 rounded-[2rem] bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-2xl group-hover:rotate-12 transition-transform">
            <Calendar className="w-7 h-7 fill-white/10" strokeWidth={3} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-white text-3xl tracking-tighter leading-none italic">SYNAPSE</span>
            <span className="text-xs font-black tracking-[0.4em] uppercase text-indigo-400 opacity-60">Operations</span>
          </div>
        </div>

        {/* Login Card */}
        <Card className="w-full border border-white/5 bg-[#09090b]/50 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]">
          <CardHeader className="pt-10 pb-6 text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-500 text-[10px] font-black tracking-widest uppercase mx-auto mb-2">
              <ShieldCheck className="w-3 h-3" />
              Secure Authentication
            </div>
            <CardTitle className="text-3xl font-black text-white tracking-tight">Access Dashboard</CardTitle>
            <CardDescription className="text-slate-500 font-medium text-sm px-6">Sign in with your corporate or personal Google account to manage your sessions.</CardDescription>
          </CardHeader>

          <CardContent className="px-10 pb-12 space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-500/20 bg-red-500/10 rounded-2xl animate-in shake">
                <AlertDescription className="text-xs font-bold text-red-400 text-center">{getErrorMessage(error)}</AlertDescription>
              </Alert>
            )}

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading || status === "loading"}
              className="group relative w-full h-14 rounded-2xl bg-white text-black font-black text-base flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 hover:bg-slate-100 shadow-[0_10px_30px_-10px_rgba(255,255,255,0.2)]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )}
              {isLoading ? "Synchronizing..." : "Continue with Google"}
            </button>

            <div className="flex items-center gap-4 py-2">
              <div className="h-[1px] flex-1 bg-white/5" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Protected by AES-256</span>
              <div className="h-[1px] flex-1 bg-white/5" />
            </div>

            <p className="text-[10px] text-center text-slate-500 font-medium leading-relaxed uppercase tracking-widest px-8">
              By entering, you agree to our <span className="text-indigo-500 font-black cursor-pointer hover:text-indigo-400">Security Protocols</span> and <span className="text-indigo-500 font-black cursor-pointer hover:text-indigo-400">Terms</span>.
            </p>
          </CardContent>
        </Card>

        {/* Footer info */}
        <div className="mt-12 flex items-center gap-2 text-slate-600">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          <span className="text-[10px] font-black uppercase tracking-widest">Enterprise Orchestration Engine</span>
        </div>
      </div>
    </div>
  )
}
