import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DemoGate } from "@/components/demo-gate";
import { auth } from "@/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? null, email: session.user.email ?? null }
    : null;

  return (
    <DemoGate>
      <DashboardShell user={user}>{children}</DashboardShell>
    </DemoGate>
  );
}
