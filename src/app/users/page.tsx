import { getUsers } from "@/db/users"
import Link from "next/link"

export default async function UsersPage() {
  const users = await getUsers()

  return (
    <>
      <h1 className="page-title">Team</h1>
      <div className="card-grid">
        {users.map(user => (
          <div key={user.id} className="card">
            <div className="card-header">{user.name}</div>
            <div className="card-body">
              <div>{user.email}</div>
            </div>
            <div className="card-footer">
              <Link className="btn" href={`users/${user.id.toString()}`}>
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
