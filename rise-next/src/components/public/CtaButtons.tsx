"use client";
import { useState } from "react";
import Link from "next/link";
import LeadModal, { type LeadMode } from "./LeadModal";

export default function CtaButtons({ projectId, projectName, slug, brochureUrl, variant = "hero", unitId, unitLabel }: {
  projectId: string; projectName: string; slug: string; brochureUrl?: string | null; variant?: "hero" | "inline"; unitId?: string; unitLabel?: string;
}) {
  const [lead, setLead] = useState<LeadMode | null>(null);
  const hero = variant === "hero";
  return (
    <>
      <div className="flex flex-wrap gap-3">
        {hero && <Link href={`/projects/${slug}/3d`} className="btn bg-white text-ink hover:bg-sand">Explore in 3D →</Link>}
        <button onClick={() => setLead("ENQUIRY")} className={hero ? "btn-primary" : "btn-primary"}>Enquire Now</button>
        <button onClick={() => setLead("SITE_VISIT")} className={hero ? "btn-ghost" : "btn-outline"}>Book Site Visit</button>
        <button onClick={() => setLead("CALLBACK")} className={hero ? "btn-ghost" : "btn-outline"}>Request Callback</button>
        {!hero && <button onClick={() => setLead("GET_PRICE")} className="btn-outline">Get Price</button>}
        {brochureUrl && <button onClick={() => setLead("BROCHURE")} className={hero ? "btn-ghost" : "btn-outline"}>Download Brochure</button>}
      </div>
      <LeadModal open={!!lead} mode={lead ?? "ENQUIRY"} projectId={projectId} projectName={projectName} unitId={unitId} unitLabel={unitLabel} brochureUrl={brochureUrl} onClose={() => setLead(null)} />
    </>
  );
}
