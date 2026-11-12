import { useEffect, useRef, useState } from 'react'
import { useI18n } from '../../i18n'
import { compressImage, MAX_EDGE, ASPECT } from '../../utils/imageUpload'
import { discardStaged, stageImage } from '../../utils/stagedImages'
import ImageCropDialog from './ImageCropDialog'
import ImageViewDialog from './ImageViewDialog'

const buttonCls =
  'px-3 py-1.5 text-sm border border-gray-300 text-gray-700 bg-white rounded-md hover:bg-gray-50 transition disabled:opacity-60'

function useUploader(kind, onStaged) {
  const { t } = useI18n()
  const [processing, setProcessing] = useState(0)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [error, setError] = useState(null)
  const [queue, setQueue] = useState([])
  const [batchTotal, setBatchTotal] = useState(0)

  const busy = processing > 0 || loadingExisting

  function choose(files, replaceIndex) {
    const list = Array.isArray(files) ? files : [files]
    setQueue(list.map(file => ({ file, replaceIndex, previewUrl: URL.createObjectURL(file) })))
    setBatchTotal(list.length)
  }

  async function edit(url, replaceIndex) {
    setLoadingExisting(true)
    setError(null)
    try {
      const response = await fetch(url, { mode: 'cors', cache: 'no-cache' })
      if (!response.ok) throw new Error('not ok')
      const blob = await response.blob()
      choose(new File([blob], 'photo', { type: blob.type }), replaceIndex)
    } catch {
      setError(t('photoEditLoadFailed'))
    } finally {
      setLoadingExisting(false)
    }
  }

  function finishCurrent() {
    URL.revokeObjectURL(queue[0].previewUrl)
    setQueue(queue.slice(1))
  }

  function cancelAll() {
    queue.forEach(item => URL.revokeObjectURL(item.previewUrl))
    setQueue([])
  }

  async function stage(file, area, replaceIndex) {
    setProcessing(count => count + 1)
    setError(null)
    try {
      const blob = await compressImage(file, MAX_EDGE[kind], area)
      onStaged(stageImage(blob), replaceIndex)
    } catch {
      setError(t('photoUnreadable'))
    } finally {
      setProcessing(count => count - 1)
    }
  }

  const current = queue[0]
  const cropDialog = current && (
    <ImageCropDialog
      key={current.previewUrl}
      imageUrl={current.previewUrl}
      aspect={ASPECT[kind]}
      round={kind === 'logo'}
      progress={batchTotal > 1 ? { index: batchTotal - queue.length + 1, total: batchTotal } : null}
      onConfirm={area => {
        finishCurrent()
        stage(current.file, area, current.replaceIndex)
      }}
      onCancel={cancelAll}
    />
  )

  return { busy, error, choose, edit, cropDialog }
}

function ExistingImage({ url, imageClassName, wrapperClassName, busy, onEdit }) {
  const { t } = useI18n()
  const [viewing, setViewing] = useState(false)

  // The view stays on screen while the saved photo loads; the crop dialog then takes its place in the same spot.
  async function startEdit() {
    await onEdit()
    setViewing(false)
  }

  return (
    <div className={`relative ${wrapperClassName}`}>
      <button type="button" aria-label={t('photoOpenView')} onClick={() => setViewing(true)} className="block w-full h-full">
        <img src={url} alt="" className={imageClassName} />
      </button>
      {viewing && <ImageViewDialog url={url} busy={busy} onEdit={startEdit} onClose={() => setViewing(false)} />}
    </div>
  )
}

function RemoveButton({ label, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute top-1 right-1 z-30 w-6 h-6 rounded-full bg-black/60 text-white text-sm leading-none hover:bg-black/80"
    >
      ×
    </button>
  )
}

function FilePicker({ label, busy, onFile, multiple = false, className = buttonCls }) {
  const { t } = useI18n()
  const inputRef = useRef(null)
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        data-testid="photo-file-input"
        onChange={e => {
          const files = Array.from(e.target.files || [])
          e.target.value = ''
          if (files.length === 0) return
          onFile(multiple ? files : files[0])
        }}
      />
      <button type="button" className={className} disabled={busy} onClick={() => inputRef.current.click()}>
        {busy ? t('photoProcessing') : label}
      </button>
    </>
  )
}

export function SinglePhotoField({ kind, value, onChange }) {
  const { t } = useI18n()
  const { busy, error, choose, edit, cropDialog } = useUploader(kind, url => {
    discardStaged(value)
    onChange(url)
  })
  const previewCls = kind === 'logo' ? 'w-20 h-20 rounded-full' : 'w-full h-28 rounded-lg'
  const wrapperCls = kind === 'logo' ? 'w-20 h-20 shrink-0' : 'w-full max-w-xs h-28'
  return (
    <div>
      {value ? (
        <div className="flex items-center gap-3">
          <div className={`relative ${wrapperCls}`}>
            <ExistingImage
              url={value}
              wrapperClassName="w-full h-full"
              imageClassName={`${previewCls} object-cover border border-gray-200`}
              busy={busy}
              onEdit={() => edit(value)}
            />
            {!busy && <RemoveButton label={t('photoRemove')} onClick={() => {
              discardStaged(value)
              onChange('')
            }} />}
          </div>
          {busy && <span className="text-sm text-gray-500">{t('photoProcessing')}</span>}
        </div>
      ) : (
        <FilePicker label={t('photoAdd')} busy={busy} onFile={choose} />
      )}
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
      {cropDialog}
    </div>
  )
}

export function GalleryField({ urls, onChange, max = 12 }) {
  const { t } = useI18n()
  const latestUrls = useRef(urls)
  const [skippedExtra, setSkippedExtra] = useState(false)

  useEffect(() => {
    latestUrls.current = urls
  }, [urls])

  const { busy, error, choose, edit, cropDialog } = useUploader('gallery', (url, replaceIndex) => {
    if (replaceIndex !== undefined) discardStaged(latestUrls.current[replaceIndex])
    const next = replaceIndex === undefined
      ? [...latestUrls.current, url]
      : latestUrls.current.map((existing, index) => (index === replaceIndex ? url : existing))
    latestUrls.current = next
    onChange(next)
  })

  function chooseSeveral(files) {
    const room = max - latestUrls.current.length
    setSkippedExtra(files.length > room)
    if (room > 0) choose(files.slice(0, room))
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((url, index) => (
          <div key={url + index} className="relative aspect-square">
            <ExistingImage
              url={url}
              wrapperClassName="w-full h-full"
              imageClassName="w-full h-full object-cover rounded-lg border border-gray-200"
              busy={busy}
              onEdit={() => edit(url, index)}
            />
            <RemoveButton
              label={t('photoRemove')}
              onClick={() => {
                discardStaged(url)
                onChange(urls.filter((_, i) => i !== index))
              }}
            />
          </div>
        ))}
      </div>
      {urls.length < max && (
        <div className={urls.length ? 'mt-2' : ''}>
          <FilePicker label={t('photoAdd')} busy={busy} multiple onFile={chooseSeveral} />
        </div>
      )}
      {skippedExtra && <p className="text-xs text-gray-500 mt-1">{t('photoGalleryLimit')}</p>}
      {error && <p role="alert" className="text-xs text-red-600 mt-1">{error}</p>}
      {cropDialog}
    </div>
  )
}
