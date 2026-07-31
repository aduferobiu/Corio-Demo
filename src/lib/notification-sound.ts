// A short, pleasant two-note chime synthesized with the Web Audio API —
// no audio asset needed, works offline, and can't go missing from the bundle.
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    const notes: { freq: number; start: number; duration: number }[] = [
      { freq: 880, start: 0, duration: 0.16 },
      { freq: 1318.5, start: 0.1, duration: 0.26 },
    ]

    for (const note of notes) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = note.freq
      gain.gain.setValueAtTime(0, now + note.start)
      gain.gain.linearRampToValueAtTime(0.22, now + note.start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + note.start)
      osc.stop(now + note.start + note.duration + 0.02)
    }

    setTimeout(() => ctx.close(), 600)
  } catch {
    // Audio can be blocked by browser autoplay policy before any user
    // interaction — fail silently rather than crash the notification flow.
  }
}
