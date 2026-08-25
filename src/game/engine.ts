export const SWITCH_COUNT = 21
export const MAX_LIGHTS = 6

export type RandomSource = () => number

export interface PuzzleLevel {
  levelNumber: number
  switchCount: number
  lightCount: number
  timeLimitSeconds: number
  wiring: boolean[][]
  polarity: boolean[]
  solution: boolean[]
}

const randomInteger = (random: RandomSource, minimum: number, maximum: number) =>
  Math.floor(random() * (maximum - minimum + 1)) + minimum

const shuffledIndexes = (random: RandomSource) => {
  const indexes = Array.from({ length: SWITCH_COUNT }, (_, index) => index)
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInteger(random, 0, index)
    ;[indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]]
  }
  return indexes
}

const parity = (wiring: boolean[], switches: boolean[]) =>
  wiring.reduce(
    (isOdd, connected, index) => (connected && switches[index] ? !isOdd : isOdd),
    false,
  )

const createSolution = (levelNumber: number, random: RandomSource) => {
  const solution = Array<boolean>(SWITCH_COUNT).fill(false)
  const activeCount = Math.min(15, 4 + Math.ceil(levelNumber / 2) + randomInteger(random, 0, 3))
  shuffledIndexes(random)
    .slice(0, activeCount)
    .forEach((index) => {
      solution[index] = true
    })
  return solution
}

const createWiring = (lightCount: number, levelNumber: number, random: RandomSource) => {
  const maximumConnections = Math.min(10, 5 + Math.ceil(levelNumber / 2))
  const wiring = Array.from({ length: lightCount }, () => {
    const row = Array<boolean>(SWITCH_COUNT).fill(false)
    const connectionCount = randomInteger(random, 3, maximumConnections)
    shuffledIndexes(random)
      .slice(0, connectionCount)
      .forEach((index) => {
        row[index] = true
      })
    return row
  })

  if (lightCount > 1) {
    const sharedSwitch = randomInteger(random, 0, SWITCH_COUNT - 1)
    wiring[0][sharedSwitch] = true
    wiring[1][sharedSwitch] = true
  }

  return wiring
}

export const createLevel = (
  levelNumber: number,
  random: RandomSource = Math.random,
): PuzzleLevel => {
  const safeLevel = Math.max(1, Math.floor(levelNumber))
  const lightCount = Math.min(MAX_LIGHTS, safeLevel)

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const solution = createSolution(safeLevel, random)
    const wiring = createWiring(lightCount, safeLevel, random)
    const polarity = wiring.map((row) => !parity(row, solution))

    if (polarity.some((lightStartsOn) => !lightStartsOn)) {
      return {
        levelNumber: safeLevel,
        switchCount: SWITCH_COUNT,
        lightCount,
        timeLimitSeconds: 35 + lightCount * 8,
        wiring,
        polarity,
        solution,
      }
    }
  }

  throw new Error('Unable to generate a non-trivial switch puzzle')
}

export const getLightStates = (level: PuzzleLevel, switches: boolean[]) => {
  if (switches.length !== level.switchCount) {
    throw new RangeError(`Expected ${level.switchCount} switch states`)
  }

  return level.wiring.map((row, lightIndex) => level.polarity[lightIndex] !== parity(row, switches))
}

export const toggleSwitch = (switches: boolean[], switchIndex: number) => {
  if (!Number.isInteger(switchIndex) || switchIndex < 0 || switchIndex >= switches.length) {
    throw new RangeError('Switch index is out of range')
  }

  return switches.map((state, index) => (index === switchIndex ? !state : state))
}
