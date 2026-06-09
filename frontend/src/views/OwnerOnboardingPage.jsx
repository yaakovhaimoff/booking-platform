import { useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useNavigate } from 'react-router-dom'
import { createTenant } from '../api/ownerApi'

const SLUG_REGEX = /^[a-z0-9-]+$/

export default function OwnerOnboardingPage() {
  const { getAccessTokenSilently } = useAuth0()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!SLUG_REGEX.test(slug)) {
      setError('Slug may only contain lowercase letters, numbers, and hyphens.')
      return
    }

    setSubmitting(true)
    try {
      const token = await getAccessTokenSilently()
      await createTenant(token, slug, name)
      navigate('/owner/dashboard')
    } catch (err) {
      if (err?.status === 409 || err?.error === 'SLUG_TAKEN') {
        setError('That slug is already taken.')
      } else {
        setError('Something went wrong, please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Set up your store</h1>
        <p className="text-sm text-gray-500 mb-6">
          Choose a unique slug for your booking page. Lowercase letters, numbers, and hyphens only.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="name">
              Business name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Mike's Barbershop"
              maxLength={100}
              required
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="slug">
              Store slug
            </label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-r border-gray-300">
                /store/
              </span>
              <input
                id="slug"
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="my-salon"
                className="flex-1 px-3 py-2 text-sm outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed text-sm font-medium"
          >
            {submitting ? 'Creating…' : 'Create store'}
          </button>
        </form>
      </div>
    </div>
  )
}
