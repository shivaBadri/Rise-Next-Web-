import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPublicUnits } from "@/lib/queries";

export const dynamic = "force-dynamic";

/** Live availability feed used by the 3D viewer. Public, read-only. */
export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const project = await prisma.project.findFirst({ where: { slug: params.slug, isPublished: true }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const units = await getPublicUnits(project.id);
  return NextResponse.json(units, { headers: { "Cache-Control": "no-store" } });
}
