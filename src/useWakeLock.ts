import { useEffect, useRef } from 'react'

/**
 * Keeps the screen awake using the Screen Wake Lock API while `active` is true.
 * Re-acquires the lock automatically when the page becomes visible again
 * (the browser releases it when the tab is backgrounded).
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    let cancelled = false

    const acquire = async () => {
      if (sentinelRef.current) return
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          await sentinel.release()
          return
        }
        sentinelRef.current = sentinel
        sentinel.addEventListener('release', () => {
          sentinelRef.current = null
        })
      } catch {
        // Ignore: e.g. denied, or document not visible.
      }
    }

    const release = async () => {
      const sentinel = sentinelRef.current
      sentinelRef.current = null
      if (sentinel) {
        try {
          await sentinel.release()
        } catch {
          // ignore
        }
      }
    }

    const handleVisibility = () => {
      if (active && document.visibilityState === 'visible') {
        void acquire()
      }
    }

    if (active) {
      void acquire()
      document.addEventListener('visibilitychange', handleVisibility)
    } else {
      void release()
    }

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibility)
      void release()
    }
  }, [active])
}
