import { useState } from 'react'
import { useI18n } from '../../i18n'
import { AppleIcon, GoogleIcon, MailIcon, PhoneIcon } from './icons'

const COUNTRIES = [
  { code: '+39', label: 'IT +39' }, { code: '+44', label: 'GB +44' }, { code: '+1', label: 'US +1' },
  { code: '+33', label: 'FR +33' }, { code: '+49', label: 'DE +49' }, { code: '+34', label: 'ES +34' },
  { code: '+972', label: 'IL +972' },
]
const altBtn = 'w-full h-12 rounded-full border border-gray-300 bg-white px-4 flex items-center justify-center gap-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 transition'
const inputCls = 'w-full h-12 rounded-xl border border-gray-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400'

// Demo-mode passwordless form: any 6-digit code verifies. Google/Apple call onVerified directly.
// primary: 'phone' | 'email' decides which method is shown first; the other becomes an alternative.
export default function CodeAuthForm({ primary, onVerified }) {
  const { t } = useI18n()
  const [method, setMethod] = useState(primary)
  const [step, setStep] = useState('enter')
  const [country, setCountry] = useState('+39')
  const [value, setValue] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const isPhone = method === 'phone'
  const target = isPhone ? `${country} ${value}` : value

  function switchMethod(m) { setMethod(m); setStep('enter'); setValue(''); setCode(''); setError('') }

  function sendCode(e) {
    e.preventDefault()
    const ok = isPhone ? /^\d{6,14}$/.test(value.replace(/[\s-]/g, '')) : /^\S+@\S+\.\S+$/.test(value)
    if (!ok) { setError(t(isPhone ? 'pBadPhone' : 'pBadEmail')); return }
    setError(''); setStep('code')
  }

  function verify(e) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { setError(t('pBadCode')); return }
    onVerified(isPhone ? `${country}${value.replace(/\D/g, '')}` : value.trim())
  }

  if (step === 'code') {
    return (
      <form onSubmit={verify} className="flex flex-col gap-4">
        <p className="text-sm text-gray-600">{t('pCodeSentTo')} <strong className="text-gray-900">{target}</strong>.</p>
        <label className="text-sm font-semibold text-gray-900">
          {t('pVerifyCode')}
          <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" autoFocus className={`${inputCls} mt-1.5 tracking-[0.4em]`} />
        </label>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="h-12 rounded-full bg-gray-950 text-sm font-semibold text-white hover:bg-gray-800">{t('pVerify')}</button>
        <button type="button" onClick={() => switchMethod(method)} className="text-sm text-indigo-600 hover:underline">{t(isPhone ? 'pDiffNumber' : 'pDiffEmail')}</button>
        <p className="text-xs text-gray-400">{t('pDemoCode')}</p>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={sendCode} className="flex flex-col gap-4" noValidate>
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
        <p className="-mt-2 text-xs text-gray-500">{t(isPhone ? 'pTextCode' : 'pEmailCode')}</p>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="h-12 rounded-full bg-gray-950 text-sm font-semibold text-white hover:bg-gray-800">{t('pContinue')}</button>
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-400" aria-hidden="true">
        <span className="h-px flex-1 bg-gray-200" />{t('pOr')}<span className="h-px flex-1 bg-gray-200" />
      </div>

      {isPhone
        ? <button type="button" onClick={() => switchMethod('email')} className={altBtn}><MailIcon size={20} />{t('pWithEmail')}</button>
        : <button type="button" onClick={() => switchMethod('phone')} className={altBtn}><PhoneIcon size={20} />{t('pWithMobile')}</button>}
      <button type="button" onClick={() => onVerified('google-user')} className={altBtn}><GoogleIcon />{t('pWithGoogle')}</button>
      <button type="button" onClick={() => onVerified('apple-user')} className={altBtn}><AppleIcon />{t('pWithApple')}</button>
    </div>
  )
}
