// Simple in-memory fake-db for profile header images (URLs only).
// Each entry:
// { id, title, lightPath, darkPath, createdBy, createdAt, assignedRoles }

import { readJson, writeJson } from '@/server/fake-db/persistence'

export function generateId(prefix = 'ph') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const defaultHeaders = [
  {
    id: generateId(),
    title: 'Default Current Header',

    // Use public/ paths so these assets are available unchanged in production
    lightPath: getPublicUrl('/images/beranda/header-bg.png'),
    darkPath: getPublicUrl('/images/beranda/header-bg-dark.png'),
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    assignedRoles: ['mahasiswa', 'dosen', 'staf'],
    priority: 'current',
  },
]

export const db = {
  profileHeaders: readJson('profile-headers.json', defaultHeaders) as Array<Record<string, any>>,
}

export function saveProfileHeaders() {
  return writeJson('profile-headers.json', db.profileHeaders)
}
