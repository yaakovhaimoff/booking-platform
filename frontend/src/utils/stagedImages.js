import { uploadBlob } from './imageUpload'

// Photos the owner has framed but not saved yet. They live in the browser (shown through a blob: address)
// and only go to storage when the profile is saved, so abandoned edits never leave files behind.
const staged = new Map()

export function stageImage(blob) {
  const previewUrl = URL.createObjectURL(blob)
  staged.set(previewUrl, { blob, publicUrl: null })
  return previewUrl
}

export function isStaged(url) {
  return staged.has(url)
}

export function discardStaged(url) {
  if (!staged.has(url)) return
  URL.revokeObjectURL(url)
  staged.delete(url)
}

export function discardAllStaged() {
  Array.from(staged.keys()).forEach(discardStaged)
}

// Uploads each not-yet-saved photo once and returns the profile image fields with permanent addresses.
// A photo that already went up stays remembered, so retrying a failed save does not upload it again.
async function resolve(token, url) {
  const entry = staged.get(url)
  if (!entry) return url
  if (!entry.publicUrl) entry.publicUrl = await uploadBlob(token, entry.blob)
  return entry.publicUrl
}

export async function uploadStagedImages(token, { logoUrl, coverUrl, galleryUrls }) {
  const resolvedLogo = await resolve(token, logoUrl)
  const resolvedCover = await resolve(token, coverUrl)
  const resolvedGallery = []
  for (const url of galleryUrls) {
    resolvedGallery.push(await resolve(token, url))
  }
  return { logoUrl: resolvedLogo, coverUrl: resolvedCover, galleryUrls: resolvedGallery }
}

export function discardStagedImages({ logoUrl, coverUrl, galleryUrls }) {
  ;[logoUrl, coverUrl, ...galleryUrls].forEach(discardStaged)
}
