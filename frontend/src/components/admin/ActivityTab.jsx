import { formatDateTime } from './adminFormat'

export default function ActivityTab({ entries }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {['When', 'Admin', 'Action', 'Target', 'Details'].map(column => (
              <th key={column} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {entries.map(entry => (
            <tr key={entry.id}>
              <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDateTime(entry.createdAt)}</td>
              <td className="px-4 py-3 text-gray-600">{entry.adminIdentity}</td>
              <td className="px-4 py-3 font-medium text-gray-900">{entry.action}</td>
              <td className="px-4 py-3 text-gray-600">{entry.targetType} {entry.targetLabel}</td>
              <td className="px-4 py-3 text-gray-600">{entry.details ?? '–'}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Nothing has been logged yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
