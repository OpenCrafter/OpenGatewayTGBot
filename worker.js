
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk);
  }
  return btoa(binary);
}

async function dbRun(env, sql, params = []) {
  try {
    const stmt = env.DB.prepare(sql).bind(...params);
    return await stmt.run();
  } catch (e) {
    console.log('DB RUN ERROR:', e.message, '| SQL:', sql);
    throw e;
  }
}

async function dbFirst(env, sql, params = []) {
  try {
    const stmt = env.DB.prepare(sql).bind(...params);
    return await stmt.first();
  } catch (e) {
    console.log('DB FIRST ERROR:', e.message, '| SQL:', sql);
    return null;
  }
}

async function dbAll(env, sql, params = []) {
  try {
    const stmt = env.DB.prepare(sql).bind(...params);
    const res = await stmt.all();
    return res.results || [];
  } catch (e) {
    console.log('DB ALL ERROR:', e.message, '| SQL:', sql);
    return [];
  }
}

async function bulkInsertModels(env, providerId, modelNames) {
  if (!modelNames || !modelNames.length) return;
  try {
    const stmts = modelNames.map((mn) =>
      env.DB.prepare(`INSERT INTO models (provider_id, model_name) VALUES (?, ?)`).bind(providerId, mn)
    );
    await env.DB.batch(stmts);
  } catch (e) {
    console.log('BULK INSERT MODELS ERROR:', e.message);
  }
}

async function ensureSchema(env) {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      chat_id INTEGER PRIMARY KEY,
      username TEXT,
      first_name TEXT,
      credits INTEGER DEFAULT 20,
      role TEXT DEFAULT 'user',
      custom_model TEXT,
      custom_provider_id INTEGER,
      persona_id INTEGER,
      is_banned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS chat_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER,
      role TEXT,
      content TEXT,
      timestamp TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      base_url TEXT,
      api_key TEXT,
      type TEXT DEFAULT 'openai',
      is_active INTEGER DEFAULT 1
    )`,
    `CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER,
      model_name TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS personas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      prompt_text TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS bot_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      is_private INTEGER DEFAULT 0,
      default_model TEXT,
      default_provider_id INTEGER,
      daily_credit_limit INTEGER DEFAULT 50
    )`,
    `CREATE TABLE IF NOT EXISTS admin_states (
      chat_id INTEGER PRIMARY KEY,
      state TEXT,
      temp_data TEXT
    )`
  ];
  for (const sql of statements) {
    await dbRun(env, sql);
  }
  const settings = await dbFirst(env, `SELECT * FROM bot_settings WHERE id = 1`);
  if (!settings) {
    await dbRun(env, `INSERT INTO bot_settings (id, is_private, daily_credit_limit) VALUES (1, 0, 50)`);
  }
}

async function setState(env, chatId, state, tempData = {}) {
  await dbRun(
    env,
    `INSERT INTO admin_states (chat_id, state, temp_data) VALUES (?, ?, ?)
     ON CONFLICT(chat_id) DO UPDATE SET state = excluded.state, temp_data = excluded.temp_data`,
    [chatId, state, JSON.stringify(tempData)]
  );
}

async function getState(env, chatId) {
  const row = await dbFirst(env, `SELECT * FROM admin_states WHERE chat_id = ?`, [chatId]);
  if (!row) return null;
  let data = {};
  try { data = JSON.parse(row.temp_data || '{}'); } catch (_) {}
  return { state: row.state, data };
}

async function clearState(env, chatId) {
  await dbRun(env, `DELETE FROM admin_states WHERE chat_id = ?`, [chatId]);
}

async function tgCall(env, method, payload) {
  const url = `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.error_code === 429) {
          const waitSec = (data.parameters && data.parameters.retry_after) ? data.parameters.retry_after : 2;
          await sleep(waitSec * 1000 + 250);
          continue;
        }
        console.log('TG API ERROR:', method, JSON.stringify(data));
        return { ok: false, error: data.description };
      }
      return data;
    } catch (e) {
      console.log('TG FETCH EXCEPTION:', method, e.message);
      if (attempt === 2) return { ok: false, error: e.message };
      await sleep(500);
    }
  }
  return { ok: false, error: 'max retries exceeded' };
}

async function sendMessage(env, chatId, text, extra = {}) {
  return tgCall(env, 'sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra
  });
}

async function editMessageText(env, chatId, messageId, text, extra = {}) {
  return tgCall(env, 'editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...extra
  });
}

async function answerCallbackQuery(env, id, text = '', showAlert = false) {
  return tgCall(env, 'answerCallbackQuery', { callback_query_id: id, text, show_alert: showAlert });
}

async function sendChatAction(env, chatId, action = 'typing') {
  return tgCall(env, 'sendChatAction', { chat_id: chatId, action });
}

async function getFile(env, file_id) {
  const res = await tgCall(env, 'getFile', { file_id });
  return res.ok ? res.result : null;
}

async function setWebhook(env, url) {
  return tgCall(env, 'setWebhook', { url, allowed_updates: ['message', 'callback_query'] });
}

async function sendLongMessage(env, chatId, text, extra = {}) {
  const CHUNK = 3500;
  if (text.length <= CHUNK) return sendMessage(env, chatId, text, extra);
  const parts = [];
  let remaining = text;
  while (remaining.length > CHUNK) {
    let idx = remaining.lastIndexOf('\n', CHUNK);
    if (idx < 500) idx = CHUNK;
    parts.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx);
  }
  parts.push(remaining);
  let last;
  for (const p of parts) {
    last = await sendMessage(env, chatId, p, extra);
    await sleep(120);
  }
  return last;
}

function sanitizeAiResponse(raw) {
  try {
    if (!raw) return '';
    let text = escapeHtml(raw);

    text = text.replace(/```[a-zA-Z0-9_+-]*\n?([\s\S]*?)```/g, (_, code) => {
      return `<pre>${code.trim()}</pre>`;
    });

    text = text.replace(/`([^`\n]+?)`/g, '<code>$1</code>');

    text = text.replace(/\*\*([^\n*]+?)\*\*/g, '<b>$1</b>');
    text = text.replace(/__([^\n_]+?)__/g, '<b>$1</b>');

    text = text.replace(/(?<!\*)\*([^\n*]+?)\*(?!\*)/g, '<i>$1</i>');
    text = text.replace(/(?<!_)_([^\n_]+?)_(?!_)/g, '<i>$1</i>');

    text = text.replace(/^#{1,6}\s*(.+)$/gm, '<b>$1</b>');

    text = text.replace(/^[\-\*]\s+/gm, '• ');

    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  } catch (e) {
    console.log('SANITIZE ERROR:', e.message);
    return escapeHtml(raw || '');
  }
}

function appendFooter(text, modelName) {
  const footer = `\n\n🧠 <i>Model: ${escapeHtml(modelName || 'Unknown')}</i>`;
  return text + footer;
}

function mainMenuKeyboard() {
  return {
    keyboard: [
      [{ text: '💬 چت با هوش مصنوعی' }],
      [{ text: '🧹 چت جدید (پاک کردن حافظه)' }, { text: '🎭 تغییر شخصیت' }],
      [{ text: '👤 پروفایل و اعتبار من' }]
    ],
    resize_keyboard: true,
    is_persistent: true
  };
}

function adminPanelInlineKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '📊 داشبورد', callback_data: 'adm_dashboard' }],
      [{ text: '🔌 مدیریت پروایدرها', callback_data: 'adm_providers' }, { text: '🤖 انتخاب مدل پیش‌فرض', callback_data: 'adm_pickmodel_0' }],
      [{ text: '👥 مدیریت کاربران', callback_data: 'adm_users' }, { text: '🎭 مدیریت شخصیت‌ها', callback_data: 'adm_personas' }],
      [{ text: '📢 پیام همگانی', callback_data: 'adm_broadcast' }],
      [{ text: '🔒 حالت خصوصی/عمومی', callback_data: 'adm_toggle_private' }]
    ]
  };
}

function backButton(cb) {
  return { inline_keyboard: [[{ text: '🔙 بازگشت', callback_data: cb }]] };
}

function paginationKeyboard(items, page, prefix, extraRows = []) {
  const PAGE_SIZE = 5;
  const start = page * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);
  const rows = pageItems.map((it) => [{ text: it.label, callback_data: `${prefix}_sel_${it.id}` }]);

  const navRow = [];
  if (page > 0) navRow.push({ text: '◀️ قبلی', callback_data: `${prefix}_page_${page - 1}` });
  if (start + PAGE_SIZE < items.length) navRow.push({ text: 'بعدی ▶️', callback_data: `${prefix}_page_${page + 1}` });
  if (navRow.length) rows.push(navRow);

  return { inline_keyboard: [...rows, ...extraRows] };
}

async function getOrCreateUser(env, chatId, tgUser = {}) {
  let user = await dbFirst(env, `SELECT * FROM users WHERE chat_id = ?`, [chatId]);
  if (user) return { user, isNew: false };

  const role = String(chatId) === String(env.ADMIN_ID) ? 'admin' : 'user';
  await dbRun(
    env,
    `INSERT INTO users (chat_id, username, first_name, credits, role) VALUES (?, ?, ?, ?, ?)`,
    [chatId, tgUser.username || null, tgUser.first_name || null, 20, role]
  );
  user = await dbFirst(env, `SELECT * FROM users WHERE chat_id = ?`, [chatId]);
  return { user, isNew: true };
}

async function isAdmin(env, chatId) {
  return String(chatId) === String(env.ADMIN_ID);
}

async function addMemory(env, chatId, role, content) {
  try {
    await dbRun(env, `INSERT INTO chat_memory (chat_id, role, content) VALUES (?, ?, ?)`, [chatId, role, content]);
    await dbRun(
      env,
      `DELETE FROM chat_memory WHERE chat_id = ? AND id NOT IN (
         SELECT id FROM chat_memory WHERE chat_id = ? ORDER BY id DESC LIMIT 10
       )`,
      [chatId, chatId]
    );
  } catch (e) {
    console.log('ADD MEMORY ERROR:', e.message);
  }
}

async function getMemory(env, chatId) {
  const rows = await dbAll(
    env,
    `SELECT role, content FROM chat_memory WHERE chat_id = ? ORDER BY id ASC LIMIT 10`,
    [chatId]
  );
  return rows;
}

async function clearMemory(env, chatId) {
  await dbRun(env, `DELETE FROM chat_memory WHERE chat_id = ?`, [chatId]);
}

function detectProviderType(baseUrl) {
  if (!baseUrl) return 'openai';
  if (baseUrl.includes('generativelanguage.googleapis.com')) return 'gemini';
  return 'openai';
}

function buildOpenAiMessages({ systemPrompt, history, userText, imageBase64, imageMime }) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });

  for (const h of history) {
    messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
  }

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: userText || 'در این عکس چه می‌بینی؟' },
        { type: 'image_url', image_url: { url: `data:${imageMime};base64,${imageBase64}` } }
      ]
    });
  } else {
    messages.push({ role: 'user', content: userText });
  }
  return messages;
}

async function callOpenAiCompatible({ baseUrl, apiKey, model, systemPrompt, history, userText, imageBase64, imageMime }) {
  const messages = buildOpenAiMessages({ systemPrompt, history, userText, imageBase64, imageMime });
  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  const data = await res.json();
  if (!res.ok) {
    const errMsg = (data && data.error && data.error.message) ? data.error.message : JSON.stringify(data);
    throw new Error(`OpenAI-Compatible API Error: ${errMsg}`);
  }
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('پاسخ خالی از مدل دریافت شد.');
  return content;
}

function buildGeminiContents({ history, userText, imageBase64, imageMime }) {
  const contents = [];
  for (const h of history) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.content }]
    });
  }

  const parts = [{ text: userText || 'در این عکس چه می‌بینی؟' }];
  if (imageBase64) {
    parts.push({ inline_data: { mime_type: imageMime || 'image/jpeg', data: imageBase64 } });
  }
  contents.push({ role: 'user', parts });
  return contents;
}

async function callGemini({ baseUrl, apiKey, model, systemPrompt, history, userText, imageBase64, imageMime }) {
  const contents = buildGeminiContents({ history, userText, imageBase64, imageMime });
  const cleanBase = baseUrl.replace(/\/$/, '');
  const url = `${cleanBase}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = { contents };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  if (!res.ok) {
    const errMsg = (data && data.error && data.error.message) ? data.error.message : JSON.stringify(data);
    throw new Error(`Gemini API Error: ${errMsg}`);
  }
  const content = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') || '';
  if (!content) throw new Error('پاسخ خالی از Gemini دریافت شد.');
  return content;
}

async function callAiUniversal({ provider, model, systemPrompt, history, userText, imageBase64, imageMime }) {
  const type = provider.type || detectProviderType(provider.base_url);
  if (type === 'gemini') {
    return callGemini({
      baseUrl: provider.base_url,
      apiKey: provider.api_key,
      model,
      systemPrompt,
      history,
      userText,
      imageBase64,
      imageMime
    });
  }
  return callOpenAiCompatible({
    baseUrl: provider.base_url,
    apiKey: provider.api_key,
    model,
    systemPrompt,
    history,
    userText,
    imageBase64,
    imageMime
  });
}

async function fetchProviderModels(provider) {
  const type = provider.type || detectProviderType(provider.base_url);
  try {
    if (type === 'gemini') {
      const url = `${provider.base_url.replace(/\/$/, '')}/v1beta/models?key=${provider.api_key}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'خطا در واکشی مدل‌های Gemini');
      return (data.models || [])
        .map(m => (m.name || '').replace('models/', ''))
        .filter(Boolean);
    } else {
      const url = `${provider.base_url.replace(/\/$/, '')}/models`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${provider.api_key}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || 'خطا در واکشی مدل‌ها');
      const list = data.data || data.models || [];
      return list.map(m => m.id || m.name).filter(Boolean);
    }
  } catch (e) {
    console.log('FETCH MODELS ERROR:', e.message);
    throw e;
  }
}

const PROGRESS_FRAMES = [
  '⏳ در حال پردازش\n⬛️⬜️⬜️⬜️⬜️',
  '⏳ در حال پردازش\n🟩⬛️⬜️⬜️⬜️',
  '⏳ در حال پردازش\n🟩🟩⬛️⬜️⬜️',
  '⏳ در حال پردازش\n🟩🟩🟩⬛️⬜️',
  '⏳ در حال پردازش\n🟩🟩🟩🟩⬛️',
  '⏳ در حال پردازش\n🟩🟩🟩🟩🟩'
];

function createFakeStreamer(env, chatId, messageId) {
  let frameIdx = 0;
  let stopped = false;
  let timer = null;

  function tick() {
    if (stopped) return;
    frameIdx = (frameIdx + 1) % PROGRESS_FRAMES.length;
    editMessageText(env, chatId, messageId, PROGRESS_FRAMES[frameIdx]).catch(() => {});
    timer = setTimeout(tick, 2000);
  }

  timer = setTimeout(tick, 2000);

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    }
  };
}

async function getActiveDefaultProviderAndModel(env, user) {
  if (user.custom_model && user.custom_provider_id) {
    const provider = await dbFirst(env, `SELECT * FROM providers WHERE id = ? AND is_active = 1`, [user.custom_provider_id]);
    if (provider) return { provider, model: user.custom_model };
  }

  const settings = await dbFirst(env, `SELECT * FROM bot_settings WHERE id = 1`);
  if (settings && settings.default_model && settings.default_provider_id) {
    const provider = await dbFirst(env, `SELECT * FROM providers WHERE id = ? AND is_active = 1`, [settings.default_provider_id]);
    if (provider) return { provider, model: settings.default_model };
  }

  const provider = await dbFirst(env, `SELECT * FROM providers WHERE is_active = 1 LIMIT 1`);
  if (!provider) return { provider: null, model: null };
  const modelRow = await dbFirst(env, `SELECT * FROM models WHERE provider_id = ? LIMIT 1`, [provider.id]);
  return { provider, model: modelRow ? modelRow.model_name : null };
}

async function getUserPersonaPrompt(env, user) {
  if (!user.persona_id) return null;
  const persona = await dbFirst(env, `SELECT * FROM personas WHERE id = ?`, [user.persona_id]);
  return persona ? persona.prompt_text : null;
}

async function processChatMessage(env, chatId, userText, imageInfo = null) {
  let streamer = null;
  let progressMsgId = null;

  try {
    const { user } = await getOrCreateUser(env, chatId);

    if (user.is_banned) {
      await sendMessage(env, chatId, '🚫 شما توسط ادمین مسدود شده‌اید.');
      return;
    }

    const settings = await dbFirst(env, `SELECT * FROM bot_settings WHERE id = 1`);
    const admin = await isAdmin(env, chatId);
    if (settings && settings.is_private === 1 && !admin) {
      await sendMessage(env, chatId, '🔒 ربات در حال حاضر خصوصی است.');
      return;
    }

    if (user.credits <= 0) {
      await sendMessage(env, chatId, '❌ اعتبار شما تمام شده است. برای دریافت اعتبار بیشتر با ادمین تماس بگیرید.');
      return;
    }

    const { provider, model } = await getActiveDefaultProviderAndModel(env, user);
    if (!provider || !model) {
      await sendMessage(env, chatId, '⚠️ در حال حاضر هیچ مدل هوش مصنوعی فعالی تنظیم نشده. لطفاً به ادمین اطلاع دهید.');
      return;
    }

    await sendChatAction(env, chatId, imageInfo ? 'upload_photo' : 'typing');
    const initMsg = await sendMessage(env, chatId, PROGRESS_FRAMES[0]);
    if (initMsg.ok) {
      progressMsgId = initMsg.result.message_id;
      streamer = createFakeStreamer(env, chatId, progressMsgId);
    }

    const history = await getMemory(env, chatId);
    const personaPrompt = await getUserPersonaPrompt(env, user);
    const systemPrompt = personaPrompt
      ? personaPrompt
      : 'تو یک دستیار هوشمند و مفید هستی. همیشه به زبان فارسی و روان پاسخ بده مگر اینکه کاربر زبان دیگری بخواهد.';

    let imageBase64 = null;
    let imageMime = 'image/jpeg';
    if (imageInfo) {
      const fileData = await getFile(env, imageInfo.file_id);
      if (fileData && fileData.file_path) {
        const fileUrl = `https://api.telegram.org/file/bot${env.BOT_TOKEN}/${fileData.file_path}`;
        const fileRes = await fetch(fileUrl);
        const buffer = await fileRes.arrayBuffer();
        imageBase64 = arrayBufferToBase64(buffer);
        if (fileData.file_path.endsWith('.png')) imageMime = 'image/png';
        else if (fileData.file_path.endsWith('.webp')) imageMime = 'image/webp';
      }
    }

    let aiResponse;
    try {
      aiResponse = await callAiUniversal({
        provider,
        model,
        systemPrompt,
        history,
        userText: userText || (imageBase64 ? 'در این عکس چه می‌بینی؟' : ''),
        imageBase64,
        imageMime
      });
    } catch (aiError) {
      if (streamer) streamer.stop();
      console.log('AI CALL FAILED:', aiError.message);
      const errText = `❌ خطا در ارتباط با سرویس هوش مصنوعی:\n<code>${escapeHtml(aiError.message)}</code>\n\nلطفاً کمی بعد دوباره امتحان کنید یا با ادمین تماس بگیرید.`;
      if (progressMsgId) {
        await editMessageText(env, chatId, progressMsgId, errText);
      } else {
        await sendMessage(env, chatId, errText);
      }
      return;
    }

    if (streamer) streamer.stop();

    const cleanText = sanitizeAiResponse(aiResponse);
    const finalText = appendFooter(cleanText, model);

    if (progressMsgId) {
      const editResult = await editMessageText(env, chatId, progressMsgId, finalText, { reply_markup: mainMenuKeyboard() });
      if (!editResult.ok) {
        await sendLongMessage(env, chatId, finalText, { reply_markup: mainMenuKeyboard() });
      }
    } else {
      await sendLongMessage(env, chatId, finalText, { reply_markup: mainMenuKeyboard() });
    }

    await addMemory(env, chatId, 'user', userText || '[عکس ارسال شد]');
    await addMemory(env, chatId, 'assistant', aiResponse);
    await dbRun(env, `UPDATE users SET credits = credits - 1 WHERE chat_id = ?`, [chatId]);

  } catch (e) {
    console.log('PROCESS CHAT MESSAGE FATAL ERROR:', e.message, e.stack);
    if (streamer) streamer.stop();
    try {
      const errMsg = `❌ خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.\n<code>${escapeHtml(e.message)}</code>`;
      if (progressMsgId) {
        await editMessageText(env, chatId, progressMsgId, errMsg);
      } else {
        await sendMessage(env, chatId, errMsg);
      }
    } catch (_) {
    }
  }
}

async function notifyAdminNewUser(env, tgUser, chatId) {
  try {
    const text = `🆕 <b>کاربر جدید پیوست!</b>\n\n` +
      `👤 نام: ${escapeHtml(tgUser.first_name || '-')}\n` +
      `🔗 یوزرنیم: @${escapeHtml(tgUser.username || 'ندارد')}\n` +
      `🆔 آیدی: <code>${chatId}</code>`;
    await sendMessage(env, env.ADMIN_ID, text);
  } catch (e) {
    console.log('NOTIFY ADMIN ERROR:', e.message);
  }
}

async function handleStart(env, chatId, user, isNew) {
  if (isNew) {
    await sendMessage(env, chatId, 'سایکو https://t.me/SikoTMT ربات‌های کاربردی بیشتر در کانالم هست. جویین بشید.');
    await sleep(300);
  }
  await sendMessage(env, chatId, '👋 به منوی اصلی خوش آمدید. یکی از گزینه‌ها را انتخاب کنید:', {
    reply_markup: mainMenuKeyboard()
  });
}

async function handleProfile(env, chatId, user) {
  const modelLabel = user.custom_model ? escapeHtml(user.custom_model) : 'پیش‌فرض ربات';
  const roleLabel = user.role === 'admin' ? '👑 ادمین' : '👤 کاربر عادی';
  const text =
    `👤 <b>پروفایل شما</b>\n\n` +
    `🆔 آیدی: <code>${chatId}</code>\n` +
    `🎫 نقش: ${roleLabel}\n` +
    `💰 اعتبار باقیمانده: <b>${user.credits}</b>\n` +
    `🤖 مدل فعال: <code>${modelLabel}</code>\n` +
    `📅 عضویت: ${escapeHtml(user.created_at || '-')}`;
  await sendMessage(env, chatId, text);
}

async function handleNewChat(env, chatId) {
  await clearMemory(env, chatId);
  await sendMessage(env, chatId, '✅ حافظه‌ی گفتگو پاک شد. می‌توانید مکالمه‌ی جدیدی را شروع کنید.');
}

async function handlePersonaMenuForUser(env, chatId, page = 0) {
  const personas = await dbAll(env, `SELECT * FROM personas ORDER BY id ASC`);
  if (!personas.length) {
    await sendMessage(env, chatId, 'در حال حاضر هیچ شخصیتی توسط ادمین تعریف نشده است.');
    return;
  }
  const items = personas.map(p => ({ id: p.id, label: `🎭 ${p.title}` }));
  const extra = [[{ text: '🚫 حذف شخصیت (بازگشت به حالت پیش‌فرض)', callback_data: 'persona_clear' }]];
  const kb = paginationKeyboard(items, page, 'persona', extra);
  await sendMessage(env, chatId, '🎭 یک شخصیت را برای هوش مصنوعی انتخاب کنید:', { reply_markup: kb });
}

async function handleIncomingMessage(env, ctx, message) {
  const chatId = message.chat.id;
  const tgUser = message.from || {};
  const { user, isNew } = await getOrCreateUser(env, chatId, tgUser);

  if (isNew) {
    await notifyAdminNewUser(env, tgUser, chatId);
  }

  const state = await getState(env, chatId);
  if (state && state.state) {
    const handled = await handleStateInput(env, ctx, chatId, message, state);
    if (handled) return;
  }

  if (message.photo && message.photo.length) {
    const largest = message.photo[message.photo.length - 1];
    const caption = message.caption || '';
    ctx.waitUntil(processChatMessage(env, chatId, caption, { file_id: largest.file_id }));
    return;
  }

  const text = (message.text || '').trim();
  if (!text) {
    await sendMessage(env, chatId, '⚠️ در حال حاضر فقط متن و عکس پشتیبانی می‌شود.');
    return;
  }

  if (text === '/start') {
    await handleStart(env, chatId, user, isNew);
    return;
  }

  if (text === '/admin') {
    if (await isAdmin(env, chatId)) {
      await sendMessage(env, chatId, '🛠 <b>پنل مدیریت</b>', { reply_markup: adminPanelInlineKeyboard() });
    } else {
      await sendMessage(env, chatId, '⛔️ شما دسترسی به این بخش را ندارید.');
    }
    return;
  }

  if (text === '💬 چت با هوش مصنوعی') {
    await sendMessage(env, chatId, '✍️ پیام خود را بنویسید یا یک عکس ارسال کنید، من پاسخ می‌دهم.');
    return;
  }

  if (text === '🧹 چت جدید (پاک کردن حافظه)') {
    await handleNewChat(env, chatId);
    return;
  }

  if (text === '👤 پروفایل و اعتبار من') {
    await handleProfile(env, chatId, user);
    return;
  }

  if (text === '🎭 تغییر شخصیت') {
    await handlePersonaMenuForUser(env, chatId, 0);
    return;
  }

  ctx.waitUntil(processChatMessage(env, chatId, text, null));
}

async function handleStateInput(env, ctx, chatId, message, state) {
  const text = (message.text || '').trim();
  const { state: st, data } = state;

  try {
    switch (st) {
      case 'awaiting_provider_name': {
        await setState(env, chatId, 'awaiting_provider_url', { name: text });
        await sendMessage(env, chatId, '🔗 حالا Base URL پروایدر را وارد کنید (بدون اسلش انتهایی):\nمثال: https://api.groq.com/openai/v1');
        return true;
      }
      case 'awaiting_provider_url': {
        const newData = { ...data, base_url: text.replace(/\/$/, '') };
        await setState(env, chatId, 'awaiting_provider_key', newData);
        await sendMessage(env, chatId, '🔑 حالا API Key پروایدر را وارد کنید:');
        return true;
      }
      case 'awaiting_provider_key': {
        const type = detectProviderType(data.base_url);
        const insertRes = await dbRun(
          env,
          `INSERT INTO providers (name, base_url, api_key, type, is_active) VALUES (?, ?, ?, ?, 1)`,
          [data.name, data.base_url, text, type]
        );
        const providerId = insertRes.meta.last_row_id;
        await clearState(env, chatId);

        await sendMessage(env, chatId, '⏳ در حال دریافت لیست مدل‌های این پروایدر...');
        try {
          const provider = await dbFirst(env, `SELECT * FROM providers WHERE id = ?`, [providerId]);
          const models = await fetchProviderModels(provider);
          await bulkInsertModels(env, providerId, models);
          await sendMessage(
            env, chatId,
            `✅ پروایدر <b>${escapeHtml(data.name)}</b> با موفقیت اضافه شد.\n📦 تعداد ${models.length} مدل دریافت و ذخیره شد.`,
            { reply_markup: adminPanelInlineKeyboard() }
          );
        } catch (e) {
          await sendMessage(
            env, chatId,
            `⚠️ پروایدر ذخیره شد اما دریافت مدل‌ها ناموفق بود:\n<code>${escapeHtml(e.message)}</code>\nمی‌توانید بعداً از منوی پروایدرها دوباره تلاش کنید.`,
            { reply_markup: adminPanelInlineKeyboard() }
          );
        }
        return true;
      }

      case 'awaiting_user_search': {
        await clearState(env, chatId);
        const targetId = text.replace(/\D/g, '');
        if (!targetId) {
          await sendMessage(env, chatId, '❌ آیدی نامعتبر است.');
          return true;
        }
        await showUserDetail(env, chatId, targetId);
        return true;
      }

      case 'awaiting_credit_amount': {
        await clearState(env, chatId);
        const amount = parseInt(text.replace(/\D/g, ''), 10);
        if (isNaN(amount)) {
          await sendMessage(env, chatId, '❌ لطفاً یک عدد معتبر وارد کنید.');
          return true;
        }
        await dbRun(env, `UPDATE users SET credits = credits + ? WHERE chat_id = ?`, [amount, data.targetId]);
        await sendMessage(env, chatId, `✅ ${amount} اعتبار به کاربر <code>${data.targetId}</code> اضافه شد.`);
        await showUserDetail(env, chatId, data.targetId);
        try {
          await sendMessage(env, data.targetId, `🎁 ${amount} اعتبار توسط ادمین به حساب شما اضافه شد!`);
        } catch (_) {}
        return true;
      }

      case 'awaiting_persona_title': {
        await setState(env, chatId, 'awaiting_persona_prompt', { title: text });
        await sendMessage(env, chatId, '📝 حالا متن پرامپت سیستمی این شخصیت را وارد کنید:');
        return true;
      }
      case 'awaiting_persona_prompt': {
        await dbRun(env, `INSERT INTO personas (title, prompt_text) VALUES (?, ?)`, [data.title, text]);
        await clearState(env, chatId);
        await sendMessage(env, chatId, `✅ شخصیت «${escapeHtml(data.title)}» اضافه شد.`, { reply_markup: adminPanelInlineKeyboard() });
        return true;
      }

      case 'awaiting_broadcast_text': {
        await clearState(env, chatId);
        await sendMessage(env, chatId, '📢 در حال ارسال پیام همگانی... (این کار ممکن است کمی طول بکشد)');
        ctx.waitUntil(runBroadcast(env, chatId, text));
        return true;
      }

      default:
        return false;
    }
  } catch (e) {
    console.log('STATE HANDLER ERROR:', e.message);
    await clearState(env, chatId);
    await sendMessage(env, chatId, '❌ خطایی رخ داد. عملیات لغو شد.');
    return true;
  }
}

async function showDashboard(env, chatId, messageId) {
  const totalUsers = await dbFirst(env, `SELECT COUNT(*) as c FROM users`);
  const bannedUsers = await dbFirst(env, `SELECT COUNT(*) as c FROM users WHERE is_banned = 1`);
  const todayMsgs = await dbFirst(
    env,
    `SELECT COUNT(*) as c FROM chat_memory WHERE role = 'user' AND date(timestamp) = date('now')`
  );
  const settings = await dbFirst(env, `SELECT * FROM bot_settings WHERE id = 1`);
  const privateLabel = settings && settings.is_private ? '🔒 خصوصی' : '🌐 عمومی';

  const text =
    `📊 <b>داشبورد ربات</b>\n\n` +
    `👥 کل کاربران: <b>${totalUsers?.c ?? 0}</b>\n` +
    `🚫 کاربران مسدود: <b>${bannedUsers?.c ?? 0}</b>\n` +
    `💬 پیام‌های امروز: <b>${todayMsgs?.c ?? 0}</b>\n` +
    `⚙️ وضعیت ربات: ${privateLabel}\n` +
    `🤖 مدل پیش‌فرض: <code>${escapeHtml(settings?.default_model || 'تنظیم نشده')}</code>`;

  await editMessageText(env, chatId, messageId, text, { reply_markup: backButton('adm_home') });
}

async function showProvidersMenu(env, chatId, messageId) {
  const providers = await dbAll(env, `SELECT * FROM providers ORDER BY id DESC`);
  const rows = providers.map(p => [{
    text: `${p.is_active ? '🟢' : '🔴'} ${p.name}`,
    callback_data: `adm_prov_view_${p.id}`
  }]);
  rows.push([{ text: '➕ افزودن پروایدر جدید', callback_data: 'adm_prov_add' }]);
  rows.push([{ text: '🔙 بازگشت', callback_data: 'adm_home' }]);

  await editMessageText(env, chatId, messageId, '🔌 <b>مدیریت پروایدرها</b>\nیکی را برای مشاهده جزئیات انتخاب کنید:', {
    reply_markup: { inline_keyboard: rows }
  });
}

async function showProviderDetail(env, chatId, messageId, providerId) {
  const p = await dbFirst(env, `SELECT * FROM providers WHERE id = ?`, [providerId]);
  if (!p) {
    await editMessageText(env, chatId, messageId, '❌ پروایدر یافت نشد.', { reply_markup: backButton('adm_providers') });
    return;
  }
  const modelCount = await dbFirst(env, `SELECT COUNT(*) as c FROM models WHERE provider_id = ?`, [providerId]);
  const maskedKey = p.api_key ? `${p.api_key.slice(0, 4)}****${p.api_key.slice(-4)}` : '-';

  const text =
    `🔌 <b>${escapeHtml(p.name)}</b>\n\n` +
    `🌐 URL: <code>${escapeHtml(p.base_url)}</code>\n` +
    `🔑 API Key: <code>${maskedKey}</code>\n` +
    `📦 تعداد مدل: ${modelCount?.c ?? 0}\n` +
    `⚙️ نوع: ${p.type}\n` +
    `📊 وضعیت: ${p.is_active ? '🟢 فعال' : '🔴 غیرفعال'}`;

  const rows = [
    [{ text: p.is_active ? '🔴 غیرفعال کردن' : '🟢 فعال کردن', callback_data: `adm_prov_toggle_${p.id}` }],
    [{ text: '🔄 بروزرسانی لیست مدل‌ها', callback_data: `adm_prov_refresh_${p.id}` }],
    [{ text: '🗑 حذف پروایدر', callback_data: `adm_prov_delete_${p.id}` }],
    [{ text: '🔙 بازگشت', callback_data: 'adm_providers' }]
  ];

  await editMessageText(env, chatId, messageId, text, { reply_markup: { inline_keyboard: rows } });
}

async function showGlobalModelPicker(env, chatId, messageId, page = 0) {
  const rows = await dbAll(
    env,
    `SELECT models.id as id, models.model_name as model_name, providers.name as pname
     FROM models JOIN providers ON models.provider_id = providers.id
     WHERE providers.is_active = 1 ORDER BY providers.id ASC`
  );
  if (!rows.length) {
    await editMessageText(env, chatId, messageId, '⚠️ هیچ مدلی موجود نیست. ابتدا یک پروایدر اضافه کنید.', { reply_markup: backButton('adm_home') });
    return;
  }
  const items = rows.map(r => ({ id: r.id, label: `${r.pname} / ${r.model_name}` }));
  const kb = paginationKeyboard(items, page, 'gpick', [[{ text: '🔙 بازگشت', callback_data: 'adm_home' }]]);
  await editMessageText(env, chatId, messageId, '🤖 مدل پیش‌فرض سراسری را انتخاب کنید:', { reply_markup: kb });
}

async function showUserManagerEntry(env, chatId, messageId) {
  await setState(env, chatId, 'awaiting_user_search');
  await editMessageText(env, chatId, messageId, '🔎 آیدی عددی کاربر مورد نظر را ارسال کنید:', { reply_markup: backButton('adm_home') });
}

async function showUserDetail(env, chatId, targetId) {
  const u = await dbFirst(env, `SELECT * FROM users WHERE chat_id = ?`, [targetId]);
  if (!u) {
    await sendMessage(env, chatId, '❌ کاربری با این آیدی یافت نشد.');
    return;
  }
  const text =
    `👤 <b>جزئیات کاربر</b>\n\n` +
    `🆔 آیدی: <code>${u.chat_id}</code>\n` +
    `📛 نام: ${escapeHtml(u.first_name || '-')}\n` +
    `🔗 یوزرنیم: @${escapeHtml(u.username || '-')}\n` +
    `💰 اعتبار: <b>${u.credits}</b>\n` +
    `🤖 مدل سفارشی: <code>${escapeHtml(u.custom_model || 'ندارد')}</code>\n` +
    `🚫 وضعیت: ${u.is_banned ? 'مسدود' : 'فعال'}`;

  const rows = [
    [
      { text: u.is_banned ? '✅ رفع مسدودیت' : '🚫 مسدود کردن', callback_data: `adm_user_ban_${u.chat_id}` },
      { text: '💰 افزودن اعتبار', callback_data: `adm_user_addcredit_${u.chat_id}` }
    ],
    [{ text: '🤖 تنظیم مدل سفارشی', callback_data: `adm_user_setmodel_${u.chat_id}_0` }],
    [{ text: '🔙 بازگشت', callback_data: 'adm_home' }]
  ];

  await sendMessage(env, chatId, text, { reply_markup: { inline_keyboard: rows } });
}

async function showUserModelPicker(env, chatId, messageId, targetId, page = 0) {
  const rows = await dbAll(
    env,
    `SELECT models.id as id, models.model_name as model_name, models.provider_id as provider_id, providers.name as pname
     FROM models JOIN providers ON models.provider_id = providers.id
     WHERE providers.is_active = 1 ORDER BY providers.id ASC`
  );
  if (!rows.length) {
    await editMessageText(env, chatId, messageId, '⚠️ هیچ مدلی موجود نیست.', { reply_markup: backButton('adm_home') });
    return;
  }
  const items = rows.map(r => ({ id: r.id, label: `${r.pname} / ${r.model_name}` }));
  const kb = paginationKeyboard(items, page, `upick${targetId}`, [[{ text: '🔙 بازگشت', callback_data: 'adm_home' }]]);
  await editMessageText(env, chatId, messageId, `🤖 مدل سفارشی برای کاربر <code>${targetId}</code>:`, { reply_markup: kb });
}

async function showPersonasManager(env, chatId, messageId) {
  const personas = await dbAll(env, `SELECT * FROM personas ORDER BY id ASC`);
  const rows = personas.map(p => [
    { text: `🎭 ${p.title}`, callback_data: `noop` },
    { text: '🗑', callback_data: `adm_persona_del_${p.id}` }
  ]);
  rows.push([{ text: '➕ افزودن شخصیت جدید', callback_data: 'adm_persona_add' }]);
  rows.push([{ text: '🔙 بازگشت', callback_data: 'adm_home' }]);

  await editMessageText(env, chatId, messageId, '🎭 <b>مدیریت شخصیت‌ها</b>', { reply_markup: { inline_keyboard: rows } });
}

async function runBroadcast(env, adminChatId, text) {
  try {
    const users = await dbAll(env, `SELECT chat_id FROM users WHERE is_banned = 0`);
    let success = 0, fail = 0;
    for (const u of users) {
      try {
        const res = await sendMessage(env, u.chat_id, `📢 <b>پیام از طرف مدیریت:</b>\n\n${escapeHtml(text)}`);
        if (res.ok) success++; else fail++;
      } catch (_) {
        fail++;
      }
      await sleep(60);
    }
    await sendMessage(env, adminChatId, `✅ پخش همگانی تمام شد.\nموفق: ${success} | ناموفق: ${fail}`);
  } catch (e) {
    console.log('BROADCAST ERROR:', e.message);
    await sendMessage(env, adminChatId, `❌ خطا در پخش همگانی: ${escapeHtml(e.message)}`);
  }
}

async function showAdminHome(env, chatId, messageId) {
  await editMessageText(env, chatId, messageId, '🛠 <b>پنل مدیریت ربات</b>\nیکی از گزینه‌ها را انتخاب کنید:', {
    reply_markup: adminPanelInlineKeyboard()
  });
}

async function handleCallbackQuery(env, ctx, cq) {
  const data = cq.data || '';
  const chatId = cq.message.chat.id;
  const messageId = cq.message.message_id;

  try {
    if (data === 'persona_clear') {
      await dbRun(env, `UPDATE users SET persona_id = NULL WHERE chat_id = ?`, [chatId]);
      await answerCallbackQuery(env, cq.id, '✅ شخصیت به حالت پیش‌فرض بازگشت.');
      await editMessageText(env, chatId, messageId, '✅ شخصیت پیش‌فرض فعال شد.');
      return;
    }
    if (data === 'noop') {
      await answerCallbackQuery(env, cq.id, '');
      return;
    }

    let m;
    if ((m = data.match(/^persona_page_(\d+)$/))) {
      const page = parseInt(m[1], 10);
      const personas = await dbAll(env, `SELECT * FROM personas ORDER BY id ASC`);
      const items = personas.map(p => ({ id: p.id, label: `🎭 ${p.title}` }));
      const kb = paginationKeyboard(items, page, 'persona', [[{ text: '🚫 حذف شخصیت', callback_data: 'persona_clear' }]]);
      await editMessageText(env, chatId, messageId, '🎭 یک شخصیت را برای هوش مصنوعی انتخاب کنید:', { reply_markup: kb });
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if ((m = data.match(/^persona_sel_(\d+)$/))) {
      const personaId = m[1];
      const persona = await dbFirst(env, `SELECT * FROM personas WHERE id = ?`, [personaId]);
      await dbRun(env, `UPDATE users SET persona_id = ? WHERE chat_id = ?`, [personaId, chatId]);
      await answerCallbackQuery(env, cq.id, `✅ شخصیت «${persona?.title || ''}» فعال شد.`);
      await editMessageText(env, chatId, messageId, `✅ شخصیت <b>${escapeHtml(persona?.title || '')}</b> فعال شد.\nحافظه‌ی گفتگو نیز پاک شد.`);
      await clearMemory(env, chatId);
      return;
    }

    if (!(await isAdmin(env, chatId))) {
      await answerCallbackQuery(env, cq.id, '⛔️ دسترسی ندارید.', true);
      return;
    }

    if (data === 'adm_home') {
      await showAdminHome(env, chatId, messageId);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_dashboard') {
      await showDashboard(env, chatId, messageId);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_providers') {
      await showProvidersMenu(env, chatId, messageId);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_prov_add') {
      await setState(env, chatId, 'awaiting_provider_name', {});
      await editMessageText(env, chatId, messageId, '📝 نام دلخواه برای این پروایدر را وارد کنید (مثلاً: Groq یا OpenRouter):');
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_users') {
      await showUserManagerEntry(env, chatId, messageId);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_personas') {
      await showPersonasManager(env, chatId, messageId);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_persona_add') {
      await setState(env, chatId, 'awaiting_persona_title', {});
      await editMessageText(env, chatId, messageId, '📝 عنوان شخصیت جدید را وارد کنید (مثلاً: معلم زبان):');
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_broadcast') {
      await setState(env, chatId, 'awaiting_broadcast_text', {});
      await editMessageText(env, chatId, messageId, '📢 متن پیام همگانی را ارسال کنید:');
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if (data === 'adm_toggle_private') {
      const settings = await dbFirst(env, `SELECT * FROM bot_settings WHERE id = 1`);
      const newVal = settings && settings.is_private ? 0 : 1;
      await dbRun(env, `UPDATE bot_settings SET is_private = ? WHERE id = 1`, [newVal]);
      await answerCallbackQuery(env, cq.id, newVal ? '🔒 ربات خصوصی شد.' : '🌐 ربات عمومی شد.', true);
      await showDashboard(env, chatId, messageId);
      return;
    }

    if ((m = data.match(/^adm_pickmodel_(\d+)$/))) {
      await showGlobalModelPicker(env, chatId, messageId, parseInt(m[1], 10));
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if ((m = data.match(/^gpick_page_(\d+)$/))) {
      await showGlobalModelPicker(env, chatId, messageId, parseInt(m[1], 10));
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if ((m = data.match(/^gpick_sel_(\d+)$/))) {
      const modelRow = await dbFirst(env, `SELECT * FROM models WHERE id = ?`, [m[1]]);
      if (modelRow) {
        await dbRun(env, `UPDATE bot_settings SET default_model = ?, default_provider_id = ? WHERE id = 1`, [
          modelRow.model_name, modelRow.provider_id
        ]);
        await answerCallbackQuery(env, cq.id, `✅ مدل پیش‌فرض: ${modelRow.model_name}`, true);
      } else {
        await answerCallbackQuery(env, cq.id, '❌ مدل یافت نشد.', true);
      }
      await showAdminHome(env, chatId, messageId);
      return;
    }

    if ((m = data.match(/^adm_prov_view_(\d+)$/))) {
      await showProviderDetail(env, chatId, messageId, m[1]);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if ((m = data.match(/^adm_prov_toggle_(\d+)$/))) {
      const p = await dbFirst(env, `SELECT * FROM providers WHERE id = ?`, [m[1]]);
      if (p) await dbRun(env, `UPDATE providers SET is_active = ? WHERE id = ?`, [p.is_active ? 0 : 1, m[1]]);
      await showProviderDetail(env, chatId, messageId, m[1]);
      await answerCallbackQuery(env, cq.id, '✅ به‌روزرسانی شد.');
      return;
    }
    if ((m = data.match(/^adm_prov_refresh_(\d+)$/))) {
      const p = await dbFirst(env, `SELECT * FROM providers WHERE id = ?`, [m[1]]);
      await answerCallbackQuery(env, cq.id, '⏳ در حال به‌روزرسانی مدل‌ها...');
      try {
        const models = await fetchProviderModels(p);
        await dbRun(env, `DELETE FROM models WHERE provider_id = ?`, [m[1]]);
        await bulkInsertModels(env, m[1], models);
        await sendMessage(env, chatId, `✅ ${models.length} مدل برای «${escapeHtml(p.name)}» به‌روزرسانی شد.`);
      } catch (e) {
        await sendMessage(env, chatId, `❌ خطا در به‌روزرسانی مدل‌ها:\n<code>${escapeHtml(e.message)}</code>`);
      }
      await showProviderDetail(env, chatId, messageId, m[1]);
      return;
    }
    if ((m = data.match(/^adm_prov_delete_(\d+)$/))) {
      await dbRun(env, `DELETE FROM models WHERE provider_id = ?`, [m[1]]);
      await dbRun(env, `DELETE FROM providers WHERE id = ?`, [m[1]]);
      await answerCallbackQuery(env, cq.id, '🗑 پروایدر حذف شد.', true);
      await showProvidersMenu(env, chatId, messageId);
      return;
    }

    if ((m = data.match(/^adm_persona_del_(\d+)$/))) {
      await dbRun(env, `DELETE FROM personas WHERE id = ?`, [m[1]]);
      await answerCallbackQuery(env, cq.id, '🗑 حذف شد.');
      await showPersonasManager(env, chatId, messageId);
      return;
    }

    if ((m = data.match(/^adm_user_ban_(\d+)$/))) {
      const targetId = m[1];
      const u = await dbFirst(env, `SELECT * FROM users WHERE chat_id = ?`, [targetId]);
      if (u) await dbRun(env, `UPDATE users SET is_banned = ? WHERE chat_id = ?`, [u.is_banned ? 0 : 1, targetId]);
      await answerCallbackQuery(env, cq.id, '✅ به‌روزرسانی شد.');
      await showUserDetail(env, chatId, targetId);
      return;
    }
    if ((m = data.match(/^adm_user_addcredit_(\d+)$/))) {
      const targetId = m[1];
      await setState(env, chatId, 'awaiting_credit_amount', { targetId });
      await answerCallbackQuery(env, cq.id, '');
      await sendMessage(env, chatId, `💰 چه مقدار اعتبار به کاربر <code>${targetId}</code> اضافه شود؟ (عدد وارد کنید)`);
      return;
    }
    if ((m = data.match(/^adm_user_setmodel_(\d+)_(\d+)$/))) {
      const targetId = m[1];
      const page = parseInt(m[2], 10);
      await showUserModelPicker(env, chatId, messageId, targetId, page);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if ((m = data.match(/^upick(\d+)_page_(\d+)$/))) {
      const targetId = m[1];
      const page = parseInt(m[2], 10);
      await showUserModelPicker(env, chatId, messageId, targetId, page);
      await answerCallbackQuery(env, cq.id, '');
      return;
    }
    if ((m = data.match(/^upick(\d+)_sel_(\d+)$/))) {
      const targetId = m[1];
      const modelId = m[2];
      const modelRow = await dbFirst(env, `SELECT * FROM models WHERE id = ?`, [modelId]);
      if (modelRow) {
        await dbRun(env, `UPDATE users SET custom_model = ?, custom_provider_id = ? WHERE chat_id = ?`, [
          modelRow.model_name, modelRow.provider_id, targetId
        ]);
        await answerCallbackQuery(env, cq.id, `✅ مدل کاربر تنظیم شد: ${modelRow.model_name}`, true);
        try {
          await sendMessage(env, targetId, `🤖 مدل هوش مصنوعی شما توسط ادمین تغییر کرد به: <code>${escapeHtml(modelRow.model_name)}</code>`);
        } catch (_) {}
      } else {
        await answerCallbackQuery(env, cq.id, '❌ مدل یافت نشد.', true);
      }
      await showUserDetail(env, chatId, targetId);
      return;
    }

    await answerCallbackQuery(env, cq.id, '');
  } catch (e) {
    console.log('CALLBACK HANDLER ERROR:', e.message, e.stack);
    try { await answerCallbackQuery(env, cq.id, '❌ خطایی رخ داد.', true); } catch (_) {}
  }
}

async function handleSetup(env, request) {
  try {
    const url = new URL(request.url);
    const key = url.searchParams.get('key');

    if (!key || String(key) !== String(env.ADMIN_ID)) {
      return new Response('⛔️ Unauthorized. کلید ادمین اشتباه است.', { status: 401 });
    }

    await ensureSchema(env);

    const webhookUrl = `${url.origin}/webhook`;
    const result = await setWebhook(env, webhookUrl);

    const html = `
      <html dir="rtl" lang="fa">
        <body style="font-family: Tahoma; padding: 30px; background:#111; color:#0f0;">
          <h2>✅ راه‌اندازی با موفقیت انجام شد!</h2>
          <p>📦 دیتابیس D1 ساخته/بررسی شد.</p>
          <p>🔗 Webhook تنظیم شد: <code>${webhookUrl}</code></p>
          <p>📡 نتیجه تلگرام: <code>${JSON.stringify(result)}</code></p>
          <hr/>
          <p>حالا می‌توانید به ربات در تلگرام دستور /start بدهید.</p>
        </body>
      </html>`;
    return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  } catch (e) {
    console.log('SETUP ERROR:', e.message, e.stack);
    return new Response(`❌ خطا در راه‌اندازی: ${e.message}`, { status: 500 });
  }
}

async function handleWebhook(env, ctx, request) {
  try {
    const update = await request.json();

    if (update.callback_query) {
      ctx.waitUntil(handleCallbackQuery(env, ctx, update.callback_query));
      return new Response('OK');
    }

    if (update.message) {
      ctx.waitUntil(
        handleIncomingMessage(env, ctx, update.message).catch((e) => {
          console.log('HANDLE MESSAGE ERROR:', e.message, e.stack);
        })
      );
      return new Response('OK');
    }

    return new Response('OK');
  } catch (e) {
    console.log('WEBHOOK PARSE ERROR:', e.message, e.stack);
    return new Response('OK');
  }
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);

      if (url.pathname === '/setup') {
        return await handleSetup(env, request);
      }

      if (url.pathname === '/webhook' && request.method === 'POST') {
        return await handleWebhook(env, ctx, request);
      }

      return new Response('🤖 AI Gateway Bot is running. برای راه‌اندازی به /setup?key=ADMIN_ID مراجعه کنید.', {
        status: 200
      });
    } catch (e) {
      console.log('FETCH TOP-LEVEL ERROR:', e.message, e.stack);
      return new Response('Internal Error', { status: 500 });
    }
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(
      (async () => {
        try {
          const settings = await dbFirst(env, `SELECT * FROM bot_settings WHERE id = 1`);
          const limit = settings?.daily_credit_limit ?? 50;
          await dbRun(env, `UPDATE users SET credits = ? WHERE role != 'admin'`, [limit]);
          console.log('DAILY CREDIT RESET DONE:', limit);
        } catch (e) {
          console.log('SCHEDULED RESET ERROR:', e.message);
        }
      })()
    );
  }
};
