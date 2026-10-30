# site-gate deployment

**Status: deferred.** `the-frinje-report/` is public on GitHub Pages except `the-frinje-report/issues/issue-11-pinning-postcards.html`, which stays excluded in root [`_config.yml`](../_config.yml). `ff2026-chubba-league/` remains unpublished. No password lock. Do not attach Worker routes until you intentionally re-enable edge gating.

---

Edge password protection for `/the-frinje-report*` and `/ff2026-chubba-league*` on **jenhammond.me** (on hold).

## Phase 0 — Cloudflare DNS (required before routes work)

1. Add **jenhammond.me** to Cloudflare and import DNS.
2. Point apex and `www` at GitHub Pages (CNAME `frinjee.github.io` or GitHub’s A/AAAA records).
3. Enable **proxied** (orange cloud) on those records.
4. SSL/TLS mode: **Full (strict)** after GitHub has issued the custom-domain certificate.
5. Confirm `https://jenhammond.me/` loads the site.

Until Phase 0 is done, `wrangler deploy` fails with **Could not find zone for `jenhammond.me`** and routes will not attach. The Worker script and secrets can still upload, but traffic will not be gated.

**Check:** In the same Cloudflare account you use for `wrangler login`, open **Websites** and confirm **jenhammond.me** appears. If the site is live but the zone is missing, DNS is still at another provider—import the domain into Cloudflare and switch nameservers at your registrar before redeploying.

## Phase 1 — Secrets and deploy

From this directory (after `npx wrangler login` or with `CLOUDFLARE_API_TOKEN` set):

```powershell
npm install
.\scripts\deploy-gate.ps1
```

Or manually:

```bash
npm install
npx wrangler secret put SITE_GATE_PASSWORD
npx wrangler secret put GATE_SIGNING_SECRET
npx wrangler deploy
npm test
```

- **SITE_GATE_PASSWORD**: shared site password (never commit).
- **GATE_SIGNING_SECRET**: random string (32+ bytes); used only for session cookie HMAC.

## Phase 2 — frinjee.github.io bypass (decision: accept for now)

The gate applies only to **jenhammond.me** routes. The same files may still be public at `https://frinjee.github.io/...` while the repo uses public GitHub Pages.

**Rollout choice:** keep the custom domain locked and accept the `frinjee.github.io` mirror as a known bypass until you make the repo private or move hosting to Cloudflare Pages and disable GitHub Pages.

## Verify

- Incognito: `GET /the-frinje-report/` and `/ff2026-chubba-league/08-16-rankings.csv` show the login page.
- After login, assets and subscribe forms work; `/` and `/hoard/` are unchanged.
