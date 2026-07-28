# Contributing to AI Gateway Bot

First off, thank you for considering contributing to this project! 🎉

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/sikotmt/AiGatewayBot/issues) to avoid duplicates
2. Open a new issue with the **Bug Report** template
3. Provide:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Your Cloudflare Worker setup details

### Suggesting Features

1. Open a new issue with the **Feature Request** template
2. Describe:
   - The feature you'd like to see
   - Why it would be useful
   - Any alternatives you've considered

### Submitting Pull Requests

1. **Fork** the repository
2. Create a **branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Make your changes in `worker.js`
4. **Test** your code thoroughly on Cloudflare Workers
5. **Commit** with a clear message:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Open a **Pull Request** against `main`

### Commit Message Convention

We follow conventional commits:

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding tests |
| `chore` | Build/tooling changes |

Example: `feat: add support for Anthropic Claude API`

## Code Guidelines

- **Single file**: All code stays in `worker.js` — no external dependencies
- **No npm packages**: This project uses Vanilla JS only
- **Error handling**: All async operations must have try/catch
- **HTML safety**: Always use `escapeHtml()` for user-provided content
- **SQL safety**: Always use parameterized queries with `?` placeholders
- **Persian support**: Bot UI text remains in Persian; code comments in English

## Questions?

Feel free to reach out:
- Telegram: [@SikoTMT](https://t.me/SikoTMT)
- Channel: [@Siko_TMT](https://t.me/Siko_TMT)
