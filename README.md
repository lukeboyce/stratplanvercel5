# NYCEM Strategic Plan Tracker

A public page showing progress on the 2026–2029 Strategic Plan, plus a password-protected editor at `/admin` for updating tactic statuses.

```
index.html          the page (public view and editor)
api/plan.js         GET the plan (public), PUT status changes (editors only)
api/session.js      sign in / sign out / check session
api/_store.js       storage (Upstash Redis)
api/_auth.js        editor sign-in
api/_plan-data.js   goals, objectives, tactics
vercel.json         /admin route
dev.js              local preview server
```

## Deploy to Vercel

1. **Upload to GitHub.** Put these files at the **top level** of the repository, so `index.html` and `vercel.json` sit in the root and aren't inside a subfolder. If they end up in a subfolder, set that folder as the **Root Directory** in Vercel's project settings.
2. **Import into Vercel.** Choose Add New, then Project, and pick the repo. Set Framework Preset to **Other**. Leave Build Command and Output Directory empty.
3. **Add the database.** In the project, open **Storage** (or **Marketplace**), add **Upstash for Redis** with the free plan, and connect it to the project. Vercel adds the `KV_REST_API_URL` and `KV_REST_API_TOKEN` variables automatically.
4. **Add environment variables** under Settings, then Environment Variables:
   - `ADMIN_PASSWORD`: the editor password.
   - `SESSION_SECRET`: a long random string, used to sign the login cookie. If you leave it out, the password is used to sign the cookie instead.
5. **Redeploy** (Deployments, then the menu on the latest deployment, then Redeploy) so the new variables take effect.

The public page is the site root. Editors go to `/admin`.

The public page works even before steps 3 and 4. Until then, the editor tells you which piece is missing.

## Updating content

- **Statuses:** sign in at `/admin`, change the dropdowns, then click **Publish updates**.
- **Tactic text, adding tactics, goal copy:** edit `api/_plan-data.js` and commit. The live database keeps its own copy once anyone has published a status change, so after changing that file, clear the `nycem:strategic-plan` key in the Upstash console. The site then reloads from that file, and statuses reset to whatever the file says.
- **Placeholder notice:** it shows while any tactic has `"placeholder": true`. Remove that flag from each tactic once the real tactics are in.

## Local preview

```
ADMIN_PASSWORD=test node dev.js
```

Then open http://localhost:3000 and http://localhost:3000/admin. Changes are kept in memory and reset when the server restarts. This needs Node 20 or newer.

## Moving to City infrastructure later

- **Sign-in:** replace `isEditor()` in `api/_auth.js` and the POST handler in `api/session.js` with the City SSO check (NYC.ID or Azure AD).
- **Storage:** replace `getPlan()` and `savePlan()` in `api/_store.js` with the agency database.

Nothing else depends on how those two pieces work.

## Security notes

- Everyone with editor access shares one password, and there's no per-person audit trail. That's fine for a pilot. City SSO would fix both.
- Change the password by editing `ADMIN_PASSWORD` and redeploying. That also signs out everyone currently signed in, unless `SESSION_SECRET` is set; in that case, change `SESSION_SECRET` as well.
- Sign-in attempts aren't rate-limited, so use a long password.
