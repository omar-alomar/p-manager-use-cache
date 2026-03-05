import Link from "next/link"
import { getCurrentUser } from "@/auth/currentUser"
import { markVersionSeen } from "@/actions/auth"
import { APP_VERSION } from "@/constants/version"
import { EnchantedText } from "@/components/EnchantedText"

export default async function ChangelogPage() {
  try {
    const user = await getCurrentUser({})
    if (user) {
      await markVersionSeen()
    }
  } catch {
    // Not logged in — no-op
  }

  return (
    <>
      <div className="page-title">
        <div className="title-content">
          <h1>Changelog</h1>
          <EnchantedText />
        </div>
      </div>

      <div className="changelog-list">
        <article className="changelog-entry">
          <div className="changelog-header">
            <span className="changelog-version">α {APP_VERSION}</span>
            <time className="changelog-date">2026-03-05</time>
          </div>
          <p className="changelog-summary">
            Dashboard overhaul, improved task management, and visual polish across the platform.
          </p>
          <ul className="changelog-changes">
            <li>New <Link href="/dashboard">dashboard</Link> with project statistics and recent activity overview.</li>
            <li><Link href="/my-tasks">Tasks</Link> page: you can now easily keep track of tasks you've assigned to others.</li>
            <li>
              Active tasks now displayed in the projects table:
              <div className="changelog-media changelog-media-sm">
                <img src="/changelog/TasksHover.gif" alt="Tasks hover preview in projects table" />
              </div>
            </li>
            <li>Design overhaul — refreshed cards, badges, navigation, and page layouts.</li>
            <li>Changelog (you&apos;re here!) — click the <span className="changelog-version">α {APP_VERSION}</span> badge in the top left to return here at any time.</li>
            <li>
            Project archives - just swipe to archive or unarchive projects:
              <div className="changelog-media">
                <img src="/changelog/ArchiveSwipe.gif" alt="Archive swipe preview in projects table" />
              </div>
            </li>
          </ul>
        </article>
      </div>
    </>
  )
}
