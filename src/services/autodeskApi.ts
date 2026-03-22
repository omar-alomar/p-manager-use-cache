// autodeskApi.ts — Autodesk Data Management API client
//
// Thin wrapper over the Autodesk API. All functions take userId as first param
// for token lookup via getValidAccessToken().
//
// b. prefix handling: Each function prepends b. to hub/project IDs for Data Management
// API endpoints. Folder IDs, item IDs, and version IDs are returned by the API
// pre-formatted and must NOT be prefixed.

import { getValidAccessToken } from "@/auth/autodeskTokenManager"

const DM_BASE = "https://developer.api.autodesk.com"

type AccFetchResult =
  | { ok: true; data: unknown; status: number }
  | { ok: false; error: string; status: number | null; needsReauth: boolean }

async function accFetch(
  userId: number,
  path: string,
  options?: { method?: string; body?: unknown; timeout?: number }
): Promise<AccFetchResult> {
  const token = await getValidAccessToken(userId)
  if (!token) {
    return { ok: false, error: "Not connected to Autodesk", status: null, needsReauth: true }
  }

  const controller = new AbortController()
  const timeoutMs = options?.timeout || 15000
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(`${DM_BASE}${path}`, {
      method: options?.method || "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    })

    clearTimeout(timeoutId)

    // Handle rate limiting — retry once if Retry-After <= 5 seconds
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "10", 10)
      if (retryAfter <= 5) {
        await new Promise((r) => setTimeout(r, retryAfter * 1000))
        return accFetch(userId, path, options)
      }
      return { ok: false, error: "Rate limited, try again shortly", status: 429, needsReauth: false }
    }

    if (res.status === 401) {
      return { ok: false, error: "Autodesk session expired", status: 401, needsReauth: true }
    }

    if (res.status === 403) {
      return { ok: false, error: "Access denied", status: 403, needsReauth: false }
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error")
      return { ok: false, error: text, status: res.status, needsReauth: false }
    }

    const data = await res.json()
    return { ok: true, data, status: res.status }
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, error: "Request timed out", status: null, needsReauth: false }
    }
    return { ok: false, error: String(err), status: null, needsReauth: false }
  }
}

// --- Hubs & Projects (for linking UI) ---

export type AccHub = {
  id: string
  name: string
  region: string
}

export async function listHubs(userId: number): Promise<AccFetchResult & { hubs?: AccHub[] }> {
  const result = await accFetch(userId, "/project/v1/hubs")
  if (!result.ok) return result

  const raw = result.data as { data?: Array<{ id: string; attributes: { name: string; region: string } }> }
  const hubs: AccHub[] = (raw.data || []).map((h) => ({
    id: h.id.replace(/^b\./, ""), // Strip b. prefix for storage
    name: h.attributes.name,
    region: h.attributes.region,
  }))

  return { ...result, hubs }
}

export type AccProject = {
  id: string
  name: string
}

export async function listProjects(
  userId: number,
  hubId: string
): Promise<AccFetchResult & { projects?: AccProject[] }> {
  const result = await accFetch(userId, `/project/v1/hubs/b.${hubId}/projects`)
  if (!result.ok) return result

  const raw = result.data as { data?: Array<{ id: string; attributes: { name: string } }> }
  const projects: AccProject[] = (raw.data || []).map((p) => ({
    id: p.id.replace(/^b\./, ""), // Strip b. prefix for storage
    name: p.attributes.name,
  }))

  return { ...result, projects }
}

// --- Folders & Files (for file browser — Phase 3) ---

export type AccFolderItem = {
  id: string
  type: "folders" | "items"
  name: string
  displayName: string
  lastModified: string | null
  lastModifiedBy: string | null
  size: number | null
  fileType: string | null
  reserved: boolean
  reservedBy: string | null
  reservedTime: string | null
}

export async function listTopFolders(
  userId: number,
  hubId: string,
  projectId: string
): Promise<AccFetchResult & { folders?: AccFolderItem[] }> {
  const result = await accFetch(
    userId,
    `/project/v1/hubs/b.${hubId}/projects/b.${projectId}/topFolders`
  )
  if (!result.ok) return result

  const raw = result.data as { data?: Array<{ id: string; type: string; attributes: { name: string; displayName: string; lastModifiedTime?: string } }> }
  const folders: AccFolderItem[] = (raw.data || []).map((f) => ({
    id: f.id,
    type: "folders" as const,
    name: f.attributes.name,
    displayName: f.attributes.displayName || f.attributes.name,
    lastModified: f.attributes.lastModifiedTime || null,
    lastModifiedBy: null,
    size: null,
    fileType: null,
    reserved: false,
    reservedBy: null,
    reservedTime: null,
  }))

  return { ...result, folders }
}

export async function listFolderContents(
  userId: number,
  projectId: string,
  folderId: string
): Promise<AccFetchResult & { items?: AccFolderItem[] }> {
  const result = await accFetch(
    userId,
    `/data/v1/projects/b.${projectId}/folders/${folderId}/contents`
  )
  if (!result.ok) return result

  const raw = result.data as {
    data?: Array<{
      id: string
      type: string
      attributes: {
        name?: string
        displayName: string
        lastModifiedTime?: string
        lastModifiedUserName?: string
        storageSize?: number
        fileType?: string
        reserved?: boolean
        reservedUserName?: string
        reservedTime?: string
        extension?: { type: string }
      }
    }>
  }

  const items: AccFolderItem[] = (raw.data || []).map((item) => ({
    id: item.id,
    type: item.type as "folders" | "items",
    name: item.attributes.name || item.attributes.displayName,
    displayName: item.attributes.displayName,
    lastModified: item.attributes.lastModifiedTime || null,
    lastModifiedBy: item.attributes.lastModifiedUserName || null,
    size: item.attributes.storageSize || null,
    fileType: item.attributes.fileType || null,
    reserved: item.attributes.reserved || false,
    reservedBy: item.attributes.reservedUserName || null,
    reservedTime: item.attributes.reservedTime || null,
  }))

  return { ...result, items }
}

// --- Item Details & Versions (Phase 4) ---

export async function listItemVersions(
  userId: number,
  projectId: string,
  itemId: string
): Promise<AccFetchResult> {
  return accFetch(userId, `/data/v1/projects/b.${projectId}/items/${itemId}/versions`)
}

export async function unlockFile(
  userId: number,
  projectId: string,
  itemId: string
): Promise<AccFetchResult> {
  return accFetch(userId, `/data/v1/projects/b.${projectId}/items/${itemId}`, {
    method: "PATCH",
    body: {
      jsonapi: { version: "1.0" },
      data: {
        type: "items",
        id: itemId,
        attributes: { reserved: false },
      },
    },
  })
}
