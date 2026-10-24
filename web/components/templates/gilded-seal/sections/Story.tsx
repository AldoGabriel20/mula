"use client";

import { useGs } from "../context";
import { SANS, SERIF } from "../type";
import { Photo } from "../parts/Photo";
import { StackLayer } from "../parts/StackLayer";
import { Eyebrow, Heading } from "../parts/ui";

/** Our story (docs/15 §8.7): two photographs that unmask as they enter, and a sticky column of text and chapters. */
export function Story() {
  const { config, d } = useGs();
  if (!config.show.story) return null;
  const [p1, p2] = config.photos.story;
  return (
    <StackLayer z={20}>
      <section id="story" aria-label="Our story" style={{ position: "relative", borderRadius: "28px 28px 0 0", boxShadow: "0 -40px 60px -20px rgba(30,22,16,.28)", padding: "clamp(60px,10vh,140px) clamp(20px,6vw,96px) clamp(90px,14vh,170px)", background: "var(--k-surface)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(min(100%,360px),1fr))", gap: "clamp(56px,8vw,120px)", alignItems: "start" }}>
          <div style={{ position: "relative", paddingBottom: "clamp(70px,10vw,130px)" }}>
            <div data-reveal="mask" style={{ position: "relative", width: "84%", aspectRatio: "4/5", overflow: "hidden", borderRadius: 2, background: "linear-gradient(160deg,#E6D6CA,#CDB6A8)" }}>
              <div data-reveal-inner="" style={{ position: "absolute", inset: 0 }}>
                <Photo photo={p1} />
              </div>
            </div>
            <div data-speed="-0.09" style={{ position: "absolute", right: 0, bottom: 0, width: "46%", aspectRatio: "3/4", padding: "clamp(6px,.8vw,10px)", background: "var(--k-surface)", boxShadow: "0 30px 60px -28px rgba(60,40,25,.45)" }}>
              <div data-reveal="mask" data-delay="300" style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "linear-gradient(160deg,#E2D7C4,#C8BBA2)" }}>
                <div data-reveal-inner="" style={{ position: "absolute", inset: 0 }}>
                  <Photo photo={p2} />
                </div>
              </div>
            </div>
          </div>
          <div style={{ position: "sticky", top: "12vh", display: "flex", flexDirection: "column", gap: 28 }}>
            <Eyebrow color="var(--k-x-eyebrow-soft)">Our Story</Eyebrow>
            <Heading k="story" override={config.titles.story} color="#2B221C" />
            <p data-reveal="up" data-delay="120" style={{ margin: 0, maxWidth: "42ch", fontSize: 16, lineHeight: 1.8, color: "#54473D", textWrap: "pretty", whiteSpace: "pre-line" }}>
              {config.story}
            </p>
            {d.chapters.length > 0 && (
              <ol style={{ listStyle: "none", margin: "12px 0 0", padding: 0, display: "flex", flexDirection: "column" }}>
                {d.chapters.map((ch) => (
                  <li key={ch.n} data-reveal="up" data-delay={ch.delay} style={{ display: "grid", gridTemplateColumns: "56px 1fr", gap: 16, padding: "22px 0", borderTop: "1px solid rgba(199,166,106,.4)" }}>
                    <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, lineHeight: 1.1, color: "#A88748" }}>{ch.n}</span>
                    <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontFamily: SERIF, fontSize: 26, lineHeight: 1.15, color: "#2B221C" }}>{ch.title}</span>
                      <span style={{ font: `400 14px/1.6 ${SANS}`, color: "var(--k-muted)" }}>{ch.text}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>
    </StackLayer>
  );
}
