import { readJson, writeJson } from '@/server/fake-db/persistence'

export function generateId(prefix = 'sb') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`
}

const defaultSnackbars = [
  {
    id: generateId(),
    title: 'Selamat Ulang Tahun! 🥳',
    iconPrepend: '🎂',
    body: 'Semoga harimu menyenangkan!',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
    assignedRoles: ['mahasiswa', 'dosen', 'staf'],
    priority: 'current',
  },
]

export const db = {
  snackbars: readJson('snackbars.json', defaultSnackbars) as Array<Record<string, any>>,
}

export function saveSnackbars() {
  return writeJson('snackbars.json', db.snackbars)
}
