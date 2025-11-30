"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bot = void 0;
exports.inviaMessaggioGiornaliero = inviaMessaggioGiornaliero;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const dotenv = __importStar(require("dotenv"));
const path_1 = __importDefault(require("path"));
const storage_1 = require("./storage");
const logic_1 = require("./logic");
// Load env vars if not in production
if (!process.env.VERCEL) {
    dotenv.config({ path: path_1.default.join(__dirname, '../Rosario Vivente Token Telegram Bot.env') });
}
const TOKEN = process.env.BOT_TOKEN;
if (!TOKEN) {
    console.error('BOT_TOKEN non trovato!');
    // Non throw error qui per evitare crash in build time se env non ci sono
}
exports.bot = new node_telegram_bot_api_1.default(TOKEN || 'dummy_token', { polling: false });
// Helper per inviare il messaggio (usato da cron e comandi)
async function inviaMessaggioGiornaliero(chatId, numeroPartecipante) {
    const mistero = (0, logic_1.calcolaMisteroOggi)(numeroPartecipante);
    const oggi = new Date().toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    await exports.bot.sendMessage(chatId, `📿 ${oggi}\n\n` +
        `🙏 Oggi devi recitare:\n*${mistero.nome}*\n\n` +
        `Messaggio da inviare al gruppo:\n\`${numeroPartecipante}.ok ${mistero.abbreviazione}\``, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [[
                    { text: '📋 Copia messaggio', callback_data: `copy_${numeroPartecipante}_${mistero.abbreviazione}` }
                ]]
        }
    });
}
async function impostaNumero(chatId, numero) {
    if (numero < 1 || numero > 20) {
        await exports.bot.sendMessage(chatId, '❌ Il numero deve essere tra 1 e 20');
        return;
    }
    const dataEsistente = await (0, storage_1.getPartecipante)(chatId);
    await (0, storage_1.salvaPartecipante)(chatId, {
        numero,
        notificheAttive: dataEsistente?.notificheAttive || false
    });
    await exports.bot.sendMessage(chatId, `✅ Numero partecipante impostato: ${numero}\n\n` +
        '💾 Configurazione salvata! Non dovrai più reimpostarla.\n\n' +
        'Ora puoi usare:\n' +
        '• /oggi per sapere quale mistero recitare oggi\n' +
        '• /notifiche per attivare le notifiche giornaliere');
}
// Setup Listeners
exports.bot.onText(/^\/start$/, (msg) => {
    const chatId = msg.chat.id;
    exports.bot.sendMessage(chatId, '🙏 Benvenuto nel Bot Rosario Vivente!\n\n' +
        'Usa /imposta [numero] per impostare il tuo numero di partecipante (da 1 a 20)\n' +
        'Esempio: /imposta 15\n\n' +
        'Poi usa:\n' +
        '/oggi - Per sapere quale mistero recitare oggi\n' +
        '/domani - Per sapere quale mistero recitare domani\n' +
        '/notifiche - Attiva/disattiva le notifiche giornaliere (ore 11:00)\n');
});
exports.bot.onText(/^\/imposta$/, async (msg) => {
    const chatId = msg.chat.id;
    await (0, storage_1.setAttesaNumero)(chatId, true);
    exports.bot.sendMessage(chatId, '🔢 Per favore, inserisci il tuo numero di partecipante (da 1 a 20):');
});
exports.bot.onText(/^\/imposta (\d+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    if (match && match[1]) {
        const numero = parseInt(match[1]);
        await impostaNumero(chatId, numero);
    }
});
exports.bot.on('message', async (msg) => {
    const chatId = msg.chat.id;
    // Evita di processare comandi come messaggi normali
    if (msg.text && msg.text.startsWith('/'))
        return;
    if (msg.text && /^\d+$/.test(msg.text)) {
        const inAttesa = await (0, storage_1.getAttesaNumero)(chatId);
        if (inAttesa) {
            await (0, storage_1.setAttesaNumero)(chatId, false);
            const numero = parseInt(msg.text);
            await impostaNumero(chatId, numero);
        }
    }
});
exports.bot.onText(/^\/oggi$/, async (msg) => {
    const chatId = msg.chat.id;
    const data = await (0, storage_1.getPartecipante)(chatId);
    if (!data) {
        return exports.bot.sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
    }
    await inviaMessaggioGiornaliero(chatId, data.numero);
});
exports.bot.onText(/^\/domani$/, async (msg) => {
    const chatId = msg.chat.id;
    const data = await (0, storage_1.getPartecipante)(chatId);
    if (!data) {
        return exports.bot.sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
    }
    const mistero = (0, logic_1.calcolaMisteroDomani)(data.numero);
    const domani = new Date();
    domani.setDate(domani.getDate() + 1);
    const dataFormattata = domani.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    exports.bot.sendMessage(chatId, `📿 ${dataFormattata}\n\n` +
        `🙏 Domani dovrai recitare:\n*${mistero.nome}*\n\n` +
        `Messaggio da inviare al gruppo:\n\`${data.numero}.ok ${mistero.abbreviazione}\``, { parse_mode: 'Markdown' });
});
exports.bot.onText(/^\/notifiche$/, async (msg) => {
    const chatId = msg.chat.id;
    const data = await (0, storage_1.getPartecipante)(chatId);
    if (!data) {
        return exports.bot.sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
    }
    data.notificheAttive = !data.notificheAttive;
    await (0, storage_1.salvaPartecipante)(chatId, data);
    const stato = data.notificheAttive ? 'ATTIVATE' : 'DISATTIVATE';
    exports.bot.sendMessage(chatId, `🔔 Notifiche giornaliere ${stato}!\nRiceverai un messaggio ogni giorno alle ore 11:00.`);
});
exports.bot.onText(/^\/pulisci$/, (msg) => {
    exports.bot.sendMessage(msg.chat.id, '🧹 Pulizia chat...\n\n' + '\n'.repeat(30) + '✨ Chat pulita!');
});
exports.bot.on('callback_query', async (query) => {
    if (!query.message || !query.data)
        return;
    const chatId = query.message.chat.id;
    const data = query.data;
    if (data.startsWith('copy_')) {
        const parts = data.split('_');
        const numero = parts[1];
        const mistero = parts.slice(2).join('_');
        const messaggio = `${numero}.ok ${mistero}`;
        await exports.bot.answerCallbackQuery(query.id, { text: `Messaggio copiato: ${messaggio}` });
        await exports.bot.sendMessage(chatId, messaggio);
    }
});
