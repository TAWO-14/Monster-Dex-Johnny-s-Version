import { Storage } from './storage.js';
import { uid, escapeHtml, fmtMod } from './utils.js';
import { toast } from './toast.js';
import { newCombatant } from './combat.js';
import { renderApp } from './main.js';

let editingMonsterId = null;
let draftMonster = null;
let monsterModalMode = 'view'; // 'view' | 'edit'

export function renderBestiario() {
  const searchInput = document.getElementById('search-input');
  const q = (searchInput?.value || '').toLowerCase().trim();
  const grid = document.getElementById('bestiary-grid');
  if (!grid) return;

  const filtered = Storage.state.bestiario.filter((m) => {
    return m.name.toLowerCase().includes(q) || (m.type || '').toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    grid.innerHTML = '<div class="empty-state">Nenhum monstro encontrado. Crie um novo ou importe um backup.</div>';
    return;
  }

  grid.innerHTML = filtered.map(renderMonsterCard).join('');
}

export function renderMonsterCard(m) {
  return `
    <div class="monster-card">
      <div class="mc-name">${escapeHtml(m.name)}</div>
      <div class="mc-meta">${escapeHtml(m.size || '')} ${escapeHtml(m.type || '')} · CR ${escapeHtml(m.cr || '—')}</div>
      <div class="mc-stats-row">
        <span>CA ${m.ac ?? '—'}</span>
        <span>PV ${m.hpAvg ?? '—'}</span>
        <span>Desl. ${escapeHtml(m.speed || '—')}</span>
      </div>
      <div class="mc-actions">
        <button class="btn btn-sm" data-action="view-monster" data-id="${m.id}">Ver</button>
        <button class="btn btn-sm btn-primary" data-action="add-to-combat" data-id="${m.id}">+ Combate</button>
      </div>
    </div>
  `;
}

export function addCombatantFromMonster(monsterId) {
  const m = Storage.state.bestiario.find((x) => x.id === monsterId);
  if (!m) return;

  const dexMod = Math.floor(((Number(m.dex) || 10) - 10) / 2);
  const roll = Math.floor(Math.random() * 20) + 1 + dexMod;
  const baseName = m.name;

  const count = Storage.state.combate.combatants.filter((c) => {
    return c.name === baseName || c.name.startsWith(baseName + ' (');
  }).length;

  const name = count > 0 ? `${baseName} (${count + 1})` : baseName;
  const combatant = newCombatant(name, roll, m.ac, m.hpAvg, false, m.id);

  Storage.state.combate.combatants.push(combatant);
  Storage.save();
  renderApp();
  toast(`${name} entrou no combate (iniciativa ${roll}).`);
}

function emptyMonster() {
  return {
    id: null, name: '', size: 'Médio', type: '', alignment: '',
    ac: 10, acNote: '', hpAvg: 10, hpDice: '', speed: '9 m',
    str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10,
    saves: '', skills: '', resistances: '', immunities: '', vulnerabilities: '', conditionImmunities: '',
    senses: '', languages: '', cr: '',
    traits: [], actions: [], bonusActions: [], reactions: [], legendaryActions: [], legendaryNote: '', notes: ''
  };
}

export function openMonsterModal(id, mode) {
  editingMonsterId = id;
  if (id) {
    const found = Storage.state.bestiario.find((m) => m.id === id);
    draftMonster = structuredClone(found);
  } else {
    draftMonster = emptyMonster();
  }
  monsterModalMode = mode;
  renderMonsterModal();
  document.getElementById('monster-modal-overlay')?.classList.add('open');
}

export function closeMonsterModal() {
  document.getElementById('monster-modal-overlay')?.classList.remove('open');
  editingMonsterId = null;
  draftMonster = null;
}

function renderMonsterModal() {
  const box = document.getElementById('monster-modal-box');
  if (!box) return;
  box.innerHTML = (monsterModalMode === 'view') ? monsterViewHtml(draftMonster) : monsterFormHtml(draftMonster);
  attachMonsterModalEvents();
}

function monsterViewHtml(m) {
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const labels = { str: 'FOR', dex: 'DES', con: 'CON', int: 'INT', wis: 'SAB', cha: 'CAR' };

  const abilitiesHtml = `
    <div class="sv-abilities">
      ${abilities.map((a) => `
        <div class="sv-ability">
          <b>${m[a]} (${fmtMod(m[a])})</b>
          <span>${labels[a]}</span>
        </div>
      `).join('')}
    </div>
  `;

  const line = (label, val) => val ? `<div class="sv-line"><b>${label}.</b> ${escapeHtml(val)}</div>` : '';

  const entries = (title, list) => {
    if (!list || list.length === 0) return '';
    const header = title ? `<div class="sv-block-title">${title}</div>` : '';
    const body = list.map((it) => `
      <div class="sv-entry">
        <b>${escapeHtml(it.name)}.</b> ${escapeHtml(it.text)}
      </div>
    `).join('');
    return header + body;
  };

  const legendaryIntro = (m.legendaryActions && m.legendaryActions.length > 0)
    ? `<div class="sv-entry">${m.legendaryNote ? escapeHtml(m.legendaryNote) : 'Pode realizar 3 ações lendárias, escolhendo entre as opções abaixo. Apenas uma pode ser usada por vez, no final do turno de outra criatura.'}</div>`
    : '';

  return `
    <div class="modal-header">
      <h2 class="modal-title">${escapeHtml(m.name || 'Monstro')}</h2>
      <button class="btn-icon" data-action="close-monster-modal" aria-label="Fechar">✕</button>
    </div>
    <div class="stat-view">
      <div class="sv-meta">${escapeHtml(m.size || '')} ${escapeHtml(m.type || '')}${m.alignment ? (', ' + escapeHtml(m.alignment)) : ''}</div>
      ${line('Classe de Armadura', m.ac + (m.acNote ? ' (' + m.acNote + ')' : ''))}
      ${line('Pontos de Vida', m.hpAvg + (m.hpDice ? ' (' + m.hpDice + ')' : ''))}
      ${line('Deslocamento', m.speed)}
      
      <hr>
      ${abilitiesHtml}
      <hr>

      ${line('Resistência de testes', m.saves)}
      ${line('Perícias', m.skills)}
      ${line('Resistências a dano', m.resistances)}
      ${line('Imunidades a dano', m.immunities)}
      ${line('Vulnerabilidades a dano', m.vulnerabilities)}
      ${line('Imunidades a condição', m.conditionImmunities)}
      ${line('Sentidos', m.senses)}
      ${line('Idiomas', m.languages)}
      ${line('Nível de Desafio', m.cr)}

      ${entries('Traços', m.traits)}
      ${entries('Ações', m.actions)}
      ${entries('Ações Bônus', m.bonusActions)}
      ${entries('Reações', m.reactions)}
      ${(m.legendaryActions && m.legendaryActions.length > 0) ? `<div class="sv-block-title">Ações Lendárias</div>${legendaryIntro}` : ''}
      ${entries('', m.legendaryActions)}
      ${m.notes ? `<div class="sv-notes">${escapeHtml(m.notes)}</div>` : ''}
    </div>
    <div class="modal-actions">
      <button class="btn push-left" data-action="delete-monster">Excluir</button>
      <button class="btn" data-action="duplicate-monster">Duplicar</button>
      <button class="btn btn-primary" data-action="edit-monster">Editar</button>
    </div>
  `;
}

function monsterFormHtml(m) {
  const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const labels = { str: 'Força', dex: 'Destreza', con: 'Constituição', int: 'Inteligência', wis: 'Sabedoria', cha: 'Carisma' };
  
  const abilitiesHtml = abilities.map((a) => `
    <div class="field ability-box">
      <label>${labels[a]}</label>
      <input type="number" data-field="${a}" value="${m[a]}">
      <div class="ability-mod">${fmtMod(m[a])}</div>
    </div>
  `).join('');

  return `
    <div class="modal-header">
      <h2 class="modal-title">${editingMonsterId ? 'Editar monstro' : 'Novo monstro'}</h2>
      <button class="btn-icon" data-action="close-monster-modal">✕</button>
    </div>
    <div class="form-section">
      <div class="form-section-title">Identificação</div>
      <div class="form-grid">
        <div class="field field-wide"><label>Nome</label><input type="text" data-field="name" value="${escapeHtml(m.name)}"></div>
        <div class="field"><label>Tamanho</label>
          <select data-field="size">
            ${['Miúdo', 'Pequeno', 'Médio', 'Grande', 'Enorme', 'Descomunal'].map((s) => `<option ${m.size === s ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="field"><label>Tipo</label><input type="text" data-field="type" value="${escapeHtml(m.type)}" placeholder="ex: humanoide"></div>
        <div class="field"><label>Alinhamento</label><input type="text" data-field="alignment" value="${escapeHtml(m.alignment)}"></div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Combate</div>
      <div class="form-grid">
        <div class="field"><label>CA</label><input type="number" data-field="ac" value="${m.ac}"></div>
        <div class="field"><label>PV médio</label><input type="number" data-field="hpAvg" value="${m.hpAvg}"></div>
        <div class="field"><label>Deslocamento</label><input type="text" data-field="speed" value="${escapeHtml(m.speed)}"></div>
        <div class="field"><label>CR</label><input type="text" data-field="cr" value="${escapeHtml(m.cr)}"></div>
      </div>
    </div>
    <div class="form-section">
      <div class="form-section-title">Atributos</div>
      <div class="form-grid cols-6">${abilitiesHtml}</div>
    </div>
    <div class="modal-actions">
      <button class="btn" data-action="cancel-monster-edit">Cancelar</button>
      <button class="btn btn-primary" data-action="save-monster">Salvar monstro</button>
    </div>
  `;
}

function attachMonsterModalEvents() {
  const box = document.getElementById('monster-modal-box');
  if (!box) return;

  box.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach((el) => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => {
      const field = el.dataset.field;
      let val = el.value;
      if (el.type === 'number') val = parseInt(val, 10) || 0;
      draftMonster[field] = val;
      if (['str', 'dex', 'con', 'int', 'wis', 'cha'].includes(field)) {
        const modEl = el.parentElement.querySelector('.ability-mod');
        if (modEl) modEl.textContent = fmtMod(val);
      }
    });
  });

  box.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'close-monster-modal') closeMonsterModal();
    else if (action === 'edit-monster') { monsterModalMode = 'edit'; renderMonsterModal(); }
    else if (action === 'cancel-monster-edit') {
      if (editingMonsterId) { monsterModalMode = 'view'; openMonsterModal(editingMonsterId, 'view'); }
      else closeMonsterModal();
    }
    else if (action === 'save-monster') {
      if (!draftMonster.name?.trim()) { toast('Dê um nome ao monstro antes de salvar.'); return; }
      if (editingMonsterId) {
        const idx = Storage.state.bestiario.findIndex((m) => m.id === editingMonsterId);
        draftMonster.id = editingMonsterId;
        if (idx !== -1) Storage.state.bestiario[idx] = draftMonster;
      } else {
        draftMonster.id = uid('m');
        Storage.state.bestiario.push(draftMonster);
      }
      Storage.save();
      toast('Monstro salvo.');
      closeMonsterModal();
      renderBestiario();
    }
    else if (action === 'delete-monster') {
      if (confirm(`Excluir "${draftMonster.name}" do bestiário?`)) {
        Storage.state.bestiario = Storage.state.bestiario.filter((m) => m.id !== editingMonsterId);
        Storage.save();
        closeMonsterModal();
        renderBestiario();
      }
    }
    else if (action === 'duplicate-monster') {
      const copy = structuredClone(draftMonster);
      copy.id = uid('m');
      copy.name += ' (cópia)';
      Storage.state.bestiario.push(copy);
      Storage.save();
      toast('Monstro duplicado.');
      closeMonsterModal();
      renderBestiario();
    }
  });
}

// Função exportada exigida pelo main.js
export function initBestiaryEvents() {
  document.getElementById('search-input')?.addEventListener('input', renderBestiario);
  
  document.getElementById('bestiary-grid')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;
    if (action === 'view-monster') openMonsterModal(id, 'view');
    else if (action === 'add-to-combat') addCombatantFromMonster(id);
  });

  document.getElementById('btn-new-monster')?.addEventListener('click', () => {
    openMonsterModal(null, 'edit');
  });

  document.getElementById('monster-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'monster-modal-overlay') closeMonsterModal();
  });
}

