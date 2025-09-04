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
      className={`role-btn role-${currentRole}`}
      onClick={handleRoleChange}
      title={`${currentRole === 'admin' ? 'Demote' : 'Promote'} ${userName} to ${currentRole === 'admin' ? 'user' : 'admin'}`}
      aria-label={`${currentRole === 'admin' ? 'Demote' : 'Promote'} ${userName}`}
    >
      {isPending ? (
        <div className="role-btn-spinner">
          <div className="spinner-ring"></div>
        </div>
      ) : (
        <>
          <span className="role-text">{currentRole}</span>
          <span className="role-arrow">
            {currentRole === 'admin' ? '↓' : '↑'}
          </span>
        </>
      )}
    </button>
  )
}
