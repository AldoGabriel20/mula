import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminProvider } from "@/components/admin/AdminProvider";
import { AdminShell } from "@/components/admin/AdminShell";
import { QueryProvider } from "@/components/admin/QueryProvider";

// Session gate: no session cookie → bounce to login. The API still enforces real
// auth on every request; this just avoids rendering the shell for signed-out users.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  if (!cookies().get("session")) {
    redirect("/login?next=/app");
  }
  return (
    <QueryProvider>
      <AdminProvider>
        <AdminShell>{children}</AdminShell>
      </AdminProvider>
    </QueryProvider>
  );
}
