"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const telegram_1 = require("./lib/telegram");
console.log('🤖 Avvio bot in modalità locale (polling)...');
console.log('Ricorda: le notifiche cron non funzionano automaticamente in locale.');
console.log('Per testare i comandi, interagisci con il bot su Telegram.');
// Rimuovi webhook se presente per evitare conflitti
telegram_1.bot.deleteWebHook().then(() => {
    telegram_1.bot.startPolling();
    console.log('Bot in ascolto...');
}).catch((err) => {
    console.error('Errore nella rimozione del webhook:', err);
    // Prova comunque ad avviare
    telegram_1.bot.startPolling();
});
