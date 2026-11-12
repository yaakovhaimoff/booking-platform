import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./imageUpload', () => ({ uploadBlob: vi.fn() }))

import { uploadBlob } from './imageUpload'
import { discardAllStaged, discardStagedImages, isStaged, stageImage, uploadStagedImages } from './stagedImages'

beforeEach(() => {
  let counter = 0
  uploadBlob.mockReset()
  URL.createObjectURL = vi.fn(() => `blob:staged-${++counter}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => discardAllStaged())

const blob = () => new Blob(['x'], { type: 'image/webp' })

describe('stagedImages', () => {
  it('keeps a framed photo in the browser without uploading it', () => {
    const address = stageImage(blob())

    expect(isStaged(address)).toBe(true)
    expect(isStaged('https://img.example.com/dev/tenants/1/a.webp')).toBe(false)
    expect(uploadBlob).not.toHaveBeenCalled()
  })

  it('uploads only the staged photos on save and keeps saved addresses and order', async () => {
    uploadBlob.mockResolvedValueOnce('https://img.example.com/dev/tenants/1/new-logo.webp').mockResolvedValueOnce('https://img.example.com/dev/tenants/1/new-gallery.webp')
    const logo = stageImage(blob())
    const gallery = stageImage(blob())

    const resolved = await uploadStagedImages('token-1', {
      logoUrl: logo,
      coverUrl: 'https://img.example.com/dev/tenants/1/cover.webp',
      galleryUrls: ['https://img.example.com/dev/tenants/1/g1.webp', gallery],
    })

    expect(resolved).toEqual({
      logoUrl: 'https://img.example.com/dev/tenants/1/new-logo.webp',
      coverUrl: 'https://img.example.com/dev/tenants/1/cover.webp',
      galleryUrls: ['https://img.example.com/dev/tenants/1/g1.webp', 'https://img.example.com/dev/tenants/1/new-gallery.webp'],
    })
    expect(uploadBlob).toHaveBeenCalledTimes(2)
    expect(uploadBlob).toHaveBeenCalledWith('token-1', expect.any(Blob))
  })

  it('does not upload empty fields', async () => {
    const resolved = await uploadStagedImages('token-1', { logoUrl: '', coverUrl: '', galleryUrls: [] })

    expect(resolved).toEqual({ logoUrl: '', coverUrl: '', galleryUrls: [] })
    expect(uploadBlob).not.toHaveBeenCalled()
  })

  it('does not upload a photo twice when a failed save is retried', async () => {
    uploadBlob.mockResolvedValueOnce('https://img.example.com/dev/tenants/1/one.webp').mockRejectedValueOnce({ error: 'UPLOAD_FAILED' })
    const first = stageImage(blob())
    const second = stageImage(blob())
    const values = { logoUrl: '', coverUrl: '', galleryUrls: [first, second] }

    await expect(uploadStagedImages('token-1', values)).rejects.toEqual({ error: 'UPLOAD_FAILED' })
    uploadBlob.mockResolvedValueOnce('https://img.example.com/dev/tenants/1/two.webp')
    const resolved = await uploadStagedImages('token-1', values)

    expect(resolved.galleryUrls).toEqual(['https://img.example.com/dev/tenants/1/one.webp', 'https://img.example.com/dev/tenants/1/two.webp'])
    expect(uploadBlob).toHaveBeenCalledTimes(3)
  })

  it('releases the preview addresses after a save', () => {
    const logo = stageImage(blob())
    const gallery = stageImage(blob())

    discardStagedImages({ logoUrl: logo, coverUrl: '', galleryUrls: ['https://img.example.com/a.webp', gallery] })

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(logo)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(gallery)
    expect(isStaged(logo)).toBe(false)
  })
})
