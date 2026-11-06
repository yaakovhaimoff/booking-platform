import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { PinIcon, SearchIcon } from '../shared/icons'

const field = 'flex items-center gap-3 px-4 py-3.5 min-w-0 flex-1 border-b border-gray-200 last:border-b-0 sm:border-b-0 sm:border-e sm:last:border-e-0'
const input = 'w-full bg-transparent text-[15px] text-gray-900 placeholder:text-gray-500 focus:outline-none'

// Drenched vermilion block, left-aligned headline, search as one flat ticket-like bar.
export default function SearchHero() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const [service, setService] = useState('')
  const [location, setLocation] = useState('')

  function submit(e) {
    e.preventDefault()
    const p = new URLSearchParams()
    if (service.trim()) p.set('q', service.trim())
    if (location.trim()) p.set('where', location.trim())
    navigate(`/search${p.size ? `?${p}` : ''}`)
  }

  return (
    <section className="mx-3 sm:mx-6 rounded-[28px] bg-gradient-to-br from-indigo-100 via-white to-pink-100 text-gray-950 overflow-hidden relative">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-10 pt-14 pb-12 sm:pt-24 sm:pb-20">
        <h1 className="font-display font-extrabold leading-[0.95] tracking-[-0.03em] text-[clamp(3rem,10vw,7.5rem)] max-w-[12ch]">{t('pHeroTitle')}</h1>
        <p className="mt-6 text-lg sm:text-xl text-gray-700 max-w-md">{t('pHeroSub')}</p>

        <form
          onSubmit={submit}
          role="search"
          className="mt-10 max-w-2xl bg-white text-gray-900 rounded-2xl p-1.5 flex flex-col sm:flex-row sm:items-stretch shadow-lg ring-1 ring-black/5"
        >
          <label className={field}>
            <SearchIcon size={18} className="text-indigo-600 shrink-0" />
            <input value={service} onChange={e => setService(e.target.value)} placeholder={t('pSearchService')} aria-label={t('pSearchServiceLabel')} className={input} />
          </label>
          <label className={field}>
            <PinIcon size={18} className="text-indigo-600 shrink-0" />
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder={t('pSearchLocation')} aria-label={t('pSearchLocationLabel')} className={input} />
          </label>
          <button type="submit" className="h-12 sm:h-auto rounded-xl bg-gray-950 px-8 text-sm font-bold text-white hover:bg-gray-800 transition max-sm:mt-1.5">
            {t('pSearch')}
          </button>
        </form>
      </div>
    </section>
  )
}
