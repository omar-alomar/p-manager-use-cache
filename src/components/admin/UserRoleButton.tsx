"use client"

import { updateUserRoleAction } from "@/actions/users"
import { useTransition } from "react"

export function UserRoleButton({
  userId,
  currentRole,
  userName
}: {
  userId: number
  currentRole: string
  userName: string
}) {
  const [isPending, startTransition] = useTransition()

  const handleRoleChange = () => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const action = currentRole === 'admin' ? 'demote' : 'promote'

    if (!confirm(`Are you sure you want to ${action} "${userName}" to ${newRole}?`)) {
      return
    }

    startTransition(async () => {
      await updateUserRoleAction(userId, newRole)
    })
  }

  return (
    <button
      disabled={isPending}
      className={`admin-role-badge ${currentRole === 'admin' ? 'admin-role-badge--admin' : 'admin-role-badge--user'}`}
      onClick={handleRoleChange}
      title={`${currentRole === 'admin' ? 'Demote' : 'Promote'} ${userName}`}
    >
      {isPending ? (
        <div className="spinner-ring" style={{ width: 12, height: 12 }}></div>
      ) : (
        currentRole
      )}
    </button>
  )
}
