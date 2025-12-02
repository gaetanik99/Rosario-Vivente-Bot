import { VercelRequest, VercelResponse } from '@vercel/node';
import { caricaPartecipanti } from '../lib/storage';
import { calcolaMisteroOggi } from '../lib/logic';

const BOT_TOKEN = process.env.BOT_TOKEN;

async function inviaMessaggioTelegram(chatId: number, text: string, options?: any) {
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

async function inviaNotificaGiornaliera(chatId: number, numeroPartecipante: number) {
  const mistero = calcolaMisteroOggi(numeroPartecipante);
  const oggi = new Date().toLocaleDateString('it-IT', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    timeZone: 'Europe/Rome'
  });
  
  const messaggio = `📿 ${oggi}\n\n` +
    `🔔 **TEST NOTIFICA**\n\n` +
    `🙏 Oggi devi recitare:\n*${mistero.nome}*\n\n` +
    `Messaggio da inviare al gruppo:\n\`${numeroPartecipante}.ok ${mistero.abbreviazione}\``;
  
  await inviaMessaggioTelegram(
    chatId,
    messaggio,
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    console.log('🧪 TEST - Avvio cron job...');
    const partecipanti = await caricaPartecipanti();
    let inviati = 0;
    let errori = 0;
    const dettagli: any[] = [];
    
    for (const [chatId, data] of partecipanti) {
      if (data.notificheAttive) {
        try {
          await inviaNotificaGiornaliera(chatId, data.numero);
          inviati++;
          dettagli.push({
            chatId,
            numero: data.numero,
            status: 'inviato'
          });
          console.log(`✅ Test notifica inviata a ${chatId}`);
        } catch (error) {
          errori++;
          dettagli.push({
            chatId,
            numero: data.numero,
            status: 'errore',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`❌ Errore test invio a ${chatId}:`, error);
        }
      } else {
        dettagli.push({
          chatId,
          numero: data.numero,
          status: 'notifiche_disattivate'
        });
      }
    }
    
    const risultato = {
      success: true,
      test: true,
      inviati,
      errori,
      totalePartecipanti: partecipanti.size,
      timestamp: new Date().toISOString(),
      dettagli
    };
    
    console.log('📊 Risultato test:', risultato);
    res.status(200).json(risultato);
  } catch (error) {
    console.error('Errore nel test cron job:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      test: true
    });
  }
}