<div dir="rtl">

# 🤖 Ultimate Serverless AI Gateway Bot

### دروازه‌ی هوش مصنوعی سرورلس برای تلگرام با Cloudflare Workers

یک ربات تلگرام قدرتمند، سریع و کاملاً رایگان که ده‌ها مدل هوش مصنوعی را از طریق یک درگاه واحد در اختیار کاربران قرار می‌دهد.

---

# 📖 معرفی پروژه

**Ultimate Serverless AI Gateway Bot** یک ربات تلگرام تک‌فایلی (Single File) است که به‌طور کامل روی **Cloudflare Workers** و پایگاه‌داده **Cloudflare D1** اجرا می‌شود.

برای اجرای این پروژه هیچ نیازی به موارد زیر ندارید:

* ❌ سرور اختصاصی (VPS)
* ❌ هاست یا دامنه
* ❌ کتابخانه‌های خارجی (npm Package)
* ❌ ابزار خط فرمان مانند Wrangler CLI

تمام پروژه تنها در **یک فایل JavaScript** نوشته شده و مستقیماً از طریق ویرایشگر آنلاین Cloudflare قابل ویرایش، استقرار (Deploy) و مدیریت است.

این ربات به‌عنوان یک **دروازه (Gateway) یا پروکسی هوشمند** بین کاربران تلگرام و سرویس‌های مختلف هوش مصنوعی عمل می‌کند و علاوه بر مدیریت مدل‌ها و Providerها، یک پنل مدیریتی کامل را نیز مستقیماً داخل تلگرام در اختیار مدیر قرار می‌دهد.

---

# ✨ امکانات

## 👤 امکانات کاربران

* 💬 گفت‌وگوی هوشمند با حافظه مکالمه (Context Memory تا ۵ پیام اخیر)
* 🖼️ تحلیل و پردازش تصاویر (Vision) توسط مدل‌های چندوجهی
* 🎭 انتخاب شخصیت (Persona) برای تغییر رفتار هوش مصنوعی
* 🧹 پاک‌سازی حافظه گفتگو و شروع یک مکالمه جدید
* 👤 مشاهده پروفایل، مدل فعال و اعتبار باقی‌مانده
* ⏳ نمایش وضعیت پردازش پیام به‌صورت Fake Streaming
* 🎨 قالب‌بندی ایمن خروجی با HTML Sanitizer اختصاصی

---

## 👑 امکانات مدیر

* 📊 داشبورد زنده آمار کاربران و وضعیت ربات
* 🔌 مدیریت نامحدود Providerهای هوش مصنوعی
* ➕ افزودن، حذف، ویرایش و فعال‌سازی Providerها
* 🔄 دریافت خودکار لیست مدل‌های هر Provider
* 🤖 انتخاب مدل پیش‌فرض با صفحه‌بندی
* 👥 مدیریت کامل کاربران
* 🚫 مسدودسازی و آزادسازی کاربران
* 💎 افزایش یا کاهش اعتبار کاربران
* 🎯 اختصاص مدل اختصاصی برای هر کاربر
* 🎭 ساخت و مدیریت شخصیت‌های سفارشی
* 📢 ارسال پیام همگانی (Broadcast)
* 🔒 تغییر لحظه‌ای وضعیت ربات بین حالت عمومی و خصوصی
* 🔔 دریافت اعلان عضویت کاربران جدید

---

## ⚙️ ویژگی‌های فنی

* ✅ پشتیبانی از تمام APIهای سازگار با OpenAI
* ✅ پشتیبانی اختصاصی از Google Gemini API
* ✅ تشخیص خودکار نوع Provider
* ✅ مدیریت خودکار محدودیت ارسال پیام تلگرام (Rate Limit - Error 429)
* ✅ جلوگیری از Timeout با استفاده از `ctx.waitUntil()`
* ✅ HTML Sanitizer اختصاصی برای جلوگیری از خطاهای قالب‌بندی
* ✅ اجرای کاملاً Serverless
* ✅ بدون وابستگی به کتابخانه‌های خارجی
* ✅ قابل اجرا روی پلن رایگان Cloudflare (تا ۱۰۰٬۰۰۰ درخواست در روز)

---

# 🏗 معماری سیستم

```text
┌─────────────┐      Webhook       ┌──────────────────────┐
│   Telegram  │ ─────────────────> │  Cloudflare Worker   │
│     User    │ <───────────────── │     (worker.js)      │
└─────────────┘    AI Response      └──────────┬───────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    │                          │                          │
              ┌─────▼─────┐             ┌──────▼──────┐            ┌──────▼──────┐
              │ D1 Database│             │ AI Provider │            │ Telegram API│
              │  SQLite    │             │ Groq/Gemini │            │              │
              └────────────┘             │ OpenRouter  │            └──────────────┘
                                         │ DeepSeek    │
                                         └─────────────┘
```

---

# 🛠 پیش‌نیازها

قبل از شروع، موارد زیر را (همگی رایگان) آماده کنید.

## حساب‌های موردنیاز

| مورد        | لینک                                | توضیح                    |
| ----------- | ----------------------------------- | ------------------------ |
| GitHub      | https://github.com/join             | نگهداری سورس پروژه       |
| Cloudflare  | https://dash.cloudflare.com/sign-up | اجرای Cloudflare Workers |
| BotFather   | https://t.me/BotFather              | دریافت توکن ربات         |
| UserInfoBot | https://t.me/userinfobot            | دریافت شناسه عددی مدیر   |

---

## Providerهای هوش مصنوعی

| Provider   | دریافت API Key                              | Base URL                                    | توضیح                    |
| ---------- | ------------------------------------------- | ------------------------------------------- | ------------------------ |
| Gemini     | https://aistudio.google.com/apikey          | `https://generativelanguage.googleapis.com` | گوگل                     |
| Groq       | https://console.groq.com/keys               | `https://api.groq.com/openai/v1`            | رایگان و بسیار سریع      |
| Mistral AI | https://console.mistral.ai/api-keys         | `https://api.mistral.ai/v1`                 | مدل‌های فرانسوی          |
| OpenRouter | https://openrouter.ai/keys                  | `https://openrouter.ai/api/v1`              | دسترسی به صدها مدل       |
| Cerebras   | https://cloud.cerebras.ai/platform/api-keys | `https://api.cerebras.ai/v1`                | پردازش بسیار سریع        |
| OpenModel  | https://platform.openmodel.ai/api-keys      | `https://api.openmodel.ai/v1`               | مدل‌های متن‌باز          |
| Cohere     | https://dashboard.cohere.com/api-keys       | `https://api.cohere.com/v2`                 | Chat و Embedding         |
| DeepSeek   | https://platform.deepseek.com/api_keys      | `https://api.deepseek.com`                  | مدل‌های هوش مصنوعی چینی  |
| OpenAI     | https://platform.openai.com/api-keys        | `https://api.openai.com/v1`                 | ChatGPT و مدل‌های OpenAI |

---

# 🚀 نصب سریع

```text
1️⃣ فایل worker.js را کپی کنید.

2️⃣ یک Cloudflare Worker جدید ایجاد کنید.

3️⃣ سورس پروژه را داخل Worker جای‌گذاری کنید.

4️⃣ یک پایگاه‌داده D1 ایجاد کرده و با نام DB به Worker متصل کنید.

5️⃣ متغیرهای BOT_TOKEN و ADMIN_ID را از مسیر:
Settings → Variables
تنظیم کنید.

6️⃣ روی Deploy کلیک کنید.

7️⃣ مرورگر را باز کرده و آدرس زیر را اجرا کنید:

https://YOUR-WORKER.workers.dev/setup?key=YOUR_ADMIN_ID

8️⃣ در تلگرام ربات را باز کرده و دستور /start را ارسال کنید. 🎉
```

</div>
