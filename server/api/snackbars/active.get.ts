import dayjs from 'dayjs'
import { db } from '../../fake-db/snackbars/index'

export default defineEventHandler(async event => {
  const url = new URL(getRequestURL(event))
  const role = String(url.searchParams.get('role') || '').toLowerCase()
  const birthdate = String(url.searchParams.get('birthdate') || '').trim() // expect YYYY-MM-DD if provided

  if (!role)
    return { snackbars: [] }

  const list = (db.snackbars || [])
  const today = dayjs()

  const results: any[] = []

  // Birthday: if birthdate is provided and matches today, include all snackbars with priority 'birthday' for role
  if (birthdate) {
    try {
      const bd = dayjs(birthdate)
      if (bd.isValid() && bd.format('MM-DD') === today.format('MM-DD')) {
        for (const p of list.filter((s: any) => s.priority === 'birthday' && (s.assignedRoles || []).includes(role)))
          results.push(p)
      }
    }
    catch {}
  }

  // Specific date entries
  for (const p of list.filter((x: any) => x.priority === 'date')) {
    if (!((p.assignedRoles || []).includes(role)))
      continue
    const d = p.date || { mode: 'yearly', value: '' }
    const mode = String(d.mode || 'yearly')
    const value = String(d.value || '')

    if (mode === 'daily')
      results.push(p)

    if (mode === 'monthly') {
      if (value && value === today.format('DD'))
        results.push(p)
      continue
    }

    if (mode === 'yearly') {
      if (value && value === today.format('MM-DD'))
        results.push(p)
      continue
    }

    if (mode === 'once') {
      if (value && value === today.format('YYYY-MM-DD'))
        results.push(p)
      continue
    }
  }

  // Current/general
  for (const p of list.filter((x: any) => x.priority === 'current' && (x.assignedRoles || []).includes(role)))
    results.push(p)

  // Return possibly multiple snackbars. Keep server-side ordering: birthday, date, current
  return { snackbars: results }
})
