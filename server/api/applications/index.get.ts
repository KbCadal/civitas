import { Buffer } from 'node:buffer'
import { db } from '../../fake-db/applications/index'

// `#auth` may be disabled in production/static builds; import dynamically below.

function decodeJwtPayload(token: string | undefined | null) {
  if (!token)
    return null

  try {
    const parts = token.split('.')
    if (parts.length < 2)
      return null

    const payload = parts[1]

    // Buffer is available in Node runtime used by Nitro
    const json = Buffer.from(payload, 'base64').toString('utf-8')

    return JSON.parse(json)
  }
  catch (e) {
    return null
  }
}

export default defineEventHandler(async event => {
  // First check Authorization header (client may send Keycloak token)
  const headers = getRequestHeaders(event)
  const authHeader = headers.authorization || headers.Authorization || ''

  let payload: any = null

  if (typeof authHeader === 'string' && authHeader.trim().length > 0) {
    const tokenFromHeader = authHeader.replace(/^Bearer\s+/i, '')

    payload = decodeJwtPayload(tokenFromHeader) || null
  }

  // If no payload from header, try server-side token/session
  if (!payload) {
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

    // Try to get session, but don't let an internal error crash the endpoint
    let session: any = null
    if (getServerSession) {
      try { session = await getServerSession(event) }
      catch (e) { session = null }
    }

    // Try token as fallback
    let tokenObj: any = null
    if (getToken) {
      try { tokenObj = await getToken({ event }) }
      catch (e) { tokenObj = null }
    }

    const rawToken = tokenObj?.id_token || tokenObj?.access_token || null

    const payloadFromToken = decodeJwtPayload(rawToken)

    payload = payloadFromToken || (session?.user ?? null)

    if (!payload) {
      // no session or token available
      throw createError({ statusCode: 403, statusMessage: 'You must be signed in to access this API.' })
    }
  }

  const civitas = (payload?.civitas || payload?.role || payload?.roles || '')

  let applications: any[] = []

  const civ = String(civitas).toLowerCase()

  if (civ.includes('mahasiswa') || civ === 'mahasiswa')
    applications = db.studentApplications
  else if (civ.includes('dosen') || civ === 'dosen')
    applications = db.dosenApplications
  else if (civ.includes('staf') || civ.includes('staff') || civ === 'staf')
    applications = db.stafApplications
  else
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized: civitas not allowed' })

  setResponseStatus(event, 200)

  return {
    applications,
  }
})
