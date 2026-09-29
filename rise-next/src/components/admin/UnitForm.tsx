"use client";
import { useState } from "react";
import { saveUnitAction } from "@/app/admin/actions";
type U = Record<string, unknown> & { id?: string };
export default function UnitForm({ projectId, unit, buildings }: { projectId: string; unit?: U; buildings: { id: string; name: string }[] }) {
  const [error, setError] = useState<string | null>(null);
  const u = unit ?? {};
  const v = (k: string) => (u[k] == null ? "" : String(u[k]));
  return (
    <form action={async (fd) => { const r = await saveUnitAction(projectId, unit?.id ?? null, fd); if (r?.error) setError(r.error); }} className="card grid gap-4 p-5 sm:grid-cols-3">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 sm:col-span-3">{error}</p>}
      <div><label className="label">Type</label><select name="type" defaultValue={v("type") || "PLOT"} className="input">{["PLOT", "VILLA", "APARTMENT", "COMMERCIAL"].map((o) => <option key={o}>{o}</option>)}</select></div>
      <div><label className="label">Number</label><input name="number" required defaultValue={v("number")} className="input" placeholder="142 / A101 / V-101" /></div>
      <div><label className="label">Status</label><select name="status" defaultValue={v("status") || "AVAILABLE"} className="input">{["AVAILABLE", "RESERVED", "SOLD", "BLOCKED", "HOLD"].map((o) => <option key={o}>{o}</option>)}</select></div>
      <div><label className="label">Building (apartments)</label><select name="buildingId" defaultValue={v("buildingId")} className="input"><option value="">—</option>{buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
      <div><label className="label">Floor</label><input name="floor" type="number" defaultValue={v("floor")} className="input" /></div>
      <div><label className="label">Facing</label><select name="facing" defaultValue={v("facing")} className="input"><option value="">—</option>{["NORTH", "SOUTH", "EAST", "WEST", "NORTH_EAST", "NORTH_WEST", "SOUTH_EAST", "SOUTH_WEST"].map((o) => <option key={o}>{o}</option>)}</select></div>
      <div><label className="label">Area</label><input name="area" type="number" step="0.01" required defaultValue={v("area")} className="input" /></div>
      <div><label className="label">Area unit</label><select name="areaUnit" defaultValue={v("areaUnit") || "Sq. Yd"} className="input"><option>Sq. Yd</option><option>Sq. Ft</option><option>Sq. M</option></select></div>
      <div><label className="label">Dimensions</label><input name="dimensions" defaultValue={v("dimensions")} className="input" placeholder="30 x 45 ft" /></div>
      <div><label className="label">Price (₹)</label><input name="price" type="number" defaultValue={v("price")} className="input" /></div>
      <div><label className="label">Price per unit (₹)</label><input name="pricePerUnit" type="number" defaultValue={v("pricePerUnit")} className="input" /></div>
      <label className="flex items-center gap-2 self-end pb-2 text-sm"><input type="checkbox" name="isCorner" defaultChecked={!!u.isCorner} /> Corner plot</label>
      <div><label className="label">Bedrooms</label><input name="bedrooms" type="number" defaultValue={v("bedrooms")} className="input" /></div>
      <div><label className="label">Bathrooms</label><input name="bathrooms" type="number" defaultValue={v("bathrooms")} className="input" /></div>
      <div className="sm:col-span-3"><label className="label">Description</label><textarea name="description" rows={3} defaultValue={v("description")} className="input" /></div>
      <div className="sm:col-span-3"><button className="btn-primary">Save unit</button></div>
    </form>
  );
}
