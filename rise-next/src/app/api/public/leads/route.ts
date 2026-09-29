import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { leadSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { createHash } from "crypto";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`lead:${ip}`, 8, 60_000)) return NextResponse.json({ error: "Too many requests. Please try again in a minute." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // honeypot

  const project = await prisma.project.findFirst({ where: { id: d.projectId, isPublished: true }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const lead = await prisma.lead.create({
    data: {
      projectId: project.id,
      unitId: d.unitId ?? undefined,
      name: d.name,
      phone: d.phone.replace(/\s+/g, ""),
      email: d.email || undefined,
      message: d.message,
      source: d.source,
      utmSource: d.utm?.source, utmMedium: d.utm?.medium, utmCampaign: d.utm?.campaign, utmContent: d.utm?.content,
      referrer: d.referrer?.slice(0, 500), landingPage: d.landingPage?.slice(0, 500),
      ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 32),
    },
  });
  // TODO: email/WhatsApp notification to sales team (Resend / Twilio) – see README "Integrations".
  return NextResponse.json({ ok: true, id: lead.id });
}
