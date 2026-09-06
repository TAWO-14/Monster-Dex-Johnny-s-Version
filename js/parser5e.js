import { uid } from './utils.js';
import { 
  SIZES_PT, 
  TYPES_PT, 
  SKILLS_PT, 
  translateText, 
  translateActionName, 
  translateAlignment,
  translateLanguages,
  translateSaves
} from './translator.js';

function clean5eTags(text) {
  if (typeof text !== 'string') return '';
  return text
    // 1. Tags sem espaço (como {@h})
    .replace(/\{@h\}/gi, 'Acerto: ')
    
    // 2. Tags com pipes duplos ou simples (pega o texto visível antes do pipe)
    // Ex: {@status concentration||concentrating on a spell} -> "concentrating on a spell"
    .replace(/\{@[a-z]+\s+([^|}]+)\|\|([^}]+)\}/gi, '$2')
    .replace(/\{@[a-z]+\s+([^|}]+)(?:\|[^}]+)?\}/gi, '$1')
    
    // 3. Tags de tipo de ataque (mw, rw, ms, rs)
    .replace(/\bmw,rw\b/gi, 'Ataque Corpo a Corpo ou à Distância com Arma:')
    .replace(/\bmw\b/gi, 'Ataque Corpo a Corpo com Arma:')
    .replace(/\brw\b/gi, 'Ataque à Distância com Arma:')
    .replace(/\bms\b/gi, 'Ataque Mágico Corpo a Corpo:')
    .replace(/\brs\b/gi, 'Ataque Mágico à Distância:')

    // 4. Bônus de acerto abreviado ("4 to hit" -> "+4 para acertar")
    .replace(/(\d+)\s+to hit/gi, '+$1 para acertar')

    // 5. Qualquer outra tag genérica restante do 5etools
    .replace(/\{@[a-z]+\s*([^}]*)\}/gi, '$1');
}

// Extrai texto recursivamente de qualquer nível de aninhamento
function flattenEntryText(entry) {
  if (typeof entry === 'string') return clean5eTags(entry);
  if (!entry) return '';

  if (Array.isArray(entry)) {
    return entry.map(flattenEntryText).filter(Boolean).join('\n');
  }

  if (entry.entries) {
    return entry.entries.map(flattenEntryText).filter(Boolean).join('\n');
  }

  return clean5eTags(entry.text || '');
}

function parseEntries(entries = []) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => {
    if (typeof entry === 'string') {
      return { name: '', text: translateText(clean5eTags(entry)) };
    }
    const name = clean5eTags(entry.name || '');
    const fullText = (entry.entries || [])
      .map(flattenEntryText)
      .filter(Boolean)
      .join('\n');

    return {
      name: translateActionName(name), // Traduz Bite, Multiattack, etc.
      text: translateText(clean5eTags(fullText))
    };
  });
}

// Extrai strings limpas mesmo quando o 5etools usa objetos de condicional
function parseDefenseArray(arr = []) {
  if (!Array.isArray(arr)) return '';
  return arr.map((item) => {
    if (typeof item === 'string') return clean5eTags(item);
    if (typeof item === 'object' && item !== null) {
      const types = item.resist || item.immune || item.vulnerable || item.conditionImmune || [];
      const note = item.note ? ` (${clean5eTags(item.note)})` : '';
      return `${types.join(', ')}${note}`;
    }
    return '';
  }).filter(Boolean).join(', ');
}

export function convert5eMonster(raw) {
  // CA
  let ac = 10;
  let acNote = '';
  if (Array.isArray(raw.ac) && raw.ac.length > 0) {
    const firstAc = raw.ac[0];
    if (typeof firstAc === 'number') {
      ac = firstAc;
    } else if (typeof firstAc === 'object' && firstAc !== null) {
      ac = firstAc.ac || 10;
      acNote = (firstAc.from || []).join(', ');
    }
  } else if (typeof raw.ac === 'number') {
    ac = raw.ac;
  }

  // Velocidade com conversão para metros
  let speed = '9 m';
  if (raw.speed) {
    if (typeof raw.speed === 'string') {
      speed = translateText(raw.speed);
    } else if (typeof raw.speed === 'object') {
      const labels = { walk: '', fly: 'voo ', swim: 'natação ', climb: 'escalada ', burrow: 'escavação ' };
      speed = Object.entries(raw.speed)
        .filter(([mode]) => mode !== 'alternate')
        .map(([mode, val]) => {
          const num = typeof val === 'object' && val !== null ? val.number : val;
          const meters = Math.round((Number(num) || 30) * 0.3);
          return `${labels[mode] ?? `${mode} `}${meters} m`;
        })
        .join(', ');
    }
  }

  // Tipo
  const rawType = typeof raw.type === 'string' ? raw.type : (raw.type?.type || '');
  const typeStr = TYPES_PT[rawType.toLowerCase()] || rawType;

  // Tamanho
  const rawSize = Array.isArray(raw.size) ? raw.size[0] : (raw.size || 'M');
  const sizeStr = SIZES_PT[rawSize] || 'Médio';

  // Perícias
  const skillsStr = raw.skill
    ? Object.entries(raw.skill)
        .map(([k, v]) => `${SKILLS_PT[k.toLowerCase()] || k} ${v}`)
        .join(', ')
    : '';

  // Sentidos (pés para metros)
  let sensesStr = clean5eTags(Array.isArray(raw.senses) ? raw.senses.join(', ') : (raw.senses || ''));
  sensesStr = translateText(sensesStr).replace(/(\d+)\s*(?:ft|pés)/gi, (_, ft) => `${Math.round(Number(ft) * 0.3)} m`);

  // ND (CR)
  let crStr = '—';
  if (raw.cr != null) {
    crStr = typeof raw.cr === 'string' ? raw.cr : (raw.cr.cr || String(raw.cr));
  }

  return {
    id: uid('m'),
    name: raw.name || 'Criatura',
    size: sizeStr,
    type: typeStr,
    alignment: translateAlignment(raw.alignment),
    ac: Number(ac) || 10,
    acNote: translateText(clean5eTags(acNote)),
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
    skills: skillsStr,
    resistances: translateText(parseDefenseArray(raw.resist)),
    immunities: translateText(parseDefenseArray(raw.immune)),
    vulnerabilities: translateText(parseDefenseArray(raw.vulnerable)),
    conditionImmunities: translateText(parseDefenseArray(raw.conditionImmune)),
    senses: sensesStr,
    languages: Array.isArray(raw.languages) ? raw.languages.join(', ') : (raw.languages || '—'),
    cr: crStr,
    traits: parseEntries(raw.trait),
    actions: parseEntries(raw.action),
    bonusActions: parseEntries(raw.bonus),
    reactions: parseEntries(raw.reaction),
    legendaryActions: parseEntries(raw.legendary),
    legendaryNote: clean5eTags(raw.legendaryHeader ? flattenEntryText(raw.legendaryHeader) : ''),
    notes: `Fonte: ${raw.source || '5etools'}`
  };
}