require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const https = require('https');

const DATABASE_URL = process.env.DATABASE_URL;

function neonQuery(text, params = []) {
  if (!DATABASE_URL) return Promise.reject(new Error('DATABASE_URL sozlanmagan'));
  const dbUrl = new URL(DATABASE_URL);
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: text, params });
    const req = https.request({
      hostname: dbUrl.hostname,
      port: 443,
      path: '/sql',
      method: 'POST',
      rejectUnauthorized: true,
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
          resolve({ rows: json.rows || [], rowCount: json.rowCount ?? json.rows?.length ?? 0 });
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
    return neonQuery(text, params);
  },
};

module.exports = pool;
