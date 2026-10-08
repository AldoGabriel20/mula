"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMotion } from "@/lib/motion";

const EASE = "cubic-bezier(.2,.75,.15,1)";

// Cursor ring + dot (labels from [data-cursor]) and the route-transition curtain, ported from
// mula-fx.js. Reveals, magnetic, tilt and section grading live in lib/motion.
export function LandingFx() {
  const { reduce, fine } = useMotion();
  const router = useRouter();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const veil = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  // Curtain: lifts on arrival after an internal navigation, drops before leaving.
  useEffect(() => {
    const ov = veil.current, mk = mark.current;
    if (!ov || !mk || reduce) return;
    let arriving = false;
    try {
      // Stamped by the click handler below; ignore stale marks (e.g. a leave towards /login that never came back).
      arriving = Date.now() - Number(sessionStorage.getItem("mula-nav")) < 6000;
      sessionStorage.removeItem("mula-nav");
    } catch {}
    if (arriving) {
      ov.style.transition = "none";
      ov.style.clipPath = "inset(0 0 0 0)";
      mk.style.opacity = "1";
      mk.style.transform = "none";
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          ov.style.transition = `clip-path .8s ${EASE} .25s`;
          mk.style.transition = "opacity .3s ease";
          mk.style.opacity = "0";
          ov.style.clipPath = "inset(0 0 100% 0)";
        }),
      );
    }
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href") || "";
      if (!href.startsWith("/") || href.startsWith("//")) return;
      // Capture phase + stopPropagation: next/link's own onClick would otherwise navigate (and mark the
      // event handled) before this document-level listener ever saw it.
      e.preventDefault();
      e.stopPropagation();
      try {
        sessionStorage.setItem("mula-nav", String(Date.now()));
      } catch {}
      ov.style.transition = `clip-path .62s ${EASE}`;
      ov.style.clipPath = "inset(0 0 0 0)";
      ov.style.pointerEvents = "auto";
      mk.style.transition = `opacity .4s ease .2s, transform .6s ${EASE} .2s`;
      mk.style.opacity = "1";
      mk.style.transform = "none";
      setTimeout(() => router.push(href), 640);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [reduce, router]);

  // Cursor.
  useEffect(() => {
    const d = dot.current, r = ring.current;
    if (!d || !r || !fine || reduce) return;
    document.documentElement.classList.add("mula-landing-cursor");
    let mx = -100, my = -100, rx = -100, ry = -100, state = "", raf = 0;
    const set = (s: string, label?: string) => {
      const key = s + (label || "");
      if (key === state) return;
      state = key;
      if (s === "label") {
        Object.assign(r.style, { width: "92px", height: "92px", margin: "-46px 0 0 -46px", background: "#E8D9BF", borderColor: "#E8D9BF", color: "#0E0C0B", mixBlendMode: "normal" });
        r.textContent = label || "";
        d.style.opacity = "0";
      } else if (s === "link") {
        Object.assign(r.style, { width: "58px", height: "58px", margin: "-29px 0 0 -29px", background: "transparent", borderColor: "rgba(255,255,255,.9)", color: "transparent", mixBlendMode: "difference" });
        r.textContent = "";
        d.style.opacity = "1";
      } else {
        Object.assign(r.style, { width: "34px", height: "34px", margin: "-17px 0 0 -17px", background: "transparent", borderColor: "rgba(255,255,255,.7)", color: "transparent", mixBlendMode: "difference" });
        r.textContent = "";
        d.style.opacity = "1";
      }
    };
    const move = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      d.style.transform = `translate3d(${mx}px,${my}px,0)`;
    };
    const over = (e: MouseEvent) => {
      const t = (e.target as Element).closest?.('[data-cursor], a, button, [role="button"], label, input, select, textarea');
      if (!t) return set("");
      const lab = t.getAttribute("data-cursor");
      if (lab) return set("label", lab);
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName)) return set("");
      set("link");
    };
    const leave = () => { d.style.opacity = "0"; r.style.opacity = "0"; };
    const enter = () => { d.style.opacity = "1"; r.style.opacity = "1"; };
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      r.style.transform = `translate3d(${rx.toFixed(1)}px,${ry.toFixed(1)}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    addEventListener("mousemove", move, { passive: true });
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    loop();
    return () => {
      document.documentElement.classList.remove("mula-landing-cursor");
      removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduce]);

  return (
    <>
      <style>{`.mula-landing-cursor,.mula-landing-cursor *{cursor:none!important}.mula-landing-cursor input,.mula-landing-cursor textarea,.mula-landing-cursor select{cursor:text!important}`}</style>
      <div ref={veil} aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: 120, background: "#0E0C0B", color: "#F4EEE4", display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", clipPath: "inset(100% 0 0 0)", transition: `clip-path .62s ${EASE}` }}>
        <div ref={mark} style={{ opacity: 0, transform: "translateY(10px)", transition: `opacity .4s ease .1s,transform .6s ${EASE} .1s` }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/mula-lockup-light.png" alt="" style={{ display: "block", width: 150, height: "auto" }} />
        </div>
      </div>
      {fine && !reduce && (
        <>
          <div ref={ring} aria-hidden="true" style={{ position: "fixed", left: 0, top: 0, width: 34, height: 34, margin: "-17px 0 0 -17px", borderRadius: "50%", border: "1px solid rgba(255,255,255,.7)", mixBlendMode: "difference", pointerEvents: "none", zIndex: 129, display: "flex", alignItems: "center", justifyContent: "center", font: "500 11px/1 var(--l-manrope), sans-serif", letterSpacing: ".14em", textTransform: "uppercase", color: "transparent", transition: `width .45s ${EASE},height .45s ${EASE},margin .45s ${EASE},background .35s,border-color .35s,color .25s,opacity .3s` }} />
          <div ref={dot} aria-hidden="true" style={{ position: "fixed", left: 0, top: 0, width: 6, height: 6, margin: "-3px 0 0 -3px", borderRadius: "50%", background: "#fff", mixBlendMode: "difference", pointerEvents: "none", zIndex: 130, transition: "opacity .3s,width .3s,height .3s,margin .3s" }} />
        </>
      )}
    </>
  );
}
