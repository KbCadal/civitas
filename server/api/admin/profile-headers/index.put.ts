import { db, saveProfileHeaders } from '../../../fake-db/profile-headers/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  // ensure caller is allowed admin
  await requireAdmin(event)

  const body = await readBody(event)
  const id = String(body?.id || '')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const entry = db.profileHeaders.find((p: any) => p.id === id)
  if (!entry)
    throw createError({ statusCode: 404, statusMessage: 'Profile header not found' })

  // update allowed fields
  if (body.title !== undefined)
    entry.title = String(body.title || '')
  if (body.lightPath !== undefined)
    entry.lightPath = String(body.lightPath || entry.lightPath)
  if (body.darkPath !== undefined)
    entry.darkPath = String(body.darkPath || entry.darkPath)
  if (body.priority !== undefined) {
    const priority = String(body.priority || 'current')
    if (priority === 'birthday') {
      entry.priority = 'birthday'
      delete entry.date
    }
    else if (priority === 'date') {
      const d = body.date || {}

      entry.priority = 'date'
      entry.date = { mode: String(d.mode || 'yearly'), value: String(d.value || '') }
    }
    else {
      entry.priority = 'current'
      delete entry.date
    }
  }

  try {
    saveProfileHeaders()
  }
  catch (e) {
    // ignore save errors
  }

  return { updated: entry }
})
