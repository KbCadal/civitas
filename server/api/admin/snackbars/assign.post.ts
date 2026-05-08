import { db, saveSnackbars } from '../../../fake-db/snackbars/index'
import { requireAdmin } from '../_auth'

const VALID_ROLES = ['mahasiswa', 'dosen', 'staf']

export default defineEventHandler(async event => {
  const { preferredUsername } = await requireAdmin(event)

  const body = await readBody(event)
  const id = String(body?.id || '')
  const roles: string[] = Array.isArray(body?.roles) ? body.roles.map((r: any) => String(r).toLowerCase()) : []
  const confirm = Boolean(body?.confirm || false)

  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  for (const r of roles) {
    if (!VALID_ROLES.includes(r))
      throw createError({ statusCode: 400, statusMessage: `Invalid role: ${r}` })
  }

  const entry = db.snackbars.find((p: any) => p.id === id)
  if (!entry)
    throw createError({ statusCode: 404, statusMessage: 'Snackbar not found' })

  const replacements: Array<{ id: string; title?: string; roles: string[]; reason: string }> = []

  const targetPriority = String(body?.priority ?? entry.priority ?? 'current')
  const targetDate = body?.date ?? (entry.date || null)

  for (const p of db.snackbars) {
    if (p.id === id)
      continue

    const willRemove: string[] = []
    for (const r of roles) {
      if (!(p.assignedRoles || []).includes(r))
        continue

      const pPriority = String(p.priority || 'current')
      if (targetPriority === 'current' && pPriority === 'current') { willRemove.push(r) }
      else if (targetPriority === 'birthday' && pPriority === 'birthday') { willRemove.push(r) }
      else if (targetPriority === 'date' && pPriority === 'date') {
        const a = p.date || {}
        const b = targetDate || {}
        if (String(a.mode || '') === String(b.mode || '') && String(a.value || '') === String(b.value || ''))
          willRemove.push(r)
      }
    }

    if (willRemove.length)
      replacements.push({ id: p.id, title: p.title, roles: willRemove, reason: `conflict with existing ${p.priority || 'current'} snackbar` })
  }

  if (!confirm)
    return { confirmRequired: true, replacements }

  if (confirm) {
    if (body?.priority)
      entry.priority = String(body.priority)
    if (body?.date)
      entry.date = body.date
  }

  for (const rep of replacements) {
    const other = db.snackbars.find((x: any) => x.id === rep.id)
    if (!other)
      continue
    other.assignedRoles = (other.assignedRoles || []).filter((r: string) => !rep.roles.includes(r))
  }

  // Replace assigned roles with the provided roles (not union), allowing clearing when roles=[]
  entry.assignedRoles = Array.from(new Set([...roles]))

  try {
    saveSnackbars()
  }
  catch (e) {
    // ignore save errors
  }

  return { updated: entry, replaced: replacements }
})
