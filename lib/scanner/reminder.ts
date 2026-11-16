const KEY = "byteclean:yellow-review-at";
const MONTH_IN_MS = 30 * 24 * 60 * 60 * 1000;

export function scheduleYellowReview(now: number) {
  try {
    localStorage.setItem(KEY, String(now + MONTH_IN_MS));
    if (typeof window !== "undefined") window.dispatchEvent(new Event("byteclean-reminder-updated"));
  } catch { /* Local storage may be unavailable. */ }
}

export function yellowReviewIsDue(now: number) {
  try {
    const due = Number(localStorage.getItem(KEY));
    return due > 0 && now >= due;
  } catch { return false; }
}
