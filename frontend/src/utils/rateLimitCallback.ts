let rateLimitCallback: (() => void) | null = null;
let retryAfterSeconds = 5;

export function setRateLimitCallback(callback: () => void, seconds: number = 5) {
  rateLimitCallback = callback;
  retryAfterSeconds = seconds;
}

export function clearRateLimitCallback() {
  rateLimitCallback = null;
}

export function getRateLimitCallback() {
  return rateLimitCallback;
}

export function getRetryAfterSeconds() {
  return retryAfterSeconds;
}

export default { setRateLimitCallback, clearRateLimitCallback, getRateLimitCallback, getRetryAfterSeconds };