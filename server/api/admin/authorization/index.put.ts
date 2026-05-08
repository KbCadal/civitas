import { adminDb, saveAdminAllowlist } from '../../../fake-db/admin'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  // ensure caller is an allowed admin (throws 403 otherwise)
  await requireAdmin(event)

  const body = await readBody(event)
  const oldPreferred = String(body?.oldPreferredUsername ?? body?.oldKode ?? '')
  const newPreferred = String(body?.newPreferredUsername ?? body?.newKode ?? '')

  if (!oldPreferred || !newPreferred)
    throw createError({ statusCode: 400, statusMessage: 'oldPreferredUsername and newPreferredUsername are required' })

  const oldLower = oldPreferred.toLowerCase()
  const idx = adminDb.allowedPreferredUsername.findIndex((k: any) => String(k).toLowerCase() === oldLower)
  if (idx === -1)
    throw createError({ statusCode: 404, statusMessage: 'oldPreferredUsername not found' })

  adminDb.allowedPreferredUsername[idx] = newPreferred

  try {
    saveAdminAllowlist()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 200)

  return { allowed: adminDb.allowedPreferredUsername }
})
