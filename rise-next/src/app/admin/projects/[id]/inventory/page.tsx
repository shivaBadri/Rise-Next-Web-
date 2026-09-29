import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatINR, formatNumber, facingLabel } from "@/lib/format";
import ProjectTabs from "@/components/admin/ProjectTabs";
import StatusSelect from "@/components/admin/StatusSelect";
import { deleteUnitAction, bulkImportUnitsAction } from "@/app/admin/actions";

export default async function Inventory({ params, searchParams }: { params: { id: string }; searchParams: { status?: string; q?: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id } }); if (!p) notFound();
  const units = await prisma.unit.findMany({ where: { projectId: p.id, ...(searchParams.status ? { status: searchParams.status as never } : {}), ...(searchParams.q ? { number: { contains: searchParams.q, mode: "insensitive" } } : {}) }, include: { building: true, threeDObjects: { select: { objectKey: true } } }, orderBy: [{ buildingId: "asc" }, { floor: "asc" }, { number: "asc" }] });
  const counts = await prisma.unit.groupBy({ by: ["status"], where: { projectId: p.id }, _count: true });
  return (
    <div><ProjectTabs id={p.id} name={p.name} slug={p.slug} />
      <div className="flex flex-wrap items-center gap-3">
        <form className="flex gap-2"><input name="q" placeholder="Search number" defaultValue={searchParams.q} className="input mt-0 w-40" /><button className="btn-outline">Search</button></form>
        <div className="flex gap-1 text-xs"><Link href={`?`} className="badge bg-sand">All</Link>{counts.map((c) => <Link key={c.status} href={`?status=${c.status}`} className="badge bg-sand">{c.status} {c._count}</Link>)}</div>
        <Link href={`/admin/projects/${p.id}/inventory/new`} className="btn-primary ml-auto">+ Add unit</Link>
      </div>
      <div className="card mt-4 overflow-x-auto"><table className="admin-table"><thead><tr><th>Unit</th><th>Building/Floor</th><th>Area</th><th>Facing</th><th>Price</th><th>Status</th><th>3D object</th><th></th></tr></thead><tbody>
        {units.map((u) => <tr key={u.id}>
          <td className="font-semibold"><Link href={`/admin/projects/${p.id}/inventory/${u.id}`} className="text-brand">{u.type} {u.number}</Link>{u.isCorner && <span className="badge ml-1 bg-amber-100 text-amber-800">C</span>}</td>
          <td>{u.building?.name ?? "—"}{u.floor != null ? ` / F${u.floor}` : ""}</td><td>{formatNumber(u.area.toString())} {u.areaUnit}</td><td>{facingLabel(u.facing)}</td><td>{formatINR(u.price?.toString())}</td>
          <td><StatusSelect projectId={p.id} unitId={u.id} status={u.status} /></td>
          <td className="font-mono text-xs">{u.threeDObjects.map((o) => o.objectKey).join(", ") || <span className="text-red-500">unmapped</span>}</td>
          <td><form action={deleteUnitAction.bind(null, p.id, u.id)}><button className="text-xs text-red-600">Delete</button></form></td>
        </tr>)}
      </tbody></table></div>
      <details className="card mt-6 p-5"><summary className="cursor-pointer font-semibold">Bulk import (CSV)</summary>
        <p className="mt-2 text-xs text-ink/60">Header row required. Columns: type,number,area,areaUnit,dimensions,facing,price,pricePerUnit,status,isCorner,floor,bedrooms,bathrooms,description. Existing numbers are updated.</p>
        <form action={async (fd) => { "use server"; await bulkImportUnitsAction(p.id, fd); }} className="mt-3"><textarea name="csv" rows={6} className="input font-mono text-xs" placeholder={"type,number,area,areaUnit,facing,price,status\nPLOT,201,200,Sq. Yd,EAST,4300000,AVAILABLE"} /><button className="btn-primary mt-3">Import</button></form>
      </details>
    </div>
  );
}
