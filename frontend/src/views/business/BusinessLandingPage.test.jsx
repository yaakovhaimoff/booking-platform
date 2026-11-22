import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import BusinessLandingPage from './BusinessLandingPage'
import { PUBLIC } from '../../i18nPublic'

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

const renderPage = () => render(<MemoryRouter><BusinessLandingPage /></MemoryRouter>)

describe('BusinessLandingPage', () => {
  it('shows the headline and sends both call-to-action buttons to partner sign-up', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Run your businessthe right way')
    const links = screen.getAllByRole('link', { name: PUBLIC.en.pGetStarted })
    expect(links).toHaveLength(2)
    links.forEach(link => expect(link).toHaveAttribute('href', '/partner'))
  })

  it('renders every day scene, feature tile, step and question', () => {
    renderPage()
    PUBLIC.en.bzScenes.forEach(scene => expect(screen.getByRole('heading', { name: scene.title })).toBeInTheDocument())
    Object.values(PUBLIC.en.bzBento).forEach(tile => expect(screen.getByRole('heading', { name: tile.t })).toBeInTheDocument())
    PUBLIC.en.bzSteps.forEach(step => expect(screen.getByRole('heading', { name: step.t })).toBeInTheDocument())
    PUBLIC.en.bzFaq.forEach(item => expect(screen.getByText(item.q)).toBeInTheDocument())
  })

  it('keeps the features anchor and the see-how link used by the business header', () => {
    const { container } = renderPage()
    expect(container.querySelector('#features')).not.toBeNull()
    expect(container.querySelector('#day')).not.toBeNull()
    expect(screen.getByRole('link', { name: PUBLIC.en.bzSeeHow })).toHaveAttribute('href', '#day')
  })

  it('opens a question to reveal its answer', async () => {
    renderPage()
    const first = PUBLIC.en.bzFaq[0]
    const details = screen.getByText(first.q).closest('details')
    expect(details).not.toHaveAttribute('open')
    await userEvent.click(within(details).getByText(first.q))
    expect(details).toHaveAttribute('open')
  })

  it('runs the clock and slides the day cards as the page scrolls through the pinned section', async () => {
    vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(600)
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(300)
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function () {
      return [...this.parentElement.children].indexOf(this) * 400
    })
    const { container } = renderPage()
    const section = container.querySelector('#day')
    const clock = screen.getByTestId('day-clock')
    const track = clock.closest('section').querySelector('.will-change-transform')
    const scrollTo = top => {
      vi.spyOn(section, 'getBoundingClientRect').mockReturnValue({ top, height: 3000 })
      act(() => { window.dispatchEvent(new Event('scroll')) })
    }
    scrollTo(0)
    await waitFor(() => expect(clock).toHaveTextContent(PUBLIC.en.bzScenes[0].time))
    const startTransform = track.style.transform
    scrollTo(-2400)
    await waitFor(() => expect(clock).toHaveTextContent(PUBLIC.en.bzScenes.at(-1).time))
    expect(track.style.transform).not.toBe(startTransform)
    scrollTo(-1200)
    await waitFor(() => expect(clock).not.toHaveTextContent(PUBLIC.en.bzScenes.at(-1).time))
    expect(clock).not.toHaveTextContent(PUBLIC.en.bzScenes[0].time)
  })

  it('shows the day as a plain list when the visitor prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', query => ({ matches: query.includes('reduce'), addEventListener() {}, removeEventListener() {} }))
    renderPage()
    expect(screen.queryByTestId('day-clock')).toBeNull()
    PUBLIC.en.bzScenes.forEach(scene => expect(screen.getByRole('heading', { name: scene.title })).toBeInTheDocument())
  })

  it('has the same copy keys in English and Italian', () => {
    const keys = language => Object.keys(PUBLIC[language]).filter(key => key.startsWith('bz')).sort()
    expect(keys('it')).toEqual(keys('en'))
    expect(PUBLIC.it.bzScenes).toHaveLength(PUBLIC.en.bzScenes.length)
    expect(PUBLIC.it.bzSteps).toHaveLength(PUBLIC.en.bzSteps.length)
    expect(PUBLIC.it.bzFaq).toHaveLength(PUBLIC.en.bzFaq.length)
    expect(PUBLIC.it.bzTypes).toHaveLength(PUBLIC.en.bzTypes.length)
  })
})
