import { db, saveApplications } from '../../../fake-db/applications/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  const body = await readBody(event)
  const role = String(body?.role || '').toLowerCase()
  const index = Number(body?.index)
  const app = body?.application

  if (!['mahasiswa', 'dosen', 'staf', 'staff'].includes(role))
    throw createError({ statusCode: 400, statusMessage: 'Invalid role. Allowed: mahasiswa, dosen, staf' })

  if (Number.isNaN(index) || index < 0)
    throw createError({ statusCode: 400, statusMessage: 'Valid index is required' })

  if (!app || typeof app !== 'object')
    throw createError({ statusCode: 400, statusMessage: 'application object is required' })

  const entry = {
    name: String(app.name || ''),
    nameShort: String(app.nameShort || ''),
    faculty: String(app.faculty || ''),
    link: String(app.link || ''),
    logo: String(app.logo || ''),
  }

  let targetArr: any[] = []
  if (role.includes('mahasiswa'))
    targetArr = db.studentApplications
  else if (role.includes('dosen'))
    targetArr = db.dosenApplications
  else
    targetArr = db.stafApplications

  if (index >= targetArr.length)
    throw createError({ statusCode: 400, statusMessage: 'Index out of range' })

  // replace
  targetArr[index] = entry

  try {
    saveApplications()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 200)

  return { updated: entry }
})
