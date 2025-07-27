"use client"

import { useState } from "react"
import { AuthCard } from "@/components/auth/AuthCard"
import { SignupForm } from "@/components/auth/SignupForm"
import Link from "next/link"

export default function SignupExample() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async (data: { name: string; email: string; password: string }) => {
    setError("")
    setIsLoading(true)
    
    try {
      // Your signup logic here
      console.log("Signup attempt:", data)
      
      // Example: Call your auth service
      // const result = await authService.signup(data)
      // if (result.success) {
      //   router.push('/dashboard')
      // } else {
      //   setError(result.error)
      // }
      
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