import { useState } from 'react'
import { useAuth0 } from '../../mockAuth'
import { updateMyTenant } from '../../api/ownerApi'
import { useI18n } from '../../i18n'

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500'

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

export default function StoreSettingsTab({ tenant }) {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)
  const [form, setForm] = useState({
    name: tenant.name || '',
    address: tenant.address || '',
    phone: tenant.phone || '',
    whatsappNumber: tenant.whatsappNumber || '',
    logoUrl: tenant.logoUrl || '',
    coverUrl: tenant.coverUrl || '',
    about: tenant.about || '',
    galleryUrls: (tenant.galleryUrls || []).join('\n'),
    defaultLanguage: tenant.defaultLanguage || 'it',
    currency: tenant.currency || 'EUR',
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'ok' | 'error', text }
  const storeUrl = `${window.location.origin}/store/${tenant.slug}`

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }))

  function handleCopy() {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const token = await getAccessTokenSilently()
      const galleryUrls = form.galleryUrls.split('\n').map(u => u.trim()).filter(Boolean)
      await updateMyTenant(token, { ...form, galleryUrls })
      setMessage({ type: 'ok', text: t('profileSaved') })
    } catch {
      setMessage({ type: 'error', text: t('profileSaveFailed') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8 max-w-lg">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">{t('storeUrl')}</p>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-800 flex-1 break-all">{storeUrl}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            {copied ? t('copied') : t('copyLink')}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">{t('businessProfile')}</h2>

        <Field label={t('businessName')}>
          <input className={inputCls} value={form.name} onChange={set('name')} maxLength={100} required />
        </Field>
        <Field label={t('address')} hint={t('addressHint')}>
          <input className={inputCls} value={form.address} onChange={set('address')} maxLength={255} placeholder="Via Rovereto 21, Milano" />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t('phone')}>
            <input className={inputCls} value={form.phone} onChange={set('phone')} maxLength={30} placeholder="02 1234567" />
          </Field>
          <Field label={t('whatsappNumber')} hint={t('whatsappHint')}>
            <input className={inputCls} value={form.whatsappNumber} onChange={set('whatsappNumber')} maxLength={30} placeholder="+39 333 1234567" />
          </Field>
        </div>
        <Field label={t('aboutLabel')} hint={t('aboutHint')}>
          <textarea className={inputCls} rows={4} value={form.about} onChange={set('about')} maxLength={1000} />
        </Field>
        <Field label={t('profileImageUrl')} hint={t('profileImageHint')}>
          <input className={inputCls} type="url" value={form.logoUrl} onChange={set('logoUrl')} maxLength={1000} placeholder="https://…" />
        </Field>
        <Field label={t('coverImageUrl')} hint={t('coverImageHint')}>
          <input className={inputCls} type="url" value={form.coverUrl} onChange={set('coverUrl')} maxLength={1000} placeholder="https://…" />
        </Field>
        <Field label={t('galleryImages')} hint={t('galleryImagesHint')}>
          <textarea className={inputCls} rows={4} value={form.galleryUrls} onChange={set('galleryUrls')} placeholder="https://…" />
        </Field>

        <Field label={t('defaultLanguage')} hint={t('defaultLanguageHint')}>
          <select className={inputCls} value={form.defaultLanguage} onChange={set('defaultLanguage')}>
            <option value="it">{t('langIt')}</option>
            <option value="en">{t('langEn')}</option>
          </select>
        </Field>

        <Field label={t('currency')} hint={t('currencyHint')}>
          <select className={inputCls} value={form.currency} onChange={set('currency')}>
            <option value="EUR">EUR (€)</option>
            <option value="USD">USD ($)</option>
            <option value="GBP">GBP (£)</option>
            <option value="ILS">ILS (₪)</option>
          </select>
        </Field>

        {message && (
          <p className={`text-sm ${message.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-60"
        >
          {saving ? t('saving') : t('saveChanges')}
        </button>
      </form>
    </div>
  )
}
