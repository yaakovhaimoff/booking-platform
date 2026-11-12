import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../test/tokens'
import { compressImage, fitWithin, uploadBlob } from './imageUpload'

describe('fitWithin', () => {
  it('shrinks the long edge to the maximum and keeps the proportions', () => {
    expect(fitWithin(4000, 3000, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3000, 4000, 1600)).toEqual({ width: 1200, height: 1600 })
  })

  it('never enlarges a small image', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })
})

function stubCanvas({ webp = true } = {}) {
  const drawImage = vi.fn()
  const toBlob = vi.fn((callback, type) => {
    const actual = type === 'image/webp' && !webp ? 'image/png' : type
    callback(new Blob(['x'.repeat(100)], { type: actual }))
  })
  const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toBlob }
  vi.spyOn(document, 'createElement').mockImplementation(tag => (tag === 'canvas' ? canvas : document.createElementNS('http://www.w3.org/1999/xhtml', tag)))
  return { canvas, drawImage, toBlob }
}

beforeEach(() => {
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 4000, height: 3000, close: vi.fn() }))
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('compressImage', () => {
  it('draws the photo at the reduced size and exports WebP', async () => {
    const { canvas, drawImage } = stubCanvas()

    const blob = await compressImage(new File(['raw'], 'photo.jpg', { type: 'image/jpeg' }), 1600)

    expect(canvas.width).toBe(1600)
    expect(canvas.height).toBe(1200)
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 4000, 3000, 0, 0, 1600, 1200)
    expect(blob.type).toBe('image/webp')
  })

  it('draws only the framed area and sizes the result to it', async () => {
    const { canvas, drawImage } = stubCanvas()

    await compressImage(new File(['raw'], 'photo.jpg', { type: 'image/jpeg' }), 1600, { x: 500, y: 1000, width: 3000, height: 1000 })

    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 500, 1000, 3000, 1000, 0, 0, 1600, 533)
    expect(canvas.width).toBe(1600)
    expect(canvas.height).toBe(533)
  })

  it('never enlarges a small framed area', async () => {
    const { canvas } = stubCanvas()

    await compressImage(new File(['raw'], 'photo.jpg', { type: 'image/jpeg' }), 512, { x: 0, y: 0, width: 300, height: 300 })

    expect(canvas.width).toBe(300)
    expect(canvas.height).toBe(300)
  })

  it('reads vector files such as SVG through an image element when createImageBitmap cannot', async () => {
    const { drawImage } = stubCanvas()
    createImageBitmap.mockRejectedValue(new Error('cannot decode svg'))
    URL.createObjectURL = vi.fn(() => 'blob:svg')
    URL.revokeObjectURL = vi.fn()
    vi.stubGlobal('Image', class {
      constructor() {
        this.naturalWidth = 800
        this.naturalHeight = 600
        setTimeout(() => this.onload())
      }
    })

    const blob = await compressImage(new File(['<svg/>'], 'logo.svg', { type: 'image/svg+xml' }), 512, { x: 0, y: 0, width: 600, height: 600 })

    expect(blob.type).toBe('image/webp')
    expect(drawImage).toHaveBeenCalledWith(expect.any(Object), 0, 0, 600, 600, 0, 0, 512, 512)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:svg')
  })

  it('refuses an empty framed area instead of producing a broken image', async () => {
    stubCanvas()

    await expect(compressImage(new File(['raw'], 'photo.jpg'), 1600, { x: 0, y: 0, width: 0, height: 0 })).rejects.toEqual({ error: 'UNREADABLE_IMAGE' })
  })

  it('falls back to JPEG when the browser cannot encode WebP', async () => {
    stubCanvas({ webp: false })

    const blob = await compressImage(new File(['raw'], 'photo.jpg', { type: 'image/jpeg' }), 1600)

    expect(blob.type).toBe('image/jpeg')
  })

  it('reports a file that is not a readable image', async () => {
    createImageBitmap.mockRejectedValue(new Error('bad'))
    URL.createObjectURL = vi.fn(() => 'blob:bad')
    URL.revokeObjectURL = vi.fn()
    vi.stubGlobal('Image', class {
      constructor() {
        setTimeout(() => this.onerror())
      }
    })

    await expect(compressImage(new File(['nope'], 'a.pdf'), 1600)).rejects.toEqual({ error: 'UNREADABLE_IMAGE' })
  })
})

describe('uploadBlob', () => {
  const blob = new Blob(['x'.repeat(100)], { type: 'image/webp' })
  const signed = {
    uploadUrl: 'https://acct.r2.cloudflarestorage.com/bucket/tenants/5/a.webp?X-Amz-Signature=abc',
    publicUrl: 'https://img.example.com/tenants/5/a.webp',
    headers: { 'cache-control': 'public, max-age=31536000, immutable', 'content-type': 'image/webp' },
  }

  it('asks for a signed address with the size, sends the file there and returns the public address', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(200, signed)).mockResolvedValueOnce({ ok: true, status: 200 })

    const url = await uploadBlob('token-1', blob)

    expect(url).toBe(signed.publicUrl)
    const [requestUrl, requestOptions] = fetch.mock.calls[0]
    expect(requestUrl).toMatch(/\/tenants\/me\/uploads$/)
    expect(requestOptions.headers.Authorization).toBe('Bearer token-1')
    expect(JSON.parse(requestOptions.body)).toEqual({ contentType: 'image/webp', sizeBytes: 100 })
    const [putUrl, putOptions] = fetch.mock.calls[1]
    expect(putUrl).toBe(signed.uploadUrl)
    expect(putOptions.method).toBe('PUT')
    expect(putOptions.headers).toEqual(signed.headers)
    expect(putOptions.body.size).toBe(100)
  })

  it('does not send the signed PUT the login token', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(200, signed)).mockResolvedValueOnce({ ok: true, status: 200 })

    await uploadBlob('token-1', blob)

    expect(fetch.mock.calls[1][1].headers.Authorization).toBeUndefined()
  })

  it('fails when storage refuses the file', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(200, signed)).mockResolvedValueOnce({ ok: false, status: 403 })

    await expect(uploadBlob('token-1', blob)).rejects.toEqual({ error: 'UPLOAD_FAILED' })
  })

  it('passes on the server refusal when uploads are not set up', async () => {
    fetch.mockResolvedValueOnce(jsonResponse(503, { error: 'UPLOADS_NOT_CONFIGURED' }))

    await expect(uploadBlob('token-1', blob)).rejects.toEqual({ error: 'UPLOADS_NOT_CONFIGURED' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
