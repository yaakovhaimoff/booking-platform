import { useState } from 'react'
import ListFilters from './ListFilters'
import { formatDate, formatDateTime, matchesSearch } from './adminFormat'

const FILTERS = [
  { value: 'all', label: 'All shops' },
  { value: 'visible', label: 'Visible to public' },
  { value: 'hidden', label: 'Hidden from public' },
]

export default function ShopsTab({ shops, onToggle, onDelete }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const shown = shops.filter(shop =>
    matchesSearch(search, shop.name, shop.slug, shop.ownerEmail) &&
    (filter === 'all' || (filter === 'visible') === shop.visibleToPublic))

  return (
    <div>
      <ListFilters label="shops" search={search} onSearch={setSearch} placeholder="Search name, link or owner"
        filterLabel="Filter shops" filterValue={filter} onFilter={setFilter} filterOptions={FILTERS}
        count={shown.length} total={shops.length} />
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Link', 'Owner', 'Created', 'Bookings', 'Last activity', 'Public', 'Actions'].map(column => (
                <th key={column} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{column}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {shown.map(shop => (
              <tr key={shop.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">{shop.name ?? '–'}</td>
                <td className="px-4 py-3">
                  <a href={`/store/${shop.slug}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">/store/{shop.slug}</a>
                </td>
                <td className="px-4 py-3 text-gray-600">{shop.ownerEmail ?? '–'}</td>
                <td className="px-4 py-3 text-gray-600">{formatDate(shop.createdAt)}</td>
                <td className="px-4 py-3 text-gray-600">{shop.bookingCount}</td>
                <td className="px-4 py-3 text-gray-600">{formatDateTime(shop.lastActivity)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    shop.visibleToPublic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${shop.visibleToPublic ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {shop.visibleToPublic ? 'Visible' : 'Hidden'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <button type="button" onClick={() => onToggle(shop)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      shop.enabled ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {shop.enabled ? 'Hide' : 'Show'}
                  </button>
                  <button type="button" onClick={() => onDelete(shop)} aria-label={`Delete shop ${shop.name ?? shop.slug}`}
                    className="ml-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No shops match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
