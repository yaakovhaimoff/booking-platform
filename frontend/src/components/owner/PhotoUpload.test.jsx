import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryField, SinglePhotoField } from './PhotoUpload'

vi.mock('../../utils/imageUpload', async () => {
  const actual = await vi.importActual('../../utils/imageUpload')
  return { ...actual, uploadImage: vi.fn() }
})
vi.mock('../../auth', () => ({ useAuth0: () => ({ getAccessTokenSilently: async () => 'token-1' }) }))

import { uploadImage } from '../../utils/imageUpload'

const photo = new File(['raw'], 'photo.jpg', { type: 'image/jpeg' })
const fileInput = () => screen.getByTestId('photo-file-input')

beforeEach(() => {
  uploadImage.mockReset()
})

describe('SinglePhotoField', () => {
  it('uploads the chosen file at the logo size and reports the new address', async () => {
    uploadImage.mockResolvedValue('https://img.example.com/tenants/5/logo.webp')
    const onChange = vi.fn()
    render(<SinglePhotoField kind="logo" value="" onChange={onChange} />)

    await userEvent.setup().upload(fileInput(), photo)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith('https://img.example.com/tenants/5/logo.webp'))
    expect(uploadImage).toHaveBeenCalledWith('token-1', photo, 512)
  })

  it('shows the current photo and lets the owner remove it', async () => {
    const onChange = vi.fn()
    const { container } = render(<SinglePhotoField kind="cover" value="https://img.example.com/c.webp" onChange={onChange} />)

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://img.example.com/c.webp')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove' }))

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('shows an error and keeps the old photo when the upload fails', async () => {
    uploadImage.mockRejectedValue({ error: 'UPLOAD_FAILED' })
    const onChange = vi.fn()
    render(<SinglePhotoField kind="cover" value="https://img.example.com/c.webp" onChange={onChange} />)

    await userEvent.setup().upload(fileInput(), photo)

    expect(await screen.findByRole('alert')).toHaveTextContent('Upload failed')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('tells the owner when the file is not an image', async () => {
    uploadImage.mockRejectedValue({ error: 'UNREADABLE_IMAGE' })
    render(<SinglePhotoField kind="logo" value="" onChange={vi.fn()} />)

    await userEvent.setup().upload(fileInput(), photo)

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be read as an image')
  })

  it('tells the owner when the server has uploads switched off', async () => {
    uploadImage.mockRejectedValue({ error: 'UPLOADS_NOT_CONFIGURED' })
    render(<SinglePhotoField kind="logo" value="" onChange={vi.fn()} />)

    await userEvent.setup().upload(fileInput(), photo)

    expect(await screen.findByRole('alert')).toHaveTextContent('not available yet')
  })
})

describe('GalleryField', () => {
  it('appends an uploaded photo at the gallery size', async () => {
    uploadImage.mockResolvedValue('https://img.example.com/new.webp')
    const onChange = vi.fn()
    render(<GalleryField urls={['https://img.example.com/a.webp']} onChange={onChange} />)

    await userEvent.setup().upload(fileInput(), photo)

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['https://img.example.com/a.webp', 'https://img.example.com/new.webp']))
    expect(uploadImage).toHaveBeenCalledWith('token-1', photo, 1600)
  })

  it('removes only the chosen photo', async () => {
    const onChange = vi.fn()
    render(<GalleryField urls={['https://x/a.webp', 'https://x/b.webp']} onChange={onChange} />)

    await userEvent.setup().click(screen.getAllByRole('button', { name: 'Remove' })[0])

    expect(onChange).toHaveBeenCalledWith(['https://x/b.webp'])
  })

  it('hides the add button once the gallery is full', () => {
    const urls = Array.from({ length: 12 }, (_, i) => `https://x/${i}.webp`)
    render(<GalleryField urls={urls} onChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Add photo' })).not.toBeInTheDocument()
  })
})
