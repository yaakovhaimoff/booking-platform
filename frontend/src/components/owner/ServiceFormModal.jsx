import { useState } from 'react'
import { useI18n } from '../../i18n'

export default function ServiceFormModal({ service, currency, onSave, onClose }) {
  const { t, currencySymbol } = useI18n()
  const [name, setName] = useState(service?.name ?? '')
  const [durationMinutes, setDurationMinutes] = useState(service ? String(service.durationMinutes) : '')
  const [price, setPrice] = useState(service ? String(service.price) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim()) { setError(t('nameRequired')); return }
    if (Number(durationMinutes) <= 0) { setError(t('durationInvalid')); return }
    if (Number(price) < 0) { setError(t('priceInvalid')); return }

    setSaving(true)
    try {
      await onSave({ name: name.trim(), durationMinutes: Number(durationMinutes), price: Number(price) })
      onClose()
    } catch {
      setError(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {service ? t('editService') : t('addService')}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('colName')}</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('durationMinutes')}</label>
            <input
              type="number"
              min="1"
              value={durationMinutes}
              onChange={e => setDurationMinutes(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('priceLabel', { symbol: currencySymbol(currency) })}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {saving ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
