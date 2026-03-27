export const sum = (n) => n.toLocaleString('ru-RU') + ' сум';

export function formatPhone(raw) {
  const d = raw.replace(/\D/g,'').replace(/^998/,'').slice(0,9);
  const p = '+998';
  if (!d.length) return p;
  if (d.length <= 2) return p+' '+d;
  if (d.length <= 5) return p+' '+d.slice(0,2)+' '+d.slice(2);
  if (d.length <= 7) return p+' '+d.slice(0,2)+' '+d.slice(2,5)+' '+d.slice(5);
  return p+' '+d.slice(0,2)+' '+d.slice(2,5)+' '+d.slice(5,7)+' '+d.slice(7);
}

export const rawDigits = (phone) => phone.replace(/\D/g,'');
export const isValidPhone = (phone) => rawDigits(phone).length === 12;

export function pluralRu(n, one, two, five) {
  const abs = Math.abs(n) % 100;
  const n1 = abs % 10;
  if (abs > 10 && abs < 20) return five;
  if (n1 > 1 && n1 < 5) return two;
  if (n1 === 1) return one;
  return five;
}

export function daysUntil(dateStr) {
  if (!dateStr) return 999;
  const now = new Date();
  const monthNames = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const parts = dateStr.split(' ');
  const dayNum = parseInt(parts[0]);
  const monthIdx = monthNames.findIndex(m => m.toLowerCase() === (parts[1]||'').toLowerCase());
  if (isNaN(dayNum) || monthIdx === -1) return 999;
  const target = new Date(now.getFullYear(), monthIdx, dayNum);
  if (target < now) target.setFullYear(now.getFullYear()+1);
  return Math.ceil((target - now) / 86400000);
}
