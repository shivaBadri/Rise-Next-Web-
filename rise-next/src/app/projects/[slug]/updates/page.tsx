import { notFound } from "next/navigation";
import { getPublicProject } from "@/lib/queries";
export const metadata = { title: "Construction Updates" };
export default async function UpdatesPage({ params }: { params: { slug: string } }) {
  const p = await getPublicProject(params.slug); if (!p) notFound();
  return (
    <main className="container-x py-12">
      <p className="eyebrow">Progress</p><h1 className="section-title mt-3">Construction updates</h1>
      <ol className="mt-10 space-y-8 border-l-2 border-brand/30 pl-6">
        {(p.updates as { id: string; title: string; body: string | null; date: string; media: { id: string; url: string; kind: string }[] }[]).map((u) => (
          <li key={u.id} className="relative"><span className="absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 border-white bg-brand" />
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{new Date(u.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</p>
            <h2 className="mt-1 font-display text-2xl">{u.title}</h2>{u.body && <p className="mt-2 text-ink/70">{u.body}</p>}
            {u.media.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-3">{u.media.map((m) => <img key={m.id} src={m.url} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-lg object-cover" />)}</div>}
          </li>
        ))}
        {p.updates.length === 0 && <li className="text-ink/50">No updates published yet.</li>}
      </ol>
    </main>
  );
}
