# Maryland & Howard County Property Data APIs

Comprehensive reference for publicly available property data APIs relevant to Mildenberg's engineering work in Howard County, Maryland.

**Last updated:** 2026-03-16

---

## Table of Contents

1. [Overview](#overview)
2. [API 1: Maryland Open Data — SDAT Real Property](#api-1-maryland-open-data--sdat-real-property)
3. [API 2: Howard County DataExplorer Web Services](#api-2-howard-county-dataexplorer-web-services)
4. [API 3: Howard County GeoServer WFS](#api-3-howard-county-geoserver-wfs)
5. [Which API to Use](#which-api-to-use)
6. [The Deed Pipeline](#the-deed-pipeline)
7. [Example Workflows](#example-workflows)

---

## Overview

Three free, no-auth public APIs cover nearly all property data needs for Howard County:

| API | Protocol | Auth | Format | Best For |
|-----|----------|------|--------|----------|
| MD Open Data (SDAT) | REST (Socrata SODA) | None | JSON | Deed refs, assessments, building data, sales history |
| HC DataExplorer | ASMX Web Service | None | XML | Owner lookup, scanned drawings/plats (PDFs), intersections |
| HC GeoServer WFS | OGC WFS 2.0.0 | None | GeoJSON | Spatial queries — floodplains, soils, zoning, easements, parcels |

The only thing these APIs **don't** provide is the actual deed PDF documents. For that, you still need MDLandRec (requires free account with daily email auth).

---

## API 1: Maryland Open Data — SDAT Real Property

The entire SDAT property database as a queryable REST API. This is the richest data source.

### Connection Details

| | |
|---|---|
| **Base URL** | `https://opendata.maryland.gov/resource/ed4q-f8tm.json` |
| **Protocol** | Socrata SODA API |
| **Auth** | None required (1,000 req/hr). Register for a free app token for unlimited. |
| **Format** | JSON |
| **Total Records** | ~2.1M statewide; **112,914 in Howard County** |
| **Last Updated** | 2026-03-04 (updated periodically) |

### Query Syntax (SoQL)

```bash
# Simple filter — all Howard County properties
?jurisdiction_code_mdp_field_jurscode=HOWA&$limit=10

# By account ID (exact match)
?account_id_mdp_field_acctid=1402200848

# By address components
?premise_address_number_mdp_field_premsnum_sdat_field_20=08000&premise_address_name_mdp_field_premsnam_sdat_field_23=MAIN&jurisdiction_code_mdp_field_jurscode=HOWA

# Pagination
?$limit=50&$offset=100

# Select specific fields only
?$select=account_id_mdp_field_acctid,mdp_street_address_mdp_field_address,deed_reference_1_liber_mdp_field_dr1liber_sdat_field_30&$limit=10

# Count records
?$select=count(*)&$where=jurisdiction_code_mdp_field_jurscode='HOWA'

# Distinct values
?$select=distinct zoning_code_mdp_field_zoning_sdat_field_45&$where=jurisdiction_code_mdp_field_jurscode='HOWA'&$limit=50
```

**Note:** Address numbers are zero-padded in the `premsnum` field (e.g., `08000` not `8000`). Street names are uppercase without the type suffix (e.g., `MAIN` not `MAIN ST`).

### Complete Field Reference

#### Identification & Location

| Short Name | API Field | Example |
|---|---|---|
| County Code | `jurisdiction_code_mdp_field_jurscode` | `HOWA` |
| County Name | `county_name_mdp_field_cntyname` | `Howard County` |
| Account ID | `account_id_mdp_field_acctid` | `1402200848` |
| District | `record_key_district_ward_sdat_field_2` | `02` |
| Account Number | `record_key_account_number_sdat_field_3` | `200848` |
| Geographic Code | `record_key_geographic_code_mdp_field_geogcode_sdat_field_5` | `80` |
| Owner Occupancy | `record_key_owner_occupancy_code_mdp_field_ooi_sdat_field_6` | `H` (homeowner), `N` (non-owner) |
| Address | `mdp_street_address_mdp_field_address` | `8000 MAIN ST` |
| City | `mdp_street_address_city_mdp_field_city` | `ELLICOTT CITY` |
| ZIP | `mdp_street_address_zip_code_mdp_field_zipcode` | `21043` |
| Address Number | `premise_address_number_mdp_field_premsnum_sdat_field_20` | `08000` (zero-padded) |
| Street Name | `premise_address_name_mdp_field_premsnam_sdat_field_23` | `MAIN` |
| Street Type | `premise_address_type_mdp_field_premstyp_sdat_field_24` | `ST` |
| Premise City | `premise_address_city_mdp_field_premcity_sdat_field_25` | `ELLICOTT CITY` |
| Premise ZIP | `premise_address_zip_code_mdp_field_premzip_sdat_field_26` | `21043` |
| Latitude | `mdp_latitude_mdp_field_digycord_converted_to_wgs84` | `39.268` |
| Longitude | `mdp_longitude_mdp_field_digxcord_converted_to_wgs84` | `-76.795` |
| Residence Type | `mdp_street_address_type_code_mdp_field_resityp` | `SF` (single family), `AP` (apartment) |

#### Pre-Built Links (included in JSON response)

| Field | Destination |
|---|---|
| `real_property_search_link` | Direct URL to SDAT detail page |
| `finder_online_link` | MD Planning FinderOnline |
| `search_google_maps_for_this_location` | Google Maps satellite view |
| `mappable_latitude_and_longitude` | Lat/long object |

#### Legal & Deed References

| Short Name | API Field | Example |
|---|---|---|
| Legal Desc Line 1 | `legal_description_line_1_mdp_field_legal1_sdat_field_17` | `IMPS (Improvements). PAR 2 .085 A` |
| Legal Desc Line 2 | `legal_description_line_2_mdp_field_legal2_sdat_field_18` | `8000 MAIN ST` |
| Legal Desc Line 3 | `legal_description_line_3_mdp_field_legal3_sdat_field_19` | Subdivision name or area |
| **Deed Liber** | `deed_reference_1_liber_mdp_field_dr1liber_sdat_field_30` | `22788` |
| **Deed Folio** | `deed_reference_1_folio_mdp_field_dr1folio_sdat_field_31` | `0368` |
| Plat Liber | `plat_reference_liber_mdp_field_pltliber_sdat_field_267` | `0000000` |
| Plat Folio | `plat_reference_folio_mdp_field_pltfolio_sdat_field_268` | `0000` |

#### Property Classification

| Short Name | API Field | Example |
|---|---|---|
| Subdivision Code | `subdivision_code_mdp_field_subdivsn_sdat_field_37` | `0000`, `2002`, `7002` |
| Lot | `lot_mdp_field_lot_sdat_field_41` | `23 24` |
| Map | `map_mdp_field_map_sdat_field_42` | `0030` |
| Grid | `grid_mdp_field_grid_sdat_field_43` | `0009` |
| Parcel | `parcel_mdp_field_parcel_sdat_field_44` | `0053` |
| **Zoning** | `zoning_code_mdp_field_zoning_sdat_field_45` | 46 codes in HC — `R12`, `R20`, `HC`, `B1`, `B2`, `M1`, `MXD`, `NT`, etc. |
| Exempt Class | `exempt_class_mdp_field_exclass_descexcl_sdat_field_49` | `Blank`, `PVT Church/Rectory/Mosque/Synagogue (700)` |
| **Land Use** | `land_use_code_mdp_field_lu_desclu_sdat_field_50` | See table below |
| Public Use Code | `bpruc_public_use_code_mdp_field_ciuse_descciuse_sdat_field_61` | `00000`, `01000` |
| Town Code | `town_code_mdp_field_towncode_desctown_sdat_field_36` | `Blank` |
| Tax Class | `tax_class_sdat_field_58` | `00` |

**Land Use Codes (15 total):**

| Code | Description |
|---|---|
| `R` | Residential |
| `TH` | Town House |
| `U` | Residential Condominium |
| `M` | Apartments |
| `C` | Commercial |
| `CC` | Commercial Condominium |
| `CR` | Commercial Residential |
| `RC` | Residential Commercial |
| `I` | Industrial |
| `A` | Agricultural |
| `E` | Exempt |
| `EC` | Exempt Commercial |
| `CA` | Country Club |
| `MA` | Marsh Land |
| `Blank` | Not classified |

#### Building / Structure (CAMA Data)

| Short Name | API Field | Example |
|---|---|---|
| **Year Built** | `c_a_m_a_system_data_year_built_yyyy_mdp_field_yearblt_sdat_field_235` | `1790`, `1945`, `2005` |
| **Structure Sq Ft** | `c_a_m_a_system_data_structure_area_sq_ft_mdp_field_sqftstrc_sdat_field_241` | `3519` |
| **Land Area** | `c_a_m_a_system_data_land_area_mdp_field_landarea_sdat_field_242` | `3703`, `12109` |
| Land Unit | `c_a_m_a_system_data_land_unit_of_measure_mdp_field_luom_sdat_field_243` | `S` (sq ft), `A` (acres) |
| Effective Width | `c_a_m_a_system_data_effective_width_mdp_field_width_sdat_field_244` | `0.00` |
| Effective Depth | `c_a_m_a_system_data_effective_depth_mdp_field_depth_sdat_field_245` | `0.00` |
| **Dwelling Units** | `c_a_m_a_system_data_number_of_dwelling_units_mdp_field_bldg_units_sdat_field_239` | `1` |
| **Stories** | `c_a_m_a_system_data_number_of_stories_mdp_field_bldg_story_sdat_field_240` | `2` |
| **Dwelling Grade** | `c_a_m_a_system_data_dwelling_grade_code_and_description_mdp_field_strugrad_strudesc_sdat_field_230` | `Average (4)`, `Below Average (3)`, `Good (5)` |
| Dwelling Condition | `c_a_m_a_system_data_dwelling_condition_code_sdat_field_233` | `Blank (0)` |
| **Construction** | `additional_c_a_m_a_data_dwelling_construction_code_mdp_field_strucnst_sdat_field_263` | See table below |
| **Building Style** | `additional_c_a_m_a_data_building_style_code_and_description_mdp_field_strustyl_descstyl_sdat_field_264` | 100+ styles — see table below |
| **Dwelling Type** | `additional_c_a_m_a_data_dwelling_type_mdp_field_strubldg_sdat_field_265` | `DWEL Standard Unit (0001)`, `OFFICE Building (C138)` |
| Land Valuation Unit | `additional_c_a_m_a_data_land_valuation_unit_sdat_field_266` | `SQ` |
| Permit Type | `additional_c_a_m_a_data_permit_type_mdp_field_permittyp_sdat_field_262` | `RAP` |

**Construction Codes (26 in Howard County):**

| Code | Material |
|---|---|
| 001 | Siding |
| 002 | Frame |
| 003 | Wood Shingle |
| 004 | Asbestos Shingle |
| 005 | Stucco |
| 006 | Block |
| 007 | Brick |
| 008 | Stone |
| 009 | 1/2 Brick Siding |
| 010 | 1/2 Brick Frame |
| 011 | 1/2 Stone Siding |
| 012 | 1/2 Stone Frame |
| 013 | Log |
| 101 | Wood |
| 102 | Hardboard |
| 103 | Stucco |
| 104 | Metal |
| 105 | Vinyl |
| 106 | Brick Veneer |
| 107 | Face Brick |
| 108 | Com Brick |
| 109 | Brick & Metal |
| 110 | Stone |
| 111 | Concrete |
| 112 | Block |

**Building Styles (selected, 100+ total):**

Residential: `1 Story No Basement (0001)`, `1 Story With Basement (0002)`, `1 1/2 Story No/With Basement (0003-0004)`, `2 Story No/With Basement (0005-0006)`, `2 1/2 Story (0007-0008)`, `3 Story No Basement (0009)`, `3 Story With Basement (0010)`, `Split Foyer (0013)`

Townhouse: `TH End` and `TH Center` variants with same story/basement combos (0015-0038)

Commercial: 100+ codes including `OFFICE Building (C138)`, `Retail`, `Warehouse`, `Care Facility`, `School`, etc.

#### Property Factors (Utilities & Environment)

| Short Name | API Field | Values |
|---|---|---|
| **Water** | `property_factors_utilities_water_mdp_field_pfuw_sdat_field_63` | `Public Water (1)`, `Well (2)`, `None (0)` |
| **Sewer** | `property_factors_utilities_sewer_mdp_field_pfus_sdat_field_64` | `Public Sewer (1)`, `Septic (2)`, `None (0)` |
| Waterfront | `property_factors_location_waterfront_mdp_field_pflw_sdat_field_65` | `None (0)` |
| Paved Street | `property_factors_street_paved_mdp_field_pfsp_sdat_field_67` | `No Paved Street (0)` |
| Unpaved Street | `property_factors_street_unpaved_mdp_field_pfsu_sdat_field_68` | `No Unpaved Street (0)` |
| Commercial Influence | `property_factors_influence_commer_indust_mdp_field_pfic_sdat_field_69` | `None (0)`, `Apartment (A)` |
| Historical Influence | `property_factors_influence_historical_mdp_field_pfih_sdat_field_70` | `No Historical Influence (0)` |
| Recreational Influence | `recreational_influence_ind_mdp_field_recind_sdat_field_60` | `0` |

#### Assessment Values

| Short Name | API Field | Example |
|---|---|---|
| **Current Land Value** | `current_cycle_data_land_value_mdp_field_names_nfmlndvl_curlndvl_and_sallndvl_sdat_field_164` | `185100` |
| **Current Improvement Value** | `current_cycle_data_improvements_value_mdp_field_names_nfmimpvl_curimpvl_and_salimpvl_sdat_field_165` | `465600` |
| **Total Assessment** | `current_assessment_year_total_assessment_sdat_field_172` | `650700` |
| Phase-In Value | `current_assessment_year_total_phase_in_value_sdat_field_171` | `650700` |
| Base Land Value | `base_cycle_data_land_value_sdat_field_154` | `249100` |
| Base Improvement Value | `base_cycle_data_improvements_value_sdat_field_155` | `81800` |
| Prior Year Assessment | `prior_assessment_year_total_assessment_sdat_field_161` | `307500` |
| Date Assessed | `current_cycle_data_date_assessed_yyyy_mm_mdp_field_lastassd_sdat_field_169` | `2024.01` |
| Date Inspected | `current_cycle_data_date_inspected_yyyy_mm_mdp_field_lastinsp_sdat_field_168` | `2024.01` |
| Assessment Cycle Year | `assessment_cycle_year_sdat_field_399` | `2026` |
| Preferential Land Value | `current_cycle_data_preferential_land_value_sdat_field_166` | `0` |
| Circuit Breaker Value | `current_cycle_data_circuit_breaker_value_sdat_field_167` | `523300` |

#### Sales History (3 segments)

The API stores the 3 most recent sales. Fields follow the same pattern for segments 1, 2, and 3 — replace `_1_` with `_2_` or `_3_` in field names.

| Short Name | API Field (segment 1) | Example |
|---|---|---|
| **Grantor Name** | `sales_segment_1_grantor_name_mdp_field_grntnam1_sdat_field_80` | `JACABBE LLC` |
| **Transfer Date** | `sales_segment_1_transfer_date_yyyy_mm_dd_mdp_field_tradate_sdat_field_89` | `2025.06.05` |
| **Consideration (Price)** | `sales_segment_1_consideration_mdp_field_considr1_sdat_field_90` | `825000` |
| **How Conveyed** | `sales_segment_1_how_conveyed_ind_mdp_field_convey1_sdat_field_87` | `Private arms-length transfer, Improved (1)`, `Private non-arms-length transfer such as a foreclosure, gift or auction (4)` |
| **Grantor Deed Liber** | `sales_segment_1_grantor_deed_reference_1_liber_mdp_field_gr1libr1_sdat_field_82` | `17417` |
| **Grantor Deed Folio** | `sales_segment_1_grantor_deed_reference_1_folio_mdp_field_gr1folo1_sdat_field_83` | `0075` |
| Mortgage | `sales_segment_1_mortgage_mdp_field_mortgag1_sdat_field_92` | `0` |
| Market Land Value at Sale | `sales_segment_1_mkt_land_value_sdat_field_95` | `249100` |
| Market Improvement Value at Sale | `sales_segment_1_mkt_improvement_value_sdat_field_96` | `81800` |

#### Exemptions & Tax Credits

| Short Name | API Field |
|---|---|
| County Exempt Assessment | `full_and_partial_exemptions_county_exempt_assessment_sdat_field_140` |
| County Exempt % | `full_and_partial_exemptions_county_exempt_percentage_sdat_field_141` |
| State Exempt Assessment | `full_and_partial_exemptions_state_exempt_assessment_sdat_field_143` |
| State Exempt % | `full_and_partial_exemptions_state_exempt_percentage_sdat_field_144` |
| Municipal Exempt Assessment | `full_and_partial_exemptions_municipal_exempt_assessment_sdat_field_146` |
| Municipal Exempt % | `full_and_partial_exemptions_municipal_exempt_percentage_sdat_field_147` |
| Homestead Qualification Code | `homestead_qualification_code_mdp_field_homqlcod_sdat_field_259` |
| Homestead Qualification Date | `homestead_qualification_date_mdp_field_homqldat_sdat_field_260` |
| Current State Credit | `assessment_credit_program_current_state_assmt_cr_sdat_field_197` |
| Current County Credit | `assessment_credit_program_current_county_assmt_cr_sdat_field_199` |
| Current Municipal Credit | `assessment_credit_program_current_municipal_assmt_cr_sdat_field_201` |
| Credit Status | `assessment_credit_program_current_credit_status_code_sdat_field_202` |

#### New Construction Data

| Short Name | API Field |
|---|---|
| Base Land Value | `new_construction_data_base_land_value_sdat_field_184` |
| Base Improvement Value | `new_construction_data_base_improvement_value_sdat_field_185` |
| Proposed Land Value | `new_construction_data_proposed_land_value_sdat_field_186` |
| Proposed Improvement Value | `new_construction_data_proposed_improvement_value_sdat_field_187` |
| Activity Tax Year | `new_construction_data_activity_tax_year_as_of_july_1_sdat_field_189` |
| Date Updated | `new_construction_data_date_updated_yyyy_mm_dd_sdat_field_191` |

#### Special Dates & Programs

| Short Name | API Field |
|---|---|
| FCMA Code | `special_dates_and_data_fcma_code_mdp_field_fcmacode_sdat_field_207` |
| Rezoned Date | `special_dates_and_data_rezoned_reality_date_yyyy_mm_dd_mdp_field_rzrealdat_sdat_field_208` |
| Enterprise Zone Date | `special_dates_and_data_enterprise_zone_date_yyyy_mm_dd_mdp_field_entzndat_sdat_field_215` |
| Enterprise Zone Assessment | `special_dates_and_data_enterprise_zone_assessment_mdp_field_entznassm_sdat_field_216` |
| Planned Development Date | `special_dates_and_data_planned_development_date_yyyy_mm_dd_mdp_field_plndevdat_sdat_field_217` |
| Ag Land Preservation Area | `special_dates_and_data_agr_land_preservation_fdn_area_mdp_field_agfndarea_sdat_field_213` |
| Zoning Change Date | `special_dates_and_data_zoning_change_date_yyyy_mm_dd_mdp_field_znchgdat_sdat_field_224` |
| Tax Court Date | `special_dates_and_data_tax_court_date_yyyy_mm_dd_sdat_field_225` |
| Appeal Board Date | `special_dates_and_data_appeal_board_date_yyyy_mm_dd_sdat_field_226` |
| Non-Perc Test Date | `special_dates_and_data_non_perc_test_date_yyyy_mm_dd_mdp_field_nprctstdat_sdat_field_218` |
| Non-Perc Area | `special_dates_and_data_non_perc_area_mdp_field_nprcarea_sdat_field_219` |

#### Record Metadata

| Short Name | API Field |
|---|---|
| Last Activity Date | `last_activity_date_yyyy_mm_dd_sdat_field_392` |
| Record Creation Date | `record_creation_date_yyyy_mm_dd_sdat_field_397` |
| Assessment Cycle Year | `assessment_cycle_year_sdat_field_399` |
| File Record Type | `file_record_type_sdat_field_400` |
| Last Portal Update | `date_of_most_recent_open_data_portal_record_update` |

---

## API 2: Howard County DataExplorer Web Services

Simple HTTP GET endpoints returning XML. Good for owner lookups, scanned drawings, and street data.

### Connection Details

| | |
|---|---|
| **Base URL** | `https://data.howardcountymd.gov/DataExplorer/DataExplorerWebServices.asmx` |
| **Protocol** | ASMX (.NET Web Service) — use HTTP GET for simplicity |
| **Auth** | None required |
| **Format** | XML (DataSet with schema + data rows) |
| **Rate Limit** | None observed |

### All 21 Endpoints

#### Property Lookup (5 endpoints)

**`/SearchAddresses`** — Find addresses by street number and name

| Parameter | Type | Required | Description |
|---|---|---|---|
| `MyNumber` | string | No | Street number (can be empty for all on street) |
| `MyStreet` | string | Yes | Street name (partial match) |

Returns: `ID`, `ADDRESSNO`, `PREMSNAM` (street name), `PREMSTYP` (ST/DR/CT), `PREMCITY`, `PREMZIP`, `MyX`, `MyY`, `MyGeometry` (POINT)

```
GET /SearchAddresses?MyNumber=8000&MyStreet=Main
```

---

**`/QueryPropertyByOwner`** — Find properties by owner name

| Parameter | Type | Description |
|---|---|---|
| `MyOwnerName` | string | Owner name (partial match) |

Returns: `ID`, `ACCTID`, `ADDRESS`, `OWNNAME1`, `OWNNAME2`, `MAP`, `PARCEL`, `LOT`, `PLAT`, `MyGeometry` (POLYGON)

```
GET /QueryPropertyByOwner?MyOwnerName=Smith
```

---

**`/QueryPropertyByTaxID`** — Find property by tax account ID

| Parameter | Type | Description |
|---|---|---|
| `MyTaxID` | string | Tax account ID |

Returns: Same fields as QueryPropertyByOwner.

```
GET /QueryPropertyByTaxID?MyTaxID=1402200848
```

---

**`/QueryPropertyByMapParcelLot`** — Find property by map/parcel/lot

| Parameter | Type | Description |
|---|---|---|
| `MyMap` | string | Map number |
| `MyParcel` | string | Parcel number |
| `MyLot` | string | Lot number (can be empty) |

Returns: Same fields as QueryPropertyByOwner.

```
GET /QueryPropertyByMapParcelLot?MyMap=10&MyParcel=164&MyLot=
```

---

**`/QueryPropertyByPlatNo`** — Find all properties on a plat

| Parameter | Type | Description |
|---|---|---|
| `MyPlatNo` | string | Plat number |

Returns: Same fields as QueryPropertyByOwner. Returns multiple records (all properties on the plat).

```
GET /QueryPropertyByPlatNo?MyPlatNo=12229
```

#### Scanned Drawings (3 endpoints)

**18,268 total drawings** across Howard County, directly downloadable as PDFs.

**`/QueryScannedDrawingsByName`** — Search drawings by name/description

| Parameter | Type | Description |
|---|---|---|
| `DrawingName` | string | Drawing name or description (partial match) |

Returns: `ID`, `Name`, `Folder`, `Description`, `PDF` (URL), `MyGeometry` (POLYGON)

```
GET /QueryScannedDrawingsByName?DrawingName=Ellicott
```

---

**`/QueryScannedDrawingsByNumber`** — Search drawings by number

| Parameter | Type | Description |
|---|---|---|
| `DrawingNumber` | string | Drawing number |

Returns: Same fields as above.

---

**`/QueryScannedDrawingsPublic`** — Public drawing lookup by number

| Parameter | Type | Description |
|---|---|---|
| `DrawingNumber` | string | Drawing number |

Returns: Same fields as above.

---

**PDF URL Pattern:** `http://data.howardcountymd.gov/scannedpdf/{Folder}/{Name}.PDF`

**Drawing Folders:**

| Folder | Contents |
|---|---|
| `Record_Plats` | Recorded subdivision plats |
| `Preliminary_Plans` | Preliminary site plans |
| `SDP` | Site Development Plans |
| `Signal_Plans` | Traffic signal plans |
| `CapitalProjects` | Capital improvement project drawings |
| `Forest_Conservation_Plats` | Forest conservation plans |

#### Street & Location (3 endpoints)

**`/GenerateListOfStreets`** — All street names in Howard County

No parameters. Returns: `Road1` (street name) for every street.

---

**`/GenerateIntersectingStreets`** — Find all intersections for a street

| Parameter | Type | Description |
|---|---|---|
| `MyStreet` | string | Street name (partial match) |

Returns: `Road1`, `Road2`, `MyGeometry` (POINT at intersection)

```
GET /GenerateIntersectingStreets?MyStreet=Main
```

---

**`/QueryADCMapGrid`** — ADC map grid lookup

| Parameter | Type | Description |
|---|---|---|
| `MyMap` | string | Map number |
| `MyGrid` | string | Grid number |

Returns: `ADCMAPNO`, `ADCGRIDNO`, `ADCMAPGRID`, `MyGeometry`

#### Infrastructure (5 endpoints)

| Endpoint | Parameter | Description |
|---|---|---|
| `/QueryUtilityGrid` | `GridID` | Utility grid data |
| `/QueryWaterMains` | `SearchID` | Water main data |
| `/QueryValves` | `ValveID` | Valve data |
| `/QueryFireHydrants` | `HydrantID` | Fire hydrant data |
| `/QueryManholes` | `ManholeID` | Manhole data |

All return geometry + attribute data for the specified infrastructure element.

#### Signs (2 endpoints)

| Endpoint | Parameter | Description |
|---|---|---|
| `/AllSigns` | *(none)* | Complete sign inventory |
| `/QuerySigns` | `SignCode` | Signs matching code |

#### Other (3 endpoints)

**`/QueryHistoricSites`** — Search historic sites (1,080 total)

| Parameter | Type | Description |
|---|---|---|
| `MyNumber` | string | Site number (can be empty) |
| `MySearchTerm` | string | Search term (partial match) |

Returns: `Document` (PDF link to MD Historical Trust), `Hoco_ID`, `Name`, `Address`, `Building_Name`, `Common_Name`, `MyGeometry`

```
GET /QueryHistoricSites?MyNumber=&MySearchTerm=Ellicott
```

---

**`/CountyContacts`** — Howard County government directory (241 offices)

No parameters. Returns: `Department`, `Agency`, `Contact`, `Title`, `Phone`, `Address`, `CityStateZip`, `Email`, `DepartmentID`

---

**`/CheckIdentity`** — Service health check

No parameters. Returns: boolean.

---

## API 3: Howard County GeoServer WFS

A full GIS service with 200+ spatial layers. Use this when you need to query by location (point-in-polygon) or need environmental/regulatory data.

### Connection Details

| | |
|---|---|
| **Base URL** | `https://hcgeoserver.howardcountymd.gov:8443/geoserver/general/wfs` |
| **Protocol** | OGC WFS 2.0.0 |
| **Auth** | None required |
| **Format** | GeoJSON, GML, or other OGC formats |
| **CRS** | EPSG:2248 (Maryland State Plane) |
| **Contact** | Robert Slivinsky, GIS Manager — rslivinsky@howardcountymd.gov |

### Query Syntax

```bash
# Get features as GeoJSON (limit results)
?service=WFS&request=GetFeature
  &typeName=general:Property_Public_NoName
  &count=10
  &outputFormat=application/json

# Filter by attribute (CQL)
?service=WFS&request=GetFeature
  &typeName=general:Property_Public_NoName
  &CQL_FILTER=ACCTID='1402200848'
  &outputFormat=application/json

# Spatial query — find what's at a point
?service=WFS&request=GetFeature
  &typeName=general:Floodplain
  &CQL_FILTER=INTERSECTS(geom,POINT(1370472 583300))
  &outputFormat=application/json

# Get all available layers
?service=WFS&request=GetCapabilities
```

**Note:** Coordinates are in EPSG:2248 (Maryland State Plane feet), not lat/long. The HC DataExplorer `SearchAddresses` endpoint returns `MyX`/`MyY` in this coordinate system, which can be used directly in WFS spatial queries.

### Key Layers by Category

#### Property & Land Use

| Layer | Features | Key Fields |
|---|---|---|
| `Property_Public_NoName` | 111,256 | ACCTID, MAP, PARCEL, LOT, PLAT, GRID, OWNNAME1, OWNNAME2, ACREAGE, SDAT_Link |
| `Land_Use` | 96,419 | Generalized_Use, Detailed_Use, Use_Code |
| `Impervious_Parcels` | — | total_ia (sq ft), ia_peracct, lot_sqft |
| `County_Owned_Land` | — | County property polygons |
| `Address_Points` | 104,330 | Full address, city, ZIP, parcel FK |

#### Environmental & Regulatory

| Layer | Features | Key Fields |
|---|---|---|
| `Floodplain` | 1,494 | FLD_ZONE, ZONE_SUBTY, SFHA_TF (Special Flood Hazard Area true/false) |
| `Floodplain_HoCo` | — | County development restriction floodplain zones (2026 AECOM study) |
| `Soils` | 12,347 | MUSYM, MUKEY, CLASS, HSG (Hydrologic Soil Group A/B/C/D), Description |
| `Stream_Centerline` | — | Major and minor stream centerlines |
| `Stream_Centerline_Buffer` | — | 75-foot and 100-foot stream buffers |
| `Wetlands` | — | Wetland polygons |
| `Ponds_Lakes_Dams` | — | Pond and lake boundaries |
| `Forest_Cover_FCA_2018` | — | Tree canopy per Forest Conservation Act |
| `Forest_Conservation_Easements` | 3,668 | Subdivision, file number, acres, plat reference, approval date, BMP type, inspection date |
| `Preservation_Easements` | — | Type (MET, agricultural, historic), owner, acreage, tax map/parcel |
| `Green_Infrastructure_Network` | — | Interconnected ecological network polygons |
| `Geology` | — | Natural Resource Conservation Service geological data |
| `Slope_2004` | — | Slope polygons from 2004 LIDAR data |
| `Tree_Line` | — | Tree polygons (2022) |
| `MD_SensitiveSpeciesReviewAreas` | — | MD Dept. of Environment sensitive species areas |

#### Planning & Zoning

| Layer | Features | Key Fields |
|---|---|---|
| `Historic_Districts` | — | Ellicott City & Lawyers Hill historic district boundaries |
| `Historic_Sites_View` | 1,080 | HoCo_ID, Name, Address, Tax Map/Block/Parcel, Survey Year, Comments, PDF link |
| `Scanned_Drawings_Public` | 18,268 | Name, Folder, Description, PDF URL, polygon boundary |
| `Growth_Tiers` | — | PlanHoward 2030 growth tier classifications |
| `Planning_Areas` | — | DPZ planning zone boundaries |
| `DPZ_DAP_Review_Areas` | — | Design Advisory Panel review zones |
| `DPZ_HoCo_By_Design_Allocation_Areas` | — | HoCo By Design allocation areas (2023) |
| `Priority_Funding_Area_State` | — | Maryland Priority Funding Area designations |
| `Designated_Places` | — | PlanHoward 2030 designated place boundaries |
| `Scenic_Roads` | — | Scenic Roads Act centerlines |
| `StudyArea_Sustainable_Community_Boundary` | — | Ellicott City, North Laurel-Savage, Long Reach |

#### Columbia-Specific

| Layer | Key Fields |
|---|---|
| `Columbia_PlanningArea` | Generalized Columbia boundary |
| `Columbia_VillageCenters` | Village center point locations |
| `Downtown_Columbia` | Downtown Columbia boundary |
| `Downtown_Columbia_Neighborhoods` | DC neighborhood boundaries |
| `DPZ_FDP` | Columbia Final Development Plan boundaries |
| `DPZ_FDP_Landuse` | FDP land use classifications |

#### Infrastructure & Transportation

| Layer | Features | Key Fields |
|---|---|---|
| `Street_Centerline` | — | Road centerlines (updated daily) |
| `Road_Polygon` | — | All roadway polygons (2023) |
| `Roads_DirtGravel` | — | Unpaved road shapes |
| `Sidewalks_Major` | — | 6+ foot sidewalk polygons |
| `Sidewalks_Minor` | — | Under 6 foot sidewalk lines |
| `Buildings_Major` | 83,334 | CAPYEAR, polygon (structures >=200 sq ft) |
| `Bridge_Decks` | — | Bridge deck outlines |
| `Transit_Routes` | — | MRTA bus routes (July 2025) |
| `Transit_BusStops` | — | Bus stop points (November 2024) |
| `MARC_Stations` | — | MARC train station locations |
| `Railroad_Tracks` | — | Railroad track lines |
| `Flood_Prone_Roads` | — | Roads prone to flooding |
| `ParkingLots_Paved` | — | Paved parking lot outlines |
| `Driveways_Paved` | — | Paved driveway polygons |
| `Public_Works_Lighting` | — | GPS'd light pole locations |
| `Transmission_Towers` | — | Transmission tower points |

#### Boundaries & Districts

| Layer | Description |
|---|---|
| `County_Shape` | Howard County boundary polygon |
| `Council_Districts` | Current council districts (2020) |
| `Tax_Map_Grid` | 48 tax map tiles |
| `Elementary_School_Districts` | Elementary school attendance zones |
| `Middle_School_Districts` | Middle school attendance zones |
| `High_School_Districts` | High school attendance zones |
| `Police_District` | Police district boundaries |
| `Police_Quadrant` | Police quadrant boundaries |
| `Police_Beats` | Police beat boundaries (2025) |
| `Police_ESZ` | Emergency Service Zones |
| `Fire_Stations` | Fire station locations (June 2024) |
| `Census2020_Tracts` | 2020 census tracts with population |
| `Congressional_Districts` | Congressional district boundaries |
| `Legislative_Districts` | State legislative district boundaries |

#### Parks & Recreation

| Layer | Description |
|---|---|
| `Parks` | County parks (Feb 2026) |
| `Open_Space_Natural_Resource` | County natural resource areas |
| `Open_Space_Other` | Non-county open space |
| `Trails` | Unpaved trails |
| `Pathways` | Paved pathways |
| `Park_Playgrounds` | Playground locations |
| `Park_Pavilions` | Pavilion locations |
| `Sport_Fields` | Athletic fields |
| `Golf_Courses` | Golf course locations |
| `Swimming_Pools` | Pool polygons |

#### Survey & Control

| Layer | Description |
|---|---|
| `Geodetic_BenchMarks` | Survey benchmark locations with recovery cards |
| `Geodetic_Stations` | Survey control stations with recovery cards |

---

## Which API to Use

| Need | Best Source | Why |
|---|---|---|
| **Deed reference (liber/folio)** | MD Open Data | Only source with deed refs via API |
| **Land use / zoning** | MD Open Data or WFS `Land_Use` | MD Open Data has codes; WFS has spatial polygons |
| **Year built, structure sq ft, construction type** | MD Open Data | Only source with CAMA building data |
| **Assessment values & sales history** | MD Open Data | Only source with financial data |
| **Owner name lookup** | HC DataExplorer | Partial match, fast, returns parcel geometry |
| **Address to property** | MD Open Data (by address fields) or HC DataExplorer (`SearchAddresses` then cross-ref) | MD Open Data is richer; HC DataExplorer gives coordinates for spatial queries |
| **Parcel geometry (polygon)** | WFS `Property_Public_NoName` or HC DataExplorer | WFS supports spatial queries; DataExplorer is simpler |
| **Scanned plats/drawings (PDFs)** | HC DataExplorer (drawing endpoints) or WFS `Scanned_Drawings_Public` | DataExplorer is simpler for name/number search; WFS for spatial search |
| **Floodplain status** | WFS `Floodplain` / `Floodplain_HoCo` | Spatial query: is this point in a flood zone? |
| **Soil type & hydrology** | WFS `Soils` | Spatial query: what soil is at this point? |
| **Forest conservation easements** | WFS `Forest_Conservation_Easements` | Spatial query with detailed easement data |
| **Preservation easements** | WFS `Preservation_Easements` | Type, owner, acreage |
| **Historic sites** | HC DataExplorer or WFS `Historic_Sites_View` | Both have PDF links to MD Historical Trust |
| **Impervious surface** | WFS `Impervious_Parcels` | Total impervious area per parcel |
| **Stream buffers** | WFS `Stream_Centerline_Buffer` | 75'/100' buffer polygons |
| **School district** | WFS school district layers | Spatial query |
| **Street intersections** | HC DataExplorer `GenerateIntersectingStreets` | Returns point geometry for each intersection |
| **Infrastructure (hydrants, manholes, valves, water mains)** | HC DataExplorer | Query by ID |
| **County contacts** | HC DataExplorer `CountyContacts` | Phone, email, address for 241 offices |

---

## The Deed Pipeline

These APIs eliminate the need to scrape SDAT. The complete workflow:

```
                     ┌─────────────────────────────────────┐
                     │  MD Open Data API (no auth, JSON)   │
  Address ──────────>│                                     │──> Liber/Folio
                     │  - Deed reference                   │──> Land use, zoning
                     │  - Year built, sq ft, construction  │──> Building details
                     │  - Assessment values                │──> Assessment
                     │  - Sales history (3 transactions)   │──> Sales history
                     │  - Utilities (water/sewer)          │──> Utilities
                     │  - SDAT detail page link            │──> Direct SDAT link
                     └─────────────────────────────────────┘
                                     │
                              Liber / Folio
                                     │
                                     v
                     ┌─────────────────────────────────────┐
                     │  MDLandRec (requires email auth)    │
                     │                                     │──> Deed PDF
                     │  Search by liber/folio              │
                     └─────────────────────────────────────┘
```

For scanned drawings/plats:

```
  Address ──> HC DataExplorer (SearchAddresses) ──> Property (QueryPropertyByOwner)
                                                         │
                                                    Plat number
                                                         │
                                                         v
              HC DataExplorer (QueryScannedDrawingsByName/Number)
                                     │
                                     v
              http://data.howardcountymd.gov/scannedpdf/{Folder}/{Name}.PDF
```

For environmental/regulatory data:

```
  Address ──> HC DataExplorer (SearchAddresses) ──> MyX, MyY coordinates
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    v                    v                    v
                              WFS Floodplain      WFS Soils          WFS Easements
                              (INTERSECTS)        (INTERSECTS)       (INTERSECTS)
```

---

## Example Workflows

### 1. Full Property Report from Address

```bash
# Step 1: Get SDAT data (deed ref, building, assessment, sales)
curl "https://opendata.maryland.gov/resource/ed4q-f8tm.json?\
premise_address_number_mdp_field_premsnum_sdat_field_20=08000\
&premise_address_name_mdp_field_premsnam_sdat_field_23=MAIN\
&jurisdiction_code_mdp_field_jurscode=HOWA\
&$limit=1"

# Step 2: Get coordinates for spatial queries
curl "https://data.howardcountymd.gov/DataExplorer/\
DataExplorerWebServices.asmx/SearchAddresses?MyNumber=8000&MyStreet=Main"

# Step 3: Check floodplain (using MyX/MyY from step 2)
curl "https://hcgeoserver.howardcountymd.gov:8443/geoserver/general/wfs?\
service=WFS&request=GetFeature&typeName=general:Floodplain\
&CQL_FILTER=INTERSECTS(geom,POINT(1370472 583300))\
&outputFormat=application/json"

# Step 4: Check soils
curl "https://hcgeoserver.howardcountymd.gov:8443/geoserver/general/wfs?\
service=WFS&request=GetFeature&typeName=general:Soils\
&CQL_FILTER=INTERSECTS(geom,POINT(1370472 583300))\
&outputFormat=application/json"
```

### 2. Find Scanned Drawings for a Project

```bash
# Search by name
curl "https://data.howardcountymd.gov/DataExplorer/\
DataExplorerWebServices.asmx/QueryScannedDrawingsByName?DrawingName=Ellicott"

# Download the PDF
curl -O "http://data.howardcountymd.gov/scannedpdf/Record_Plats/F-13-102.PDF"
```

### 3. Look Up Owner and All Properties on Same Plat

```bash
# Find owner by address
curl "https://data.howardcountymd.gov/DataExplorer/\
DataExplorerWebServices.asmx/QueryPropertyByOwner?MyOwnerName=Smith"

# Find all properties on same plat
curl "https://data.howardcountymd.gov/DataExplorer/\
DataExplorerWebServices.asmx/QueryPropertyByPlatNo?MyPlatNo=12229"
```
