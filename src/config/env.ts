import 'dotenv/config';

export interface Config {
  telegramBotToken: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  ollamaTimeoutMs: number;
  systemPrompt: string;
  logLevel: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

export function loadConfig(): Config {
  return {
    telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    ollamaBaseUrl: optionalEnv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
    ollamaModel: optionalEnv('OLLAMA_MODEL', 'qwen3:0.6b'),
    ollamaTimeoutMs: Number(optionalEnv('OLLAMA_TIMEOUT_MS', '60000')),
    systemPrompt: optionalEnv('SYSTEM_PROMPT', ''),
    logLevel: optionalEnv('LOG_LEVEL', 'info'),
  };
}
