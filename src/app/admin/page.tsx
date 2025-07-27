
// app/admin/page.tsx

import Link from "next/link"

export default function AdminPage() {
  return (
    <div>
      <div className="page-title">
        <h1>WELCOME, ADMIN</h1>
        <div className="title-btns">
          <Link className="btn" href="/">
            Home
          </Link>
        </div>
      </div>
      
    </div>
  )
}