import { db } from '../../../fake-db/profile-headers/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  // ensure caller is allowed admin
  await requireAdmin(event)

  // Return full list of profile headers (admin)
  return { profileHeaders: db.profileHeaders }
})
