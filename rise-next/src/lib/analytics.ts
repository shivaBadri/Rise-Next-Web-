"use client";
// Unified marketing event dispatcher: GA4 (gtag), GTM dataLayer, Meta Pixel, Google Ads.
export type MarketingEvent =
  | "project_view" | "3d_viewer_open" | "unit_selected" | "price_viewed"
  | "enquiry_started" | "lead_submitted" | "whatsapp_click" | "site_visit_requested" | "brochure_downloaded";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export function track(event: MarketingEvent, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try {
    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({ event, ...params });
    window.gtag?.("event", event, params);
    if (window.fbq) {
      if (event === "lead_submitted" || event === "site_visit_requested") window.fbq("track", "Lead", params);
      else window.fbq("trackCustom", event, params);
    }
    const conv = process.env.NEXT_PUBLIC_GADS_CONVERSION_ID;
    if (conv && (event === "lead_submitted" || event === "site_visit_requested")) {
      window.gtag?.("event", "conversion", { send_to: conv, ...params });
    }
  } catch {
    /* never break UX for analytics */
  }
}
