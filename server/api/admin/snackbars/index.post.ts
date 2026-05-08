import { db, generateId, saveSnackbars } from '../../../fake-db/snackbars/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  const { preferredUsername } = await requireAdmin(event)

  const body = await readBody(event)
  const title = String(body?.title || '')
  const iconPrepend = String(body?.iconPrepend || '')
  const msgBody = String(body?.body || '')
  const priority = String(body?.priority || 'current')
  const date = body?.date || null

  if (!title && !msgBody)
    throw createError({ statusCode: 400, statusMessage: 'Title or body is required' })

  const id = generateId()

  const entry: any = {
    id,
    title: title || msgBody.substring(0, 40),
    iconPrepend: iconPrepend || '',
    body: msgBody,
    createdBy: preferredUsername,
    createdAt: new Date().toISOString(),
    assignedRoles: [] as string[],
    priority: 'current',
  }

  if (priority === 'birthday') {
    entry.priority = 'birthday'
  }
  else if (priority === 'date') {
    const mode = String(date?.mode || 'yearly')
    const value = String(date?.value || '')

    entry.priority = 'date'
    entry.date = { mode, value }
  }
  else {
    entry.priority = 'current'
  }

  db.snackbars.push(entry)

  try {
    saveSnackbars()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 201)

  return { added: entry }
})
