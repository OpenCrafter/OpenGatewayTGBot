// Tests for Kilo AI Gateway + Kilo Cloud Agent integration (fixed)
// Run with: node test_kilo.mjs

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
  const workerModule = await import('./worker.js');
  const {
    callKiloGateway,
    isKiloConfigured,
    parseRepo,
    isRepoAllowed,
    generateJobId,
    statusLabel,
    escapeHtml,
    sanitizeAiResponse,
    submitToKiloCloudTrigger,
    isDuplicateUpdate,
    isCodingAllowed
  } = workerModule;

  const kiloEnv = {
    KILO_API_KEY: 'test-kilo-key-123',
    KILO_CHAT_MODEL: 'anthropic/claude-sonnet-4.5'
  };

  const emptyEnv = {};
  let passed = 0;
  let failed = 0;
  const tests = [];

  function addTest(name, fn) {
    tests.push({ name, fn });
  }

  async function runTest(name, fn) {
    try {
      const res = fn();
      if (res && typeof res.then === 'function') {
        await res;
      }
      passed++;
      console.log(`PASS: ${name}`);
    } catch (e) {
      failed++;
      console.log(`FAIL: ${name} — ${e.message}`);
    }
  }

  // Kilo Gateway
  addTest('Kilo gateway returns content on 200', async () => {
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
  });

  addTest('Kilo gateway 401 → invalid key message', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Invalid API key', code: 401 } }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /API key is invalid/
    );
  });

  addTest('Kilo gateway 400 → bad request message', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Model not found', code: 400 } }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'nonexistent/model', systemPrompt: '', history: [], userText: 'Hi' }),
      /Kilo AI Gateway error: Model not found/
    );
  });

  addTest('Kilo gateway 429 → rate limit message', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Rate limited', code: 429 } }), { status: 429, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /rate limit reached/
    );
  });

  addTest('Kilo gateway empty content → error', async () => {
    setFetch(async () => {
      return new Response(JSON.stringify({ id: 'gen-1', model: 'x', choices: [{ message: { role: 'assistant', content: null } }] }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    await assert.rejects(
      callKiloGateway({ env: kiloEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /Empty response/
    );
  });

  addTest('Kilo not configured → error', async () => {
    await assert.rejects(
      callKiloGateway({ env: emptyEnv, model: 'anthropic/claude-sonnet-4.5', systemPrompt: '', history: [], userText: 'Hi' }),
      /not configured/
    );
  });

  addTest('isKiloConfigured true with key+model', () => {
    assert.strictEqual(isKiloConfigured(kiloEnv), true);
  });
  addTest('isKiloConfigured false without key', () => {
    assert.strictEqual(isKiloConfigured(emptyEnv), false);
  });
  addTest('isKiloConfigured false without model', () => {
    assert.strictEqual(isKiloConfigured({ KILO_API_KEY: 'key' }), false);
  });

  // Repo parsing
  addTest('parseRepo valid owner/name', () => {
    const r = parseRepo('kilo-org/my-repo');
    assert.deepStrictEqual(r, { owner: 'kilo-org', name: 'my-repo', full: 'kilo-org/my-repo' });
  });
  addTest('parseRepo invalid no slash', () => { assert.strictEqual(parseRepo('invalid'), null); });
  addTest('parseRepo invalid multiple slashes', () => { assert.strictEqual(parseRepo('a/b/c'), null); });
  addTest('parseRepo invalid empty owner', () => { assert.strictEqual(parseRepo('/repo'), null); });

  // Repo allowlist
  addTest('isRepoAllowed true when in allowlist', () => {
    const env = { KILO_CLOUD_ALLOWLISTED_REPOS: 'kilo-org/my-repo,other/repo' };
    assert.strictEqual(isRepoAllowed(env, 'kilo-org/my-repo'), true);
  });
  addTest('isRepoAllowed false when not in allowlist', () => {
    const env = { KILO_CLOUD_ALLOWLISTED_REPOS: 'kilo-org/my-repo' };
    assert.strictEqual(isRepoAllowed(env, 'bad/repo'), false);
  });
  addTest('isRepoAllowed false when empty allowlist', () => {
    const env = { KILO_CLOUD_ALLOWLISTED_REPOS: '' };
    assert.strictEqual(isRepoAllowed(env, 'kilo-org/my-repo'), false);
  });

  // Coding auth - critical fixes
  addTest('isCodingAllowed default deny empty allowlist no admin', () => {
    assert.strictEqual(isCodingAllowed({}, '12345'), false);
  });
  addTest('isCodingAllowed admin allowed', () => {
    assert.strictEqual(isCodingAllowed({ ADMIN_ID: '99999' }, '99999'), true);
  });
  addTest('isCodingAllowed authorized user in allowlist', () => {
    assert.strictEqual(isCodingAllowed({ KILO_CLOUD_ALLOWED_TELEGRAM_IDS: '111,222', ADMIN_ID: '99999' }, '111'), true);
  });
  addTest('isCodingAllowed unauthorized not in allowlist', () => {
    assert.strictEqual(isCodingAllowed({ KILO_CLOUD_ALLOWED_TELEGRAM_IDS: '111,222', ADMIN_ID: '99999' }, '333'), false);
  });
  addTest('isCodingAllowed admin allowed even if not in allowlist', () => {
    assert.strictEqual(isCodingAllowed({ KILO_CLOUD_ALLOWED_TELEGRAM_IDS: '111', ADMIN_ID: '99999' }, '99999'), true);
  });

  // Trigger routing
  addTest('submitToKiloCloudTrigger no trigger configured for repo → error', async () => {
    await assert.rejects(
      submitToKiloCloudTrigger({}, { jobId: 'job_1', repository: 'r', taskDescription: 't', telegramChatId: 1 }),
      /trigger URL is not configured for repository/
    );
  });
  addTest('submitToKiloCloudTrigger uses repo map when present', async () => {
    const env = { KILO_CLOUD_TRIGGER_URLS: JSON.stringify({ 'kilo-org/repo': 'https://kilo.ai/cloud/triggers/r2' }) };
    setFetch(async (url) => {
      assert.strictEqual(url, 'https://kilo.ai/cloud/triggers/r2');
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const result = await submitToKiloCloudTrigger(env, { jobId: 'job_1', repository: 'kilo-org/repo', taskDescription: 't', telegramChatId: 1, createdAt: new Date().toISOString() });
    assert.strictEqual(result.ok, true);
  });
  addTest('submitToKiloCloudTrigger fallback to default only when no map entry', async () => {
    const env = { KILO_CLOUD_TRIGGER_URL: 'https://kilo.ai/cloud/triggers/default', KILO_CLOUD_TRIGGER_URLS: JSON.stringify({ 'other/repo': 'https://kilo.ai/cloud/triggers/other' }) };
    setFetch(async (url) => {
      assert.strictEqual(url, 'https://kilo.ai/cloud/triggers/default');
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    });
    const result = await submitToKiloCloudTrigger(env, { jobId: 'job_1', repository: 'kilo-org/repo', taskDescription: 't', telegramChatId: 1, createdAt: new Date().toISOString() });
    assert.strictEqual(result.ok, true);
  });
  addTest('submitToKiloCloudTrigger failure on 500', async () => {
    const env = { KILO_CLOUD_TRIGGER_URL: 'https://kilo.ai/cloud/triggers/test' };
    setFetch(async () => {
      return new Response(JSON.stringify({ error: { message: 'Internal error', code: 500 } }), { status: 500 });
    });
    await assert.rejects(
      submitToKiloCloudTrigger(env, { jobId: 'job_1', repository: 'kilo-org/repo', taskDescription: 't', telegramChatId: 1 }),
      /trigger submission failed/
    );
  });

  // Misc
  addTest('generateJobId returns unique string', () => {
    const id1 = generateJobId();
    const id2 = generateJobId();
    assert.ok(typeof id1 === 'string' && id1.startsWith('job_'));
    assert.notStrictEqual(id1, id2);
  });
  addTest('statusLabel mapping', () => {
    assert.strictEqual(statusLabel('submitted'), 'Submitted');
    assert.strictEqual(statusLabel('unknown'), 'unknown');
  });
  addTest('escapeHtml escapes HTML', () => {
    assert.strictEqual(escapeHtml('<script>alert("x")</script>'), '&lt;script&gt;alert("x")&lt;/script&gt;');
  });
  addTest('sanitizeAiResponse converts code blocks', () => {
    const out = sanitizeAiResponse('```js\nconst x = 1;\n```');
    assert.ok(out.includes('<pre>'));
  });
  addTest('isDuplicateUpdate detects duplicates', () => {
    assert.strictEqual(isDuplicateUpdate(1000), false);
    assert.strictEqual(isDuplicateUpdate(1000), true);
    assert.strictEqual(isDuplicateUpdate(2000), false);
  });
  addTest('isDuplicateUpdate no updateId → false', () => {
    assert.strictEqual(isDuplicateUpdate(null), false);
  });

  for (const t of tests) {
    await runTest(t.name, t.fn);
  }

  console.log(`\n${passed} passed, ${failed} failed (total assertions executed: ${tests.length})`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => { console.error('TEST HARNESS ERROR:', e); process.exit(1); });
