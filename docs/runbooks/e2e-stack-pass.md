# Runbook — e2e suite against a real container stack

**Audience:** an executing agent, or a human doing a pre-release verification pass.
**Goal:** run the Playwright e2e suite against a real `stellar-api` + `stellar-ui` container pair and produce evidence about whether the build works.

This answers "does this image pair function". It does not answer "should this box be public" — that is stellar-compose's `docs/runbooks/live-box-deploy.md`. Run this one first; a green pass there is a precondition for the deploy checklist, not a substitute for it.

Unit tests mount a `MemoryRouter` and structurally cannot catch an nginx SPA-fallback misconfiguration. That is the specific gap this pass exists to close, which makes section 5 its highest-value part even though section 4 takes the most wall time.

## 0. Hard rules

Two of these prevent real damage.

1. **Never run `git add -A`, `git add .`, `git commit -a`, or `git push` in `~/git/obrien-k/stellar-compose`.** That checkout holds real deployment secrets in `.env`, `.env.api`, `.env.db`, `.env.ui`. They are gitignored, but do not rely on that — stage nothing there. If you need to change a tracked file in that repo, `git worktree add` off `upstream/main` and work in the worktree.
2. **Never print a secret.** Print a length or a shape assertion (`len=64`), never a value. `STELLAR_AUTH_JWT_SECRET` and `POSTGRES_PASSWORD` are live.
3. **Never chain `&&` off a piped command when the exit status matters.** `cmd | tail` returns tail's status, so failures vanish. Use `cmd > /tmp/step.log 2>&1; echo "EXIT:$?"; tail -20 /tmp/step.log`.
4. **Do not improvise around a blocker.** If reality does not match this document, stop and report — particularly if the workaround would edit an infrastructure file.
5. **Do not claim a step passed without the output proving it.** Silence is not success; a hung command is not a pass.

## 1. Preconditions

| # | Check | Command | Expected |
|---|---|---|---|
| 1.1 | Docker running | `docker info > /dev/null 2>&1; echo EXIT:$?` | `EXIT:0` |
| 1.2 | Compose checkout clean | `cd ~/git/obrien-k/stellar-compose && git status -s` | empty (env files are ignored) |
| 1.3 | Pinned to the tags under test | `grep image: docker-compose.yml` | the api/ui semver pair you intend to verify |
| 1.4 | Env files present | `ls .env .env.api .env.db .env.ui` | all four exist |
| 1.5 | JWT secret is real | `grep JWT .env.api \| awk -F= '{print length($2)}'` | `64` |
| 1.6 | UI checkout | `ls ~/git/obrien-k/stellar-ui/e2e` | 7 spec files + `global.setup.ts` |

On 1.3: record the exact tags. The verdict from this pass is only valid for the pair you ran.

**If the pin you expect is missing, resync before escalating.** `obrien-k/stellar-compose` is a fork whose `sync-upstream` workflow rebases onto `orphic-inc/stellar-compose` and force-pushes `origin/main` daily at 06:00 UTC. Two consequences follow, and both look alarming if you have not seen them before:

- A local checkout goes stale between runs, so a pin merged upstream after the last sync is simply not there yet.
- The rebase rewrites the fork-only CI commits with fresh SHAs every run, so a local `main` from an earlier day differs from `origin/main` by SHA while being patch-identical. `git cherry -v origin/main main` prefixing every line with `-` means exactly that: equivalents already exist upstream, nothing local is unique.

So do this first:

```bash
cd ~/git/obrien-k/stellar-compose
git fetch --all
git status --porcelain          # must be empty before the next line
git cherry -v origin/main main  # every line '-' means nothing local is unique
git reset --hard origin/main
```

Fetch both remotes explicitly — `git fetch origin upstream` reads `upstream` as a refspec and fails; use `--all` or two separate invocations.

If the pin is still absent after that, the sync has not run since it landed upstream. Trigger it (`gh workflow run sync-upstream.yml --repo obrien-k/stellar-compose`), wait, and refetch. **Only escalate if it is still missing after a successful sync run** — at that point it is a genuine upstream problem rather than a stale checkout.

Do not resolve a missing pin by editing `docker-compose.yml` locally. The pin is the thing under test; hand-editing it means the pass verifies a configuration that exists nowhere but your disk.

## 2. Bring up the stack

```bash
cd ~/git/obrien-k/stellar-compose
docker compose pull > /tmp/pull.log 2>&1; echo "EXIT:$?"
docker compose up -d > /tmp/up.log 2>&1; echo "EXIT:$?"
docker compose ps
```

Expect `db` healthy, `api` and `ui` running. The `ui` service is also the nginx reverse proxy: it serves the built SPA and proxies `/api` on the same origin, publishing 80/443.

```bash
docker compose logs api | head -40
```

You should see `prisma migrate deploy` apply migrations, then `node dist/scripts/seed.js` plant the baseline (ranks, forums, Golden Rules, System user, stylesheet fixtures), then the server start. Both are automatic — do not run a manual seed. A benign warning about the obsolete compose `version:` key is expected (stellar-compose#18).

If `db` fails to start, check the volume mount is `./volumes/db-data:/var/lib/postgresql` with no `/data` suffix; Postgres 18 rejects the old path. Seeing the old path means the checkout is stale — stop and report.

## 3. Install, then seed fixtures

**Easy to miss and it fails loudly downstream.** Every `/api/*` route returns 503 until install stamps `installedAt`, and the boot seed deliberately does not stamp it.

```bash
curl -s http://localhost/api/install | jq
```

Expect `"installed": false`. Create the SysOp:

```bash
curl -s -X POST http://localhost/api/install \
  -H 'Content-Type: application/json' \
  -d '{"username":"sysop","email":"sysop@example.com","password":"<generate-a-strong-one>"}' | jq
```

Expect 201. Re-check and record two things — they are the 0.8.0 posture change:

```bash
curl -s http://localhost/api/install | jq '{installed, registrationStatus, setupChecklist}'
```

- `registrationStatus` is `"closed"`
- `setupChecklist` contains an item with id `registration-closed`

`"open"` means the image predates 0.8.0 — stop and report.

Now the fixtures. `global.setup.ts` does not create users; it logs in as two that must already exist and throws if they do not.

```bash
docker compose exec api node dist/scripts/seed-e2e-users.js > /tmp/seed.log 2>&1; echo "EXIT:$?"; cat /tmp/seed.log
```

Expect `testuser`, `staffuser`, and the invite subtree (`e2e_alpha` to `e2e_charlie`, `e2e_bravo`, `e2e_delta`).

A refusal with "Refusing to seed e2e fixtures with NODE_ENV=production" is the guard working as designed. A throwaway test target is a legitimate override:

```bash
docker compose exec -e ALLOW_E2E_SEED=true api node dist/scripts/seed-e2e-users.js > /tmp/seed.log 2>&1; echo "EXIT:$?"
```

Pass it per-invocation only. Never set `ALLOW_E2E_SEED` in `.env.api` or any compose file.

Confirm login end to end before spending time on Playwright:

```bash
curl -s -X POST http://localhost/api/auth \
  -H 'Content-Type: application/json' \
  -d '{"email":"testuser@example.com","password":"changeme"}' -o /dev/null -w '%{http_code}\n'
```

Expect 200. A 503 means install did not take; a 401 means seeding did not take.

## 4. Run the suite

```bash
cd ~/git/obrien-k/stellar-ui
BASE_URL=http://localhost API_URL=http://localhost \
  npx playwright test > /tmp/e2e.log 2>&1; echo "EXIT:$?"
tail -40 /tmp/e2e.log
```

Both URLs are the same origin because nginx proxies `/api` on the same host. The config runs `workers: 1` with `retries: 0`, so a full pass takes several minutes and failures are deterministic rather than flaky-by-retry.

**Do not fix failures during a verification pass.** Collect the trace (`test-results/**/trace.zip`), the spec names, and the error text, then report. Preserve `playwright-report/` and `test-results/` — they are the deliverable.

### Known-failing specs

As of the 0.8.1 pass, 14 of 28 tests fail for reasons already diagnosed and filed. Do not re-diagnose these; confirm the failure matches the known cause and move on. A failure that does *not* match one of these is the interesting kind.

| Spec | Failing | Cause | Issue |
|---|---|---|---|
| `tickets.spec.ts` | 5 of 5 | Targets retired ticket routes; current model is `/inbox/staff` | #190 |
| `release.spec.ts` | 3 | Fixture seeder plants no releases; P-07a/b cascade from P-06 | stellar-api#339 |
| `contribute.spec.ts` | 3 | `toBeVisible()` on a native `<option>` — never passes | #191 |
| `reports.spec.ts` | 3 of 6 | Expects a merged "reports queue" heading; markup splits it | #191 |

Update this table as those close. A stale known-failures list is worse than none — it launders real regressions as expected noise.

## 5. Routing checks the suite does not cover

The `/private` prefix removal moved every authenticated route to the root, served by nginx's SPA fallback (`location / { try_files $uri /index.html; }`). These curl checks are what unit tests cannot reach.

```bash
for p in / /login /forums /staff/tools /messages /top10/releases /wiki /nope-does-not-exist; do
  printf "%-24s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "http://localhost$p")"
done
```

**Expect 200 for every one, including `/nope-does-not-exist`** — nginx serves `index.html` and the client router renders the 404 view. An nginx 404 on `/staff/tools` means the fallback is broken and deep links die on reload. **Release blocker.**

Legacy redirect, so old bookmarks survive:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost/private/messages
```

Expect 200 — the SPA loads and `LegacyPrivateRedirect` rewrites client-side to `/messages`.

API prefix preservation, which has regressed before:

```bash
curl -s http://localhost/api/version
```

Expect JSON matching the pinned tag. A 404 means the `proxy_pass` trailing-slash regression is back; an older version means compose is running a stale pin.

Finally, in a real browser: confirm `/` differs by auth state. Logged out gives the public landing with a **Sign In** button and **no Register button** — the Register CTA only renders when `registrationStatus === 'open'`, so on a fresh closed instance its absence is correct. Logged in gives the member homepage. Then hard-reload directly on `/staff/tools` as the staff user; that single action is the one most likely to expose a flattening regression.

## 6. Report format

1. **Verdict** — ready / ready with caveats / not ready. Lead with it.
2. **E2E results** — passed/failed counts, named failures, path to `playwright-report/`.
3. **Routing table** — the status codes from section 5.
4. **Anything you could not verify** — explicitly. This section being honest is worth more than a clean-looking report.

Do not commit. Do not open PRs. Do not fix failures.

## 7. When to stop and escalate

- The expected pin is still missing after a successful `sync-upstream` run (see 1.3 — a stale checkout is not an escalation, an unsynced upstream is), or any step needs a change to a tracked file in the compose repo.
- `db` will not start, or its volume mount path is wrong.
- A failure that does not match the known-failures table and looks like a genuine routing regression — diagnosing those needs the context of what changed in the flattening.
- Anything that tempts you to run `git add` in the compose repo.

Two commands have historically run 10+ minutes with no output, both environment problems rather than slowness: the api integration suite (stalls locally, passes in CI) and `docker compose pull` on a cold cache. If something is silent that long, check whether the process is actually consuming CPU before assuming progress.
