import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
export default async function ProjectsPage() {
  const user = await getSession();
  const where = user?.organizationId && user.role !== "SUPER_ADMIN" ? { organizationId: user.organizationId } : {};
  const projects = await prisma.project.findMany({ where, include: { organization: true, _count: { select: { units: true, leads: true } } }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">Projects</h1><Link href="/admin/projects/new" className="btn-primary">+ New project</Link></div>
      <div className="card mt-6 overflow-x-auto"><table className="admin-table"><thead><tr><th>Project</th><th>Client</th><th>Type</th><th>Status</th><th>Units</th><th>Leads</th><th>Public</th><th></th></tr></thead><tbody>
        {projects.map((p) => <tr key={p.id}><td><Link href={`/admin/projects/${p.id}`} className="font-semibold text-brand">{p.name}</Link><br /><span className="text-xs text-ink/50">/{p.slug}</span></td><td>{p.organization.name}</td><td>{p.type}</td><td>{p.status}</td><td>{p._count.units}</td><td>{p._count.leads}</td><td>{p.isPublished ? "✅" : "—"}</td><td><Link href={`/projects/${p.slug}`} target="_blank" className="text-brand">View site ↗</Link></td></tr>)}
      </tbody></table></div>
    </div>
  );
}
