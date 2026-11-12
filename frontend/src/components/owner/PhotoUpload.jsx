import { useRef, useState } from 'react'
import { useAuth0 } from '../../auth'
import { useI18n } from '../../i18n'
import { uploadImage, MAX_EDGE } from '../../utils/imageUpload'

const buttonCls =
  'px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition disabled:opacity-60'

function useUploader(kind, onUploaded) {
  const { getAccessTokenSilently } = useAuth0()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  async function upload(file) {
    setBusy(true)
    setError(null)
    try {
      const token = await getAccessTokenSilently()
      onUploaded(await uploadImage(token, file, MAX_EDGE[kind]))
    } catch (e) {
      if (e?.error === 'UNREADABLE_IMAGE') setError(t('photoUnreadable'))
      else if (e?.error === 'UPLOADS_NOT_CONFIGURED') setError(t('photoUploadsUnavailable'))
      else setError(t('photoUploadFailed'))
    } finally {
      setBusy(false)
    }
  }

  return { busy, error, upload }
}

function FilePicker({ label, busy, onFile, className = buttonCls }) {
  const { t } = useI18n()
  const inputRef = useRef(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        data-testid="photo-file-input"
        onChange={e => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
      <button type="button" className={className} disabled={busy} onClick={() => inputRef.current.click()}>
        {busy ? t('photoUploading') : label}
      </button>
    </>
  )
}

export function SinglePhotoField({ kind, value, onChange }) {
  const { t } = useI18n()
  const { busy, error, upload } = useUploader(kind, onChange)
  const previewCls = kind === 'logo' ? 'w-20 h-20 rounded-full' : 'w-full h-28 rounded-lg'
  return (
    <div>
      <div className="flex items-center gap-3">
        {value && <img src={value} alt="" className={`${previewCls} object-cover border border-gray-200 ${kind === 'logo' ? 'shrink-0' : 'max-w-xs'}`} />}
        <div className="flex gap-2">
          <FilePicker label={value ? t('photoChange') : t('photoAdd')} busy={busy} onFile={upload} />
          {value && !busy && (
            <button type="button" className={buttonCls} onClick={() => onChange('')}>{t('photoRemove')}</button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}

export function GalleryField({ urls, onChange, max = 12 }) {
  const { t } = useI18n()
  const { busy, error, upload } = useUploader('gallery', url => onChange([...urls, url]))
  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((url, index) => (
          <div key={url + index} className="relative aspect-square">
            <img src={url} alt="" className="w-full h-full object-cover rounded-lg border border-gray-200" />
            <button
              type="button"
              aria-label={t('photoRemove')}
              onClick={() => onChange(urls.filter((_, i) => i !== index))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-sm leading-none hover:bg-black/80"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {urls.length < max && (
        <div className={urls.length ? 'mt-2' : ''}>
          <FilePicker label={t('photoAdd')} busy={busy} onFile={upload} />
        </div>
      )}
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
