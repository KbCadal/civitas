import fs from 'node:fs'
import path from 'node:path'

const DB_DIR = path.join(process.cwd(), 'server', 'fake-db')

function ensureDir() {
  try {
    if (!fs.existsSync(DB_DIR))
      fs.mkdirSync(DB_DIR, { recursive: true })
  }
  catch (e) {
    // ignore
  }
}

export function readJson(filename: string, defaultValue: any) {
  try {
    ensureDir()

    const full = path.join(DB_DIR, filename)
    if (!fs.existsSync(full))
      return defaultValue

    const raw = fs.readFileSync(full, 'utf-8')

    return JSON.parse(raw)
  }
  catch (e) {
    return defaultValue
  }
}

export function writeJson(filename: string, data: any) {
  try {
    ensureDir()

    const full = path.join(DB_DIR, filename)

    fs.writeFileSync(full, JSON.stringify(data, null, 2), 'utf-8')

    return true
  }
  catch (e) {
    console.error('Failed to write JSON', e)

    return false
  }
}
