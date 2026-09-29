# Rise Next – Interactive 3D Real Estate Platform (MVP)

Reusable, multi-project platform for real-estate developers: premium project website, interactive 3D master layout with live availability, inventory management, lead & site-visit management, audit log, SEO and marketing integrations.

**Stack:** Next.js 14 (App Router, TypeScript, Tailwind) · React Three Fiber + Drei · Prisma 7 + PostgreSQL (Neon) · Vercel.

---

## 1. Quick start (local)

```bash
cp .env.example .env          # fill DATABASE_URL / DIRECT_URL / AUTH_SECRET
npm install
npx prisma generate
npx prisma migrate deploy     # applies prisma/migrations (or: npx prisma db push)
npm run db:seed               # demo project "Arising Future City" with 48 plots
npm run dev                   # http://localhost:3000
```

| URL | What |
|---|---|
| `/` | Project directory (all published projects) |
| `/projects/arising-future-city` | Demo project website |
| `/projects/arising-future-city/3d` | Full-screen interactive 3D layout |
| `/admin` | Admin console |

**Demo logins** (from seed): `admin@risenext.in / Admin@12345` (Super Admin), `sales@arisingdevelopers.in / Sales@12345` (Sales Manager). Change `SEED_ADMIN_*` in `.env` before seeding production.

---

## 2. Deploy (GitHub → Vercel → Neon)

1. Create a Neon project; copy the **pooled** connection string to `DATABASE_URL` and the **direct** one to `DIRECT_URL`.
2. Push this repo to GitHub, import in Vercel, set all env vars from `.env.example`.
3. Build command is `prisma generate && next build` (already in `package.json`). Run `npx prisma migrate deploy` once against the production DB (Vercel build step or locally with prod `DIRECT_URL`).
4. Set `NEXT_PUBLIC_SITE_URL` to the production domain for correct canonical/sitemap/OG URLs.
5. Keep **development / staging / production** as three Vercel environments with three Neon branches. Never commit `.env`.

Custom domain per project: add the domain in Vercel and set `Project.domain` in admin; a rewrite from the root of that domain to `/projects/<slug>` can be added in `next.config.mjs` (`rewrites` with `has: [{ type: "host", value: "..." }]`) — left as a config step since it depends on the client's DNS.

---

## 3. Project structure

```
prisma/schema.prisma        All entities (Organization, User, Project, Building, Unit, FloorPlan,
                            Amenity, Media, Landmark, ThreeDAsset, ThreeDObject, Lead, LeadNote,
                            SiteVisit, ProjectUpdate, AuditLog) + enums
prisma/migrations/          SQL migrations (initial schema)
prisma/seed.ts              Demo org/project/48 plots/amenities/3D mapping/leads
src/app/
  page.tsx                  Project directory
  projects/[slug]/          Public site: overview, 3d, plots, units/[number], amenities,
                            gallery, location, updates (+ SEO metadata, JSON-LD)
  admin/                    Dashboard, projects (details/inventory/3d/media/content), leads,
                            site visits, audit log, users. Server actions in admin/actions.ts
  api/public/               leads, site-visits (POST, validated, rate-limited, honeypot),
                            projects/[slug]/units (live availability feed)
  api/admin/leads/export    CSV export
  sitemap.ts, robots.ts
src/components/viewer/      Viewer3D (shell, legend, filters, camera views, 2D toggle, polling),
                            Scene (R3F: GLB or procedural), Layout2D (SVG fallback), UnitCard
src/components/public/      Nav + sticky mobile CTA, LeadModal, CTA buttons, Analytics scripts
src/components/admin/       Forms (project, unit), status quick-select, Cloudinary upload
src/lib/                    db (Prisma+pg adapter), auth (JWT cookie, RBAC), audit, validation (zod),
                            analytics (GA4/GTM/Pixel/Ads events), format (INR, colours), demo-layout
src/middleware.ts           Protects /admin and /api/admin
```

---

## 4. How the 3D ↔ inventory mapping works

```
GLB mesh name  ──►  ThreeDObject.objectKey  ──►  Unit (status, price, area…)
   plot_142              plot_142                 Plot 142 · AVAILABLE · ₹32.5 L
```

* Every interactive mesh in the GLB must be named per the standard: `plot_001`, `villa_001`, `tower_A`, `flat_A101`, `clubhouse`, `swimming_pool`, `gym`, `park_01`.
* **Admin → Project → 3D Assets**: create a version (paste the CDN URL of the GLB), add/auto-map objects, set to *Testing*, preview, then *Publish*. Publishing archives the previous live version; re-publishing an archived version = rollback.
* **Colours come from the database at render time**, never from the model. Status change in admin → public API (`/api/public/projects/<slug>/units`) → viewer (polls every 30 s; page loads are always fresh).
* **Procedural mode**: if `ThreeDAsset.fileUrl` is empty, the viewer builds geometry from `ThreeDObject.geomJson` (`{shape:"box", position:[x,y,z], size:[w,h,d]}`). The demo uses this so the platform is demonstrable before the 3D artist delivers a GLB. The same `geomJson` powers the 2D SVG fallback.
* GLB loading uses drei's `useGLTF` (Draco/Meshopt/KTX2 supported by three's loaders; host decoders on the CDN if using Draco: `useGLTF.setDecoderPath`).

**GLB production checklist:** Y-up, metres, origin at site centre, one mesh per interactive object, flat-shaded low-poly is fine, Draco or Meshopt compressed, textures KTX2 ≤ 2K, total ≤ ~15 MB for mobile.

---

## 5. Roles

| Role | Access |
|---|---|
| SUPER_ADMIN | Everything, all organizations |
| ORG_ADMIN | All projects of their organization, users |
| PROJECT_ADMIN | Project details, inventory, 3D publish, content, leads |
| SALES_MANAGER | Inventory status, leads, site visits, assignment |
| SALES_EXECUTIVE | Own assigned leads |
| CONTENT_MANAGER | Website content, media |
| VIEWER | Read-only |

Permission matrix lives in `src/lib/auth.ts` (`ROLE_PERMS`). Server actions call `assertCan()`.

---

## 6. Marketing & integrations

* Per-project GA4 / GTM / Meta Pixel / Google Ads IDs (admin → project → SEO & marketing) or global via `NEXT_PUBLIC_*`.
* Events fired (see `src/lib/analytics.ts`): `project_view`, `3d_viewer_open`, `unit_selected`, `price_viewed`, `enquiry_started`, `lead_submitted`, `whatsapp_click`, `site_visit_requested`, `brochure_downloaded`. Lead events also fire Meta `Lead` and Google Ads `conversion`.
* UTM parameters, referrer and landing page are captured on every lead.
* WhatsApp CTAs prefill: "Hi, I am interested in Plot 142 at Arising Future City."
* Google Maps: set `NEXT_PUBLIC_GOOGLE_MAPS_KEY` for the Embed API; without a key the viewer falls back to the keyless maps embed.
* Cloudinary: set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + an **unsigned upload preset** to enable the Upload button in admin → Media; otherwise paste URLs.
* Email/WhatsApp notification on new lead: hook point marked `TODO` in `src/app/api/public/leads/route.ts` (Resend / Twilio / Interakt).

---

## 7. Security

JWT session cookie (httpOnly, 7 d) · bcrypt passwords · middleware-protected `/admin` & `/api/admin` · zod validation on all public POSTs · honeypot + IP rate limit on lead endpoints (in-memory; swap for Upstash on multi-instance) · public API is read-only · every inventory/3D/lead/status change is written to `AuditLog` with before/after.

---

## 8. Roadmap after MVP

Apartment tower/floor selector UI in viewer (data model already supports Building → floor → Unit) · Cloudinary signed uploads · lead notifications · Redis rate-limit · Neon branch per environment in CI · tests (Playwright smoke: home, 3D select, enquiry, admin status change).
