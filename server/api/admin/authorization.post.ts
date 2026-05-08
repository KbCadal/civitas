import { adminDb, saveAdminAllowlist } from '../../fake-db/admin'
import { requireAdmin } from './_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  const body = await readBody(event)
  const newPreferred = String(body?.preferred_username ?? body?.preferredUsername ?? '')

  if (!newPreferred)
    throw createError({ statusCode: 400, statusMessage: 'preferred_username is required' })

  const exists = adminDb.allowedPreferredUsername.some((k: any) => String(k).toLowerCase() === newPreferred.toLowerCase())
  if (!exists)
    adminDb.allowedPreferredUsername.push(newPreferred)

  try {
    saveAdminAllowlist()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 201)

  return { allowed: adminDb.allowedPreferredUsername }
})
