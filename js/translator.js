// 1. TAMANHOS
export const SIZES_PT = {
  T: 'Miúdo', Tiny: 'Miúdo',
  S: 'Pequeno', Small: 'Pequeno',
  M: 'Médio', Medium: 'Médio',
  L: 'Grande', Large: 'Grande',
  H: 'Enorme', Huge: 'Enorme',
  G: 'Descomunal', Gargantuan: 'Descomunal'
};

// 2. TIPOS DE CRIATURA
export const TYPES_PT = {
  aberration: 'aberração', beast: 'fera', celestial: 'celestial', construct: 'constructo',
  dragon: 'dragão', elemental: 'elemental', fey: 'fada', fiend: 'corruptor',
  giant: 'gigante', humanoid: 'humanoide', monstrosity: 'monstruosidade', ooze: 'limo',
  plant: 'planta', undead: 'morto-vivo'
};

// 3. ALINHAMENTOS
export const ALIGNMENTS_PT = {
  L: 'leal', N: 'neutro', C: 'caótico', G: 'bom', E: 'mau', U: 'sem alinhamento', A: 'qualquer alinhamento',
  'lawful good': 'leal e bom', 'neutral good': 'neutro e bom', 'chaotic good': 'caótico e bom',
  'lawful neutral': 'leal e neutro', 'true neutral': 'neutro', 'neutral': 'neutro',
  'chaotic neutral': 'caótico e neutro', 'lawful evil': 'leal e mau', 'neutral evil': 'neutro e mau',
  'chaotic evil': 'caótico e mau', 'unaligned': 'sem alinhamento', 'any alignment': 'qualquer alinhamento'
};

// 4. ATRIBUTOS E SALVAGUARDAS
export const ATTR_MAP_PT = {
  str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR',
  strength: 'Força', dexterity: 'Destreza', constitution: 'Constituição',
  intelligence: 'Inteligência', wisdom: 'Sabedoria', charisma: 'Carisma'
};

// 5. PERÍCIAS
export const SKILLS_PT = {
  athletics: 'Atletismo', acrobatics: 'Acrobacia', 'sleight of hand': 'Prestidigitação',
  stealth: 'Furtividade', arcana: 'Arcanismo', history: 'História', investigation: 'Investigação',
  nature: 'Natureza', religion: 'Religião', 'animal handling': 'Adestrar Animais',
  insight: 'Intuição', medicine: 'Medicina', perception: 'Percepção', survival: 'Sobrevivência',
  deception: 'Enganação', intimidation: 'Intimidação', performance: 'Atuação', persuasion: 'Persuasão'
};

// 6. IDIOMAS
export const LANGUAGES_PT = {
  common: 'Comum', dwarvish: 'Anão', elvish: 'Élfico', giant: 'Gigante',
  gnomish: 'Gnomo', goblin: 'Goblin', halfling: 'Halfling', orc: 'Orc',
  abyssal: 'Abissal', celestial: 'Celestial', draconic: 'Dracônico',
  'deep speech': 'Dialeto Subterrâneo', infernal: 'Infernal', primordial: 'Primordial',
  sylvan: 'Silvestre', undercommon: 'Subcomum', telepathy: 'Telepatia',
  'understands but cannot speak': 'compreende, mas não fala'
};

// 7. CONDIÇÕES
export const CONDITIONS_PT = {
  blinded: 'cego', charmed: 'enfeitiçado', deafened: 'surdo', exhaustion: 'exausto',
  frightened: 'amedrontado', grappled: 'agarrado', incapacitated: 'incapacitado',
  invisible: 'invisível', paralyzed: 'paralisado', petrified: 'petrificado',
  poisoned: 'envenenado', prone: 'caído', restrained: 'restringido',
  stunned: 'atordoado', unconscious: 'inconsciente'
};

// 8. TIPOS DE DANO
export const DAMAGE_TYPES_PT = {
  acid: 'ácido', bludgeoning: 'concussão', cold: 'frio', fire: 'fogo', force: 'energia',
  lightning: 'elétrico', necrotic: 'necrótico', piercing: 'perfurante', poison: 'veneno',
  psychic: 'psíquico', radiant: 'radiante', slashing: 'cortante', thunder: 'trovão'
};

// 9. FRASES COMPLEXAS E ESTRUTURAS NARRATIVAS (Ordem decrescente de tamanho)
const PHRASES_PT = [
  // Sopros e Áreas (resolvendo a quebra de half damage)
  { en: /taking (\d+) \(([^\)]+)\) ([a-z]+) damage on a failed save, or half as much on a successful one\./gi,
    pt: (_, dmg, dice, t) => `sofrendo ${dmg} (${dice}) de dano de ${DAMAGE_TYPES_PT[t.toLowerCase()] || t} se falhar na salvaguarda, ou metade desse dano em caso de sucesso.` },
  { en: /taking (\d+) \(([^\)]+)\) ([a-z]+) damage on a failed save, or half as much damage on a successful one\./gi,
    pt: (_, dmg, dice, t) => `sofrendo ${dmg} (${dice}) de dano de ${DAMAGE_TYPES_PT[t.toLowerCase()] || t} se falhar na salvaguarda, ou metade desse dano em caso de sucesso.` },
  { en: /or half as much damage on a successful one/gi, pt: 'ou metade desse dano em caso de sucesso' },
  { en: /or half as much on a successful one/gi, pt: 'ou metade desse dano em caso de sucesso' },

  // Resistência Lendária
  { en: /If the dragon fails a saving throw, it can choose to succeed instead\./gi, pt: 'Se o dragão falhar em uma salvaguarda, ele pode escolher ter sucesso em vez disso.' },
  { en: /If the creature fails a saving throw, it can choose to succeed instead\./gi, pt: 'Se a criatura falhar em uma salvaguarda, ela pode escolher ter sucesso em vez disso.' },

  // Sopros com Cones e Linhas
  { en: /The dragon exhales ([a-z]+) in a (\d+)-foot cone\./gi, 
    pt: (_, elem, ft) => `O dragão sopra ${DAMAGE_TYPES_PT[elem.toLowerCase()] || elem} em um cone de ${Math.round(Number(ft) * 0.3)} m.` },
  { en: /The dragon exhales ([a-z]+) in a (\d+)-foot line that is (\d+)\s*(?:ft\.|feet|pés) wide\./gi, 
    pt: (_, elem, l, w) => `O dragão sopra ${DAMAGE_TYPES_PT[elem.toLowerCase()] || elem} em uma linha de ${Math.round(Number(l) * 0.3)} m de comprimento por ${Math.round(Number(w) * 0.3)} m de largura.` },

  // Gatilhos de Salvaguardas em Área
  { en: /Each creature in that line must make a (\d+) Dexterity saving throw/gi, pt: 'Cada criatura nessa linha deve realizar uma salvaguarda de Destreza CD $1' },
  { en: /Each creature in that area must make a (\d+) Dexterity saving throw/gi, pt: 'Cada criatura nessa área deve realizar uma salvaguarda de Destreza CD $1' },
  { en: /Each creature in that area must make a (\d+) ([a-z]+) saving throw/gi, 
    pt: (_, cd, attr) => `Cada criatura nessa área deve realizar uma salvaguarda de ${ATTR_MAP_PT[attr.toLowerCase()] || attr} CD ${cd}` },

  // Presença Aterradora
  { en: /Each creature of the dragon's choice that is within (\d+)\s*(?:feet|ft\.|pés) of the dragon and aware of it must succeed on a (\d+) Wisdom saving throw or become frightened for 1 minute\./gi, 
    pt: (_, ft, cd) => `Cada criatura à escolha do dragão que esteja a menos de ${Math.round(Number(ft) * 0.3)} m dele e ciente de sua presença deve ser bem-sucedida em uma salvaguarda de Sabedoria CD ${cd} ou ficará amedrontada por 1 minuto.` },
  { en: /A creature can repeat the saving throw at the end of each of its turns, ending the effect on itself on a success\./gi, pt: 'Uma criatura pode repetir a salvaguarda no final de cada um dos seus turnos, encerrando o efeito sobre si com um sucesso.' },
  { en: /If a creature's saving throw is successful or the effect ends for it, the creature is immune to the dragon's Frightful Presence for the next 24 hours\./gi, pt: 'Se a salvaguarda de uma criatura for bem-sucedida ou se o efeito for encerrado, ela se torna imune à Presença Aterradora do dragão pelas próximas 24 horas.' },

  // Cabeçalhos de Ataques
  { en: /Melee or Ranged Weapon Attack:/gi, pt: 'Ataque Corpo a Corpo ou à Distância com Arma:' },
  { en: /Melee Weapon Attack:/gi, pt: 'Ataque Corpo a Corpo com Arma:' },
  { en: /Ranged Weapon Attack:/gi, pt: 'Ataque à Distância com Arma:' },
  { en: /reach (\d+(?:\.\d+)?)\s*ft\./gi, pt: (_, ft) => `alcance ${(Number(ft) * 0.3).toFixed(1).replace('.0', '')} m.` },
  { en: /range (\d+)\/(\d+)\s*ft\./gi, pt: (_, n, m) => `alcance ${Math.round(Number(n) * 0.3)}/${Math.round(Number(m) * 0.3)} m.` },
  { en: /to hit/gi, pt: 'para acertar' },
  { en: /Hit:/gi, pt: 'Acerto:' },
  { en: /one target\./gi, pt: 'um alvo.' },
  { en: /plus/gi, pt: 'mais' },

  // Sentidos comuns
  { en: /\bblindsight\b/gi, pt: 'visão às cegas' },
  { en: /\bdarkvision\b/gi, pt: 'visão no escuro' },
  { en: /\btremorsense\b/gi, pt: 'sentido sísmico' },
  { en: /\btruesight\b/gi, pt: 'visão verdadeira' },
  { en: /\bpassive Perception\b/gi, pt: 'percepção passiva' }
];

export function translateText(text) {
  if (!text || typeof text !== 'string') return text;

  let out = text;
  for (const { en, pt } of PHRASES_PT) {
    out = out.replace(en, pt);
  }

  // Ajusta gramática de "fogo damage" -> "de dano de fogo"
  out = out.replace(/([a-zçãéí]+)\s+damage/gi, (_, dmgType) => {
    const ptType = DAMAGE_TYPES_PT[dmgType.toLowerCase()] || dmgType;
    return `de dano de ${ptType}`;
  });

  return out;
}

export function translateActionName(name) {
  if (!name) return '';
  return name
    .replace(/^Multiattack/i, 'Ataque Múltiplo')
    .replace(/^Bite/i, 'Mordida')
    .replace(/^Claw/i, 'Garra')
    .replace(/^Tail Attack/i, 'Ataque de Cauda')
    .replace(/^Tail/i, 'Cauda')
    .replace(/^Detect/i, 'Detectar')
    .replace(/^Frightful Presence/i, 'Presença Aterradora')
    .replace(/^Legendary Resistance/i, 'Resistência Lendária')
    .replace(/^Fire Breath(?:\s*\(?Recharge\s*(\d+(?:–\d+)?)\)?)?/i, 'Sopro de Fogo (Recarga $1)')
    .replace(/^Acid Breath(?:\s*\(?Recharge\s*(\d+(?:–\d+)?)\)?)?/i, 'Sopro Ácido (Recarga $1)')
    .replace(/^Lightning Breath(?:\s*\(?Recharge\s*(\d+(?:–\d+)?)\)?)?/i, 'Sopro Elétrico (Recarga $1)')
    .replace(/^Cold Breath(?:\s*\(?Recharge\s*(\d+(?:–\d+)?)\)?)?/i, 'Sopro de Gelo (Recarga $1)')
    .replace(/^Poison Breath(?:\s*\(?Recharge\s*(\d+(?:–\d+)?)\)?)?/i, 'Sopro Venenoso (Recarga $1)')
    .replace(/^Wing Attack(?:\s*\(Costs (\d+) Actions\))?/i, 'Ataque com Asas (Custa $1 Ações)')
    .replace(/Costs (\d+) Actions/i, 'Custa $1 Ações')
    .replace(/(\d+)\/Day/i, '$1/Dia');
}

export function translateLanguages(raw) {
  if (!raw || raw === '—') return '—';
  return raw.split(/,\s*/).map(l => LANGUAGES_PT[l.toLowerCase()] || l).join(', ');
}

export function translateSaves(savesObj) {
  if (!savesObj) return '';
  return Object.entries(savesObj)
    .map(([k, v]) => `${ATTR_MAP_PT[k.toLowerCase()] || k.toUpperCase()} ${v}`)
    .join(', ');
}

export function translateAlignment(raw) {
  if (!raw) return 'sem alinhamento';
  if (Array.isArray(raw)) return raw.map(a => ALIGNMENTS_PT[a] || a).join(' e ');
  return ALIGNMENTS_PT[String(raw).toLowerCase()] || String(raw);
}