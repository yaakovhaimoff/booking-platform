import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { ArrowRightIcon, PhoneIcon, StoreIcon } from '../../components/shared/icons'

const card = 'group flex-1 rounded-3xl border border-gray-200 bg-white p-8 hover:border-indigo-300 hover:shadow-lg transition flex flex-col'

// "Log in" lands here: choose the account world first, then authenticate there.
export default function UserFlowPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-3xl sm:text-4xl font-bold text-gray-950 text-center">{t('pChooseType')}</h1>
      <div className="mt-10 flex flex-col sm:flex-row gap-5">
        <Link to="/auth" className={card}>
          <span className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5"><PhoneIcon size={24} /></span>
          <h2 className="text-xl font-bold text-gray-950">{t('pForCustomers')}</h2>
          <p className="mt-1 text-gray-600 flex-1">{t('pCustomersDesc')}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-950 group-hover:text-indigo-600">{t('pContinue')} <ArrowRightIcon size={16} /></span>
        </Link>
        <Link to="/partner" className={card}>
          <span className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-5"><StoreIcon size={24} /></span>
          <h2 className="text-xl font-bold text-gray-950">{t('pProsTitle')}</h2>
          <p className="mt-1 text-gray-600 flex-1">{t('pProsDesc')}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-950 group-hover:text-indigo-600">{t('pContinue')} <ArrowRightIcon size={16} /></span>
        </Link>
      </div>
    </div>
  )
}
