// fetch wrapper: no client-side timeout (cold backends can take a while), but GETs
// retry once on a network failure. Failures throw { error: 'NETWORK' } so callers can
// show an error/retry state.
async function attempt(url, opts) {
  try {
    return await fetch(url, opts)
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
