import { expireSession } from '../auth'

// fetch wrapper: no client-side timeout (cold backends can take a while), but GETs
// retry once on a network failure. Failures throw { error: 'NETWORK' } so callers can
// show an error/retry state.
async function attempt(url, opts) {
  try {
    const res = await fetch(url, opts)
    // The server refused our token (expired, revoked, signing key changed): drop the session so the
    // protected routes send the user back to log in instead of failing silently.
    if (res.status === 401 && opts.headers && opts.headers.Authorization) expireSession()
    return res
  } catch {
    throw { error: 'NETWORK' }
  }
}

export async function http(url, opts = {}) {
  const isGet = !opts.method || opts.method === 'GET'
  try {
    return await attempt(url, opts)
  } catch (e) {
    if (!isGet) throw e
    return attempt(url, opts)
  }
}

// Wake the backend (free-tier hosts sleep). Fire and forget.
export function warmUp(base) {
  fetch(`${base}/tenants`, { method: 'GET' }).catch(() => {})
}
