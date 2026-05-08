import { db, saveApplications } from '../../../fake-db/applications/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  // ensure caller is an allowed admin (throws 403 otherwise)
  await requireAdmin(event)

  const body = await readBody(event)
  const role = String(body?.role || '').toLowerCase()
  const index = Number(body?.index)

  if (!['mahasiswa', 'dosen', 'staf', 'staff'].includes(role))
    throw createError({ statusCode: 400, statusMessage: 'Invalid role. Allowed: mahasiswa, dosen, staf' })

  if (Number.isNaN(index) || index < 0)
    throw createError({ statusCode: 400, statusMessage: 'Valid index is required' })

  let targetArr: any[] = []
  if (role.includes('mahasiswa'))
    targetArr = db.studentApplications
  else if (role.includes('dosen'))
    targetArr = db.dosenApplications
  else
    targetArr = db.stafApplications

  if (index >= targetArr.length)
    throw createError({ statusCode: 400, statusMessage: 'Index out of range' })

  const removed = targetArr.splice(index, 1)

  try {
    saveApplications()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 200)

  return { removed }
})
