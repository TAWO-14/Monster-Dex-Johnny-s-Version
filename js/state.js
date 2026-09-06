import { uid } from './utils.js';

const STORAGE_KEY = 'grimorio_combate_v1';

export const Store = {
  state: {
    bestiario: [],
    combate: { round: 1, currentIndex: 0, combatants: [] }
  },

  load(defaultMonsters = []) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.state = JSON.parse(raw);
        this.state.bestiario ??= defaultMonsters;
        this.state.combate ??= { round: 1, currentIndex: 0, combatants: [] };
      } else {
        this.state = { bestiario: defaultMonsters, combate: { round: 1, currentIndex: 0, combatants: [] } };
        this.save();
      }
    } catch {
      this.state = { bestiario: defaultMonsters, combate: { round: 1, currentIndex: 0, combatants: [] } };
    }
    return this.state;
  },

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  },

  exportBackup() {
    const blob = new Blob([JSON.stringify(this.state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `grimorio-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importBackup(file) {
    const text = await file.text();
    const imported = JSON.parse(text);

    if (Array.isArray(imported.bestiario)) {
      const existingIds = new Set(this.state.bestiario.map(m => m.id));
      imported.bestiario.forEach(m => {
        if (existingIds.has(m.id)) m.id = uid('m');
        this.state.bestiario.push(m);
      });
    }

    if (imported.combate && confirm('Substituir o combate atual pelos dados importados?')) {
      this.state.combate = imported.combate;
    }
    this.save();
  }
};