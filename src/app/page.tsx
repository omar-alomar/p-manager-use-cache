import { redirect } from "next/navigation"
import { getCurrentUser } from "@/auth/currentUser"

export default async function HomePage() {
  // Check if user is authenticated
  const user = await getCurrentUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect("/login")
  }
  
  // Redirect to projects if authenticated
  redirect("/projects")
}
