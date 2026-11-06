import { useState } from 'react'
import { createReview } from '../api/bookingApi'
import { useI18n } from '../i18n'
import { useAuth0 } from '../mockAuth'

function Stars({ value, size = 'text-base' }) {
  return (
    <span className={`${size} tracking-tight text-amber-400`} aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map(n => <span key={n} className={n <= Math.round(value) ? '' : 'text-gray-300'}>★</span>)}
    </span>
  )
}

function StarPicker({ value, onChange }) {
  const { t } = useI18n()
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={t('rating')}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n}/5`}
          onClick={() => onChange(n)}
          className={`text-3xl leading-none transition ${n <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-200'}`}
        >★</button>
      ))}
    </div>
  )
}

// data / failed come from the page (it also shows the rating in the header); onSubmitted reloads them.
export default function Reviews({ data, failed, onSubmitted }) {
  const { t, fmtDate } = useI18n()
  const { isAuthenticated, accountType, user } = useAuth0()
  const signedIn = isAuthenticated && accountType === 'consumer'
  const knownName = signedIn ? user.name || '' : ''

  const [rating, setRating] = useState(0)
  const [name, setName] = useState('')
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [thanks, setThanks] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const authorName = (knownName || name).trim()
    if (!rating) return setFormError(t('ratingRequired'))
    if (!authorName) return setFormError(t('nameRequired'))
    setFormError(null)
    setSubmitting(true)
    try {
      await createReview({
        rating,
        authorName,
        comment: comment.trim() || null,
        authorAuth0Sub: signedIn ? user.sub : undefined,
      })
      setRating(0); setComment(''); setName('')
      setThanks(true)
      await onSubmitted()
    } catch {
      setFormError(t('reviewFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="reviews" className="mt-10 scroll-mt-4" aria-labelledby="reviews-title">
      <div className="flex items-baseline justify-between mb-3">
        <h2 id="reviews-title" className="text-lg font-semibold text-gray-900">{t('reviews')}</h2>
        {data && data.count > 0 && (
          <p className="text-sm text-gray-600">
            <Stars value={data.average} /> <span className="font-semibold text-gray-900">{data.average.toFixed(1)}</span> · {t('reviewCount', { n: data.count })}
          </p>
        )}
      </div>

      {failed && <p className="text-sm text-gray-500">{t('reviewsError')}</p>}
      {data && data.count === 0 && <p className="text-sm text-gray-500 mb-4">{t('noReviews')}</p>}

      {data && data.count > 0 && (
        <ul className="flex flex-col gap-3 mb-6">
          {data.reviews.map(r => (
            <li key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-gray-900 truncate">{r.authorName}</p>
                <Stars value={r.rating} size="text-sm" />
              </div>
              {r.comment && <p className="text-sm text-gray-700 mt-1 whitespace-pre-line break-words">{r.comment}</p>}
              <p className="text-xs text-gray-400 mt-2">{fmtDate(r.createdAt.substring(0, 10))}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-4">
        <h3 className="font-medium text-gray-900">{t('leaveReview')}</h3>
        <StarPicker value={rating} onChange={setRating} />
        {knownName
          ? <p className="text-sm text-gray-600">{t('reviewingAs')} <strong className="text-gray-900">{knownName}</strong></p>
          : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('yourName')}</label>
              <input
                type="text"
                value={name}
                maxLength={100}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('comment')} <span className="text-gray-400 font-normal">{t('optional')}</span>
          </label>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        {formError && <p className="text-red-600 text-sm">{formError}</p>}
        {thanks && !formError && <p className="text-green-600 text-sm">{t('reviewThanks')}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white rounded-lg py-2.5 font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? t('sending') : t('submitReview')}
        </button>
      </form>
    </section>
  )
}
