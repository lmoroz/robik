import { Bot } from 'grammy';

import { type Config } from '../config/env.js';
import { askLlm, LlmUnavailableError } from '../llm/client.js';

export function createBot(config: Config): Bot {
  const bot = new Bot(config.telegramBotToken);

  bot.on('message:text', async (ctx) => {
    const user = ctx.from?.username ?? ctx.from?.id ?? 'unknown';
    const text = ctx.message.text;
    console.log(`[msg] from=${user} text="${text.length > 80 ? text.slice(0, 80) + '…' : text}"`);

    try {
      console.log(`[llm] sending to ${config.ollamaModel}...`);
      const reply = await askLlm({
        baseUrl: config.ollamaBaseUrl,
        model: config.ollamaModel,
        prompt: text,
        timeoutMs: config.ollamaTimeoutMs,
      });
      console.log(`[llm] response received (${reply.length} chars)`);
      await ctx.reply(reply);
    } catch (error) {
      const isLlmError = error instanceof LlmUnavailableError;
      const message = isLlmError
        ? error.userMessage
        : 'Произошла непредвиденная ошибка. Попробуй позже!';
      console.error(`[err] ${isLlmError ? error.message : error}`);
      try {
        await ctx.reply(message);
      } catch (replyError) {
        console.error(`[err] failed to send reply to user: ${replyError}`);
      }
    }
  });

  bot.catch((err) => {
    console.error(`[err] unhandled: ${err.error}`);
  });

  return bot;
}
