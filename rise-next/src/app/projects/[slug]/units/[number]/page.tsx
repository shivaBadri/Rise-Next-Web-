import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicProject, getPublicUnit } from "@/lib/queries";
import { formatINR, formatNumber, facingLabel, STATUS_COLORS, STATUS_LABELS, unitLabel, whatsappLink } from "@/lib/format";
import CtaButtons from "@/components/public/CtaButtons";

export async function generateMetadata({ params }: { params: { slug: string; number: string } }): Promise<Metadata> {
  const p = await getPublicProject(params.slug);
  if (!p) return {};
  const u = await getPublicUnit(p.id, decodeURIComponent(params.number));
  if (!u) return {};
  return { title: `${unitLabel(u)} – ${formatNumber(u.area)} ${u.areaUnit} ${facingLabel(u.facing)} facing`, description: `${unitLabel(u)} at ${p.name}: ${formatNumber(u.area)} ${u.areaUnit}, ${facingLabel(u.facing)} facing, ${formatINR(u.price)}. ${STATUS_LABELS[u.status]}.` };
}

export default async function UnitPage({ params }: { params: { slug: string; number: string } }) {
  const p = await getPublicProject(params.slug);
  if (!p) notFound();
  const u = await getPublicUnit(p.id, decodeURIComponent(params.number));
  if (!u) notFound();
  const label = unitLabel(u);
  const images = (u.media as { id: string; url: string; kind: string; title: string | null }[]).filter((m) => m.kind !== "DOCUMENT");
  const docs = (u.media as { id: string; url: string; kind: string; title: string | null }[]).filter((m) => m.kind === "DOCUMENT");
  return (
    <main className="container-x py-12">
      <Link href={`/projects/${p.slug}/plots`} className="text-sm text-brand">← All units</Link>
      <div className="mt-4 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <span className="badge text-white" style={{ background: STATUS_COLORS[u.status] }}>{STATUS_LABELS[u.status]}</span>
          <h1 className="section-title mt-3">{label}{u.building && <span className="text-ink/50"> · {u.building.name}</span>}</h1>
          <p className="mt-2 font-display text-3xl">{u.status === "SOLD" ? "Sold" : formatINR(u.price)}</p>
          {u.pricePerUnit && u.status !== "SOLD" && <p className="text-sm text-ink/50">₹{formatNumber(u.pricePerUnit)} per {u.areaUnit}</p>}
          <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[["Area", `${formatNumber(u.area)} ${u.areaUnit}`], ["Dimensions", u.dimensions], ["Facing", facingLabel(u.facing)], ["Floor", u.floor], ["Bedrooms", u.bedrooms], ["Bathrooms", u.bathrooms], ["Balconies", u.balconies], ["Parking", u.parking]]
              .filter(([, v]) => v != null && v !== "—").map(([k, v]) => <div key={String(k)} className="card p-4"><dt className="label">{k}</dt><dd className="mt-1 font-semibold">{String(v)}</dd></div>)}
          </dl>
          {u.description && <p className="mt-8 text-ink/75">{u.description}</p>}
          {u.features.length > 0 && <ul className="mt-4 flex flex-wrap gap-2">{u.features.map((f: string) => <li key={f} className="badge bg-sand">{f}</li>)}</ul>}
          {u.floorPlan && (
            <div className="mt-10">
              <h2 className="font-display text-2xl">Floor plan – {u.floorPlan.name}</h2>
              {u.floorPlan.imageUrl && <a href={u.floorPlan.imageUrl} target="_blank" rel="noopener"><img src={u.floorPlan.imageUrl} alt={u.floorPlan.name} className="mt-4 w-full rounded-xl border border-ink/10" /></a>}
              <p className="mt-2 text-sm text-ink/60">{u.floorPlan.bedrooms} BHK · {u.floorPlan.bathrooms} bath · {formatNumber(u.floorPlan.area)} {u.floorPlan.areaUnit}{u.floorPlan.pdfUrl && <> · <a href={u.floorPlan.pdfUrl} className="text-brand" target="_blank" rel="noopener">Download PDF</a></>}</p>
            </div>
          )}
          {images.length > 0 && <div className="mt-10 grid gap-3 sm:grid-cols-2">{images.map((m) => <img key={m.id} src={m.url} alt={m.title ?? ""} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />)}</div>}
          {docs.length > 0 && <ul className="mt-6 space-y-1 text-sm">{docs.map((d) => <li key={d.id}><a href={d.url} className="text-brand" target="_blank" rel="noopener">📄 {d.title ?? "Document"}</a></li>)}</ul>}
        </div>
        <aside className="card h-fit p-6 lg:col-span-2">
          <h2 className="font-display text-xl">Interested in {label}?</h2>
          <div className="mt-4"><CtaButtons projectId={p.id} projectName={p.name} slug={p.slug} brochureUrl={p.brochureUrl} variant="inline" unitId={u.id} unitLabel={label} /></div>
          <a href={whatsappLink(p.whatsappNumber, `Hi, I am interested in ${label} at ${p.name}.`)} target="_blank" rel="noopener" className="btn-whatsapp mt-3 w-full">WhatsApp Enquiry</a>
          <Link href={`/projects/${p.slug}/3d?unit=${encodeURIComponent(u.number)}`} className="btn-outline mt-3 w-full">View in 3D layout</Link>
        </aside>
      </div>
    </main>
  );
}
