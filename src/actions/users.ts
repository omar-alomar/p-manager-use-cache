"use server"

import { getUsers, deleteUser, updateUserRole, updateUserEmail, updateUserPassword } from "@/db/users"

export async function getUsersAction() {
  return await getUsers()
}

export async function deleteUserAction(userId: string | number) {
  return await deleteUser(userId)
}

export async function updateUserRoleAction(userId: string | number, newRole: string) {
  return await updateUserRole(userId, newRole)
}

export async function updateUserEmailAction(userId: string | number, newEmail: string) {
  return await updateUserEmail(userId, newEmail)
}

export async function updateUserPasswordAction(userId: string | number, hashedPassword: string, salt: string) {
  return await updateUserPassword(userId, hashedPassword, salt)
}