import { NextRequest, NextResponse } from "next/server"

// --- Address parsing ---

function parseAddress(input: string) {
  // Strip city/state/zip after comma: "8000 Main St, Ellicott City, MD 21043" → "8000 Main St"
  let cleaned = input.trim().split(",")[0].trim()

  // Strip suite/unit suffixes: "8000 Main St Ste 200" → "8000 Main St"
  cleaned = cleaned.replace(/\s+(STE|SUITE|UNIT|APT|#)\s*\S*$/i, "")

  const numberMatch = cleaned.match(/^(\d+[A-Za-z]?)\s+(.+)/)

  let rawNumber = ""
  let streetPart = cleaned

  if (numberMatch) {
    rawNumber = numberMatch[1]
    streetPart = numberMatch[2]
  }

  const typesSorted = [
    "STREET", "DRIVE", "COURT", "LANE", "ROAD", "AVENUE", "BOULEVARD",
    "PLACE", "CIRCLE", "TERRACE", "PARKWAY", "HIGHWAY", "TRAIL",
    "ST", "DR", "CT", "LN", "RD", "AVE", "BLVD", "PL", "WAY",
    "CIR", "TER", "PKWY", "PKY", "HWY", "TRL", "PIKE",
  ]

  let streetName = streetPart.toUpperCase().replace(/\.$/, "")

  for (const type of typesSorted) {
    const regex = new RegExp(`\\s+${type}\\.?$`)
    if (regex.test(streetName)) {
      streetName = streetName.replace(regex, "").trim()
      break
    }
  }

  const sdatNumber = rawNumber
    ? rawNumber.replace(/[A-Za-z]/g, "").padStart(5, "0")
    : ""

  return { rawNumber, sdatNumber, streetName: streetName.trim() }
}

// --- Fetch with timeout ---

async function fetchSafe(url: string, timeout = 12000): Promise<Response | null> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" })
    clearTimeout(id)
    return res
  } catch {
    clearTimeout(id)
    return null
  }
}

// --- XML parser for HC DataExplorer ---

function parseDataExplorerXml(xml: string): Record<string, string>[] {
  const results: Record<string, string>[] = []
  const tableRegex = /<Table[^/>][^>]*>([\s\S]*?)<\/Table[^>]*>/g
  let tableMatch
  while ((tableMatch = tableRegex.exec(xml)) !== null) {
    const row: Record<string, string> = {}
    const fieldRegex = /<(\w+)>([\s\S]*?)<\/\1>/g
    let fieldMatch
    while ((fieldMatch = fieldRegex.exec(tableMatch[1])) !== null) {
      row[fieldMatch[1]] = fieldMatch[2].trim()
    }
    if (Object.keys(row).length > 0) results.push(row)
  }
  return results
}

// Extract URL from HTML-encoded anchor tag like &lt;a href="..."&gt;...&lt;/a&gt;
function extractPdfUrl(raw: string): string {
  if (!raw) return ""
  // Decode HTML entities
  const decoded = raw
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
  const match = decoded.match(/href="([^"]+)"/)
  return match ? match[1] : ""
}

// --- SDAT field extraction ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractUrl(value: any): string {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value.url) return value.url
  return ""
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSdatProperty(rec: Record<string, any>) {
  const get = (key: string) => rec[key] || ""

  const legal = [
    get("legal_description_line_1_mdp_field_legal1_sdat_field_17"),
    get("legal_description_line_2_mdp_field_legal2_sdat_field_18"),
    get("legal_description_line_3_mdp_field_legal3_sdat_field_19"),
  ].filter(Boolean)

  const sales = []

  // Segment 1
  const s1Grantor = get("sales_segment_1_grantor_name_mdp_field_grntnam1_sdat_field_80")
  if (s1Grantor) {
    sales.push({
      grantor: s1Grantor,
      date: get("sales_segment_1_transfer_date_yyyy_mm_dd_mdp_field_tradate_sdat_field_89"),
      price: get("sales_segment_1_consideration_mdp_field_considr1_sdat_field_90"),
      conveyance: get("sales_segment_1_how_conveyed_ind_mdp_field_convey1_sdat_field_87"),
      liber: get("sales_segment_1_grantor_deed_reference_1_liber_mdp_field_gr1libr1_sdat_field_82"),
      folio: get("sales_segment_1_grantor_deed_reference_1_folio_mdp_field_gr1folo1_sdat_field_83"),
      mortgage: get("sales_segment_1_mortgage_mdp_field_mortgag1_sdat_field_92"),
    })
  }

  // Segment 2 (different field name pattern)
  const s2Grantor = get("sales_segment_2_grantor_name_sdat_field_100")
  if (s2Grantor) {
    sales.push({
      grantor: s2Grantor,
      date: get("sales_segment_2_transfer_date_yyyy_mm_dd_sdat_field_109"),
      price: get("sales_segment_2_consideration_sdat_field_110"),
      conveyance: get("sales_segment_2_how_conveyed_ind_sdat_field_107"),
      liber: get("sales_segment_2_grantor_deed_reference_1_liber_sdat_field_102"),
      folio: get("sales_segment_2_grantor_deed_reference_1_folio_sdat_field_103"),
      mortgage: get("sales_segment_2_mortgage_sdat_field_112"),
    })
  }

  // Segment 3
  const s3Grantor = get("sales_segment_3_grantor_name_sdat_field_120")
  if (s3Grantor) {
    sales.push({
      grantor: s3Grantor,
      date: get("sales_segment_3_transfer_date_yyyy_mm_dd_sdat_field_129"),
      price: get("sales_segment_3_consideration_sdat_field_130"),
      conveyance: get("sales_segment_3_how_conveyed_ind_sdat_field_127"),
      liber: get("sales_segment_3_grantor_deed_reference_1_liber_sdat_field_122"),
      folio: get("sales_segment_3_grantor_deed_reference_1_folio_sdat_field_123"),
      mortgage: get("sales_segment_3_mortgage_sdat_field_132"),
    })
  }

  return {
    accountId: get("account_id_mdp_field_acctid"),
    address: get("mdp_street_address_mdp_field_address"),
    city: get("mdp_street_address_city_mdp_field_city"),
    zip: get("mdp_street_address_zip_code_mdp_field_zipcode"),
    ownerOccupancy: get("record_key_owner_occupancy_code_mdp_field_ooi_sdat_field_6"),
    residenceType: get("mdp_street_address_type_code_mdp_field_resityp"),
    latitude: get("mdp_latitude_mdp_field_digycord_converted_to_wgs84"),
    longitude: get("mdp_longitude_mdp_field_digxcord_converted_to_wgs84"),

    legalDescription: legal,
    deedLiber: get("deed_reference_1_liber_mdp_field_dr1liber_sdat_field_30"),
    deedFolio: get("deed_reference_1_folio_mdp_field_dr1folio_sdat_field_31"),
    platLiber: get("plat_reference_liber_mdp_field_pltliber_sdat_field_267"),
    platFolio: get("plat_reference_folio_mdp_field_pltfolio_sdat_field_268"),

    zoning: get("zoning_code_mdp_field_zoning_sdat_field_45"),
    landUse: get("land_use_code_mdp_field_lu_desclu_sdat_field_50"),
    subdivision: get("subdivision_code_mdp_field_subdivsn_sdat_field_37"),
    lot: get("lot_mdp_field_lot_sdat_field_41"),
    map: get("map_mdp_field_map_sdat_field_42"),
    grid: get("grid_mdp_field_grid_sdat_field_43"),
    parcel: get("parcel_mdp_field_parcel_sdat_field_44"),

    yearBuilt: get("c_a_m_a_system_data_year_built_yyyy_mdp_field_yearblt_sdat_field_235"),
    structureSqFt: get("c_a_m_a_system_data_structure_area_sq_ft_mdp_field_sqftstrc_sdat_field_241"),
    landArea: get("c_a_m_a_system_data_land_area_mdp_field_landarea_sdat_field_242"),
    landUnit: get("c_a_m_a_system_data_land_unit_of_measure_mdp_field_luom_sdat_field_243"),
    stories: get("c_a_m_a_system_data_number_of_stories_mdp_field_bldg_story_sdat_field_240"),
    dwellingUnits: get("c_a_m_a_system_data_number_of_dwelling_units_mdp_field_bldg_units_sdat_field_239"),
    construction: get("additional_c_a_m_a_data_dwelling_construction_code_mdp_field_strucnst_sdat_field_263"),
    buildingStyle: get("additional_c_a_m_a_data_building_style_code_and_description_mdp_field_strustyl_descstyl_sdat_field_264"),
    dwellingGrade: get("c_a_m_a_system_data_dwelling_grade_code_and_description_mdp_field_strugrad_strudesc_sdat_field_230"),
    dwellingType: get("additional_c_a_m_a_data_dwelling_type_mdp_field_strubldg_sdat_field_265"),

    water: get("property_factors_utilities_water_mdp_field_pfuw_sdat_field_63"),
    sewer: get("property_factors_utilities_sewer_mdp_field_pfus_sdat_field_64"),

    landValue: get("current_cycle_data_land_value_mdp_field_names_nfmlndvl_curlndvl_and_sallndvl_sdat_field_164"),
    improvementValue: get("current_cycle_data_improvements_value_mdp_field_names_nfmimpvl_curimpvl_and_salimpvl_sdat_field_165"),
    totalAssessment: get("current_assessment_year_total_assessment_sdat_field_172"),

    sdatLink: extractUrl(rec["real_property_search_link"]),
    finderOnlineLink: extractUrl(rec["finder_online_link"]),
    googleMapsLink: extractUrl(rec["search_google_maps_for_this_location"]),

    sales,
  }
}

// --- WFS helpers ---

function buildWfsUrl(layer: string, x: string, y: string) {
  const base = "https://hcgeoserver.howardcountymd.gov:8443/geoserver/general/wfs"
  const params = new URLSearchParams({
    service: "WFS",
    request: "GetFeature",
    typeName: `general:${layer}`,
    CQL_FILTER: `INTERSECTS(geom,POINT(${x} ${y}))`,
    outputFormat: "application/json",
  })
  return `${base}?${params.toString()}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFloodplain(geojson: any) {
  if (!geojson?.features?.length) return null
  const props = geojson.features[0].properties
  return {
    zone: props.FLD_ZONE || props.fld_zone || "",
    subtype: props.ZONE_SUBTY || props.zone_subty || "",
    isSpecialFloodHazard: (props.SFHA_TF || props.sfha_tf) === "T",
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractSoils(geojson: any) {
  if (!geojson?.features?.length) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geojson.features.map((f: any) => ({
    symbol: f.properties.MUSYM || f.properties.musym || "",
    description: f.properties.Description || f.properties.description || f.properties.MUNAME || "",
    hsg: f.properties.HSG || f.properties.hsg || "",
    className: f.properties.CLASS || f.properties.class || "",
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractForestEasements(geojson: any) {
  if (!geojson?.features?.length) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geojson.features.map((f: any) => ({
    subdivision: f.properties.Subdivision || f.properties.SUBDIVISION || "",
    acres: f.properties.Acres || f.properties.ACRES || "",
    bmpType: f.properties.BMP_Type || f.properties.BMP_TYPE || "",
    fileNumber: f.properties.File_Number || f.properties.FILE_NUMBER || "",
  }))
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractDrawingsFromWfs(geojson: any) {
  if (!geojson?.features?.length) return []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return geojson.features.map((f: any) => {
    const p = f.properties
    const name = p.Name || p.name || ""
    const folder = p.Folder || p.folder || ""
    return {
      name,
      folder,
      description: p.Description || p.description || "",
      pdfUrl: (folder && name) ? `http://data.howardcountymd.gov/scannedpdf/${folder}/${name}.PDF` : "",
    }
  })
}

// --- Main handler ---

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")
  if (!address || address.trim().length < 2) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 })
  }

  const parsed = parseAddress(address)
  if (!parsed.streetName) {
    return NextResponse.json({ error: "Could not parse street name from address" }, { status: 400 })
  }

  // ── Phase 1: SDAT + HC DataExplorer SearchAddresses (parallel) ──

  const sdatParams = new URLSearchParams({
    jurisdiction_code_mdp_field_jurscode: "HOWA",
    $limit: "10",
  })
  if (parsed.sdatNumber) {
    sdatParams.set("premise_address_number_mdp_field_premsnum_sdat_field_20", parsed.sdatNumber)
  }
  sdatParams.set("premise_address_name_mdp_field_premsnam_sdat_field_23", parsed.streetName)

  const sdatUrl = `https://opendata.maryland.gov/resource/ed4q-f8tm.json?${sdatParams.toString()}`
  const hcSearchUrl = `https://data.howardcountymd.gov/DataExplorer/DataExplorerWebServices.asmx/SearchAddresses?MyNumber=${encodeURIComponent(parsed.rawNumber)}&MyStreet=${encodeURIComponent(parsed.streetName)}`

  const [sdatRes, hcSearchRes] = await Promise.all([
    fetchSafe(sdatUrl),
    fetchSafe(hcSearchUrl),
  ])

  // Parse SDAT
  let sdatResults: ReturnType<typeof extractSdatProperty>[] = []
  if (sdatRes?.ok) {
    try {
      const json = await sdatRes.json()
      if (Array.isArray(json)) sdatResults = json.map(extractSdatProperty)
    } catch { /* continue */ }
  }

  // Parse HC SearchAddresses for coordinates
  let coordinates: { x: string; y: string } | null = null
  if (hcSearchRes?.ok) {
    try {
      const xml = await hcSearchRes.text()
      const rows = parseDataExplorerXml(xml)
      if (rows.length > 0 && rows[0].MyX && rows[0].MyY) {
        coordinates = { x: rows[0].MyX, y: rows[0].MyY }
      }
    } catch { /* continue */ }
  }

  // ── Phase 2: Owner from SDAT detail page + plat from HC DataExplorer (parallel) ──

  const first = sdatResults[0]
  interface SdatPageData {
    name1: string
    name2: string
    mailingAddress: string
    use: string
    principalResidence: string
    quality: string
    renovation: string
    plat: string
    // Authoritative assessment values (may differ from API)
    assessLand: string
    assessImprove: string
    assessTotal: string
    assessPhaseIn: string
  }
  let sdatPage: SdatPageData | null = null

  if (first) {
    const sdatDetailUrl = first.sdatLink
    const hcTaxIdUrl = first.accountId
      ? `https://data.howardcountymd.gov/DataExplorer/DataExplorerWebServices.asmx/QueryPropertyByTaxID?MyTaxID=${encodeURIComponent(first.accountId)}`
      : null

    const [sdatPageRes, hcTaxRes] = await Promise.all([
      sdatDetailUrl ? fetchSafe(sdatDetailUrl) : Promise.resolve(null),
      hcTaxIdUrl ? fetchSafe(hcTaxIdUrl) : Promise.resolve(null),
    ])

    // Extract fields from SDAT detail page HTML (authoritative source)
    const pageData: Partial<SdatPageData> = {}

    if (sdatPageRes?.ok) {
      try {
        const html = await sdatPageRes.text()
        const scrape = (idFragment: string): string => {
          const re = new RegExp(idFragment + '[^"]*_0"[^>]*>([^<]+)<')
          const m = html.match(re)
          return m ? m[1].trim() : ""
        }
        // Owner (exact IDs to avoid lblOwnerName matching lblOwnerName2)
        const mOwner1 = html.match(/lblOwnerName_0"[^>]*>([^<]+)</)
        const mOwner2 = html.match(/lblOwnerName2_0"[^>]*>([^<]+)</)
        if (mOwner1) pageData.name1 = mOwner1[1].trim()
        if (mOwner2) pageData.name2 = mOwner2[1].trim()
        pageData.mailingAddress = scrape("lblMailingAddress")
        pageData.use = scrape("lblUse")
        pageData.principalResidence = scrape("lblPrinResidence")
        pageData.quality = scrape("lblQuality")
        pageData.renovation = scrape("lblRenovation")
        // Assessment values (authoritative — API can lag behind)
        pageData.assessLand = scrape("lblBaseLandNow")
        pageData.assessImprove = scrape("lblBaseImproveNow")
        pageData.assessTotal = scrape("lblAssesTotal")
        pageData.assessPhaseIn = scrape("lblPhaseInTotal")
      } catch { /* continue */ }
    }

    // Extract plat from HC DataExplorer
    let plat = ""
    if (hcTaxRes?.ok) {
      try {
        const xml = await hcTaxRes.text()
        const rows = parseDataExplorerXml(xml)
        if (rows.length > 0) plat = rows[0].PLAT || ""
      } catch { /* continue */ }
    }
    pageData.plat = plat

    if (pageData.name1 || pageData.name2) {
      sdatPage = pageData as SdatPageData
    }
  }

  // ── Phase 3: WFS environmental + spatial scanned drawings (parallel) ──

  const wfsPromises: Promise<Response | null>[] = []
  if (coordinates) {
    wfsPromises.push(
      fetchSafe(buildWfsUrl("Floodplain", coordinates.x, coordinates.y)),
      fetchSafe(buildWfsUrl("Soils", coordinates.x, coordinates.y)),
      fetchSafe(buildWfsUrl("Forest_Conservation_Easements", coordinates.x, coordinates.y)),
      fetchSafe(buildWfsUrl("Scanned_Drawings_Public", coordinates.x, coordinates.y)),
    )
  }

  // Also search HC DataExplorer drawings by plat number
  let hcDrawingRes: Response | null = null
  if (sdatPage?.plat && sdatPage.plat !== "0" && sdatPage.plat !== "") {
    hcDrawingRes = await fetchSafe(
      `https://data.howardcountymd.gov/DataExplorer/DataExplorerWebServices.asmx/QueryScannedDrawingsByNumber?DrawingNumber=${encodeURIComponent(sdatPage.plat)}`
    )
  }

  const wfsResults = await Promise.all(wfsPromises)

  // Parse environmental
  let environmental = null
  if (wfsResults.length >= 3) {
    let floodplain = null
    let soils: ReturnType<typeof extractSoils> = []
    let forestEasements: ReturnType<typeof extractForestEasements> = []

    try { if (wfsResults[0]?.ok) floodplain = extractFloodplain(await wfsResults[0].json()) } catch { /* skip */ }
    try { if (wfsResults[1]?.ok) soils = extractSoils(await wfsResults[1].json()) } catch { /* skip */ }
    try { if (wfsResults[2]?.ok) forestEasements = extractForestEasements(await wfsResults[2].json()) } catch { /* skip */ }

    environmental = { floodplain, soils, forestEasements }
  }

  // Parse scanned drawings — merge WFS spatial results + HC DataExplorer plat results
  interface Drawing { name: string; folder: string; description: string; pdfUrl: string }
  const drawingsMap = new Map<string, Drawing>()

  // From WFS spatial query
  if (wfsResults.length >= 4 && wfsResults[3]?.ok) {
    try {
      const drawings = extractDrawingsFromWfs(await wfsResults[3].json())
      for (const d of drawings) {
        if (d.name && !drawingsMap.has(d.name)) drawingsMap.set(d.name, d)
      }
    } catch { /* skip */ }
  }

  // From HC DataExplorer plat search
  if (hcDrawingRes?.ok) {
    try {
      const xml = await hcDrawingRes.text()
      const rows = parseDataExplorerXml(xml)
      for (const row of rows) {
        const name = row.Name || ""
        if (!name || drawingsMap.has(name)) continue
        const folder = row.Folder || ""
        drawingsMap.set(name, {
          name,
          folder,
          description: row.Description || "",
          pdfUrl: extractPdfUrl(row.PDF) || (folder && name ? `http://data.howardcountymd.gov/scannedpdf/${folder}/${name}.PDF` : ""),
        })
      }
    } catch { /* continue */ }
  }

  return NextResponse.json({
    results: sdatResults,
    sdatPage,
    drawings: Array.from(drawingsMap.values()),
    environmental,
    coordinatesFound: !!coordinates,
  })
}
