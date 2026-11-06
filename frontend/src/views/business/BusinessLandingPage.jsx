import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'

const FEATURES = [
  { id: 'calendar', t: 'pFeat1T', d: 'pFeat1D', tile: 'bg-indigo-500 text-white', glyph: '09:30' },
  { id: 'grow', t: 'pFeat2T', d: 'pFeat2D', tile: 'bg-pink-200 text-pink-900', glyph: '+12' },
]

// Business world.
export default function BusinessLandingPage() {
  const { t } = useI18n()
  return (
    <>
      <section className="mx-3 sm:mx-6 rounded-[28px] bg-gradient-to-b from-white to-indigo-50 text-gray-950">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-10 pt-14 pb-16 sm:pt-24 sm:pb-24">
          <h1 className="font-display font-extrabold leading-[0.98] tracking-[-0.03em] text-[clamp(2.5rem,7vw,5.5rem)] max-w-[16ch]">{t('pLandTitle')}</h1>
          <p className="mt-6 text-lg text-gray-700 max-w-lg">{t('pLandSub')}</p>
          <Link to="/partner" className="mt-10 inline-flex h-13 items-center rounded-xl bg-gray-950 px-8 py-4 text-sm font-bold text-white hover:bg-gray-800 transition">{t('pGetStarted')}</Link>
        </div>
      </section>

      <div id="features" className="max-w-[1200px] mx-auto px-4 sm:px-6 flex flex-col gap-20 py-20">
        {FEATURES.map((f, i) => (
          <section key={f.id} className={`grid md:grid-cols-[1.2fr_1fr] gap-10 items-center ${i % 2 ? 'md:[&>div:first-child]:order-2 md:grid-cols-[1fr_1.2fr]' : ''}`}>
            <div>
              <h2 className="text-4xl font-extrabold text-gray-950">{t(f.t)}</h2>
              <p className="mt-3 text-lg text-gray-700 max-w-md">{t(f.d)}</p>
            </div>
            <div className={`aspect-[16/10] rounded-2xl flex items-end p-6 font-display font-extrabold text-[clamp(4rem,10vw,8rem)] leading-none tracking-tight ${f.tile}`} aria-hidden="true">{f.glyph}</div>
          </section>
        ))}
      </div>

      <section className="px-4 pb-20 flex justify-center">
        <Link to="/partner" className="inline-flex items-center rounded-xl bg-gray-950 px-8 py-4 text-sm font-bold text-white hover:bg-indigo-600 transition">{t('pGetStarted')}</Link>
      </section>
    </>
  )
}
