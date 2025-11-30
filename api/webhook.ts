import { VercelRequest, VercelResponse } from '@vercel/node';
import { getPartecipante, salvaPartecipante, setAttesaNumero, getAttesaNumero } from '../lib/storage';
import { calcolaMisteroOggi, calcolaMisteroDomani } from '../lib/logic';

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('BOT_TOKEN non trovato!');
}

// Helper per inviare messaggi via API diretta
async function sendMessage(chatId: number, text: string, options?: any) {
  if (!BOT_TOKEN) throw new Error("BOT_TOKEN non impostato");

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body: any = {
    chat_id: chatId,
    text: text,
    ...options
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API Error: ${response.status} ${errorText}`);
  }
   
  return response.json();
}

async function answerCallbackQuery(callbackQueryId: string, options?: any) {
  if (!BOT_TOKEN) throw new Error("BOT_TOKEN non impostato");

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
  const body: any = {
    callback_query_id: callbackQueryId,
    ...options
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Telegram API Error: ${response.status} ${errorText}`);
  }
   
  return response.json();
}

async function inviaMessaggioGiornaliero(chatId: number, numeroPartecipante: number) {
  const mistero = calcolaMisteroOggi(numeroPartecipante);
  const oggi = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  await sendMessage(
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
    await sendMessage(chatId, '❌ Il numero deve essere tra 1 e 20');
    return;
  }
  
  const dataEsistente = await getPartecipante(chatId);
  await salvaPartecipante(chatId, {
    numero,
    notificheAttive: dataEsistente?.notificheAttive || false
  });
  
  await sendMessage(
    chatId,
    `✅ Numero partecipante impostato: ${numero}\n\n` +
    '💾 Configurazione salvata! Non dovrai più reimpostarla.\n\n' +
    'Ora puoi usare:\n' +
    '• /oggi per sapere quale mistero recitare oggi\n' +
    '• /notifiche per attivare le notifiche giornaliere'
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const update = req.body;
    console.log('Update ricevuto:', JSON.stringify(update, null, 2));

    // Gestione messaggi normali
    if (update.message) {
      const message = update.message;
      const chatId = message.chat.id;
      const text = message.text || '';

      console.log(`Messaggio da ${chatId}: ${text}`);

      // Comando /start
      if (text === '/start') {
        await sendMessage(
          chatId,
          '🙏 Benvenuto nel Bot Rosario Vivente!\n\n' +
          'Usa /imposta [numero] per impostare il tuo numero di partecipante (da 1 a 20)\n' +
          'Esempio: /imposta 15\n\n' +
          'Poi usa:\n' +
          '/oggi - Per sapere quale mistero recitare oggi\n' +
          '/domani - Per sapere quale mistero recitare domani\n' +
          '/notifiche - Attiva/disattiva le notifiche giornaliere (ore 11:00)\n'
        );
        return res.status(200).send('OK');
      }

      // Comando /imposta
      if (text === '/imposta') {
        await setAttesaNumero(chatId, true);
        await sendMessage(chatId, '🔢 Per favore, inserisci il tuo numero di partecipante (da 1 a 20):');
        return res.status(200).send('OK');
      }

      // Comando /imposta [numero]
      const impostaMatch = text.match(/^\/imposta (\d+)$/);
      if (impostaMatch) {
        const numero = parseInt(impostaMatch[1]);
        await impostaNumero(chatId, numero);
        return res.status(200).send('OK');
      }

      // Comando /oggi
      if (text === '/oggi') {
        const data = await getPartecipante(chatId);
        if (!data) {
          await sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
          return res.status(200).send('OK');
        }
        await inviaMessaggioGiornaliero(chatId, data.numero);
        return res.status(200).send('OK');
      }

      // Comando /domani
      if (text === '/domani') {
        const data = await getPartecipante(chatId);
        if (!data) {
          await sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
          return res.status(200).send('OK');
        }
        
        const mistero = calcolaMisteroDomani(data.numero);
        const domani = new Date();
        domani.setDate(domani.getDate() + 1);
        const dataFormattata = domani.toLocaleDateString('it-IT', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        await sendMessage(
          chatId,
          `📿 ${dataFormattata}\n\n` +
          `🙏 Domani dovrai recitare:\n*${mistero.nome}*\n\n` +
          `Messaggio da inviare al gruppo:\n\`${data.numero}.ok ${mistero.abbreviazione}\``,
          { parse_mode: 'Markdown' }
        );
        return res.status(200).send('OK');
      }

      // Comando /notifiche
      if (text === '/notifiche') {
        const data = await getPartecipante(chatId);
        if (!data) {
          await sendMessage(chatId, '❌ Prima devi impostare il tuo numero con /imposta [numero]');
          return res.status(200).send('OK');
        }
        
        data.notificheAttive = !data.notificheAttive;
        await salvaPartecipante(chatId, data);
        
        const stato = data.notificheAttive ? 'ATTIVATE' : 'DISATTIVATE';
        await sendMessage(chatId, `🔔 Notifiche giornaliere ${stato}!\nRiceverai un messaggio ogni giorno alle ore 11:00.`);
        return res.status(200).send('OK');
      }

      // Comando /pulisci
      if (text === '/pulisci') {
        await sendMessage(chatId, '🧹 Pulizia chat...\n\n' + '\n'.repeat(30) + '✨ Chat pulita!');
        return res.status(200).send('OK');
      }

      // Gestione numero in attesa
      if (/^\d+$/.test(text)) {
        const inAttesa = await getAttesaNumero(chatId);
        if (inAttesa) {
          await setAttesaNumero(chatId, false);
          const numero = parseInt(text);
          await impostaNumero(chatId, numero);
          return res.status(200).send('OK');
        }
      }
    }

    // Gestione callback query (pulsanti inline)
    if (update.callback_query) {
      const query = update.callback_query;
      const chatId = query.message?.chat.id;
      const data = query.data;

      if (!chatId || !data) {
        return res.status(200).send('OK');
      }

      if (data.startsWith('copy_')) {
        const parts = data.split('_');
        const numero = parts[1];
        const mistero = parts.slice(2).join('_');
        const messaggio = `${numero}.ok ${mistero}`;
        
        await answerCallbackQuery(query.id, { text: `Messaggio copiato: ${messaggio}` });
        await sendMessage(chatId, messaggio);
        return res.status(200).send('OK');
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Errore nel webhook:', error);
    res.status(500).send('Error');
  }
}