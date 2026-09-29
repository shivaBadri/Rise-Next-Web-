"use client";
import { useState } from "react";
import { saveProjectAction } from "@/app/admin/actions";

type P = Record<string, unknown> & { id?: string; highlights?: string[] };
const F = ({ n, l, v, type = "text", ...rest }: { n: string; l: string; v?: unknown; type?: string; [k: string]: unknown }) => (
  <div><label className="label">{l}</label><input name={n} type={type} defaultValue={v == null ? "" : String(v)} className="input" {...rest} /></div>
);
const S = ({ n, l, v, opts }: { n: string; l: string; v?: unknown; opts: string[] }) => (
  <div><label className="label">{l}</label><select name={n} defaultValue={v == null ? opts[0] : String(v)} className="input">{opts.map((o) => <option key={o}>{o}</option>)}</select></div>
);

export default function ProjectForm({ project }: { project?: P }) {
  const [error, setError] = useState<string | null>(null);
  const p = project ?? {};
  return (
    <form action={async (fd) => { const r = await saveProjectAction(project?.id ?? null, fd); if (r?.error) setError(r.error); }} className="space-y-8">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <section className="card p-5"><h2 className="font-semibold">Basics</h2><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <F n="name" l="Project name" v={p.name} required /><F n="slug" l="URL slug" v={p.slug} required pattern="[a-z0-9-]+" placeholder="arising-future-city" />
        <F n="tagline" l="Tagline" v={p.tagline} /><F n="developerName" l="Developer" v={p.developerName} />
        <S n="type" l="Type" v={p.type} opts={["PLOTTED", "VILLA", "APARTMENT", "MIXED", "COMMERCIAL", "TOWNSHIP"]} /><S n="status" l="Status" v={p.status} opts={["UPCOMING", "PRE_LAUNCH", "LAUNCHED", "UNDER_CONSTRUCTION", "READY_TO_MOVE", "COMPLETED", "ARCHIVED"]} />
        <div className="sm:col-span-2"><label className="label">Description</label><textarea name="description" rows={5} defaultValue={String(p.description ?? "")} className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Highlights (one per line)</label><textarea name="highlights" rows={4} defaultValue={(p.highlights ?? []).join("\n")} className="input" /></div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="isPublished" defaultChecked={!!p.isPublished} value="true" /> Published on public site</label>
        <F n="brandColor" l="Brand colour" v={p.brandColor ?? "#0f766e"} type="color" />
      </div></section>
      <section className="card p-5"><h2 className="font-semibold">Facts & pricing</h2><div className="mt-3 grid gap-4 sm:grid-cols-3">
        <F n="reraNumber" l="RERA number" v={p.reraNumber} /><F n="totalAreaText" l="Total area (text)" v={p.totalAreaText} placeholder="52 Acres" /><F n="totalUnits" l="Total units" v={p.totalUnits} type="number" />
        <F n="configuration" l="Configuration" v={p.configuration} placeholder="150–300 Sq. Yd plots" /><F n="possessionText" l="Possession" v={p.possessionText} /><F n="startingPrice" l="Starting price (₹)" v={p.startingPrice} type="number" />
        <F n="priceUnitLabel" l="Price basis label" v={p.priceUnitLabel ?? "Sq. Yd"} /><F n="brochureUrl" l="Brochure URL" v={p.brochureUrl} />
      </div></section>
      <section className="card p-5"><h2 className="font-semibold">Branding & media</h2><div className="mt-3 grid gap-4 sm:grid-cols-3">
        <F n="logoUrl" l="Logo URL" v={p.logoUrl} /><F n="coverImageUrl" l="Cover image URL" v={p.coverImageUrl} /><F n="coverVideoUrl" l="Cover video URL (mp4)" v={p.coverVideoUrl} />
      </div><p className="mt-2 text-xs text-ink/50">Upload to Cloudinary and paste the delivery URL. See Media tab for gallery.</p></section>
      <section className="card p-5"><h2 className="font-semibold">Location</h2><div className="mt-3 grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-3"><F n="addressLine" l="Address" v={p.addressLine} /></div>
        <F n="city" l="City" v={p.city} /><F n="state" l="State" v={p.state} /><F n="pincode" l="Pincode" v={p.pincode} />
        <F n="latitude" l="Latitude" v={p.latitude} type="number" step="any" /><F n="longitude" l="Longitude" v={p.longitude} type="number" step="any" />
      </div></section>
      <section className="card p-5"><h2 className="font-semibold">Sales contact</h2><div className="mt-3 grid gap-4 sm:grid-cols-3">
        <F n="salesPhone" l="Sales phone (+91…)" v={p.salesPhone} /><F n="whatsappNumber" l="WhatsApp number (digits, with country code)" v={p.whatsappNumber} placeholder="919876543210" /><F n="salesEmail" l="Sales email" v={p.salesEmail} />
      </div></section>
      <section className="card p-5"><h2 className="font-semibold">SEO & marketing</h2><div className="mt-3 grid gap-4 sm:grid-cols-2">
        <F n="seoTitle" l="SEO title" v={p.seoTitle} /><F n="ogImageUrl" l="OG image URL" v={p.ogImageUrl} />
        <div className="sm:col-span-2"><label className="label">Meta description</label><textarea name="seoDescription" rows={2} defaultValue={String(p.seoDescription ?? "")} className="input" /></div>
        <F n="ga4Id" l="GA4 measurement ID" v={p.ga4Id} placeholder="G-XXXX" /><F n="gtmId" l="GTM container ID" v={p.gtmId} placeholder="GTM-XXXX" /><F n="metaPixelId" l="Meta Pixel ID" v={p.metaPixelId} /><F n="gadsConversionId" l="Google Ads conversion (AW-xxx/yyy)" v={p.gadsConversionId} />
      </div></section>
      <button className="btn-primary">Save project</button>
    </form>
  );
}
