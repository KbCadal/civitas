import { db } from '../../../fake-db/applications/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  // ensure caller is an allowed admin (throws 403 otherwise)
  await requireAdmin(event)

  setResponseStatus(event, 200)

  return {
    studentApplications: db.studentApplications,
    dosenApplications: db.dosenApplications,
    stafApplications: db.stafApplications,
  }
})
