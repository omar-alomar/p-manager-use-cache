/**
 * API-level pagination. Slices an already-fetched array into pages.
 * The DB layer and cache are untouched — pagination happens in memory
 * after the cached result is returned.
 */

export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20))
  return { page, limit }
}

export function paginate<T>(items: T[], page: number, limit: number) {
  const start = (page - 1) * limit
  const slice = items.slice(start, start + limit)
  return {
    items: slice,
    total: items.length,
    page,
    limit,
    hasMore: start + limit < items.length,
  }
}
