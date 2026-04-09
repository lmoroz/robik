## [1.2.0] 2026-04-09 11:03

- Add config module (`src/config/env.ts`) with fail-fast validation and defaults
- Refactor `src/app.ts` to use centralized `loadConfig()` instead of inline env checks
- Mark section 2 of todo.md as complete

## [1.1.0] 2026-04-09 10:32

- Add grammY bot factory (`src/telegram/bot.ts`) with polling init
- Add Ollama HTTP client (`src/llm/client.ts`) using native fetch
- Wire entry point (`src/app.ts`) to load dotenv, create bot, start polling
- Add `"types": ["node"]` to tsconfig.json
- Mark section 1 of todo.md as complete

## [1.0.0] 2026-04-09 10:01

- Add project scaffolding: package.json, tsconfig.json, ESLint config, Dockerfile
- Add .env.example with all required environment variables
- Add stub entry point (src/app.ts)
- Fix eslint-plugin-perfectionist v5 breaking change: newlinesBetween 'always' → 1

## [0.0.0] 2026-04-09 09:26

- Add Docker deployment instructions to README (build, run, OLLAMA_BASE_URL note)
- Update spec.md: add Docker to constraints, stack, and add deployment schema
- Update todo.md: add Dockerfile task to section 1, add section 9 Docker smoke-test
