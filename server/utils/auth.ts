import type { H3Event } from 'h3'

export async function setAuthOnlyRoute(event: H3Event, statusMessage: string = 'You must be signed in to access this API.') {
  // Dynamic import of #auth to avoid failing in static/disabled auth builds
  let getServerSession: any = null
  try {
    const authMod = await import('#auth')

    getServerSession = authMod.getServerSession
  }
  catch (e) {
    getServerSession = null
  }

  const session = getServerSession ? await getServerSession(event) : null

  if (!session) {
    throw createError({
      statusCode: 403,
      statusMessage,
    })
  }

  return session
}
