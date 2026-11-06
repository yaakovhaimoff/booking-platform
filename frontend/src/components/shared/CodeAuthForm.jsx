import { useState } from 'react'
import { useI18n } from '../../i18n'
import { MailIcon, PhoneIcon } from './icons'

const COUNTRIES = [
  { code: '+39', label: 'IT +39' }, { code: '+44', label: 'GB +44' }, { code: '+1', label: 'US +1' },
  { code: '+33', label: 'FR +33' }, { code: '+49', label: 'DE +49' }, { code: '+34', label: 'ES +34' },
  { code: '+972', label: 'IL +972' },
]
const altBtn = 'w-full h-12 rounded-xl border border-gray-300 bg-white px-4 flex items-center justify-center gap-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition'
const inputCls = 'w-full h-12 rounded-xl border border-gray-300 bg-white px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'
const STORE = 'demo-accounts'

// Demo account store: no backend, passwords are only hashed in this browser's localStorage.
const read = () => { try { return JSON.parse(localStorage.getItem(STORE)) || {} } catch { return {} } }
async function hash(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('')
}

// primary: 'phone' | 'email' decides which identifier is shown first; the other is an alternative.
// Name kept for existing imports; it is now a password form (log in / sign up).
export default function CodeAuthForm({ primary, onVerified }) {
  const { t } = useI18n()
  const [method, setMethod] = useState(primary)
  const [mode, setMode] = useState('login')
  const [country, setCountry] = useState('+39')
  const [value, setValue] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isPhone = method === 'phone'
  const isSignup = mode === 'signup'

  function switchMethod(m) { setMethod(m); setValue(''); setPassword(''); setError('') }
  function switchMode(m) { setMode(m); setPassword(''); setError('') }

  async function submit(e) {
    e.preventDefault()
    const idOk = isPhone ? /^\d{6,14}$/.test(value.replace(/[\s-]/g, '')) : /^\S+@\S+\.\S+$/.test(value)
    if (!idOk) { setError(t(isPhone ? 'pBadPhone' : 'pBadEmail')); return }
    if (isSignup && !name.trim()) { setError(t('nameRequired')); return }
    if (password.length < 6) { setError(t('pPasswordShort')); return }

    const identity = isPhone ? `${country}${value.replace(/\D/g, '')}` : value.trim().toLowerCase()
    const key = identity
    setBusy(true)
    const accounts = read()
    const h = await hash(`${key}:${password}`)
    setBusy(false)

    // Entries are { h, name }; older ones were just the hash string.
    const entry = typeof accounts[key] === 'string' ? { h: accounts[key] } : accounts[key]
    if (isSignup) {
      if (entry) { setError(t('pAccountExists')); return }
      localStorage.setItem(STORE, JSON.stringify({ ...accounts, [key]: { h, name: name.trim() } }))
      onVerified(identity, name.trim())
      return
    }
    if (!entry) { setError(t('pNoAccount')); return }
    if (entry.h !== h) { setError(t('pWrongPassword')); return }
    onVerified(identity, entry.name)
  }

  const tab = on => `flex-1 h-10 rounded-lg text-sm font-bold transition ${on ? 'bg-gray-950 text-white' : 'text-gray-700 hover:bg-gray-100'}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 p-1 rounded-xl bg-gray-100" role="tablist">
        <button type="button" role="tab" aria-selected={!isSignup} onClick={() => switchMode('login')} className={tab(!isSignup)}>{t('pLogInTab')}</button>
        <button type="button" role="tab" aria-selected={isSignup} onClick={() => switchMode('signup')} className={tab(isSignup)}>{t('pSignUpTab')}</button>
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        {isSignup && (
          <label className="text-sm font-semibold text-gray-900">
            {t('fullName')}
            <input value={name} onChange={e => setName(e.target.value)} type="text" autoComplete="name" maxLength={100} className={`${inputCls} mt-1.5`} />
          </label>
        )}
        {isPhone ? (
          <label className="text-sm font-semibold text-gray-900">
            {t('pMobileNumber')}
            <div className="mt-1.5 flex gap-2">
              <select value={country} onChange={e => setCountry(e.target.value)} aria-label={t('pCountryCode')} className="h-12 rounded-xl border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
              <input value={value} onChange={e => setValue(e.target.value)} type="tel" inputMode="tel" autoComplete="tel-national" placeholder={t('pPhonePlaceholder')} className={inputCls} />
            </div>
          </label>
        ) : (
          <label className="text-sm font-semibold text-gray-900">
            {t('pEmail')}
            <input value={value} onChange={e => setValue(e.target.value)} type="email" autoComplete="email" className={`${inputCls} mt-1.5`} />
          </label>
        )}
        <label className="text-sm font-semibold text-gray-900">
          {t('pPassword')}
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} className={`${inputCls} mt-1.5`} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="h-12 rounded-xl bg-gray-950 text-sm font-bold text-white hover:bg-gray-800 disabled:opacity-60">{t(isSignup ? 'pSignUpTab' : 'pLogInTab')}</button>
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-400" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />{t('pOr')}<span className="h-px flex-1 bg-gray-200" />
      </div>

      {isPhone
        ? <button type="button" onClick={() => switchMethod('email')} className={altBtn}><MailIcon size={20} />{t('pWithEmail')}</button>
        : <button type="button" onClick={() => switchMethod('phone')} className={altBtn}><PhoneIcon size={20} />{t('pWithMobile')}</button>}
    </div>
  )
}
