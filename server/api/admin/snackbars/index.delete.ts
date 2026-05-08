import { db, saveSnackbars } from '../../../fake-db/snackbars/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  await requireAdmin(event)

  const body = await readBody(event)
  const id = String(body?.id || '')
  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  const idx = (db.snackbars || []).findIndex((s: any) => s.id === id)
  if (idx === -1)
    throw createError({ statusCode: 404, statusMessage: 'Snackbar not found' })

  const removed = db.snackbars.splice(idx, 1)

  try {
    saveSnackbars()
  }
  catch (e) {
    // ignore save errors
  }

  return { removed: removed[0] }
})
