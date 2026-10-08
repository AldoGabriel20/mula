"use client";

import { useEffect } from "react";
import { useAdmin } from "./AdminProvider";
import { HomeView } from "./views/Home";
import { GuestsView } from "./views/Guests";
import { ScheduleView } from "./views/Schedule";
import { TasksView } from "./views/Tasks";
import { InvitationsView } from "./views/Invitations";
import { InvitationEditorView } from "./views/InvitationEditor";
import { DesignView } from "./views/Design";
import { GiftView } from "./views/Gift";
import { EventDayView } from "./views/EventDay";
import { CheckinView } from "./views/Checkin";
import { LiveView } from "./views/Live";
import { MemoriesView } from "./views/Memories";
import { TeamView } from "./views/Team";
import { PackagesView } from "./views/Packages";
import { PrintView } from "./views/Print";
import { AddonsView } from "./views/Addons";
import { CartView } from "./views/Cart";
import { BillingView } from "./views/Billing";
import { GuideView } from "./views/Guide";
import { SettingsView } from "./views/Settings";
import { TermsView } from "./views/Terms";
import { SystemView } from "./views/System";

const VIEWS = {
  home: HomeView, guests: GuestsView, events: ScheduleView, todo: TasksView, invitations: InvitationsView, invitation: InvitationEditorView,
  design: DesignView, gift: GiftView, eventday: EventDayView, checkin: CheckinView, live: LiveView, memories: MemoriesView, team: TeamView,
  packages: PackagesView, print: PrintView, addons: AddonsView, cart: CartView, billing: BillingView, guide: GuideView, account: SettingsView,
  terms: TermsView, system: SystemView,
} as const;

export type PageId = keyof typeof VIEWS;

// One view per route; each view guards itself on v.p[page] (false while the prototype's skeleton shows).
export function PageHost({ page, openOnboarding = false }: { page: PageId; openOnboarding?: boolean }) {
  const { v, logic } = useAdmin();
  useEffect(() => {
    if (openOnboarding) logic.setState({ obOpen: true, ob: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openOnboarding]);
  const View = VIEWS[page];
  return <View v={v} />;
}
