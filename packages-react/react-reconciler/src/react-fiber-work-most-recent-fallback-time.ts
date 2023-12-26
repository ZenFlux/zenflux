import { unstable_now as now } from "@zenflux/react-scheduler";

// The most recent time we either committed a fallback, or when a fallback was
// filled in with the resolved UI. This lets us throttle the appearance of new
// content as it streams in, to minimize jank.
// TODO: Think of a better name for this variable?
let globalMostRecentFallbackTime: number = 0;

const FALLBACK_THROTTLE_MS: number = 300;

export function isGlobalMostRecentFallbackNotExceeded() {
    return now() - globalMostRecentFallbackTime < FALLBACK_THROTTLE_MS;
}

export function getTimeMostRecentFallbackThrottleEnd() {
    return globalMostRecentFallbackTime + FALLBACK_THROTTLE_MS - now();
}

export function markGlobalMostRecentFallbackTime() {
    globalMostRecentFallbackTime = now();
}
