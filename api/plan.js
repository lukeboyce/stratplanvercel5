// GET  /api/plan  -> current plan (public)
// PUT  /api/plan  -> { changes: { "<tactic id>": "<status>" } }  (editors only)
import { getPlan, savePlan } from "./_store.js";
import { isEditor } from "./_auth.js";

const STATUSES = ["Completed", "In Progress", "Paused", "Not Started"];

function todayInNewYork() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store");
      return res.status(200).json(await getPlan());
    }

    if (req.method === "PUT") {
      if (!isEditor(req)) return res.status(401).json({ error: "Sign in to publish updates." });
      const changes = req.body && req.body.changes;
      if (!changes || typeof changes !== "object") return res.status(400).json({ error: "No changes sent." });

      const plan = await getPlan();
      const byId = new Map(plan.goals.flatMap(g => g.objectives.flatMap(o => o.tactics)).map(t => [t.id, t]));
      let applied = 0;
      for (const [id, status] of Object.entries(changes)) {
        const t = byId.get(id);
        if (!t) return res.status(400).json({ error: `Unknown tactic ${id}.` });
        if (!STATUSES.includes(status)) return res.status(400).json({ error: `Invalid status for ${id}.` });
        if (t.status !== status) { t.status = status; applied++; }
      }
      plan.lastUpdated = todayInNewYork();
      await savePlan(plan);
      return res.status(200).json({ applied, plan });
    }

    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (err) {
    const status = err.status || 500;
    const msg = status === 503
      ? "Saving isn't set up yet. Connect an Upstash Redis database in Vercel (see README)."
      : "Something went wrong on the server.";
    console.error(err);
    return res.status(status).json({ error: msg });
  }
}
