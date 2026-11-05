export const OWNER_TABS = [
  { id: 'store',    label: 'tabStore' },
  { id: 'queue',    label: 'tabAppointments' },
  { id: 'services', label: 'tabServices' },
  { id: 'hours',    label: 'tabHours' },
]

export const ownerTabId = value => (OWNER_TABS.some(x => x.id === value) ? value : 'store')
