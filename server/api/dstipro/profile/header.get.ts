import { db } from '@/server/fake-db/dstipro/profile'

export default defineEventHandler(async event => {
  setResponseStatus(event, 200)

  return db.data.profileHeader
})
