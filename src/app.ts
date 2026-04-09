import { loadConfig } from './config/env.js';
import { createBot } from './telegram/bot.js';

const config = loadConfig();

const bot = createBot(config.telegramBotToken);

console.log('Bot starting...');
void bot.start();
