/**
 * `[data-speed]` parallax (prototype `parallaxFrame`): an element is shifted by how far its parent's
 * centre is from the viewport centre, times the speed, while within 200 px of the viewport.
 */
export function createParallax(root: HTMLElement) {
  const els = [...root.querySelectorAll<HTMLElement>("[data-speed]")];
  return {
    count: els.length,
    /** `scale` is the motion policy's parallax amplitude (1 full, .5 calm). */
    frame(vh: number, scale = 1) {
      for (const el of els) {
        const parent = el.parentElement;
        if (!parent) continue;
        const p = parent.getBoundingClientRect();
        if (p.bottom < -200 || p.top > vh + 200) continue;
        el.style.translate = `0 ${((p.top + p.height / 2 - vh / 2) * +(el.dataset.speed || 0) * scale).toFixed(1)}px`;
      }
    },
  };
}
