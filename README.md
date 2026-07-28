<div align="center">

# 🤖 AI Gateway Bot

### ربات دروازه هوش مصنوعی سرورلس

**یک ربات تلگرام قدرتمند، سریع و رایگان که ده‌ها مدل هوش مصنوعی را از طریق یک درگاه واحد در اختیار کاربران قرار می‌دهد.**

![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)
![Platform: Cloudflare Workers](https://img.shields.io/badge/Platform-Cloudflare%20Workers-orange.svg)
![Database: D1](https://img.shields.io/badge/Database-Cloudflare%20D1-blue.svg)
![Version](https://img.shields.io/badge/Version-1.0.2-blue.svg)
![Telegram Bot API](https://img.shields.io/badge/Bot%20API-Telegram-26A5E4.svg)

[🇷🇺 فارسی](#فارسی) | [🇺🇸 English](#english)

</div>

---

<a id="english"></a>

## 🇬🇧 Introduction

**AI Gateway Bot** is a single-file, serverless Telegram bot that runs entirely on **Cloudflare Workers** with **Cloudflare D1** database.

It acts as a **smart gateway** between Telegram users and multiple AI providers, featuring a complete admin panel built right into Telegram.

### Why Use It?

- ❌ No VPS or hosting required
- ❌ No external dependencies or CLI tools
- ❌ No domain needed
- ✅ Runs on Cloudflare's **free tier**
- ✅ Single `worker.js` file — edit in Cloudflare dashboard
- ✅ Supports 9+ AI providers out of the box
- ✅ Full admin panel inside Telegram

---

### ✨ Features

#### 👤 User Features

| Feature | Description |
|---------|-------------|
| 💬 Smart Chat | Conversation with memory (last 10 messages) |
| 🖼️ Image Analysis | Send photos for AI-powered vision |
| 🎭 Custom Personas | Choose AI personality for different styles |
| 🧹 Clear Memory | Start fresh conversations anytime |
| 👤 Profile | View account info, active model & credits |
| ⏳ Progress Bar | Visual processing indicator |

#### 👑 Admin Features

| Feature | Description |
|---------|-------------|
| 📊 Dashboard | Live stats — users, messages, status |
| 🔌 Provider Management | Add/edit/remove AI providers unlimited |
| 📦 Auto Model Fetch | Automatically fetch available models |
| 🤖 Default Model | Set global default with pagination |
| 👥 User Management | Ban/unban, credits, custom models |
| 🎭 Persona Management | Create & manage custom AI personalities |
| 📢 Broadcast | Send messages to all users |
| 🔒 Private Mode | Toggle public/private bot access |
| 🔔 Notifications | Get alerted when new users join |

---

### ⚙️ Technical Highlights

- ✅ Supports **all OpenAI-compatible APIs**
- ✅ Dedicated **Google Gemini** support
- ✅ Auto-detect provider type
- ✅ Telegram rate limit (429) handling
- ✅ Timeout prevention with `ctx.waitUntil()`
- ✅ Safe HTML sanitization
- ✅ Zero external dependencies
- ✅ Runs on Cloudflare free plan

---

### 🏗 Architecture

```
              Telegram Users
                   │
                   │ Webhook
                   ▼
       ┌────────────────────┐
       │   Cloudflare Worker │
       │      worker.js      │
       └─────────┬──────────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
     ▼           ▼           ▼

┌──────────┐ ┌──────────┐ ┌────────────┐
│Cloudflare│ │AI Provider│ │ Telegram   │
│   D1     │ │           │ │   API      │
│ Database │ │ Gemini    │ │ Messages   │
│ SQLite   │ │ Groq      │ │ Management │
└──────────┘ │ OpenRouter│ └────────────┘
             │ DeepSeek  │
             │ ...       │
             └──────────┘
```

---

### 🛠 Prerequisites

#### Accounts Needed

| Service | Link | Purpose |
|---------|------|---------|
| GitHub | [github.com/join](https://github.com/join) | Source code hosting |
| Cloudflare | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) | Worker hosting |
| BotFather | [t.me/BotFather](https://t.me/BotFather) | Create Telegram bot |
| UserInfoBot | [t.me/userinfobot](https://t.me/userinfobot) | Get admin chat ID |

#### Supported AI Providers

| Provider | API Key | Base URL | Notes |
|----------|---------|----------|-------|
| Gemini | [Get Key](https://aistudio.google.com/apikey) | `https://generativelanguage.googleapis.com` | Google models |
| Groq | [Get Key](https://console.groq.com/keys) | `https://api.groq.com/openai/v1` | Fast & free |
| Mistral AI | [Get Key](https://console.mistral.ai/api-keys) | `https://api.mistral.ai/v1` | French models |
| OpenRouter | [Get Key](https://openrouter.ai/keys) | `https://openrouter.ai/api/v1` | Multi-model access |
| Cerebras | [Get Key](https://cloud.cerebras.ai/platform/api-keys) | `https://api.cerebras.ai/v1` | Ultra-fast inference |
| OpenModel | [Get Key](https://platform.openmodel.ai/api-keys) | `https://api.openmodel.ai/v1` | Open-source models |
| Cohere | [Get Key](https://dashboard.cohere.com/api-keys) | `https://api.cohere.com/v2` | Chat & Embedding |
| DeepSeek | [Get Key](https://platform.deepseek.com/api_keys) | `https://api.deepseek.com` | Chinese models |
| OpenAI | [Get Key](https://platform.openai.com/api-keys) | `https://api.openai.com/v1` | ChatGPT models |

---

### 🚀 Quick Start

```
1️⃣ Download worker.js

2️⃣ Create a new Worker in Cloudflare Dashboard

3️⃣ Paste the code into the Worker editor

4️⃣ Create a D1 database and bind it as "DB"

5️⃣ Set environment variables:
   BOT_TOKEN = your Telegram bot token
   ADMIN_ID  = your Telegram user ID

6️⃣ Click Deploy

7️⃣ Open in browser:
   https://YOUR-WORKER.workers.dev/setup?key=ADMIN_ID

8️⃣ Open your bot in Telegram and send /start

9️⃣ First steps after setup:
   → Send /admin
   → "Provider Management" → "Add New Provider"
   → Add a provider (e.g., Groq)
   → "Select Default Model" → Pick a model
   → 🎉 Bot is ready!
```

---

### 📌 Important Notes

- 🔐 Store sensitive data (bot token, API keys) **only** in Cloudflare Variables
- 💰 This project runs on Cloudflare's **free tier**
- 📈 Serverless architecture ensures **scalability** and **zero maintenance**
- 🔄 Daily credit reset via Cloudflare Cron Triggers

---

### 🤝 Contributing

Contributions are welcome! Feel free to open issues and pull requests.

### 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Made with ❤️ by [Siko TMT](https://t.me/SikoTMT)**

</div>

---

<a id="فارسی"></a>

## 🇮🇷 معرفی پروژه

**ربات دروازه هوش مصنوعی سرورلس** یک ربات تلگرام تک‌فایلی است که به‌صورت کامل روی **Cloudflare Workers** و پایگاه‌داده **Cloudflare D1** اجرا می‌شود.

این ربات به‌عنوان یک **دروازه هوشمند (Gateway)** میان کاربران تلگرام و سرویس‌های هوش مصنوعی مختلف عمل می‌کند و دارای پنل مدیریتی کامل داخل تلگرام است.

### چرا از این ربات استفاده کنیم؟

- ❌ نیازی به سرور اختصاصی (VPS) نیست
- ❌ نیازی به هاست یا دامنه نیست
- ❌ بدون وابستگی به کتابخانه‌های خارجی
- ✅ اجرای کامل روی **پلن رایگان Cloudflare**
- ✅ تک فایل `worker.js` — قابل ویرایش در داشبورد Cloudflare
- ✅ پشتیبانی از ۹+ سرویس‌دهنده هوش مصنوعی
- ✅ پنل مدیریتی کامل داخل تلگرام

---

### ✨ امکانات

#### 👤 امکانات کاربران

| امکان | توضیح |
|-------|-------|
| 💬 گفت‌وگوی هوشمند | با حافظه مکالمه (۱۰ پیام اخیر) |
| 🖼️ تحلیل تصویر | ارسال عکس برای تحلیل با هوش مصنوعی |
| 🎭 شخصیت‌های سفارشی | انتخاب سبک پاسخ‌دهی هوش مصنوعی |
| 🧹 پاک‌سازی حافظه | شروع مکالمه جدید در هر زمان |
| 👤 پروفایل | مشاهده اطلاعات حساب، مدل فعال و اعتبار |
| ⏳ نوار پیشرفت | نمایش وضعیت پردازش |

#### 👑 امکانات مدیریتی

| امکان | توضیح |
|-------|-------|
| 📊 داشبورد | آمار زنده کاربران و وضعیت سیستم |
| 🔌 مدیریت پروایدرها | افزودن، حذف، ویرایش و فعال‌سازی نامحدود |
| 📦 دریافت خودکار مدل‌ها | واکشی خودکار فهرست مدل‌های هر پروایدر |
| 🤖 مدل پیش‌فرض | انتخاب مدل پیش‌فرض با صفحه‌بندی |
| 👥 مدیریت کاربران | مسدودسازی، فعال‌سازی، اعتبار، مدل اختصاصی |
| 🎭 مدیریت شخصیت‌ها | ساخت و مدیریت شخصیت‌های سفارشی |
| 📢 پیام همگانی | ارسال پیام به تمام کاربران |
| 🔒 حالت خصوصی/عمومی | کنترل دسترسی ربات |
| 🔔 اعلان ورود | اطلاع‌رسانی ورود کاربران جدید |

---

### ⚙️ ویژگی‌های فنی

- ✅ پشتیبانی از تمام APIهای سازگار با OpenAI
- ✅ پشتیبانی اختصاصی از Google Gemini API
- ✅ تشخیص خودکار نوع سرویس‌دهنده
- ✅ مدیریت محدودیت ارسال پیام (خطای 429)
- ✅ جلوگیری از Timeout با `ctx.waitUntil()`
- ✅ پاک‌سازی امن خروجی HTML
- ✅ بدون وابستگی به کتابخانه‌های خارجی
- ✅ اجرای کامل به‌صورت Serverless

---

### 🏗 معماری سیستم

```
                 کاربران تلگرام
                      │
                      │ Webhook
                      ▼
          ┌────────────────────┐
          │   Cloudflare Worker │
          │      worker.js      │
          └─────────┬──────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼

 ┌──────────┐ ┌──────────┐ ┌────────────┐
 │Cloudflare│ │سرویس‌دهنده│ │ Telegram   │
 │   D1     │ │    AI    │ │   API      │
 │ پایگاه‌   │ │ Gemini   │ │ مدیریت     │
 │  داده    │ │ Groq     │ │  پیام‌ها    │
 └──────────┘ │OpenRouter│ └────────────┘
              │ DeepSeek │
              │ ...      │
              └──────────┘
```

---

### 🛠 پیش‌نیازها

#### حساب‌های موردنیاز

| سرویس | لینک | کاربرد |
|-------|------|--------|
| GitHub | [github.com/join](https://github.com/join) | نگهداری سورس پروژه |
| Cloudflare | [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) | اجرای Worker |
| BotFather | [t.me/BotFather](https://t.me/BotFather) | ساخت ربات تلگرام |
| UserInfoBot | [t.me/userinfobot](https://t.me/userinfobot) | دریافت شناسه مدیر |

#### سرویس‌دهنده‌های هوش مصنوعی

| سرویس‌دهنده | دریافت API Key | Base URL | توضیح |
|------------|---------------|----------|-------|
| Gemini | [دریافت کلید](https://aistudio.google.com/apikey) | `https://generativelanguage.googleapis.com` | مدل‌های گوگل |
| Groq | [دریافت کلید](https://console.groq.com/keys) | `https://api.groq.com/openai/v1` | سریع و رایگان |
| Mistral AI | [دریافت کلید](https://console.mistral.ai/api-keys) | `https://api.mistral.ai/v1` | مدل‌های فرانسوی |
| OpenRouter | [دریافت کلید](https://openrouter.ai/keys) | `https://openrouter.ai/api/v1` | دسترسی چندمدلی |
| Cerebras | [دریافت کلید](https://cloud.cerebras.ai/platform/api-keys) | `https://api.cerebras.ai/v1` | پردازش فوق سریع |
| OpenModel | [دریافت کلید](https://platform.openmodel.ai/api-keys) | `https://api.openmodel.ai/v1` | مدل‌های متن‌باز |
| Cohere | [دریافت کلید](https://dashboard.cohere.com/api-keys) | `https://api.cohere.com/v2` | گفتگو و Embedding |
| DeepSeek | [دریافت کلید](https://platform.deepseek.com/api_keys) | `https://api.deepseek.com` | مدل‌های چینی |
| OpenAI | [دریافت کلید](https://platform.openai.com/api-keys) | `https://api.openai.com/v1` | ChatGPT |

---

### 🚀 نصب سریع

```
1️⃣ فایل worker.js را دانلود کنید.

2️⃣ یک Worker جدید در داشبورد Cloudflare ایجاد کنید.

3️⃣ سورس پروژه را داخل Worker قرار دهید.

4️⃣ یک پایگاه‌داده D1 ایجاد کنید و آن را با نام DB متصل کنید.

5️⃣ متغیرهای زیر را از مسیر Settings → Variables تنظیم کنید:
   BOT_TOKEN = توکن ربات تلگرام
   ADMIN_ID  = آیدی عددی مدیر

6️⃣ روی Deploy کلیک کنید.

7️⃣ آدرس زیر را در مرورگر باز کنید:
   https://YOUR-WORKER.workers.dev/setup?key=ADMIN_ID

8️⃣ ربات را در تلگرام باز کنید و دستور /start را ارسال کنید.

9️⃣ اولین قدم بعد از راه‌اندازی:
   → /admin بزنید
   → مدیریت پروایدرها → افزودن پروایدر جدید
   → یک پروایدر مثل Groq اضافه کنید
   → انتخاب مدل پیش‌فرض → یک مدل انتخاب کنید
   → 🎉 ربات آماده استفاده است!
```

---

### 📌 نکات مهم

- 🔐 اطلاعات حساس (توکن ربات و کلیدهای API) فقط در متغیرهای Cloudflare ذخیره شوند
- 💰 این پروژه روی پلن رایگان Cloudflare اجرا می‌شود
- 📈 معماری Serverless مقیاس‌پذیری و نگهداری صفر را تضمین می‌کند
- 🔄 بازنشانی روزانه اعتبار از طریق Cloudflare Cron Triggers

---

### 🤝 مشارکت

مشارکت شما خوش‌آمد است! آزادانه Issue و Pull Request باز کنید.

### 📄 مجوز

این پروژه تحت [مجوز MIT](LICENSE) منتشر شده است.

---

<div align="center">

**ساخته شده با ❤️ توسط [Siko TMT](https://t.me/SikoTMT)**

</div>
