import { loadConfig } from './config/env.js';
import { createBot } from './telegram/bot.js';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

const config = loadConfig();

const bot = createBot(config);

bot.start({
  onStart: () => console.log('Bot is running.'),
});
