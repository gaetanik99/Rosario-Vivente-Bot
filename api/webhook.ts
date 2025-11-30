import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../lib/telegram';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Logga per debug (apparirà nei Runtime Logs di Vercel se espandi la riga)
    console.log("Ricevuto update:", JSON.stringify(req.body));

    const update = req.body;
    
    // Gestione manuale e SINCRONA per debug
    if (update.message && update.message.text === '/start') {
      const chatId = update.message.chat.id;
      console.log(`Tento di inviare messaggio a ${chatId}...`);

      // Verifica token prima di inviare
      if (!process.env.BOT_TOKEN) {
         throw new Error("Variabile BOT_TOKEN non trovata su Vercel!");
      }

      // Inviamo direttamente bypassando i listener per essere sicuri di fare await
      await bot.sendMessage(chatId, '✅ Il bot funziona! Token corretto.');
      console.log("Messaggio inviato con successo!");
    } else {
      // Se non è /start, lascia fare al gestore standard (ma ricorda il problema async)
      // Per ora ci interessa solo testare se il bot risponde
      if (req.body) {
          bot.processUpdate(req.body);
      }
    }
    
    res.status(200).send('OK');
  } catch (error: any) {
    console.error('ERRORE CRITICO:', error);
    // Questo farà apparire la richiesta ROSSA nei log di Vercel (Status 500)
    // E ti mostrerà il messaggio d'errore nel corpo della risposta
    res.status(500).send(`Errore Bot: ${error.message || error}`);
  }
}