import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const projects = await prisma.project.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true, units: { select: { number: true } } } });
  const out: MetadataRoute.Sitemap = [{ url: base, lastModified: new Date() }];
  for (const p of projects) {
    for (const s of ["", "/3d", "/plots", "/amenities", "/gallery", "/location", "/updates"]) out.push({ url: `${base}/projects/${p.slug}${s}`, lastModified: p.updatedAt, priority: s === "" ? 1 : 0.7 });
    for (const u of p.units) out.push({ url: `${base}/projects/${p.slug}/units/${encodeURIComponent(u.number)}`, lastModified: p.updatedAt, priority: 0.5 });
  }
  return out;
}
