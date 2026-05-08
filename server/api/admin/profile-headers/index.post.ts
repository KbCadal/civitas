import { db, generateId, saveProfileHeaders } from '../../../fake-db/profile-headers/index'
import { requireAdmin } from '../_auth'

export default defineEventHandler(async event => {
  const { preferredUsername } = await requireAdmin(event)

  const body = await readBody(event)
  const title = String(body?.title || '')
  const lightPath = String(body?.lightPath || '')
  const darkPath = String(body?.darkPath || '')
  const priority = String(body?.priority || 'current')
  const date = body?.date || null

  if (!lightPath && !darkPath)
    throw createError({ statusCode: 400, statusMessage: 'At least one of lightPath or darkPath is required' })

  const id = generateId()

  const entry: any = {
    id,
    title,
    lightPath: lightPath || darkPath,
    darkPath: darkPath || lightPath,
    createdBy: preferredUsername,
    createdAt: new Date().toISOString(),
    assignedRoles: [] as string[],
    priority: 'current',
  }

  // validate & attach scheduling fields
  if (priority === 'birthday') {
    entry.priority = 'birthday'
  }
  else if (priority === 'date') {
    // expect date to be an object { mode, value }
    const mode = String(date?.mode || 'yearly')
    const value = String(date?.value || '')

    entry.priority = 'date'
    entry.date = { mode, value }
  }
  else {
    entry.priority = 'current'
  }

  db.profileHeaders.push(entry)

  try {
    saveProfileHeaders()
  }
  catch (e) {
    // ignore save errors
  }

  setResponseStatus(event, 201)

  return { added: entry }
})
