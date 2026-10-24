export type Countdown = { running: boolean; ended: boolean; endedText: string; d: number; h: string; m: string; s: string };

/** Time left until an instant (ISO). A missing or invalid date reads as "ended" with its own message. */
export function countdown(weddingIso: string, now: number): Countdown {
  const target = Date.parse(weddingIso);
  const valid = !isNaN(target);
  const diff = target - now;
  const ms = Math.max(0, diff || 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    running: valid && diff > 0,
    ended: !valid || diff <= 0,
    endedText: valid ? "The celebration has begun. Thank you for being part of our story." : "The date will be announced soon.",
    d: Math.floor(ms / 864e5),
    h: pad(Math.floor(ms / 36e5) % 24),
    m: pad(Math.floor(ms / 6e4) % 60),
    s: pad(Math.floor(ms / 1e3) % 60),
  };
}
