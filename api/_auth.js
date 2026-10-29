// Shared-password sign-in with a signed, HttpOnly session cookie.
// To move to City SSO later, replace isEditor() and the login endpoint;
// the rest of the app only calls isEditor().
import crypto from "node:crypto";

const COOKIE = "nycem_editor";
const HOURS = 12;

function secret() {
  return process.env.SESSION_SECRET || process.env.ADMIN_PASSWORD || "";
}

function sign(value) {
  return crypto.createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

export function passwordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function checkPassword(input) {
  return passwordConfigured() && safeEqual(input || "", process.env.ADMIN_PASSWORD);
}

export function sessionCookie() {
  const exp = String(Date.now() + HOURS * 3600 * 1000);
  const secure = process.env.VERCEL ? "; Secure" : "";
  return `${COOKIE}=${exp}.${sign(exp)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${HOURS * 3600}${secure}`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export function isEditor(req) {
  if (!passwordConfigured()) return false;
  const raw = (req.headers.cookie || "").split(/;\s*/).find(c => c.startsWith(COOKIE + "="));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split(".");
  if (!exp || !sig || !safeEqual(sig, sign(exp))) return false;
  return Number(exp) > Date.now();
}
