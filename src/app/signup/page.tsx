"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthCard } from "@/components/auth/AuthCard"
import { SignupForm } from "@/components/auth/SignupForm"
import Link from "next/link"
import { signUp } from "@/actions/auth"
import { useAuth } from "@/components/auth/AuthContext"

export default function SignupPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const { user } = useAuth()

  // Check if user is already authenticated
  useEffect(() => {
    if (user) {
      // User is already logged in, redirect to projects page
      router.push("/projects")
      return
    }
    setIsCheckingAuth(false)
  }, [user, router])

  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    setError("")
    setIsLoading(true)
    
    try {
      const result = await signUp(data)
      
      if (result) {
        // signUp returns an error message if something went wrong
        setError(result)
      } else {
        // Signup was successful, redirect immediately
        router.push("/projects")
      }
      
    } catch (_err) {
      setError("Failed to create account")
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
      title="Create Account"
      footer={
        <p>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      }
    >
      <SignupForm 
        onSubmit={handleSignup}
        error={error}
        isLoading={isLoading}
      />
    </AuthCard>
  )
}