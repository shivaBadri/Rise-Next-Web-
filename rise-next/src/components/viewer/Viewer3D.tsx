"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import dynamic from "next/dynamic";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/format";
import { track } from "@/lib/analytics";
import UnitCard from "./UnitCard";
import Layout2D from "./Layout2D";
import LeadModal, { type LeadMode } from "@/components/public/LeadModal";
import type { ViewerAsset, ViewerUnit, ViewerProject, ViewerAmenity, CameraView } from "./types";

// 3D scene is loaded lazily so the rest of the page never waits for three.js.
const Scene = dynamic(() => import("./Scene"), {
  ssr: false,
  loading: () => <LoadingOverlay />,
});

function LoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-sand">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/30 border-t-brand" />
      <p className="text-sm text-ink/60">Loading 3D master layout…</p>
    </div>
  );
}

function detectLowPower() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { hardwareConcurrency?: number; deviceMemory?: number };
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return mobile || (nav.hardwareConcurrency ?? 8) <= 2 || (nav.deviceMemory ?? 8) <= 2;
}

function webglOk() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch { return false; }
}

interface Props {
  project: ViewerProject;
  asset: ViewerAsset | null;
  units: ViewerUnit[];
  amenities: ViewerAmenity[];
  brochureUrl?: string | null;
  initialUnitNumber?: string;
  fullscreen?: boolean;
  backHref?: string;
}

export default function Viewer3D({ project, asset, units, amenities, brochureUrl, initialUnitNumber, fullscreen, backHref }: Props) {
  const [liveUnits, setLiveUnits] = useState(units);
  const [mode, setMode] = useState<"3d" | "2d">("3d");
  const [lowPower, setLowPower] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [view, setView] = useState<CameraView | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [lead, setLead] = useState<{ mode: LeadMode } | null>(null);

  const unitsById = useMemo(() => Object.fromEntries(liveUnits.map((u) => [u.id, u])), [liveUnits]);
  const keyByUnitId = useMemo(() => {
    const m: Record<string, string> = {};
    asset?.objects.forEach((o) => { if (o.unitId) m[o.unitId] = o.objectKey; });
    return m;
  }, [asset]);
  const amenityByKey = useMemo(() => Object.fromEntries(amenities.filter((a) => a.objectKey).map((a) => [a.objectKey!, a])), [amenities]);

  const selectedObj = asset?.objects.find((o) => o.objectKey === selectedKey) ?? null;
  const selectedUnit = selectedObj?.unitId ? unitsById[selectedObj.unitId] : null;
  const selectedAmenity = selectedKey ? amenityByKey[selectedKey] : null;

  useEffect(() => {
    setLowPower(detectLowPower());
    if (!webglOk()) setMode("2d");
    track("3d_viewer_open", { project: project.slug });
  }, [project.slug]);

  // Deep link ?unit=142
  useEffect(() => {
    if (!initialUnitNumber) return;
    const u = liveUnits.find((x) => x.number === initialUnitNumber);
    if (u && keyByUnitId[u.id]) setSelectedKey(keyByUnitId[u.id]);
  }, [initialUnitNumber, liveUnits, keyByUnitId]);

  // Live availability: poll every 30s so admin status changes show up without reload.
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/public/projects/${project.slug}/units`, { cache: "no-store" });
        if (r.ok) setLiveUnits(await r.json());
      } catch { /* ignore */ }
    }, 30_000);
    return () => clearInterval(t);
  }, [project.slug]);

  useEffect(() => {
    if (selectedUnit) track("unit_selected", { unit: selectedUnit.number, status: selectedUnit.status, project: project.slug });
    if (selectedUnit?.price) track("price_viewed", { unit: selectedUnit.number, price: selectedUnit.price });
  }, [selectedUnit, project.slug]);

  // Apply status filter by dimming: we pass a filtered unitsById where non-matching units are neutral.
  const displayUnitsById = useMemo(() => {
    if (filter === "ALL") return unitsById;
    const out: Record<string, ViewerUnit> = {};
    for (const [id, u] of Object.entries(unitsById)) out[id] = u.status === filter ? u : { ...u, status: "__DIM__" as never };
    return out;
  }, [unitsById, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { AVAILABLE: 0, RESERVED: 0, SOLD: 0, BLOCKED: 0, HOLD: 0 };
    liveUnits.forEach((u) => { c[u.status] = (c[u.status] ?? 0) + 1; });
    return c;
  }, [liveUnits]);

  const views: CameraView[] = asset?.cameraJson?.views ?? [];

  if (!asset) {
    return (
      <div className="flex h-[60vh] items-center justify-center rounded-2xl bg-sand text-ink/60">
        3D layout is not published for this project yet.
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-sand ${fullscreen ? "h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-4rem)]" : "h-[70vh] min-h-[480px] rounded-2xl border border-ink/10"}`}>
      {mode === "3d" ? (
        <Suspense fallback={<LoadingOverlay />}>
          <Scene
            asset={asset}
            unitsById={displayUnitsById}
            selectedKey={selectedKey}
            hoveredKey={hoveredKey}
            onSelect={setSelectedKey}
            onHover={setHoveredKey}
            view={view}
            lowPower={lowPower}
          />
        </Suspense>
      ) : (
        <Layout2D asset={asset} unitsById={displayUnitsById} selectedKey={selectedKey} onSelect={setSelectedKey} />
      )}

      {/* Top bar: legend/filters + mode toggle + camera views */}
      <div className="pointer-events-none absolute left-2 right-2 top-2 flex flex-col gap-2 sm:left-4 sm:right-4 sm:top-4">
        <div className="flex items-start gap-2">
          {backHref && <a href={backHref} aria-label="Back" className="pointer-events-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/90 shadow backdrop-blur">←</a>}
          <div className="pointer-events-auto flex flex-1 gap-1.5 overflow-x-auto rounded-xl bg-white/90 p-2 shadow backdrop-blur [scrollbar-width:none]">
            <button onClick={() => setFilter("ALL")} className={`badge shrink-0 ${filter === "ALL" ? "bg-ink text-white" : "bg-sand text-ink"}`}>All {liveUnits.length}</button>
            {Object.keys(STATUS_COLORS).map((s) => (
              <button key={s} onClick={() => setFilter(filter === s ? "ALL" : s)} className={`badge shrink-0 gap-1.5 ${filter === s ? "ring-2 ring-ink/40" : ""} bg-sand text-ink`}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_COLORS[s] }} />{STATUS_LABELS[s]} {counts[s] ?? 0}
              </button>
            ))}
          </div>
          <div className="pointer-events-auto flex shrink-0 rounded-xl bg-white/90 p-1 shadow backdrop-blur">
            <button onClick={() => setMode("3d")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "3d" ? "bg-ink text-white" : "text-ink/70"}`}>3D</button>
            <button onClick={() => setMode("2d")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "2d" ? "bg-ink text-white" : "text-ink/70"}`}>2D</button>
          </div>
        </div>
        {mode === "3d" && views.length > 0 && (
          <div className="pointer-events-auto flex gap-1 self-end overflow-x-auto rounded-xl bg-white/90 p-1 shadow backdrop-blur [scrollbar-width:none]">
            {views.map((v) => (
              <button key={v.name} onClick={() => setView({ ...v })} className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium text-ink/80 hover:bg-sand">{v.name}</button>
            ))}
          </div>
        )}
      </div>

      {/* Hint */}
      {!selectedKey && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink/80 px-4 py-1.5 text-xs text-white">
          {mode === "3d" ? (lowPower ? "Drag · Pinch · Tap a plot" : "Drag to rotate · Scroll to zoom · Click a plot") : "Tap a plot to view details"}
        </div>
      )}

      {/* Selection panel */}
      {selectedUnit && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-96 sm:p-0">
          <UnitCard
            unit={selectedUnit}
            project={project}
            onClose={() => setSelectedKey(null)}
            onEnquire={() => setLead({ mode: "ENQUIRY" })}
            onSiteVisit={() => setLead({ mode: "SITE_VISIT" })}
          />
        </div>
      )}
      {selectedAmenity && !selectedUnit && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-80 sm:p-0">
          <div className="card p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-display text-xl">{selectedAmenity.icon} {selectedAmenity.name}</h3>
              <button onClick={() => setSelectedKey(null)} className="text-ink/50">✕</button>
            </div>
            {selectedAmenity.description && <p className="mt-1 text-sm text-ink/70">{selectedAmenity.description}</p>}
          </div>
        </div>
      )}

      <LeadModal
        open={!!lead}
        mode={lead?.mode ?? "ENQUIRY"}
        projectId={project.id}
        projectName={project.name}
        unitId={selectedUnit?.id}
        unitLabel={selectedUnit ? `${selectedUnit.type === "PLOT" ? "Plot" : "Unit"} ${selectedUnit.number}` : null}
        brochureUrl={brochureUrl}
        onClose={() => setLead(null)}
      />
    </div>
  );
}
