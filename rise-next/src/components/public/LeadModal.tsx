"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

export type LeadMode = "ENQUIRY" | "CALLBACK" | "SITE_VISIT" | "GET_PRICE" | "BROCHURE";

interface Props {
  open: boolean;
  mode: LeadMode;
  projectId: string;
  projectName: string;
  unitId?: string | null;
  unitLabel?: string | null;
  brochureUrl?: string | null;
  onClose: () => void;
}

const TITLES: Record<LeadMode, string> = {
  ENQUIRY: "Enquire Now",
  CALLBACK: "Request a Callback",
  SITE_VISIT: "Book a Site Visit",
  GET_PRICE: "Get Best Price",
  BROCHURE: "Download Brochure",
};

function getUtm() {
  if (typeof window === "undefined") return {};
  const q = new URLSearchParams(window.location.search);
  return {
    source: q.get("utm_source") ?? undefined,
    medium: q.get("utm_medium") ?? undefined,
    campaign: q.get("utm_campaign") ?? undefined,
    content: q.get("utm_content") ?? undefined,
  };
}

export default function LeadModal({ open, mode, projectId, projectName, unitId, unitLabel, brochureUrl, onClose }: Props) {
  const [state, setState] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) { setState("idle"); setError(null); track("enquiry_started", { mode, unit: unitLabel ?? undefined }); }
  }, [open, mode, unitLabel]);

  if (!open) return null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    const fd = new FormData(e.currentTarget);
    const base = {
      projectId, unitId: unitId ?? null,
      name: fd.get("name"), phone: fd.get("phone"), email: fd.get("email") || "",
      website: fd.get("website") || "",
      utm: getUtm(), referrer: document.referrer || undefined, landingPage: window.location.href,
    };
    try {
      let res: Response;
      if (mode === "SITE_VISIT") {
        res = await fetch("/api/public/site-visits", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, preferredDate: fd.get("preferredDate"), preferredTime: fd.get("preferredTime") }),
        });
      } else {
        const source = mode === "CALLBACK" ? "CALLBACK" : mode === "GET_PRICE" ? "GET_PRICE" : mode === "BROCHURE" ? "BROCHURE" : "WEBSITE_ENQUIRY";
        res = await fetch("/api/public/leads", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...base, message: fd.get("message") || undefined, source }),
        });
      }
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error ?? "Something went wrong"); }
      setState("done");
      track(mode === "SITE_VISIT" ? "site_visit_requested" : "lead_submitted", { mode, unit: unitLabel ?? undefined, project: projectId });
      if (mode === "BROCHURE" && brochureUrl) { track("brochure_downloaded"); window.open(brochureUrl, "_blank"); }
    } catch (err) {
      setError((err as Error).message);
      setState("error");
    }
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div className="card w-full max-w-md rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 pb-3">
          <div>
            <h3 className="font-display text-2xl">{TITLES[mode]}</h3>
            <p className="text-sm text-ink/60">{projectName}{unitLabel ? ` · ${unitLabel}` : ""}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink/50 hover:bg-sand">✕</button>
        </div>
        {state === "done" ? (
          <div className="p-5 pt-0">
            <div className="rounded-xl bg-brand-light p-4 text-sm text-brand-dark">
              <p className="font-semibold">Thank you! Our sales team will contact you shortly.</p>
              {mode === "SITE_VISIT" && <p className="mt-1">Your site visit request has been recorded. We&apos;ll confirm the slot by call/WhatsApp.</p>}
            </div>
            <button onClick={onClose} className="btn-primary mt-4 w-full">Close</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3 p-5 pt-0">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
            <div><label className="label">Name</label><input name="name" required minLength={2} className="input" placeholder="Your full name" /></div>
            <div><label className="label">Phone</label><input name="phone" required type="tel" pattern="^\+?[0-9\s-]{8,15}$" className="input" placeholder="+91 98765 43210" /></div>
            <div><label className="label">Email (optional)</label><input name="email" type="email" className="input" placeholder="you@example.com" /></div>
            {mode === "SITE_VISIT" ? (
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Preferred date</label><input name="preferredDate" type="date" required min={tomorrow} defaultValue={tomorrow} className="input" /></div>
                <div>
                  <label className="label">Preferred time</label>
                  <select name="preferredTime" className="input" defaultValue="11:00 AM">
                    {["09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div><label className="label">Message (optional)</label><textarea name="message" rows={3} className="input" placeholder="Tell us what you're looking for" /></div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={state === "submitting"} className="btn-primary w-full">
              {state === "submitting" ? "Submitting…" : TITLES[mode]}
            </button>
            <p className="text-center text-[11px] text-ink/50">By submitting you agree to be contacted by the sales team.</p>
          </form>
        )}
      </div>
    </div>
  );
}
