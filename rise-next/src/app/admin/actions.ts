"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { login, signSession, SESSION_COOKIE, getSession, assertCan } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { unitSchema, projectSchema } from "@/lib/validation";
import type { Prisma } from "@/generated/prisma/client";

const str = (fd: FormData, k: string) => { const v = fd.get(k); return typeof v === "string" && v.trim() !== "" ? v.trim() : null; };
const obj = (fd: FormData) => Object.fromEntries(Array.from(fd.entries()).map(([k, v]) => [k, typeof v === "string" && v === "" ? null : v]));

// ---------- Auth ----------
export async function loginAction(_prev: { error?: string } | undefined, fd: FormData) {
  const session = await login(String(fd.get("email") ?? ""), String(fd.get("password") ?? ""));
  if (!session) return { error: "Invalid email or password" };
  cookies().set(SESSION_COOKIE, await signSession(session), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 7 * 86400 });
  redirect(String(fd.get("next") || "/admin"));
}
export async function logoutAction() { cookies().delete(SESSION_COOKIE); redirect("/admin/login"); }

// ---------- Projects ----------
export async function saveProjectAction(id: string | null, fd: FormData) {
  const user = await getSession(); assertCan(user, "project:write");
  const parsed = projectSchema.safeParse(obj(fd));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const d = parsed.data;
  const data = { ...d, highlights: (d.highlights ?? "").split("\n").map((s) => s.trim()).filter(Boolean) } as unknown as Prisma.ProjectUncheckedUpdateInput;
  let project;
  if (id) {
    const before = await prisma.project.findUnique({ where: { id } });
    project = await prisma.project.update({ where: { id }, data });
    await audit({ user, projectId: id, entity: "Project", entityId: id, entityLabel: project.name, action: "UPDATE", before: { status: before?.status, isPublished: before?.isPublished }, after: { status: project.status, isPublished: project.isPublished } });
  } else {
    let orgId = user!.organizationId;
    if (!orgId) { const org = await prisma.organization.findFirst(); if (!org) return { error: "Create an organization first" }; orgId = org.id; }
    project = await prisma.project.create({ data: { ...(data as Prisma.ProjectUncheckedCreateInput), organizationId: orgId } });
    await audit({ user, projectId: project.id, entity: "Project", entityId: project.id, entityLabel: project.name, action: "CREATE" });
  }
  revalidatePath("/admin/projects"); revalidatePath(`/projects/${project.slug}`);
  redirect(`/admin/projects/${project.id}`);
}

export async function archiveProjectAction(id: string) {
  const user = await getSession(); assertCan(user, "project:delete");
  const p = await prisma.project.update({ where: { id }, data: { status: "ARCHIVED", isPublished: false } });
  await audit({ user, projectId: id, entity: "Project", entityId: id, entityLabel: p.name, action: "DELETE" });
  revalidatePath("/admin/projects"); redirect("/admin/projects");
}

// ---------- Inventory ----------
export async function saveUnitAction(projectId: string, unitId: string | null, fd: FormData) {
  const user = await getSession(); assertCan(user, "inventory:write");
  const raw: Record<string, unknown> = obj(fd); raw.isCorner = fd.get("isCorner") === "on";
  const parsed = unitSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const d = parsed.data;
  const data = { ...d, buildingId: d.buildingId || null } as unknown as Prisma.UnitUncheckedUpdateInput;
  if (unitId) {
    const before = await prisma.unit.findUnique({ where: { id: unitId } });
    const unit = await prisma.unit.update({ where: { id: unitId }, data });
    const statusChanged = before && before.status !== unit.status;
    await audit({ user, projectId, entity: "Unit", entityId: unit.id, entityLabel: `${unit.type} ${unit.number}`, action: statusChanged ? "STATUS_CHANGE" : "UPDATE",
      before: { status: before?.status, price: before?.price?.toString() }, after: { status: unit.status, price: unit.price?.toString() } });
  } else {
    const unit = await prisma.unit.create({ data: { ...(data as Prisma.UnitUncheckedCreateInput), projectId } });
    await audit({ user, projectId, entity: "Unit", entityId: unit.id, entityLabel: `${unit.type} ${unit.number}`, action: "CREATE", after: { status: unit.status } });
  }
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  revalidatePath(`/admin/projects/${projectId}/inventory`); if (p) revalidatePath(`/projects/${p.slug}`, "layout");
  redirect(`/admin/projects/${projectId}/inventory`);
}

export async function quickStatusAction(projectId: string, unitId: string, status: string) {
  const user = await getSession(); assertCan(user, "inventory:write");
  const before = await prisma.unit.findUnique({ where: { id: unitId } });
  if (!before) return;
  const unit = await prisma.unit.update({ where: { id: unitId }, data: { status: status as never } });
  await audit({ user, projectId, entity: "Unit", entityId: unitId, entityLabel: `${unit.type} ${unit.number}`, action: "STATUS_CHANGE", before: { status: before.status }, after: { status: unit.status } });
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  revalidatePath(`/admin/projects/${projectId}/inventory`); if (p) revalidatePath(`/projects/${p.slug}`, "layout");
}

export async function deleteUnitAction(projectId: string, unitId: string) {
  const user = await getSession(); assertCan(user, "inventory:write");
  const u = await prisma.unit.delete({ where: { id: unitId } });
  await audit({ user, projectId, entity: "Unit", entityId: unitId, entityLabel: `${u.type} ${u.number}`, action: "DELETE", before: { status: u.status } });
  revalidatePath(`/admin/projects/${projectId}/inventory`);
}

export async function bulkImportUnitsAction(projectId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "inventory:write");
  const csv = String(fd.get("csv") ?? "");
  const lines = csv.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return { error: "CSV needs a header and at least one row" };
  const header = lines[0].split(",").map((h) => h.trim());
  let created = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((c) => c.trim());
    const row: Record<string, string> = {}; header.forEach((h, i) => (row[h] = cells[i] ?? ""));
    const parsed = unitSchema.safeParse({ ...row, isCorner: row.isCorner === "true" || row.isCorner === "1" });
    if (!parsed.success) continue;
    const d = parsed.data;
    await prisma.unit.upsert({ where: { projectId_number: { projectId, number: d.number } }, update: { ...d, buildingId: d.buildingId || null } as never, create: { ...d, buildingId: d.buildingId || null, projectId } as never });
    created++;
  }
  await audit({ user, projectId, entity: "Unit", entityId: "bulk", entityLabel: `${created} units imported`, action: "CREATE" });
  revalidatePath(`/admin/projects/${projectId}/inventory`);
  return { ok: `${created} units imported/updated` };
}

// ---------- 3D assets ----------
export async function createAssetAction(projectId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "3d:write");
  const last = await prisma.threeDAsset.findFirst({ where: { projectId }, orderBy: { version: "desc" } });
  const cloneFrom = str(fd, "cloneFromId");
  const asset = await prisma.threeDAsset.create({ data: { projectId, version: (last?.version ?? 0) + 1, name: str(fd, "name") ?? `Version ${(last?.version ?? 0) + 1}`, fileUrl: str(fd, "fileUrl"), notes: str(fd, "notes"), status: "DRAFT",
    cameraJson: cloneFrom ? (await prisma.threeDAsset.findUnique({ where: { id: cloneFrom } }))?.cameraJson ?? undefined : undefined } });
  if (cloneFrom) {
    const objs = await prisma.threeDObject.findMany({ where: { assetId: cloneFrom } });
    if (objs.length) await prisma.threeDObject.createMany({ data: objs.map((o) => ({ assetId: asset.id, objectKey: o.objectKey, kind: o.kind, unitId: o.unitId, amenityId: o.amenityId, geomJson: o.geomJson ?? undefined, labelPos: o.labelPos ?? undefined })) });
  }
  await audit({ user, projectId, entity: "ThreeDAsset", entityId: asset.id, entityLabel: asset.name, action: "CREATE" });
  revalidatePath(`/admin/projects/${projectId}/3d`);
}

export async function setAssetStatusAction(projectId: string, assetId: string, status: "DRAFT" | "TESTING" | "PUBLISHED" | "ARCHIVED") {
  const user = await getSession(); assertCan(user, status === "PUBLISHED" ? "3d:publish" : "3d:write");
  const before = await prisma.threeDAsset.findUnique({ where: { id: assetId } });
  if (status === "PUBLISHED") {
    // Only one published version at a time; previous goes to ARCHIVED (kept for rollback).
    await prisma.threeDAsset.updateMany({ where: { projectId, status: "PUBLISHED", NOT: { id: assetId } }, data: { status: "ARCHIVED" } });
  }
  const a = await prisma.threeDAsset.update({ where: { id: assetId }, data: { status, publishedAt: status === "PUBLISHED" ? new Date() : undefined } });
  await audit({ user, projectId, entity: "ThreeDAsset", entityId: assetId, entityLabel: a.name, action: status === "PUBLISHED" ? "PUBLISH" : "UPDATE", before: { status: before?.status }, after: { status } });
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { slug: true } });
  revalidatePath(`/admin/projects/${projectId}/3d`); if (p) revalidatePath(`/projects/${p.slug}`, "layout");
}

export async function mapObjectAction(projectId: string, assetId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "3d:write");
  const objectKey = str(fd, "objectKey"); if (!objectKey) return { error: "objectKey required" };
  const kind = (str(fd, "kind") ?? "UNIT") as "UNIT" | "AMENITY" | "BUILDING" | "ROAD" | "OTHER";
  const unitId = str(fd, "unitId"); const amenityId = str(fd, "amenityId");
  let geomJson: unknown = undefined; const g = str(fd, "geomJson"); if (g) { try { geomJson = JSON.parse(g); } catch { return { error: "geomJson must be valid JSON" }; } }
  await prisma.threeDObject.upsert({ where: { assetId_objectKey: { assetId, objectKey } }, update: { kind, unitId, amenityId, ...(geomJson !== undefined ? { geomJson: geomJson as never } : {}) }, create: { assetId, objectKey, kind, unitId, amenityId, geomJson: geomJson as never } });
  await audit({ user, projectId, entity: "ThreeDObject", entityId: objectKey, entityLabel: objectKey, action: "UPDATE", after: { unitId, amenityId, kind } });
  revalidatePath(`/admin/projects/${projectId}/3d`);
}

export async function autoMapAction(projectId: string, assetId: string) {
  // Maps plot_<number> / villa_<number> / flat_<number> object keys to units by number automatically.
  const user = await getSession(); assertCan(user, "3d:write");
  const units = await prisma.unit.findMany({ where: { projectId }, select: { id: true, number: true } });
  const objs = await prisma.threeDObject.findMany({ where: { assetId, kind: "UNIT", unitId: null } });
  let n = 0;
  for (const o of objs) {
    const m = o.objectKey.match(/^(?:plot|villa|flat|unit|shop)_(.+)$/i); if (!m) continue;
    const key = m[1].replace(/^0+/, "");
    const u = units.find((x) => x.number.replace(/^0+/, "").toLowerCase() === key.toLowerCase());
    if (u) { await prisma.threeDObject.update({ where: { id: o.id }, data: { unitId: u.id } }); n++; }
  }
  await audit({ user, projectId, entity: "ThreeDAsset", entityId: assetId, entityLabel: `auto-mapped ${n} objects`, action: "UPDATE" });
  revalidatePath(`/admin/projects/${projectId}/3d`);
}

export async function deleteObjectAction(projectId: string, id: string) {
  const user = await getSession(); assertCan(user, "3d:write");
  await prisma.threeDObject.delete({ where: { id } });
  revalidatePath(`/admin/projects/${projectId}/3d`);
}

// ---------- Leads ----------
export async function updateLeadAction(id: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "leads:write");
  const before = await prisma.lead.findUnique({ where: { id } });
  const assignedToId = str(fd, "assignedToId");
  if (assignedToId !== (before?.assignedToId ?? null)) assertCan(user, "leads:assign");
  const lead = await prisma.lead.update({ where: { id }, data: { status: (str(fd, "status") ?? before?.status) as never, assignedToId } });
  const note = str(fd, "note");
  if (note) await prisma.leadNote.create({ data: { leadId: id, authorName: user!.name, body: note } });
  await audit({ user, projectId: lead.projectId, entity: "Lead", entityId: id, entityLabel: lead.name, action: before?.status !== lead.status ? "STATUS_CHANGE" : "UPDATE", before: { status: before?.status, assignedToId: before?.assignedToId }, after: { status: lead.status, assignedToId } });
  revalidatePath(`/admin/leads/${id}`); revalidatePath("/admin/leads");
}

export async function updateVisitAction(id: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "leads:write");
  const v = await prisma.siteVisit.update({ where: { id }, data: { status: str(fd, "status") as never, assignedToId: str(fd, "assignedToId"), notes: str(fd, "notes"),
    preferredDate: str(fd, "preferredDate") ? new Date(str(fd, "preferredDate")!) : undefined, preferredTime: str(fd, "preferredTime") ?? undefined } });
  await audit({ user, projectId: v.projectId, entity: "SiteVisit", entityId: id, entityLabel: v.name, action: "UPDATE", after: { status: v.status } });
  revalidatePath("/admin/site-visits");
}

// ---------- Content ----------
export async function addMediaAction(projectId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "media:write");
  const url = str(fd, "url"); if (!url) return { error: "URL required" };
  await prisma.media.create({ data: { projectId, url, kind: (str(fd, "kind") ?? "IMAGE") as never, title: str(fd, "title"), unitId: str(fd, "unitId"), order: Number(str(fd, "order") ?? 0) } });
  revalidatePath(`/admin/projects/${projectId}/media`);
}
export async function deleteMediaAction(projectId: string, id: string) {
  const user = await getSession(); assertCan(user, "media:write");
  await prisma.media.delete({ where: { id } }); revalidatePath(`/admin/projects/${projectId}/media`);
}
export async function saveAmenityAction(projectId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "content:write");
  const id = str(fd, "id");
  const data = { name: str(fd, "name") ?? "", icon: str(fd, "icon"), description: str(fd, "description"), imageUrl: str(fd, "imageUrl"), objectKey: str(fd, "objectKey"), order: Number(str(fd, "order") ?? 0) };
  if (id) await prisma.amenity.update({ where: { id }, data }); else await prisma.amenity.create({ data: { ...data, projectId } });
  revalidatePath(`/admin/projects/${projectId}/content`);
}
export async function deleteAmenityAction(projectId: string, id: string) {
  const user = await getSession(); assertCan(user, "content:write");
  await prisma.amenity.delete({ where: { id } }); revalidatePath(`/admin/projects/${projectId}/content`);
}
export async function saveLandmarkAction(projectId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "content:write");
  await prisma.landmark.create({ data: { projectId, category: str(fd, "category") ?? "Other", name: str(fd, "name") ?? "", distanceKm: str(fd, "distanceKm") ? Number(str(fd, "distanceKm")) : null, minutes: str(fd, "minutes") ? Number(str(fd, "minutes")) : null } });
  revalidatePath(`/admin/projects/${projectId}/content`);
}
export async function deleteLandmarkAction(projectId: string, id: string) {
  const user = await getSession(); assertCan(user, "content:write");
  await prisma.landmark.delete({ where: { id } }); revalidatePath(`/admin/projects/${projectId}/content`);
}
export async function saveUpdateAction(projectId: string, fd: FormData) {
  const user = await getSession(); assertCan(user, "content:write");
  await prisma.projectUpdate.create({ data: { projectId, title: str(fd, "title") ?? "", body: str(fd, "body"), date: new Date(str(fd, "date") ?? Date.now()) } });
  revalidatePath(`/admin/projects/${projectId}/content`);
}
export async function deleteUpdateAction(projectId: string, id: string) {
  const user = await getSession(); assertCan(user, "content:write");
  await prisma.projectUpdate.delete({ where: { id } }); revalidatePath(`/admin/projects/${projectId}/content`);
}

// ---------- Users ----------
export async function saveUserAction(fd: FormData) {
  const user = await getSession(); assertCan(user, "users:manage");
  const email = (str(fd, "email") ?? "").toLowerCase(); const password = str(fd, "password");
  const data = { name: str(fd, "name") ?? "", role: (str(fd, "role") ?? "VIEWER") as never, phone: str(fd, "phone"), organizationId: user!.organizationId ?? (await prisma.organization.findFirst())?.id, isActive: fd.get("isActive") !== "off" };
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) await prisma.user.update({ where: { email }, data: { ...data, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) } });
  else { if (!password) return { error: "Password required for new user" }; await prisma.user.create({ data: { ...data, email, passwordHash: await bcrypt.hash(password, 10) } }); }
  await audit({ user, entity: "User", entityId: email, entityLabel: email, action: existing ? "UPDATE" : "CREATE", after: { role: data.role } });
  revalidatePath("/admin/users");
}
