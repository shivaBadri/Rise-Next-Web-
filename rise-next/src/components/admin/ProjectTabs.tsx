"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function ProjectTabs({ id, name, slug }: { id: string; name: string; slug: string }) {
  const path = usePathname();
  const tabs = [["Details", `/admin/projects/${id}`], ["Inventory", `/admin/projects/${id}/inventory`], ["3D Assets", `/admin/projects/${id}/3d`], ["Media", `/admin/projects/${id}/media`], ["Content", `/admin/projects/${id}/content`]];
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between"><h1 className="font-display text-3xl">{name}</h1><Link href={`/projects/${slug}`} target="_blank" className="btn-outline">View site ↗</Link></div>
      <div className="mt-4 flex gap-1 overflow-x-auto border-b border-ink/10">{tabs.map(([l, h]) => <Link key={h} href={h} className={`whitespace-nowrap px-4 py-2 text-sm ${path === h ? "border-b-2 border-brand font-semibold" : "text-ink/60"}`}>{l}</Link>)}</div>
    </div>
  );
}
