"use client";

import { LandingShell } from "./LandingShell";
import { Hero } from "./sections/Hero";
import { Intro } from "./sections/Intro";
import { Showcase } from "./sections/Showcase";
import { Gallery } from "./sections/Gallery";
import { Editor } from "./sections/Editor";
import { Personalization } from "./sections/Personalization";
import { Rsvp } from "./sections/Rsvp";
import { WhatsApp } from "./sections/WhatsApp";
import { Categories } from "./sections/Categories";
import { How } from "./sections/How";
import { Stories } from "./sections/Stories";
import { Tips } from "./sections/Tips";
import { Pricing } from "./sections/Pricing";
import { FinalCta } from "./sections/FinalCta";

// Landing page (/) — a faithful port of docs/landing-page-prototype/Home.dc.html. It brings its own
// nav and footer (the marketing shell steps aside on "/") and its own dark/light colour grading.
export function LandingHome() {
  return (
    <LandingShell smooth>
      <Hero />
      <Intro />
      <Showcase />
      <Gallery />
      <Editor />
      <Personalization />
      <Rsvp />
      <WhatsApp />
      <Categories />
      <How />
      <Stories />
      <Tips />
      <Pricing />
      <FinalCta />
    </LandingShell>
  );
}
