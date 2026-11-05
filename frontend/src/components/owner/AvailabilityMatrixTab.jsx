import { useState, useEffect } from 'react'
import { useAuth0 } from '../../mockAuth'
import { getOperatingHours, updateOperatingHours } from '../../api/ownerApi'
import HoursRowInput from './HoursRowInput'
import { useI18n } from '../../i18n'

export default function AvailabilityMatrixTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const DAY_LABELS = t('days')
  const [hours, setHours] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => getOperatingHours(token, tenant.id))
      .then(data => setHours(data))
      .catch(() => setError({ key: 'loadHoursFailed' }))
      .finally(() => setLoading(false))
  }, [tenant.id, getAccessTokenSilently])

  function handleChange(dayOfWeek, field, value) {
    setHours(prev => prev.map(row =>
      row.dayOfWeek === dayOfWeek
        ? {
            ...row,
            [field]: value,
            ...(field === 'isClosed' && value ? { openTime: null, closeTime: null } : {}),
          }
        : row
    ))
  }

  async function handleSave() {
    setError(null)
    for (const row of hours) {
      if (!row.isClosed) {
        if (!row.openTime || !row.closeTime) {
          setError({ key: 'hoursRequired', vars: { day: row.dayOfWeek } })
          return
        }
        if (row.openTime >= row.closeTime) {
          setError({ key: 'hoursOrder', vars: { day: row.dayOfWeek } })
          return
        }
      }
    }

    setSaving(true)
    try {
      const token = await getAccessTokenSilently()
      const updated = await updateOperatingHours(token, tenant.id, hours)
      setHours(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setError({ key: 'saveHoursFailed' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('operatingHours')}</h2>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          {t(error.key, error.vars && { day: DAY_LABELS[error.vars.day] })}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl px-4 mb-6">
        {hours.map(row => (
          <HoursRowInput
            key={row.dayOfWeek}
            day={DAY_LABELS[row.dayOfWeek]}
            row={row}
            onChange={handleChange}
          />
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition disabled:opacity-60"
      >
        {saving ? t('saving') : saved ? t('saved') : t('save')}
      </button>
    </div>
  )
}
