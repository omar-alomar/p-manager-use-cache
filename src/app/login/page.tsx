"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthCard } from "@/components/auth/AuthCard"
import { LoginForm } from "@/components/auth/LoginForm"
import Link from "next/link"
import { signIn } from "@/actions/auth"
import { useAuth } from "@/components/auth/AuthContext"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { user, checkAuth } = useAuth()

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to projects page
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
        // signIn returns an error message if something went wrong
        setError(result)
      } else {
        // Login was successful, refresh auth state and redirect
        await checkAuth()
        router.push("/projects")
      }
      
    } catch (_err) {
      setError("Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading while checking authentication
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
      footer={
        <p>
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </p>
      }
    >
      <LoginForm 
        onSubmit={handleLogin}
        error={error}
        isLoading={isLoading}
      />
    </AuthCard>
  )
}