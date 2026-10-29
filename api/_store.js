// Storage for the plan data.
// Production: Upstash Redis (add it from the Vercel Marketplace; Vercel sets the env vars).
// Local dev (node dev.js): in-memory copy, reset on restart.
import seed from "./_plan-data.js";

const KEY = "nycem:strategic-plan";
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

let memory = null;

export function hasDatabase() {
  return Boolean(URL && TOKEN);
}

export function readSeed() {
  return structuredClone(seed);
}

async function redis(command) {
  const r = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!r.ok) throw new Error(`Redis error ${r.status}`);
  return (await r.json()).result;
}

export async function getPlan() {
  if (hasDatabase()) {
    const raw = await redis(["GET", KEY]);
    return raw ? JSON.parse(raw) : readSeed();
  }
  return memory || readSeed();
}

export async function savePlan(plan) {
  if (hasDatabase()) {
    await redis(["SET", KEY, JSON.stringify(plan)]);
    return;
  }
  if (process.env.VERCEL) {
    const e = new Error("No database connected");
    e.status = 503;
    throw e;
  }
  memory = plan;
}
