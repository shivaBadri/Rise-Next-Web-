export function formatINR(value: number | string | null | undefined): string {
  if (value == null) return "Price on request";
  const n = typeof value === "string" ? Number(value) : value;
  if (!isFinite(n)) return "Price on request";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, "")} Lakhs`;
  return `₹${n.toLocaleString("en-IN")}`;
}

export function formatNumber(n: number | string | null | undefined) {
  if (n == null) return "—";
  return Number(n).toLocaleString("en-IN");
}

export const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "#22c55e",
  RESERVED: "#eab308",
  SOLD: "#ef4444",
  BLOCKED: "#3b82f6",
  HOLD: "#a855f7",
};

export const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  RESERVED: "Reserved",
  SOLD: "Sold",
  BLOCKED: "Blocked",
  HOLD: "On Hold",
};

export function facingLabel(f?: string | null) {
  if (!f) return "—";
  return f.split("_").map((s) => s[0] + s.slice(1).toLowerCase()).join("-");
}

export function unitLabel(u: { type: string; number: string }) {
  const prefix = { PLOT: "Plot", VILLA: "Villa", APARTMENT: "Flat", COMMERCIAL: "Unit" }[u.type] ?? "Unit";
  return `${prefix} ${u.number}`;
}

export function whatsappLink(number: string | null | undefined, text: string) {
  if (!number) return "#";
  return `https://wa.me/${number.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
