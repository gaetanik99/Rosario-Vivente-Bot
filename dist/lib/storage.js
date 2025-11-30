"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.caricaPartecipanti = caricaPartecipanti;
exports.salvaPartecipante = salvaPartecipante;
exports.getPartecipante = getPartecipante;
exports.setAttesaNumero = setAttesaNumero;
exports.getAttesaNumero = getAttesaNumero;
const kv_1 = require("@vercel/kv");
async function caricaPartecipanti() {
    try {
        const data = await kv_1.kv.hgetall('partecipanti');
        if (!data)
            return new Map();
        return new Map(Object.entries(data).map(([k, v]) => {
            const partecipanteData = typeof v === 'number'
                ? { numero: v, notificheAttive: false }
                : v;
            return [parseInt(k), partecipanteData];
        }));
    }
    catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        return new Map();
    }
}
async function salvaPartecipante(chatId, data) {
    try {
        await kv_1.kv.hset('partecipanti', { [chatId]: data });
    }
    catch (error) {
        console.error('Errore nel salvataggio dei dati:', error);
    }
}
async function getPartecipante(chatId) {
    try {
        const data = await kv_1.kv.hget('partecipanti', chatId.toString());
        return data;
    }
    catch (error) {
        console.error('Errore nel recupero del partecipante:', error);
        return null;
    }
}
async function setAttesaNumero(chatId, inAttesa) {
    try {
        if (inAttesa) {
            await kv_1.kv.set(`attesa_numero:${chatId}`, 'true', { ex: 300 }); // Scade dopo 5 minuti
        }
        else {
            await kv_1.kv.del(`attesa_numero:${chatId}`);
        }
    }
    catch (error) {
        console.error('Errore gestione stato attesa:', error);
    }
}
async function getAttesaNumero(chatId) {
    try {
        const val = await kv_1.kv.get(`attesa_numero:${chatId}`);
        return val === 'true';
    }
    catch (error) {
        return false;
    }
}
