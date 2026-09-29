import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STATUS_COLORS } from "@/lib/format";

export default async function Dashboard() {
  const user = await getSession();
  const where = user?.organizationId && user.role !== "SUPER_ADMIN" ? { organizationId: user.organizationId } : {};
  const projectIds = (await prisma.project.findMany({ where, select: { id: true } })).map((p) => p.id);
  const uw = { projectId: { in: projectIds } };
  const since = new Date(Date.now() - 7 * 86400000);
  const [projects, units, byStatus, newLeads, totalLeads, visits, converted, recentLeads, recentAudit] = await Promise.all([
    prisma.project.count({ where: { ...where, status: { not: "ARCHIVED" } } }),
    prisma.unit.count({ where: uw }),
    prisma.unit.groupBy({ by: ["status"], where: uw, _count: true }),
    prisma.lead.count({ where: { ...uw, createdAt: { gte: since } } }),
    prisma.lead.count({ where: uw }),
    prisma.siteVisit.count({ where: { ...uw, status: { in: ["REQUESTED", "CONFIRMED", "RESCHEDULED"] } } }),
    prisma.lead.count({ where: { ...uw, status: "CONVERTED" } }),
    prisma.lead.findMany({ where: uw, orderBy: { createdAt: "desc" }, take: 8, include: { project: { select: { name: true } }, unit: { select: { number: true, type: true } } } }),
    prisma.auditLog.findMany({ where: { projectId: { in: projectIds } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  const count = (s: string) => byStatus.find((b) => b.status === s)?._count ?? 0;
  const tiles = [
    ["Projects", projects, "/admin/projects"], ["Total units", units, "/admin/projects"],
    ["Available", count("AVAILABLE"), "/admin/projects", STATUS_COLORS.AVAILABLE], ["Reserved", count("RESERVED"), "/admin/projects", STATUS_COLORS.RESERVED], ["Sold", count("SOLD"), "/admin/projects", STATUS_COLORS.SOLD],
    ["New leads (7d)", newLeads, "/admin/leads"], ["Total leads", totalLeads, "/admin/leads"], ["Upcoming site visits", visits, "/admin/site-visits"], ["Converted", converted, "/admin/leads?status=CONVERTED"],
  ] as const;
  return (
    <div>
      <h1 className="font-display text-3xl">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map(([label, v, href, color]) => (
          <Link key={label} href={href} className="card p-4"><p className="text-xs text-ink/50">{label}</p><p className="mt-1 font-display text-3xl" style={{ color }}>{v}</p></Link>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-4"><h2 className="font-semibold">Recent leads</h2>
          <table className="admin-table mt-2"><thead><tr><th>Name</th><th>Project</th><th>Unit</th><th>Status</th></tr></thead><tbody>
            {recentLeads.map((l) => <tr key={l.id}><td><Link href={`/admin/leads/${l.id}`} className="text-brand">{l.name}</Link><br /><span className="text-xs text-ink/50">{l.phone}</span></td><td>{l.project.name}</td><td>{l.unit ? `${l.unit.type === "PLOT" ? "Plot" : "Unit"} ${l.unit.number}` : "—"}</td><td><span className="badge bg-sand">{l.status}</span></td></tr>)}
          </tbody></table></div>
        <div className="card p-4"><h2 className="font-semibold">Recent activity</h2>
          <ul className="mt-2 space-y-2 text-sm">{recentAudit.map((a) => <li key={a.id} className="border-b border-ink/5 pb-2"><span className="font-semibold">{a.userName}</span> {a.action.toLowerCase().replace("_", " ")} {a.entity} <span className="text-brand">{a.entityLabel}</span>{a.before && a.after ? <span className="text-ink/50"> ({(a.before as { status?: string }).status} → {(a.after as { status?: string }).status})</span> : null}<br /><span className="text-xs text-ink/40">{a.createdAt.toLocaleString("en-IN")}</span></li>)}</ul></div>
      </div>
    </div>
  );
}
