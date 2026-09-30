# AI Harness Rules & Context

This file defines the environment, rules, and constraints for AI agents operating in this repository, ensuring reliable software engineering for NodeBinding AI.

## 1. Project Rules
* **Use TypeScript:** All new modules and services must be written in TypeScript with strict mode enabled.
* **Offline-First Mindset:** The client application must handle unstable internet connections gracefully using local caching (SQLite/IndexedDB).
* **Test Coverage:** Every new API endpoint or AI pipeline feature requires an automated test (unit or integration).
* **Verify Before Completing:** Run the build and tests before declaring a task complete.
* **No Secrets:** Never commit API keys, service account JSONs, or secrets to this repository. Use environment variables.
* **Modular AI Logic:** Keep Gemini API and Vertex AI interaction code isolated in dedicated service files, not mixed with UI components.

## 2. Definition of Done
A feature is considered complete only when:
- [ ] Code is implemented according to requirements.
- [ ] TypeScript compiler passes with 0 errors.
- [ ] Automated tests (unit/integration) pass.
- [ ] Code handles network failures (offline resilience).
- [ ] Documentation is updated (if API or architecture changed).

## 3. Verification Commands
* *Linting/Types:* `npm run lint` / `npm run typecheck`
* *Testing:* `npm test`
* *Build:* `npm run build`
*(Note: These will be set up in package.json shortly)*
