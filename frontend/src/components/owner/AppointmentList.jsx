import AppointmentRow from './AppointmentRow'
import AppointmentCard from './AppointmentCard'
import { useI18n } from '../../i18n'

// Cards on phones, table from the sm breakpoint up.
export default function AppointmentList({ appointments, serviceNames, onApprove, onCancel, showHeader = true }) {
  const { t } = useI18n()
  return (
    <>
      <div className="sm:hidden flex flex-col gap-3">
        {appointments.map(a => (
          <AppointmentCard
            key={a.id}
            appointment={a}
            serviceName={serviceNames[a.serviceId]}
            onApprove={onApprove}
            onCancel={onCancel}
          />
        ))}
      </div>

      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm text-left">
          {showHeader && (
            <thead>
              <tr className="border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wide">
                <th className="pb-2 pr-4">{t('colClient')}</th>
                <th className="pb-2 pr-4">{t('colService')}</th>
                <th className="pb-2 pr-4">{t('colTime')}</th>
                <th className="pb-2 pr-4">{t('colStatus')}</th>
                <th className="pb-2">{t('colActions')}</th>
              </tr>
            </thead>
          )}
          <tbody>
            {appointments.map(a => (
              <AppointmentRow
                key={a.id}
                appointment={a}
                serviceName={serviceNames[a.serviceId]}
                onApprove={onApprove}
                onCancel={onCancel}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
