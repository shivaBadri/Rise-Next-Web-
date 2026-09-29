"use client";
import { useTransition } from "react";
import { quickStatusAction } from "@/app/admin/actions";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/format";
export default function StatusSelect({ projectId, unitId, status }: { projectId: string; unitId: string; status: string }) {
  const [pending, start] = useTransition();
  return (
    <select defaultValue={status} disabled={pending} onChange={(e) => start(() => quickStatusAction(projectId, unitId, e.target.value))}
      className="rounded-full border-0 px-2.5 py-1 text-xs font-semibold text-white" style={{ background: STATUS_COLORS[status] }}>
      {Object.keys(STATUS_LABELS).map((s) => <option key={s} value={s} className="text-ink">{STATUS_LABELS[s]}</option>)}
    </select>
  );
}
