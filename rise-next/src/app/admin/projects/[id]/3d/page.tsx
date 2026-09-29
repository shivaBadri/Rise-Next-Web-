import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProjectTabs from "@/components/admin/ProjectTabs";
import { createAssetAction, setAssetStatusAction, mapObjectAction, autoMapAction, deleteObjectAction } from "@/app/admin/actions";

export default async function ThreeDAdmin({ params, searchParams }: { params: { id: string }; searchParams: { asset?: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id }, include: { threeDAssets: { orderBy: { version: "desc" }, include: { _count: { select: { objects: true } } } }, units: { select: { id: true, number: true, type: true }, orderBy: { number: "asc" } }, amenities: { select: { id: true, name: true, objectKey: true } } } });
  if (!p) notFound();
  const current = p.threeDAssets.find((a) => a.id === searchParams.asset) ?? p.threeDAssets[0];
  const objects = current ? await prisma.threeDObject.findMany({ where: { assetId: current.id }, include: { unit: { select: { number: true, type: true, status: true } }, amenity: { select: { name: true } } }, orderBy: { objectKey: "asc" } }) : [];
  const unmapped = objects.filter((o) => o.kind === "UNIT" && !o.unitId).length;
  const mappedUnitIds = new Set(objects.map((o) => o.unitId).filter(Boolean));
  const unitsWithoutObject = p.units.filter((u) => !mappedUnitIds.has(u.id));

  return (
    <div><ProjectTabs id={p.id} name={p.name} slug={p.slug} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div className="card p-4"><h2 className="font-semibold">Versions</h2>
            <ul className="mt-2 space-y-2 text-sm">{p.threeDAssets.map((a) => (
              <li key={a.id} className={`rounded-lg border p-3 ${a.id === current?.id ? "border-brand bg-brand-light/40" : "border-ink/10"}`}>
                <a href={`?asset=${a.id}`} className="font-semibold">v{a.version} · {a.name}</a>
                <p className="text-xs text-ink/60">{a.status} · {a._count.objects} objects · {a.fileUrl ? "GLB" : "procedural"}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {a.status !== "TESTING" && a.status !== "PUBLISHED" && <form action={setAssetStatusAction.bind(null, p.id, a.id, "TESTING")}><button className="badge bg-sand">→ Testing</button></form>}
                  {a.status !== "PUBLISHED" && <form action={setAssetStatusAction.bind(null, p.id, a.id, "PUBLISHED")}><button className="badge bg-brand text-white">Publish</button></form>}
                  {a.status === "PUBLISHED" && <span className="badge bg-green-100 text-green-800">Live</span>}
                  {a.status !== "ARCHIVED" && a.status !== "PUBLISHED" && <form action={setAssetStatusAction.bind(null, p.id, a.id, "ARCHIVED")}><button className="badge bg-sand">Archive</button></form>}
                </div>
              </li>))}</ul>
          </div>
          <form action={createAssetAction.bind(null, p.id)} className="card space-y-3 p-4"><h2 className="font-semibold">New version</h2>
            <div><label className="label">Name</label><input name="name" className="input" placeholder="Master layout v2" /></div>
            <div><label className="label">GLB file URL (CDN / Cloudinary raw)</label><input name="fileUrl" className="input" placeholder="https://cdn…/layout.glb (leave empty for procedural)" /></div>
            <div><label className="label">Clone object mapping from</label><select name="cloneFromId" className="input"><option value="">— none —</option>{p.threeDAssets.map((a) => <option key={a.id} value={a.id}>v{a.version} {a.name}</option>)}</select></div>
            <div><label className="label">Notes</label><textarea name="notes" rows={2} className="input" /></div>
            <button className="btn-primary w-full">Create draft</button>
            <p className="text-xs text-ink/50">Workflow: Upload → Create version → Preview (Testing) → Map objects → Test → Publish. Publishing archives the previous live version (rollback = re-publish it).</p>
          </form>
        </div>

        <div className="space-y-4 lg:col-span-2">
          {current && (<>
            <div className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">Object mapping · v{current.version}</h2>
                <div className="flex gap-2 text-xs">
                  <span className="badge bg-sand">{objects.length} objects</span>
                  <span className={`badge ${unmapped ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>{unmapped} unmapped</span>
                  <span className={`badge ${unitsWithoutObject.length ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-700"}`}>{unitsWithoutObject.length} units without 3D object</span>
                  <form action={autoMapAction.bind(null, p.id, current.id)}><button className="badge bg-ink text-white">Auto-map by name</button></form>
                  {current.status !== "DRAFT" && <a href={`/projects/${p.slug}/3d`} target="_blank" className="badge bg-brand text-white">Preview live ↗</a>}
                </div>
              </div>
              <form action={async (fd) => { "use server"; await mapObjectAction(p.id, current.id, fd); }} className="mt-4 grid gap-2 rounded-lg bg-sand p-3 sm:grid-cols-5">
                <input name="objectKey" required placeholder="objectKey e.g. plot_049" className="input mt-0 font-mono text-xs" />
                <select name="kind" className="input mt-0"><option>UNIT</option><option>AMENITY</option><option>BUILDING</option><option>ROAD</option><option>OTHER</option></select>
                <select name="unitId" className="input mt-0"><option value="">— unit —</option>{p.units.map((u) => <option key={u.id} value={u.id}>{u.type} {u.number}</option>)}</select>
                <select name="amenityId" className="input mt-0"><option value="">— amenity —</option>{p.amenities.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                <button className="btn-primary">Add / update</button>
                <input name="geomJson" placeholder='geomJson (procedural only): {"shape":"box","position":[x,y,z],"size":[w,h,d]}' className="input mt-0 font-mono text-xs sm:col-span-5" />
              </form>
              <div className="mt-4 max-h-[60vh] overflow-auto"><table className="admin-table"><thead><tr><th>Object key</th><th>Kind</th><th>Linked to</th><th>Status</th><th></th></tr></thead><tbody>
                {objects.map((o) => <tr key={o.id}><td className="font-mono text-xs">{o.objectKey}</td><td>{o.kind}</td><td>{o.unit ? `${o.unit.type} ${o.unit.number}` : o.amenity?.name ?? <span className="text-ink/40">—</span>}</td><td>{o.unit?.status ?? ""}</td><td><form action={deleteObjectAction.bind(null, p.id, o.id)}><button className="text-xs text-red-600">Remove</button></form></td></tr>)}
              </tbody></table></div>
            </div>
            {unitsWithoutObject.length > 0 && <div className="card p-4 text-sm"><p className="font-semibold">Units without a 3D object</p><p className="mt-1 font-mono text-xs text-ink/60">{unitsWithoutObject.map((u) => u.number).join(", ")}</p></div>}
          </>)}
          <div className="card p-4 text-sm"><h3 className="font-semibold">Naming standard for the GLB</h3><p className="mt-1 text-ink/70">Mesh names must be exactly: <code>plot_001</code>, <code>villa_001</code>, <code>tower_A</code>, <code>flat_A101</code>, <code>clubhouse</code>, <code>swimming_pool</code>, <code>gym</code>, <code>park_01</code>. Export as GLB with Draco/Meshopt compression and KTX2 textures; keep under ~15 MB for mobile. Auto-map matches <code>plot_/villa_/flat_/unit_</code> prefixes to unit numbers.</p></div>
        </div>
      </div>
    </div>
  );
}
