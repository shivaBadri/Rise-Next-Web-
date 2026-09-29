"use client";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
export default function TrackView({ slug }: { slug: string }) {
  useEffect(() => { track("project_view", { project: slug }); }, [slug]);
  return null;
}
