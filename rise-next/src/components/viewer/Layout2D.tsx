"use client";
/**
 * 2D fallback: renders the procedural geometry (top view) as an SVG.
 * Used on devices without WebGL or when the user toggles "2D".
 * When a GLB is in use, the admin should still provide geomJson for a 2D plan
 * (or a plan image) — here we render whatever geomJson exists.
 */
import { useMemo } from "react";
import { STATUS_COLORS } from "@/lib/format";
import type { ViewerAsset, ViewerUnit } from "./types";
import type { Geom } from "@/lib/demo-layout";

export default function Layout2D({
  asset, unitsById, selectedKey, onSelect,
}: {
  asset: ViewerAsset; unitsById: Record<string, ViewerUnit>; selectedKey: string | null; onSelect: (k: string | null) => void;
}) {
  const objects = asset.objects.filter((o) => o.geomJson);
  const bounds = useMemo(() => {
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const o of objects) {
      const g = o.geomJson as Geom;
      const [x, , z] = g.position;
      const hw = g.shape === "box" ? g.size[0] / 2 : g.radius;
      const hd = g.shape === "box" ? g.size[2] / 2 : g.radius;
      minX = Math.min(minX, x - hw); maxX = Math.max(maxX, x + hw);
      minZ = Math.min(minZ, z - hd); maxZ = Math.max(maxZ, z + hd);
    }
    if (!isFinite(minX)) return { minX: -100, maxX: 100, minZ: -100, maxZ: 100 };
    return { minX: minX - 6, maxX: maxX + 6, minZ: minZ - 6, maxZ: maxZ + 6 };
  }, [objects]);

  if (objects.length === 0) {
    return <div className="flex h-full items-center justify-center text-ink/60">2D plan not available for this model.</div>;
  }

  const w = bounds.maxX - bounds.minX, h = bounds.maxZ - bounds.minZ;

  return (
    <svg viewBox={`${bounds.minX} ${bounds.minZ} ${w} ${h}`} className="h-full w-full touch-pan-x touch-pan-y bg-[#9bc48d]" onClick={() => onSelect(null)}>
      {[...objects].sort((a) => (a.kind === "UNIT" ? 1 : -1)).map((o) => {
        const g = o.geomJson as Geom;
        const [x, , z] = g.position;
        const unit = o.unitId ? unitsById[o.unitId] : undefined;
        const interactive = o.kind === "UNIT" || o.kind === "AMENITY";
        const fill = unit ? STATUS_COLORS[unit.status] ?? "#cbd5e1" : g.color ?? (o.kind === "AMENITY" ? "#d4a373" : "#cbd5e1");
        const sel = selectedKey === o.objectKey;
        const common = {
          fill, stroke: sel ? "#0f172a" : "rgba(15,23,42,0.35)", strokeWidth: sel ? 1.2 : 0.3,
          style: { cursor: interactive ? "pointer" : "default" },
          onClick: (e: React.MouseEvent) => { if (interactive) { e.stopPropagation(); onSelect(o.objectKey); } },
        };
        return (
          <g key={o.objectKey}>
            {g.shape === "box"
              ? <rect x={x - g.size[0] / 2} y={z - g.size[2] / 2} width={g.size[0]} height={g.size[2]} rx={0.6} {...common} />
              : <circle cx={x} cy={z} r={g.radius} {...common} />}
            {unit && (
              <text x={x} y={z + 1.2} textAnchor="middle" fontSize={g.shape === "box" ? Math.min(g.size[0], g.size[2]) * 0.32 : 3} fill="#0f172a" fontWeight={600} pointerEvents="none">
                {unit.number}
              </text>
            )}
            {o.kind === "AMENITY" && g.shape === "box" && (
              <text x={x} y={z + 1.5} textAnchor="middle" fontSize={3} fill="#0f172a" pointerEvents="none">{o.objectKey.replace(/_/g, " ")}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
