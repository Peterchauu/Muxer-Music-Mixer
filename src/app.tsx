import React, { useState } from "react";
import { parseBlob } from "music-metadata";

type TrackInfo = {
  name: string;
  coverDataUrl: string; 
  duration?: number; 
};

const DEFAULT_COVER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 24 24' fill='none' stroke='#444' stroke-width='1.2'><rect width='24' height='24' rx='2' fill='#f3f3f3'/><path d='M7 9v6a2 2 0 0 0 2 2h6' stroke-linecap='round' stroke-linejoin='round'/><circle cx='9' cy='9' r='1.6' fill='#444'/><path d='M15 8v6' stroke-linecap='round'/></svg>`
  );

export default function App() {
  const [trackA, setTrackA] = useState<TrackInfo | null>(null);
  const [trackB, setTrackB] = useState<TrackInfo | null>(null);

  async function handleFile(file: File): Promise<TrackInfo> {
    const defaultInfo: TrackInfo = {
      name: file.name,
      coverDataUrl: DEFAULT_COVER,
    };

    try {
      const mm = await parseBlob(file);
      const duration = mm.format.duration ?? undefined;

      const pictures = mm.common.picture;
      if (pictures && pictures.length > 0) {
        const pic = pictures[0];
        const blob = new Blob([pic.data as Uint8Array<ArrayBuffer>], { type: pic.format || "image/jpeg" });
        const dataUrl = await blobToDataURL(blob);
        return { name: file.name, coverDataUrl: dataUrl, duration };
      }

      return { name: file.name, coverDataUrl: DEFAULT_COVER, duration };
    } catch (err) {
      return defaultInfo;
    }
  }

  function blobToDataURL(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async function onChangeA(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const info = await handleFile(file);
    setTrackA(info);
  }

  async function onChangeB(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const info = await handleFile(file);
    setTrackB(info);
  }

  return (
    <div style={{ fontFamily: "Inter, system-ui, sans-serif", padding: 24 }}>
      <h3>Audio Uploads</h3>

      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ width: 320, border: "1px solid #e6e6e6", padding: 12, borderRadius: 8 }}>
          <h4>Audio A</h4>
          <input
            accept=".mp3, .mp4, audio/*"
            type="file"
            onChange={onChangeA}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
            <img
              src={trackA?.coverDataUrl ?? DEFAULT_COVER}
              alt="cover"
              style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 6, background: "#fff" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{trackA?.name ?? "No file selected"}</div>
              <div style={{ color: "#666", marginTop: 6 }}>
                {trackA?.duration ? `Duration: ${formatDuration(trackA.duration)}` : "Duration: —"}
              </div>
              <div style={{ marginTop: 10 }}>
                <button disabled style={{ padding: "6px 12px", borderRadius: 6 }}>Play</button>
                <button disabled style={{ padding: "6px 12px", marginLeft: 8, borderRadius: 6 }}>More</button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ width: 320, border: "1px solid #e6e6e6", padding: 12, borderRadius: 8 }}>
          <h4>Audio B</h4>
          <input
            accept=".mp3, .mp4, audio/*"
            type="file"
            onChange={onChangeB}
          />
          <div style={{ marginTop: 12, display: "flex", gap: 12, alignItems: "center" }}>
            <img
              src={trackB?.coverDataUrl ?? DEFAULT_COVER}
              alt="cover"
              style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 6, background: "#fff" }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{trackB?.name ?? "No file selected"}</div>
              <div style={{ color: "#666", marginTop: 6 }}>
                {trackB?.duration ? `Duration: ${formatDuration(trackB.duration)}` : "Duration: —"}
              </div>
              <div style={{ marginTop: 10 }}>
                <button disabled style={{ padding: "6px 12px", borderRadius: 6 }}>Play</button>
                <button disabled style={{ padding: "6px 12px", marginLeft: 8, borderRadius: 6 }}>More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDuration(seconds?: number) {
  if (!seconds || isNaN(seconds)) return "—";
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}