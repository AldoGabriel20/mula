import { AuthCard } from "@/components/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <AuthCard>{children}</AuthCard>;
}
