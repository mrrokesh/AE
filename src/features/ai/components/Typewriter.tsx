import { useEffect, useState } from 'react'

/** Reveals text gradually. Re-mount with a new `key` to replay. */
export function Typewriter({ text, speed = 14 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), speed)
    return () => clearInterval(id)
  }, [text, speed])
  return <span className="whitespace-pre-wrap">{text.slice(0, n)}</span>
}
