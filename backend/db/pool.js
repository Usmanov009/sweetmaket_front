require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL muhit o\'zgaruvchisi topilmadi! Render → Environment da qo\'shing.');
  process.exit(1);
}
const dbUrl = new URL(DATABASE_URL);

function neonQuery(text, params = []) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: text, params });

    const req = https.request({
      hostname: dbUrl.hostname,
      port: 443,
      path: '/sql',
      method: 'POST',
      rejectUnauthorized: false,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'Neon-Connection-String': DATABASE_URL,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.message) return reject(new Error(json.message));
          resolve(json.rows || []);
        } catch (e) {
          reject(new Error('JSON parse xato: ' + data.slice(0, 200)));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('DB timeout')); });
    req.write(body);
    req.end();
  });
}

const pool = {
  async query(text, params) {
    const rows = await neonQuery(text, params);
    return { rows };
  },
};

module.exports = pool;
