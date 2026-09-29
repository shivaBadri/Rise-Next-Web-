import { notFound } from "next/navigation";
import { getPublicProject, getPublicUnits, getPublishedAsset } from "@/lib/queries";
import Viewer3D from "@/components/viewer/Viewer3D";

export const metadata = { title: "Interactive 3D Layout" };

export default async function ThreeDPage({ params, searchParams }: { params: { slug: string }; searchParams: { unit?: string } }) {
  const p = await getPublicProject(params.slug);
  if (!p) notFound();
  const [units, asset] = await Promise.all([getPublicUnits(p.id), getPublishedAsset(p.id)]);
  return (
    <main className="relative">
      <Viewer3D project={p} asset={asset} units={units} amenities={p.amenities} brochureUrl={p.brochureUrl} initialUnitNumber={searchParams.unit} fullscreen backHref={`/projects/${p.slug}`} />
    </main>
  );
}
