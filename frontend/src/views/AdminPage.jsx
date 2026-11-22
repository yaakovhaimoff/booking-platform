import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth0 } from '../auth'
import {
  cleanUpUnusedImages, deleteAccount, deleteTenant, getAdminAccounts, getAdminAuditLog, getAdminClients,
  getAdminSummary, getAdminTenants, setTenantEnabled,
} from '../api/adminApi'
import ShopsTab from '../components/admin/ShopsTab'
import AccountsTab from '../components/admin/AccountsTab'
import ClientsTab from '../components/admin/ClientsTab'
import ActivityTab from '../components/admin/ActivityTab'
import DeleteConfirmDialog from '../components/admin/DeleteConfirmDialog'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'shops', label: 'Shops' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'clients', label: 'Clients' },
  { id: 'activity', label: 'Activity log' },
]

const SUMMARY_CARDS = [
  ['Shops', 'shops'],
  ['Visible to public', 'visibleShops'],
  ['Hidden from public', 'hiddenShops'],
  ['Accounts', 'accounts'],
  ['Business accounts', 'businessAccounts'],
  ['Consumer accounts', 'consumerAccounts'],
  ['Clients', 'clients'],
  ['Bookings', 'bookings'],
  ['Reviews', 'reviews'],
]

function plural(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

export default function AdminPage() {
  const { getAccessTokenSilently, user } = useAuth0()
  const [tab, setTab] = useState('overview')
  const [summary, setSummary] = useState(null)
  const [shops, setShops] = useState([])
  const [accounts, setAccounts] = useState(null)
  const [clients, setClients] = useState(null)
  const [auditEntries, setAuditEntries] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [notice, setNotice] = useState(null)
  const [photoScan, setPhotoScan] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState(null)

  const tokenSource = useRef(getAccessTokenSilently)
  useEffect(() => { tokenSource.current = getAccessTokenSilently })

  const load = useCallback(async (fetcher, apply) => {
    const token = await tokenSource.current()
    apply(await fetcher(token))
  }, [])

  const refreshAfterDelete = useCallback(() => Promise.all([
    load(getAdminSummary, setSummary),
    load(getAdminTenants, setShops),
    load(getAdminAccounts, setAccounts),
    load(getAdminAuditLog, setAuditEntries),
  ]), [load])

  useEffect(() => {
    Promise.all([load(getAdminSummary, setSummary), load(getAdminTenants, setShops)])
      .catch(() => setError('Failed to load the admin data.'))
      .finally(() => setLoading(false))
  }, [load])

  useEffect(() => {
    const lazy = { accounts: [getAdminAccounts, setAccounts], clients: [getAdminClients, setClients], activity: [getAdminAuditLog, setAuditEntries] }[tab]
    if (!lazy) return
    load(...lazy).catch(() => setError('Failed to load this list.'))
  }, [tab, load])

  async function handleToggle(shop) {
    try {
      const token = await getAccessTokenSilently()
      const updated = await setTenantEnabled(token, shop.id, !shop.enabled)
      setShops(previous => previous.map(item => item.id === updated.id
        ? { ...item, enabled: updated.enabled, visibleToPublic: updated.visibleToPublic } : item))
      load(getAdminSummary, setSummary).catch(() => {})
    } catch {
      setError('Failed to update the shop.')
    }
  }

  async function confirmDelete(confirmation) {
    const token = await getAccessTokenSilently()
    await pendingDelete.run(token, confirmation)
    setNotice(pendingDelete.doneMessage)
    setPendingDelete(null)
    await refreshAfterDelete().catch(() => setError('Deleted, but the lists could not be refreshed. Reload the page.'))
  }

  function askToDeleteShop(shop) {
    const label = shop.name ?? shop.slug
    setPendingDelete({
      title: `Delete shop "${label}"?`,
      consequences: [
        `The shop page /store/${shop.slug}`,
        `${plural(shop.bookingCount, 'booking')} and ${plural(shop.reviewCount, 'review')}, and its services and hours`,
        'All of its uploaded photos',
        `The owner's account (${shop.ownerEmail ?? 'unknown'}) is kept`,
      ],
      expectedText: shop.slug,
      confirmLabel: 'Delete shop forever',
      run: (token, confirmation) => deleteTenant(token, shop.id, confirmation),
      doneMessage: `Deleted shop ${label}.`,
    })
  }

  function askToDeleteAccount(account) {
    setPendingDelete({
      title: `Delete account ${account.identity}?`,
      consequences: [
        `The login ${account.identity}${account.name ? ` (${account.name})` : ''}`,
        'Its bookings and reviews stay in the shops but are no longer linked to anyone',
        ...(account.ownedShopId != null ? [`It owns the shop ${account.ownedShopName ?? account.ownedShopSlug}: delete that shop first`] : []),
      ],
      expectedText: account.identity,
      confirmLabel: 'Delete account forever',
      run: (token, confirmation) => deleteAccount(token, account.id, confirmation),
      doneMessage: `Deleted account ${account.identity}.`,
    })
  }

  async function runPhotoCleanup(dryRun) {
    setPhotoBusy(true)
    setPhotoMessage(null)
    try {
      const token = await getAccessTokenSilently()
      const report = await cleanUpUnusedImages(token, dryRun)
      if (dryRun) {
        setPhotoScan(report)
      } else {
        setPhotoScan(null)
        setPhotoMessage(`Deleted ${report.deleted} unused photo${report.deleted === 1 ? '' : 's'}.`)
      }
    } catch (e) {
      setPhotoMessage(e?.error === 'UPLOADS_NOT_CONFIGURED' ? 'Photo storage is not configured.' : 'Photo cleanup failed.')
    } finally {
      setPhotoBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin</h1>

      {error && (
        <div role="alert" className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
      )}
      {notice && (
        <div role="status" className="mb-4 px-4 py-3 bg-green-50 border border-green-200 text-green-800 rounded-lg text-sm">{notice}</div>
      )}

      <div role="tablist" aria-label="Admin sections" className="mb-6 flex flex-wrap gap-2 border-b border-gray-200">
        {TABS.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => { setTab(item.id); setNotice(null) }}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition ${
              tab === item.id ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          {summary && (
            <dl className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
              {SUMMARY_CARDS.map(([label, key]) => (
                <div key={key} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <dt className="text-xs text-gray-500">{label}</dt>
                  <dd className="mt-1 text-2xl font-semibold text-gray-900">{summary[key]}</dd>
                </div>
              ))}
            </dl>
          )}
          <div className="p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
            <h2 className="text-sm font-semibold text-gray-800">Unused photos</h2>
            <p className="text-xs text-gray-500 mt-1">
              Finds photos in storage that no shop profile uses (older than an hour). Scanning deletes nothing.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button type="button" disabled={photoBusy} onClick={() => runPhotoCleanup(true)}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition disabled:opacity-60">
                Scan for unused photos
              </button>
              {photoScan && photoScan.unusedFiles.length > 0 && (
                <button type="button" disabled={photoBusy} onClick={() => runPhotoCleanup(false)}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-60">
                  Delete {photoScan.unusedFiles.length} unused photo{photoScan.unusedFiles.length === 1 ? '' : 's'}
                </button>
              )}
            </div>
            {photoScan && (
              <p className="text-sm text-gray-700 mt-3">
                {photoScan.unusedFiles.length === 0
                  ? 'No unused photos found.'
                  : `Found ${photoScan.unusedFiles.length} unused photo${photoScan.unusedFiles.length === 1 ? '' : 's'} across ${photoScan.tenantsScanned} shops.`}
              </p>
            )}
            {photoMessage && <p className="text-sm text-gray-700 mt-3">{photoMessage}</p>}
          </div>
        </div>
      )}

      {tab === 'shops' && <ShopsTab shops={shops} onToggle={handleToggle} onDelete={askToDeleteShop} />}
      {tab === 'accounts' && (accounts
        ? <AccountsTab accounts={accounts} ownEmail={user?.email} onDelete={askToDeleteAccount} />
        : <p className="text-sm text-gray-500">Loading accounts...</p>)}
      {tab === 'clients' && (clients ? <ClientsTab clients={clients} /> : <p className="text-sm text-gray-500">Loading clients...</p>)}
      {tab === 'activity' && (auditEntries ? <ActivityTab entries={auditEntries} /> : <p className="text-sm text-gray-500">Loading the log...</p>)}

      {pendingDelete && (
        <DeleteConfirmDialog
          title={pendingDelete.title}
          consequences={pendingDelete.consequences}
          expectedText={pendingDelete.expectedText}
          confirmLabel={pendingDelete.confirmLabel}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
