import { db } from '@/server/fake-db/dstipro/datatable'

export default defineEventHandler(async event => {
  setResponseStatus(event, 200)

  return db.salesDetails
})
