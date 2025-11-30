"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const telegram_1 = require("../lib/telegram");
async function handler(req, res) {
    try {
        // In Vercel, req.body is already parsed if it's JSON
        if (req.body) {
            await telegram_1.bot.processUpdate(req.body);
        }
        res.status(200).send('OK');
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).send('Error');
    }
}
