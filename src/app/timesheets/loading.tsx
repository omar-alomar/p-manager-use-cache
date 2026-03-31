export default function TimesheetLoading() {
  return (
    <div className="timesheet-page">
      {/* Day header skeleton */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div className="skeleton" style={{ width: 220, height: 28, borderRadius: 6 }} />
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <div className="skeleton" style={{ width: 120, height: 34, borderRadius: 6 }} />
          <div className="skeleton" style={{ width: 100, height: 34, borderRadius: 6 }} />
        </div>
      </div>

      {/* Weekly bar skeleton */}
      <div style={{ display: "flex", gap: 0, borderRadius: 12, overflow: "hidden", marginBottom: "1.5rem", border: "1px solid var(--neutral-200)" }}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} style={{ flex: 1, padding: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div className="skeleton" style={{ width: 28, height: 12 }} />
            <div className="skeleton" style={{ width: 36, height: 16 }} />
          </div>
        ))}
        <div style={{ padding: "0.75rem", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "var(--neutral-50)" }}>
          <div className="skeleton" style={{ width: 36, height: 12 }} />
          <div className="skeleton" style={{ width: 42, height: 16 }} />
        </div>
      </div>

      {/* Entries skeleton */}
      <div className="skeleton" style={{ width: 80, height: 12, marginBottom: "0.75rem" }} />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 64, borderRadius: i === 0 ? "12px 12px 0 0" : i === 2 ? "0 0 12px 12px" : 0, marginBottom: 0 }} />
      ))}
    </div>
  )
}
