import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
const STATUSES = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT", "NEGOTIATION", "CONVERTED", "LOST"];
export default async function LeadsPage({ searchParams }: { searchParams: { status?: string; project?: string; q?: string } }) {
  const user = await getSession();
  const where = {
    ...(user?.role === "SALES_EXECUTIVE" ? { assignedToId: user.id } : {}),
    ...(user?.organizationId && user.role !== "SUPER_ADMIN" ? { project: { organizationId: user.organizationId } } : {}),
    ...(searchParams.status ? { status: searchParams.status as never } : {}),
    ...(searchParams.project ? { projectId: searchParams.project } : {}),
    ...(searchParams.q ? { OR: [{ name: { contains: searchParams.q, mode: "insensitive" as const } }, { phone: { contains: searchParams.q } }] } : {}),
  };
  const [leads, projects, counts] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: 200, include: { project: { select: { name: true } }, unit: { select: { number: true, type: true } }, assignedTo: { select: { name: true } } } }),
    prisma.project.findMany({ select: { id: true, name: true } }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
  ]);
  return (
    <div><h1 className="font-display text-3xl">Leads</h1>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <Link href="/admin/leads" className={`badge ${!searchParams.status ? "bg-ink text-white" : "bg-white"}`}>All</Link>
        {STATUSES.map((s) => <Link key={s} href={`?status=${s}`} className={`badge ${searchParams.status === s ? "bg-ink text-white" : "bg-white"}`}>{s} {counts.find((c) => c.status === s)?._count ?? 0}</Link>)}
        <form className="ml-auto flex gap-2"><select name="project" defaultValue={searchParams.project} className="input mt-0"><option value="">All projects</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input name="q" placeholder="Name / phone" defaultValue={searchParams.q} className="input mt-0 w-36" /><button className="btn-outline">Filter</button></form>
        <a href={`/api/admin/leads/export${searchParams.project ? `?project=${searchParams.project}` : ""}`} className="btn-outline">Export CSV</a>
      </div>
      <div className="card mt-4 overflow-x-auto"><table className="admin-table"><thead><tr><th>Lead</th><th>Project</th><th>Unit</th><th>Source</th><th>Campaign</th><th>Assigned</th><th>Status</th><th>Date</th></tr></thead><tbody>
        {leads.map((l) => <tr key={l.id}><td><Link href={`/admin/leads/${l.id}`} className="font-semibold text-brand">{l.name}</Link><br /><span className="text-xs text-ink/50">{l.phone}{l.email ? ` · ${l.email}` : ""}</span></td><td>{l.project.name}</td><td>{l.unit ? `${l.unit.type} ${l.unit.number}` : "—"}</td><td>{l.source}</td><td className="text-xs">{l.utmSource ?? "—"}{l.utmCampaign ? ` / ${l.utmCampaign}` : ""}</td><td>{l.assignedTo?.name ?? <span className="text-ink/40">Unassigned</span>}</td><td><span className="badge bg-sand">{l.status}</span></td><td className="text-xs">{l.createdAt.toLocaleString("en-IN")}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}
