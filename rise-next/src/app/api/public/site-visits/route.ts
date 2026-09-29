import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { siteVisitSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`visit:${ip}`, 5, 60_000)) return NextResponse.json({ error: "Too many requests." }, { status: 429 });

  const parsed = siteVisitSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });

  const project = await prisma.project.findFirst({ where: { id: d.projectId, isPublished: true }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const phone = d.phone.replace(/\s+/g, "");
  // One lead per phone per project; site visit links to it.
  let lead = await prisma.lead.findFirst({ where: { projectId: project.id, phone } });
  if (!lead) {
    lead = await prisma.lead.create({ data: { projectId: project.id, unitId: d.unitId ?? undefined, name: d.name, phone, email: d.email || undefined, source: "SITE_VISIT", status: "SITE_VISIT" } });
  } else if (lead.status === "NEW" || lead.status === "CONTACTED") {
    await prisma.lead.update({ where: { id: lead.id }, data: { status: "SITE_VISIT" } });
  }
  const visit = await prisma.siteVisit.create({
    data: { projectId: project.id, leadId: lead.id, unitId: d.unitId ?? undefined, name: d.name, phone, email: d.email || undefined, preferredDate: new Date(d.preferredDate), preferredTime: d.preferredTime },
  });
  return NextResponse.json({ ok: true, id: visit.id });
}
