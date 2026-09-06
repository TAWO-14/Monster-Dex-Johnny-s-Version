export const uid = (prefix = 'id') => 
  `${prefix}_${crypto.randomUUID().slice(0, 8)}`;

export const escapeHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

export const mod = (score) => Math.floor(((Number(score) || 10) - 10) / 2);

export const fmtMod = (score) => {
  const m = mod(score);
  return m >= 0 ? `+${m}` : `${m}`;
};