import 'dotenv/config';

import { createBot } from './telegram/bot.js';

const token = process.env['TELEGRAM_BOT_TOKEN'];
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

const bot = createBot(token);

console.log('Bot starting...');
void bot.start();
