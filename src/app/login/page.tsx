"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AuthCard } from "@/components/auth/AuthCard"
import { LoginForm } from "@/components/auth/LoginForm"
import { signIn, getPostLoginRedirect } from "@/actions/auth"
import { useAuth } from "@/components/auth/AuthContext"

const OAUTH_ERRORS: Record<string, string> = {
  no_account: "No account found for that Microsoft email. Contact your admin.",
  oauth_failed: "Microsoft sign-in failed. Please try again.",
  no_email: "Could not retrieve email from Microsoft. Please try again.",
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, checkAuth } = useAuth()

  // Show OAuth error from redirect
  useEffect(() => {
    const oauthError = searchParams.get("error")
    if (oauthError && OAUTH_ERRORS[oauthError]) {
      setError(OAUTH_ERRORS[oauthError])
    }
  }, [searchParams])

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      router.push("/projects")
      return
    }
    setIsCheckingAuth(false)
  }, [user, router])

  const handleLogin = async (email: string, password: string) => {
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn({ email, password })

      if (result) {
        setError(result)
      } else {
        await checkAuth()
        const redirect = await getPostLoginRedirect()
        router.push(redirect)
      }

    } catch {
      setError("Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner">Checking authentication...</div>
      </div>
    )
  }

  return (
    <AuthCard
      title="Welcome Back"
    >
      <LoginForm
        onSubmit={handleLogin}
        error={error}
        isLoading={isLoading}
      />
      <div className="auth-divider"><span>or</span></div>
      <a href="/api/auth/microsoft" className="microsoft-login-btn">
        <svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
          <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
          <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
          <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
        </svg>
        Sign in with Microsoft
      </a>
    </AuthCard>
  )
}