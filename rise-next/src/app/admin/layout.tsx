import Link from "next/link";
import { getSession } from "@/lib/auth";
import { logoutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  if (!user) return <>{children}</>; // login page
  const nav = [["Dashboard", "/admin"], ["Projects", "/admin/projects"], ["Leads", "/admin/leads"], ["Site Visits", "/admin/site-visits"], ["Audit Log", "/admin/audit"], ["Users", "/admin/users"]];
  return (
    <div className="flex min-h-screen bg-sand">
      <aside className="hidden w-60 flex-col border-r border-ink/10 bg-white p-4 md:flex">
        <Link href="/admin" className="font-display text-xl">Rise Next</Link>
        <p className="text-xs text-ink/50">Admin console</p>
        <nav className="mt-6 flex flex-col gap-1">{nav.map(([l, h]) => <Link key={h} href={h} className="rounded-lg px-3 py-2 text-sm hover:bg-sand">{l}</Link>)}</nav>
        <div className="mt-auto border-t border-ink/10 pt-4 text-xs">
          <p className="font-semibold">{user.name}</p><p className="text-ink/50">{user.role.replace(/_/g, " ").toLowerCase()}</p>
          <form action={logoutAction}><button className="mt-2 text-brand">Sign out</button></form>
        </div>
      </aside>
      <div className="flex-1">
        <div className="flex items-center gap-3 overflow-x-auto border-b border-ink/10 bg-white px-4 py-2 md:hidden">
          {nav.map(([l, h]) => <Link key={h} href={h} className="whitespace-nowrap text-sm">{l}</Link>)}
          <form action={logoutAction} className="ml-auto"><button className="text-sm text-brand">Sign out</button></form>
        </div>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}
