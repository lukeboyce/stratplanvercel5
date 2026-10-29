// GET    /api/session  -> { editor, configured }
// POST   /api/session  -> { password }  sign in
// DELETE /api/session  -> sign out
import { isEditor, checkPassword, passwordConfigured, sessionCookie, clearCookie } from "./_auth.js";
import { hasDatabase } from "./_store.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method === "GET") {
    return res.status(200).json({ editor: isEditor(req), configured: passwordConfigured(), database: hasDatabase() || !process.env.VERCEL });
  }
  if (req.method === "POST") {
    if (!passwordConfigured()) return res.status(503).json({ error: "Editor sign-in isn't set up. Add ADMIN_PASSWORD in Vercel (see README)." });
    if (!checkPassword(req.body && req.body.password)) return res.status(401).json({ error: "That password isn't correct." });
    res.setHeader("Set-Cookie", sessionCookie());
    return res.status(200).json({ editor: true });
  }
  if (req.method === "DELETE") {
    res.setHeader("Set-Cookie", clearCookie());
    return res.status(200).json({ editor: false });
  }
  res.setHeader("Allow", "GET, POST, DELETE");
  return res.status(405).json({ error: "Method not allowed." });
}
