import { useState } from 'react'
import ListFilters from './ListFilters'
import { formatDateTime, matchesSearch } from './adminFormat'

const FILTERS = [
  { value: 'all', label: 'All clients' },
  { value: 'account', label: 'With an account' },
  { value: 'guest', label: 'Guests only' },
]

export default function ClientsTab({ clients }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const shown = clients.filter(client =>
    matchesSearch(search, client.name, client.phone, client.email, client.shopName, client.shopSlug) &&
    (filter === 'all' || (filter === 'account') === (client.accountId != null)))

  return (
    <div>
      <ListFilters label="clients" search={search} onSearch={setSearch} placeholder="Search name, phone, email or shop"
        filterLabel="Filter clients" filterValue={filter} onFilter={setFilter} filterOptions={FILTERS}
        count={shown.length} total={clients.length} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Phone', 'Email', 'Shop', 'Bookings', 'Reviews', 'Last booking'].map(column => (
                <th key={column} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {shown.map((client, index) => (
              <tr key={`${client.shopId}-${client.accountId ?? 'guest'}-${client.phone}-${index}`} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{client.name ?? '–'}</td>
                <td className="px-4 py-3 text-gray-600">{client.phone ?? '–'}</td>
                <td className="px-4 py-3 text-gray-600">{client.email ?? '–'}</td>
                <td className="px-4 py-3 text-gray-600">{client.shopName ?? client.shopSlug}</td>
                <td className="px-4 py-3 text-gray-600">{client.bookingCount}</td>
                <td className="px-4 py-3 text-gray-600">{client.reviewCount}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(client.lastBooking)}</td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No clients match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
