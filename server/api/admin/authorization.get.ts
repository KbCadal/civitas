import { adminDb } from '../../fake-db/admin'
import { requireAdmin } from './_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  setResponseStatus(event, 200)

  return { allowed: adminDb.allowedPreferredUsername }
})
