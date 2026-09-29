import { prisma } from "@/lib/db";
import { getSession, can } from "@/lib/auth";
export async function GET(req: Request) {
  const user = await getSession();
  if (!can(user, "leads:read")) return new Response("Forbidden", { status: 403 });
  const project = new URL(req.url).searchParams.get("project") ?? undefined;
  const leads = await prisma.lead.findMany({ where: { projectId: project }, orderBy: { createdAt: "desc" }, include: { project: true, unit: true, assignedTo: true } });
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Date", "Name", "Phone", "Email", "Project", "Unit", "Source", "Status", "Assigned", "UTM Source", "UTM Campaign", "Message"].join(",")];
  for (const l of leads) rows.push([l.createdAt.toISOString(), l.name, l.phone, l.email, l.project.name, l.unit?.number, l.source, l.status, l.assignedTo?.name, l.utmSource, l.utmCampaign, l.message].map(esc).join(","));
  return new Response(rows.join("\n"), { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"` } });
}
