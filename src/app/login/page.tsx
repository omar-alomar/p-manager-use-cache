// Example: pages/login-example.tsx

"use client"

import { useState } from "react"
import { AuthCard } from "@/components/auth/AuthCard"
import { LoginForm } from "@/components/auth/LoginForm"
import Link from "next/link"

export default function LoginExample() {
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (email: string, password: string) => {
    setError("")
    setIsLoading(true)
    
    try {
      // Your auth logic here
      console.log("Login attempt:", { email, password })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Example: Call your auth service
      // const result = await authService.login(email, password)
      // if (result.success) {
      //   router.push('/dashboard')
      // } else {
      //   setError(result.error)
      // }
      
    } catch (err) {
      setError("Invalid email or password")
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