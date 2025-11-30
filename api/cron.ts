import { VercelRequest, VercelResponse } from '@vercel/node';
import { caricaPartecipanti } from '../lib/storage';
import { inviaMessaggioGiornaliero } from '../lib/telegram';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Verifica opzionale del token cron se impostato
  // if (process.env.CRON_SECRET && req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return res.status(401).end('Unauthorized');
  // }

  try {
    console.log('🔔 Avvio cron job giornaliero...');
    const partecipanti = await caricaPartecipanti();
    let inviati = 0;
    
    for (const [chatId, data] of partecipanti) {
      if (data.notificheAttive) {
        try {
          await inviaMessaggioGiornaliero(chatId, data.numero);
          inviati++;
        } catch (error) {
          console.error(`Errore invio a ${chatId}:`, error);
        }
      }
    }
    
    console.log(`✅ Notifiche inviate a ${inviati} partecipanti.`);
    res.status(200).json({ success: true, inviati });
  } catch (error) {
    console.error('Errore nel cron job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
