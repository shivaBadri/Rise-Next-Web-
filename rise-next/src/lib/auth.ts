import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role } from "@/generated/prisma/enums";

export const SESSION_COOKIE = "rn_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret-change-me");

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  organizationId: string | null;
}

export async function signSession(user: SessionUser) {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.isActive) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const session: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
  };
  return session;
}

// ---- Role-based permissions ----
export type Permission =
  | "project:read" | "project:write" | "project:delete"
  | "inventory:read" | "inventory:write"
  | "media:write" | "content:write"
  | "3d:write" | "3d:publish"
  | "leads:read" | "leads:write" | "leads:assign"
  | "users:manage" | "audit:read";

const ALL: Permission[] = [
  "project:read", "project:write", "project:delete", "inventory:read", "inventory:write",
  "media:write", "content:write", "3d:write", "3d:publish", "leads:read", "leads:write",
  "leads:assign", "users:manage", "audit:read",
];

const ROLE_PERMS: Record<Role, Permission[]> = {
  SUPER_ADMIN: ALL,
  ORG_ADMIN: ALL,
  PROJECT_ADMIN: ["project:read", "project:write", "inventory:read", "inventory:write", "media:write", "content:write", "3d:write", "3d:publish", "leads:read", "leads:write", "leads:assign", "audit:read"],
  SALES_MANAGER: ["project:read", "inventory:read", "inventory:write", "leads:read", "leads:write", "leads:assign", "audit:read"],
  SALES_EXECUTIVE: ["project:read", "inventory:read", "leads:read", "leads:write"],
  CONTENT_MANAGER: ["project:read", "project:write", "inventory:read", "media:write", "content:write"],
  VIEWER: ["project:read", "inventory:read", "leads:read"],
};

export function can(user: SessionUser | null, perm: Permission) {
  if (!user) return false;
  return ROLE_PERMS[user.role]?.includes(perm) ?? false;
}

export function assertCan(user: SessionUser | null, perm: Permission) {
  if (!can(user, perm)) throw new Error("FORBIDDEN");
}
