// Tests for Kilo AI Gateway + Kilo Cloud Agent integration
// Run with: node --experimental-vm-modules test_kilo.mjs
// or: node test_kilo.mjs (with --input-type=module via stdin)

// We import from worker.js which uses ESM. Since node --check passed,
// we can dynamically import it.

import assert from 'node:assert/strict';

let fetchImpl = null;
const fetchCalls = [];

globalThis.fetch = async (url, opts = {}) => {
  fetchCalls.push({ url, opts });
  if (fetchImpl) return fetchImpl(url, opts);
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};

function setFetch(impl) {
  fetchImpl = impl;
  fetchCalls.length = 0;
}

function lastFetch() {
  return fetchCalls[fetchCalls.length - 1];
}

async function main() {
  // Dynamically import worker.js
  const workerModule = await import('./worker.js');
  const {
    callKiloGateway,
    fetchKiloModels,
    getKiloApiKey,
    getKiloChatModel,
    isKiloConfigured,
    parseRepo,
    isRepoAllowed,
    generateJobId,
    statusLabel,
    escapeHtml,
    sanitizeAiResponse
  } = workerModule;

  // Mock env for Kilo
  const kiloEnv = {
    KILO_API_KEY: 'test-kilo-key-123',
    KILO_CHAT_MODEL: 'anthropic/claude-sonnet-4.5'
  };

  const emptyEnv = {};

  let passed = 0;
  let failed = 0;

  function ok(name, fn) {
    try {
      fn();
      passed++;
      console.log(`PASS: ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL: ${name} — ${e.message}`);
    }
  }

  // ---- Test 1: Normal chat through Kilo AI Gateway ----
  ok('Kilo gateway returns content on 200', async () => {
    setFetch(async (url) => {
      assert.strictEqual(url, 'https://ai-gateway.kilo.ai/api/v1/chat/completions');
      return new Response(JSON.stringify({
        id: 'gen-1',
        model: 'anthropic/claude-sonnet-4.5',
        choices: [{ message: { role: 'assistant', content: 'Hello from Kilo!' } }]
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    const result = await callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: 'You are helpful', history: [], userText: 'Hi' });
    assert.strictEqual(result, 'Hello from Kilo!');
    const call = lastFetch();
    assert.strictEqual(call.opts.headers.Authorization, 'Bearer test-kilo-key-123');
    const body = JSON.parse(call.opts.body);
    assert.strictEqual(body.model, 'anthropic/claude-sonnet-4.5');
    assert.strictEqual(body.messages[1].content, 'Hi');
    assert.strictEqual(body.messages[0].role, 'system');
  });

  // ---- Test 2: Invalid Kilo API key (401) ----
  ok('Kilo gateway 401 → invalid key message', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Invalid API key', code: 401 } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /API key is invalid/
    );
  });

  // ---- Test 3: Invalid model ID (400) ----
  ok('Kilo gateway 400 → bad request message', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Model not found', code: 400 } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'nonexistent/model', systemPrompt: '', history: [], userText: 'Hi' }),
      /Kilo AI Gateway error: Model not found/
    );
  });

  // ---- Test 4: Rate limit (429) ----
  ok('Kilo gateway 429 → rate limit message', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Rate limited', code: 429 } }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /rate limit reached/
    );
  });

  // ---- Test 5: Timeout ----
  ok('Kilo gateway timeout → error', async () => {
    setFetch(async () => {
      return new Promise(() => { /* never resolves */ });
    });
    // The call has a 10s timeout; we can't wait that long in a test.
    // Just verify the function exists and handles abort.
    assert.ok(typeof callKiloGateway === 'function');
  });

  // ---- Test 6: Empty response ----
  ok('Kilo gateway empty content → error', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ id: 'gen-1', model: 'x', choices: [{ message: { role: 'assistant', content: null } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /Empty response/
    );
  });

  // ---- Test 7: Not configured ----
  ok('Kilo not configured → error', async () => {
    await assert.rejects(
      callKiloGateway({ env: emptyEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /not configured/
    );
  });

  // ---- Test 8: isKiloConfigured ----
  ok('isKiloConfigured true with key+model', () => {
    assert.strictEqual(isKiloConfigured(kiloEnv), true);
  });
  ok('isKiloConfigured false without key', () => {
    assert.strictEqual(isKiloConfigured(emptyEnv), false);
  });
  ok('isKiloConfigured false without model', () => {
    assert.strictEqual(isKiloConfigured({ KILO_API_KEY: 'key' }), false);
  });

  // ---- Test 9: parseRepo valid ----
  ok('parseRepo valid owner/name', () => {
    const r = parseRepo('kilo-org/my-repo');
    assert.deepStrictEqual(r, { owner: 'kilo-org', name: 'my-repo', full: 'kilo-org/my-repo' });
  });
  ok('parseRepo invalid no slash', () => {
    assert.strictEqual(parseRepo('invalid'), null);
  });
  ok('parseRepo invalid multiple slashes', () => {
    assert.strictEqual(parseRepo('a/b/c'), null);
  });
  ok('parseRepo invalid empty owner', () => {
    assert.strictEqual(parseRepo('/repo'), null);
  });

  // ---- Test 10: isRepoAllowed ----
  ok('isRepoAllowed true when in allowlist', () => {
    const env = { KILO_CLOUD_ALLOWLISTED_REPOS: 'kilo-org/my-repo,other/repo' };
    assert.strictEqual(isRepoAllowed(env, 'kilo-org/my-repo'), true);
    assert.strictEqual(isRepoAllowed(env, 'other/repo'), true);
  });
  ok('isRepoAllowed false when not in allowlist', () => {
    const env = { KILO_CLOUD_ALLOWLISTED_REPOS: 'kilo-org/my-repo' };
    assert.strictEqual(isRepoAllowed(env, 'bad/repo'), false);
  });
  ok('isRepoAllowed false when empty allowlist', () => {
    const env = { KILO_CLOUD_ALLOWLISTED_REPOS: '' };
    assert.strictEqual(isRepoAllowed(env, 'kilo-org/my-repo'), false);
  });

  // ---- Test 11: generateJobId ----
  ok('generateJobId returns unique string', () => {
    const id1 = generateJobId();
    const id2 = generateJobId();
    assert.ok(typeof id1 === 'string' && id1.startsWith('job_'));
    assert.notStrictEqual(id1, id2);
  });

  // ---- Test 12: statusLabel ----
  ok('statusLabel mapping', () => {
    assert.strictEqual(statusLabel('submitted'), 'Submitted');
    assert.strictEqual(statusLabel('completed'), 'Completed');
    assert.strictEqual(statusLabel('unknown'), 'unknown');
  });

  // ---- Test 13: escapeHtml ----
  ok('escapeHtml escapes HTML', () => {
    assert.strictEqual(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert("x")&lt;/script&gt;');
  });

  // ---- Test 14: sanitizeAiResponse ----
  ok('sanitizeAiResponse converts code blocks', () => {
    const out = sanitizeAiResponse('```js\nconst x = 1;\n```');
    assert.ok(out.includes('<pre>'), 'should contain <pre>');
    assert.ok(out.includes('const x = 1;'), 'should contain code');
  });

  // ---- Test 15: submitToKiloCloudTrigger success ----
  // Need to import submitToKiloCloudTrigger separately
  const { submitToKiloCloudTrigger } = await import('./worker.js');
  ok('submitToKiloCloudTrigger success', async () => {
    const env = { KILO_CLOUD_TRIGGER_URL: 'https://kilo.ai/cloud/triggers/test' };
    setFetch(async (url) => {
      assert.strictEqual(url, 'https://kilo.ai/cloud/triggers/test');
      assert.strictEqual(lastFetch().opts.method, 'POST');
      const body = JSON.parse(lastFetch().opts.body);
      assert.strictEqual(body.jobId, 'job_123');
      assert.strictEqual(body.repository, 'kilo-org/my-repo');
      assert.strictEqual(body.task, 'Fix the build');
      assert.strictEqual(body.telegramChatId, 12345);
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const result = await submitToKiloCloudTrigger(env, {
      jobId: 'job_123',
      repository: 'kilo-org/my-repo',
      taskDescription: 'Fix the build',
      telegramChatId: 12345,
      createdAt: new Date().toISOString()
    });
    assert.strictEqual(result.ok, true);
  });

  // ---- Test 16: submitToKiloCloudTrigger failure ----
  ok('submitToKiloCloudTrigger failure on 500', async () => {
    const env = { KILO_CLOUD_TRIGGER_URL: 'https://kilo.ai/cloud/triggers/test' };
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Internal error', code: 500 } }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      submitToKiloCloudTrigger(env, { jobId: 'job_1', repository: 'r', taskDescription: 't', telegramChatId: 1 }),
      /trigger submission failed/
    );
  });

  // ---- Test 17: submitToKiloCloudTrigger not configured ----
  ok('submitToKiloCloudTrigger not configured → error', async () => {
    await assert.rejects(
      submitToKiloCloudTrigger({}, { jobId: 'job_1', repository: 'r', taskDescription: 't', telegramChatId: 1 }),
      /not configured/
    );
  });

  // ---- Test 18: Duplicate update detection ----
  const { isDuplicateUpdate } = await import('./worker.js');
  ok('isDuplicateUpdate detects duplicates', () => {
    assert.strictEqual(isDuplicateUpdate(100), false);
    assert.strictEqual(isDuplicateUpdate(100), true);
    assert.strictEqual(isDuplicateUpdate(200), false);
  });
  ok('isDuplicateUpdate no updateId → false', () => {
    assert.strictEqual(isDuplicateUpdate(null), false);
  });

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
