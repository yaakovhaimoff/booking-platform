import { useState } from 'react'

export default function StoreSettingsTab({ tenant }) {
  const [copied, setCopied] = useState(false)
  const storeUrl = `${window.location.origin}/store/${tenant.slug}`

  function handleCopy() {
    navigator.clipboard.writeText(storeUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">Your store URL</p>
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <span className="text-sm text-gray-800 flex-1 break-all">{storeUrl}</span>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  )
}
