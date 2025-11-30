import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars FIRST, before any other imports that might rely on them
if (!process.env.VERCEL) {
  dotenv.config({ path: path.join(__dirname, 'Rosario Vivente Token Telegram Bot.env') });
}

import { bot } from './lib/telegram';

console.log('🤖 Avvio bot in modalità locale (polling)...');
console.log('Ricorda: le notifiche cron non funzionano automaticamente in locale.');
console.log('Per testare i comandi, interagisci con il bot su Telegram.');

// Rimuovi webhook se presente per evitare conflitti
bot.deleteWebHook().then(() => {
  bot.startPolling();
  console.log('Bot in ascolto...');
}).catch((err) => {
  console.error('Errore nella rimozione del webhook:', err);
  // Prova comunque ad avviare
  bot.startPolling();
});
