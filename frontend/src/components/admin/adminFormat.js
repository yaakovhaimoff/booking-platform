export function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '–'
}

export function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '–'
}

export function matchesSearch(search, ...fields) {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  return fields.some(field => field != null && String(field).toLowerCase().includes(needle))
}

export function deleteErrorMessage(error) {
  switch (error?.error) {
    case 'CONFIRMATION_MISMATCH': return 'The text does not match. Nothing was deleted.'
    case 'ACCOUNT_OWNS_SHOP': return 'This account still owns a shop. Delete the shop first. Nothing was deleted.'
    case 'CANNOT_DELETE_OWN_ACCOUNT': return 'You cannot delete your own account. Nothing was deleted.'
    case 'TENANT_NOT_FOUND':
    case 'NO_ACCOUNT': return 'It no longer exists. Refresh the list.'
    default: return 'The delete failed. Check the list before trying again.'
  }
}
