import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { CalendarIcon, PinIcon, SearchIcon } from '../shared/icons'

const field = 'flex items-center gap-3 px-4 py-3 min-w-0 flex-1'
const input = 'w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-700 focus:outline-none'

export default function SearchHero() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [service, setService] = useState('')
  const [location, setLocation] = useState('')
  const [when, setWhen] = useState('')

  function submit(e) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (service.trim()) p.set('q', service.trim())
    if (location.trim()) p.set('where', location.trim())
    if (when) p.set('when', when)
    navigate(`/search${p.size ? `?${p}` : ''}`)
  }

  return (
    <section className="relative overflow-hidden -mt-16 pt-28 pb-16 px-4 bg-gradient-to-br from-indigo-100 via-white to-pink-100">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-950">{t('pHeroTitle')}</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-700">{t('pHeroSub')}</p>
      </div>

      <form
        onSubmit={submit}
        role="search"
        className="mt-10 max-w-4xl mx-auto bg-white rounded-3xl sm:rounded-full shadow-lg ring-1 ring-black/5 p-2 flex flex-col sm:flex-row sm:items-center sm:divide-x divide-gray-200 max-[480px]:divide-x-0 max-[480px]:gap-1"
      >
        <label className={field}>
          <SearchIcon size={18} className="text-gray-500 shrink-0" />
          <input value={service} onChange={e => setService(e.target.value)} placeholder={t('pSearchService')} aria-label={t('pSearchServiceLabel')} className={input} />
        </label>
        <label className={`${field} max-[480px]:border-t max-[480px]:border-gray-100`}>
          <PinIcon size={18} className="text-gray-500 shrink-0" />
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder={t('pSearchLocation')} aria-label={t('pSearchLocationLabel')} className={input} />
        </label>
        <label className={`${field} max-[480px]:border-t max-[480px]:border-gray-100`}>
          <CalendarIcon size={18} className="text-gray-500 shrink-0" />
          <span className="relative flex-1 min-w-0">
            <input
              type="datetime-local"
              value={when}
              onChange={e => setWhen(e.target.value)}
              aria-label={t('pDateTimeLabel')}
              className={`${input} ${when ? '' : 'text-transparent focus:text-gray-900'}`}
            />
            {!when && <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-sm text-gray-700">{t('pAnyTime')}</span>}
          </span>
        </label>
        <button type="submit" className="h-12 sm:ms-1 rounded-full bg-gray-950 px-8 text-sm font-semibold text-white hover:bg-gray-800 transition max-[480px]:mt-2 max-[480px]:w-full">
          {t('pSearch')}
        </button>
      </form>
    </section>
  )
}
