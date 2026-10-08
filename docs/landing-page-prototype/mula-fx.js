/* Mula — shared motion layer: film grain, cursor, page transitions, reveals, magnetic buttons, tilt, section colour grading. */
(function () {
  if (window.__mulaFx) return;
  window.__mulaFx = true;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(pointer: fine)').matches && !('ontouchstart' in window && navigator.maxTouchPoints > 0 && !matchMedia('(hover: hover)').matches);
  const EASE = 'cubic-bezier(.2,.75,.15,1)';

  const css = document.createElement('style');
  css.textContent = `
@keyframes mulaGrain{0%,100%{transform:translate(0,0)}20%{transform:translate(-3%,2%)}40%{transform:translate(2%,-3%)}60%{transform:translate(-2%,-1%)}80%{transform:translate(3%,3%)}}
.mula-fx-grain{position:fixed;inset:-60%;width:220%;height:220%;pointer-events:none;z-index:95;opacity:.075;mix-blend-mode:overlay;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .5  0 0 0 0 .5  0 0 0 0 .5  0 0 0 1.6 -.3'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");animation:mulaGrain .9s steps(4) infinite}
.mula-fx-cursor *{cursor:none!important}.mula-fx-cursor input,.mula-fx-cursor textarea,.mula-fx-cursor select{cursor:text!important}
:focus-visible{outline:2px solid #C9A56E!important;outline-offset:3px!important}
@media (prefers-reduced-motion: reduce){.mula-fx-grain{animation:none}}`;
  document.head.appendChild(css);

  const RES_KEYS = { 'assets/mula-lockup-light.png': 'logoLight', 'assets/mula-lockup-dark.png': 'logoDark', 'assets/mula-symbol-dark.png': 'symbolDark', 'assets/mula-symbol-light.png': 'symbolLight' };
  const asset = (p) => (window.__resources && window.__resources[RES_KEYS[p]]) || p;
  const fixImgs = () => { if (!window.__resources) return; document.querySelectorAll('img[src^="assets/"]').forEach((im) => { const u = asset(im.getAttribute('src')); if (u !== im.getAttribute('src')) im.src = u; }); };
  const onReady = (fn) => (document.body ? fn() : document.addEventListener('DOMContentLoaded', fn));

  onReady(() => {
    /* grain */
    const grain = document.createElement('div');
    grain.className = 'mula-fx-grain'; grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);

    /* page transition overlay */
    const ov = document.createElement('div');
    ov.setAttribute('aria-hidden', 'true');
    ov.style.cssText = `position:fixed;inset:0;z-index:120;background:#0E0C0B;color:#F4EEE4;display:flex;align-items:center;justify-content:center;pointer-events:none;clip-path:inset(100% 0 0 0);transition:clip-path .62s ${EASE};font-family:'Manrope',sans-serif;`;
    ov.innerHTML = `<div style="opacity:0;transform:translateY(10px);transition:opacity .4s ease .1s,transform .6s ${EASE} .1s"><img src="${asset('assets/mula-lockup-light.png')}" alt="" style="display:block;width:150px;height:auto"></div>`;
    document.body.appendChild(ov);
    const mark = ov.firstChild;
    let arriving = false;
    try { arriving = sessionStorage.getItem('mula-nav') === '1'; sessionStorage.removeItem('mula-nav'); } catch (e) {}
    if (arriving && !reduce) {
      ov.style.transition = 'none'; ov.style.clipPath = 'inset(0 0 0 0)'; mark.style.opacity = '1'; mark.style.transform = 'none';
      requestAnimationFrame(() => requestAnimationFrame(() => {
        ov.style.transition = `clip-path .8s ${EASE} .25s`; mark.style.transition = 'opacity .3s ease';
        mark.style.opacity = '0'; ov.style.clipPath = 'inset(0 0 100% 0)';
      }));
    }
    window.addEventListener('pageshow', (e) => { if (e.persisted) { ov.style.transition = 'none'; ov.style.clipPath = 'inset(100% 0 0 0)'; } });
    /* favicon */
    if (!document.querySelector('link[rel="icon"]')) { const ic = document.createElement('link'); ic.rel = 'icon'; ic.type = 'image/png'; ic.href = asset('assets/mula-symbol-dark.png'); document.head.appendChild(ic); }

    /* toast + placeholder links (app links, social, legal) */
    const toast = document.createElement('div');
    toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = `position:fixed;left:50%;bottom:28px;z-index:150;transform:translate(-50%,20px);opacity:0;pointer-events:none;max-width:min(92vw,440px);padding:14px 20px;border-radius:14px;background:#15120F;color:#F4EEE4;border:1px solid rgba(244,238,228,.12);box-shadow:0 24px 50px -20px rgba(0,0,0,.6);font:400 13.5px/1.5 'Manrope',sans-serif;text-align:center;transition:opacity .35s ease,transform .5s ${EASE}`;
    document.body.appendChild(toast);
    let tt = 0;
    const say = (msg) => { toast.textContent = msg; toast.style.opacity = '1'; toast.style.transform = 'translate(-50%,0)'; clearTimeout(tt); tt = setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translate(-50%,20px)'; }, 3200); };
    const MSG = { create: 'Account creation and the editor open in the Mula app. The link is connected at launch.', login: 'Login opens in the Mula app. The link is connected at launch.', plan: 'Checkout opens in the Mula app. The link is connected at launch.', contact: 'Our contact channels are connected at launch.' };
    const APP_PATH = { create: '/register', login: '/login', plan: '/register' };
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const kind = a.getAttribute('data-app');
      if (kind && window.MULA_APP_URL && APP_PATH[kind]) { e.preventDefault(); location.href = window.MULA_APP_URL + APP_PATH[kind]; return; }
      if (!id || document.getElementById(id)) return;
      e.preventDefault();
      say(MSG[kind] || 'This link is connected at launch.');
    });
    /* deep links (#faq, #tip) once the page has rendered */
    if (location.hash.length > 1) {
      let n = 0; const id = decodeURIComponent(location.hash.slice(1));
      const seek = () => { const el = document.getElementById(id); if (el) { setTimeout(() => window.scrollTo({ top: el.getBoundingClientRect().top + scrollY - 90, behavior: 'auto' }), 120); } else if (++n < 30) setTimeout(seek, 150); };
      seek();
    }

    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || !/\.dc\.html/.test(href)) return;
      const url = new URL(href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search && url.hash) return;
      e.preventDefault();
      if (reduce) { location.href = url.href; return; }
      try { sessionStorage.setItem('mula-nav', '1'); } catch (er) {}
      ov.style.transition = `clip-path .62s ${EASE}`; ov.style.clipPath = 'inset(0 0 0 0)'; ov.style.pointerEvents = 'auto';
      mark.style.transition = `opacity .4s ease .2s, transform .6s ${EASE} .2s`; mark.style.opacity = '1'; mark.style.transform = 'none';
      setTimeout(() => { location.href = url.href; }, 640);
    });

    /* cursor */
    if (fine && !reduce) {
      document.documentElement.classList.add('mula-fx-cursor');
      const dot = document.createElement('div'), ring = document.createElement('div');
      dot.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
      dot.style.cssText = 'position:fixed;left:0;top:0;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;mix-blend-mode:difference;pointer-events:none;z-index:130;transition:opacity .3s,width .3s,height .3s,margin .3s';
      ring.style.cssText = `position:fixed;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;border-radius:50%;border:1px solid rgba(255,255,255,.7);mix-blend-mode:difference;pointer-events:none;z-index:129;display:flex;align-items:center;justify-content:center;font:500 11px/1 'Manrope',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:transparent;transition:width .45s ${EASE},height .45s ${EASE},margin .45s ${EASE},background .35s,border-color .35s,color .25s,opacity .3s`;
      document.body.append(ring, dot);
      let mx = -100, my = -100, rx = -100, ry = -100, state = '';
      addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate3d(${mx}px,${my}px,0)`; }, { passive: true });
      document.addEventListener('mouseleave', () => { dot.style.opacity = '0'; ring.style.opacity = '0'; });
      document.addEventListener('mouseenter', () => { dot.style.opacity = '1'; ring.style.opacity = '1'; });
      const set = (s, label) => {
        const key = s + (label || '');
        if (key === state) return; state = key;
        if (s === 'label') {
          Object.assign(ring.style, { width: '92px', height: '92px', margin: '-46px 0 0 -46px', background: '#E8D9BF', borderColor: '#E8D9BF', color: '#0E0C0B', mixBlendMode: 'normal' });
          ring.textContent = label; dot.style.opacity = '0';
        } else if (s === 'link') {
          Object.assign(ring.style, { width: '58px', height: '58px', margin: '-29px 0 0 -29px', background: 'transparent', borderColor: 'rgba(255,255,255,.9)', color: 'transparent', mixBlendMode: 'difference' });
          ring.textContent = ''; dot.style.opacity = '1';
        } else {
          Object.assign(ring.style, { width: '34px', height: '34px', margin: '-17px 0 0 -17px', background: 'transparent', borderColor: 'rgba(255,255,255,.7)', color: 'transparent', mixBlendMode: 'difference' });
          ring.textContent = ''; dot.style.opacity = '1';
        }
      };
      document.addEventListener('mouseover', (e) => {
        const t = e.target.closest ? e.target.closest('[data-cursor], a, button, [role="button"], label, input, select, textarea') : null;
        if (!t) return set('');
        const lab = t.getAttribute('data-cursor');
        if (lab) return set('label', lab);
        if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return set('');
        set('link');
      });
      const loop = () => { rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16; ring.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`; requestAnimationFrame(loop); };
      loop();
    }

    /* reveals */
    const pending = new Set();
    const prep = (el) => {
      if (el.__mulaRv) return; el.__mulaRv = true;
      if (reduce) return;
      const r = el.getBoundingClientRect();
      if (r.top < innerHeight * 0.9 && r.bottom > 0 && !el.hasAttribute('data-reveal-wait')) { reveal(el, 0); return; }
      const kind = el.getAttribute('data-reveal');
      el.style.transition = `opacity 1.1s ${EASE}, transform 1.3s ${EASE}, filter 1.1s ${EASE}, clip-path 1.4s ${EASE}`;
      el.style.opacity = '0';
      if (kind === 'mask') { el.style.clipPath = 'inset(0 0 100% 0)'; el.style.transform = 'translateY(30px)'; }
      else if (kind === 'scale') { el.style.transform = 'scale(.92)'; el.style.filter = 'blur(8px)'; }
      else if (kind === 'blur') { el.style.filter = 'blur(14px)'; el.style.transform = 'translateY(16px)'; }
      else { el.style.transform = 'translateY(36px)'; el.style.filter = 'blur(6px)'; }
      pending.add(el);
    };
    const reveal = (el, extra) => {
      const d = (parseInt(el.getAttribute('data-delay') || '0', 10) || 0) + extra;
      setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'none'; el.style.filter = 'none'; el.style.clipPath = 'inset(0 0 0 0)'; }, d);
    };
    const scan = () => document.querySelectorAll('[data-reveal]').forEach(prep);
    const check = () => {
      if (!pending.size) return;
      const lim = innerHeight * 0.9;
      pending.forEach((el) => {
        if (!el.isConnected) { pending.delete(el); return; }
        const r = el.getBoundingClientRect();
        if (r.top < lim && r.bottom > -50) { pending.delete(el); reveal(el, 0); }
      });
    };

    /* section colour grading */
    let root = null, secs = [], cur = '';
    const scanBg = () => {
      root = document.querySelector('[data-bg-root]');
      if (!root) return;
      secs = [...document.querySelectorAll('[data-bg]')];
      secs.forEach((s) => { if (!s.__mulaBg) { s.__mulaBg = true; s.style.backgroundColor = 'transparent'; } });
      if (!root.__mulaBg) { root.__mulaBg = true; root.style.transition = 'background-color 1.1s cubic-bezier(.4,0,.2,1)'; }
    };
    const grade = () => {
      if (!root || !secs.length) return;
      const mid = innerHeight * 0.55;
      for (const s of secs) {
        const r = s.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) {
          const c = s.getAttribute('data-bg');
          if (c !== cur) { cur = c; root.style.backgroundColor = c; }
          break;
        }
      }
    };

    /* magnetic + tilt */
    if (fine && !reduce) {
      document.addEventListener('mousemove', (e) => {
        const m = e.target.closest && e.target.closest('[data-magnetic]');
        document.querySelectorAll('[data-magnetic].mula-mag-on').forEach((el) => { if (el !== m) { el.classList.remove('mula-mag-on'); el.style.transform = ''; const ar = el.querySelector('[data-arrow]'); if (ar) ar.style.transform = ''; } });
        if (m) {
          const r = m.getBoundingClientRect();
          const x = (e.clientX - r.left - r.width / 2) * 0.22, y = (e.clientY - r.top - r.height / 2) * 0.3;
          m.classList.add('mula-mag-on');
          m.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1), background-color .35s, color .35s, box-shadow .35s';
          m.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(1.03)`;
          const ar = m.querySelector('[data-arrow]'); if (ar) { ar.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1)'; ar.style.transform = 'translateX(5px)'; }
        }
        const t = e.target.closest && e.target.closest('[data-tilt]');
        document.querySelectorAll('[data-tilt].mula-tilt-on').forEach((el) => { if (el !== t) { el.classList.remove('mula-tilt-on'); el.style.transform = ''; } });
        if (t) {
          const r = t.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
          const amt = parseFloat(t.getAttribute('data-tilt')) || 8;
          t.classList.add('mula-tilt-on');
          t.style.transition = 'transform .5s cubic-bezier(.2,.8,.2,1)';
          t.style.transform = `perspective(1100px) rotateY(${(px * amt).toFixed(2)}deg) rotateX(${(-py * amt).toFixed(2)}deg) translateZ(0)`;
        }
      }, { passive: true });
    }

    let raf = 0;
    const tick = () => { raf = 0; check(); grade(); };
    addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, { passive: true });
    addEventListener('resize', () => { if (!raf) raf = requestAnimationFrame(tick); });
    const pass = () => { fixImgs(); scan(); scanBg(); check(); grade(); };
    pass();
    setInterval(pass, 450);
  });
})();
