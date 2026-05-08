import { Buffer } from 'node:buffer'
import { adminDb } from '../../fake-db/admin'

// NOTE: `#auth` (nuxt-auth) may be disabled in production/static builds.
// Import it dynamically inside functions so that the server build doesn't fail
// when the module is disabled. When unavailable, we gracefully fall back.

function decodeJwtPayload(token: string | undefined | null) {
  if (!token)
    return null

  try {
    const parts = token.split('.')
    if (parts.length < 2)
      return null

    let payload = parts[1]

    // base64url -> base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/')
    while (payload.length % 4 !== 0) payload += '='

    const json = Buffer.from(payload, 'base64').toString('utf-8')

    return JSON.parse(json)
  }
  catch (e) {
    return null
  }
}

export async function requireAdmin(event: any) {
  const headers = getRequestHeaders(event)
  const authHeader = headers.authorization || headers.Authorization || ''

  let payload: any = null

  if (typeof authHeader === 'string' && authHeader.trim().length > 0) {
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '')

    payload = decodeJwtPayload(tokenFromHeader) || null
  }

  if (!payload) {
    // Try dynamic import of #auth; it's not available when nuxt-auth
    // is disabled (for static generation). If not present, fall back.
    let getServerSession: any = null
    let getToken: any = null
    try {
      const authMod = await import('#auth')

      getServerSession = authMod.getServerSession
      getToken = authMod.getToken
    }
    catch (e) {
      getServerSession = null
      getToken = null
    }

    let session: any = null
    if (getServerSession) {
      try { session = await getServerSession(event) }
      catch (e) { session = null }
    }

    let tokenObj: any = null
    if (getToken) {
      try { tokenObj = await getToken({ event }) }
      catch (e) { tokenObj = null }
    }

    const rawToken = tokenObj?.id_token || tokenObj?.access_token || null
    const payloadFromToken = decodeJwtPayload(rawToken)

    payload = payloadFromToken || (session?.user ?? null)
    if (!payload)
      throw createError({ statusCode: 403, statusMessage: 'You must be signed in to access this API.' })
  }

  const preferred = String(payload?.preferred_username || payload?.preferredUsername || payload?.uid || payload?.sub || '')
  if (!preferred)
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized: no preferred_username in token' })

  const preferredNorm = preferred.toLowerCase()
  const allowedLower = (adminDb.allowedPreferredUsername || []).map((k: any) => String(k).toLowerCase())
  if (!allowedLower.includes(preferredNorm))
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized: not allowed to access admin endpoints' })

  return { preferredUsername: preferred, preferredUsernameNormalized: preferredNorm }
}
