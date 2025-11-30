import TelegramBot from 'node-telegram-bot-api';
import * as dotenv from 'dotenv';
import path from 'path';
import { 
  salvaPartecipante, 
  getPartecipante, 
  setAttesaNumero, 
  getAttesaNumero 
} from './storage';
import { 
  calcolaMisteroOggi, 
  calcolaMisteroDomani 
} from './logic';

// Load env vars if not in production
// Note: local-dev.ts handles this for local dev, but we keep this for safety or other entry points
if (!process.env.VERCEL && !process.env.BOT_TOKEN) {
  dotenv.config({ path: path.join(__dirname, '../Rosario Vivente Token Telegram Bot.env') });
}

const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
  console.error('BOT_TOKEN non trovato!');
  // Non throw error qui per evitare crash in build time se env non ci sono
}

export const bot = new TelegramBot(TOKEN || 'dummy_token', { polling: false });

// Helper per inviare il messaggio (usato da cron e comandi)
export async function inviaMessaggioGiornaliero(chatId: number, numeroPartecipante: number) {
  const mistero = calcolaMisteroOggi(numeroPartecipante);
  const oggi = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  await bot.sendMessage(
    chatId,
    `📿 ${oggi}\n\n` +
    `🙏 Oggi devi recitare:\n*${mistero.nome}*\n\n` +
    `Messaggio da inviare al gruppo:\n\`${numeroPartecipante}.ok ${mistero.abbreviazione}\``,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 Copia messaggio', callback_data: `copy_${numeroPartecipante}_${mistero.abbreviazione}` }
        ]]
      }
    }
  );
}

async function impostaNumero(chatId: number, numero: number) {
  if (numero < 1 || numero > 20) {
    await bot.sendMessage(chatId, '❌ Il numero deve essere tra 1 e 20');
    return;
  }
  
  const dataEsistente = await getPartecipante(chatId);
  await salvaPartecipante(chatId, {
    numero,
    notificheAttive: dataEsistente?.notificheAttive || false
  });
  
  await bot.sendMessage(
    chatId,
    `✅ Numero partecipante impostato: ${numero}\n\n` +
    '💾 Configurazione salvata! Non dovrai più reimpostarla.\n\n' +
    'Ora puoi usare:\n' +
    '• /oggi per sapere quale mistero recitare oggi\n' +
    '• /notifiche per attivare le notifiche giornaliere'
  );
}

// Setup Listeners
bot.onText(/^\/start$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '🙏 Benvenuto nel Bot Rosario Vivente!\n\n' +
    'Usa /imposta [numero] per impostare il tuo numero di partecipante (da 1 a 20)\n' +
    'Esempio: /imposta 15\n\n' +
    'Poi usa:\n' +
    '/oggi - Per sapere quale mistero recitare oggi\n' +
    '/domani - Per sapere quale mistero recitare domani\n' +
    '/notifiche - Attiva/disattiva le notifiche giornaliere (ore 11:00)\n'
  );
});

bot.onText(/^\/imposta$/, async (msg) => {
  const chatId = msg.chat.id;
  await setAttesaNumero(chatId, true);
  bot.sendMessage(chatId, '🔢 Per favore, inserisci il tuo numero di partecipante (da 1 a 20):');
});

bot.onText(/^\/imposta (\d+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  if (match && match[1]) {
    const numero = parseInt(match[1]);
    await impostaNumero(chatId, numero);
  }
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  // Evita di processare comandi come messaggi normali
  if (msg.text && msg.text.startsWith('/')) return;

  if (msg.text && /^\d+$/.test(msg.text)) {
    const inAttesa = await getAttesaNumero(chatId);
    if (inAttesa) {
      await setAttesaNumero(chatId, false);
      const numero = parseInt(msg.text);
      await impostaNumero(chatId, numero);
    }
  }
});

bot.onText(/^\/oggi$/, async (msg) => {
  const chatId = msg.chat.id;
  const data = await getPartecipante(chatId);
  if (!data) {
    return bot.sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
  }
  await inviaMessaggioGiornaliero(chatId, data.numero);
});

bot.onText(/^\/domani$/, async (msg) => {
  const chatId = msg.chat.id;
  const data = await getPartecipante(chatId);
  if (!data) {
    return bot.sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
  }
  
  const mistero = calcolaMisteroDomani(data.numero);
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  const dataFormattata = domani.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  bot.sendMessage(
    chatId,
    `📿 ${dataFormattata}\n\n` +
    `🙏 Domani dovrai recitare:\n*${mistero.nome}*\n\n` +
    `Messaggio da inviare al gruppo:\n\`${data.numero}.ok ${mistero.abbreviazione}\``,
    { parse_mode: 'Markdown' }
  );
});

bot.onText(/^\/notifiche$/, async (msg) => {
  const chatId = msg.chat.id;
  const data = await getPartecipante(chatId);
  if (!data) {
    return bot.sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
  }
  
  data.notificheAttive = !data.notificheAttive;
  await salvaPartecipante(chatId, data);
  
  const stato = data.notificheAttive ? 'ATTIVATE' : 'DISATTIVATE';
  bot.sendMessage(chatId, `🔔 Notifiche giornaliere ${stato}!\nRiceverai un messaggio ogni giorno alle ore 11:00.`);
});

bot.onText(/^\/pulisci$/, (msg) => {
  bot.sendMessage(msg.chat.id, '🧹 Pulizia chat...\n\n' + '\n'.repeat(30) + '✨ Chat pulita!');
});

bot.on('callback_query', async (query) => {
  if (!query.message || !query.data) return;
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('copy_')) {
    const parts = data.split('_');
    const numero = parts[1];
    const mistero = parts.slice(2).join('_');
    const messaggio = `${numero}.ok ${mistero}`;
    
    await bot.answerCallbackQuery(query.id, { text: `Messaggio copiato: ${messaggio}` });
    await bot.sendMessage(chatId, messaggio);
  }
});
