import { adminDb, saveAdminAllowlist } from '../../../fake-db/admin'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  // ensure caller is an allowed admin
  await requireAdmin(event)

  const body = await readBody(event)
  const removePreferred = String(body?.preferred_username ?? body?.preferredUsername ?? '')

  if (!removePreferred)
    throw createError({ statusCode: 400, statusMessage: 'preferred_username is required' })

  const candidateLower = removePreferred.toLowerCase()
  const idx = adminDb.allowedPreferredUsername.findIndex((k: any) => String(k).toLowerCase() === candidateLower)
  if (idx === -1)
    throw createError({ statusCode: 404, statusMessage: 'preferred_username not found' })

  adminDb.allowedPreferredUsername.splice(idx, 1)

  try {
    saveAdminAllowlist()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 200)

  return { allowed: adminDb.allowedPreferredUsername }
})
