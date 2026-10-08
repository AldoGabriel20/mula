import type { ReactNode } from "react";
import { paletteOf } from "@/components/marketing/paletteSwatch";
import type { Invite } from "@/lib/api/invite";
import { AddToCalendar } from "./AddToCalendar";
import { GiftInfo } from "./GiftInfo";
import { LiveInfo } from "./LiveInfo";
import styles from "./invite.module.css";

type Props = {
  invite: Invite;
  /** RSVP / wish UI is injected so this renderer stays pure and reusable (host preview passes none). */
  rsvp?: ReactNode;
  wish?: ReactNode;
};

const text = (v: unknown) => (typeof v === "string" ? v : "");

function whenWhere(invite: Invite) {
  const when = invite.event_date
    ? new Date(invite.event_date).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short", timeZone: "UTC" })
    : null;
  return { when, where: invite.venue };
}

// Pure renderer: server-safe (no hooks), all content rendered as TEXT — never HTML.
export function InvitationView({ invite, rsvp, wish }: Props) {
  const pal = paletteOf(invite.palette || "Ivory");
  const names = [invite.couple_a, invite.couple_b].filter(Boolean).join(" & ") || "You’re invited";
  const { when, where } = whenWhere(invite);
  const vars = { background: pal.bg, color: pal.fg, ["--pv-bg" as string]: pal.bg, ["--pv-fg" as string]: pal.fg } as React.CSSProperties;
  const deadline = invite.rsvp_deadline
    ? `Kindly reply by ${new Date(invite.rsvp_deadline).toLocaleDateString("en-GB", { dateStyle: "long", timeZone: "UTC" })}.`
    : "";
  const has = (t: string) => invite.sections.some((s) => s.type === t);

  return (
    <main className={styles.page} style={{ background: "var(--bg)" }}>
      <article className={styles.card} style={vars} aria-label="Invitation">
        {invite.sections.map((s, i) => {
          if (s.type === "hero") {
            return (
              <header key={i}>
                {invite.guest && <p className={styles.greet}>Dear {invite.guest.name},</p>}
                <div className={styles.eyebrow}>{text(s.content.title) || "You are invited"}</div>
                <h1 className={styles.names}>{names}</h1>
                {(when || where) && (
                  <div className={styles.meta} style={{ marginTop: 18 }}>
                    {when && <span>{when}</span>}
                    {where && <span>{where}</span>}
                  </div>
                )}
                <div className={styles.btnRow} style={{ marginTop: 18 }}>
                  <AddToCalendar title={names} startISO={invite.event_date} venue={invite.venue} />
                </div>
              </header>
            );
          }
          if (s.type === "rsvp") return rsvp ? <section key={i}>{deadline && <p className={styles.body}>{deadline}</p>}{rsvp}</section> : <GenericRsvpHint key={i} personal={!!invite.guest} />;
          if (s.type === "gift") return <GiftInfo key={i} gifts={invite.gifts} methods={invite.gift_methods ?? []} title={text(s.content.title) || undefined} />;
          // story / schedule / map / dresscode / anything else: title + body as text
          const title = text(s.content.title);
          const body = text(s.content.body);
          if (!title && !body) return null;
          return (
            <section key={i} className={styles.section}>
              {title && <h2 className={styles.h2}>{title}</h2>}
              {body && <p className={styles.body}>{body}</p>}
            </section>
          );
        })}

        <LiveInfo live={invite.live} />

        {wish && (has("rsvp") || has("hero")) && <section>{wish}</section>}

        <footer className={styles.foot}>Made with mula</footer>
      </article>
    </main>
  );
}

// On the generic link there is no guest identity to attach a reply to — say so kindly.
function GenericRsvpHint({ personal }: { personal: boolean }) {
  if (personal) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.h2}>Kindly reply</h2>
      <p className={styles.body}>Please use the personal link your hosts sent you to reply.</p>
    </section>
  );
}

export default InvitationView;
