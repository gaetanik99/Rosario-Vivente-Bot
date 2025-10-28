const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Carica le variabili d'ambiente dal file .env
dotenv.config({ path: path.join(__dirname, 'Rosario Vivente Token Telegram Bot.env') });

// Configurazione
const TOKEN = process.env.BOT_TOKEN; // Legge il token dal file di ambiente
const bot = new TelegramBot(TOKEN, { polling: true });

// File per salvare i dati
const DATA_FILE = path.join(__dirname, 'partecipanti.json');

// Carica i partecipanti dal file
function caricaPartecipanti(): Map<number, number> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      const obj = JSON.parse(data);
      return new Map(Object.entries(obj).map(([k, v]) => [parseInt(k), v as number]));
    }
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
  }
  return new Map();
}

// Salva i partecipanti nel file
function salvaPartecipanti(partecipanti: Map<number, number>): void {
  try {
    const obj = Object.fromEntries(partecipanti);
    fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (error) {
    console.error('Errore nel salvataggio dei dati:', error);
  }
}

// Struttura dei misteri
interface Mistero {
  nome: string;
  abbreviazione: string;
}

type MisteroResult = Mistero;

const misteri: Mistero[] = [
  { nome: '1° Mistero Gioioso', abbreviazione: '1GI' },
  { nome: '2° Mistero Gioioso', abbreviazione: '2GI' },
  { nome: '3° Mistero Gioioso', abbreviazione: '3GI' },
  { nome: '4° Mistero Gioioso', abbreviazione: '4GI' },
  { nome: '5° Mistero Gioioso', abbreviazione: '5GI' },
  { nome: '1° Mistero della Luce', abbreviazione: '1LU' },
  { nome: '2° Mistero della Luce', abbreviazione: '2LU' },
  { nome: '3° Mistero della Luce', abbreviazione: '3LU' },
  { nome: '4° Mistero della Luce', abbreviazione: '4LU' },
  { nome: '5° Mistero della Luce', abbreviazione: '5LU' },
  { nome: '1° Mistero Doloroso', abbreviazione: '1DO' },
  { nome: '2° Mistero Doloroso', abbreviazione: '2DO' },
  { nome: '3° Mistero Doloroso', abbreviazione: '3DO' },
  { nome: '4° Mistero Doloroso', abbreviazione: '4DO' },
  { nome: '5° Mistero Doloroso', abbreviazione: '5DO' },
  { nome: '1° Mistero Glorioso', abbreviazione: '1GL' },
  { nome: '2° Mistero Glorioso', abbreviazione: '2GL' },
  { nome: '3° Mistero Glorioso', abbreviazione: '3GL' },
  { nome: '4° Mistero Glorioso', abbreviazione: '4GL' },
  { nome: '5° Mistero Glorioso', abbreviazione: '5GL' },
];

// Data di riferimento: 2 settembre 2025, partecipante 15, 3° GL (posizione 17)
const DATA_RIFERIMENTO = new Date('2025-09-02');
const POSIZIONE_RIFERIMENTO = 17; // 3° GL è la posizione 18 (indice 17)
const PARTECIPANTE_RIFERIMENTO = 15;

// Carica i partecipanti salvati
const partecipanti = caricaPartecipanti();
console.log(`📊 Caricati ${partecipanti.size} partecipanti salvati`);

function calcolaMisteroOggi(numeroPartecipante: number): MisteroResult {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  
  const riferimento = new Date(DATA_RIFERIMENTO);
  riferimento.setHours(0, 0, 0, 0);
  
  // Calcola giorni passati dalla data di riferimento
  const diffTime = oggi.getTime() - riferimento.getTime();
  const giorniPassati = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calcola la posizione oggi per il partecipante di riferimento
  const posizioneRiferimentoOggi = (POSIZIONE_RIFERIMENTO + giorniPassati) % 20;
  
  // Calcola offset tra partecipante attuale e partecipante di riferimento
  const offsetPartecipante = numeroPartecipante - PARTECIPANTE_RIFERIMENTO;
  
  // Calcola posizione finale
  let posizione = (posizioneRiferimentoOggi + offsetPartecipante) % 20;
  if (posizione < 0) posizione += 20;
  
  return misteri[posizione]!;
}

function calcolaMisteroDomani(numeroPartecipante: number): MisteroResult {
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  domani.setHours(0, 0, 0, 0);
  
  const riferimento = new Date(DATA_RIFERIMENTO);
  riferimento.setHours(0, 0, 0, 0);
  
  const diffTime = domani.getTime() - riferimento.getTime();
  const giorniPassati = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  const posizioneRiferimentoOggi = (POSIZIONE_RIFERIMENTO + giorniPassati) % 20;
  const offsetPartecipante = numeroPartecipante - PARTECIPANTE_RIFERIMENTO;
  
  let posizione = (posizioneRiferimentoOggi + offsetPartecipante) % 20;
  if (posizione < 0) posizione += 20;
  
  return misteri[posizione]!;
}

// Comando /start
bot.onText(/^\/start$/, (msg: any) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '🙏 Benvenuto nel Bot Rosario Vivente!\n\n' +
    'Usa /imposta [numero] per impostare il tuo numero di partecipante (da 1 a 20)\n' +
    'Esempio: /imposta 15\n\n' +
    'Poi usa:\n' +
    '/oggi - Per sapere quale mistero recitare oggi\n' +
    '/domani - Per sapere quale mistero recitare domani\n'
  );
});

// Stato per tenere traccia degli utenti che stanno impostando il numero
const utentiInAttesaNumero = new Map<number, boolean>();

// Comando /imposta (primo passaggio)
bot.onText(/^\/imposta$/, (msg: any) => {
  const chatId = msg.chat.id;
  utentiInAttesaNumero.set(chatId, true);
  bot.sendMessage(
    chatId,
    '🔢 Per favore, inserisci il tuo numero di partecipante (da 1 a 20):'
  );
});

// Comando /imposta con numero (per retrocompatibilità)
bot.onText(/^\/imposta (\d+)$/, (msg: any, match: any) => {
  const chatId = msg.chat.id;
  const numero = parseInt(match[1]);
  
  if (numero < 1 || numero > 20) {
    bot.sendMessage(chatId, '❌ Il numero deve essere tra 1 e 20');
    return;
  }
  
  partecipanti.set(chatId, numero);
  salvaPartecipanti(partecipanti);
  bot.sendMessage(
    chatId,
    `✅ Numero partecipante impostato: ${numero}\n\n` +
    '💾 Configurazione salvata! Non dovrai più reimpostarla.\n\n' +
    'Ora puoi usare /oggi per sapere quale mistero recitare oggi!'
  );
});

// Gestione risposta con numero dopo /imposta
bot.on('message', (msg: any) => {
  const chatId = msg.chat.id;
  
  // Verifica se l'utente è in attesa di inserire un numero
  if (utentiInAttesaNumero.get(chatId) && msg.text && /^\d+$/.test(msg.text)) {
    const numero = parseInt(msg.text);
    
    // Rimuovi l'utente dalla lista di attesa
    utentiInAttesaNumero.delete(chatId);
    
    if (numero < 1 || numero > 20) {
      bot.sendMessage(chatId, '❌ Il numero deve essere tra 1 e 20');
      return;
    }
    
    partecipanti.set(chatId, numero);
    salvaPartecipanti(partecipanti);
    bot.sendMessage(
      chatId,
      `✅ Numero partecipante impostato: ${numero}\n\n` +
      '💾 Configurazione salvata! Non dovrai più reimpostarla.\n\n' +
      'Ora puoi usare /oggi per sapere quale mistero recitare oggi!'
    );
  }
});

// Comando /oggi
bot.onText(/^\/oggi$/, (msg: any) => {
  const chatId = msg.chat.id;
  const numeroPartecipante = partecipanti.get(chatId);
  
  if (!numeroPartecipante) {
    bot.sendMessage(
      chatId,
      '❌ Prima devi impostare il tuo numero con /imposta [numero]\n' +
      'Esempio: /imposta 15'
    );
    return;
  }
  
  const mistero = calcolaMisteroOggi(numeroPartecipante);
  const oggi = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  bot.sendMessage(
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
});

// Comando /domani
bot.onText(/^\/domani$/, (msg: any) => {
  const chatId = msg.chat.id;
  const numeroPartecipante = partecipanti.get(chatId);
  
  if (!numeroPartecipante) {
    bot.sendMessage(
      chatId,
      '❌ Prima devi impostare il tuo numero con /imposta [numero]\n' +
      'Esempio: /imposta 15'
    );
    return;
  }
  
  const mistero = calcolaMisteroDomani(numeroPartecipante);
  const domani = new Date();
  domani.setDate(domani.getDate() + 1);
  const dataFormattata = domani.toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  bot.sendMessage(
    chatId,
    `📿 ${dataFormattata}\n\n` +
    `🙏 Domani dovrai recitare:\n*${mistero.nome}*\n\n` +
    `Messaggio da inviare al gruppo:\n\`${numeroPartecipante}.ok ${mistero.abbreviazione}\``,
    { parse_mode: 'Markdown' }
  );
});

// Comando /notifiche (placeholder - richiede implementazione avanzata)
bot.onText(/^\/notifiche$/, (msg: any) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    '🔔 Per le notifiche automatiche giornaliere, il bot deve rimanere sempre attivo.\n\n' +
    'Per ora usa /oggi ogni mattina per sapere quale mistero recitare!'
  );
});

// Comando /pulisci per pulire la chat
bot.onText(/^\/pulisci$/, (msg: any) => {
  const chatId = msg.chat.id;
  
  // Su Telegram non è possibile eliminare tutti i messaggi con un solo comando
  // Inviamo un messaggio con molti caratteri di nuova riga per "pulire" visivamente la chat
  bot.sendMessage(
    chatId,
    '🧹 Pulizia chat...\n\n' + '\n'.repeat(30) + '✨ Chat pulita!'
  );
});

// Gestione callback per il pulsante "Copia messaggio"
bot.on('callback_query', (query: any) => {
  const chatId = query.message.chat.id;
  const data = query.data;
  
  if (data.startsWith('copy_')) {
    const parts = data.split('_');
    const numero = parts[1];
    const mistero = parts.slice(2).join('_');
    const messaggio = `${numero}.ok ${mistero}`;
    
    bot.answerCallbackQuery(query.id, {
      text: `Messaggio copiato: ${messaggio}`,
      show_alert: false
    });
    
    bot.sendMessage(chatId, messaggio);
  }
});


console.log('🤖 Bot Rosario Vivente avviato!');
console.log('💾 I dati vengono salvati in:', DATA_FILE);