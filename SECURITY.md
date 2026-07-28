# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public issue.

Instead, please report it privately:

1. Contact the maintainer via [Telegram](https://t.me/SikoTMT)
2. Provide:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

You will receive a response within 48 hours.

## Security Best Practices for Deployment

- 🔐 **Never hardcode** `BOT_TOKEN` or `ADMIN_ID` in the source code
- 🔐 Store all sensitive values in **Cloudflare Workers Environment Variables**
- 🔐 Use **strong, unique** API keys for each AI provider
- 🔐 Regularly **rotate** your API keys
- 🔐 Keep your `ADMIN_ID` private — it's used for the `/setup` endpoint
- 🔐 Consider adding a **Telegram Webhook Secret Token** for additional security
- 🔐 Review **Cloudflare Workers logs** for suspicious activity

## Known Security Considerations

- The `/setup` endpoint uses `ADMIN_ID` as a query parameter — this is intentional for simplicity but means the setup URL should be accessed securely and not shared
- Provider API keys are stored in plaintext in the D1 database — this is a design tradeoff for the serverless architecture
- The webhook endpoint does not currently verify a Telegram secret token (can be added as an enhancement)
