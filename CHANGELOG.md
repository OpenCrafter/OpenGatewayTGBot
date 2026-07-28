# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-07-28

### Added
- MIT License file
- `.gitignore` for common IDE/OS/build artifacts
- `CHANGELOG.md` with full version history
- Professional bilingual README (Persian + English) with RTL support
- Source code (`worker.js`) added to repository root

### Fixed
- CRLF line endings converted to LF
- README language toggle now works on GitHub (HTML anchors)

### Changed
- README rewritten with badges, architecture diagram, database schema
- Comprehensive 9-step installation guide in both languages
- All 9 AI providers documented with Base URLs and API key links

## [1.0.1] - 2026-07-11

### Added
- Multi-provider AI gateway (OpenAI-compatible + Gemini)
- Admin panel with inline keyboard inside Telegram
- User management (credits, ban/unban, custom models)
- Chat memory with 10-message window
- Image analysis support
- Custom AI personas
- Broadcast messaging
- Rate limit (429) handling with retry
- Fake streaming progress bar
- Daily credit reset via Cron Triggers
- New user join notifications

### Supported Providers
- Google Gemini
- Groq
- Mistral AI
- OpenRouter
- Cerebras
- OpenModel
- Cohere
- DeepSeek
- OpenAI

## [1.0.0] - 2026-07-10

### Added
- Initial release
- Basic AI chat bot on Cloudflare Workers
- D1 database integration
- Single-file architecture (Vanilla JS, zero dependencies)
