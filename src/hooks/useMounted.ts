import { useState, useEffect } from 'react'

export function useMounted(delay = 60): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setReady(true)
      return
    }
    const t = setTimeout(() => setReady(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  return ready
}
