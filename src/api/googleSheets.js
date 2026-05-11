// Replace with the URL from Google Apps Script deployment
export const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyVTiLfdYc8utGAqQLBGahhQ8JyvMxagkKQ-Wt7lpkkomU2vMxU8VR9TdH-fUSqVmab/exec";

// ─── Client-side Cache ─────────────────────────────────────
const CACHE_KEY = "cleanScore_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedData() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    // Check TTL
    if (Date.now() - cached.ts > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    // localStorage full or unavailable — ignore
  }
}

export function invalidateCache() {
  localStorage.removeItem(CACHE_KEY);
}

// ─── Fetch with timeout ────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...options, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Main API ──────────────────────────────────────────────

/**
 * fetchScores — returns data as fast as possible:
 *  1) If cache exists & fresh → return cache instantly
 *  2) Otherwise → fetch from GAS (with 15s timeout)
 *  3) Always update cache on success
 */
export const fetchScores = async (forceRefresh = false) => {
  if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") {
    console.warn("Please update WEB_APP_URL in src/api/googleSheets.js");
    return [];
  }

  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) return cached;
  }

  try {
    const response = await fetchWithTimeout(WEB_APP_URL, {}, 15000);
    const result = await response.json();
    if (result.status === "success") {
      setCachedData(result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error("Error fetching scores:", error);
    const stale = getCachedData();
    if (stale) return stale;
    return [];
  }
};

export const prefetchScores = async () => {
  try {
    const response = await fetchWithTimeout(WEB_APP_URL, {}, 15000);
    const result = await response.json();
    if (result.status === "success") {
      setCachedData(result.data);
      return result.data;
    }
  } catch {
    // silent fail
  }
  return null;
};

/**
 * Trigger manual cache rebuild on GAS side
 */
export const rebuildServerCache = async () => {
  try {
    const response = await fetchWithTimeout(`${WEB_APP_URL}?action=rebuild`, {}, 30000);
    const result = await response.json();
    if (result.status === "success") {
      setCachedData(result.data);
      return result;
    }
    return result;
  } catch (error) {
    return { status: "error", message: error.message };
  }
};

export const checkRoomStatus = async (room, date) => {
  if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") return { isChecked: false };
  
  try {
    const response = await fetchWithTimeout(
      `${WEB_APP_URL}?action=check&room=${encodeURIComponent(room)}&date=${date}`,
      {},
      10000
    );
    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error checking status:", error);
    return { isChecked: false };
  }
};

export const submitScore = async (room, score) => {
  if (WEB_APP_URL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL") return { status: "error" };
  
  try {
    const response = await fetchWithTimeout(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ room, score }),
      headers: { "Content-Type": "text/plain;charset=utf-8" }
    }, 20000);
    const result = await response.json();
    if (result.status === "success") invalidateCache();
    return result;
  } catch (error) {
    return { status: "error", message: error.message };
  }
};
