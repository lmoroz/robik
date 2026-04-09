import { Bot, InlineKeyboard } from 'grammy';

import { type Config } from '../config/env.js';
import { askLlm, listModels, LlmUnavailableError } from '../llm/client.js';

export function createBot(config: Config): Bot {
  const bot = new Bot(config.telegramBotToken);

  let currentModel = config.ollamaModel;

  async function sendModelPicker(chatId: number, text: string): Promise<void> {
    try {
      const models = await listModels(config.ollamaBaseUrl);

      if (models.length === 0) {
        await bot.api.sendMessage(chatId, 'В Ollama не найдено текстовых моделей.');
        return;
      }

      const keyboard = new InlineKeyboard();
      for (const model of models) {
        const label = model.name === currentModel ? `✅ ${model.name}` : model.name;
        keyboard.text(label, `model:${model.name}`).row();
      }

      await bot.api.sendMessage(chatId, text, { reply_markup: keyboard, parse_mode: 'Markdown' });
    } catch (error) {
      console.error(`[err] failed to list models: ${error}`);
      await bot.api.sendMessage(chatId, 'Не удалось получить список моделей. Ollama доступна?');
    }
  }

  bot.command('start', async (ctx) => {
    await sendModelPicker(ctx.chat.id, `Привет! Текущая модель: *${currentModel}*\nВыбери модель:`);
  });

  bot.command('model', async (ctx) => {
    await sendModelPicker(ctx.chat.id, `Текущая модель: *${currentModel}*\nВыбери модель:`);
  });

  bot.callbackQuery(/^model:/, async (ctx) => {
    const selected = ctx.callbackQuery.data.slice('model:'.length);
    currentModel = selected;
    console.log(`[model] switched to ${currentModel} by ${ctx.from?.username ?? ctx.from?.id}`);

    await ctx.editMessageText(`Модель переключена на *${currentModel}*`, {
      parse_mode: 'Markdown',
    });
    await ctx.answerCallbackQuery({ text: `Выбрана: ${currentModel}` });
  });

  bot.on('message:text', async (ctx) => {
    const user = ctx.from?.username ?? ctx.from?.id ?? 'unknown';
    const text = ctx.message.text;
    console.log(`[msg] from=${user} text="${text.length > 80 ? text.slice(0, 80) + '…' : text}"`);

    try {
      await ctx.replyWithChatAction('typing');
      const typingInterval = setInterval(() => ctx.replyWithChatAction('typing').catch(() => {}), 5000);

      console.log(`[llm] sending to ${currentModel}...`);
      let reply: string;
      try {
        reply = await askLlm({
          baseUrl: config.ollamaBaseUrl,
          model: currentModel,
          prompt: text,
          system: config.systemPrompt || undefined,
          timeoutMs: config.ollamaTimeoutMs,
        });
      } finally {
        clearInterval(typingInterval);
      }
      console.log(`[llm] response received (${reply.length} chars)`);
      await ctx.reply(`[${currentModel}]\n\n${reply}`);
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
