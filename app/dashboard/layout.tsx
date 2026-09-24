import { requireUser } from "@/lib/session";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  await requireUser();
  return <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>;
}
