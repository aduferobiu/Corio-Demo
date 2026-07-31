import { useEffect, useRef } from 'react'

// Re-runs `callback` on an interval for as long as the calling component is
// mounted — used to keep server-loaded data (e.g. a query thread) fresh
// without the user having to manually refresh the page. Also re-runs it the
// moment the browser tab regains focus/visibility, so switching back to a
// tab after an action happened elsewhere shows the result immediately
// instead of waiting for the next interval tick.
export function usePoll(callback: () => void, delayMs: number) {
  const savedCallback = useRef(callback)
  savedCallback.current = callback

  useEffect(() => {
    const id = setInterval(() => savedCallback.current(), delayMs)

    function refetchIfVisible() {
      if (document.visibilityState === 'visible') savedCallback.current()
    }
    window.addEventListener('focus', refetchIfVisible)
    document.addEventListener('visibilitychange', refetchIfVisible)

    return () => {
      clearInterval(id)
      window.removeEventListener('focus', refetchIfVisible)
      document.removeEventListener('visibilitychange', refetchIfVisible)
    }
  }, [delayMs])
}
