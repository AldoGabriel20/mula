// Prototype page id → URL. Ids are the prototype's (`data-p`), URLs follow docs/02 plus the pages the
// prototype adds (invitations, print, team, cart, guide, terms, system).
export const PAGE_PATH: Record<string, string> = {
  home: "/app/overview",
  guests: "/app/guests",
  events: "/app/schedule",
  todo: "/app/tasks",
  invitations: "/app/invitations",
  invitation: "/app/invitations/edit",
  design: "/app/design",
  gift: "/app/gift",
  print: "/app/print",
  eventday: "/app/eventday",
  checkin: "/app/checkin",
  live: "/app/live",
  memories: "/app/memories",
  team: "/app/team",
  packages: "/app/packages",
  addons: "/app/addons",
  cart: "/app/cart",
  billing: "/app/billing",
  guide: "/app/guide",
  account: "/app/settings",
  terms: "/app/terms",
  system: "/app/system",
};

export function pageFromPath(pathname: string): string {
  let best = "home", len = -1;
  for (const [id, p] of Object.entries(PAGE_PATH)) {
    if ((pathname === p || pathname.startsWith(p + "/")) && p.length > len) { best = id; len = p.length; }
  }
  return best;
}
