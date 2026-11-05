import { useI18n } from '../../i18n'

export default function ServiceTable({ services, currency, onEdit, onDelete }) {
  const { t, fmtPrice } = useI18n()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
            <th className="pb-2 pr-4">{t('colName')}</th>
            <th className="pb-2 pr-4">{t('colDuration')}</th>
            <th className="pb-2 pr-4">{t('colPrice')}</th>
            <th className="pb-2">{t('colActions')}</th>
          </tr>
        </thead>
        <tbody>
          {services.map(s => (
            <tr key={s.id} className="border-b border-gray-100 last:border-0">
              <td className="py-3 pr-4 font-medium text-gray-800">{s.name}</td>
              <td className="py-3 pr-4 text-gray-600">{s.durationMinutes}</td>
              <td className="py-3 pr-4 text-gray-600">{fmtPrice(Number(s.price), currency)}</td>
              <td className="py-3 flex gap-2">
                <button
                  onClick={() => onEdit(s)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={() => onDelete(s.id)}
                  className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded transition"
                >
                  {t('delete')}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
