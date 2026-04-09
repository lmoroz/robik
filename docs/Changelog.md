## [1.6.1] 2026-04-09 13:37

- Add "typing" chat action indicator while waiting for LLM response
- Repeat typing action every 5s via interval, cleaned up in `finally` block

## [1.6.0] 2026-04-09 13:12

- Add `/start` command with inline keyboard for model selection
- Add `/model` command to switch active LLM model at runtime
- Add `listModels()` to fetch available Ollama models, filtering out embedding models
- Add `SYSTEM_PROMPT=YES` support: reads `SYSTEM_PROMPT.md` at startup, passes as `system` field to Ollama API
- Prefix all bot replies with `[model-name]`
- Global model state in process memory, resets on restart
- Mark section 6 (bonuses) of todo.md as complete

## [1.5.0] 2026-04-09 12:38

- Add operational logging: incoming message, LLM request/response, errors with clean output
- Add `bot.catch()` global error handler for unhandled middleware errors
- Wrap error reply `ctx.reply()` in try/catch to prevent crash on Telegram API failure
- Add `unhandledRejection` and `uncaughtException` handlers in app.ts
- Use `bot.start({ onStart })` callback instead of manual log
- Mark section 5 of todo.md as complete

## [1.4.0] 2026-04-09 12:07

- Wire `bot.on('message:text')` handler: call `askLlm` with user text, reply with LLM response
- Handle `LlmUnavailableError` with friendly message, generic fallback for unexpected errors
- Pass full `Config` to `createBot` instead of just token
- Mark section 4 of todo.md as complete

## [1.3.0] 2026-04-09 11:40

- Rewrite `src/llm/client.ts`: named options object, `AbortSignal.timeout`, network/HTTP error handling, response normalization
- Add `LlmUnavailableError` with `userMessage` (friendly Russian text) and technical `message` for logs
- Add `OLLAMA_TIMEOUT_MS` env var to config, `.env.example`, and README
- Mark section 3 of todo.md as complete

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
