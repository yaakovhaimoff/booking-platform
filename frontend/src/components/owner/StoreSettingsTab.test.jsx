import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StoreSettingsTab from './StoreSettingsTab'

vi.mock('../../auth', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-1' }) }))
vi.mock('../../api/ownerApi', () => ({ updateMyTenant: vi.fn() }))
vi.mock('../../utils/imageUpload', async () => {
  const actual = await vi.importActual('../../utils/imageUpload')
  return { ...actual, compressImage: vi.fn(), uploadBlob: vi.fn() }
})
vi.mock('./StorePreviewFrame', () => ({ default: () => null }))
vi.mock('./StorePreviewModal', () => ({ default: () => null }))
vi.mock('react-easy-crop', async () => {
  const React = await vi.importActual('react')
  function FakeCropper({ onCropComplete }) {
    const reported = React.useRef(false)
    React.useEffect(() => {
      if (reported.current) return
      reported.current = true
      onCropComplete({}, { x: 0, y: 0, width: 100, height: 100 })
    })
    return <div data-testid="cropper" />
  }
  return { default: FakeCropper }
})

import { updateMyTenant } from '../../api/ownerApi'
import { compressImage, uploadBlob } from '../../utils/imageUpload'

const tenant = { name: 'Shop', slug: 'shop', logoUrl: '', coverUrl: '', galleryUrls: [] }
const photo = new File(['raw'], 'photo.jpg', { type: 'image/jpeg' })

async function addLogoAndSave(user) {
  await user.upload(screen.getAllByTestId('photo-file-input')[0], photo)
  await user.click(await screen.findByRole('button', { name: 'Use photo' }))
  await screen.findByRole('button', { name: 'Remove' })
  await user.click(screen.getByRole('button', { name: 'Save changes' }))
}

beforeEach(() => {
  let counter = 0
  compressImage.mockReset()
  compressImage.mockResolvedValue(new Blob(['small'], { type: 'image/webp' }))
  uploadBlob.mockReset()
  updateMyTenant.mockReset()
  updateMyTenant.mockResolvedValue({})
  URL.createObjectURL = vi.fn(() => `blob:preview-${++counter}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => vi.clearAllMocks())

describe('StoreSettingsTab photos', () => {
  it('uploads nothing until the profile is saved', async () => {
    const user = userEvent.setup()
    render(<StoreSettingsTab tenant={tenant} />)

    await user.upload(screen.getAllByTestId('photo-file-input')[0], photo)
    await user.click(await screen.findByRole('button', { name: 'Use photo' }))
    await screen.findByRole('button', { name: 'Remove' })

    expect(uploadBlob).not.toHaveBeenCalled()
    expect(updateMyTenant).not.toHaveBeenCalled()
  })

  it('uploads the new photo on save and saves the permanent address, never the preview', async () => {
    uploadBlob.mockResolvedValue('https://img.example.com/dev/tenants/5/logo.webp')
    const user = userEvent.setup()
    render(<StoreSettingsTab tenant={tenant} />)

    await addLogoAndSave(user)

    await waitFor(() => expect(updateMyTenant).toHaveBeenCalled())
    expect(uploadBlob).toHaveBeenCalledWith('token-1', expect.any(Blob))
    expect(updateMyTenant).toHaveBeenCalledWith('token-1', expect.objectContaining({ logoUrl: 'https://img.example.com/dev/tenants/5/logo.webp' }))
    expect(await screen.findByText('Saved. Your public page is updated.')).toBeInTheDocument()
  })

  it('saves nothing and says so when the upload to storage fails', async () => {
    uploadBlob.mockRejectedValue({ error: 'UPLOAD_FAILED' })
    const user = userEvent.setup()
    render(<StoreSettingsTab tenant={tenant} />)

    await addLogoAndSave(user)

    expect(await screen.findByText(/Upload failed/)).toBeInTheDocument()
    expect(updateMyTenant).not.toHaveBeenCalled()
  })

  it('says so when photo uploads are switched off on the server', async () => {
    uploadBlob.mockRejectedValue({ error: 'UPLOADS_NOT_CONFIGURED' })
    const user = userEvent.setup()
    render(<StoreSettingsTab tenant={tenant} />)

    await addLogoAndSave(user)

    expect(await screen.findByText(/not available yet/)).toBeInTheDocument()
    expect(updateMyTenant).not.toHaveBeenCalled()
  })

  it('does not upload the photo again when saving is retried after the profile call failed', async () => {
    uploadBlob.mockResolvedValue('https://img.example.com/dev/tenants/5/logo.webp')
    updateMyTenant.mockRejectedValueOnce({}).mockResolvedValueOnce({})
    const user = userEvent.setup()
    render(<StoreSettingsTab tenant={tenant} />)

    await addLogoAndSave(user)
    await screen.findByText(/Could not save/)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(updateMyTenant).toHaveBeenCalledTimes(2))
    expect(uploadBlob).toHaveBeenCalledTimes(1)
  })
})
