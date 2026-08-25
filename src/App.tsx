import { type CSSProperties, useEffect, useMemo, useState } from 'react'
import {
  createLevel,
  getLightStates,
  SWITCH_COUNT,
  toggleSwitch,
  type PuzzleLevel,
} from './game/engine'

interface GameSessionProps {
  initialLevel?: PuzzleLevel
}

interface ResultMessage {
  eyebrow: (moves: number) => string
  title: string
  body: string
  action: string
}

const SCREW_ROTATIONS = [
  -45, 25, 30, -10, 55, -27, 64, 79, -36, 87, 0, -57, 58, -87,
  -83, -13, 37, 7, -72, -52, -21, -16, -75, 49, 46, 71, -78, -7,
  19, 16, 83, -62, 13, -68, -41, 68, -48, -31, -65, 61, 10, 42,
]

const screwStyle = (rotation: number) =>
  ({ '--screw-rotation': `${rotation}deg` }) as CSSProperties

const SUCCESS_MESSAGES: ResultMessage[] = [
  {
    eyebrow: (moves) => `FULL WIENER POWER IN ${moves} FLIPS`,
    title: 'FRANKLY, YOU COOKED.',
    body: 'Every light is on. The glizzies may now flow.',
    action: 'KEEP COOKING',
  },
  {
    eyebrow: (moves) => `CRISIS AVERTED IN ${moves} FLIPS`,
    title: 'WIENER, WIENER HOT DOG DINNER.',
    body: 'The lights are on. Nobody ask who wired them.',
    action: 'TAKE ANOTHER SHIFT',
  },
  {
    eyebrow: () => 'ALL CIRCUITS HOT',
    title: 'GLIZZY OVERDRIVE',
    body: 'All circuits hot. All buns ready.',
    action: 'MORE POWER',
  },
  {
    eyebrow: () => 'INCIDENT RESOLVED',
    title: 'CORPORATE WILL NEVER KNOW.',
    body: 'The lights are on and the incident report has been deleted.',
    action: 'NEXT COVER-UP',
  },
  {
    eyebrow: (moves) => `SHIFT SAVED IN ${moves} FLIPS`,
    title: 'WE HAVE A WIENER!',
    body: 'The restaurant is glowing. The dogs are hot.',
    action: 'SERVE ANOTHER',
  },
]

const FAILURE_MESSAGES: ResultMessage[] = [
  {
    eyebrow: () => 'CATASTROPHIC GLIZZY OUTAGE',
    title: "FRANKLY, YOU'RE COOKED.",
    body: "All that work and no glizzies to guzzle.",
    action: 'BLAME THE ELECTRICIAN',
  },
  {
    eyebrow: () => 'AN ENTIRELY NORMAL ELECTRICAL EVENT',
    title: "WE'RE ALL TRYING TO FIND THE GUY WHO WIRED THIS.",
    body: 'The electrician was last seen buying a boat with all the profit he made selling these switches.',
    action: 'START THE INVESTIGATION',
  },
  {
    eyebrow: () => 'TUBE-MEAT SYSTEMS OFFLINE',
    title: 'GLIZZY BROWNOUT',
    body: 'Insufficient voltage for guzzling.',
    action: 'REBOOT THE STAND',
  },
  {
    eyebrow: () => 'INCIDENT AUTOMATICALLY ESCALATED',
    title: 'CORPORATE HAS BEEN NOTIFIED.',
    body: 'Please remain available for a mandatory Teams call about the glizzy outage.',
    action: 'START A NEW SHIFT',
  },
  {
    eyebrow: () => 'LUNCH IS CANCELED',
    title: 'THE DOGS HAVE GONE COLD.',
    body: 'No lights. No lunch. No hot-diggity-dog.',
    action: 'TRY AGAIN TOMORROW',
  },
]

const pickRandomMessage = (messages: ResultMessage[]) =>
  messages[Math.floor(Math.random() * messages.length)]

export function GameSession({ initialLevel = createLevel(1) }: GameSessionProps) {
  const [level, setLevel] = useState(initialLevel)
  const [switches, setSwitches] = useState(() => Array<boolean>(SWITCH_COUNT).fill(false))
  const [moves, setMoves] = useState(0)
  const [secondsRemaining, setSecondsRemaining] = useState(level.timeLimitSeconds)
  const lights = useMemo(() => getLightStates(level, switches), [level, switches])
  const resultMessages = useMemo(
    () => ({
      success: pickRandomMessage(SUCCESS_MESSAGES),
      failure: pickRandomMessage(FAILURE_MESSAGES),
    }),
    [level],
  )
  const hasWon = lights.every(Boolean)
  const hasFailed = secondsRemaining === 0 && !hasWon

  useEffect(() => {
    if (hasWon || hasFailed) return
    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [hasFailed, hasWon])

  const resetBoard = (replacement: PuzzleLevel) => {
    setLevel(replacement)
    setSwitches(Array<boolean>(SWITCH_COUNT).fill(false))
    setMoves(0)
    setSecondsRemaining(replacement.timeLimitSeconds)
  }

  const resetGame = () => resetBoard(createLevel(1))
  const advanceLevel = () => resetBoard(createLevel(level.levelNumber + 1))

  const handleToggle = (switchIndex: number) => {
    if (hasWon || hasFailed) return
    setSwitches((current) => toggleSwitch(current, switchIndex))
    setMoves((current) => current + 1)
  }

  return (
    <main className={`game-shell ${hasWon ? 'is-won' : ''} ${hasFailed ? 'is-failed' : ''}`}>
      <header className="game-header">
        <div className="brand-lockup">
          <div>
            {/* <small>OPENING CONTROL</small> */}
            <strong>HOT DOG STAND – THE GAME</strong>
          </div>
        </div>
        <div className="level-readout">
          <small>CURRENT CRISIS</small>
          <strong>LEVEL {String(level.levelNumber).padStart(2, '0')}</strong>
        </div>
        <div
          className={`timer-readout ${secondsRemaining < 30 ? 'is-low-time' : ''}`}
          aria-label={`${secondsRemaining} seconds remaining`}
        >
          <small>DOORS OPEN IN</small>
          <strong>
            {String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:
            {String(secondsRemaining % 60).padStart(2, '0')}
          </strong>
        </div>
      </header>

      <section className="restaurant-stage" aria-label="Dark restaurant dining room">
        <div className="ceiling-line" aria-hidden="true" />
        <div className="wall-art" role="img" aria-label="Framed hot dog artwork">
          <span aria-hidden="true">🌭</span>
        </div>
        <div className="pendant-row">
          {lights.map((isLit, index) => (
            <div
              className={`pendant ${isLit ? 'is-lit' : ''}`}
              data-lit={String(isLit)}
              aria-label={`Dining room light ${index + 1}: ${isLit ? 'on' : 'off'}`}
              key={index}
            >
              <span className="cord" aria-hidden="true" />
              <span className="shade" aria-hidden="true" />
              <span className="bulb" aria-hidden="true" />
              <span className="light-cone" aria-hidden="true" />
            </div>
          ))}
        </div>
        <div className="dining-room" aria-hidden="true">
          <span className="booth booth-left" />
          <span className="table table-left" />
          <span className="table table-center" />
          <span className="table table-right" />
          <span className="booth booth-right" />
        </div>
        {/* <div className="stage-copy">
          <span>{lights.filter(Boolean).length}/{lights.length} CIRCUITS LIVE</span>
          <p>{hasWon ? 'Somehow, that worked.' : 'The electrician left no notes. Naturally.'}</p>
        </div> */}
      </section>

      <section className="control-zone" aria-labelledby="panel-instruction">
        <div className="instruction-row">
          <div>
            <h1 id="panel-instruction">Get every light on.</h1>
          </div>
          <div className="move-counter">
            <small>FLIPS</small>
            <strong>{String(moves).padStart(2, '0')}</strong>
          </div>
        </div>

        <div className="switch-plate" aria-label="Twenty-one switch panel">
          <div className="switch-grid">
            {switches.map((isUp, index) => (
              <div className="switch-gang" key={index}>
                <span
                  className="switch-screw switch-screw-top"
                  style={screwStyle(SCREW_ROTATIONS[index * 2])}
                  aria-hidden="true"
                />
                <button
                  className={`toggle-switch ${isUp ? 'is-up' : ''}`}
                  aria-label={`Unlabeled switch ${index + 1}`}
                  aria-checked={isUp}
                  role="switch"
                  type="button"
                  onClick={() => handleToggle(index)}
                >
                  <span className="switch-well" aria-hidden="true">
                    <span className="switch-lever" />
                  </span>
                </button>
                <span
                  className="switch-screw switch-screw-bottom"
                  style={screwStyle(SCREW_ROTATIONS[index * 2 + 1])}
                  aria-hidden="true"
                />
              </div>
            ))}
          </div>
        </div>

      <p  className="fine-print">Inspired by <a href="https://www.reddit.com/r/electricians/comments/1vrpfw5/21_gang/" target="_blank" rel="noopener noreferrer">Reddit</a> • Powered by HomeTech.fm</p>
      </section>

      {hasWon && (
        <section className="result-card" role="dialog" aria-modal="true">
          <p className="eyebrow">{resultMessages.success.eyebrow(moves)}</p>
          <h2>{resultMessages.success.title}</h2>
          <p>{resultMessages.success.body}</p>
          <button type="button" onClick={advanceLevel}>{resultMessages.success.action}</button>
          <a href="/" rel="noopener noreferrer">
            <div className="back-link">
              ← Head back to HomeTech.fm
            </div>
          </a>
        </section>
      )}
      {hasFailed && (
        <section className="result-card failure-card" role="dialog" aria-modal="true">
          <p className="eyebrow">{resultMessages.failure.eyebrow(moves)}</p>
          <h2>{resultMessages.failure.title}</h2>
          <p>{resultMessages.failure.body}</p>
          <button type="button" onClick={resetGame}>{resultMessages.failure.action}</button>
          <a href="/" rel="noopener noreferrer">
            <div className="back-link">
              ← Head back to HomeTech.fm
            </div>
          </a>
        </section>
      )}
    </main>
  )
}

function App() {
  const [hasStarted, setHasStarted] = useState(false)

  if (hasStarted) return <GameSession />

  return (
    <main className="intro-shell">
      <section className="intro-card" aria-labelledby="game-title">
        <div className="intro-kicker">
        </div>
        <p className="eyebrow">A HOMETECH.FM EMERGENCY</p>
        <h1 id="game-title">HOT DOG STAND – THE GAME</h1>
        <p className="intro-copy">
          21 unlabeled switches. One electrician who stopped answering his phone. Find the
          combination, get the all the lights on, before the first customer arrives.
        </p>
        <div className="briefing">
          <span>01</span><p>Flip the switches.</p>
          <span>02</span><p>Light up the restaurant.</p>
          <span>03</span><p>Keep your glizzy job.</p>
        </div>
        <button className="start-button" type="button" onClick={() => setHasStarted(true)}>
          <span>CLOCK IN</span>
          <span aria-hidden="true">→</span>
        </button>
        <a href="/" rel="noopener noreferrer">
          <div className="back-link">
            ← Head back to HomeTech.fm
          </div>
        </a>
        <p className="fine-print">Inspired by <a href="https://www.reddit.com/r/electricians/comments/1vrpfw5/21_gang/" target="_blank" rel="noopener noreferrer">Reddit</a> • Powered by hot dogs 🌭</p>

      </section>
    </main>
  )
}

export default App
