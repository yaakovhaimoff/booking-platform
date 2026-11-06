import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'

const FEATURES = [
  { id: 'calendar', t: 'pFeat1T', d: 'pFeat1D', hue: 250 },
  { id: 'grow', t: 'pFeat2T', d: 'pFeat2D', hue: 330 },
]

export default function BusinessLandingPage() {
  const { t } = useI18n()
  return (
    <>
      <section className="px-4 pt-14 pb-20 text-center bg-gradient-to-b from-white to-indigo-50">
        <h1 className="max-w-4xl mx-auto text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-950">{t('pLandTitle')}</h1>
        <p className="mt-4 text-base sm:text-lg text-gray-700">{t('pLandSub')}</p>
        <div className="mt-8 flex justify-center">
          <Link to="/partner" className="inline-flex h-12 items-center justify-center rounded-full bg-gray-950 px-8 text-sm font-semibold text-white hover:bg-gray-800">{t('pGetStarted')}</Link>
        </div>
      </section>

      <div id="features" className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-16 py-16">
        {FEATURES.map((f, i) => (
          <section key={f.id} className={`grid md:grid-cols-2 gap-8 items-center ${i % 2 ? 'md:[&>div:first-child]:order-2' : ''}`}>
            <div>
              <h2 className="text-3xl font-bold text-gray-950">{t(f.t)}</h2>
              <p className="mt-3 text-gray-700 max-w-md">{t(f.d)}</p>
            </div>
            <div className="h-64 rounded-3xl" style={{ backgroundImage: `linear-gradient(135deg, hsl(${f.hue} 70% 55%), hsl(${f.hue + 50} 80% 75%))` }} aria-hidden="true" />
          </section>
        ))}
      </div>

      <section className="px-4 pb-16 text-center">
        <Link to="/partner" className="inline-flex h-12 items-center rounded-full bg-gray-950 px-8 text-sm font-semibold text-white hover:bg-gray-800">{t('pGetStarted')}</Link>
      </section>
    </>
  )
}
