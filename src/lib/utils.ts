import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { TrackingData } from "@/lib/tracking";
import { cloudEnabled } from "@/lib/cloud";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function encodeTrackingData(data: TrackingData): string {
  const json = JSON.stringify(data);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeTrackingData(base64: string): TrackingData | null {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function buildShareLink(data: TrackingData): string {
  let base = import.meta.env.VITE_PUBLIC_BASE_URL || window.location.origin;
  if (typeof window !== "undefined" && window.localStorage) {
    const configured = window.localStorage.getItem("publicBaseUrl");
    if (configured) base = configured;
  }
  if (cloudEnabled) {
    const code = (data.code || "").toUpperCase();
    const payload = encodeTrackingData(data);
    return `${base}/?code=${encodeURIComponent(code)}&data=${encodeURIComponent(payload)}`;
  }
  const payload = encodeTrackingData(data);
  return `${base}/?data=${encodeURIComponent(payload)}`;
}
