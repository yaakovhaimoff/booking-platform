import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { ChevronDownIcon } from '../../components/shared/icons'
import Reveal from '../../components/business/Reveal'
import DayTimeline from '../../components/business/DayTimeline'
import {
  BentoAnalyticsMockup, BentoClientsMockup, BentoHoursMockup, BentoMarketMockup, BentoPageMockup, BentoReviewsMockup, BentoServicesMockup, HeroMockup,
} from '../../components/business/LandingVisuals'

const BENTO = [
  { id: 'page', span: 'md:col-span-4', Visual: BentoPageMockup, tone: 'bg-brand-50' },
  { id: 'services', span: 'md:col-span-2', Visual: BentoServicesMockup, tone: 'bg-cta-50' },
  { id: 'hours', span: 'md:col-span-2', Visual: BentoHoursMockup, tone: 'bg-amber-50' },
  { id: 'clients', span: 'md:col-span-2', Visual: BentoClientsMockup, tone: 'bg-emerald-50' },
  { id: 'reviews', span: 'md:col-span-2', Visual: BentoReviewsMockup, tone: 'bg-sky-50' },
  { id: 'analytics', span: 'md:col-span-6', Visual: BentoAnalyticsMockup, tone: 'bg-emerald-50' },
  { id: 'market', span: 'md:col-span-6', Visual: BentoMarketMockup, tone: 'bg-brand-50' },
]

function SectionHeading({ light, bold, className = '' }) {
  return (
    <h2 className={`font-display text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] tracking-[-0.03em] text-gray-950 ${className}`}>
      <span className="block font-normal">{light}</span>
      <span className="block font-extrabold">{bold}</span>
    </h2>
  )
}

function PrimaryButton({ children }) {
  return <Link to="/partner" className="inline-flex h-13 items-center rounded-full bg-cta-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-cta-900/20 transition hover:-translate-y-0.5 hover:bg-cta-700">{children}</Link>
}

export default function BusinessLandingPage() {
  const { t } = useI18n()
  const steps = t('bzSteps')
  const faq = t('bzFaq')
  const types = t('bzTypes')

  return (
    <>
      <section className="relative mx-3 sm:mx-6 overflow-hidden rounded-[32px] bg-sky-hero-tall">
        <div className="pointer-events-none absolute -top-24 start-[-10%] h-80 w-80 rounded-full bg-white/25 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute top-20 end-[-8%] h-96 w-96 rounded-full bg-white/20 blur-3xl" aria-hidden="true" />
        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-10 pt-16 pb-24 sm:pt-24 sm:pb-32 text-center">
          <Reveal as="h1" className="font-display text-[clamp(2.4rem,6.5vw,5rem)] leading-[1.02] tracking-[-0.03em] text-white">
            <span className="block font-normal">{t('bzHeroLight')}</span>
            <span className="block font-extrabold">{t('bzHeroBold')}</span>
          </Reveal>
          <Reveal as="p" delay={120} className="mx-auto mt-6 max-w-xl text-lg font-medium text-white/95">{t('pLandSub')}</Reveal>
          <Reveal delay={240} className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton>{t('pGetStarted')}</PrimaryButton>
            <a href="#day" className="inline-flex h-13 items-center rounded-full bg-white px-8 py-4 text-sm font-bold text-gray-950 shadow-lg shadow-brand-900/10 transition hover:-translate-y-0.5">{t('bzSeeHow')}</a>
          </Reveal>
          <Reveal as="p" delay={320} className="mt-4 text-sm font-medium text-white/90">{t('bzHeroNote')}</Reveal>
          <HeroMockup />
        </div>
      </section>

      <section className="bz-marquee-wrap mt-20 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]" aria-label={t('pBusinessTypes')}>
        <div className="bz-marquee">
          {[0, 1].map(copy => (
            <ul key={copy} className="flex shrink-0 items-center gap-10 pe-10" aria-hidden={copy ? 'true' : undefined}>
              {types.map(type => <li key={type} className="flex items-center gap-10 whitespace-nowrap text-xl font-bold text-gray-800 sm:text-2xl">{type}<span className="h-2.5 w-2.5 rotate-45 rounded-sm bg-brand-400" aria-hidden="true" /></li>)}
            </ul>
          ))}
        </div>
      </section>

      <DayTimeline />

      <section id="features" className="scroll-mt-20 max-w-[1200px] mx-auto px-4 sm:px-6 py-24 sm:py-32">
        <Reveal><SectionHeading light={t('bzBentoLight')} bold={t('bzBentoBold')} className="text-center" /></Reveal>
        <div className="mt-14 grid gap-4 md:grid-cols-6">
          {BENTO.map(({ id, span, Visual, tone }, i) => {
            const copy = t('bzBento')[id]
            return (
              <Reveal key={id} delay={(i % 3) * 100} className={`bz-bento flex flex-col justify-between gap-8 rounded-3xl p-6 sm:p-8 ${span} ${tone}`}>
                <div><h3 className="text-2xl font-extrabold text-gray-950">{copy.t}</h3><p className="mt-2 max-w-md text-gray-600">{copy.d}</p></div>
                <Visual />
              </Reveal>
            )
          })}
        </div>
      </section>

      <section id="steps" className="scroll-mt-20 max-w-[1100px] mx-auto px-5 sm:px-10 pb-24 sm:pb-32">
        <div className="grid gap-12 md:grid-cols-[1fr_1.1fr] md:gap-20">
          <Reveal><SectionHeading light={t('bzStepsLight')} bold={t('bzStepsBold')} /></Reveal>
          <Reveal as="ol" className="relative flex flex-col gap-10 ps-2">
            <span className="absolute start-[27px] top-4 bottom-4 w-0.5 bg-gray-100" aria-hidden="true"><span className="bz-fill block h-full w-full bg-brand-500" /></span>
            {steps.map((step, i) => (
              <li key={step.t} className="relative flex gap-5">
                <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white font-display text-lg font-extrabold text-brand-600 ring-2 ring-brand-200">{i + 1}</span>
                <div className="pt-1.5"><h3 className="text-xl font-extrabold text-gray-950">{step.t}</h3><p className="mt-1 text-gray-600">{step.d}</p></div>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <section id="faq" className="scroll-mt-20 max-w-[860px] mx-auto px-5 sm:px-10 pb-24 sm:pb-32">
        <Reveal><SectionHeading light={t('bzFaqLight')} bold={t('bzFaqBold')} className="text-center" /></Reveal>
        <div className="mt-12 flex flex-col gap-3">
          {faq.map((item, i) => (
            <Reveal key={item.q} delay={i * 70}>
              <details className="bz-faq group rounded-2xl bg-gray-50 px-6 py-5">
                <summary className="flex items-center justify-between gap-4 text-lg font-bold text-gray-950">{item.q}<span className="bz-faq-chevron text-gray-500"><ChevronDownIcon size={20} /></span></summary>
                <p className="mt-3 text-gray-600">{item.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-3 sm:mx-6 mb-6 overflow-hidden rounded-[32px] bg-brand-500 px-5 py-20 text-center sm:py-28">
        <Reveal>
          <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">{t('bzCtaTitle')}</h2>
          <p className="mx-auto mt-4 max-w-md text-lg font-medium text-white/95">{t('bzCtaSub')}</p>
          <Link to="/partner" className="mt-9 inline-flex h-13 items-center rounded-full bg-cta-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-brand-900/20 transition hover:-translate-y-0.5 hover:bg-cta-700">{t('pGetStarted')}</Link>
        </Reveal>
      </section>
    </>
  )
}
