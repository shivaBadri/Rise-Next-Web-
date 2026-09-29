"use client";
import { useState } from "react";
/** Unsigned Cloudinary upload → fills a hidden/text input with the delivery URL. Falls back to manual URL entry when not configured. */
export default function CloudinaryUpload({ name }: { name: string }) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const [url, setUrl] = useState(""); const [busy, setBusy] = useState(false);
  async function upload(file: File) {
    if (!cloud || !preset) return;
    setBusy(true);
    const fd = new FormData(); fd.append("file", file); fd.append("upload_preset", preset);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/auto/upload`, { method: "POST", body: fd });
    const j = await r.json(); setUrl(j.secure_url ?? ""); setBusy(false);
  }
  return (
    <div className="flex gap-2">
      <input name={name} required value={url} onChange={(e) => setUrl(e.target.value)} className="input mt-0" placeholder="https://res.cloudinary.com/…" />
      {cloud && preset && <label className="btn-outline cursor-pointer whitespace-nowrap">{busy ? "Uploading…" : "Upload"}<input type="file" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} /></label>}
    </div>
  );
}
