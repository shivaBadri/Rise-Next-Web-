import { prisma } from "@/lib/db";
import { updateVisitAction } from "@/app/admin/actions";
const STATUSES = ["REQUESTED", "CONFIRMED", "RESCHEDULED", "COMPLETED", "CANCELLED", "NO_SHOW"];
export default async function SiteVisits() {
  const [visits, sales] = await Promise.all([
    prisma.siteVisit.findMany({ orderBy: { preferredDate: "asc" }, include: { project: { select: { name: true } }, unit: { select: { number: true } }, assignedTo: { select: { name: true } } } }),
    prisma.user.findMany({ where: { role: { in: ["SALES_MANAGER", "SALES_EXECUTIVE", "PROJECT_ADMIN"] }, isActive: true }, select: { id: true, name: true } }),
  ]);
  return (
    <div><h1 className="font-display text-3xl">Site visits</h1>
      <div className="card mt-4 overflow-x-auto"><table className="admin-table"><thead><tr><th>Customer</th><th>Project / Unit</th><th>Date & time</th><th>Status</th><th>Assigned</th><th>Notes</th><th></th></tr></thead><tbody>
        {visits.map((v) => (
          <tr key={v.id}><td className="font-semibold">{v.name}<br /><span className="text-xs font-normal text-ink/50">{v.phone}</span></td><td>{v.project.name}{v.unit ? ` · ${v.unit.number}` : ""}</td>
            <form action={updateVisitAction.bind(null, v.id)} id={`f-${v.id}`} />
            <td><input form={`f-${v.id}`} name="preferredDate" type="date" defaultValue={v.preferredDate.toISOString().slice(0, 10)} className="input mt-0 w-36" /><input form={`f-${v.id}`} name="preferredTime" defaultValue={v.preferredTime} className="input mt-1 w-28" /></td>
            <td><select form={`f-${v.id}`} name="status" defaultValue={v.status} className="input mt-0">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
            <td><select form={`f-${v.id}`} name="assignedToId" defaultValue={v.assignedToId ?? ""} className="input mt-0"><option value="">—</option>{sales.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></td>
            <td><input form={`f-${v.id}`} name="notes" defaultValue={v.notes ?? ""} className="input mt-0 w-40" /></td>
            <td><button form={`f-${v.id}`} className="btn-primary">Save</button></td></tr>
        ))}
      </tbody></table></div>
    </div>
  );
}
