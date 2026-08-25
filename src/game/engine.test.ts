import { describe, expect, it } from 'vitest'
import {
  SWITCH_COUNT,
  createLevel,
  getLightStates,
  toggleSwitch,
  type RandomSource,
} from './engine'

const seededRandom = (seed: number): RandomSource => {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 2 ** 32
  }
}

describe('switch puzzle engine', () => {
  it('creates a solvable first level with 21 switches and one dark starting light', () => {
    const level = createLevel(1, seededRandom(7))

    expect(level.switchCount).toBe(SWITCH_COUNT)
    expect(level.lightCount).toBe(1)
    expect(level.solution).toHaveLength(SWITCH_COUNT)
    expect(getLightStates(level, Array(SWITCH_COUNT).fill(false))).not.toEqual([true])
    expect(getLightStates(level, level.solution)).toEqual([true])
  })

  it('adds lights as levels progress and caps the board at six', () => {
    expect(createLevel(2, seededRandom(2)).lightCount).toBe(2)
    expect(createLevel(4, seededRandom(4)).lightCount).toBe(4)
    expect(createLevel(20, seededRandom(20)).lightCount).toBe(6)
  })

  it('models three-way and cross-wired behavior with parity circuits', () => {
    const level = createLevel(3, seededRandom(13))
    const connectedPerLight = level.wiring.map((row) => row.filter(Boolean).length)
    const crossWiredSwitches = Array.from({ length: SWITCH_COUNT }, (_, switchIndex) =>
      level.wiring.filter((row) => row[switchIndex]).length,
    )

    expect(connectedPerLight.every((count) => count >= 3)).toBe(true)
    expect(crossWiredSwitches.some((count) => count > 1)).toBe(true)

    const initial = Array(SWITCH_COUNT).fill(false)
    const affectedSwitch = crossWiredSwitches.findIndex((count) => count > 0)
    const afterToggle = toggleSwitch(initial, affectedSwitch)
    const beforeLights = getLightStates(level, initial)
    const afterLights = getLightStates(level, afterToggle)

    level.wiring.forEach((row, lightIndex) => {
      expect(afterLights[lightIndex] === beforeLights[lightIndex]).toBe(!row[affectedSwitch])
    })
  })

  it('produces different hidden wiring from different random sources', () => {
    const first = createLevel(5, seededRandom(100))
    const second = createLevel(5, seededRandom(101))

    expect(second.wiring).not.toEqual(first.wiring)
    expect(second.solution).not.toEqual(first.solution)
  })

  it('does not mutate the prior switch state when toggling', () => {
    const switches = Array(SWITCH_COUNT).fill(false)
    const toggled = toggleSwitch(switches, 8)

    expect(switches[8]).toBe(false)
    expect(toggled[8]).toBe(true)
    expect(() => toggleSwitch(switches, SWITCH_COUNT)).toThrow(RangeError)
  })
})
