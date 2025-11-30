"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const storage_1 = require("../lib/storage");
const telegram_1 = require("../lib/telegram");
async function handler(req, res) {
    // Verifica opzionale del token cron se impostato
    // if (process.env.CRON_SECRET && req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return res.status(401).end('Unauthorized');
    // }
    try {
        console.log('🔔 Avvio cron job giornaliero...');
        const partecipanti = await (0, storage_1.caricaPartecipanti)();
        let inviati = 0;
        for (const [chatId, data] of partecipanti) {
            if (data.notificheAttive) {
                try {
                    await (0, telegram_1.inviaMessaggioGiornaliero)(chatId, data.numero);
                    inviati++;
                }
                catch (error) {
                    console.error(`Errore invio a ${chatId}:`, error);
                }
            }
        }
        console.log(`✅ Notifiche inviate a ${inviati} partecipanti.`);
        res.status(200).json({ success: true, inviati });
    }
    catch (error) {
        console.error('Errore nel cron job:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
