import { useSettingsStore } from '@/store/settingsStore'

let ctx: AudioContext | undefined

/** Soft two-note chime (WebAudio, no asset). Silently does nothing if blocked or turned off. */
export function playChime() {
  if (!useSettingsStore.getState().soundOn) return
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    const t0 = ctx.currentTime
    ;[880, 1320].forEach((freq, i) => {
      const osc = ctx!.createOscillator()
      const gain = ctx!.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, t0 + i * 0.14)
      gain.gain.exponentialRampToValueAtTime(0.06, t0 + i * 0.14 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.14 + 0.5)
      osc.connect(gain).connect(ctx!.destination)
      osc.start(t0 + i * 0.14)
      osc.stop(t0 + i * 0.14 + 0.55)
    })
  } catch {
    /* autoplay policy or no audio device */
  }
}
