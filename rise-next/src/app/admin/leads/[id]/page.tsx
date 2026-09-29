import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { whatsappLink } from "@/lib/format";
import { updateLeadAction } from "@/app/admin/actions";
const STATUSES = ["NEW", "CONTACTED", "INTERESTED", "SITE_VISIT", "NEGOTIATION", "CONVERTED", "LOST"];
export default async function LeadDetail({ params }: { params: { id: string } }) {
  const l = await prisma.lead.findUnique({ where: { id: params.id }, include: { project: true, unit: true, assignedTo: true, notes: { orderBy: { createdAt: "desc" } }, siteVisits: { orderBy: { preferredDate: "desc" } } } }); if (!l) notFound();
  const sales = await prisma.user.findMany({ where: { role: { in: ["SALES_MANAGER", "SALES_EXECUTIVE", "PROJECT_ADMIN", "ORG_ADMIN"] }, isActive: true }, select: { id: true, name: true } });
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="font-display text-3xl">{l.name}</h1>
        <p className="text-ink/60"><a href={`tel:${l.phone}`} className="text-brand">{l.phone}</a>{l.email && <> · <a href={`mailto:${l.email}`} className="text-brand">{l.email}</a></>} · <a className="text-[#25D366]" target="_blank" rel="noopener" href={whatsappLink(l.phone, `Hi ${l.name}, thanks for your interest in ${l.project.name}.`)}>WhatsApp</a></p>
        <dl className="card mt-4 grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-3">
          <div><dt className="label">Project</dt><dd>{l.project.name}</dd></div><div><dt className="label">Unit</dt><dd>{l.unit ? `${l.unit.type} ${l.unit.number}` : "—"}</dd></div><div><dt className="label">Source</dt><dd>{l.source}</dd></div>
          <div><dt className="label">UTM</dt><dd className="text-xs">{[l.utmSource, l.utmMedium, l.utmCampaign, l.utmContent].filter(Boolean).join(" / ") || "—"}</dd></div><div><dt className="label">Landing page</dt><dd className="truncate text-xs">{l.landingPage ?? "—"}</dd></div><div><dt className="label">Created</dt><dd>{l.createdAt.toLocaleString("en-IN")}</dd></div>
          {l.message && <div className="col-span-full"><dt className="label">Message</dt><dd>{l.message}</dd></div>}
        </dl>
        {l.siteVisits.length > 0 && <div className="card mt-4 p-4"><h2 className="font-semibold">Site visits</h2><ul className="mt-2 text-sm">{l.siteVisits.map((v) => <li key={v.id}>{v.preferredDate.toLocaleDateString("en-IN")} {v.preferredTime} · <span className="badge bg-sand">{v.status}</span></li>)}</ul></div>}
        <div className="card mt-4 p-4"><h2 className="font-semibold">Notes</h2><ul className="mt-2 space-y-2 text-sm">{l.notes.map((n) => <li key={n.id} className="border-b border-ink/5 pb-2"><p>{n.body}</p><p className="text-xs text-ink/40">{n.authorName} · {n.createdAt.toLocaleString("en-IN")}</p></li>)}{l.notes.length === 0 && <li className="text-ink/40">No notes yet.</li>}</ul></div>
      </div>
      <form action={updateLeadAction.bind(null, l.id)} className="card h-fit space-y-3 p-4">
        <h2 className="font-semibold">Update lead</h2>
        <div><label className="label">Status</label><select name="status" defaultValue={l.status} className="input">{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label className="label">Assigned to</label><select name="assignedToId" defaultValue={l.assignedToId ?? ""} className="input"><option value="">Unassigned</option>{sales.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div><label className="label">Add note</label><textarea name="note" rows={3} className="input" /></div>
        <button className="btn-primary w-full">Save</button>
      </form>
    </div>
  );
}
