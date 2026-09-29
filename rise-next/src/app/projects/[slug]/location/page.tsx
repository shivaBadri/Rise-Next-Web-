import { notFound } from "next/navigation";
import { getPublicProject } from "@/lib/queries";
import { MapEmbed } from "../page";
export const metadata = { title: "Location" };
export default async function LocationPage({ params }: { params: { slug: string } }) {
  const p = await getPublicProject(params.slug); if (!p) notFound();
  const cats = Array.from(new Set((p.landmarks as { category: string }[]).map((l) => l.category)));
  return (
    <main className="container-x py-12">
      <p className="eyebrow">Location</p><h1 className="section-title mt-3">{p.addressLine}</h1><p className="mt-2 text-ink/60">{p.city}, {p.state} {p.pincode}</p>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <MapEmbed lat={p.latitude} lng={p.longitude} name={p.name} embed={p.mapEmbedUrl} />
        <div>{cats.map((c) => (
          <div key={c} className="mb-6"><h2 className="font-semibold">{c}</h2>
            <ul className="mt-2 divide-y divide-ink/5 text-sm">{(p.landmarks as { id: string; category: string; name: string; distanceKm: number | null; minutes: number | null }[]).filter((l) => l.category === c).map((l) => <li key={l.id} className="flex justify-between py-2"><span>{l.name}</span><span className="text-ink/60">{l.distanceKm ? `${l.distanceKm} km` : ""}{l.minutes ? ` · ${l.minutes} min` : ""}</span></li>)}</ul></div>
        ))}
        {p.latitude && <a className="btn-outline" target="_blank" rel="noopener" href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`}>Get directions</a>}</div>
      </div>
    </main>
  );
}
