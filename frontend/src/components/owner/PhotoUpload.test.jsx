import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GalleryField, SinglePhotoField } from './PhotoUpload'

vi.mock('../../utils/imageUpload', async () => {
  const actual = await vi.importActual('../../utils/imageUpload')
  return { ...actual, compressImage: vi.fn(), uploadBlob: vi.fn() }
})
vi.mock('react-easy-crop', async () => {
  const React = await vi.importActual('react')
  function FakeCropper({ aspect, cropShape, onCropComplete }) {
    const reported = React.useRef(false)
    React.useEffect(() => {
      if (reported.current) return
      reported.current = true
      onCropComplete({}, { x: 10, y: 20, width: 300, height: 100 })
    })
    return <div data-testid="cropper" data-aspect={aspect} data-shape={cropShape} />
  }
  return { default: FakeCropper }
})

import { compressImage, uploadBlob } from '../../utils/imageUpload'
import { discardAllStaged } from '../../utils/stagedImages'

const photo = new File(['raw'], 'photo.jpg', { type: 'image/jpeg' })
const fileInput = () => screen.getByTestId('photo-file-input')

const AREA = { x: 10, y: 20, width: 300, height: 100 }

const BLOB_ADDRESS = expect.stringMatching(/^blob:preview-/)

beforeEach(() => {
  let counter = 0
  compressImage.mockReset()
  compressImage.mockResolvedValue(new Blob(['small'], { type: 'image/webp' }))
  uploadBlob.mockReset()
  URL.createObjectURL = vi.fn(() => `blob:preview-${++counter}`)
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => discardAllStaged())

async function chooseAndConfirm(user) {
  await user.upload(fileInput(), photo)
  await user.click(await screen.findByRole('button', { name: 'Use photo' }))
}

describe('SinglePhotoField', () => {
  it('frames the chosen file at the logo size and keeps it in the browser until the profile is saved', async () => {
    const onChange = vi.fn()
    render(<SinglePhotoField kind="logo" value="" onChange={onChange} />)

    await chooseAndConfirm(userEvent.setup())

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(BLOB_ADDRESS))
    expect(compressImage).toHaveBeenCalledWith(photo, 512, AREA)
    expect(uploadBlob).not.toHaveBeenCalled()
  })

  it('opens a square round frame for the logo and a wide frame for the cover', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<SinglePhotoField kind="logo" value="" onChange={vi.fn()} />)
    await user.upload(fileInput(), photo)
    expect(await screen.findByTestId('cropper')).toHaveAttribute('data-aspect', '1')
    expect(screen.getByTestId('cropper')).toHaveAttribute('data-shape', 'round')
    unmount()

    render(<SinglePhotoField kind="cover" value="" onChange={vi.fn()} />)
    await user.upload(fileInput(), photo)
    expect(await screen.findByTestId('cropper')).toHaveAttribute('data-aspect', '3')
    expect(screen.getByTestId('cropper')).toHaveAttribute('data-shape', 'rect')
  })

  it('keeps the preview address alive while the dialog is open and releases it after', async () => {
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value="" onChange={vi.fn()} />)

    await user.upload(fileInput(), photo)
    await screen.findByTestId('cropper')
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(BLOB_ADDRESS)
  })

  it('uploads nothing when the owner cancels the crop', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value="" onChange={onChange} />)

    await user.upload(fileInput(), photo)
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument()
    expect(compressImage).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('has no separate Change button, only the corner X and the View or edit menu', () => {
    render(<SinglePhotoField kind="logo" value="https://img.example.com/l.webp" onChange={vi.fn()} />)

    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add photo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })

  it('offers Add photo again once the photo is removed', () => {
    render(<SinglePhotoField kind="logo" value="" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Add photo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument()
  })

  it('shows the current photo and lets the owner remove it', async () => {
    const onChange = vi.fn()
    const { container } = render(<SinglePhotoField kind="cover" value="https://img.example.com/c.webp" onChange={onChange} />)

    expect(container.querySelector('img')).toHaveAttribute('src', 'https://img.example.com/c.webp')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Remove' }))

    expect(onChange).toHaveBeenCalledWith('')
  })

  it('forgets a not-yet-saved photo for good when it is removed', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(<SinglePhotoField kind="cover" value="" onChange={onChange} />)
    await chooseAndConfirm(user)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(BLOB_ADDRESS))
    const staged = onChange.mock.calls[0][0]

    rerender(<SinglePhotoField kind="cover" value={staged} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(URL.revokeObjectURL).toHaveBeenCalledWith(staged)
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('tells the owner when the file is not an image', async () => {
    compressImage.mockRejectedValue({ error: 'UNREADABLE_IMAGE' })
    render(<SinglePhotoField kind="logo" value="" onChange={vi.fn()} />)

    await chooseAndConfirm(userEvent.setup())

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be read as an image')
  })
})

describe('opening an existing photo', () => {
  const existing = 'https://img.example.com/dev/tenants/5/cover.webp'

  function stubFetch(response) {
    const fetchMock = vi.fn().mockResolvedValue(response)
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  afterEach(() => vi.unstubAllGlobals())

  it('opens the large view with Edit and Close when the photo is clicked', async () => {
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value={existing} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'View or edit photo' }))

    const dialog = screen.getByRole('dialog', { name: 'View' })
    expect(dialog.querySelector('img')).toHaveAttribute('src', existing)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes the view without opening the editor', async () => {
    const fetchMock = stubFetch({ ok: true })
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value={existing} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'View or edit photo' }))
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads the saved photo into the crop dialog on Edit and swaps in the new framing without uploading yet', async () => {
    const fetchMock = stubFetch({ ok: true, blob: async () => new Blob(['x'], { type: 'image/webp' }) })
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value={existing} onChange={onChange} />)

    await user.click(screen.getByRole('button', { name: 'View or edit photo' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(await screen.findByRole('button', { name: 'Use photo' }))

    expect(fetchMock).toHaveBeenCalledWith(existing, expect.objectContaining({ mode: 'cors' }))
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(BLOB_ADDRESS))
    expect(compressImage).toHaveBeenCalledWith(expect.any(File), 1600, AREA)
    expect(uploadBlob).not.toHaveBeenCalled()
  })

  it('keeps the view open while the saved photo loads, then swaps it for the editor in the same place', async () => {
    let finishLoading
    const fetchMock = vi.fn(() => new Promise(resolve => { finishLoading = () => resolve({ ok: true, blob: async () => new Blob(['x'], { type: 'image/webp' }) }) }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value={existing} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'View or edit photo' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByRole('dialog', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument()

    finishLoading()
    expect(await screen.findByTestId('cropper')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'View' })).not.toBeInTheDocument())
    expect(screen.getAllByRole('dialog')).toHaveLength(1)
  })

  it('tells the owner when the saved photo cannot be loaded for editing', async () => {
    stubFetch({ ok: false })
    const user = userEvent.setup()
    render(<SinglePhotoField kind="cover" value={existing} onChange={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'View or edit photo' }))
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('could not be loaded for editing')
    expect(screen.queryByTestId('cropper')).not.toBeInTheDocument()
  })

  it('replaces only the edited gallery photo and keeps its position', async () => {
    stubFetch({ ok: true, blob: async () => new Blob(['x'], { type: 'image/webp' }) })
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<GalleryField urls={['https://x/a.webp', 'https://x/b.webp', 'https://x/c.webp']} onChange={onChange} />)

    await user.click(screen.getAllByRole('button', { name: 'View or edit photo' })[1])
    await user.click(screen.getByRole('button', { name: 'Edit' }))
    await user.click(await screen.findByRole('button', { name: 'Use photo' }))

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['https://x/a.webp', BLOB_ADDRESS, 'https://x/c.webp']))
  })
})

describe('GalleryField with several photos at once', () => {
  const photoA = new File(['a'], 'a.jpg', { type: 'image/jpeg' })
  const photoB = new File(['b'], 'b.jpg', { type: 'image/jpeg' })
  const photoC = new File(['c'], 'c.jpg', { type: 'image/jpeg' })

  it('lets the owner pick more than one file', () => {
    render(<GalleryField urls={[]} onChange={vi.fn()} />)

    expect(fileInput()).toHaveAttribute('multiple')
  })

  it('walks through each photo in turn and adds all of them in order', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<GalleryField urls={['https://x/a.webp']} onChange={onChange} />)

    await user.upload(fileInput(), [photoA, photoB])
    expect(await screen.findByRole('dialog', { name: 'Adjust photo (1/2)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use photo' }))
    expect(await screen.findByRole('dialog', { name: 'Adjust photo (2/2)' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Use photo' }))

    await waitFor(() => expect(onChange).toHaveBeenLastCalledWith(['https://x/a.webp', BLOB_ADDRESS, BLOB_ADDRESS]))
    expect(compressImage).toHaveBeenCalledTimes(2)
    expect(compressImage).toHaveBeenNthCalledWith(1, photoA, 1600, AREA)
    expect(compressImage).toHaveBeenNthCalledWith(2, photoB, 1600, AREA)
    expect(uploadBlob).not.toHaveBeenCalled()
  })

  it('stops the whole batch when the owner cancels', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<GalleryField urls={[]} onChange={onChange} />)

    await user.upload(fileInput(), [photoA, photoB])
    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(compressImage).not.toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(2)
  })

  it('only takes as many photos as there is room for and says so', async () => {
    const urls = Array.from({ length: 11 }, (_, i) => `https://x/${i}.webp`)
    const user = userEvent.setup()
    render(<GalleryField urls={urls} onChange={vi.fn()} />)

    await user.upload(fileInput(), [photoA, photoB, photoC])

    expect(await screen.findByRole('dialog', { name: 'Adjust photo' })).toBeInTheDocument()
    expect(screen.getByText('The gallery is full. Extra photos were skipped.')).toBeInTheDocument()
  })
})

describe('GalleryField', () => {
  it('appends a framed photo at the gallery size', async () => {
    const onChange = vi.fn()
    render(<GalleryField urls={['https://img.example.com/a.webp']} onChange={onChange} />)

    await chooseAndConfirm(userEvent.setup())

    await waitFor(() => expect(onChange).toHaveBeenCalledWith(['https://img.example.com/a.webp', BLOB_ADDRESS]))
    expect(compressImage).toHaveBeenCalledWith(photo, 1600, AREA)
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
