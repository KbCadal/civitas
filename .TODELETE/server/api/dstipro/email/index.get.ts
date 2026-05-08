import { db } from '@/server/fake-db/dstipro/email'
import type { Email, EmailLabel } from '@/server/fake-db/dstipro/email/types'

export default defineEventHandler(event => {
  const query = getQuery(event)

  const searchQuery = (query.q as string || '').toLowerCase()
  const filter = query.filter as string || 'inbox'
  const label = query.label as string || ''

  function isInFolder(email: Email) {
    if (filter === 'trashed')
      return email.isDeleted
    if (filter === 'starred')
      return email.isStarred && !email.isDeleted

    return email.folder === (filter || email.folder) && !email.isDeleted
  }

  const filteredEmails = db.emails.filter(
    email =>
      (email.from.name.toLowerCase().includes(searchQuery)
        || email.subject.toLowerCase().includes(searchQuery))
      && isInFolder(email as Email)
      && (label ? email.labels.includes(label as EmailLabel) : true),
  )

  // 📩 **Email Meta Calculation**
  const emailsMeta = {
    inbox: db.emails.filter(
      email => !email.isDeleted && !email.isRead && email.folder === 'inbox',
    ).length,
    draft: db.emails.filter(
      email => !email.isDeleted && email.folder === 'draft',
    ).length,
    spam: db.emails.filter(
      email => !email.isDeleted && !email.isRead && email.folder === 'spam',
    ).length,
    star: db.emails.filter(email => !email.isDeleted && email.isStarred).length,
  }

  setResponseStatus(event, 200)

  return {
    emails: filteredEmails,
    emailsMeta,
  }
})
