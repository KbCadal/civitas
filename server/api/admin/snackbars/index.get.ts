import { db } from '../../../fake-db/snackbars/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  return { snackbars: db.snackbars }
})
