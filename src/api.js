const BASE = import.meta.env.VITE_API_URL || '';

const api = {
  _token: () => localStorage.getItem('sm_token') || '',
  _headers(extra = {}) {
    const h = { 'Content-Type': 'application/json', ...extra };
    const t = this._token();
    if (t) h['Authorization'] = `Bearer ${t}`;
    return h;
  },
  async _parse(r) {
    const text = await r.text();
    try { return text ? JSON.parse(text) : {}; } catch { return {}; }
  },
  async get(url) {
    const r = await fetch(BASE + url, { headers: this._headers() });
    const data = await this._parse(r);
    if (!r.ok) throw new Error(data.error || 'Server xatosi');
    return data;
  },
  async post(url, body) {
    const r = await fetch(BASE + url, { method: 'POST', headers: this._headers(), body: JSON.stringify(body) });
    const data = await this._parse(r);
    if (!r.ok) throw new Error(data.error || 'Server xatosi');
    return data;
  },
  async patch(url, body) {
    const r = await fetch(BASE + url, { method: 'PATCH', headers: this._headers(), body: JSON.stringify(body) });
    const data = await this._parse(r);
    if (!r.ok) throw new Error(data.error || 'Server xatosi');
    return data;
  },
  async del(url) {
    const r = await fetch(BASE + url, { method: 'DELETE', headers: this._headers() });
    const data = await this._parse(r);
    if (!r.ok) throw new Error(data.error || 'Server xatosi');
    return data;
  },
};

export default api;
