"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LeadModal, { type LeadMode } from "./LeadModal";
import { whatsappLink } from "@/lib/format";
import { track } from "@/lib/analytics";

interface P { id: string; slug: string; name: string; logoUrl: string | null; whatsappNumber: string | null; salesPhone: string | null; brochureUrl: string | null; }

export default function ProjectNav({ project }: { project: P }) {
  const path = usePathname();
  const [lead, setLead] = useState<LeadMode | null>(null);
  const [open, setOpen] = useState(false);
  const base = `/projects/${project.slug}`;
  const links = [
    ["Overview", base], ["3D Layout", `${base}/3d`], ["Plots & Units", `${base}/plots`],
    ["Amenities", `${base}/amenities`], ["Gallery", `${base}/gallery`], ["Location", `${base}/location`], ["Updates", `${base}/updates`],
  ];
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-white/90 backdrop-blur">
        <div className="container-x flex h-16 items-center justify-between gap-4">
          <Link href={base} className="flex items-center gap-2">
            {project.logoUrl ? <img src={project.logoUrl} alt={project.name} className="h-9 w-auto" /> : <span className="max-w-[38vw] truncate font-display text-lg sm:max-w-none sm:text-xl">{project.name}</span>}
          </Link>
          <nav className="hidden items-center gap-1 lg:flex">
            {links.map(([label, href]) => (
              <Link key={href} href={href} className={`rounded-full px-3 py-1.5 text-sm ${path === href ? "bg-sand font-semibold" : "text-ink/70 hover:text-ink"}`}>{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {project.salesPhone && <a href={`tel:${project.salesPhone}`} className="btn-outline hidden sm:inline-flex">Call</a>}
            <button onClick={() => setLead("ENQUIRY")} className="btn-primary">Enquire</button>
            <button onClick={() => setOpen(!open)} className="btn-outline lg:hidden" aria-label="Menu">☰</button>
          </div>
        </div>
        {open && (
          <nav className="container-x flex flex-col gap-1 border-t border-ink/10 py-3 lg:hidden">
            {links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-sand">{label}</Link>)}
          </nav>
        )}
      </header>

      {/* Mobile sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 gap-px border-t border-ink/10 bg-ink/10 lg:hidden">
        <a href={`tel:${project.salesPhone ?? ""}`} className="bg-white py-3 text-center text-sm font-semibold">Call</a>
        <a href={whatsappLink(project.whatsappNumber, `Hi, I am interested in ${project.name}.`)} target="_blank" rel="noopener" onClick={() => track("whatsapp_click", { project: project.slug })} className="bg-[#25D366] py-3 text-center text-sm font-semibold text-white">WhatsApp</a>
        <button onClick={() => setLead("SITE_VISIT")} className="bg-brand py-3 text-center text-sm font-semibold text-white">Site Visit</button>
      </div>

      {/* Desktop floating WhatsApp */}
      <a href={whatsappLink(project.whatsappNumber, `Hi, I am interested in ${project.name}.`)} target="_blank" rel="noopener" onClick={() => track("whatsapp_click", { project: project.slug })}
        className={`fixed bottom-6 right-6 z-40 h-14 w-14 ${path.endsWith("/3d") ? "hidden" : "hidden lg:flex"} items-center justify-center rounded-full bg-[#25D366] text-2xl text-white shadow-lg`} aria-label="WhatsApp">💬</a>

      <LeadModal open={!!lead} mode={lead ?? "ENQUIRY"} projectId={project.id} projectName={project.name} brochureUrl={project.brochureUrl} onClose={() => setLead(null)} />
    </>
  );
}
