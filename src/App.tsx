import { useEffect, useMemo, useState } from 'react'
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

export function GameSession({ initialLevel = createLevel(1) }: GameSessionProps) {
  const [level, setLevel] = useState(initialLevel)
  const [switches, setSwitches] = useState(() => Array<boolean>(SWITCH_COUNT).fill(false))
  const [moves, setMoves] = useState(0)
  const [secondsRemaining, setSecondsRemaining] = useState(level.timeLimitSeconds)
  const lights = useMemo(() => getLightStates(level, switches), [level, switches])
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

  const resetLevel = () => resetBoard(createLevel(level.levelNumber))
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
            <small>OPENING CONTROL</small>
            <strong>OPEN THE DAMN RESTAURANT.</strong>
          </div>
        </div>
        <div className="level-readout">
          <small>CURRENT CRISIS</small>
          <strong>LEVEL {String(level.levelNumber).padStart(2, '0')}</strong>
        </div>
        <div className="timer-readout" aria-label={`${secondsRemaining} seconds remaining`}>
          <small>DOORS OPEN IN</small>
          <strong>
            {String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:
            {String(secondsRemaining % 60).padStart(2, '0')}
          </strong>
        </div>
      </header>

      <section className="restaurant-stage" aria-label="Dark restaurant dining room">
        <div className="ceiling-line" aria-hidden="true" />
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
          <span className="plate-screw screw-one" aria-hidden="true" />
          <span className="plate-screw screw-two" aria-hidden="true" />
          <div className="switch-grid">
            {switches.map((isUp, index) => (
              <button
                className={`toggle-switch ${isUp ? 'is-up' : ''}`}
                aria-label={`Unlabeled switch ${index + 1}`}
                aria-checked={isUp}
                role="switch"
                type="button"
                key={index}
                onClick={() => handleToggle(index)}
              >
                <span className="switch-well" aria-hidden="true">
                  <span className="switch-lever" />
                </span>
              </button>
            ))}
          </div>
        </div>

      <p  className="fine-print">Inspired by Reddit • Powered by HomeTech.fm</p>
      </section>

      {hasWon && (
        <section className="result-card" role="dialog" aria-modal="true">
          <p className="eyebrow">SHIFT SAVED IN {moves} FLIPS</p>
          <h2>DOORS UNLOCKED.</h2>
          <p>The dining room is glowing and nobody needs to call corporate.</p>
          <button type="button" onClick={advanceLevel}>NEXT DISASTER</button>
        </section>
      )}
      {hasFailed && (
        <section className="result-card failure-card" role="dialog" aria-modal="true">
          <p className="eyebrow">CUSTOMERS AT THE DOOR</p>
          <h2>SHIFT BLOWN.</h2>
          <p>The dining room is dark. The Google reviews are already being drafted.</p>
          <button type="button" onClick={resetLevel}>REWIRE AND RETRY</button>
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
        <h1 id="game-title">OPEN THE DAMN RESTAURANT.</h1>
        <p className="intro-copy">
          21 unlabeled switches. One electrician who stopped answering his phone. Find the
          combination, get the lights on, and unlock the doors before the first customer arrives.
        </p>
        <div className="briefing">
          <span>01</span><p>Flip the switches.</p>
          <span>02</span><p>Light up the restaurant.</p>
          <span>03</span><p>Keep your job.</p>
        </div>
        <button className="start-button" type="button" onClick={() => setHasStarted(true)}>
          <span>CLOCK IN</span>
          <span aria-hidden="true">→</span>
        </button>
      </section>
    </main>
  )
}

export default App
