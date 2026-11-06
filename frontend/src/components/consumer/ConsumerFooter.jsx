import { Link } from 'react-router-dom'
import Logo from '../shared/Logo'
import { useI18n } from '../../i18n'

const col = 'flex flex-col gap-2 text-sm text-gray-600'
const h = 'text-sm font-semibold text-gray-900 mb-3'

export default function ConsumerFooter() {
  const { t } = useI18n()
  return (
    <footer className="bg-white border-t border-gray-100 mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="text-sm text-gray-500 mt-3 max-w-xs">{t('pFooterTag')}</p>
        </div>
        <div>
          <h3 className={h}>{t('pForCustomers')}</h3>
          <ul className={col}>
            <li><Link to="/user-flow" className="hover:text-indigo-600">{t('pLogInOrSignUp')}</Link></li>
            <li><Link to="/help" className="hover:text-indigo-600">{t('pHelp')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={h}>{t('pCompany')}</h3>
          <ul className={col}>
            <li><Link to="/about" className="hover:text-indigo-600">{t('pAbout')}</Link></li>
            <li><Link to="/privacy" className="hover:text-indigo-600">{t('pPrivacy')}</Link></li>
            <li><Link to="/terms" className="hover:text-indigo-600">{t('pTerms')}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={h}>{t('pForPartners')}</h3>
          <ul className={col}>
            <li><Link to="/for-business" className="hover:text-indigo-600">{t('pListBusiness')}</Link></li>
            <li><Link to="/partner" className="hover:text-indigo-600">{t('pPartnerLogin')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-100 py-5 text-center text-xs text-gray-400">© {new Date().getFullYear()} torni</div>
    </footer>
  )
}
