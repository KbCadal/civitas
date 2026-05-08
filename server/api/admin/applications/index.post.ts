import { db, saveApplications } from '../../../fake-db/applications/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  const body = await readBody(event)
  const role = String(body?.role || '').toLowerCase()
  const app = body?.application

  if (!role || !['mahasiswa', 'dosen', 'staf', 'staff'].includes(role))
    throw createError({ statusCode: 400, statusMessage: 'Invalid role. Allowed: mahasiswa, dosen, staf' })

  if (!app || typeof app !== 'object')
    throw createError({ statusCode: 400, statusMessage: 'application object is required' })

  const entry = {
    name: String(app.name || ''),
    nameShort: String(app.nameShort || ''),
    faculty: String(app.faculty || ''),
    link: String(app.link || ''),
    logo: String(app.logo || ''),
  }

  if (role.includes('mahasiswa'))
    db.studentApplications.push(entry)
  else if (role.includes('dosen'))
    db.dosenApplications.push(entry)
  else
    db.stafApplications.push(entry)

  try {
    saveApplications()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 201)

  return { added: entry }
})
