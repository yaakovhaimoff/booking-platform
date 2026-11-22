import { useState } from 'react'
import ListFilters from './ListFilters'
import { formatDate, matchesSearch } from './adminFormat'

const FILTERS = [
  { value: 'all', label: 'All account types' },
  { value: 'business', label: 'Business' },
  { value: 'consumer', label: 'Consumer' },
  { value: 'none', label: 'No type yet' },
  { value: 'owners', label: 'Owns a shop' },
]

function matchesFilter(account, filter) {
  if (filter === 'all') return true
  if (filter === 'none') return !account.accountType
  if (filter === 'owners') return account.ownedShopId != null
  return account.accountType === filter
}

export default function AccountsTab({ accounts, ownEmail, onDelete }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const shown = accounts.filter(account =>
    matchesSearch(search, account.identity, account.name, account.phone, account.ownedShopName, account.ownedShopSlug) &&
    matchesFilter(account, filter))

  return (
    <div>
      <ListFilters label="accounts" search={search} onSearch={setSearch} placeholder="Search email, name, phone or shop"
        filterLabel="Filter accounts" filterValue={filter} onFilter={setFilter} filterOptions={FILTERS}
        count={shown.length} total={accounts.length} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Identity', 'Name', 'Phone', 'Type', 'Created', 'Owns shop', 'Actions'].map(column => (
                <th key={column} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {shown.map(account => {
              const isOwn = ownEmail != null && account.identity === ownEmail.toLowerCase()
              return (
                <tr key={account.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">{account.identity}</td>
                  <td className="px-4 py-3 text-gray-600">{account.name ?? '–'}</td>
                  <td className="px-4 py-3 text-gray-600">{account.phone ?? '–'}</td>
                  <td className="px-4 py-3 text-gray-600">{account.accountType ?? '–'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(account.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {account.ownedShopId != null ? `${account.ownedShopName ?? account.ownedShopSlug}` : '–'}
                  </td>
                  <td className="px-4 py-3">
                    {isOwn ? (
                      <span className="text-xs text-gray-400">You</span>
                    ) : (
                      <button type="button" onClick={() => onDelete(account)} aria-label={`Delete account ${account.identity}`}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition">
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No accounts match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
