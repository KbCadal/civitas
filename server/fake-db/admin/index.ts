import { readJson, writeJson } from '@/server/fake-db/persistence'

export const adminDb = {
  // initial admin allowed preferred_username (string values)
  allowedPreferredUsername: readJson('admin-allowlist.json', ['admin']) as string[],
}

export function saveAdminAllowlist() {
  return writeJson('admin-allowlist.json', adminDb.allowedPreferredUsername)
}
