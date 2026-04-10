import { Bot, InlineKeyboard, InputFile } from 'grammy';

import { type Config } from '../config/env.js';
import { type ImageVariant, renderRetroImage } from '../image/renderer.js';
import { askLlm, listModels, LlmUnavailableError } from '../llm/client.js';

export function createBot(config: Config): Bot {
  const bot = new Bot(config.telegramBotToken);

  /* Global mutable state — intentional for this stateless educational project (no DB). */
  let currentModel = config.ollamaModel;

  async function sendRetroPhoto(
    chatId: number,
    text: string,
    variant: ImageVariant = 'response',
    model?: string,
  ): Promise<void> {
    const image = renderRetroImage(text, model ?? currentModel, variant);
    await bot.api.sendPhoto(chatId, new InputFile(image, 'response.png'));
  }

  async function sendModelPicker(chatId: number, text: string): Promise<void> {
    try {
      const models = await listModels(config.ollamaBaseUrl);

      if (models.length === 0) {
        await sendRetroPhoto(chatId, 'В Ollama не найдено текстовых моделей.', 'error');
        return;
      }

      const keyboard = new InlineKeyboard();
      for (const model of models) {
        const label = model.name === currentModel ? `✅ ${model.name}` : model.name;
        keyboard.text(label, `model:${model.name}`).row();
      }

      await bot.api.sendMessage(chatId, text, { reply_markup: keyboard, parse_mode: 'HTML' });
    } catch (error) {
      console.error(`[err] failed to list models: ${error}`);
      await sendRetroPhoto(chatId, 'Не удалось получить список моделей. Ollama доступна?', 'error');
    }
  }

  bot.command('start', async (ctx) => {
    await sendModelPicker(ctx.chat.id, `Привет! Текущая модель: <b>${currentModel}</b>\nВыбери модель:`);
  });

  bot.command('model', async (ctx) => {
    await sendModelPicker(ctx.chat.id, `Текущая модель: <b>${currentModel}</b>\nВыбери модель:`);
  });

  bot.callbackQuery(/^model:/, async (ctx) => {
    currentModel = ctx.callbackQuery.data.slice('model:'.length);
    console.log(`[model] switched to ${currentModel} by ${ctx.from?.username ?? ctx.from?.id}`);

    await ctx.deleteMessage();
    await sendRetroPhoto(ctx.chat!.id, `Модель переключена на ${currentModel}`, 'system');
    await ctx.answerCallbackQuery({ text: `Выбрана: ${currentModel}` });
  });

  type TextMessageContext = import('grammy').Context & { message: { text: string } };

  /** Process a single text message — runs concurrently, never blocks polling. */
  async function handleTextMessage(ctx: TextMessageContext): Promise<void> {
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
      const image = renderRetroImage(reply, currentModel);
      await ctx.replyWithPhoto(new InputFile(image, 'response.png'));
    } catch (error) {
      const isLlmError = error instanceof LlmUnavailableError;
      const message = isLlmError
        ? error.userMessage
        : 'Произошла непредвиденная ошибка. Попробуй позже!';
      console.error(`[err] ${isLlmError ? error.message : error}`);
      try {
        await sendRetroPhoto(ctx.message.chat.id, message, 'error');
      } catch (replyError) {
        console.error(`[err] failed to send reply to user: ${replyError}`);
      }
    }
  }

  /* Fire-and-forget: handler returns immediately so grammY picks up the next update. */
  bot.on('message:text', (ctx) => {
    handleTextMessage(ctx).catch((err) =>
      console.error(`[err] unhandled in handleTextMessage: ${err}`),
    );
  });

  bot.catch((err) => {
    console.error(`[err] unhandled: ${err.error}`);
  });

  bot.api.setMyCommands([
    { command: 'start', description: 'Начать работу / выбрать модель' },
    { command: 'model', description: 'Сменить текущую модель LLM' },
  ]).catch(console.error);

  return bot;
}
