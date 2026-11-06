import { Link } from 'react-router-dom'
import Logo from '../shared/Logo'
import { useI18n } from '../../i18n'

const h = 'text-sm font-semibold text-gray-900 mb-3'
const ul = 'flex flex-col gap-2 text-sm text-gray-600'

export default function BusinessFooter() {
  const { t } = useI18n()
  return (
    <footer className="bg-gray-50 border-t border-gray-100">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-3 gap-8">
        <div className="col-span-2 md:col-span-1"><Logo to="/for-business" suffix={t('pBusinessTag')} /></div>
        <div>
          <h3 className={h}>{t('pCompany')}</h3>
          <ul className={ul}>
            <li><Link to="/about" className="hover:text-indigo-600">{t('pAbout')}</Link></li>
            <li><Link to="/privacy" className="hover:text-indigo-600">{t('pPrivacy')}</Link></li>
            <li><Link to="/terms" className="hover:text-indigo-600">{t('pTerms')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={h}>{t('pSupport')}</h3>
          <ul className={ul}>
            <li><Link to="/help" className="hover:text-indigo-600">{t('pHelpCentre')}</Link></li>
            <li><Link to="/partner" className="hover:text-indigo-600">{t('pPartnerLogin')}</Link></li>
          </ul>
        </div>
      </div>
    </footer>
  )
}
