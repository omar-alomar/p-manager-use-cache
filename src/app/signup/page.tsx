"use client"

import { useState } from "react"
import { AuthCard } from "@/components/auth/AuthCard"
import { SignupForm } from "@/components/auth/SignupForm"
import Link from "next/link"
import { signUp } from "@/actions/auth"

export default function SignupPage() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    setError("")
    setIsLoading(true)
    
    try {
      const result = await signUp(data)
      
      if (result) {
        // signUp returns an error message if something went wrong
        setError(result)
      }
      // If result is undefined/null, the signup was successful and user was redirected
      
    } catch (err) {
      setError("Failed to create account")
    } finally {
      setIsLoading(false)
    }
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