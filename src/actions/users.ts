"use server"

import { getUsers } from "@/db/users"

export async function getUsersAction() {
  return await getUsers()
}