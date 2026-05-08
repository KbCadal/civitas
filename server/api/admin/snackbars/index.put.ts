import { db, saveSnackbars } from '../../../fake-db/snackbars/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  const body = await readBody(event)
  const id = String(body?.id || '')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const entry = db.snackbars.find((s: any) => s.id === id)
  if (!entry)
    throw createError({ statusCode: 404, statusMessage: 'Snackbar not found' })

  if (body.title !== undefined)
    entry.title = String(body.title || '')
  if (body.iconPrepend !== undefined)
    entry.iconPrepend = String(body.iconPrepend || '')
  if (body.body !== undefined)
    entry.body = String(body.body || '')

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
    saveSnackbars()
  }
  catch (e) {
    // ignore save errors
  }

  return { updated: entry }
})
