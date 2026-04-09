import { Bot } from 'grammy';

export function createBot(token: string): Bot {
  const bot = new Bot(token);
  return bot;
}
