import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProject, getPublicUnits } from "@/lib/queries";
import { formatINR, formatNumber, facingLabel, STATUS_COLORS, STATUS_LABELS, unitLabel } from "@/lib/format";

export const metadata = { title: "Plots & Units" };

export default async function PlotsPage({ params, searchParams }: { params: { slug: string }; searchParams: { status?: string; facing?: string; building?: string } }) {
  const p = await getPublicProject(params.slug);
  if (!p) notFound();
  let units = await getPublicUnits(p.id);
  if (searchParams.status) units = units.filter((u: { status: string }) => u.status === searchParams.status);
  if (searchParams.facing) units = units.filter((u: { facing: string | null }) => u.facing === searchParams.facing);
  if (searchParams.building) units = units.filter((u: { buildingId: string | null }) => u.buildingId === searchParams.building);
  const base = `/projects/${p.slug}/plots`;
  const towers = p.buildings as { id: string; name: string; floors: number }[];

  return (
    <main className="container-x py-12">
      <p className="eyebrow">Inventory</p>
      <h1 className="section-title mt-3">Plots & units</h1>
      <div className="mt-6 flex flex-wrap gap-2 text-xs">
        <Link href={base} className={`badge ${!searchParams.status ? "bg-ink text-white" : "bg-sand"}`}>All</Link>
        {Object.keys(STATUS_COLORS).map((s) => (
          <Link key={s} href={`${base}?status=${s}`} className={`badge gap-1.5 ${searchParams.status === s ? "bg-ink text-white" : "bg-sand"}`}><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS[s] }} />{STATUS_LABELS[s]}</Link>
        ))}
        <span className="mx-2 text-ink/30">|</span>
        {["EAST", "WEST", "NORTH", "SOUTH"].map((f) => (
          <Link key={f} href={`${base}?facing=${f}`} className={`badge ${searchParams.facing === f ? "bg-ink text-white" : "bg-sand"}`}>{facingLabel(f)} facing</Link>
        ))}
      </div>

      {towers.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {towers.map((t) => <Link key={t.id} href={`${base}?building=${t.id}`} className={`btn-outline ${searchParams.building === t.id ? "ring-2 ring-brand" : ""}`}>{t.name} · {t.floors} floors</Link>)}
        </div>
      )}

      <div className="mt-8 overflow-x-auto card">
        <table className="admin-table">
          <thead><tr><th>Unit</th><th>Area</th><th>Dimensions</th><th>Facing</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {units.map((u: { id: string; type: string; number: string; area: number; areaUnit: string; dimensions: string | null; facing: string | null; price: number | null; status: string; isCorner: boolean; floor: number | null }) => (
              <tr key={u.id}>
                <td className="font-semibold">{unitLabel(u)}{u.floor != null && <span className="ml-1 text-xs text-ink/50">· Floor {u.floor}</span>}{u.isCorner && <span className="badge ml-2 bg-amber-100 text-amber-800">Corner</span>}</td>
                <td>{formatNumber(u.area)} {u.areaUnit}</td>
                <td>{u.dimensions ?? "—"}</td>
                <td>{facingLabel(u.facing)}</td>
                <td>{u.status === "SOLD" ? "—" : formatINR(u.price)}</td>
                <td><span className="badge text-white" style={{ background: STATUS_COLORS[u.status] }}>{STATUS_LABELS[u.status]}</span></td>
                <td className="whitespace-nowrap"><Link href={`/projects/${p.slug}/units/${encodeURIComponent(u.number)}`} className="text-brand hover:underline">Details</Link> · <Link href={`/projects/${p.slug}/3d?unit=${encodeURIComponent(u.number)}`} className="text-brand hover:underline">View in 3D</Link></td>
              </tr>
            ))}
            {units.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-ink/50">No units match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  );
}
