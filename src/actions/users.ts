"use server"

import { deleteUser, getUsers, updateUserRole, updateUserEmail, updateUserPassword } from "@/db/users"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/auth/currentUser"
import { hashPassword, generateSalt } from "@/auth/passwordHasher"


export async function deleteUserAction(userId: number | string) {
  // Check if user is admin
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== "admin") {
    throw new Error("Unauthorized: Only admins can delete users")
  }

  // Prevent admin from deleting themselves
  if (currentUser.id === Number(userId)) {
    throw new Error("Cannot delete your own account")
  }

  await deleteUser(userId)
  
  // Revalidate paths
  revalidatePath('/users')
  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: 'User deleted successfully', redirectTo: "/users" }
}

export async function getUsersAction() {
  return getUsers()
}

export async function updateUserRoleAction(userId: number | string, newRole: string) {
  // Check if user is admin
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update user roles")
  }

  // Prevent admin from demoting themselves
  if (currentUser.id === Number(userId) && newRole !== "admin") {
    throw new Error("Cannot demote your own admin privileges")
  }

  await updateUserRole(userId, newRole)
  
  // Revalidate paths
  revalidatePath('/users')
  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: `User role updated to ${newRole} successfully` }
}

export async function updateUserEmailAction(userId: number | string, newEmail: string) {
  // Check if user is admin
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update user emails")
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(newEmail)) {
    throw new Error("Invalid email format")
  }

  await updateUserEmail(userId, newEmail)
  
  // Revalidate paths
  revalidatePath('/users')
  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: 'User email updated successfully' }
}

export async function updateUserPasswordAction(userId: number | string, newPassword: string) {
  // Check if user is admin
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== "admin") {
    throw new Error("Unauthorized: Only admins can update user passwords")
  }

  // Validate password strength
  if (newPassword.length < 8) {
    throw new Error("Password must be at least 8 characters long")
  }

  // Generate salt and hash the new password using scrypt
  const salt = generateSalt()
  const hashedPassword = await hashPassword(newPassword, salt)

  await updateUserPassword(userId, hashedPassword, salt)
  
  // Revalidate paths
  revalidatePath('/users')
  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: 'User password updated successfully' }
}
