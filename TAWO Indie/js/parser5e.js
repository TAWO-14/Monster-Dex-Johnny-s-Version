import { uid } from './utils.js';

// Remove marcações internas do 5etools (ex: {@dice 1d6}, {@hit 5}) deixando apenas o texto
function clean5eTags(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/\{@(?:atk|dice|damage|d20|hit|recharge) ([^}]+)\}/g, '$1')
    .replace(/\{@(?:creature|spell|condition|item|skill|sense) ([^}|]+)(?:\|[^}]+)?\}/g, '$1')
    .replace(/\{@[a-z]+ ([^}]+)\}/g, '$1');
}

// Extrai entradas aninhadas ou arrays de strings para o formato [{ name, text }]
function parseEntries(entries = []) {
  return entries.map((entry) => {
    if (typeof entry === 'string') {
      return { name: '', text: clean5eTags(entry) };
    }
    const name = entry.name || '';
    const textParts = (entry.entries || []).map((e) => (typeof e === 'string' ? e : e.text || ''));
    return {
      name: clean5eTags(name),
      text: clean5eTags(textParts.join('\n'))
    };
  });
}

export function convert5eMonster(raw) {
  // Tratamento da CA (pode ser número simples ou array de objetos no 5etools)
  let ac = 10;
  let acNote = '';
  if (Array.isArray(raw.ac) && raw.ac.length > 0) {
    const firstAc = raw.ac[0];
    if (typeof firstAc === 'number') {
      ac = firstAc;
    } else if (typeof firstAc === 'object') {
      ac = firstAc.ac || 10;
      acNote = (firstAc.from || []).join(', ');
    }
  } else if (typeof raw.ac === 'number') {
    ac = raw.ac;
  }

  // Tratamento de Deslocamento
  let speed = '9 m';
  if (raw.speed) {
    if (typeof raw.speed === 'string') {
      speed = raw.speed;
    } else if (typeof raw.speed === 'object') {
      speed = Object.entries(raw.speed)
        .map(([mode, val]) => {
          const num = typeof val === 'object' ? val.number : val;
          const label = mode === 'walk' ? '' : `${mode} `;
          return `${label}${num} ft`;
        })
        .join(', ');
    }
  }

  // Tratamento de Tipo
  const typeStr = typeof raw.type === 'string' ? raw.type : raw.type?.type || '';

  // Tratamento de ND (CR)
  let crStr = '—';
  if (raw.cr != null) {
    crStr = typeof raw.cr === 'string' ? raw.cr : raw.cr.cr || String(raw.cr);
  }

  return {
    id: uid('m'),
    name: raw.name || 'Criatura',
    size: raw.size ? (Array.isArray(raw.size) ? raw.size[0] : raw.size) : 'Médio',
    type: typeStr,
    alignment: Array.isArray(raw.alignment) ? raw.alignment.join(' ') : (raw.alignment || ''),
    ac: Number(ac) || 10,
    acNote: clean5eTags(acNote),
    hpAvg: raw.hp?.average || 10,
    hpDice: raw.hp?.formula ? clean5eTags(raw.hp.formula) : '',
    speed: speed,
    str: raw.str || 10,
    dex: raw.dex || 10,
    con: raw.con || 10,
    int: raw.int || 10,
    wis: raw.wis || 10,
    cha: raw.cha || 10,
    saves: raw.save ? Object.entries(raw.save).map(([k, v]) => `${k.toUpperCase()} ${v}`).join(', ') : '',
    skills: raw.skill ? Object.entries(raw.skill).map(([k, v]) => `${k} ${v}`).join(', ') : '',
    resistances: clean5eTags((raw.resist || []).map(r => typeof r === 'string' ? r : r.resist?.join(', ') || '').join(', ')),
    immunities: clean5eTags((raw.immune || []).map(i => typeof i === 'string' ? i : i.immune?.join(', ') || '').join(', ')),
    vulnerabilities: clean5eTags((raw.vulnerable || []).map(v => typeof v === 'string' ? v : v.vulnerable?.join(', ') || '').join(', ')),
    conditionImmunities: clean5eTags((raw.conditionImmune || []).map(c => typeof c === 'string' ? c : c.conditionImmune?.join(', ') || '').join(', ')),
    senses: clean5eTags(Array.isArray(raw.senses) ? raw.senses.join(', ') : (raw.senses || '')),
    languages: Array.isArray(raw.languages) ? raw.languages.join(', ') : (raw.languages || '—'),
    cr: crStr,
    traits: parseEntries(raw.trait),
    actions: parseEntries(raw.action),
    bonusActions: parseEntries(raw.bonus),
    reactions: parseEntries(raw.reaction),
    legendaryActions: parseEntries(raw.legendary),
    legendaryNote: '',
    notes: `Fonte: ${raw.source || '5etools'}`
  };
}