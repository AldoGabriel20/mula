"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Magnetic, Reveal } from "@/lib/motion";
import { InvitationCanvas } from "./InvitationCanvas";
import styles from "./Hero.module.css";

export function Hero() {
  // onPhase from the 3D card syncs the copy: reveal the hint once it has opened.
  const [opened, setOpened] = useState(false);

  return (
    <section className={styles.hero}>
      <Reveal as="div" className={styles.copy}>
        <div className={styles.eyebrow}>
          <span />
          For every beginning
        </div>
        <h1 className={styles.title}>
          Every beginning deserves <em>a beautiful story.</em>
        </h1>
        <p className={styles.lede}>Digital invitations designed to make every celebration feel unforgettable.</p>
        <div className={styles.ctas}>
          <Magnetic>
            <Link href="/register">
              <Button variant="primary">Create your invitation →</Button>
            </Link>
          </Magnetic>
          <Link href="/templates">
            <Button variant="ghost">Explore designs</Button>
          </Link>
        </div>
        <p className={styles.hint} style={{ opacity: opened ? 1 : 0 }} aria-hidden={!opened}>
          Move your cursor — the invitation responds.
        </p>
      </Reveal>

      <InvitationCanvas mode="hero" onPhase={(name) => name === "ready" && setOpened(true)} />
    </section>
  );
}

export default Hero;
