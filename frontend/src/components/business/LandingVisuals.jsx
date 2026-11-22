import { useI18n } from '../../i18n'
import { StarIcon, SearchIcon, PinIcon, ChevronRightIcon } from '../shared/icons'
import Reveal from './Reveal'
import { useInView } from '../../utils/useInView'

const NAMES = ['Marco', 'Sara', 'Luca', 'Giulia', 'Elena', 'Paolo']
const INITIAL_TONES = ['bg-indigo-100 text-indigo-700', 'bg-pink-100 text-pink-700', 'bg-amber-100 text-amber-700', 'bg-emerald-100 text-emerald-700', 'bg-sky-100 text-sky-700', 'bg-violet-100 text-violet-700']
const BLOCK_TONES = ['bg-indigo-100 text-indigo-900', 'bg-pink-100 text-pink-900', 'bg-amber-100 text-amber-900', 'bg-emerald-100 text-emerald-900', 'bg-sky-100 text-sky-900', 'bg-violet-100 text-violet-900']

const CALENDAR_COLUMNS = [
  [{ name: 0, svc: 0, top: 0, height: 1, tone: 0 }, { name: 2, svc: 2, top: 2.5, height: 1.5, tone: 1 }],
  [{ name: 1, svc: 1, top: 0.5, height: 1.5, tone: 2 }, { name: 3, svc: 0, top: 3, height: 1, tone: 3 }],
  [{ name: 4, svc: 3, top: 1, height: 1, tone: 4 }, { name: 5, svc: 4, top: 2.5, height: 1.5, tone: 5 }],
]
const HOURS = ['09:00', '10:00', '11:00', '12:00']
const ROW_HEIGHT = 52

export function Avatar({ index, size = 'h-9 w-9' }) {
  return <span className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full text-xs font-bold ${INITIAL_TONES[index % INITIAL_TONES.length]}`}>{NAMES[index % NAMES.length][0]}</span>
}

function CalendarMockup() {
  const { t, weekdays } = useI18n()
  const services = t('bzMockServices')
  return (
    <div className="rounded-2xl bg-white p-4 sm:p-5 text-left">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-950">{t('bzMockWeek')}</p>
        <div className="flex gap-1.5" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-gray-200" /><span className="h-2.5 w-2.5 rounded-full bg-gray-200" /><span className="h-2.5 w-2.5 rounded-full bg-gray-200" /></div>
      </div>
      <div className="mt-4 grid grid-cols-[44px_repeat(3,1fr)] gap-x-2">
        <span />
        {weekdays.slice(0, 3).map(day => <p key={day} className="pb-2 text-center text-xs font-semibold text-gray-500">{day}</p>)}
        <div className="relative" style={{ height: ROW_HEIGHT * HOURS.length }}>
          {HOURS.map((hour, i) => <span key={hour} className="absolute text-[11px] text-gray-400" style={{ top: i * ROW_HEIGHT }}>{hour}</span>)}
        </div>
        {CALENDAR_COLUMNS.map((column, columnIndex) => (
          <div key={columnIndex} className="relative border-s border-gray-100" style={{ height: ROW_HEIGHT * HOURS.length }}>
            {HOURS.map((hour, i) => <span key={hour} className="absolute inset-x-0 border-t border-gray-100" style={{ top: i * ROW_HEIGHT }} />)}
            {column.map((event, eventIndex) => (
              <Reveal key={event.name} delay={400 + (columnIndex * 2 + eventIndex) * 120}
                className={`absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 ${BLOCK_TONES[event.tone]}`}
                style={{ top: event.top * ROW_HEIGHT + 2, height: event.height * ROW_HEIGHT - 4 }}>
                <p className="truncate text-xs font-bold">{NAMES[event.name]}</p>
                <p className="truncate text-[11px] opacity-80">{services[event.svc]}</p>
              </Reveal>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RequestCard({ name = 0, svc = 1, tapping = false }) {
  const { t } = useI18n()
  const services = t('bzMockServices')
  const [ref, inView] = useInView()
  return (
    <div ref={ref} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-3">
        <Avatar index={name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-gray-950">{t('bzNewRequest', { name: NAMES[name] })}</p>
          <p className="truncate text-xs text-gray-500">{services[svc]} · {t('bzTomorrow')} 10:00</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <span data-in={tapping && inView ? '' : undefined} className="bz-tap inline-flex h-8 items-center rounded-lg bg-gray-950 px-4 text-xs font-bold text-white">{t('bzApprove')}</span>
        <span className="inline-flex h-8 items-center rounded-lg bg-gray-100 px-4 text-xs font-semibold text-gray-700">{t('bzDecline')}</span>
      </div>
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="w-[min(100%,210px)] rounded-[28px] bg-gray-950 p-2 shadow-2xl shadow-indigo-900/20">
      <div className="rounded-[22px] bg-gradient-to-b from-indigo-50 to-white p-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <RequestCard name={1} svc={0} tapping />
        <div className="mt-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-2"><Avatar index={3} size="h-7 w-7" /><span className="h-2 w-20 rounded bg-gray-200" /></div>
          <div className="mt-2 h-2 w-28 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  )
}

export function HeroMockup() {
  return (
    <div className="relative mx-auto mt-14 max-w-[880px] sm:mt-20" aria-hidden="true">
      <Reveal className="rounded-[28px] bg-white/50 p-2.5 shadow-[0_40px_80px_-30px_rgb(79_70_229/.45)] ring-1 ring-white/80 backdrop-blur sm:p-3.5">
        <CalendarMockup />
      </Reveal>
      <Reveal delay={350} className="absolute -bottom-10 end-[-6px] sm:end-[-28px]">
        <div className="bz-float"><PhoneMockup /></div>
      </Reveal>
    </div>
  )
}

export function RequestStack() {
  const { t } = useI18n()
  const services = t('bzMockServices')
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <Reveal key={i} variant="slide" delay={i * 160} className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-100">
          <Avatar index={i + 2} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-gray-950">{t('bzNewRequest', { name: NAMES[i + 2] })}</p>
            <p className="truncate text-xs text-gray-500">{services[i]} · {t('bzTomorrow')} {['09:00', '11:30', '15:00'][i]}</p>
          </div>
          <span className="text-[11px] text-gray-400">{['23:04', '23:31', '06:48'][i]}</span>
        </Reveal>
      ))}
    </div>
  )
}

export function BookingSlotsMockup() {
  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30']
  const { t } = useI18n()
  const steps = t('steps')
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100" aria-hidden="true">
      <div className="flex gap-1.5">{steps.slice(0, 3).map((step, i) => <span key={step} className={`rounded-full px-3 py-1 text-xs font-semibold ${i === 2 ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-600'}`}>{step}</span>)}</div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {slots.map((slot, i) => (
          <Reveal key={slot} delay={i * 70} className={`rounded-lg py-2 text-center text-xs font-semibold ${i === 3 ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700'}`}>{slot}</Reveal>
        ))}
      </div>
    </div>
  )
}

export function ReviewsMockup() {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <Reveal key={i} delay={i * 150} className={`flex items-center gap-3 ${i ? 'mt-3 border-t border-gray-100 pt-3' : ''}`}>
          <Avatar index={i + 1} size="h-8 w-8" />
          <div className="flex-1">
            <div className="flex text-amber-400">{[0, 1, 2, 3, 4].map(n => <StarIcon key={n} size={14} />)}</div>
            <span className="mt-1.5 block h-2 rounded bg-gray-100" style={{ width: `${88 - i * 18}%` }} />
          </div>
        </Reveal>
      ))}
    </div>
  )
}

export function TomorrowMockup() {
  const { t } = useI18n()
  const services = t('bzMockServices')
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100" aria-hidden="true">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{t('bzTomorrow')}</p>
      {['09:00', '10:30', '12:00'].map((time, i) => (
        <Reveal key={time} delay={i * 140} className="mt-3 flex items-center gap-3">
          <span className="w-12 text-sm font-bold text-indigo-600">{time}</span>
          <span className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2 ${BLOCK_TONES[i * 2]}`}>
            <span className="text-sm font-bold">{NAMES[i]}</span><span className="text-xs opacity-75">{services[i]}</span>
          </span>
        </Reveal>
      ))}
    </div>
  )
}

export function BentoPageMockup() {
  const { t } = useI18n()
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm ring-1 ring-gray-100" aria-hidden="true">
      <div className="grid grid-cols-3 gap-2">
        <span className="h-20 rounded-xl bg-gradient-to-br from-indigo-300 to-indigo-500" />
        <span className="h-20 rounded-xl bg-gradient-to-br from-pink-200 to-pink-400" />
        <span className="h-20 rounded-xl bg-gradient-to-br from-amber-200 to-orange-300" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="h-3 w-28 rounded bg-gray-200" />
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{t('bzMockOpen')}</span>
      </div>
      <div className="mt-2 flex gap-2"><span className="h-8 flex-1 rounded-lg bg-emerald-500" /><span className="h-8 flex-1 rounded-lg bg-gray-100" /></div>
    </div>
  )
}

export function BentoServicesMockup() {
  const { t } = useI18n()
  const services = t('bzMockServices')
  return (
    <div className="flex flex-col gap-2" aria-hidden="true">
      {[['30 min', '€18'], ['20 min', '€10'], ['60 min', '€55']].map(([duration, price], i) => (
        <div key={price} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs shadow-sm ring-1 ring-gray-100">
          <span className="font-bold text-gray-900">{services[i]}</span><span className="text-gray-500">{duration} · {price}</span>
        </div>
      ))}
    </div>
  )
}

export function BentoHoursMockup() {
  const { weekdays } = useI18n()
  return (
    <div className="flex flex-wrap gap-1.5" aria-hidden="true">
      {weekdays.map((day, i) => <span key={day} className={`rounded-full px-3 py-1.5 text-xs font-bold ${i === 6 ? 'bg-gray-100 text-gray-400 line-through' : 'bg-indigo-100 text-indigo-700'}`}>{day}</span>)}
    </div>
  )
}

export function BentoClientsMockup() {
  return (
    <div className="flex items-center" aria-hidden="true">
      {[0, 1, 2, 3, 4].map(i => <span key={i} className="-me-2 rounded-full ring-2 ring-white"><Avatar index={i} size="h-10 w-10" /></span>)}
      <span className="ms-4 text-sm font-bold text-gray-500">+120</span>
    </div>
  )
}

export function BentoReviewsMockup() {
  return (
    <div className="flex items-center gap-2" aria-hidden="true">
      <span className="font-display text-4xl font-extrabold text-gray-950">4.9</span>
      <div className="flex text-amber-400">{[0, 1, 2, 3, 4].map(n => <StarIcon key={n} size={18} />)}</div>
    </div>
  )
}

export function BentoMarketMockup() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center" aria-hidden="true">
      <div className="flex h-11 flex-1 items-center gap-2 rounded-xl bg-white px-4 text-sm text-gray-500 shadow-sm ring-1 ring-gray-100"><SearchIcon size={16} />{t('bzMockSearch')}</div>
      <div className="flex flex-1 items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-gray-100">
        <span className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-400 to-pink-400" />
        <div className="min-w-0 flex-1"><span className="block h-2.5 w-24 rounded bg-gray-200" /><span className="mt-1.5 flex items-center gap-1 text-[11px] text-gray-500"><PinIcon size={12} />1.2 km</span></div>
        <ChevronRightIcon size={16} className="text-gray-400" />
      </div>
    </div>
  )
}
