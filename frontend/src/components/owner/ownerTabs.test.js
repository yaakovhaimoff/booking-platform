import { describe, expect, it } from 'vitest'
import { ownerTabId } from './ownerTabs'

describe('ownerTabId', () => {
  it('opens on appointments when no tab or an unknown tab is given', () => {
    expect(ownerTabId(null)).toBe('queue')
    expect(ownerTabId('nonsense')).toBe('queue')
  })

  it('keeps a valid tab', () => {
    expect(ownerTabId('store')).toBe('store')
    expect(ownerTabId('analytics')).toBe('analytics')
  })
})
