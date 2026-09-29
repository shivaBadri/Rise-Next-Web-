import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProjectTabs from "@/components/admin/ProjectTabs";
import CloudinaryUpload from "@/components/admin/CloudinaryUpload";
import { addMediaAction, deleteMediaAction } from "@/app/admin/actions";
export default async function MediaAdmin({ params }: { params: { id: string } }) {
  const p = await prisma.project.findUnique({ where: { id: params.id }, include: { media: { orderBy: [{ kind: "asc" }, { order: "asc" }], include: { unit: { select: { number: true } } } }, units: { select: { id: true, number: true }, orderBy: { number: "asc" } } } }); if (!p) notFound();
  return (
    <div><ProjectTabs id={p.id} name={p.name} slug={p.slug} />
      <form action={async (fd) => { "use server"; await addMediaAction(p.id, fd); }} className="card grid gap-3 p-4 sm:grid-cols-6">
        <div className="sm:col-span-3"><label className="label">URL</label><CloudinaryUpload name="url" /></div>
        <div><label className="label">Kind</label><select name="kind" className="input">{["IMAGE", "RENDER", "VIDEO", "DRONE_VIDEO", "CONSTRUCTION", "PANORAMA_360", "WALKTHROUGH", "DOCUMENT"].map((k) => <option key={k}>{k}</option>)}</select></div>
        <div><label className="label">Title</label><input name="title" className="input" /></div>
        <div><label className="label">Unit (optional)</label><select name="unitId" className="input"><option value="">Project</option>{p.units.map((u) => <option key={u.id} value={u.id}>{u.number}</option>)}</select></div>
        <div className="sm:col-span-6"><button className="btn-primary">Add media</button></div>
      </form>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {p.media.map((m) => <div key={m.id} className="card overflow-hidden">{m.kind.includes("VIDEO") || m.kind === "WALKTHROUGH" ? <div className="flex aspect-[4/3] items-center justify-center bg-ink text-white">▶ video</div> : <img src={m.url} alt="" className="aspect-[4/3] w-full object-cover" />}<div className="p-2 text-xs"><p className="font-semibold">{m.kind}</p><p className="truncate text-ink/60">{m.title ?? m.url}</p>{m.unit && <p>Unit {m.unit.number}</p>}<form action={deleteMediaAction.bind(null, p.id, m.id)}><button className="text-red-600">Delete</button></form></div></div>)}
      </div>
    </div>
  );
}
