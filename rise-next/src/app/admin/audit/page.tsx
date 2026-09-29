import { prisma } from "@/lib/db";
export default async function AuditPage({ searchParams }: { searchParams: { entity?: string } }) {
  const logs = await prisma.auditLog.findMany({ where: searchParams.entity ? { entity: searchParams.entity } : {}, orderBy: { createdAt: "desc" }, take: 300, include: { project: { select: { name: true } } } });
  return (
    <div><h1 className="font-display text-3xl">Audit log</h1>
      <div className="mt-3 flex gap-1 text-xs">{["", "Unit", "Project", "ThreeDAsset", "ThreeDObject", "Lead", "SiteVisit", "User"].map((e) => <a key={e} href={e ? `?entity=${e}` : "?"} className="badge bg-white">{e || "All"}</a>)}</div>
      <div className="card mt-4 overflow-x-auto"><table className="admin-table"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Entity</th><th>Project</th><th>Before → After</th></tr></thead><tbody>
        {logs.map((a) => <tr key={a.id}><td className="whitespace-nowrap text-xs">{a.createdAt.toLocaleString("en-IN")}</td><td>{a.userName}</td><td><span className="badge bg-sand">{a.action}</span></td><td>{a.entity} <span className="text-brand">{a.entityLabel}</span></td><td>{a.project?.name ?? "—"}</td><td className="font-mono text-xs">{a.before ? JSON.stringify(a.before) : ""}{a.before || a.after ? " → " : ""}{a.after ? JSON.stringify(a.after) : ""}</td></tr>)}
      </tbody></table></div>
    </div>
  );
}
