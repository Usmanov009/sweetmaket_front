const https = require('https');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const BOT_TOKEN = process.env.BOT_TOKEN || '';

function sendTelegramMessage(chatId, text) {
  if (!BOT_TOKEN || !chatId) return;
  const body = JSON.stringify({ chat_id: String(chatId), text, parse_mode: 'HTML' });
  const req = https.request({
    hostname: 'api.telegram.org',
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  }, res => { res.resume(); });
  req.on('error', () => {});
  req.write(body);
  req.end();
}

module.exports = { sendTelegramMessage };
