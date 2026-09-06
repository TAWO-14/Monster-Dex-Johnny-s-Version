import { Storage } from './storage.js';
import { uid, escapeHtml } from './utils.js';
import { toast } from './toast.js';
import { openMonsterModal } from './bestiary.js'

export const CONDITIONS_MAP = {
  'Cego': '👁️',
  'Amedrontado': '😱',
  'Agarrado': '✊',
  'Incapacitado': '🚫',
  'Invisível': '👻',
  'Paralisado': '⚡',
  'Petrificado': '🗿',
  'Envenenado': '🤢',
  'Caído': '🛌',
  'Restringido': '⛓️',
  'Atordoado': '💫',
  'Inconsciente': '💤',
  'Surdo': '🔇',
  'Enfeitiçado': '💖'
};

export const CONDITIONS = Object.keys(CONDITIONS_MAP);

let openConditionPanelFor = null;
let editingCombatantId = null;

export function newCombatant(name, init, ac, hpMax, isPC, sourceMonsterId) {
  return {
    id: uid('c'),
    name: name,
    initiative: Number(init) || 0,
    ac: Number(ac) || 10,
    hpMax: Number(hpMax) || 10,
    hpCurrent: Number(hpMax) || 10,
    tempHp: 0,
    isPC: !!isPC,
    conditions: [],
    exhaustion: 0,
    concentration: false,
    lastConcDC: 0,
    deathSuccess: 0,
    deathFail: 0,
    stable: false,
    sourceMonsterId: sourceMonsterId || null
  };
}

export function getSortedCombatants() {
  return [...Storage.state.combate.combatants].sort((a, b) => b.initiative - a.initiative);
}

export function findCombatant(id) {
  return Storage.state.combate.combatants.find((c) => c.id === id) || null;
}

function hpBarClass(pct) {
  if (pct <= 25) return 'hp-fill-low';
  if (pct <= 50) return 'hp-fill-mid';
  return 'hp-fill-heal';
}

function takeDamage(c, amt) {
  let dmg = Math.abs(amt);
  if (c.tempHp > 0) {
    const absorbed = Math.min(c.tempHp, dmg);
    c.tempHp -= absorbed;
    dmg -= absorbed;
  }
  c.hpCurrent = Math.max(0, c.hpCurrent - dmg);
  if (c.concentration && dmg > 0) {
    c.lastConcDC = Math.max(10, Math.floor(dmg / 2));
  }
}

function applyHealDirect(c, amt) {
  const heal = Math.abs(amt);
  c.hpCurrent = Math.min(c.hpMax, c.hpCurrent + heal);
  if (c.hpCurrent > 0) {
    c.stable = false;
    c.deathSuccess = 0;
    c.deathFail = 0;
  }
}

export function applyHpMath(id, rawVal, forceMode = null) {
  const c = findCombatant(id);
  if (!c || rawVal === undefined || rawVal === null) return;

  const str = String(rawVal).trim();
  if (!str) return;

  if (forceMode === 'heal') {
    const val = parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
    if (val > 0) applyHealDirect(c, val);
  } else if (forceMode === 'dmg') {
    const val = parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
    if (val > 0) takeDamage(c, val);
  } else {
    if (str.startsWith('+')) {
      const val = parseInt(str.slice(1), 10) || 0;
      if (val > 0) applyHealDirect(c, val);
    } else if (str.startsWith('-')) {
      const val = parseInt(str.slice(1), 10) || 0;
      if (val > 0) takeDamage(c, val);
    } else {
      const val = parseInt(str, 10) || 0;
      if (val > 0) takeDamage(c, val);
    }
  }

  Storage.save();
  renderCombate();
}

function renderCombatRow(c, isActive) {
  // O totalMax expande a barra se a soma da vida + tempHp passar da vida máxima
  const totalMax = Math.max(c.hpMax, c.hpCurrent + (c.tempHp || 0));

  // A barra de Temp HP é o fundo, cobrindo o total. A barra Real fica por cima.
  const pctTemp = totalMax > 0 ? Math.max(0, Math.min(100, ((c.hpCurrent + (c.tempHp || 0)) / totalMax) * 100)) : 0;
  const pctReal = totalMax > 0 ? Math.max(0, Math.min(100, (c.hpCurrent / totalMax) * 100)) : 0;

  const barClass = hpBarClass(c.hpMax > 0 ? (c.hpCurrent / c.hpMax) * 100 : 0);

  const showDeathSaves = c.isPC && c.hpCurrent <= 0 && !c.stable;
  const isDeadRow = (!c.isPC && c.hpCurrent <= 0) || (c.isPC && c.deathFail >= 3);

  const conditionsHtml = (c.conditions || []).map((cond) => {
    const emoji = CONDITIONS_MAP[cond] || '⚠️';
    return `
      <span class="condition-chip">
        <span>${emoji}</span> ${escapeHtml(cond)}
        <span class="x" data-action="toggle-condition" data-id="${c.id}" data-cond="${escapeHtml(cond)}">✕</span>
      </span>
    `;
  }).join('');

  const exhaustionHtml = `
    <span class="exhaustion-ctrl">Exaustão
      <button data-action="exhaustion-down" data-id="${c.id}">−</button>
      <span>${c.exhaustion || 0}</span>
      <button data-action="exhaustion-up" data-id="${c.id}">+</button>
    </span>`;

  const concNote = (c.concentration && c.lastConcDC)
    ? `<span class="conc-note">CD concentração: ${c.lastConcDC}</span>`
    : '';

  let panelHtml = '';
  if (openConditionPanelFor === c.id) {
    panelHtml = `
      <div class="condition-panel">
        ${Object.entries(CONDITIONS_MAP).map(([cond, emoji]) => {
      const on = (c.conditions || []).includes(cond);
      return `
            <button 
              type="button"
              class="condition-btn ${on ? 'on' : ''}" 
              data-action="toggle-condition" 
              data-id="${c.id}" 
              data-cond="${escapeHtml(cond)}"
              title="${escapeHtml(cond)}">
              <span class="cond-emoji">${emoji}</span>
              <span class="cond-label">${escapeHtml(cond)}</span>
            </button>
          `;
    }).join('')}
      </div>
    `;
  }

  let body;
  if (showDeathSaves) {
    body = `
      <div class="deathsave-row">
        <span>Inconsciente — testes:</span>
        <span class="ds-group">
          ${[0, 1, 2].map((i) => `<span class="ds-dot success ${(c.deathSuccess || 0) > i ? 'filled' : ''}" data-action="ds-success" data-id="${c.id}" data-idx="${i}"></span>`).join('')}
        </span>
        <span class="ds-group">
          ${[0, 1, 2].map((i) => `<span class="ds-dot fail ${(c.deathFail || 0) > i ? 'filled' : ''}" data-action="ds-fail" data-id="${c.id}" data-idx="${i}"></span>`).join('')}
        </span>
        <button class="btn btn-sm" data-action="stabilize" data-id="${c.id}">Estabilizar</button>
      </div>`;
  } else {
    body = `
      <div class="hp-row">
        <div class="hp-bar-wrap" title="PV: ${c.hpCurrent}/${c.hpMax} | Temp: ${c.tempHp || 0}">
          <div class="hp-bar-temp" style="width:${pctTemp}%"></div>
          <div class="hp-bar-fill ${barClass}" style="width:${pctReal}%"></div>
        </div>

        <span class="hp-text">${c.hpCurrent}/${c.hpMax}</span>

        <!-- Stat Bubble Circular de HP Temporário -->
        <div class="temp-bubble ${c.tempHp > 0 ? 'active' : ''}" title="PV Temporário (Clique para editar)">
          <input 
            type="number" 
            class="temp-bubble-input" 
            data-action="set-temp-hp" 
            data-id="${c.id}" 
            value="${c.tempHp > 0 ? c.tempHp : ''}" 
            placeholder="🛡️"
            min="0">
        </div>
        
        <div class="hp-bubble-control">
          <button class="bubble-btn btn-sub" data-action="quick-dmg" data-id="${c.id}" title="Aplicar Dano">−</button>
          <input 
            type="text" 
            class="hp-math-input" 
            id="amt-${c.id}" 
            placeholder="± dano/cura" 
            data-action="math-hp" 
            data-id="${c.id}"
            autocomplete="off">
          <button class="bubble-btn btn-add" data-action="quick-heal" data-id="${c.id}" title="Aplicar Cura">+</button>
        </div>
      </div>`;
  }

  const nameHtml = c.sourceMonsterId
    ? `<span class="cr-name monster-link" data-action="view-statblock" data-monster-id="${c.sourceMonsterId}" title="Ver ficha do monstro">${escapeHtml(c.name)} 📖</span>`
    : `<span class="cr-name">${escapeHtml(c.name)}</span>`;

  return `
    <div class="combat-row ${isActive ? 'active-turn' : ''} ${isDeadRow ? 'is-dead' : ''}" data-id="${c.id}">
      <input type="number" class="cr-init" value="${c.initiative}" data-action="set-init" data-id="${c.id}">
      <div class="cr-main">
        <div class="cr-name-row">
          ${nameHtml}
          <span class="cr-tag ${c.isPC ? 'tag-pc' : 'tag-npc'}" data-action="toggle-ispc" data-id="${c.id}" title="Clique para alternar entre PJ e Monstro">
            ${c.isPC ? '🛡️ Jogador' : '💀 Monstro'}
          </span>
          <span class="cr-ac">CA ${c.ac}</span>
          ${c.concentration ? '<span class="cr-tag" style="border-color:var(--info);color:var(--info)">Concentração</span>' : ''}
        </div>
        ${body}
        <div class="conditions-row">
          ${conditionsHtml} ${exhaustionHtml} ${concNote}
          <button class="btn btn-sm btn-ghost" data-action="open-conditions" data-id="${c.id}">+ condição</button>
        </div>
        ${panelHtml}
      </div>
      <div class="cr-side-actions">
        <button class="btn-icon" data-action="duplicate-combatant" data-id="${c.id}" title="Duplicar">⧉</button>
        <button class="btn-icon" data-action="edit-combatant" data-id="${c.id}" title="Ajustar">✎</button>
        <button class="btn-icon" data-action="remove-combatant" data-id="${c.id}" title="Remover">✕</button>
      </div>
    </div>`;
}

export function renderCombate() {
  const roundEl = document.getElementById('round-number');
  if (roundEl) roundEl.textContent = Storage.state.combate.round;

  const list = document.getElementById('combat-list');
  if (!list) return;

  const sorted = getSortedCombatants();
  if (sorted.length === 0) {
    list.innerHTML = '<div class="empty-state">Nenhum combatente na mesa. Adicione manualmente ou puxe um monstro do bestiário.</div>';
    return;
  }

  const idx = Storage.state.combate.currentIndex % sorted.length;
  const activeId = sorted[idx]?.id;
  list.innerHTML = sorted.map((c) => renderCombatRow(c, c.id === activeId)).join('');
}

export function nextTurn() {
  const sorted = getSortedCombatants();
  if (sorted.length === 0) return;

  Storage.state.combate.currentIndex++;
  if (Storage.state.combate.currentIndex >= sorted.length) {
    Storage.state.combate.currentIndex = 0;
    Storage.state.combate.round++;
  }

  Storage.save();
  renderCombate();
}

export function prevTurn() {
  const sorted = getSortedCombatants();
  if (sorted.length === 0) return;

  Storage.state.combate.currentIndex--;
  if (Storage.state.combate.currentIndex < 0) {
    Storage.state.combate.currentIndex = sorted.length - 1;
    if (Storage.state.combate.round > 1) Storage.state.combate.round--;
  }

  Storage.save();
  renderCombate();
}

export function clearCombat() {
  if (!confirm('Limpar todos os combatentes da mesa?')) return;
  Storage.state.combate = { round: 1, currentIndex: 0, combatants: [] };
  Storage.save();
  renderCombate();
}

export function addCombatantManual() {
  const name = document.getElementById('add-name')?.value.trim() || 'Combatente';
  const init = parseInt(document.getElementById('add-init')?.value, 10) || 0;
  const ac = parseInt(document.getElementById('add-ac')?.value, 10) || 10;
  const hp = parseInt(document.getElementById('add-hp')?.value, 10) || 10;
  const isPC = document.getElementById('add-ispc')?.checked ?? true;

  Storage.state.combate.combatants.push(newCombatant(name, init, ac, hp, isPC));

  const nameInput = document.getElementById('add-name');
  if (nameInput) nameInput.value = '';

  Storage.save();
  renderCombate();
  toast(`${name} adicionado ao combate.`);
}

export function openCombatantModal(id) {
  const c = findCombatant(id);
  if (!c) return;
  editingCombatantId = id;

  document.getElementById('ed-name').value = c.name;
  document.getElementById('ed-ac').value = c.ac;
  document.getElementById('ed-hpmax').value = c.hpMax;
  document.getElementById('ed-hpcur').value = c.hpCurrent;
  document.getElementById('ed-temphp').value = c.tempHp || 0;
  document.getElementById('ed-ispc').checked = !!c.isPC;
  document.getElementById('ed-conc').checked = !!c.concentration;

  document.getElementById('combatant-modal-overlay')?.classList.add('open');
}

export function closeCombatantModal() {
  document.getElementById('combatant-modal-overlay')?.classList.remove('open');
  editingCombatantId = null;
}

export function initCombatEvents() {
  const combatList = document.getElementById('combat-list');

  // Permite dar Enter para salvar qualquer input nativamente
  combatList?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const action = e.target.dataset.action;
      if (action === 'math-hp') {
        applyHpMath(e.target.dataset.id, e.target.value);
      } else if (action === 'set-temp-hp' || action === 'set-init') {
        e.target.blur(); // Perder o foco engatilha o evento 'change' abaixo
      }
    }
  });

  // Salva automaticamente Temp HP ou Iniciativa quando o campo perde o foco
  combatList?.addEventListener('change', (e) => {
    const el = e.target;
    const action = el.dataset.action;
    const c = findCombatant(el.dataset.id);

    if (c && action === 'set-init') {
      c.initiative = parseInt(el.value, 10) || 0;
      Storage.save();
      renderCombate();
    } else if (c && action === 'set-temp-hp') {
      c.tempHp = Math.max(0, parseInt(el.value, 10) || 0);
      Storage.save();
      renderCombate();
    }
  });

  // Listener principal de CLIQUES
  combatList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    // Ignora cliques que sejam nos inputs propriamente ditos
    if (btn.tagName === 'INPUT') return;

    const { action, id } = btn.dataset;
    const c = id ? findCombatant(id) : null;

    // --- AQUI ESTÁ O VIEW-STATBLOCK CORRIGIDO ---
    if (action === 'view-statblock') {
      const monsterId = btn.dataset.monsterId;
      openMonsterModal(monsterId, 'view');
      return; // Interrompe para não fazer mais nada
    } 
    // --------------------------------------------

    if (action === 'quick-dmg') {
      const input = document.getElementById(`amt-${id}`);
      applyHpMath(id, input?.value, 'dmg');
    } else if (action === 'quick-heal') {
      const input = document.getElementById(`amt-${id}`);
      applyHpMath(id, input?.value, 'heal');
    } else if (action === 'toggle-ispc' && c) {
      c.isPC = !c.isPC;
      Storage.save();
      renderCombate();
    } else if (action === 'remove-combatant') {
      Storage.state.combate.combatants = Storage.state.combate.combatants.filter((x) => x.id !== id);
      Storage.save();
      renderCombate();
    } else if (action === 'duplicate-combatant' && c) {
      const copy = structuredClone(c);
      copy.id = uid('c');
      const base = c.name.replace(/\s*\(\d+\)$/, '');
      const count = Storage.state.combate.combatants.filter((x) => x.name === base || x.name.startsWith(`${base} (`)).length;
      copy.name = `${base} (${count + 1})`;
      Storage.state.combate.combatants.push(copy);
      Storage.save();
      renderCombate();
    } else if (action === 'edit-combatant') {
      openCombatantModal(id);
    } else if (action === 'open-conditions') {
      openConditionPanelFor = openConditionPanelFor === id ? null : id;
      renderCombate();
    } else if (action === 'toggle-condition' && c) {
      const cond = btn.dataset.cond;
      c.conditions = c.conditions || [];
      const pos = c.conditions.indexOf(cond);
      if (pos === -1) c.conditions.push(cond);
      else c.conditions.splice(pos, 1);
      Storage.save();
      renderCombate();
    } else if (action === 'exhaustion-up' && c) {
      c.exhaustion = Math.min(6, (c.exhaustion || 0) + 1);
      Storage.save();
      renderCombate();
    } else if (action === 'exhaustion-down' && c) {
      c.exhaustion = Math.max(0, (c.exhaustion || 0) - 1);
      Storage.save();
      renderCombate();
    } else if (action === 'ds-success' && c) {
      const idx = parseInt(btn.dataset.idx, 10);
      c.deathSuccess = idx + 1;
      if (c.deathSuccess >= 3) {
        c.stable = true;
        toast(`${c.name} estabilizou.`);
      }
      Storage.save();
      renderCombate();
    } else if (action === 'ds-fail' && c) {
      const idx = parseInt(btn.dataset.idx, 10);
      c.deathFail = idx + 1;
      if (c.deathFail >= 3) toast(`${c.name} morreu.`);
      Storage.save();
      renderCombate();
    } else if (action === 'stabilize' && c) {
      c.stable = true;
      Storage.save();
      renderCombate();
    }
  });

  document.getElementById('btn-next-turn')?.addEventListener('click', nextTurn);
  document.getElementById('btn-prev-turn')?.addEventListener('click', prevTurn);
  document.getElementById('btn-clear-combat')?.addEventListener('click', clearCombat);
  document.getElementById('btn-toggle-add')?.addEventListener('click', () => {
    document.getElementById('add-panel')?.classList.toggle('hidden');
  });
  document.getElementById('btn-confirm-add')?.addEventListener('click', addCombatantManual);

  // Modal Combatente
  document.getElementById('btn-save-combatant')?.addEventListener('click', () => {
    const c = findCombatant(editingCombatantId);
    if (!c) return;

    c.name = document.getElementById('ed-name')?.value.trim() || c.name;
    c.ac = parseInt(document.getElementById('ed-ac')?.value, 10) || 0;
    c.hpMax = parseInt(document.getElementById('ed-hpmax')?.value, 10) || 0;
    c.hpCurrent = Math.max(0, Math.min(c.hpMax, parseInt(document.getElementById('ed-hpcur')?.value, 10) || 0));
    c.tempHp = parseInt(document.getElementById('ed-temphp')?.value, 10) || 0;
    c.isPC = document.getElementById('ed-ispc')?.checked ?? false;
    c.concentration = document.getElementById('ed-conc')?.checked ?? false;

    if (c.hpCurrent > 0) {
      c.stable = false;
      c.deathSuccess = 0;
      c.deathFail = 0;
    }

    Storage.save();
    closeCombatantModal();
    renderCombate();
  });

  document.querySelector('[data-action="close-combatant-modal"]')?.addEventListener('click', closeCombatantModal);
  document.getElementById('combatant-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'combatant-modal-overlay') closeCombatantModal();
  });
}