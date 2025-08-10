"use client"

import { useState } from "react"
import { AuthCard } from "@/components/auth/AuthCard"
import { LoginForm } from "@/components/auth/LoginForm"
import Link from "next/link"
import { signIn } from "@/actions/auth"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setError("")
    setIsLoading(true)
    
    try {
      const result = await signIn({ email, password })
      
      if (result) {
        // signIn returns an error message if something went wrong
        setError(result)
      }
      // If result is undefined/null, the signin was successful and user was redirected
      
    } catch (err) {
      setError("Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard 
      title="Welcome Back"
      footer={
        <p>
          Don't have an account? <Link href="/signup">Sign up</Link>
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