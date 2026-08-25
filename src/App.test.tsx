import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App, { GameSession } from './App'
import type { PuzzleLevel } from './game/engine'

const oneSwitchPuzzle: PuzzleLevel = {
  levelNumber: 1,
  switchCount: 21,
  lightCount: 1,
  timeLimitSeconds: 10,
  wiring: [Array.from({ length: 21 }, (_, index) => index === 0)],
  polarity: [false],
  solution: [true, ...Array<boolean>(20).fill(false)],
}

const threeLightPuzzle: PuzzleLevel = {
  ...oneSwitchPuzzle,
  levelNumber: 3,
  lightCount: 3,
  wiring: Array.from({ length: 3 }, () => [...oneSwitchPuzzle.wiring[0]]),
  polarity: Array<boolean>(3).fill(false),
}

describe('Switch Game', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('introduces the restaurant crisis and starts a 21-switch shift', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /hot dog stand.*the game/i })).toBeInTheDocument()
    expect(screen.getByText(/21 unlabeled switches/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /clock in/i }))

    expect(screen.getByText(/level 01/i)).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(21)
  })

  it('hangs framed hot dog artwork on the restaurant wall', () => {
    render(<GameSession initialLevel={oneSwitchPuzzle} />)

    expect(screen.getByRole('img', { name: /framed hot dog artwork/i })).toBeInTheDocument()
  })

  it('toggles an unlabeled physical switch without revealing its wiring', () => {
    render(<GameSession initialLevel={oneSwitchPuzzle} />)
    const firstSwitch = screen.getAllByRole('switch')[0]

    expect(firstSwitch).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(firstSwitch)

    expect(firstSwitch).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByText(/switch 1/i)).not.toBeInTheDocument()
  })

  it('keeps 42 nonuniform screw heads fixed between levels', () => {
    const { container } = render(<GameSession initialLevel={oneSwitchPuzzle} />)
    const getScrewRotations = () =>
      [...container.querySelectorAll<HTMLElement>('.switch-screw')].map((screw) =>
        screw.style.getPropertyValue('--screw-rotation'),
      )

    const firstLevelRotations = getScrewRotations()
    expect(firstLevelRotations).toHaveLength(42)
    expect(new Set(firstLevelRotations)).toHaveLength(42)

    fireEvent.click(screen.getAllByRole('switch')[0])
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button'))

    expect(getScrewRotations()).toEqual(firstLevelRotations)
  })

  it('randomizes the success card while celebrating a completed shift', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0)
    const firstRound = render(<GameSession initialLevel={oneSwitchPuzzle} />)

    expect(screen.getByLabelText(/dining room light 1/i)).toHaveAttribute('data-lit', 'false')
    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(screen.getByRole('heading', { name: /frankly, you cooked/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /keep cooking/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/dining room light 1/i)).toHaveAttribute('data-lit', 'true')

    firstRound.unmount()
    random.mockReturnValue(0.999)
    render(<GameSession initialLevel={oneSwitchPuzzle} />)
    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(screen.getByRole('heading', { name: /we have a wiener/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /serve another/i })).toBeInTheDocument()
  })

  it('turns the timer red only below 30 seconds', () => {
    vi.useFakeTimers()
    render(
      <GameSession
        initialLevel={{ ...oneSwitchPuzzle, timeLimitSeconds: 31 }}
      />,
    )

    const timer = screen.getByLabelText(/31 seconds remaining/i)
    expect(timer).not.toHaveClass('is-low-time')

    act(() => vi.advanceTimersByTime(1_000))
    expect(screen.getByLabelText(/30 seconds remaining/i)).not.toHaveClass('is-low-time')

    act(() => vi.advanceTimersByTime(1_000))
    expect(screen.getByLabelText(/29 seconds remaining/i)).toHaveClass('is-low-time')
  })

  it('resets the game to a newly wired level one after failure', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.999)
    vi.useFakeTimers()
    render(<GameSession initialLevel={threeLightPuzzle} />)

    expect(screen.getByText(/level 03/i)).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(10_000))

    expect(screen.getByRole('heading', { name: /the dogs have gone cold/i })).toBeInTheDocument()
    const restartButton = screen.getByRole('button', { name: /try again tomorrow/i })

    random.mockRestore()
    fireEvent.click(restartButton)

    expect(screen.getByText(/level 01/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/dining room light/i)).toHaveLength(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByRole('switch').every((control) => control.getAttribute('aria-checked') === 'false')).toBe(true)
  })

  it('advances to a harder randomized level after a win', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<GameSession initialLevel={oneSwitchPuzzle} />)

    fireEvent.click(screen.getAllByRole('switch')[0])
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button'))

    expect(screen.getByText(/level 02/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/dining room light/i)).toHaveLength(2)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
