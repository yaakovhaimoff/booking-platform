// Number of PENDING appointments waiting for the owner, shared by the dashboard (which polls)
// and the navigation (which shows the badge). Same pattern as mockAuth.js.
import { useSyncExternalStore } from 'react'

let count = 0
const listeners = new Set()
const subscribe = cb => { listeners.add(cb); return () => listeners.delete(cb) }

export function setPendingCount(n) {
  if (n === count) return
  count = n
  listeners.forEach(l => l())
}

export function usePendingCount() {
  return useSyncExternalStore(subscribe, () => count)
}
