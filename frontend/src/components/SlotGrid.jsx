import Skeleton from './Skeleton'
import { useI18n } from '../i18n'

export default function SlotGrid({ slots, loading, onSelect }) {
  const { t } = useI18n()
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3" aria-busy="true" aria-label={t('loadingSlots')}>
        {Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-10" />)}
      </div>
    )
  }

  if (slots.length === 0) {
    return <p className="text-center text-gray-500 py-8">{t('noSlots')}</p>
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {slots.map((slot) => (
        <button
          key={slot}
          onClick={() => onSelect(slot)}
          className="bg-white border border-gray-200 rounded-md py-2 text-sm font-medium text-gray-700 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-sm transition-all"
        >
          {slot.substring(11, 16)}
        </button>
      ))}
    </div>
  )
}
