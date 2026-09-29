import { notFound } from "next/navigation";
import { getPublicProject } from "@/lib/queries";
export const metadata = { title: "Amenities" };
export default async function AmenitiesPage({ params }: { params: { slug: string } }) {
  const p = await getPublicProject(params.slug); if (!p) notFound();
  return (
    <main className="container-x py-12">
      <p className="eyebrow">Amenities</p><h1 className="section-title mt-3">Life inside {p.name}</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {p.amenities.map((a: { id: string; name: string; icon: string | null; description: string | null; imageUrl: string | null }) => (
          <div key={a.id} className="card overflow-hidden">{a.imageUrl && <img src={a.imageUrl} alt={a.name} className="aspect-[16/10] w-full object-cover" loading="lazy" />}<div className="p-5"><div className="text-3xl">{a.icon}</div><h2 className="mt-2 font-semibold">{a.name}</h2><p className="mt-1 text-sm text-ink/60">{a.description}</p></div></div>
        ))}
      </div>
    </main>
  );
}
