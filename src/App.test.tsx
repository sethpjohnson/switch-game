import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
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

describe('Switch Game', () => {
  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('introduces the restaurant crisis and starts a 21-switch shift', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /open the damn restaurant/i })).toBeInTheDocument()
    expect(screen.getByText(/21 unlabeled switches/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /clock in/i }))

    expect(screen.getByText(/level 01/i)).toBeInTheDocument()
    expect(screen.getAllByRole('switch')).toHaveLength(21)
  })

  it('toggles an unlabeled physical switch without revealing its wiring', () => {
    render(<GameSession initialLevel={oneSwitchPuzzle} />)
    const firstSwitch = screen.getAllByRole('switch')[0]

    expect(firstSwitch).toHaveAttribute('aria-checked', 'false')
    fireEvent.click(firstSwitch)

    expect(firstSwitch).toHaveAttribute('aria-checked', 'true')
    expect(screen.queryByText(/switch 1/i)).not.toBeInTheDocument()
  })

  it('celebrates when every required light is on', () => {
    render(<GameSession initialLevel={oneSwitchPuzzle} />)

    expect(screen.getByLabelText(/dining room light 1/i)).toHaveAttribute('data-lit', 'false')
    fireEvent.click(screen.getAllByRole('switch')[0])

    expect(screen.getByRole('heading', { name: /doors unlocked/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/dining room light 1/i)).toHaveAttribute('data-lit', 'true')
  })

  it('ends the shift when the countdown reaches zero', () => {
    vi.useFakeTimers()
    render(<GameSession initialLevel={oneSwitchPuzzle} />)

    act(() => vi.advanceTimersByTime(10_000))

    expect(screen.getByRole('heading', { name: /shift blown/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /rewire and retry/i })).toBeInTheDocument()
  })

  it('advances to a harder randomized level after a win', () => {
    render(<GameSession initialLevel={oneSwitchPuzzle} />)

    fireEvent.click(screen.getAllByRole('switch')[0])
    fireEvent.click(screen.getByRole('button', { name: /next disaster/i }))

    expect(screen.getByText(/level 02/i)).toBeInTheDocument()
    expect(screen.getAllByLabelText(/dining room light/i)).toHaveLength(2)
    expect(screen.queryByRole('heading', { name: /doors unlocked/i })).not.toBeInTheDocument()
  })
})
