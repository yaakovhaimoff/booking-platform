import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchHero from '../../components/consumer/SearchHero'
import VenueCarousel from '../../components/consumer/VenueCarousel'
import { listTenants } from '../../api/tenantApi'
import { useI18n } from '../../i18n'
import { ArrowRightIcon } from '../../components/shared/icons'

export default function HomePage() {
  const { t } = useI18n()
  const [shops, setShops] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('tenants-cache')) || [] } catch { return [] }
  })

  useEffect(() => {
    let cancelled = false
    listTenants()
      .then(d => { if (!cancelled) { sessionStorage.setItem('tenants-cache', JSON.stringify(d)); setShops(d) } })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <SearchHero />
      {shops.length > 0 && <VenueCarousel title={t('pBookNow')} venues={shops} />}

      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 mt-16">
        <div className="rounded-3xl bg-gray-950 text-white px-6 py-10 sm:px-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">{t('pBizPromoTitle')}</h2>
            <p className="mt-2 text-gray-300 max-w-md">{t('pBizPromoSub')}</p>
          </div>
          <Link to="/for-business" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-950 hover:bg-gray-100 transition">
            {t('pListBusiness')} <ArrowRightIcon size={16} />
          </Link>
        </div>
      </section>
    </>
  )
}
