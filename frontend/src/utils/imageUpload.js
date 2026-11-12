import { requestImageUpload } from '../api/ownerApi'
import { http } from '../api/http'

const QUALITY = 0.82
const ACCEPTED_OUTPUT = ['image/webp', 'image/jpeg', 'image/png']

export const MAX_EDGE = { logo: 512, cover: 1600, gallery: 1600 }
export const ASPECT = { logo: 1, cover: 3, gallery: 1 }

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

function loadImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('undecodable'))
    }
    image.src = url
  })
}

// createImageBitmap handles photos but refuses vector files such as SVG; an image element reads those.
async function decodeImage(file) {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    return { drawable: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close?.() }
  } catch {
    try {
      const image = await loadImageElement(file)
      return { drawable: image, width: image.naturalWidth, height: image.naturalHeight, release: () => {} }
    } catch {
      throw { error: 'UNREADABLE_IMAGE' }
    }
  }
}

// Cuts out the area the owner framed (pixels of the original photo) and shrinks it to roughly 100-300 KB
// before it leaves the browser. Without an area the whole photo is used.
export async function compressImage(file, maxEdge, area) {
  const decoded = await decodeImage(file)
  if (area && !(area.width > 0 && area.height > 0)) throw { error: 'UNREADABLE_IMAGE' }
  const source = area || { x: 0, y: 0, width: decoded.width, height: decoded.height }
  const { width, height } = fitWithin(source.width, source.height, maxEdge)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(decoded.drawable, source.x, source.y, source.width, source.height, 0, 0, width, height)
  decoded.release()
  // Browsers that cannot encode WebP silently return PNG; JPEG is far smaller for photos.
  let blob = await canvasToBlob(canvas, 'image/webp')
  if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg')
  if (!blob || !ACCEPTED_OUTPUT.includes(blob.type)) throw { error: 'UNREADABLE_IMAGE' }
  return blob
}

// Asks the server for a signed address, sends the already cropped and compressed image straight to
// storage and returns the permanent public address to save on the profile.
export async function uploadBlob(token, blob) {
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
