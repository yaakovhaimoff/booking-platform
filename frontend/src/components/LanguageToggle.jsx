import { LANGS, setLang, useI18n } from '../i18n'

export default function LanguageToggle() {
  const { lang, t } = useI18n()
  return (
    <div
      role="group"
      aria-label={t('language')}
      className="inline-flex rounded-full bg-gray-100 p-0.5 text-xs font-semibold"
    >
      {LANGS.map(l => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={l === lang}
          className={`px-3 py-1 rounded-full uppercase transition ${
            l === lang ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
