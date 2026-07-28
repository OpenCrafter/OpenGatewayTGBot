<div align="center" dir="rtl">

# 🤖 AI Gateway Bot

### ربات دروازه هوش مصنوعی سرورلس

**یک ربات تلگرام قدرتمند، سریع و رایگان که ده‌ها مدل هوش مصنوعی را از طریق یک درگاه واحد در اختیار کاربران قرار می‌دهد.**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Platform: Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange.svg)
![Database: D1](https://img.shields.io/badge/Database-Cloudflare%20D1-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.2-blue.svg)
![Telegram Bot API](https://img.shields.io/badge/Bot%20API-Telegram-26A5E4.svg)

[🇮🇷 فارسی](#فارسی) | [🇺🇸 English](#english)

</div>

---

<a id="فارسی"></a>

## 🇮🇷 معرفی پروژه

**ربات دروازه هوش مصنوعی سرورلس** یک ربات تلگرام **تک‌فایلی** است که به‌صورت کامل روی **Cloudflare Workers** و پایگاه‌داده **Cloudflare D1 (SQLite)** اجرا می‌شود.

این پروژه بدون نیاز به زیرساخت‌های پیچیده طراحی شده و برای اجرا به موارد زیر **احتیاج ندارد**:

* ❌ سرور اختصاصی (VPS)
* ❌ هاست یا دامنه
* ❌ نصب کتابخانه‌های خارجی
* ❌ ابزارهای خط فرمان مانند Wrangler CLI

تمام منطق برنامه در یک فایل **JavaScript** قرار دارد و مستقیماً از طریق ویرایشگر آنلاین Cloudflare قابل ویرایش، انتشار و مدیریت است.

این ربات به‌عنوان یک **دروازه هوشمند (Gateway)** میان کاربران تلگرام و سرویس‌های هوش مصنوعی مختلف عمل می‌کند. سیستم علاوه بر مدیریت مدل‌ها و سرویس‌دهنده‌ها، دارای یک **پنل مدیریتی کامل داخل تلگرام** است که کنترل کامل ربات را در اختیار مدیر قرار می‌دهد.

---

### 🎯 ویژگی‌های کلیدی

| ویژگی | توضیح |
|---------|-------|
| 🏗 **معماری Serverless** | اجرای کامل روی Cloudflare Workers بدون مدیریت سرور |
| 💾 **پایگاه‌داده D1** | SQLite توزیع‌شده، پایدار و مقیاس‌پذیر |
| 🔌 **چندپروتکلی** | پشتیبانی همزمان از ۹+ سرویس‌دهنده AI |
| 👑 **پنل ادمین در تلگرام** | مدیریت کامل بدون نیاز به داشبورد وب |
| 💬 **حافظه مکالمه** | ۱۰ پیام اخیر برای هر کاربر |
| 🖼️ **پشتیبانی از تصویر** | تحلیل و پردازش عکس با مدل‌های Vision |
| 🎭 **شخصیت‌های سفارشی** | تغییر سبک پاسخ‌دهی هوش مصنوعی |
| 💰 **سیستم اعتبار** | کنترل مصرف و محدودیت روزانه |
| 📢 **پیام همگانی** | ارسال انبوه به همه کاربران |
| 🔒 **حالت خصوصی/عمومی** | کنترل دسترسی به ربات |

---

### ✨ امکانات کاربران

| امکان | توضیح |
|-------|-------|
| 💬 **گفت‌وگوی هوشمند** | چت با هوش مصنوعی با حفظ حافظه ۱۰ پیام اخیر |
| 🖼️ **تحلیل تصویر** | ارسال عکس برای توضیح، تحلیل، OCR، و... |
| 🎭 **انتخاب شخصیت** | تغییر سبک و لحن پاسخ‌دهی (مثال: معلم، برنامه‌نویس، شاعر) |
| 🧹 **پاک‌سازی حافظه** | شروع مکالمه کاملاً جدید با یک دکمه |
| 👤 **پروفایل و اعتبار** | مشاهده آیدی، یوزرنیم، اعتبار باقی‌مانده، مدل فعال |
| ⏳ **نمایش پردازش** | انیمیشن نوار پیشرفت در هنگام انتظار پاسخ |

---

### 👑 امکانات مدیریتی (فقط ادمین)

#### 📊 داشبورد زنده
- تعداد کل کاربران
- کاربران مسدود شده
- پیام‌های امروز
- وضعیت ربات (عمومی/خصوصی)
- مدل پیش‌فرض فعال

#### 🔌 مدیریت نامحدود پروایدرها
- ➕ افزودن پروایدر جدید (نام، Base URL، API Key)
- 🔄 دریافت خودکار لیست مدل‌ها از API پروایدر
- 🟢/🔴 فعال/غیرفعال کردن
- 🗑 حذف پروایدر
- ⚙️ تشخیص خودکار نوع (OpenAI-compatible / Gemini)

#### 🤖 انتخاب مدل پیش‌فرض
- لیست تمام مدل‌های همه پروایدرهای فعال
- صفحه‌بندی برای تعداد زیاد مدل
- تنظیم مدل سراسری برای همه کاربران

#### 👥 مدیریت کامل کاربران
- 🔎 جستجوی کاربر با آیدی عددی
- 🚫 مسدود/رفع مسدودیت
- 💰 افزایش/کاهش اعتبار
- 🤖 تخصیص مدل اختصاصی به کاربر خاص
- 🔔 اعلان ورود کاربر جدید برای ادمین

#### 🎭 مدیریت شخصیت‌ها
- ➕ ساخت شخصیت جدید (عنوان + پرامپت سیستمی)
- 🗑 حذف شخصیت
- کاربران می‌توانند شخصیت را انتخاب کنند

#### 📢 پیام همگانی
- ارسال پیام به تمام کاربران غیرمسدود
- تأخیر ۶۰ میلی‌ثانیه بین ارسال‌ها (جلوگیری از 429)

#### 🔒 کنترل وضعیت ربات
- 🌐 عمومی: همه کاربران دسترسی دارند
- 🔒 خصوصی: فقط کاربران موجود (بدون کاربر جدید)

---

### ⚙️ ویژگی‌های فنی پیشرفته

| ویژگی | توضیح |
|---------|-------|
| ✅ **OpenAI Compatible** | پشتیبانی کامل از تمام APIهای سازگار OpenAI |
| ✅ **Gemini Native** | پشتیبانی اختصاصی از Google Gemini API |
| ✅ **Auto Detection** | تشخیص خودکار نوع پروایدر از Base URL |
| ✅ **Rate Limit Handling** | مدیریت خطای ۴۲۹ تلگرام با Retry-After |
| ✅ **Timeout Prevention** | استفاده از `ctx.waitUntil()` برای جلوگیری از timeout |
| ✅ **HTML Sanitization** | پاک‌سازی امن خروجی برای جلوگیری از XSS |
| ✅ **Zero Dependencies** | بدون هیچ کتابخانه خارجی (Vanilla JS) |
| ✅ **Free Tier Ready** | بهینه برای پلن رایگان Cloudflare |
| ✅ **Daily Reset** | بازنشانی روزانه اعتبار با Cron Triggers |
| ✅ **Fake Streaming** | شبیه‌سازی استریم برای تجربه کاربری بهتر |

---

### 🏗 معماری سیستم

```
                 کاربران تلگرام
                      │
                      │ HTTPS Webhook
                      ▼
          ┌────────────────────────┐
          │   Cloudflare Worker    │
          │      worker.js         │
          │  (Single Entry Point)  │
          └───────────┬────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼

 ┌────────────┐ ┌─────────────┐ ┌──────────────┐
 │ Cloudflare │ │ AI Providers│ │ Telegram API │
 │    D1      │ │             │ │              │
 │  Database  │ │ • Gemini    │ │ • sendMessage│
 │  (SQLite)  │ │ • Groq      │ │ • editMessage│
 └────────────┘ │ • OpenRouter│ │ • answerCBQ  │
                │ • DeepSeek  │ │ • setWebhook │
                │ • Cerebras  │ └──────────────┘
                │ • Mistral   │
                │ • Cohere    │
                │ • OpenAI    │
                │ • OpenModel │
                └─────────────┘
```

**فلوی درخواست:**
1. کاربر پیام می‌فرستد → Telegram Webhook
2. Worker درخواست را پردازش می‌کند
3. حافظه را از D1 می‌خواند
4. به پروایدر AI مناسب درخواست می‌فرستد
5. پاسخ را Sanitize می‌کند
6. به کاربر برمی‌گرداند + در حافظه ذخیره می‌کند

---

### 🛠 پیش‌نیازها

#### حساب‌های موردنیاز

| سرویس | لینک | کاربرد |
|-------|------|--------|
| **GitHub** | [github.com/join](https://github.com/join) | نگهداری سورس پروژه |
| **Cloudflare** | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) | اجرای Worker + D1 |
| **BotFather** | [t.me/BotFather](https://t.me/BotFather) | ساخت ربات + دریافت توکن |
| **UserInfoBot** | [t.me/userinfobot](https://t.me/userinfobot) | دریافت آیدی عددی مدیر |

---

### 🤖 سرویس‌دهنده‌های هوش مصنوعی پشتیبانی‌شده

| سرویس‌دهنده | دریافت API Key | Base URL | نوع | توضیح |
|------------|---------------|----------|-----|-------|
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `https://generativelanguage.googleapis.com` | Gemini | مدل‌های گوگل (Gemini Pro، Flash، ...) |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | `https://api.groq.com/openai/v1` | OpenAI | بسیار سریع، رایگان، مدل‌های Llama، Mixtral |
| **Mistral AI** | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | `https://api.mistral.ai/v1` | OpenAI | مدل‌های فرانسوی (Mistral Large، Small) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | `https://openrouter.ai/api/v1` | OpenAI | دسترسی به ۳۰۰+ مدل از یکجا |
| **Cerebras** | [cloud.cerebras.ai/platform/api-keys](https://cloud.cerebras.ai/platform/api-keys) | `https://api.cerebras.ai/v1` | OpenAI | inference فوق سریع (Llama 3.1) |
| **OpenModel** | [platform.openmodel.ai/api-keys](https://platform.openmodel.ai/api-keys) | `https://api.openmodel.ai/v1` | OpenAI | مدل‌های متن‌باز |
| **Cohere** | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) | `https://api.cohere.com/v2` | OpenAI | Command R، Embedding |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | `https://api.deepseek.com` | OpenAI | مدل‌های چینی قوی (DeepSeek V3، R1) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | `https://api.openai.com/v1` | OpenAI | GPT-4o، GPT-4o-mini، ... |

> 💡 **نکته:** برای هر پروایدر OpenAI-compatible، فقط Base URL و API Key کافیست. ربات به‌صورت خودکار مدل‌ها را واکشی می‌کند.

---

### 🚀 راهنمای نصب کامل

#### مرحله ۱: دریافت فایل
```
فایل worker.js را از بخش Releases دانلود کنید یا از همین ریپو کپی کنید.
```

#### مرحله ۲: ساخت Worker در Cloudflare
1. به [داشبورد Cloudflare](https://dash.cloudflare.com) بروید
2. از منوی سمت چپ: **Workers & Pages** → **Create Application**
3. تب **Hello World** → **Deploy** (یا **Create Worker**)
4. نام دلخواه انتخاب کنید (مثال: `ai-gateway-bot`)
5. وارد ویرایشگر کد شوید

#### مرحله ۳: جایگذاری کد
1. تمام محتوای `worker.js` را کپی کنید
2. در ویرایشگر Cloudflare جایگزین کد پیش‌فرض کنید
3. **Save** بزنید

#### مرحله ۴: ساخت و اتصال پایگاه‌داده D1
1. از منوی سمت چپ: **D1 SQL Database** → **Create**
2. نام دلخواه (مثال: `ai-gateway-db`) → **Create**
3. در تنظیمات Worker: **Settings** → **D1 Database Bindings**
4. **Add** → Variable name: `DB` → دیتابیسی که ساختید → **Deploy**

#### مرحله ۵: تنظیم متغیرهای محیطی
در تنظیمات Worker: **Settings** → **Variables** → **Add Variable**:

| نام متغیر | مقدار | توضیح |
|-----------|-------|-------|
| `BOT_TOKEN` | `123456:ABC-DEF...` | توکن ربات از BotFather |
| `ADMIN_ID` | `123456789` | آیدی عددی شما از UserInfoBot |

#### مرحله ۶: Deploy نهایی
روی **Save and Deploy** کلیک کنید.

#### مرحله ۷: راه‌اندازی اولیه (Setup)
در مرورگر آدرس زیر را باز کنید:
```
https://YOUR-WORKER.workers.dev/setup?key=ADMIN_ID
```
(به جای `YOUR-WORKER` نام Worker خود را، به جای `ADMIN_ID` آیدی عددی خود را بگذارید)

خروجی باید چنین باشد:
```
✅ راه‌اندازی با موفقیت انجام شد!
📦 دیتابیس D1 ساخته/بررسی شد.
🔗 Webhook تنظیم شد: https://YOUR-WORKER.workers.dev/webhook
📡 نتیجه تلگرام: {"ok":true,"result":true,"description":"Webhook was set"}
```

#### مرحله ۸: فعال‌سازی ربات در تلگرام
1. ربات خود را در تلگرام باز کنید
2. دستور `/start` را ارسال کنید
3. پیام خوش‌آمدگویی و منوی اصلی نمایش داده می‌شود

#### مرحله ۹: تنظیمات اولیه (مهم!)
```
1. در تلگرام /admin بزنید
2. 🔌 مدیریت پروایدرها → ➕ افزودن پروایدر جدید
3. نام: Groq (یا هر نامی)
4. Base URL: https://api.groq.com/openai/v1
5. API Key: کلید خود را از console.groq.com بگذارید
6. مدل‌ها به‌صورت خودکار واکشی می‌شوند
7. 🤖 انتخاب مدل پیش‌فرض → یک مدل انتخاب کنید
8. 🎉 ربات کاملاً آماده است!
```

---

### 📌 نکات مهم و نکات امنیتی

| نکته | اهمیت |
|-------|-------|
| 🔐 **توکن‌ها فقط در Variables** | هرگز توکن ربات یا API Key را در کد هاردکد نکنید |
| 💰 **پلن رایگان Cloudflare** | ۱۰۰,۰۰۰ درخواست/روز، ۵ میلیون خواندن D1/روز |
| 📈 **مقیاس‌پذیری خودکار** | Cloudflare به‌صورت خودکار ترافیک را مدیریت می‌کند |
| 🔄 **بازنشانی روزانه** | اعتبار کاربران هر روز ساعت ۰۰:۰۰ UTC ریست می‌شود |
| 🛡 **امنیت HTML** | تمام خروجی‌ها Sanitize می‌شوند (جلوگیری از XSS) |
| ⚠️ **خطای ۴۲۹** | ربات به‌صورت خودکار retry می‌کند با تأخیر مناسب |

---

### 🔧 متغیرهای دیتابیس (Schema)

```sql
-- کاربران
users (chat_id PK, username, first_name, credits, role, 
       custom_model, custom_provider_id, persona_id, 
       is_banned, created_at)

-- حافظه چت
chat_memory (id PK, chat_id, role, content, timestamp)

-- پروایدرها
providers (id PK, name, base_url, api_key, type, is_active)

-- مدل‌ها
models (id PK, provider_id FK, model_name)

-- شخصیت‌ها
personas (id PK, title, prompt_text)

-- تنظیمات ربات
bot_settings (id PK=1, is_private, default_model, 
              default_provider_id, daily_credit_limit)

-- وضعیت ادمین (FSM)
admin_states (chat_id PK, state, temp_data)
```

---

### 🤝 مشارکت در پروژه

مشارکت شما خوش‌آمد است!

1. Fork کنید
2. Branch بسازید: `git checkout -b feature/amazing-feature`
3. Commit کنید: `git commit -m 'Add amazing feature'`
4. Push کنید: `git push origin feature/amazing-feature`
5. Pull Request باز کنید

---

### 📄 مجوز

این پروژه تحت **مجوز MIT** منتشر شده است. برای جزئیات فایل [LICENSE](LICENSE) را ببینید.

---

<div align="center" dir="rtl">

---

**ساخته شده با ❤️ توسط [Siko TMT](https://t.me/SikoTMT)**

📢 کانال تلگرام: [@Siko_TMT](https://t.me/Siko_TMT)  
🔵 اکس (توییتر): [@Siko_Tmt](https://x.com/Siko_Tmt)  
💬 تماس: [@SikoTMT](https://t.me/SikoTMT)

</div>

---

<a id="english"></a>

## 🇬🇧 Introduction

**AI Gateway Bot** is a **single-file**, serverless Telegram bot that runs entirely on **Cloudflare Workers** with **Cloudflare D1 (SQLite)** database.

This project is designed without complex infrastructure requirements — **no need for**:

* ❌ VPS or dedicated server
* ❌ Hosting or domain
* ❌ External library installation
* ❌ CLI tools like Wrangler

All application logic resides in a single **JavaScript** file, editable and deployable directly via the Cloudflare online editor.

The bot acts as a **Smart Gateway** between Telegram users and multiple AI providers, featuring a **complete admin panel built right inside Telegram**.

---

### 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 🏗 **Serverless Architecture** | Runs on Cloudflare Workers — zero server management |
| 💾 **D1 Database** | Distributed SQLite, persistent and scalable |
| 🔌 **Multi-Protocol** | Supports 9+ AI providers simultaneously |
| 👑 **In-Telegram Admin Panel** | Full management without web dashboard |
| 💬 **Conversation Memory** | Last 10 messages per user |
| 🖼️ **Image Support** | Vision analysis with multimodal models |
| 🎭 **Custom Personas** | Switch AI response style/personality |
| 💰 **Credit System** | Usage control with daily limits |
| 📢 **Broadcast Messaging** | Send to all users at once |
| 🔒 **Public/Private Mode** | Control bot access |

---

### ✨ User Features

| Feature | Description |
|---------|-------------|
| 💬 **Smart Chat** | AI conversation with 10-message memory window |
| 🖼️ **Image Analysis** | Send photos for description, analysis, OCR |
| 🎭 **Persona Selection** | Change response style (Teacher, Coder, Poet, etc.) |
| 🧹 **Clear Memory** | Start fresh conversation with one tap |
| 👤 **Profile & Credits** | View ID, username, remaining credits, active model |
| ⏳ **Progress Indicator** | Animated progress bar during processing |

---

### 👑 Admin Features (Admin Only)

#### 📊 Live Dashboard
- Total users
- Banned users
- Today's messages
- Bot status (Public/Private)
- Active default model

#### 🔌 Unlimited Provider Management
- ➕ Add new provider (Name, Base URL, API Key)
- 🔄 Auto-fetch model list from provider API
- 🟢/🔴 Enable/Disable providers
- 🗑 Delete providers
- ⚙️ Auto-detect type (OpenAI-compatible / Gemini)

#### 🤖 Default Model Selection
- Paginated list of all models from active providers
- Set global default model for all users

#### 👥 Complete User Management
- 🔎 Search user by numeric ID
- 🚫 Ban/Unban users
- 💰 Add/Subtract credits
- 🤖 Assign custom model to specific user
- 🔔 New user join notifications

#### 🎭 Persona Management
- ➕ Create persona (Title + System Prompt)
- 🗑 Delete personas
- Users can select their preferred persona

#### 📢 Broadcast Messages
- Send message to all non-banned users
- 60ms delay between sends (prevents 429 errors)

#### 🔒 Bot Access Control
- 🌐 Public: Everyone can use
- 🔒 Private: Only existing users (no new joins)

---

### ⚙️ Advanced Technical Features

| Feature | Description |
|---------|-------------|
| ✅ **OpenAI Compatible** | Full support for all OpenAI-compatible APIs |
| ✅ **Gemini Native** | Dedicated Google Gemini API support |
| ✅ **Auto Detection** | Auto-detect provider type from Base URL |
| ✅ **Rate Limit Handling** | Handles Telegram 429 with Retry-After |
| ✅ **Timeout Prevention** | Uses `ctx.waitUntil()` to avoid timeouts |
| ✅ **HTML Sanitization** | Secure output sanitization (XSS prevention) |
| ✅ **Zero Dependencies** | Pure Vanilla JS — no external libraries |
| ✅ **Free Tier Optimized** | Designed for Cloudflare free plan limits |
| ✅ **Daily Credit Reset** | Automatic reset via Cron Triggers |
| ✅ **Fake Streaming** | Simulated streaming for better UX |

---

### 🏗 System Architecture

```
                 Telegram Users
                      │
                      │ HTTPS Webhook
                      ▼
          ┌────────────────────────┐
          │   Cloudflare Worker    │
          │      worker.js         │
          │  (Single Entry Point)  │
          └───────────┬────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼

 ┌────────────┐ ┌─────────────┐ ┌──────────────┐
 │ Cloudflare │ │ AI Providers│ │ Telegram API │
 │    D1      │ │             │ │              │
 │  Database  │ │ • Gemini    │ │ • sendMessage│
 │  (SQLite)  │ │ • Groq      │ │ • editMessage│
 └────────────┘ │ • OpenRouter│ │ • answerCBQ  │
                │ • DeepSeek  │ │ • setWebhook │
                │ • Cerebras  │ └──────────────┘
                │ • Mistral   │
                │ • Cohere    │
                │ • OpenAI    │
                │ • OpenModel │
                └─────────────┘
```

**Request Flow:**
1. User sends message → Telegram Webhook
2. Worker processes request
3. Reads memory from D1
4. Forwards to appropriate AI provider
5. Sanitizes response
6. Returns to user + stores in memory

---

### 🛠 Prerequisites

#### Required Accounts

| Service | Link | Purpose |
|---------|------|---------|
| **GitHub** | [github.com/join](https://github.com/join) | Source code hosting |
| **Cloudflare** | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) | Worker + D1 hosting |
| **BotFather** | [t.me/BotFather](https://t.me/BotFather) | Create bot + get token |
| **UserInfoBot** | [t.me/userinfobot](https://t.me/userinfobot) | Get admin numeric ID |

---

### 🤖 Supported AI Providers

| Provider | Get API Key | Base URL | Type | Notes |
|----------|-------------|----------|------|-------|
| **Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `https://generativelanguage.googleapis.com` | Gemini | Google models (Pro, Flash, etc.) |
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | `https://api.groq.com/openai/v1` | OpenAI | Ultra-fast, free, Llama/Mixtral |
| **Mistral AI** | [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | `https://api.mistral.ai/v1` | OpenAI | French models (Large, Small) |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | `https://openrouter.ai/api/v1` | OpenAI | 300+ models via single API |
| **Cerebras** | [cloud.cerebras.ai/platform/api-keys](https://cloud.cerebras.ai/platform/api-keys) | `https://api.cerebras.ai/v1` | OpenAI | Fastest inference (Llama 3.1) |
| **OpenModel** | [platform.openmodel.ai/api-keys](https://platform.openmodel.ai/api-keys) | `https://api.openmodel.ai/v1` | OpenAI | Open-source models |
| **Cohere** | [dashboard.cohere.com/api-keys](https://dashboard.cohere.com/api-keys) | `https://api.cohere.com/v2` | OpenAI | Command R, Embeddings |
| **DeepSeek** | [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) | `https://api.deepseek.com` | OpenAI | Chinese models (V3, R1) |
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | `https://api.openai.com/v1` | OpenAI | GPT-4o, GPT-4o-mini, etc. |

> 💡 **Note:** For any OpenAI-compatible provider, just Base URL + API Key is enough. Bot auto-fetches models.

---

### 🚀 Complete Installation Guide

#### Step 1: Get the File
```
Download worker.js from Releases or copy from this repo.
```

#### Step 2: Create Worker on Cloudflare
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Left menu: **Workers & Pages** → **Create Application**
3. **Hello World** tab → **Deploy** (or **Create Worker**)
4. Choose name (e.g., `ai-gateway-bot`)
5. Enter code editor

#### Step 3: Paste Code
1. Copy entire `worker.js` content
2. Replace default code in Cloudflare editor
3. Click **Save**

#### Step 4: Create & Bind D1 Database
1. Left menu: **D1 SQL Database** → **Create**
2. Name it (e.g., `ai-gateway-db`) → **Create**
3. Worker Settings → **D1 Database Bindings**
4. **Add** → Variable name: `DB` → Select your DB → **Deploy**

#### Step 5: Set Environment Variables
Worker Settings → **Variables** → **Add Variable**:

| Variable | Value | Description |
|----------|-------|-------------|
| `BOT_TOKEN` | `123456:ABC-DEF...` | Bot token from BotFather |
| `ADMIN_ID` | `123456789` | Your numeric ID from UserInfoBot |

#### Step 6: Final Deploy
Click **Save and Deploy**.

#### Step 7: Initial Setup
Open in browser:
```
https://YOUR-WORKER.workers.dev/setup?key=ADMIN_ID
```
(Replace `YOUR-WORKER` with your Worker name, `ADMIN_ID` with your numeric ID)

Expected output:
```
✅ Setup completed successfully!
📦 D1 database created/verified.
🔗 Webhook set: https://YOUR-WORKER.workers.dev/webhook
📡 Telegram result: {"ok":true,"result":true,"description":"Webhook was set"}
```

#### Step 8: Activate in Telegram
1. Open your bot in Telegram
2. Send `/start`
3. Welcome message and main menu appear

#### Step 9: Initial Configuration (Required!)
```
1. Send /admin in Telegram
2. 🔌 Provider Management → ➕ Add New Provider
3. Name: Groq (or any name)
4. Base URL: https://api.groq.com/openai/v1
5. API Key: Your key from console.groq.com
6. Models auto-fetched
7. 🤖 Select Default Model → Pick a model
8. 🎉 Bot is fully ready!
```

---

### 📌 Important Notes & Security

| Note | Importance |
|------|------------|
| 🔐 **Tokens only in Variables** | Never hardcode bot token or API keys in code |
| 💰 **Cloudflare Free Plan** | 100k requests/day, 5M D1 reads/day |
| 📈 **Auto-scaling** | Cloudflare handles traffic automatically |
| 🔄 **Daily Reset** | Credits reset daily at 00:00 UTC |
| 🛡 **HTML Security** | All outputs sanitized (XSS prevention) |
| ⚠️ **429 Handling** | Auto-retry with proper backoff |

---

### 🔧 Database Schema

```sql
-- Users
users (chat_id PK, username, first_name, credits, role, 
       custom_model, custom_provider_id, persona_id, 
       is_banned, created_at)

-- Chat Memory
chat_memory (id PK, chat_id, role, content, timestamp)

-- Providers
providers (id PK, name, base_url, api_key, type, is_active)

-- Models
models (id PK, provider_id FK, model_name)

-- Personas
personas (id PK, title, prompt_text)

-- Bot Settings
bot_settings (id PK=1, is_private, default_model, 
              default_provider_id, daily_credit_limit)

-- Admin States (FSM)
admin_states (chat_id PK, state, temp_data)
```

---

### 🤝 Contributing

Contributions welcome!

1. Fork the repo
2. Create branch: `git checkout -b feature/amazing-feature`
3. Commit: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open Pull Request

---

### 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<div align="center">

---

**Made with ❤️ by [Siko TMT](https://t.me/SikoTMT)**

📢 Telegram Channel: [@Siko_TMT](https://t.me/Siko_TMT)  
🔵 X (Twitter): [@Siko_Tmt](https://x.com/Siko_Tmt)  
💬 Contact: [@SikoTMT](https://t.me/SikoTMT)

</div>