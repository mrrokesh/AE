import { create } from 'zustand'

/** A shared ticking "now" so SLA timers and due-badges re-render without per-component intervals. */
export const useClockStore = create<{ now: number }>(() => ({ now: Date.now() }))

let timer: ReturnType<typeof setInterval> | undefined
export function startClock(intervalMs = 15_000) {
  if (timer) return
  timer = setInterval(() => useClockStore.setState({ now: Date.now() }), intervalMs)
}
export const useNow = () => useClockStore((s) => s.now)
