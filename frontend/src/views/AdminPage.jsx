import { useEffect, useState } from 'react'
import { useAuth0 } from '../auth'
import { cleanUpUnusedImages, getAdminTenants, setTenantEnabled } from '../api/adminApi'

export default function AdminPage() {
  const { getAccessTokenSilently } = useAuth0()
  const [tenants, setTenants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [photoScan, setPhotoScan] = useState(null)
  const [photoBusy, setPhotoBusy] = useState(false)
  const [photoMessage, setPhotoMessage] = useState(null)

  useEffect(() => {
    getAccessTokenSilently()
      .then(token => getAdminTenants(token))
      .then(data => {
        setTenants(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load tenants.')
        setLoading(false)
      })
  }, [getAccessTokenSilently])

  async function handleToggle(tenant) {
    try {
      const token = await getAccessTokenSilently()
      const updated = await setTenantEnabled(token, tenant.id, !tenant.enabled)
      setTenants(prev => prev.map(t => t.id === updated.id ? updated : t))
    } catch {
      setError('Failed to update tenant status.')
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin — Tenant Management</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
        <h2 className="text-sm font-semibold text-gray-800">Unused photos</h2>
        <p className="text-xs text-gray-500 mt-1">
          Finds photos in storage that no shop profile uses (older than an hour). Scanning deletes nothing.
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            type="button"
            disabled={photoBusy}
            onClick={() => runPhotoCleanup(true)}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition disabled:opacity-60"
          >
            Scan for unused photos
          </button>
          {photoScan && photoScan.unusedFiles.length > 0 && (
            <button
              type="button"
              disabled={photoBusy}
              onClick={() => runPhotoCleanup(false)}
              className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition disabled:opacity-60"
            >
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

      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Slug / Store Link', 'Owner Email', 'Registered', 'Status', 'Actions'].map(col => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {tenants.map(tenant => (
              <tr key={tenant.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {tenant.name ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/store/${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline"
                  >
                    /store/{tenant.slug}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {tenant.ownerEmail ?? '—'}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(tenant.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                    tenant.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${tenant.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {tenant.enabled ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(tenant)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                      tenant.enabled
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {tenant.enabled ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}

            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  No tenants registered yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
