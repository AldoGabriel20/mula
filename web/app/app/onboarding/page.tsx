import { PageHost } from "@/components/admin/PageHost";

// First-run: the prototype's onboarding overlay opens over the overview.
export default function Page() {
  return <PageHost page="home" openOnboarding />;
}
