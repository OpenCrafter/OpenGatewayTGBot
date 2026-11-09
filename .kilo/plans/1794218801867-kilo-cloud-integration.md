# Plan: Kilo AI Gateway + Kilo Cloud Agent Telegram Bot Integration

**Goal:** Extend the existing single-file Cloudflare Workers Telegram bot (`/workspace/app/worker.js`) into a Telegram interface for both AI conversations (Kilo AI Gateway) and remote coding tasks (Kilo Cloud Agent), while preserving existing functionality.

**Plan location:** `/workspace/app/.kilo/plans/1794218801867-kilo-cloud-integration.md`

---

## Phase 1 — Repository audit (complete)

Findings from inspecting `worker.js` (1371 lines), `README.md`, `.kilo/`:
- Single-file Cloudflare Workers bot (`export default { fetch, scheduled }`).
- D1 tables: `users`, `chat_memory`, `providers`, `models`, `personas`, `bot_settings`, `admin_states`.
- AI providers: OpenAI-compatible (`callOpenAiCompatible`) + Gemini (`callGemini`), routed via `callAiUniversal` / `detectProviderType`.
- Persian (Farsi) UI, HTML sanitization, credits system, admin panel via inline keyboards, `ctx.waitUntil` for long ops, `/setup` initializes schema + webhook.
- Env vars used at runtime: `BOT_TOKEN`, `ADMIN_ID`; binding: `DB` (D1).
- No test files, no package.json, no lint/typecheck config (vanilla JS, no external deps).

Risks identified:
- Kilo Cloud Agent webhook trigger invocation contract (method/auth/body/response) is **not documented** officially; must be treated as provisional.
- No native outbound completion callback documented → fallback to persistent job records + manual/periodic status checks.
- Git mutations restricted in this environment; do not commit unless asked.

---

## Phase 2 — Kilo AI Gateway integration

Integration point: `callAiUniversal` in `worker.js` — add a new `kilo` provider type alongside OpenAI-compatible and Gemini.

Tasks:
1. Add `callKiloGateway({ model, systemPrompt, history, userText })` function:
   - POST `https://ai-gateway.kilo.ai/api/v1/chat/completions`
   - Header `Authorization: Bearer ${env.KILO_API_KEY}`
   - Body: `{ model, messages, temperature: 0.7, max_tokens: 2048 }`, messages built via existing `buildOpenAiMessages` (supports system prompt + history + persona).
   - Parse `choices[0].message.content`; throw on empty content.
   - Map gateway HTTP errors (401/402/403/429/500/502/503) to safe user-facing messages; never log `KILO_API_KEY` or full headers.
   - Optional SSE streaming where compatible; default non-streaming to match existing editMessageText flow.
2. Add `fetchKiloModels()` using unauthenticated `GET https://ai-gateway.kilo.ai/api/v1/models` (optional, for model list).
3. Wire Kilo into `getActiveDefaultProviderAndModel` or a separate Kilo path keyed by `KILO_CHAT_MODEL` env var (configurable model ID, not hardcoded).
4. Expose Kilo chat via `/chat` command and normal text messages (route through Kilo when selected).
5. Do not break existing provider support: existing `callAiUniversal` / provider flow unchanged.

Config (Cloudflare secrets/vars):
- `KILO_API_KEY` — secret
- `KILO_CHAT_MODEL` — secret/variable (configurable model ID)

---

## Phase 3 — Kilo Cloud Agent integration

Integration point: new `coding_jobs` D1 table + `/code`, `/status`, `/jobs`, `/cancel` commands.

**Unresolved uncertainty (documented as limitation):** The exact webhook trigger invocation contract (HTTP method, auth header, request body schema, response shape) is not officially documented. Plan treats `POST` to `KILO_CLOUD_TRIGGER_URL` as provisional, isolated in one function (`submitToKiloCloudTrigger`) so it can be changed when confirmed.

Tasks:
1. Add D1 migration for `coding_jobs` table (fields per task spec: `job_id`, `telegram_chat_id`, `repository`, `task_description`, `trigger_reference`, `status`, `result_summary`, `branch_url`, `pull_request_url`, `error_message`, `created_at`, `updated_at`). Add to `ensureSchema` and a standalone migration file.
2. Add job-persistence helpers: `createCodingJob`, `getCodingJob`, `updateCodingJobStatus`, `listUserJobs`, `markCodingJobCancelled`.
3. Add repository allowlist config: `KILO_CLOUD_ALLOWLISTED_REPOS` (comma-separated `owner/repo`). Validate `owner/repository` format.
4. Add user authorization for coding commands: `KILO_CLOUD_ALLOWED_TELEGRAM_IDS` (comma-separated chat IDs). Admins (`ADMIN_ID`) always allowed.
5. Add `submitToKiloCloudTrigger(job)`:
   - `POST` to `env.KILO_CLOUD_TRIGGER_URL`
   - Auth: treat URL as secret; optional `KILO_CLOUD_TRIGGER_SECRET` header only if endpoint accepts it (do not assume).
   - Internal payload fields: `jobId`, `repository`, `task`, `telegramChatId`, `createdAt`.
   - Transform to actual HTTP request only after contract verification.
   - Handle 413 (payload), 429 (in-flight cap), 401/403, timeouts; return safe error.
6. Repository mapping: fixed-repository trigger mode by default; optional `KILO_CLOUD_TRIGGER_URLS` JSON map `owner/repo -> trigger URL` for multiple triggers. One trigger = one repository (do not assume arbitrary repo support).
7. Completion reporting fallback: persistent `status` field; `/status JOB_ID` reads D1; no fabricated callback/execution status. Document that results must be checked manually via `/status` until a verified callback exists.
8. Agent environment: use profile configured in Kilo dashboard (no Worker-side env overrides).

Config:
- `KILO_CLOUD_TRIGGER_URL` — secret
- `KILO_CLOUD_TRIGGER_SECRET` — secret (optional)
- `KILO_CLOUD_ALLOWLISTED_REPOS` — variable
- `KILO_CLOUD_ALLOWED_TELEGRAM_IDS` — variable
- `KILO_CLOUD_TRIGGER_URLS` — variable (optional JSON map)

---

## Phase 4 — Telegram experience

Tasks:
1. `/start` — welcome message + available features (chat + code).
2. `/chat` — enter normal AI conversation mode (Kilo Gateway).
3. `/code owner/repository task` — validate args, auth, allowlist, create job, ack immediately, submit to trigger.
4. `/status JOB_ID` — read `coding_jobs` record, show repo/task/job ID/status/result summary/links.
5. `/jobs` — list user's recent coding tasks (last 10).
6. `/cancel JOB_ID` — mark cancelled only if verified cancellation exists; otherwise explain unavailable (no native cancel documented → explain unavailable).
7. `/help` — command usage.
8. Inline keyboards for job status where appropriate.
9. Handle Telegram 4096-char message limit via `sendLongMessage` (existing); sanitize output via `sanitizeAiResponse` / `escapeHtml`.
10. Avoid excessive progress notifications; no invented progress percentages.
11. Preserve existing `/admin`, `/start`, personas, credits, provider flow.

Duplicate update handling: track recent `update_id` in memory (short TTL) or rely on Telegram webhook idempotency; add dedup guard in `handleWebhook`.

---

## Phase 5 — Security and testing

Security tasks:
1. Telegram user allowlisting for `/code` (`KILO_CLOUD_ALLOWED_TELEGRAM_IDS` + admin).
2. Admin-only sensitive config (existing `ADMIN_ID` / `/admin`).
3. Telegram webhook secret verification (add optional `KILO_WEBHOOK_SECRET` header check if supported).
4. Secrets only in Cloudflare secrets/env; never in code, messages, or logs.
5. Repository allowlist enforcement.
6. Input validation + length limits (repo format, task length).
7. Duplicate Telegram update protection.
8. Rate limiting for `/code` submissions (simple in-memory or D1-based cooldown per chat).
9. Parameterized D1 queries (existing `dbRun`/`dbFirst`/`dbAll` use binding — reuse).
10. Callback authentication if callbacks implemented (none initially).
11. Output sanitization before Telegram HTML formatting (existing `escapeHtml`/`sanitizeAiResponse` — reuse).
12. Safe error handling/logging (no credentials/stack traces to user).

Testing tasks (vanilla JS, no test framework — write a lightweight test harness or use `node --test` if available; mock `fetch`):
1. Normal chat through Kilo AI Gateway (mock fetch → 200 with choices content).
2. Invalid Kilo API key (mock 401).
3. Invalid model ID (mock 400).
4. Kilo Gateway timeout and rate-limit errors (mock timeout / 429).
5. Unauthorized Telegram user attempting `/code` (not in allowlist).
6. Invalid repository format.
7. Repository not in allowlist.
8. Successful trigger submission (mock 200) using verified request contract.
9. Failed trigger submission (mock 500/413/429).
10. Duplicate Telegram update handling.
11. Callback authentication/job association (N/A — no callbacks initially; document).
12. Job status persistence (insert then read from D1).
13. Telegram message formatting and long outputs (chunking).
14. Existing bot functionality after changes (regression: existing providers, `/admin`, personas).

Do not run real paid coding tasks in tests.

---

## Phase 6 — Deployment documentation

Update `README.md` with:
- Project overview + architecture diagram (Telegram → Worker → {Kilo Gateway | Kilo Cloud Agent} → GitHub → Worker → Telegram).
- Supported Telegram commands (`/start`, `/chat`, `/code`, `/status`, `/jobs`, `/cancel`, `/help`).
- Cloudflare Worker setup (paste worker.js, bind `DB` D1).
- D1 database setup + migrations (`coding_jobs` table).
- Telegram BotFather setup.
- Kilo AI Gateway API key setup (`KILO_API_KEY`, `KILO_CHAT_MODEL`).
- Kilo Cloud Agent trigger setup (create webhook trigger at app.kilo.ai/cloud/triggers, pick repo + agent env profile, copy trigger URL to `KILO_CLOUD_TRIGGER_URL`).
- Repository allowlist config.
- Required Cloudflare secrets and variables (table).
- Deployment instructions (step-by-step, no wrangler required per existing approach).
- Testing instructions.
- Limitations and known issues (undocumented trigger contract, no native callback, fixed-repository mode).
- Troubleshooting.
- Distinguish required manual Kilo dashboard steps from automated setup.
- Example config with placeholder values only.

---

## Data flow (summary)

1. Telegram user sends `/code owner/repo fix build` → webhook → Worker.
2. Worker validates auth + allowlist + repo format → inserts `coding_jobs` row (status `submitted`) → sends Telegram ack with job ID → calls `submitToKiloCloudTrigger` (`POST` to trigger URL).
3. Kilo Cloud Agent runs in Kilo-managed workspace against the repo (dashboard-configured profile).
4. User checks `/status JOB_ID` → Worker reads `coding_jobs` → shows status/result/links.
5. Normal chat: `/chat` or text → Kilo AI Gateway `POST /chat/completions` → stream/non-stream → sanitized HTML → Telegram.

---

## Known limitations / open questions

- **Trigger invocation contract undocumented:** HTTP method, auth, body schema, response shape for firing a trigger are not officially documented. `submitToKiloCloudTrigger` assumes `POST` + URL-as-secret; isolate this function so it can be updated when confirmed. Proposed safe test: use a non-production test repository and inspect Kilo trigger Request History in dashboard.
- **No native outbound completion callback documented:** completion reporting falls back to persistent `coding_jobs` records + `/status` polling. Do not fabricate callbacks or execution status.
- **One trigger = one repository (fixed-repository mode):** multiple repos require multiple triggers mapped via `KILO_CLOUD_TRIGGER_URLS`.
- Git operations/commit/push happen inside Kilo Cloud Agent, not the Worker.
- No test runner configured; tests must be lightweight/mock-based.

---

## Files to add or modify

- `worker.js` — add Kilo Gateway call, `coding_jobs` persistence, trigger submission, `/code`/`/status`/`/jobs`/`/cancel`/`/chat`/`/help` commands, dedup guard, rate limiting, security helpers.
- `migrations/001_coding_jobs.sql` (new) — standalone `coding_jobs` table migration (also applied inline in `ensureSchema`).
- `README.md` — full rewrite/additions for new features, secrets, Kilo dashboard steps, deployment, limitations.
- `.kilo/plans/1794218801867-kilo-cloud-integration.md` (this plan).

## Required Cloudflare secrets & bindings

Binding: `DB` (D1 database).
Secrets: `BOT_TOKEN`, `ADMIN_ID` (existing), `KILO_API_KEY`, `KILO_CLOUD_TRIGGER_URL`, `KILO_CLOUD_TRIGGER_SECRET` (optional).
Variables: `KILO_CHAT_MODEL`, `KILO_CLOUD_ALLOWLISTED_REPOS`, `KILO_CLOUD_ALLOWED_TELEGRAM_IDS`, `KILO_CLOUD_TRIGGER_URLS` (optional), `KILO_WEBHOOK_SECRET` (optional).

## Required Kilo dashboard configuration

1. Kilo AI Gateway: obtain `KILO_API_KEY` from Kilo dashboard; choose default model → set `KILO_CHAT_MODEL`.
2. Cloud Agent: connect GitHub account at app.kilo.ai/integrations; create webhook trigger at app.kilo.ai/cloud/triggers; select repository + agent environment profile; copy trigger URL → `KILO_CLOUD_TRIGGER_URL`; optionally set `KILO_CLOUD_TRIGGER_SECRET`.
3. For multiple repositories: create one trigger per repo, map via `KILO_CLOUD_TRIGGER_URLS`.

## Tests executed and results

Not yet executed (plan phase). To be executed in implementation phase.

## Exact deployment steps

1. Apply D1 migration (`coding_jobs` table) via Cloudflare D1 dashboard or `wrangler d1 execute`.
2. Add worker.js to Cloudflare Worker editor; save/deploy.
3. Set secrets/variables in Worker Settings.
4. Visit `/setup?key=ADMIN_ID` to initialize schema + webhook.
5. Configure Kilo dashboard (Gateway key + Cloud Agent trigger).
6. Test `/start`, `/chat`, `/code`, `/status` in Telegram.

## Git branch and commit

Branch: `feat/kilo-cloud-integration`. Do not commit unless explicitly asked (git mutations restricted in this environment).
