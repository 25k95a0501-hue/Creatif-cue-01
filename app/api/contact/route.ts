import { createHash } from "node:crypto";

export const runtime = "nodejs";

const WINDOW_SECONDS = 15 * 60;
const MAX_REQUESTS = 5;
const MAX_BODY_BYTES = 16_000;
const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

const allowedAnswers = {
  projectType: ["Brand Identity", "Website", "Social Media", "AI & Motion", "Something Else"],
  personality: ["Bold & Expressive", "Minimal & Refined", "Playful & Fun", "Premium & Elegant"],
  timing: ["As soon as possible", "Within a month", "Just exploring"],
} as const;

type ContactSubmission = {
  name: string;
  email: string;
  phone: string;
  message: string;
  consent: boolean;
  website: string;
  quiz: Record<string, string>;
};

function jsonError(status: number, error: string, extraHeaders?: HeadersInit) {
  return Response.json({ error }, { status, headers: extraHeaders });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readText(value: unknown, maximum: number): string | null {
  if (typeof value !== "string" || value.length > maximum) return null;
  return value.trim();
}

function validateSubmission(value: unknown): ContactSubmission | string {
  if (!isRecord(value)) return "Please check your enquiry and try again.";

  const name = readText(value.name, 100);
  const email = readText(value.email, 254);
  const phone = value.phone === undefined ? "" : readText(value.phone, 40);
  const message = value.message === undefined ? "" : readText(value.message, 5000);

  if (!name || name.length < 2) return "Please enter your full name.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "Please enter a valid email address.";
  if (phone === null || message === null) return "One or more fields are too long. Please shorten your response and try again.";
  if (typeof value.consent !== "boolean" || !value.consent) return "Please agree to the enquiry privacy notice before sending.";
  if (typeof value.website !== "string") return "Please check the form and try again.";
  if (value.website.trim()) return "The enquiry could not be accepted. Please check the form and try again.";

  const quiz: Record<string, string> = {};
  if (value.quiz !== undefined) {
    if (!isRecord(value.quiz)) return "Please check your creative brief answers and try again.";
    for (const key of Object.keys(value.quiz)) {
      if (!Object.hasOwn(allowedAnswers, key)) return "Please check your creative brief answers and try again.";
    }
    for (const [key, answer] of Object.entries(value.quiz)) {
      const choices = allowedAnswers[key as keyof typeof allowedAnswers] as readonly string[];
      if (typeof answer !== "string" || !choices.includes(answer)) return "Please check your creative brief answers and try again.";
      quiz[key] = answer;
    }
  }

  return { name, email, phone, message, consent: true, website: "", quiz };
}

function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("x-real-ip")?.trim() || forwarded || "unknown";
}

async function takeDistributedRateLimit(address: string): Promise<boolean> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("A shared rate-limit store is required in production.");
    }

    const now = Date.now();
    const key = createHash("sha256").update(address).digest("hex");
    const current = memoryBuckets.get(key);
    if (memoryBuckets.size > 5000) {
      for (const [bucketKey, bucket] of memoryBuckets) {
        if (bucket.expiresAt <= now) memoryBuckets.delete(bucketKey);
      }
    }
    if (memoryBuckets.size >= 10_000 && !current) return false;
    if (!current || current.expiresAt <= now) {
      memoryBuckets.set(key, { count: 1, expiresAt: now + WINDOW_SECONDS * 1000 });
      return true;
    }
    if (current.count >= MAX_REQUESTS) return false;
    current.count += 1;
    return true;
  }

  const key = createHash("sha256").update(address).digest("hex");
  const script = "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; local ttl = redis.call('TTL', KEYS[1]); return {count, ttl}";
  const response = await fetch(redisUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(["EVAL", script, "1", `creatif-cue:contact:${key}`, String(WINDOW_SECONDS)]),
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("The shared rate-limit store returned an error.");

  const result: unknown = await response.json();
  if (!isRecord(result) || !Array.isArray(result.result) || typeof result.result[0] !== "number") {
    throw new Error("The shared rate-limit store returned an invalid response.");
  }
  return result.result[0] <= MAX_REQUESTS;
}

export async function POST(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return jsonError(413, "Your enquiry is too large. Please shorten it and try again.");

  const reader = request.body?.getReader();
  if (!reader) return jsonError(400, "Please send a valid enquiry form.");

  let bodySize = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bodySize += value.byteLength;
      if (bodySize > MAX_BODY_BYTES) {
        await reader.cancel();
        return jsonError(413, "Your enquiry is too large. Please shorten it and try again.");
      }
      chunks.push(value);
    }
  } catch {
    return jsonError(400, "The enquiry could not be read. Please try again.");
  }

  const body = new Uint8Array(bodySize);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(body));
  } catch {
    return jsonError(400, "Please send a valid enquiry form.");
  }

  const submission = validateSubmission(payload);
  if (typeof submission === "string") return jsonError(400, submission);

  let withinRateLimit: boolean;
  try {
    withinRateLimit = await takeDistributedRateLimit(clientAddress(request));
  } catch {
    console.error("Contact enquiry rate-limit service request failed.");
    return jsonError(503, "The enquiry service is temporarily unavailable. Your details have not been sent; please try again later.");
  }
  if (!withinRateLimit) {
    return jsonError(429, "Too many enquiries have been sent from this connection. Please wait a little before trying again.", {
      "Retry-After": String(WINDOW_SECONDS),
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_TO_EMAIL;
  const sender = process.env.CONTACT_FROM_EMAIL;
  if (!apiKey || !recipient || !sender) {
    return jsonError(503, "Enquiry delivery is not configured yet. Your details have not been stored or sent.");
  }

  const quizText = Object.entries(submission.quiz)
    .map(([key, answer]) => `${key}: ${answer}`)
    .join("\n");
  const text = [
    "A new enquiry was submitted through the Creatif Cue website.",
    "",
    `Name: ${submission.name}`,
    `Email: ${submission.email}`,
    `Phone: ${submission.phone || "Not provided"}`,
    "",
    "Project details:",
    submission.message || "Not provided",
    "",
    "Creative brief:",
    quizText || "Not completed",
  ].join("\n");

  let delivery: Response;
  try {
    delivery = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: submission.email,
        subject: "New Creatif Cue website enquiry",
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    console.error("Contact enquiry email delivery request failed.");
    return jsonError(502, "We couldn't confirm delivery of your enquiry. Please try again later.");
  }

  if (!delivery.ok) {
    console.error(`Contact enquiry email provider returned HTTP ${delivery.status}.`);
    return jsonError(502, "We couldn't confirm delivery of your enquiry. Please try again later.");
  }

  return Response.json({ message: "Thanks for getting in touch. Your enquiry has been sent successfully." });
}
