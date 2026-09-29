"use client";
import Link from "next/link";
import { formatINR, formatNumber, facingLabel, STATUS_COLORS, STATUS_LABELS, unitLabel, whatsappLink } from "@/lib/format";
import { track } from "@/lib/analytics";
import type { ViewerUnit, ViewerProject } from "./types";

export default function UnitCard({
  unit, project, onEnquire, onSiteVisit, onClose,
}: {
  unit: ViewerUnit; project: ViewerProject;
  onEnquire: () => void; onSiteVisit: () => void; onClose: () => void;
}) {
  const label = unitLabel(unit);
  const wa = whatsappLink(project.whatsappNumber, `Hi, I am interested in ${label} at ${project.name}.`);
  return (
    <div className="card w-full max-w-sm overflow-hidden">
      <div className="flex items-start justify-between p-4 pb-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">{project.name}</p>
          <h3 className="font-display text-2xl">{label}</h3>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink/50 hover:bg-sand">✕</button>
      </div>
      <div className="px-4">
        <span className="badge text-white" style={{ background: STATUS_COLORS[unit.status] }}>{STATUS_LABELS[unit.status]}</span>
        {unit.isCorner && <span className="badge ml-2 bg-amber-100 text-amber-800">Corner</span>}
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm">
        <div><dt className="label">Area</dt><dd className="font-semibold">{formatNumber(unit.area)} {unit.areaUnit}</dd></div>
        <div><dt className="label">Facing</dt><dd className="font-semibold">{facingLabel(unit.facing)}</dd></div>
        {unit.dimensions && <div><dt className="label">Dimensions</dt><dd className="font-semibold">{unit.dimensions}</dd></div>}
        {unit.bedrooms != null && <div><dt className="label">Config</dt><dd className="font-semibold">{unit.bedrooms} BHK · {unit.bathrooms ?? "—"} Bath</dd></div>}
        {unit.floor != null && <div><dt className="label">Floor</dt><dd className="font-semibold">{unit.floor}</dd></div>}
        <div className="col-span-2">
          <dt className="label">Price</dt>
          <dd className="font-display text-2xl">{unit.status === "SOLD" ? "Sold" : formatINR(unit.price)}</dd>
          {unit.pricePerUnit && unit.status !== "SOLD" && <p className="text-xs text-ink/50">₹{formatNumber(unit.pricePerUnit)} / {unit.areaUnit}</p>}
        </div>
      </dl>
      <div className="grid grid-cols-2 gap-2 border-t border-ink/10 p-4">
        <Link href={`/projects/${project.slug}/units/${encodeURIComponent(unit.number)}`} className="btn-outline">View Details</Link>
        <button onClick={onEnquire} className="btn-primary" disabled={unit.status === "SOLD"}>Enquire Now</button>
        <button onClick={onSiteVisit} className="btn-outline">Book Site Visit</button>
        <a href={wa} target="_blank" rel="noopener" className="btn-whatsapp" onClick={() => track("whatsapp_click", { unit: label, project: project.slug })}>WhatsApp</a>
      </div>
    </div>
  );
}
