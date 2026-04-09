import { Bot } from 'grammy';

import { type Config } from '../config/env.js';
import { askLlm, LlmUnavailableError } from '../llm/client.js';

export function createBot(config: Config): Bot {
  const bot = new Bot(config.telegramBotToken);

  bot.on('message:text', async (ctx) => {
    try {
      const reply = await askLlm({
        baseUrl: config.ollamaBaseUrl,
        model: config.ollamaModel,
        prompt: ctx.message.text,
        timeoutMs: config.ollamaTimeoutMs,
      });
      await ctx.reply(reply);
    } catch (error) {
      const message =
        error instanceof LlmUnavailableError
          ? error.userMessage
          : 'Произошла непредвиденная ошибка. Попробуй позже!';
      console.error('LLM error:', error);
      await ctx.reply(message);
    }
  });

  return bot;
}
