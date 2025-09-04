"use server"

import { deleteUser, getUsers, updateUserRole } from "@/db/users"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function deleteUserAction(userId: number | string) {
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
  await updateUserRole(userId, newRole)
  
  // Revalidate paths
  revalidatePath('/users')
  revalidatePath('/admin')
  revalidatePath('/')
  
  return { success: true, message: `User role updated to ${newRole} successfully` }
}
