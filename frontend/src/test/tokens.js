// Builds an unsigned JWT-shaped string. auth.js only reads the payload (the server verifies signatures).
function encode(value) {
  return btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function fakeToken({ sub = 'local|1', email, expiresInSeconds = 3600, now = Date.now() } = {}) {
  const payload = { sub, exp: Math.floor(now / 1000) + expiresInSeconds }
  if (email) payload.email = email
  return `${encode({ alg: 'HS256' })}.${encode(payload)}.signature`
}

export function loginResponse(overrides = {}) {
  return {
    token: fakeToken({ email: 'owner@torni.test' }),
    identity: 'owner@torni.test',
    name: 'Owner',
    phone: '',
    accountType: 'business',
    ...overrides,
  }
}

export function jsonResponse(status, body) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}
