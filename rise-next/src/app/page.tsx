import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const projects = await prisma.project.findMany({
    where: { isPublished: true, status: { not: "ARCHIVED" } },
    include: { organization: true, _count: { select: { units: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <main className="min-h-screen bg-sand">
      <header className="container-x flex items-center justify-between py-6">
        <div className="font-display text-2xl">Rise Next</div>
        <Link href="/admin" className="btn-outline">Admin</Link>
      </header>
      <section className="container-x py-12">
        <p className="eyebrow">Interactive 3D Real Estate Platform</p>
        <h1 className="section-title mt-3 max-w-2xl">Explore projects in 3D, check live availability, book a site visit.</h1>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="card overflow-hidden transition hover:shadow-lg">
              <div className="aspect-[16/10] bg-ink/5 bg-cover bg-center" style={{ backgroundImage: p.coverImageUrl ? `url(${p.coverImageUrl})` : undefined }} />
              <div className="p-5">
                <p className="text-xs text-ink/50">{p.organization.name}</p>
                <h2 className="mt-1 font-display text-xl">{p.name}</h2>
                <p className="mt-1 text-sm text-ink/70">{p.city}, {p.state}</p>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="font-semibold">From {formatINR(p.startingPrice?.toString())}</span>
                  <span className="text-ink/60">{p._count.units} units</span>
                </div>
              </div>
            </Link>
          ))}
          {projects.length === 0 && (
            <p className="text-ink/60">No published projects yet. Run <code>npm run db:seed</code> or create one in the admin.</p>
          )}
        </div>
      </section>
    </main>
  );
}
