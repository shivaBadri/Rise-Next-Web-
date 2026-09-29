import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProject } from "@/lib/queries";
import ProjectNav from "@/components/public/ProjectNav";
import Analytics from "@/components/public/Analytics";
import TrackView from "@/components/public/TrackView";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const p = await getPublicProject(params.slug);
  if (!p) return {};
  const title = p.seoTitle ?? `${p.name} – ${p.city}`;
  const description = p.seoDescription ?? p.tagline ?? p.description?.slice(0, 160);
  const url = `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/projects/${p.slug}`;
  return {
    title: { default: title, template: `%s | ${p.name}` },
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: p.ogImageUrl ?? p.coverImageUrl ? [{ url: p.ogImageUrl ?? p.coverImageUrl }] : [], type: "website" },
    twitter: { card: "summary_large_image", title, description },
    robots: { index: true, follow: true },
  };
}

export default async function ProjectLayout({ children, params }: { children: React.ReactNode; params: { slug: string } }) {
  const p = await getPublicProject(params.slug);
  if (!p) notFound();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: p.name,
    description: p.seoDescription ?? p.description,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/projects/${p.slug}`,
    image: p.coverImageUrl,
    address: { "@type": "PostalAddress", streetAddress: p.addressLine, addressLocality: p.city, addressRegion: p.state, postalCode: p.pincode, addressCountry: "IN" },
    geo: p.latitude ? { "@type": "GeoCoordinates", latitude: p.latitude, longitude: p.longitude } : undefined,
    offers: p.startingPrice ? { "@type": "Offer", priceCurrency: "INR", price: p.startingPrice, availability: "https://schema.org/InStock" } : undefined,
    seller: { "@type": "Organization", name: p.organization.name, telephone: p.salesPhone },
  };
  return (
    <div style={{ ["--brand" as string]: p.brandColor }} className="pb-16 lg:pb-0">
      <Analytics ga4={p.ga4Id} gtm={p.gtmId} pixel={p.metaPixelId} />
      <TrackView slug={p.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProjectNav project={p} />
      {children}
      <footer className="mt-20 border-t border-ink/10 bg-sand">
        <div className="container-x grid gap-8 py-12 md:grid-cols-3">
          <div>
            <p className="font-display text-xl">{p.name}</p>
            <p className="mt-2 text-sm text-ink/60">{p.addressLine}<br />{p.city}, {p.state} {p.pincode}</p>
            {p.reraNumber && <p className="mt-2 text-xs text-ink/50">RERA: {p.reraNumber}</p>}
          </div>
          <div className="text-sm text-ink/70">
            <p className="font-semibold text-ink">Sales</p>
            {p.salesPhone && <p><a href={`tel:${p.salesPhone}`}>{p.salesPhone}</a></p>}
            {p.salesEmail && <p><a href={`mailto:${p.salesEmail}`}>{p.salesEmail}</a></p>}
            <p className="mt-2">{p.developerName}</p>
          </div>
          <div className="text-xs text-ink/50 md:text-right">
            <p>© {new Date().getFullYear()} {p.organization.name}. All rights reserved.</p>
            <p className="mt-1">Powered by Rise Next</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
