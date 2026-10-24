import type { Template } from "./data";
import { InviteScreen, type InviteData } from "./InviteScreen";

/**
 * A template on a phone. A design with a catalog manifest shows its real thumbnail (captured from the demo by
 * `npm run templates:thumbs`); one without keeps the prototype's phone mock. `d` overrides the mock's content
 * (the detail page personalises it with the guest name).
 */
export function TemplateShot({ t, d }: { t: Template; d?: Partial<InviteData> }) {
  if (!t.thumbMobile) return <InviteScreen d={d ?? t.d} />;
  return (
    <div style={{ containerType: "inline-size", width: "100%", aspectRatio: "9/19.5", boxSizing: "border-box", padding: "2.6%", background: "#0c0b0a", borderRadius: "15% / 7%", boxShadow: "0 50px 90px -40px rgba(0,0,0,.7), 0 18px 40px -20px rgba(0,0,0,.5)" }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static, pre-sized capture from /public */}
      <img src={t.thumbMobile} alt={`${t.name} preview`} loading="lazy" style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", borderRadius: "12.5cqw" }} />
    </div>
  );
}
