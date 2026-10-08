"use client";

import { useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  Chip,
  Modal,
  Toast,
  Dropdown,
  Tooltip,
  Skeleton,
  EmptyState,
  ErrorState,
  ThemeToggle,
  ArchMeter,
  Dot,
  Logo,
} from "@/components/ui";
import { Reveal, Magnetic, Tilt } from "@/lib/motion";
import styles from "./page.module.css";

export default function DevShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [chip, setChip] = useState("all");
  const [showToast, setShowToast] = useState(false);

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <h1 className={styles.h1}>UI primitives</h1>
        <ThemeToggle />
      </header>

      <div className={styles.grid}>
        <section className={styles.card}>
          <p className={styles.label}>Button</p>
          <div className={styles.row}>
            <Button variant="primary">Primary</Button>
            <Button>Default</Button>
            <Button variant="ghost">Ghost</Button>
          </div>
          <div className={styles.row}>
            <Button size="sm">Small</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
          </div>
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Fields</p>
          <Input label="Name" placeholder="Aldo" />
          <Input label="Email" error="Email is required" defaultValue="bad" />
          <Textarea label="Message" placeholder="Say something…" />
          <Select label="Role" defaultValue="cohost">
            <option value="cohost">Co-host</option>
            <option value="planner">Planner</option>
          </Select>
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Chip</p>
          <div className={styles.row}>
            {["all", "sent", "rsvp"].map((c) => (
              <Chip key={c} active={chip === c} onClick={() => setChip(c)}>
                {c}
              </Chip>
            ))}
            <Chip>static</Chip>
          </div>
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Overlay / menu / hint</p>
          <div className={styles.row}>
            <Button onClick={() => setModalOpen(true)}>Open modal</Button>
            <Button onClick={() => setShowToast((s) => !s)}>Toggle toast</Button>
            <Dropdown
              label="Sort"
              trigger={<Button size="sm">Menu ▾</Button>}
              items={[
                { label: "Newest", onSelect: () => {} },
                { label: "Oldest", onSelect: () => {} },
              ]}
            />
            <Tooltip label="Helpful hint">
              <Button size="sm">Hover me</Button>
            </Tooltip>
          </div>
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Toast kinds</p>
          <Toast inline kind="ok" message="Saved" />
          <Toast inline kind="warn" message="Heads up" />
          <Toast inline kind="error" message="Failed" />
          <Toast inline kind="info" message="FYI" />
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Skeleton</p>
          <Skeleton height={40} />
          <Skeleton lines={3} />
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Empty state</p>
          <EmptyState title="No guests yet" message="Add your first guest to get started." action={<Button size="sm">Add guest</Button>} />
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Error state</p>
          <ErrorState message="Couldn't load guests." onRetry={() => {}} />
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Brand</p>
          <Logo variant="lockup" />
          <Logo variant="symbol" />
          <div className={styles.row}>
            <ArchMeter value={66} />
            <ArchMeter value={100} segments={1} />
          </div>
          <div className={styles.row}>
            <Dot active /> <Dot />
          </div>
        </section>

        <section className={styles.card}>
          <p className={styles.label}>Motion (fine pointer)</p>
          <Reveal>
            <p>Reveal: fades + rises on scroll.</p>
          </Reveal>
          <div className={styles.row}>
            <Magnetic>
              <Button>Magnetic</Button>
            </Magnetic>
            <Tilt>
              <Button variant="ghost">Tilt me</Button>
            </Tilt>
          </div>
        </section>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal">
        <p>ESC or click the backdrop to close.</p>
        <div className={styles.row}>
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Done
          </Button>
        </div>
      </Modal>

      {/* kinds use fixed position; stack would overlap — show one at a time */}
      {showToast && <Toast kind="info" message="This is a live toast" />}
    </div>
  );
}
