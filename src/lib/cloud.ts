import { createClient } from "@supabase/supabase-js";
import type { TrackingData } from "@/lib/tracking";
import { firebaseEnabled, fbFetchTrackingByCode, fbSaveTrackingToCloud } from "@/lib/firebase";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const tableEnv = import.meta.env.VITE_SUPABASE_TABLE as string | undefined;

const supabaseEnabled = !!url && !!key;
export const cloudEnabled = supabaseEnabled || firebaseEnabled;

const supabase = supabaseEnabled ? createClient(url!, key!) : null;

export async function fetchTrackingByCode(code: string): Promise<TrackingData | null> {
  if (!cloudEnabled) return null;
  if (supabaseEnabled && supabase) {
  const normalized = code.toUpperCase();
  // Try primary table
  const primaryTable = tableEnv || "tracking";
  const { data, error } = await supabase
    .from(primaryTable)
    .select("data")
    .eq("code", normalized)
    .maybeSingle();
  if (!error && data) return (data.data as TrackingData) ?? null;
  // Fallback to legacy table name
  const fallbackTable = primaryTable === "tracking" ? "tracking_data" : "tracking";
  const { data: data2, error: error2 } = await supabase
    .from(fallbackTable)
    .select("data")
    .eq("code", normalized)
    .maybeSingle();
  if (error2) return null;
  return (data2?.data as TrackingData) ?? null;
  }
  if (firebaseEnabled) {
    return fbFetchTrackingByCode(code);
  }
  return null;
}

export async function saveTrackingToCloud(tracking: TrackingData): Promise<boolean> {
  if (!cloudEnabled) return false;
  if (supabaseEnabled && supabase) {
  const payload = { code: tracking.code.toUpperCase(), data: tracking };
  const primaryTable = tableEnv || "tracking";
  const { error } = await supabase.from(primaryTable).upsert(payload, { onConflict: "code" });
  if (!error) return true;
  const fallbackTable = primaryTable === "tracking" ? "tracking_data" : "tracking";
  const { error: error2 } = await supabase.from(fallbackTable).upsert(payload, { onConflict: "code" });
  return !error2;
  }
  if (firebaseEnabled) {
    return fbSaveTrackingToCloud(tracking);
  }
  return false;
}
