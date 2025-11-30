import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const BOT_TOKEN = process.env.BOT_TOKEN;
  
  if (!BOT_TOKEN) {
    return res.status(500).json({ error: 'BOT_TOKEN non configurato' });
  }

  // URL del tuo dominio Vercel + path del webhook
  const WEBHOOK_URL = `https://${req.headers.host}/api/webhook`;
  
  try {
    const response = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: WEBHOOK_URL,
          allowed_updates: ['message', 'callback_query']
        })
      }
    );

    const data = await response.json();
    
    if (data.ok) {
      return res.status(200).json({ 
        success: true, 
        message: `Webhook configurato su: ${WEBHOOK_URL}`,
        telegram_response: data
      });
    } else {
      return res.status(400).json({ 
        success: false, 
        error: data.description,
        telegram_response: data
      });
    }
  } catch (error) {
    console.error('Errore setup webhook:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore durante la configurazione del webhook' 
    });
  }
}