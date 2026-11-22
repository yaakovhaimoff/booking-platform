import { useState } from 'react'
import { deleteErrorMessage } from './adminFormat'

export default function DeleteConfirmDialog({ title, consequences, expectedText, confirmLabel, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const matches = typed.trim() === expectedText

  async function submit(event) {
    event.preventDefault()
    if (!matches || busy) return
    setBusy(true)
    setError(null)
    try {
      await onConfirm(typed.trim())
    } catch (e) {
      setError(deleteErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="presentation">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-delete-title"
        onSubmit={submit}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id="admin-delete-title" className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-2 text-sm font-medium text-red-700">This is permanent and cannot be undone. You will lose:</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
          {consequences.map(line => <li key={line}>{line}</li>)}
        </ul>
        <label className="mt-4 block text-sm text-gray-700" htmlFor="admin-delete-confirmation">
          Type <span className="font-mono font-semibold text-gray-900">{expectedText}</span> to confirm
        </label>
        <input
          id="admin-delete-confirmation"
          value={typed}
          onChange={event => setTyped(event.target.value)}
          autoComplete="off"
          autoFocus
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy}
            className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={!matches || busy}
            className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed">
            {busy ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  )
}
