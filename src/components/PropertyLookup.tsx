"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { updateProjectFieldAction } from "@/actions/projects"

// --- Types ---

interface SaleRecord {
  grantor: string
  date: string
  price: string
  conveyance: string
  liber: string
  folio: string
  mortgage: string
}

interface PropertyResult {
  accountId: string
  address: string
  city: string
  zip: string
  ownerOccupancy: string
  residenceType: string
  latitude: string
  longitude: string
  legalDescription: string[]
  deedLiber: string
  deedFolio: string
  platLiber: string
  platFolio: string
  zoning: string
  landUse: string
  subdivision: string
  lot: string
  map: string
  grid: string
  parcel: string
  yearBuilt: string
  structureSqFt: string
  landArea: string
  landUnit: string
  stories: string
  dwellingUnits: string
  construction: string
  buildingStyle: string
  dwellingGrade: string
  dwellingType: string
  water: string
  sewer: string
  landValue: string
  improvementValue: string
  totalAssessment: string
  sdatLink: string
  finderOnlineLink: string
  googleMapsLink: string
  sales: SaleRecord[]
}

interface Drawing {
  name: string
  folder: string
  description: string
  pdfUrl: string
}

interface EnvironmentalData {
  floodplain: {
    zone: string
    subtype: string
    isSpecialFloodHazard: boolean
  } | null
  soils: Array<{ symbol: string; description: string; hsg: string; className: string }>
  forestEasements: Array<{ subdivision: string; acres: string; bmpType: string; fileNumber: string }>
}

interface LookupResponse {
  results: PropertyResult[]
  sdatPage: {
    name1: string
    name2: string
    mailingAddress: string
    use: string
    principalResidence: string
    quality: string
    renovation: string
    plat: string
    assessLand: string
    assessImprove: string
    assessTotal: string
    assessPhaseIn: string
  } | null
  drawings: Drawing[]
  environmental: EnvironmentalData | null
  coordinatesFound: boolean
  error?: string
}

// --- Helpers ---

function formatCurrency(value: string): string {
  const num = parseInt(value, 10)
  if (isNaN(num) || num === 0) return value || "—"
  return "$" + num.toLocaleString()
}

function formatSdatDate(value: string): string {
  if (!value) return "—"
  const parts = value.split(".")
  if (parts.length === 3 && parts[0] !== "0000") return `${parts[1]}/${parts[2]}/${parts[0]}`
  return value
}

function displayValue(value: string): string {
  if (!value || value === "0" || value === "0000" || value === "00000" || value === "0000000") return "—"
  return value
}

// --- Sub-components ---

function Field({ label, value, link }: { label: string; value: string; link?: string }) {
  const display = displayValue(value)
  if (display === "—") return null
  return (
    <div className="property-field">
      <span className="property-field-label">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="property-field-link">{display}</a>
      ) : (
        <span className="property-field-value">{display}</span>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="property-section">
      <div className="property-section-title">{title}</div>
      <div className="property-grid">{children}</div>
    </div>
  )
}

// --- Main Component ---

export function PropertyLookup({ projectId, initialAddress }: { projectId: number; initialAddress?: string }) {
  const hasInitial = !!(initialAddress && initialAddress.trim())
  const [expanded, setExpanded] = useState(hasInitial)
  const [address, setAddress] = useState(initialAddress || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<LookupResponse | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const didAutoSearch = useRef(false)

  const handleSearch = useCallback(async (searchAddress?: string) => {
    const trimmed = (searchAddress ?? address).trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/property-lookup?address=${encodeURIComponent(trimmed)}`)
      const json = await res.json()
      if (!res.ok) { setError(json.error || "Lookup failed"); return }
      if (json.results.length === 0) { setError("No properties found for this address in Howard County."); return }
      setData(json)

      // Save the address to the project (fire-and-forget)
      if (trimmed !== initialAddress) {
        updateProjectFieldAction(projectId, "propertyAddress", trimmed).catch(() => {})
      }
    } catch {
      setError("Network error — could not reach property lookup service.")
    } finally {
      setLoading(false)
    }
  }, [address, initialAddress, projectId])

  // Auto-search on mount if project has a saved address
  useEffect(() => {
    if (hasInitial && !didAutoSearch.current) {
      didAutoSearch.current = true
      handleSearch(initialAddress)
    }
  }, [hasInitial, initialAddress, handleSearch])

  function landUnitLabel(unit: string): string {
    if (unit === "S") return "sq ft"
    if (unit === "A") return "acres"
    return unit || ""
  }

  return (
    <div className="property-lookup">
      {/* Header */}
      <div className="property-lookup-header" onClick={() => { setExpanded(!expanded); if (!expanded) setTimeout(() => inputRef.current?.focus(), 100) }}>
        <h3 className="open-section-title">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Property Lookup
        </h3>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`property-lookup-chevron ${expanded ? "expanded" : ""}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {expanded && (
        <>
          {/* Search bar */}
          <div className="property-search-bar">
            <input ref={inputRef} type="text" className="property-search-input" placeholder="Enter address (e.g. 8000 Main St)" value={address} onChange={(e) => setAddress(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }} disabled={loading} />
            <button className="property-search-btn" onClick={() => handleSearch()} disabled={loading || !address.trim()}>
              {loading ? <span className="property-search-spinner" /> : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                  Search
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="property-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          )}

          {loading && (
            <div className="property-loading">
              <div className="property-loading-spinner" />
              <span>Searching property records...</span>
            </div>
          )}

          {data && data.results.length > 0 && (
            <div className="property-results">
              {data.results.length > 1 && (
                <div className="property-results-count">{data.results.length} properties found</div>
              )}

              {data.results.map((result, index) => (
                <ResultCard
                  key={index}
                  result={result}
                  sdatPage={index === 0 ? data.sdatPage : null}
                  landUnitLabel={landUnitLabel}
                  index={index}
                  total={data.results.length}
                />
              ))}

              {/* Scanned Drawings */}
              {data.drawings.length > 0 && (
                <div className="property-result-card">
                  <div className="property-section">
                    <div className="property-section-title">Scanned Drawings & Plats ({data.drawings.length})</div>
                    <div className="property-drawings-list">
                      {data.drawings.map((d, i) => (
                        <div key={i} className="property-drawing-item">
                          <div className="property-drawing-info">
                            <span className="property-drawing-name">{d.name}</span>
                            {d.folder && <span className="property-drawing-folder">{d.folder.replace(/_/g, " ")}</span>}
                            {d.description && <span className="property-drawing-desc">{d.description}</span>}
                          </div>
                          {d.pdfUrl && (
                            <a href={d.pdfUrl} target="_blank" rel="noopener noreferrer" className="property-drawing-link">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                              PDF
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Environmental */}
              {data.environmental && (
                <div className="property-result-card property-env-card">
                  {/* Floodplain */}
                  <div className="property-section">
                    <div className="property-section-title">Floodplain</div>
                    {data.environmental.floodplain ? (
                      <div className="property-grid">
                        <div className="property-field">
                          <span className="property-field-label">Status</span>
                          <span className={`property-env-badge ${data.environmental.floodplain.isSpecialFloodHazard ? "flood" : "no-flood"}`}>
                            {data.environmental.floodplain.isSpecialFloodHazard ? "In Special Flood Hazard Area" : "Not in Special Flood Hazard Area"}
                          </span>
                        </div>
                        <Field label="Flood Zone" value={data.environmental.floodplain.zone} />
                        <Field label="Zone Subtype" value={data.environmental.floodplain.subtype} />
                      </div>
                    ) : (
                      <span className="property-env-clear">Not in a mapped floodplain</span>
                    )}
                  </div>

                  {/* Soils */}
                  <div className="property-section">
                    <div className="property-section-title">Soils</div>
                    {data.environmental.soils.length > 0 ? (
                      <div className="property-env-features">
                        {data.environmental.soils.map((soil, i) => (
                          <div key={i} className="property-soil-item">
                            <div className="property-grid">
                              <Field label="Symbol" value={soil.symbol} />
                              <Field label="Hydrologic Group" value={soil.hsg} />
                              <Field label="Class" value={soil.className} />
                              {soil.description && <Field label="Description" value={soil.description} />}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="property-env-clear">No soil data at this location</span>
                    )}
                  </div>

                  {/* Forest Conservation Easements */}
                  <div className="property-section">
                    <div className="property-section-title">Forest Conservation Easements</div>
                    {data.environmental.forestEasements.length > 0 ? (
                      <div className="property-env-features">
                        {data.environmental.forestEasements.map((e, i) => (
                          <div key={i} className="property-soil-item">
                            <div className="property-grid">
                              <Field label="Subdivision" value={e.subdivision} />
                              <Field label="Acres" value={e.acres} />
                              <Field label="BMP Type" value={e.bmpType} />
                              <Field label="File Number" value={e.fileNumber} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="property-env-clear">No forest conservation easements</span>
                    )}
                  </div>
                </div>
              )}

              {!data.coordinatesFound && (
                <div className="property-env-note-block">
                  Coordinates not found — environmental data and scanned drawings unavailable.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// --- Result Card ---

function ResultCard({
  result,
  sdatPage,
  landUnitLabel,
  index,
  total,
}: {
  result: PropertyResult
  sdatPage: LookupResponse["sdatPage"]
  landUnitLabel: (unit: string) => string
  index: number
  total: number
}) {
  const [collapsed, setCollapsed] = useState(index > 0)

  return (
    <div className="property-result-card">
      <div className="property-result-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="property-result-header-left">
          <span className="property-result-address">{total > 1 ? `${index + 1}. ` : ""}{(result.address || "Unknown").trim()}</span>
          <span className="property-result-city">{[result.city, result.zip].filter(Boolean).join(" ")}</span>
        </div>
        <div className="property-result-header-right">
          <span className="property-result-acct">Acct: {result.accountId}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`property-lookup-chevron ${collapsed ? "" : "expanded"}`}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Owner (from SDAT detail page — authoritative) */}
          {sdatPage && (sdatPage.name1 || sdatPage.name2) && (
            <Section title="Owner">
              {sdatPage.name1 && <Field label="Owner" value={sdatPage.name1} />}
              {sdatPage.name2 && <Field label="Owner 2" value={sdatPage.name2} />}
              {sdatPage.mailingAddress && <Field label="Mailing Address" value={sdatPage.mailingAddress} />}
              {sdatPage.use && <Field label="Use" value={sdatPage.use} />}
              {sdatPage.principalResidence && <Field label="Principal Residence" value={sdatPage.principalResidence} />}
              {sdatPage.plat && sdatPage.plat !== "0" && <Field label="Plat" value={sdatPage.plat} />}
            </Section>
          )}

          {/* Property Info */}
          <Section title="Property Info">
            <Field label="Zoning" value={result.zoning} />
            <Field label="Land Use" value={result.landUse} />
            <Field label="Residence Type" value={result.residenceType} />
            <Field label="Map" value={result.map} />
            <Field label="Grid" value={result.grid} />
            <Field label="Parcel" value={result.parcel} />
            <Field label="Lot" value={result.lot} />
            <Field label="Subdivision" value={result.subdivision} />
          </Section>

          {/* Building */}
          <Section title="Building">
            <Field label="Year Built" value={result.yearBuilt} />
            {sdatPage?.renovation && <Field label="Last Renovation" value={sdatPage.renovation} />}
            <Field label="Structure Sq Ft" value={result.structureSqFt ? Number(result.structureSqFt).toLocaleString() : ""} />
            <Field label="Land Area" value={result.landArea ? `${Number(result.landArea).toLocaleString()} ${landUnitLabel(result.landUnit)}` : ""} />
            <Field label="Stories" value={result.stories} />
            <Field label="Dwelling Units" value={result.dwellingUnits} />
            <Field label="Construction" value={result.construction} />
            <Field label="Building Style" value={result.buildingStyle} />
            <Field label="Quality" value={
              sdatPage?.quality && result.dwellingGrade
                ? `${sdatPage.quality} — ${result.dwellingGrade}`
                : sdatPage?.quality || result.dwellingGrade || ""
            } />
            <Field label="Dwelling Type" value={result.dwellingType} />
          </Section>

          {/* Deed & Legal */}
          <Section title="Deed & Legal">
            <Field label="Deed Liber" value={result.deedLiber} />
            <Field label="Deed Folio" value={result.deedFolio} />
            <Field label="Plat Liber" value={result.platLiber} />
            <Field label="Plat Folio" value={result.platFolio} />
            {result.legalDescription.length > 0 && (
              <div className="property-field property-field-wide">
                <span className="property-field-label">Legal Description</span>
                <span className="property-field-value">{result.legalDescription.join(" · ")}</span>
              </div>
            )}
          </Section>

          {/* Utilities */}
          <Section title="Utilities">
            <Field label="Water" value={result.water} />
            <Field label="Sewer" value={result.sewer} />
          </Section>

          {/* Assessment (SDAT page values preferred — API can lag) */}
          <Section title="Assessment">
            <Field label="Land Value" value={sdatPage?.assessLand ? `$${sdatPage.assessLand}` : formatCurrency(result.landValue)} />
            <Field label="Improvement Value" value={sdatPage?.assessImprove ? `$${sdatPage.assessImprove}` : formatCurrency(result.improvementValue)} />
            <Field label="Total Assessment" value={sdatPage?.assessTotal ? `$${sdatPage.assessTotal}` : formatCurrency(result.totalAssessment)} />
            {sdatPage?.assessPhaseIn && <Field label="Phase-In Value" value={`$${sdatPage.assessPhaseIn}`} />}
          </Section>

          {/* Sales History */}
          {result.sales.length > 0 && (
            <div className="property-section">
              <div className="property-section-title">Sales History</div>
              <div className="property-sales-list">
                {result.sales.map((sale, i) => (
                  <div key={i} className="property-sale-item">
                    <div className="property-grid">
                      <Field label="Date" value={formatSdatDate(sale.date)} />
                      <Field label="Price" value={formatCurrency(sale.price)} />
                      <Field label="Grantor" value={sale.grantor} />
                      <Field label="Conveyance" value={sale.conveyance} />
                      <Field label="Deed Liber" value={sale.liber} />
                      <Field label="Deed Folio" value={sale.folio} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          <Section title="Links">
            <Field label="SDAT Detail" value={result.sdatLink ? "View on SDAT" : ""} link={result.sdatLink} />
            <Field
              label="HC Interactive Map"
              value={result.latitude && result.longitude ? "View on HC Map" : ""}
              link={result.latitude && result.longitude ? `https://data.howardcountymd.gov/InteractiveMap.html?Lat=${result.longitude}&Long=${result.latitude}` : undefined}
            />
            <Field label="Google Maps" value={result.googleMapsLink ? "View on Map" : ""} link={result.googleMapsLink} />
            <Field label="MD FinderOnline" value={result.finderOnlineLink ? "View on FinderOnline" : ""} link={result.finderOnlineLink} />
          </Section>
        </>
      )}
    </div>
  )
}
