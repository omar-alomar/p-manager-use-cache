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
          </div>

          <h3 className="changelog-subheading">1.1.1</h3>
          <time className="changelog-date">2026-03-14</time>
          <p className="changelog-summary">
            Bug fixes and minor improvements.
          </p>
          <ul className="changelog-changes">
            <li>Task archiving: tasks completed for more than 30 days are automatically archived.</li>
            <li>
              Milestone APFO flag: milestones can now be marked as APFOs:
              <div className="changelog-media changelog-media-row">
                <img src="/changelog/milestoneAPFO.png" alt="Milestone APFO flag" />
                <img src="/changelog/milestoneAPFO2.png" alt="Milestone APFO flag detail" />
              </div>
            </li>
            <li>
              You can now see who has assigned you tasks:
              <div className="changelog-media changelog-media-xs">
                <img src="/changelog/viaMashid.png" alt="Task assigned by indicator" />
              </div>
            </li>
          </ul>

          <h3 className="changelog-subheading">1.1.0</h3>
          <time className="changelog-date">2026-03-05</time>
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
