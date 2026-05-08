import dayjs from 'dayjs'
import { db } from '../../fake-db/profile-headers/index'

export default defineEventHandler(async event => {
  const url = new URL(getRequestURL(event))
  const role = String(url.searchParams.get('role') || '').toLowerCase()
  const birthdate = String(url.searchParams.get('birthdate') || '').trim() // expect YYYY-MM-DD if provided

  if (!role)
    return { profileHeader: null }

  const list = (db.profileHeaders || [])

  const today = dayjs()

  // 1) Birthday - only if user provided birthdate and it matches today (MM-DD)
  if (birthdate) {
    try {
      const bd = dayjs(birthdate)
      if (bd.isValid() && bd.format('MM-DD') === today.format('MM-DD')) {
        const hit = list.find((p: any) => p.priority === 'birthday' && (p.assignedRoles || []).includes(role))
        if (hit)
          return { profileHeader: hit }
      }
    }
    catch {}
  }

  // 2) Specific date (priority = 'date') - check according to mode
  for (const p of list.filter((x: any) => x.priority === 'date')) {
    if (!((p.assignedRoles || []).includes(role)))
      continue
    const d = p.date || { mode: 'yearly', value: '' }
    const mode = String(d.mode || 'yearly')
    const value = String(d.value || '')

    if (mode === 'daily')
      return { profileHeader: p }

    if (mode === 'monthly') {
      if (value && value === today.format('DD'))
        return { profileHeader: p }
      continue
    }

    if (mode === 'yearly') {
      if (value && value === today.format('MM-DD'))
        return { profileHeader: p }
      continue
    }

    if (mode === 'once') {
      if (value && value === today.format('YYYY-MM-DD'))
        return { profileHeader: p }
      continue
    }
  }

  // 3) Current/general
  const current = list.find((p: any) => p.priority === 'current' && (p.assignedRoles || []).includes(role)) || null

  return { profileHeader: current }
})
