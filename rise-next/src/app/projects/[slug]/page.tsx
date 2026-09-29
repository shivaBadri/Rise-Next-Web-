import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicProject, getPublicUnits, getPublishedAsset } from "@/lib/queries";
import { formatINR, STATUS_COLORS, STATUS_LABELS } from "@/lib/format";
import CtaButtons from "@/components/public/CtaButtons";
import Viewer3D from "@/components/viewer/Viewer3D";

export default async function ProjectHome({ params }: { params: { slug: string } }) {
  const p = await getPublicProject(params.slug);
  if (!p) notFound();
  const [units, asset] = await Promise.all([getPublicUnits(p.id), getPublishedAsset(p.id)]);
  const counts = units.reduce((a: Record<string, number>, u: { status: string }) => ((a[u.status] = (a[u.status] ?? 0) + 1), a), {});
  const statusLabel = p.status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase());

  return (
    <main>
      {/* Hero */}
      <section className="relative isolate min-h-[85vh] overflow-hidden bg-ink text-white">
        {p.coverVideoUrl ? (
          <video className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" src={p.coverVideoUrl} autoPlay muted loop playsInline />
        ) : p.coverImageUrl ? (
          <img src={p.coverImageUrl} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover opacity-60" />
        ) : null}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
        <div className="container-x flex min-h-[85vh] flex-col justify-end py-16">
          <p className="eyebrow text-white/80">{p.type.toLowerCase()} · {p.city}</p>
          <h1 className="mt-3 font-display text-5xl leading-none sm:text-7xl">{p.name}</h1>
          {p.tagline && <p className="mt-4 max-w-2xl text-lg text-white/85">{p.tagline}</p>}
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {p.startingPrice && <div><p className="text-white/60">Starting price</p><p className="font-display text-2xl">{formatINR(p.startingPrice)}</p></div>}
            {p.configuration && <div><p className="text-white/60">Configuration</p><p className="font-display text-2xl">{p.configuration}</p></div>}
            {p.totalAreaText && <div><p className="text-white/60">Project area</p><p className="font-display text-2xl">{p.totalAreaText}</p></div>}
            <div><p className="text-white/60">Availability</p><p className="font-display text-2xl">{counts.AVAILABLE ?? 0} of {units.length} available</p></div>
          </div>
          <div className="mt-8"><CtaButtons projectId={p.id} projectName={p.name} slug={p.slug} brochureUrl={p.brochureUrl} /></div>
        </div>
      </section>

      {/* Overview */}
      <section className="container-x grid gap-12 py-20 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <p className="eyebrow">Project overview</p>
          <h2 className="section-title mt-3">A complete, ready-to-build community</h2>
          <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink/75">{p.description}</p>
          {p.highlights.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {p.highlights.map((h: string) => <li key={h} className="flex items-start gap-2 text-sm"><span className="mt-0.5 text-brand">✔</span>{h}</li>)}
            </ul>
          )}
        </div>
        <dl className="card h-fit divide-y divide-ink/10 lg:col-span-2">
          {[
            ["Developer", p.developerName], ["Project type", p.type.toLowerCase()], ["Total area", p.totalAreaText],
            ["Total units", p.totalUnits ?? units.length], ["Configuration", p.configuration], ["Status", statusLabel],
            ["Possession", p.possessionText], ["RERA", p.reraNumber],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={String(k)} className="flex justify-between gap-4 p-4 text-sm"><dt className="text-ink/60">{k}</dt><dd className="text-right font-semibold capitalize">{String(v)}</dd></div>
          ))}
        </dl>
      </section>

      {/* 3D preview */}
      <section className="bg-sand py-20">
        <div className="container-x">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Interactive master layout</p>
              <h2 className="section-title mt-3">Pick your plot in 3D</h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs">
              {Object.keys(STATUS_COLORS).map((s) => <span key={s} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLORS[s] }} />{STATUS_LABELS[s]} ({counts[s] ?? 0})</span>)}
            </div>
          </div>
          <div className="mt-8">
            <Viewer3D project={p} asset={asset} units={units} amenities={p.amenities} brochureUrl={p.brochureUrl} />
          </div>
          <div className="mt-4 text-right"><Link href={`/projects/${p.slug}/3d`} className="btn-outline">Open full-screen 3D →</Link></div>
        </div>
      </section>

      {/* Amenities */}
      <section className="container-x py-20">
        <p className="eyebrow">Amenities</p>
        <h2 className="section-title mt-3">Everything within the gates</h2>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {p.amenities.map((a: { id: string; name: string; icon: string | null; description: string | null }) => (
            <div key={a.id} className="card p-5"><div className="text-3xl">{a.icon}</div><p className="mt-3 font-semibold">{a.name}</p><p className="mt-1 text-xs text-ink/60">{a.description}</p></div>
          ))}
        </div>
      </section>

      {/* Gallery strip */}
      {p.media.length > 0 && (
        <section className="bg-sand py-20">
          <div className="container-x">
            <p className="eyebrow">Gallery</p>
            <h2 className="section-title mt-3">See the project</h2>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {p.media.slice(0, 6).map((m: { id: string; url: string; title: string | null }) => (
                <img key={m.id} src={m.url} alt={m.title ?? ""} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
              ))}
            </div>
            <div className="mt-4"><Link href={`/projects/${p.slug}/gallery`} className="btn-outline">View full gallery</Link></div>
          </div>
        </section>
      )}

      {/* Location */}
      <section className="container-x grid gap-10 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Location</p>
          <h2 className="section-title mt-3">{p.addressLine}</h2>
          <p className="mt-2 text-ink/60">{p.city}, {p.state} {p.pincode}</p>
          <ul className="mt-6 space-y-2 text-sm">
            {p.landmarks.map((l: { id: string; name: string; category: string; distanceKm: number | null; minutes: number | null }) => (
              <li key={l.id} className="flex items-center justify-between border-b border-ink/5 py-2"><span><span className="badge mr-2 bg-sand">{l.category}</span>{l.name}</span><span className="text-ink/60">{l.distanceKm ? `${l.distanceKm} km` : ""}{l.minutes ? ` · ${l.minutes} min` : ""}</span></li>
            ))}
          </ul>
        </div>
        <MapEmbed lat={p.latitude} lng={p.longitude} name={p.name} embed={p.mapEmbedUrl} />
      </section>

      {/* CTA */}
      <section className="bg-brand text-white">
        <div className="container-x flex flex-col items-start gap-6 py-16 md:flex-row md:items-center md:justify-between">
          <div><h2 className="font-display text-3xl">Ready to visit {p.name}?</h2><p className="mt-2 text-white/80">Free pick-up and drop for site visits · Sales team available 9 AM – 7 PM</p></div>
          <CtaButtons projectId={p.id} projectName={p.name} slug={p.slug} brochureUrl={p.brochureUrl} variant="hero" />
        </div>
      </section>
    </main>
  );
}

export function MapEmbed({ lat, lng, name, embed }: { lat: number | null; lng: number | null; name: string; embed?: string | null }) {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const src = embed
    ? embed
    : lat && lng
      ? key
        ? `https://www.google.com/maps/embed/v1/place?key=${key}&q=${lat},${lng}&zoom=14`
        : `https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`
      : null;
  if (!src) return <div className="card flex aspect-[4/3] items-center justify-center text-ink/50">Map not configured</div>;
  return <iframe title={`${name} location`} src={src} className="aspect-[4/3] w-full rounded-2xl border border-ink/10" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />;
}
