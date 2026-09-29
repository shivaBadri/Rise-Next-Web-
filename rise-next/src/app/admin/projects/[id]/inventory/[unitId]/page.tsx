import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { serialize } from "@/lib/queries";
import ProjectTabs from "@/components/admin/ProjectTabs";
import UnitForm from "@/components/admin/UnitForm";
export default async function UnitEdit({ params }: { params: { id: string; unitId: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id }, include: { buildings: true } }); if (!p) notFound();
  const unit = params.unitId === "new" ? null : await prisma.unit.findUnique({ where: { id: params.unitId } });
  const history = unit ? await prisma.auditLog.findMany({ where: { entity: "Unit", entityId: unit.id }, orderBy: { createdAt: "desc" }, take: 20 }) : [];
  return (
    <div><ProjectTabs id={p.id} name={p.name} slug={p.slug} />
      <h2 className="mb-4 font-semibold">{unit ? `Edit ${unit.type} ${unit.number}` : "New unit"}</h2>
      <UnitForm projectId={p.id} unit={unit ? serialize(unit) : undefined} buildings={p.buildings} />
      {history.length > 0 && <div className="card mt-6 p-5"><h3 className="font-semibold">Change history</h3><ul className="mt-2 space-y-1 text-sm">{history.map((h) => <li key={h.id}><span className="text-ink/50">{h.createdAt.toLocaleString("en-IN")}</span> · <b>{h.userName}</b> {h.action.toLowerCase().replace("_", " ")} {h.before && h.after ? `${(h.before as { status?: string }).status ?? ""} → ${(h.after as { status?: string }).status ?? ""}` : ""}</li>)}</ul></div>}
    </div>
  );
}
