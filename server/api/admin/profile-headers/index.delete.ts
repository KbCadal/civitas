import { db, saveProfileHeaders } from '../../../fake-db/profile-headers/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  const body = await readBody(event)
  const id = String(body?.id || '')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const idx = db.profileHeaders.findIndex((p: any) => p.id === id)
  if (idx === -1)
    throw createError({ statusCode: 404, statusMessage: 'Profile header not found' })

  const removed = db.profileHeaders.splice(idx, 1)

  try {
    saveProfileHeaders()
  }
  catch (e) {
    // ignore save errors
  }

  return { removed: removed[0] }
})
