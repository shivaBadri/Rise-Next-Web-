import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProjectTabs from "@/components/admin/ProjectTabs";
import { saveAmenityAction, deleteAmenityAction, saveLandmarkAction, deleteLandmarkAction, saveUpdateAction, deleteUpdateAction } from "@/app/admin/actions";
export default async function ContentAdmin({ params }: { params: { id: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id }, include: { amenities: { orderBy: { order: "asc" } }, landmarks: { orderBy: { order: "asc" } }, updates: { orderBy: { date: "desc" } } } }); if (!p) notFound();
  return (
    <div><ProjectTabs id={p.id} name={p.name} slug={p.slug} />
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-4"><h2 className="font-semibold">Amenities</h2>
          <ul className="mt-2 space-y-1 text-sm">{p.amenities.map((a) => <li key={a.id} className="flex items-center justify-between border-b border-ink/5 py-1"><span>{a.icon} {a.name} <span className="font-mono text-xs text-ink/40">{a.objectKey}</span></span><form action={deleteAmenityAction.bind(null, p.id, a.id)}><button className="text-xs text-red-600">✕</button></form></li>)}</ul>
          <form action={saveAmenityAction.bind(null, p.id)} className="mt-3 grid gap-2"><input name="name" required placeholder="Name" className="input mt-0" /><input name="icon" placeholder="Icon / emoji" className="input mt-0" /><input name="objectKey" placeholder="3D object key (clubhouse)" className="input mt-0 font-mono text-xs" /><input name="imageUrl" placeholder="Image URL" className="input mt-0" /><textarea name="description" placeholder="Description" rows={2} className="input mt-0" /><button className="btn-primary">Add amenity</button></form>
        </section>
        <section className="card p-4"><h2 className="font-semibold">Nearby landmarks</h2>
          <ul className="mt-2 space-y-1 text-sm">{p.landmarks.map((l) => <li key={l.id} className="flex items-center justify-between border-b border-ink/5 py-1"><span><span className="badge mr-1 bg-sand">{l.category}</span>{l.name} <span className="text-ink/50">{l.distanceKm} km</span></span><form action={deleteLandmarkAction.bind(null, p.id, l.id)}><button className="text-xs text-red-600">✕</button></form></li>)}</ul>
          <form action={saveLandmarkAction.bind(null, p.id)} className="mt-3 grid gap-2"><select name="category" className="input mt-0">{["School", "Hospital", "Airport", "Railway", "Road", "IT Hub", "Shopping", "Other"].map((c) => <option key={c}>{c}</option>)}</select><input name="name" required placeholder="Name" className="input mt-0" /><div className="flex gap-2"><input name="distanceKm" type="number" step="0.1" placeholder="km" className="input mt-0" /><input name="minutes" type="number" placeholder="min" className="input mt-0" /></div><button className="btn-primary">Add landmark</button></form>
        </section>
        <section className="card p-4"><h2 className="font-semibold">Construction updates</h2>
          <ul className="mt-2 space-y-1 text-sm">{p.updates.map((u) => <li key={u.id} className="flex items-center justify-between border-b border-ink/5 py-1"><span>{u.date.toLocaleDateString("en-IN", { month: "short", year: "numeric" })} · {u.title}</span><form action={deleteUpdateAction.bind(null, p.id, u.id)}><button className="text-xs text-red-600">✕</button></form></li>)}</ul>
          <form action={saveUpdateAction.bind(null, p.id)} className="mt-3 grid gap-2"><input name="title" required placeholder="Title" className="input mt-0" /><input name="date" type="date" required className="input mt-0" /><textarea name="body" placeholder="Description" rows={3} className="input mt-0" /><button className="btn-primary">Publish update</button></form>
          <p className="mt-2 text-xs text-ink/50">Attach photos via Media tab (kind: CONSTRUCTION).</p>
        </section>
      </div>
    </div>
  );
}
