"use server"

import { deleteUser, getUsers, updateUserRole } from "@/db/users"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { getCurrentUser } from "@/auth/currentUser"


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
