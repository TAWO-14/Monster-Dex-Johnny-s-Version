import { uid } from './utils.js';
import { convert5eMonster } from './parser5e.js';

const STORAGE_KEY = 'grimorio_combate_v1';

export function seedMonsters() {
  return [
    {
      id: uid('m'), name: 'Goblin', size: 'Pequeno', type: 'humanoide (goblinoide)', alignment: 'neutro e mau',
      ac: 15, acNote: 'armadura de couro e escudo', hpAvg: 7, hpDice: '2d6', speed: '9 m',
      str: 10, dex: 14, con: 10, int: 10, wis: 8, cha: 8,
      saves: '', skills: 'Furtividade +6', resistances: '', immunities: '', vulnerabilities: '', conditionImmunities: '',
      senses: 'visão no escuro 18 m, percepção passiva 9', languages: 'goblin, comum', cr: '1/4 (50 PE)',
      traits: [{ name: 'Fuga Ágil', text: 'Pode usar a ação Desengajar ou Esconder-se como ação bônus em cada turno.' }],
      actions: [
        { name: 'Cimitarra', text: 'Ataque corpo a corpo com arma: +4 para acertar, alcance 1,5 m. Acerto: 5 (1d6+2) de dano cortante.' },
        { name: 'Besta curta', text: 'Ataque à distância com arma: +4 para acertar, alcance 24/96 m. Acerto: 5 (1d6+2) de dano perfurante.' }
      ],
      bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
    },
    {
      id: uid('m'), name: 'Orc', size: 'Médio', type: 'humanoide (orc)', alignment: 'caótico e mau',
      ac: 13, acNote: 'armadura de couro cru', hpAvg: 15, hpDice: '2d8+6', speed: '9 m',
      str: 16, dex: 12, con: 16, int: 7, wis: 11, cha: 10,
      saves: '', skills: 'Intimidação +2', resistances: '', immunities: '', vulnerabilities: '', conditionImmunities: '',
      senses: 'visão no escuro 18 m, percepção passiva 10', languages: 'comum, orc', cr: '1/2 (100 PE)',
      traits: [{ name: 'Fúria Agressiva', text: 'Como ação bônus, pode se mover até seu deslocamento em direção a um inimigo que possa ver.' }],
      actions: [
        { name: 'Machado grande', text: 'Ataque corpo a corpo com arma: +5 para acertar, alcance 1,5 m. Acerto: 9 (1d12+3) de dano cortante.' },
        { name: 'Azagaia', text: 'Ataque corpo a corpo ou à distância: +5 para acertar, alcance 1,5 m ou 9/36 m. Acerto: 6 (1d6+3) de dano perfurante.' }
      ],
      bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
    },
    {
      id: uid('m'), name: 'Esqueleto', size: 'Médio', type: 'morto-vivo', alignment: 'leal e mau',
      ac: 13, acNote: 'armadura de couro', hpAvg: 13, hpDice: '2d8+4', speed: '9 m',
      str: 10, dex: 14, con: 15, int: 6, wis: 8, cha: 5,
      saves: '', skills: '', resistances: '', immunities: 'veneno', vulnerabilities: 'contundente', conditionImmunities: 'envenenado, exausto',
      senses: 'visão no escuro 18 m, percepção passiva 9', languages: 'entende os idiomas que tinha em vida, mas não fala', cr: '1/4 (50 PE)',
      traits: [],
      actions: [
        { name: 'Espada curta', text: 'Ataque corpo a corpo com arma: +4 para acertar, alcance 1,5 m. Acerto: 5 (1d6+2) de dano perfurante.' },
        { name: 'Arco curto', text: 'Ataque à distância com arma: +4 para acertar, alcance 24/96 m. Acerto: 5 (1d6+2) de dano perfurante.' }
      ],
      bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
    },
    {
      id: uid('m'), name: 'Lobo', size: 'Médio', type: 'fera', alignment: 'sem alinhamento',
      ac: 13, acNote: 'couro natural', hpAvg: 11, hpDice: '2d8+2', speed: '12 m',
      str: 12, dex: 15, con: 12, int: 3, wis: 12, cha: 6,
      saves: '', skills: 'Percepção +3, Furtividade +4', resistances: '', immunities: '', vulnerabilities: '', conditionImmunities: '',
      senses: 'percepção passiva 13', languages: '—', cr: '1/4 (50 PE)',
      traits: [
        { name: 'Faro Aguçado', text: 'Tem vantagem em testes de Sabedoria (Percepção) que dependam de olfato.' },
        { name: 'Táticas de Matilha', text: 'Tem vantagem em ataques contra uma criatura se pelo menos um aliado estiver a 1,5 m dela e não incapacitado.' }
      ],
      actions: [
        { name: 'Mordida', text: 'Ataque corpo a corpo com arma: +4 para acertar, alcance 1,5 m. Acerto: 7 (2d4+2) perfurante. Alvo faz resistência de Força CD 11 ou é derrubado.' }
      ],
      bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
    },
    {
      id: uid('m'), name: 'Zumbi', size: 'Médio', type: 'morto-vivo', alignment: 'neutro e mau',
      ac: 8, acNote: '', hpAvg: 22, hpDice: '3d8+9', speed: '6 m',
      str: 13, dex: 6, con: 16, int: 3, wis: 6, cha: 5,
      saves: 'Sabedoria +0', skills: '', resistances: '', immunities: 'veneno', vulnerabilities: '', conditionImmunities: 'envenenado',
      senses: 'visão no escuro 18 m, percepção passiva 8', languages: 'entende os idiomas que tinha em vida, mas não fala', cr: '1/4 (50 PE)',
      traits: [{ name: 'Fortitude de Morto-Vivo', text: 'Se sofrer dano que reduza a 0 PV, faz resistência de Constituição (CD 5 + dano sofrido); se passar, fica com 1 PV. Não funciona contra dano radiante ou crítico.' }],
      actions: [{ name: 'Pancada', text: 'Ataque corpo a corpo com arma: +3 para acertar, alcance 1,5 m. Acerto: 4 (1d6+1) de dano contundente.' }],
      bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
    },
    {
      id: uid('m'), name: 'Ogro', size: 'Grande', type: 'gigante', alignment: 'caótico e mau',
      ac: 11, acNote: 'armadura de peles', hpAvg: 59, hpDice: '7d10+21', speed: '12 m',
      str: 19, dex: 8, con: 16, int: 5, wis: 7, cha: 7,
      saves: '', skills: '', resistances: '', immunities: '', vulnerabilities: '', conditionImmunities: '',
      senses: 'visão no escuro 18 m, percepção passiva 8', languages: 'gigante, comum', cr: '2 (450 PE)',
      traits: [],
      actions: [
        { name: 'Porrete grande', text: 'Ataque corpo a corpo com arma: +6 para acertar, alcance 3 m. Acerto: 13 (2d8+4) de dano contundente.' },
        { name: 'Azagaia', text: 'Ataque corpo a corpo ou à distância: +6 para acertar, alcance 3 m ou 18/36 m. Acerto: 11 (2d6+4) de dano perfurante.' }
      ],
      bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
    }
  ];
}

function defaultState() {
  return {
    bestiario: seedMonsters(),
    combate: { round: 1, currentIndex: 0, combatants: [] }
  };
}

export const Storage = {
  state: defaultState(),

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.state = {
          bestiario: parsed.bestiario ?? seedMonsters(),
          combate: parsed.combate ?? { round: 1, currentIndex: 0, combatants: [] }
        };
      } else {
        this.state = defaultState();
        this.save();
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      this.state = defaultState();
    }
    return this.state;
  },

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Erro ao salvar no localStorage:', err);
    }
  },

  exportBackup() {
    const dataStr = JSON.stringify(this.state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    
    link.href = url;
    link.download = `grimorio-backup-${stamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  async importBackup(file) {
    const content = await file.text();
    const parsed = JSON.parse(content);

    // Integração automática com 5etools (identifica pela chave "monster")
    if (Array.isArray(parsed.monster)) {
      const convertedMonsters = parsed.monster.map(convert5eMonster);
      const existingNames = new Set(this.state.bestiario.map((m) => m.name.toLowerCase()));
      let added = 0;

      convertedMonsters.forEach((m) => {
        if (!existingNames.has(m.name.toLowerCase())) {
          this.state.bestiario.push(m);
          added++;
        }
      });

      this.save();
      return { type: '5etools', count: added };
    }

    // Importação padrão do backup nativo do Grimório
    if (parsed.bestiario && Array.isArray(parsed.bestiario)) {
      const currentIds = new Set(this.state.bestiario.map((m) => m.id));
      parsed.bestiario.forEach((m) => {
        if (currentIds.has(m.id)) {
          m.id = uid('m');
        }
        this.state.bestiario.push(m);
      });
    }

    if (parsed.combate && confirm('Deseja substituir a mesa de combate atual pelos dados do arquivo?')) {
      this.state.combate = parsed.combate;
    }

    this.save();
    return { type: 'backup' };
  }
};