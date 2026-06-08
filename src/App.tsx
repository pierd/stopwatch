import { useCallback, useEffect, useRef, useState } from 'react'
import { useWakeLock } from './useWakeLock'

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centis = Math.floor((ms % 1000) / 10)

  const pad = (n: number) => n.toString().padStart(2, '0')

  const main = hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`

  return `${main}.${pad(centis)}`
}

export default function App() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(true)

  // Anchor: wall-clock time the current run started, minus already accrued ms.
  const startRef = useRef(0)
  const accruedRef = useRef(0)
  const rafRef = useRef(0)

  useWakeLock(running)

  const tick = useCallback(() => {
    setElapsed(accruedRef.current + (performance.now() - startRef.current))
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  useEffect(() => {
    if (running) {
      startRef.current = performance.now()
      rafRef.current = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafRef.current)
    } else {
      // Freeze accrued time when paused.
      accruedRef.current = elapsed
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, tick])

  const toggle = () => {
    setRunning((r) => !r)
  }

  const reset = () => {
    accruedRef.current = 0
    startRef.current = performance.now()
    setElapsed(0)
    setRunning(true)
  }

  return (
    <main className="app">
      <div className={`time${running ? '' : ' paused'}`}>{formatTime(elapsed)}</div>
      <div className="controls">
        <button onClick={toggle} className="btn">
          {running ? 'Pause' : 'Resume'}
        </button>
        <button onClick={reset} className="btn secondary">
          Reset
        </button>
      </div>
    </main>
  )
}
