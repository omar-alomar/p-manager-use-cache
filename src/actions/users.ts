"use server"

import { deleteUser, getUsers } from "@/db/users"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export async function deleteUserAction(userId: number | string) {
  await deleteUser(userId)
  
  // Revalidate paths
  revalidatePath('/users')
  revalidatePath('/')
  
  redirect("/users")
}

export async function getUsersAction() {
  return getUsers()
}
