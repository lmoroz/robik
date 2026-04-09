import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

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

function loadSystemPrompt(): string {
  const flag = optionalEnv('SYSTEM_PROMPT', '');
  if (flag.toUpperCase() !== 'YES') return '';

  const filePath = resolve('SYSTEM_PROMPT.md');
  try {
    const content = readFileSync(filePath, 'utf-8').trim();
    if (content) {
      console.log(`[config] system prompt loaded from ${filePath} (${content.length} chars)`);
    }
    return content;
  } catch {
    console.log('[config] SYSTEM_PROMPT=YES but SYSTEM_PROMPT.md not found — skipping');
    return '';
  }
}

export function loadConfig(): Config {
  return {
    telegramBotToken: requireEnv('TELEGRAM_BOT_TOKEN'),
    ollamaBaseUrl: optionalEnv('OLLAMA_BASE_URL', 'http://127.0.0.1:11434'),
    ollamaModel: optionalEnv('OLLAMA_MODEL', 'qwen3:0.6b'),
    ollamaTimeoutMs: Number(optionalEnv('OLLAMA_TIMEOUT_MS', '60000')),
    systemPrompt: loadSystemPrompt(),
    logLevel: optionalEnv('LOG_LEVEL', 'info'),
  };
}
