import { NextResponse } from "next/server"

export function jsonSuccess(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status })
}

export function jsonCreated(data: unknown) {
  return jsonSuccess(data, 201)
}

export function jsonNoContent() {
  return new NextResponse(null, { status: 204 })
}

export function jsonError(message: string, status = 400, details?: Record<string, string>) {
  return NextResponse.json(
    { error: { message, ...(details ? { details } : {}) } },
    { status }
  )
}

export function jsonUnauthorized(message = "Authentication required") {
  return jsonError(message, 401)
}

export function jsonForbidden(message = "Admin access required") {
  return jsonError(message, 403)
}

export function jsonNotFound(message = "Not found") {
  return jsonError(message, 404)
}

export function jsonMaintenance() {
  return jsonError("Site is under maintenance. Please try again later.", 503)
}
