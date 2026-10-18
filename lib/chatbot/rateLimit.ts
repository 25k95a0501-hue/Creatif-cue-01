import { createHash } from "node:crypto";

export const CHAT_RATE_LIMIT_MAX_REQUESTS = 20;
export const CHAT_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

function clientAddress(request: Request): string {
  const address = request.headers.get("x-real-ip")?.trim()
    || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || "unknown";
  return createHash("sha256").update(address.slice(0, 200)).digest("hex");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function takeChatRateLimit(request: Request): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const key = clientAddress(request);

  if (!url || !token) {
    if (process.env.NODE_ENV === "production") throw new Error("Persistent chat rate limiting is not configured.");
    const now = Date.now();
    if (memoryBuckets.size > 5_000) {
      for (const [bucketKey, bucket] of memoryBuckets) {
        if (bucket.expiresAt <= now) memoryBuckets.delete(bucketKey);
      }
    }
    const bucket = memoryBuckets.get(key);
    if (!bucket || bucket.expiresAt <= now) {
      if (memoryBuckets.size >= 10_000 && !bucket) return false;
      memoryBuckets.set(key, { count: 1, expiresAt: now + CHAT_RATE_LIMIT_WINDOW_SECONDS * 1000 });
      return true;
    }
    if (bucket.count >= CHAT_RATE_LIMIT_MAX_REQUESTS) return false;
    bucket.count += 1;
    return true;
  }

  const script = "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count";
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", script, "1", `creatif-cue:chat:${key}`, String(CHAT_RATE_LIMIT_WINDOW_SECONDS)]),
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("The chat rate-limit store returned an error.");
  const payload: unknown = await response.json();
  if (!isRecord(payload) || typeof payload.result !== "number") throw new Error("The chat rate-limit store returned an invalid response.");
  return payload.result <= CHAT_RATE_LIMIT_MAX_REQUESTS;
}
