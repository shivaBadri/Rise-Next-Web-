import { notFound } from "next/navigation";
import { getPublicProject } from "@/lib/queries";
export const metadata = { title: "Gallery" };
const KINDS: Record<string, string> = { IMAGE: "Photos", RENDER: "Renders", VIDEO: "Videos", DRONE_VIDEO: "Drone", CONSTRUCTION: "Construction", PANORAMA_360: "360°", WALKTHROUGH: "Walkthrough" };
export default async function GalleryPage({ params }: { params: { slug: string } }) {
  const p = await getPublicProject(params.slug); if (!p) notFound();
  const media = p.media as { id: string; url: string; kind: string; title: string | null; thumbnailUrl: string | null }[];
  const groups = Object.entries(KINDS).map(([k, label]) => [label, media.filter((m) => m.kind === k)] as const).filter(([, arr]) => arr.length);
  return (
    <main className="container-x py-12">
      <p className="eyebrow">Gallery</p><h1 className="section-title mt-3">Photos, renders & videos</h1>
      {groups.map(([label, arr]) => (
        <section key={label} className="mt-12"><h2 className="font-display text-2xl">{label}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {arr.map((m) => m.kind.includes("VIDEO") || m.kind === "WALKTHROUGH"
              ? <video key={m.id} src={m.url} poster={m.thumbnailUrl ?? undefined} controls preload="none" className="aspect-video w-full rounded-xl bg-ink" />
              : <a key={m.id} href={m.url} target="_blank" rel="noopener"><img src={m.url} alt={m.title ?? ""} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" /></a>)}
          </div></section>
      ))}
    </main>
  );
}
