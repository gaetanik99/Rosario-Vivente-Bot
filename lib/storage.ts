import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

export interface PartecipanteData {
  numero: number;
  notificheAttive: boolean;
}

const USE_VERCEL_KV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const LOCAL_DATA_FILE = path.join(__dirname, '../partecipanti.json');

// Helper per fallback locale
function getLocalData(): Record<string, any> {
  try {
    if (fs.existsSync(LOCAL_DATA_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Errore lettura file locale:', e);
  }
  return {};
}

function saveLocalData(data: Record<string, any>) {
  try {
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Errore scrittura file locale:', e);
  }
}

// Mappa in memoria per attesa numero (per local dev)
const localAttesaMap = new Map<number, number>(); // chatId -> timestamp scadenza

export async function caricaPartecipanti(): Promise<Map<number, PartecipanteData>> {
  try {
    if (USE_VERCEL_KV) {
      const data = await kv.hgetall('partecipanti');
      if (!data) return new Map();
      
      return new Map(
        Object.entries(data).map(([k, v]: [string, any]) => {
          const partecipanteData: PartecipanteData = typeof v === 'number'
            ? { numero: v, notificheAttive: false }
            : v;
          return [parseInt(k), partecipanteData];
        })
      );
    } else {
      // Fallback locale
      const data = getLocalData();
      return new Map(
        Object.entries(data).map(([k, v]: [string, any]) => {
          const partecipanteData: PartecipanteData = typeof v === 'number'
            ? { numero: v, notificheAttive: false }
            : v;
          return [parseInt(k), partecipanteData];
        })
      );
    }
  } catch (error) {
    console.error('Errore nel caricamento dei dati:', error);
    return new Map();
  }
}

export async function salvaPartecipante(chatId: number, data: PartecipanteData): Promise<void> {
  try {
    if (USE_VERCEL_KV) {
      await kv.hset('partecipanti', { [chatId]: data });
    } else {
      // Fallback locale
      const currentData = getLocalData();
      currentData[chatId] = data;
      saveLocalData(currentData);
    }
  } catch (error) {
    console.error('Errore nel salvataggio dei dati:', error);
  }
}

export async function getPartecipante(chatId: number): Promise<PartecipanteData | null> {
    try {
        if (USE_VERCEL_KV) {
          const data = await kv.hget('partecipanti', chatId.toString()) as PartecipanteData | null;
          return data;
        } else {
          // Fallback locale
          const currentData = getLocalData();
          return currentData[chatId] || null;
        }
    } catch (error) {
        console.error('Errore nel recupero del partecipante:', error);
        return null;
    }
}

export async function setAttesaNumero(chatId: number, inAttesa: boolean): Promise<void> {
  try {
    if (USE_VERCEL_KV) {
      if (inAttesa) {
        await kv.set(`attesa_numero:${chatId}`, 'true', { ex: 300 }); // Scade dopo 5 minuti
      } else {
        await kv.del(`attesa_numero:${chatId}`);
      }
    } else {
      // Fallback locale (in memoria)
      if (inAttesa) {
        localAttesaMap.set(chatId, Date.now() + 300000);
      } else {
        localAttesaMap.delete(chatId);
      }
    }
  } catch (error) {
    console.error('Errore gestione stato attesa:', error);
  }
}

export async function getAttesaNumero(chatId: number): Promise<boolean> {
  try {
    if (USE_VERCEL_KV) {
      const val = await kv.get(`attesa_numero:${chatId}`);
      return val === 'true';
    } else {
      // Fallback locale
      const scadenza = localAttesaMap.get(chatId);
      if (!scadenza) return false;
      if (Date.now() > scadenza) {
        localAttesaMap.delete(chatId);
        return false;
      }
      return true;
    }
  } catch (error) {
    return false;
  }
}
