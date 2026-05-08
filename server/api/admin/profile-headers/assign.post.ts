import { db, saveProfileHeaders } from '../../../fake-db/profile-headers/index'
import { requireAdmin } from '../_auth'

const VALID_ROLES = ['mahasiswa', 'dosen', 'staf']

export default defineEventHandler(async event => {
  // ensure caller is an allowed admin (throws 403 otherwise)
  const { preferredUsername } = await requireAdmin(event)

  const body = await readBody(event)
  const id = String(body?.id || '')
  const roles: string[] = Array.isArray(body?.roles) ? body.roles.map((r: any) => String(r).toLowerCase()) : []
  const confirm = Boolean(body?.confirm || false)

  if (!id)
    throw createError({ statusCode: 400, statusMessage: 'id is required' })

  if (!roles.length)
    throw createError({ statusCode: 400, statusMessage: 'roles array is required' })

  for (const r of roles) {
    if (!VALID_ROLES.includes(r))
      throw createError({ statusCode: 400, statusMessage: `Invalid role: ${r}` })
  }

  const entry = db.profileHeaders.find((p: any) => p.id === id)
  if (!entry)
    throw createError({ statusCode: 404, statusMessage: 'Profile header not found' })

  // Determine which other entries would be affected depending on priority
  const replacements: Array<{ id: string; title?: string; roles: string[]; reason: string }> = []

  // allow caller to propose a priority/date for preview (so admin can choose priority in modal)
  const targetPriority = String(body?.priority ?? entry.priority ?? 'current')
  const targetDate = body?.date ?? (entry.date || null)

  for (const p of db.profileHeaders) {
    if (p.id === id)
      continue

    const willRemove: string[] = []
    for (const r of roles) {
      if (!(p.assignedRoles || []).includes(r))
        continue

      // conflict if same priority (birthday/current) or same date key for date-priority
      const pPriority = String(p.priority || 'current')
      if (targetPriority === 'current' && pPriority === 'current') { willRemove.push(r) }
      else if (targetPriority === 'birthday' && pPriority === 'birthday') { willRemove.push(r) }
      else if (targetPriority === 'date' && pPriority === 'date') {
        // compare date key equality (mode+value)
        const a = p.date || {}
        const b = targetDate || {}
        if (String(a.mode || '') === String(b.mode || '') && String(a.value || '') === String(b.value || ''))
          willRemove.push(r)
      }
    }

    if (willRemove.length)
      replacements.push({ id: p.id, title: p.title, roles: willRemove, reason: `conflict with existing ${p.priority || 'current'} header` })
  }

  if (!confirm) {
    // Return what would be replaced so client can ask for confirmation
    return { confirmRequired: true, replacements }
  }

  // when confirming, persist requested priority/date to the entry before performing replacements
  if (confirm) {
    if (body?.priority)
      entry.priority = String(body.priority)
    if (body?.date)
      entry.date = body.date
  }

  // perform removals
  for (const rep of replacements) {
    const other = db.profileHeaders.find((x: any) => x.id === rep.id)
    if (!other)
      continue
    other.assignedRoles = (other.assignedRoles || []).filter((r: string) => !rep.roles.includes(r))
  }

  // assign roles to target entry
  entry.assignedRoles = Array.from(new Set([...(entry.assignedRoles || []), ...roles]))

  try {
    saveProfileHeaders()
  }
  catch (e) {
    // ignore save errors
  }

  return { updated: entry, replaced: replacements }
})
