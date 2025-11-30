import { VercelRequest, VercelResponse } from '@vercel/node';
import { bot } from '../lib/telegram';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // In Vercel, req.body is already parsed if it's JSON
    if (req.body) {
      await bot.processUpdate(req.body);
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error');
  }
}
