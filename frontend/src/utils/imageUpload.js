import { requestImageUpload } from '../api/ownerApi'
import { http } from '../api/http'

const QUALITY = 0.82
const ACCEPTED_OUTPUT = ['image/webp', 'image/jpeg', 'image/png']

export const MAX_EDGE = { logo: 512, cover: 1600, gallery: 1600 }

// Largest size that keeps the aspect ratio with the long edge at most maxEdge; never upscales.
export function fitWithin(width, height, maxEdge) {
  const longest = Math.max(width, height)
  if (longest <= maxEdge) return { width, height }
  const scale = maxEdge / longest
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

function canvasToBlob(canvas, type) {
  return new Promise(resolve => canvas.toBlob(resolve, type, QUALITY))
}

// Shrinks a phone photo (often 3-8 MB) to roughly 100-300 KB before it leaves the browser.
export async function compressImage(file, maxEdge) {
  let bitmap
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw { error: 'UNREADABLE_IMAGE' }
  }
  const { width, height } = fitWithin(bitmap.width, bitmap.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  // Browsers that cannot encode WebP silently return PNG; JPEG is far smaller for photos.
  let blob = await canvasToBlob(canvas, 'image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg')
  if (!blob || !ACCEPTED_OUTPUT.includes(blob.type)) throw { error: 'UNREADABLE_IMAGE' }
  return blob
}

// Compresses the file, asks the server for a signed address, sends the file straight to storage and
// returns the permanent public address to save on the profile.
export async function uploadImage(token, file, maxEdge) {
  const blob = await compressImage(file, maxEdge)
  const upload = await requestImageUpload(token, { contentType: blob.type, sizeBytes: blob.size })
  let res
  try {
    res = await http(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: blob })
  } catch {
    throw { error: 'UPLOAD_FAILED' }
  }
  if (!res.ok) throw { error: 'UPLOAD_FAILED' }
  return upload.publicUrl
}
