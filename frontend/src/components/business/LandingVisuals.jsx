import { useI18n } from '../../i18n'
import { SearchIcon, PinIcon, PhoneIcon } from '../shared/icons'
import { OWNER_TABS } from '../owner/ownerTabs'
import { STATUS_STYLES } from '../owner/statusStyles'
import Reveal from './Reveal'
import { useInView } from '../../utils/useInView'

// Sample data only. The markup and classes below mirror the real owner dashboard and public shop pages
// (AppointmentCard, AppointmentCalendar, SideNav, ServiceCard, SlotGrid, Reviews, StoreHeader, ClientsTab,
// HoursRowInput, VenueCard) so the landing page shows what the product really looks like.
const CLIENTS = [
  { name: 'Marco Rossi', phone: '+39 333 123 4567' },
  { name: 'Sara Bianchi', phone: '+39 347 555 0198' },
  { name: 'Luca Ferri', phone: '+39 320 555 0142' },
  { name: 'Giulia Conti', phone: '+39 339 555 0107' },
]
const BOOKED_OFFSETS = { '-14': 1, '-12': 2, '-9': 1, '-7': 3, '-5': 2, '-2': 1, 0: 3, 2: 2, 5: 1, 7: 2, 9: 1 }
const PENDING_OFFSETS = [0, 2, 7]
const SLOTS = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '14:00']

function daysFromNow(offset) {
  const day = new Date()
  day.setDate(day.getDate() + offset)
  return day
}

function Stars({ value, size = 'text-sm' }) {
  return (
    <span className={`${size} tracking-tight text-amber-400`} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= Math.round(value) ? '' : 'text-gray-300'}>★</span>)}
    </span>
  )
}

function StatusPill({ status }) {
  const { t } = useI18n()
  return <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${STATUS_STYLES[status] || ''}`}>{t('status_' + status)}</span>
}

function MockAppointment({ client = 0, service = 0, time = '10:00', status = 'PENDING', dayOffset = 1, tapping = false, showDate = true }) {
  const { t, locale } = useI18n()
  const [ref, inView] = useInView()
  const services = t('bzMockServices')
  const date = daysFromNow(dayOffset).toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' })
  return (
    <div ref={ref} className="border border-gray-200 rounded-xl p-4 bg-white text-left">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-bold text-gray-900 leading-none">{time}</div>
          {showDate && <div className="text-xs text-gray-500 mt-1">{date}</div>}
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-3">
        <div className="font-medium text-gray-900">{CLIENTS[client].name}</div>
        <div className="text-sm text-gray-600">{services[service]}</div>
        <span className="inline-block mt-1 text-sm text-brand-600">{CLIENTS[client].phone}</span>
      </div>
      <div className="flex gap-3 mt-4">
        {status === 'PENDING' && (
          <span data-in={tapping && inView ? '' : undefined} className="bz-tap flex-1 py-2.5 text-center text-sm font-semibold bg-green-600 text-white rounded-lg">{t('approve')}</span>
        )}
        <span className="flex-1 py-2.5 text-center text-sm font-semibold border border-red-200 text-red-600 rounded-lg">{t('cancel')}</span>
      </div>
    </div>
  )
}

export function RequestCard({ name = 0, svc = 1, tapping = false }) {
  return <MockAppointment client={name} service={svc} tapping={tapping} />
}

function SideNavMock() {
  const { t } = useI18n()
  return (
    <div className="hidden w-48 shrink-0 flex-col gap-1 border-e border-gray-200 bg-white p-3 sm:flex">
      {OWNER_TABS.map(tab => (
        <span key={tab.id} className={`text-left px-4 py-2.5 rounded-lg text-sm font-medium ${tab.id === 'queue' ? 'bg-brand-50 text-brand-700' : 'text-gray-600'}`}>
          {t(tab.label)}
          {tab.id === 'queue' && <span className="ml-2 inline-flex min-w-5 h-5 px-1.5 items-center justify-center rounded-full bg-red-600 text-white text-xs font-semibold">2</span>}
        </span>
      ))}
    </div>
  )
}

function MonthCalendarMock() {
  const { locale, weekStart, weekdays } = useI18n()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstWeekday = (new Date(year, month, 1).getDay() - weekStart + 7) % 7
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  const today = now.getDate()
  const bookedDays = {}
  for (const [offset, count] of Object.entries(BOOKED_OFFSETS)) bookedDays[today + Number(offset)] = count
  const pendingDays = PENDING_OFFSETS.map(offset => today + offset)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="px-2 py-1 text-gray-600">←</span>
        <h3 className="font-semibold text-gray-800">{new Date(year, month, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' })}</h3>
        <span className="px-2 py-1 text-gray-600">→</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-1">
        {weekdays.map(weekday => <div key={weekday}>{weekday}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />
          const count = bookedDays[day] || 0
          const isSelected = day === today
          return (
            <span key={day} className={`relative aspect-square rounded-md text-sm flex items-center justify-center ${isSelected ? 'bg-brand-600 text-white' : count > 0 ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-500'}`}>
              {day}
              {count > 0 && <span className={`absolute top-0.5 right-1 text-[10px] leading-none font-bold ${isSelected ? 'text-brand-100' : 'text-brand-500'}`}>{count}</span>}
              {pendingDays.includes(day) && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function DashboardMock() {
  const { t, locale } = useI18n()
  const selectedLabel = daysFromNow(0).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="flex overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-gray-200">
      <SideNavMock />
      <div className="grid min-w-0 flex-1 gap-6 p-4 sm:p-5 lg:grid-cols-[17rem_1fr]">
        <MonthCalendarMock />
        <div className="min-w-0">
          <h3 className="mb-3 text-base font-semibold text-gray-900 capitalize">{selectedLabel}</h3>
          <div className="flex flex-col gap-4">
            <section>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t('status_PENDING')} · 1</h4>
              <MockAppointment client={1} service={1} time="10:00" dayOffset={0} showDate={false} />
            </section>
            <section className="hidden sm:block">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{t('status_CONFIRMED')} · 1</h4>
              <MockAppointment client={0} service={0} time="11:30" status="CONFIRMED" dayOffset={0} showDate={false} />
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

function PhoneMockup() {
  return (
    <div className="w-[min(100%,230px)] rounded-[28px] bg-gray-950 p-2 shadow-2xl shadow-brand-900/20">
      <div className="rounded-[22px] bg-gray-50 p-3">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" />
        <MockAppointment client={2} service={0} time="15:00" tapping />
      </div>
    </div>
  )
}

export function HeroMockup() {
  return (
    <div className="relative mx-auto mt-14 max-w-[900px] sm:mt-20" aria-hidden="true">
      <Reveal className="rounded-[28px] bg-white/50 p-2.5 shadow-[0_40px_80px_-30px_rgb(79_70_229/.45)] ring-1 ring-white/80 backdrop-blur sm:p-3.5">
        <DashboardMock />
      </Reveal>
      <Reveal delay={350} className="absolute -bottom-10 end-[-6px] hidden sm:block sm:end-[-28px]">
        <div className="bz-float"><PhoneMockup /></div>
      </Reveal>
    </div>
  )
}

export function RequestStack() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {[0, 1].map(index => (
        <Reveal key={index} variant="slide" delay={index * 160}>
          <MockAppointment client={index + 1} service={index} time={['09:00', '11:30'][index]} />
        </Reveal>
      ))}
    </div>
  )
}

export function BookingSlotsMockup() {
  const { t } = useI18n()
  const steps = t('steps')
  const services = t('bzMockServices')
  return (
    <div className="rounded-2xl bg-gray-50 p-4 text-left ring-1 ring-gray-100" aria-hidden="true">
      <div className="flex gap-1.5">{steps.map((step, index) => <div key={step} className={`h-1.5 flex-1 rounded-full ${index <= 2 ? 'bg-brand-600' : 'bg-gray-200'}`} />)}</div>
      <p className="mt-1.5 text-xs text-gray-500">{t('step', { n: 3 })} · {steps[2]}</p>
      <p className="mb-4 mt-4 text-sm text-gray-500">{t('serviceLabel')} <span className="font-medium text-gray-700">{services[0]}</span></p>
      <div className="grid grid-cols-3 gap-3">
        {SLOTS.map((slot, index) => (
          <Reveal key={slot} delay={index * 70} className={`bg-white border rounded-md py-2 text-center text-sm font-medium ${index === 3 ? 'border-brand-400 text-brand-600 shadow-sm' : 'border-gray-200 text-gray-700'}`}>{slot}</Reveal>
        ))}
      </div>
    </div>
  )
}

export function ReviewsMockup() {
  const { t, fmtDate } = useI18n()
  const reviews = t('bzMockReviews')
  return (
    <div className="text-left" aria-hidden="true">
      <div className="mb-3 flex items-baseline justify-between">
        <h4 className="text-lg font-semibold text-gray-900">{t('reviews')}</h4>
        <p className="text-sm text-gray-600"><Stars value={5} /> <span className="font-semibold text-gray-900">4.9</span> · {t('reviewCount', { n: 12 })}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {reviews.map((review, index) => (
          <Reveal as="li" key={review.n} delay={index * 150} className="rounded-lg border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-medium text-gray-900">{review.n}</p>
              <Stars value={5} />
            </div>
            <p className="mt-1 text-sm text-gray-700">{review.c}</p>
            <p className="mt-2 text-xs text-gray-400">{fmtDate(daysFromNow(-(index + 1)).toLocaleDateString('sv-SE'))}</p>
          </Reveal>
        ))}
      </ul>
    </div>
  )
}

export function TomorrowMockup() {
  const { t, locale } = useI18n()
  const services = t('bzMockServices')
  const label = daysFromNow(1).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
  return (
    <div className="text-left" aria-hidden="true">
      <h4 className="mb-1 text-base font-semibold text-gray-900 capitalize">{label}</h4>
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">{t('status_CONFIRMED')} · 3</p>
      <div className="flex flex-col gap-2">
        {['09:00', '10:30', '12:00'].map((time, index) => (
          <Reveal key={time} delay={index * 140} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
            <span className="w-14 text-xl font-bold leading-none text-gray-900">{time}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-gray-900">{CLIENTS[index].name}</div>
              <div className="truncate text-sm text-gray-600">{services[index]}</div>
            </div>
            <StatusPill status="CONFIRMED" />
          </Reveal>
        ))}
      </div>
    </div>
  )
}

export function BentoPageMockup() {
  const { t } = useI18n()
  const actions = [
    { label: t('whatsapp'), color: 'bg-green-500', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><path d="M4 5h16v11H9l-5 4z" /></svg> },
    { label: t('call'), color: 'bg-brand-600', icon: <PhoneIcon size={20} /> },
    { label: t('maps'), color: 'bg-sky-500', icon: <PinIcon size={20} /> },
  ]
  return (
    <div className="overflow-hidden rounded-2xl bg-white text-left shadow-sm" aria-hidden="true">
      <div className="h-24" style={{ background: 'linear-gradient(135deg, #c7d2fe, #fbcfe8)' }} />
      <div className="flex flex-wrap items-start gap-x-5 gap-y-4 px-5 pb-5">
        <div className="-mt-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-4 border-white bg-brand-100 text-2xl font-bold text-brand-600 shadow">S</div>
        <div className="min-w-0 flex-1 pt-2">
          <p className="text-xl font-bold text-gray-900">Studio Marco</p>
          <p className="mt-0.5 text-sm text-gray-500">Via Roma 12</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-gray-600"><span className="text-amber-400">★</span><span className="font-semibold text-gray-900">4.9</span></p>
          <p className="mt-2 flex w-fit items-center gap-2 rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-green-700"><span className="h-2 w-2 rounded-full bg-green-500" />{t('openNowUntil', { time: '19:00' })}</p>
        </div>
        <div className="flex gap-4 pt-1">
          {actions.map(action => (
            <span key={action.label} className="flex flex-col items-center gap-1.5">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm ${action.color}`}>{action.icon}</span>
              <span className="text-xs text-gray-600">{action.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BentoServicesMockup() {
  const { t, fmtPrice } = useI18n()
  const services = t('bzMockServices')
  return (
    <div className="flex flex-col gap-2.5" aria-hidden="true">
      {[[18, 30], [10, 20], [55, 60]].map(([price, minutes], index) => (
        <div key={price} className="flex items-start justify-between rounded-lg border border-gray-200 bg-white p-4 text-left">
          <div>
            <h3 className="text-base font-semibold text-gray-800">{services[index]}</h3>
            <p className="mt-1 text-sm text-gray-500">{minutes} {t('min')}</p>
          </div>
          <span className="text-base font-medium text-brand-600">{fmtPrice(price, 'EUR')}</span>
        </div>
      ))}
    </div>
  )
}

export function BentoHoursMockup() {
  const { t, weekdays } = useI18n()
  const rows = [
    { day: weekdays[0], closed: false },
    { day: weekdays[1], closed: false },
    { day: weekdays[6], closed: true },
  ]
  return (
    <div className="rounded-xl bg-white px-4 text-left shadow-sm ring-1 ring-gray-100" aria-hidden="true">
      {rows.map(row => (
        <div key={row.day} className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-gray-100 py-3 last:border-0">
          <span className="w-12 text-sm font-medium text-gray-700">{row.day}</span>
          <span className="flex items-center gap-1.5 text-sm text-gray-600"><span className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${row.closed ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300'}`}>{row.closed ? '✓' : ''}</span>{t('closed')}</span>
          <span className={`rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 ${row.closed ? 'opacity-40' : ''}`}>09:00</span>
          <span className={`rounded border border-gray-300 px-2 py-1 text-sm text-gray-700 ${row.closed ? 'opacity-40' : ''}`}>19:00</span>
        </div>
      ))}
    </div>
  )
}

export function BentoClientsMockup() {
  const { t } = useI18n()
  return (
    <div className="text-left" aria-hidden="true">
      <div className="mb-3 flex h-11 items-center rounded-xl border border-gray-300 bg-white px-4 text-sm text-gray-400">{t('clientsSearch')}</div>
      <div className="rounded-xl bg-white px-4 shadow-sm ring-1 ring-gray-100">
        {[[0, 7], [1, 4], [2, 2]].map(([client, visits]) => (
          <div key={client} className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-900">{CLIENTS[client].name}</p>
              <p className="truncate text-sm text-gray-700">{CLIENTS[client].phone}</p>
            </div>
            <span className="inline-flex min-w-7 justify-center rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">{visits}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BentoReviewsMockup() {
  const { t } = useI18n()
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-hidden="true">
      <span className="font-display text-4xl font-extrabold text-gray-950">4.9</span>
      <div>
        <Stars value={5} size="text-xl" />
        <p className="text-sm text-gray-600">{t('reviewCount', { n: 12 })}</p>
      </div>
    </div>
  )
}

export function BentoMarketMockup() {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-center" aria-hidden="true">
      <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white p-1.5 text-gray-900 shadow-lg ring-1 ring-black/5">
        <span className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <SearchIcon size={18} className="shrink-0 text-brand-600" />
          <span className="truncate text-sm text-gray-400">{t('pSearchService')}</span>
        </span>
        <span className="rounded-xl bg-gray-950 px-6 py-3 text-sm font-bold text-white">{t('pSearch')}</span>
      </div>
      <div className="w-36 shrink-0 text-left">
        <div className="flex aspect-[4/5] items-end rounded-xl bg-brand-200 p-4 font-display text-7xl font-extrabold leading-none text-brand-700">s</div>
        <p className="mt-3 truncate font-display text-lg font-bold text-gray-950">Studio Marco</p>
        <p className="truncate text-sm text-gray-600">Via Roma 12</p>
      </div>
    </div>
  )
}

const ANALYTICS_MONTHS = [7, 8, 11, 11, 13, 16, 16, 18, 18, 20, 21, 23]

export function BentoAnalyticsMockup() {
  const { t, fmtPrice } = useI18n()
  const tallest = Math.max(...ANALYTICS_MONTHS)
  return (
    <div className="grid gap-4 text-left sm:grid-cols-[1fr_1.4fr]" aria-hidden="true">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('analyticsExpected')}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{fmtPrice(2480, 'EUR')}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('analyticsBookings')}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">96</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{t('analyticsClients')}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">58</p>
        </div>
      </div>
      <div className="flex min-h-48 items-end gap-1.5 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 sm:gap-2">
        {ANALYTICS_MONTHS.map((value, index) => (
          <div key={index} className="flex h-full flex-1 flex-col justify-end">
            <div className="rounded-t bg-brand-500" style={{ height: `${(value / tallest) * 100}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}
