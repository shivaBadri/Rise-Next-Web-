import { cache } from "react";
import { prisma } from "./db";

/** Public project fetch (published only) with everything the site needs. */
export const getPublicProject = cache(async (slug: string) => {
  const project = await prisma.project.findFirst({
    where: { slug, isPublished: true, status: { not: "ARCHIVED" } },
    include: {
      organization: true,
      amenities: { orderBy: { order: "asc" } },
      landmarks: { orderBy: { order: "asc" } },
      media: { where: { unitId: null, updateId: null }, orderBy: { order: "asc" } },
      updates: { where: { isPublished: true }, orderBy: { date: "desc" }, include: { media: true } },
      buildings: { orderBy: { code: "asc" } },
    },
  });
  if (!project) return null;
  return serialize(project);
});

/** Lightweight unit list for the viewer / plots page (status + price only). */
export const getPublicUnits = cache(async (projectId: string) => {
  const units = await prisma.unit.findMany({
    where: { projectId },
    orderBy: [{ buildingId: "asc" }, { floor: "asc" }, { number: "asc" }],
    select: {
      id: true, type: true, number: true, floor: true, area: true, areaUnit: true, dimensions: true,
      facing: true, bedrooms: true, bathrooms: true, price: true, pricePerUnit: true, status: true,
      isCorner: true, description: true, features: true, buildingId: true, floorPlanId: true,
    },
  });
  return units.map(serialize);
});

export const getPublishedAsset = cache(async (projectId: string) => {
  const asset = await prisma.threeDAsset.findFirst({
    where: { projectId, status: "PUBLISHED" },
    orderBy: { version: "desc" },
    include: { objects: { select: { objectKey: true, kind: true, unitId: true, amenityId: true, geomJson: true } } },
  });
  return asset ? serialize(asset) : null;
});

export const getPublicUnit = cache(async (projectId: string, number: string) => {
  const unit = await prisma.unit.findFirst({
    where: { projectId, number },
    include: { media: { orderBy: { order: "asc" } }, floorPlan: true, building: true },
  });
  return unit ? serialize(unit) : null;
});

/** Convert Decimal/Date to plain JSON-safe values for client components. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function serialize<T>(obj: T): any {
  return walk(obj);
}
function walk(v: unknown): unknown {
  if (v == null) return v;
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    const o = v as { toNumber?: () => number; d?: unknown };
    if (typeof o.toNumber === "function" && o.d !== undefined) return o.toNumber(); // Prisma Decimal
    if (Array.isArray(v)) return v.map(walk);
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) out[k] = walk(val);
    return out;
  }
  return v;
}
