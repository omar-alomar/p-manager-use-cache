// app/private/page.tsx

import Link from "next/link"

export default function PrivatePage() {
  return (
    <div>
      <div className="page-title">
        <h1>PRIVATE</h1>
        <div className="title-btns">
          <button className="btn">
            Switch Role
          </button>
          <Link className="btn" href="/">
            Home
          </Link>
        </div>
      </div>
      
      {/* Rest of your private page content */}
      <div className="content">
        <p>Private page content goes here.</p>
      </div>
    </div>
  )
}