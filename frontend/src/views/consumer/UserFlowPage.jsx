import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n'
import { ArrowRightIcon, PhoneIcon, StoreIcon } from '../../components/shared/icons'

const card = 'group flex-1 rounded-2xl border-2 border-gray-950 bg-gray-50 p-8 hover:bg-white hover:-translate-y-0.5 transition flex flex-col'

// "Log in" lands here: choose the account world first, then authenticate there.
export default function UserFlowPage() {
  const { t } = useI18n()
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 sm:py-16">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-950">{t('pChooseType')}</h1>
      <div className="mt-10 flex flex-col sm:flex-row gap-5">
        <Link to="/auth" className={card}>
          <span className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-5"><PhoneIcon size={24} /></span>
          <h2 className="text-2xl font-extrabold text-gray-950">{t('pForCustomers')}</h2>
          <p className="mt-1 text-gray-600 flex-1">{t('pCustomersDesc')}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-950 group-hover:text-indigo-600">{t('pContinue')} <ArrowRightIcon size={16} /></span>
        </Link>
        <Link to="/partner" className={card}>
          <span className="w-12 h-12 rounded-xl bg-pink-600 text-white flex items-center justify-center mb-5"><StoreIcon size={24} /></span>
          <h2 className="text-2xl font-extrabold text-gray-950">{t('pProsTitle')}</h2>
          <p className="mt-1 text-gray-600 flex-1">{t('pProsDesc')}</p>
          <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-950 group-hover:text-indigo-600">{t('pContinue')} <ArrowRightIcon size={16} /></span>
        </Link>
      </div>
    </div>
  )
}
