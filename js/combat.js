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
  const isDeadRow = (!c.isPC && c.hpCurrent <= 0) || (c.isPC && c.deathFail >= 3);

  const nameHtml = c.sourceMonsterId
    ? `<span class="compact-name monster-link" data-action="view-statblock" data-monster-id="${c.sourceMonsterId}" title="Ver ficha">${escapeHtml(c.name)}</span>`
    : `<span class="compact-name">${escapeHtml(c.name)}</span>`;

  return `
    <div class="compact-row ${isActive ? 'active-turn' : ''} ${isDeadRow ? 'is-dead' : ''}" data-id="${c.id}">
      <!-- Iniciativa rápida à esquerda -->
      <div class="compact-init-box" title="Iniciativa">
        <input type="number" data-action="set-init" data-id="${c.id}" value="${c.initiative}">
      </div>

      <!-- Informações centrais condensadas -->
      <div class="compact-info">
        <div class="compact-title-line">
          ${nameHtml}
          <span class="cr-tag ${c.isPC ? 'tag-pc' : 'tag-npc'}" data-action="toggle-ispc" data-id="${c.id}" style="font-size: 0.68rem; padding: 1px 4px; cursor: pointer;">
            ${c.isPC ? 'PJ' : 'NPC'}
          </span>
          ${c.concentration ? '<span style="color:#64b5f6; font-size:0.68rem;">(C)</span>' : ''}
        </div>
        <div class="compact-stats-line">
          <span>HP:</span>
          <input type="number" data-action="set-hp-current" data-id="${c.id}" value="${c.hpCurrent}" style="width: 32px;">
          <span>/${c.hpMax}</span>
          <span style="margin-left: 4px;">CA: <b>${c.ac}</b></span>
          <span style="margin-left: 4px;" title="Temp HP">🛡️</span>
          <input type="number" data-action="set-temp-hp" data-id="${c.id}" value="${c.tempHp || 0}" style="width: 28px;" placeholder="0">
        </div>
      </div>

      <!-- Ações rápidas à direita (Dano/Cura + Menu) -->
      <div class="compact-actions">
        <div class="hp-quick-group">
          <input type="text" id="amt-${c.id}" placeholder="±" data-action="math-hp" data-id="${c.id}" autocomplete="off">
          <button class="btn-dmg" data-action="quick-dmg" data-id="${c.id}">-</button>
          <button class="btn-heal" data-action="quick-heal" data-id="${c.id}">+</button>
        </div>
        <div style="display: flex; gap: 4px;">
          <button class="btn-icon" data-action="open-conditions" data-id="${c.id}" title="Condições" style="font-size:0.75rem; background:none; border:none; color:#aaa; cursor:pointer;">⚠️</button>
          <button class="btn-icon" data-action="edit-combatant" data-id="${c.id}" title="Editar" style="font-size:0.75rem; background:none; border:none; color:#aaa; cursor:pointer;">✎</button>
          <button class="btn-icon" data-action="remove-combatant" data-id="${c.id}" title="Remover" style="font-size:0.75rem; background:none; border:none; color:#ff6b6b; cursor:pointer;">✕</button>
        </div>
      </div>
    </div>
  `;
}

export function renderCombate() {
  const combatList = document.getElementById('combat-list');
  if (!combatList) return;

  combatList.innerHTML = '';

  const sorted = getSortedCombatants();
  if (sorted.length === 0) {
    combatList.innerHTML = '<div style="text-align: center; color: #777; padding: 20px;">Nenhum combatente na lista.</div>';
    return;
  }

  const idx = Storage.state.combate.currentIndex % sorted.length;
  const activeId = sorted[idx]?.id;

  combatList.innerHTML = sorted.map((c) => renderCombatRow(c, c.id === activeId)).join('');
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

  // Permite dar Enter para submeter valores
  combatList?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const action = e.target.dataset.action;
      if (action === 'math-hp') {
        applyHpMath(e.target.dataset.id, e.target.value);
      } else if (action === 'set-temp-hp' || action === 'set-init' || action === 'set-hp-current') {
        e.target.blur();
      }
    }
  });

  // Salva e sincroniza dados quando o input perde o foco
  combatList?.addEventListener('change', (e) => {
    const el = e.target;
    const action = el.dataset.action;
    const c = findCombatant(el.dataset.id);
    if (!c) return;

    if (action === 'set-init') {
      c.initiative = parseInt(el.value, 10) || 0;
      Storage.save();
      syncInitiativeToOwlbear(c.name, c.initiative); // Dispara para o Owlbear
      renderCombate();
    } else if (action === 'set-temp-hp') {
      c.tempHp = Math.max(0, parseInt(el.value, 10) || 0);
      Storage.save();
      renderCombate();
    } else if (action === 'set-hp-current') {
      c.hpCurrent = Math.max(0, Math.min(c.hpMax, parseInt(el.value, 10) || 0));
      Storage.save();
      renderCombate();
    }
  });

  // Cliques gerais da lista (Dano, Cura, Tags e Remoção)
  combatList?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.tagName === 'INPUT') return;

    const { action, id } = btn.dataset;
    const c = id ? findCombatant(id) : null;

    if (action === 'view-statblock') {
      openMonsterModal(btn.dataset.monsterId, 'view');
    } else if (action === 'quick-dmg') {
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
    }
  });

  // Controles de Turno e Mesa
  document.getElementById('btn-next-turn')?.addEventListener('click', nextTurn);
  document.getElementById('btn-prev-turn')?.addEventListener('click', prevTurn);
  document.getElementById('btn-clear-combat')?.addEventListener('click', clearCombat);
  document.getElementById('btn-toggle-add')?.addEventListener('click', () => {
    document.getElementById('add-panel')?.classList.toggle('hidden');
  });
  document.getElementById('btn-confirm-add')?.addEventListener('click', addCombatantManual);

  // Modal de edição do combatente
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

    Storage.save();
    closeCombatantModal();
    renderCombate();
  });

  document.querySelector('[data-action="close-combatant-modal"]')?.addEventListener('click', closeCombatantModal);
  document.getElementById('combatant-modal-overlay')?.addEventListener('click', (e) => {
    if (e.target.id === 'combatant-modal-overlay') closeCombatantModal();
  });
}

// Função de sincronização com o Owlbear Rodeo
export async function syncInitiativeToOwlbear(combatantName, initiativeValue) {
  if (typeof window.OBR === 'undefined' || !window.OBR.isAvailable) {
    console.warn("Owlbear Rodeo SDK não está pronto ou indisponível.");
    return;
  }

  try {
    // 1. Busca todos os tokens da cena
    const items = await window.OBR.scene.items.getItems();

    // 2. Localiza o token cujo texto ou nome bate com o combatente
    const target = items.find((item) => {
      const plainText = item.text?.plainText?.trim().toLowerCase();
      const itemName = item.name?.trim().toLowerCase();
      const search = combatantName.trim().toLowerCase();
      return plainText === search || itemName === search;
    });

    if (!target) {
      console.warn(`Nenhum token encontrado na cena com o nome "${combatantName}".`);
      return;
    }

    const initNum = Number(initiativeValue) || 0;

    // 3. Atualiza os metadados do token (formato geral + formato Pretty Sordid)
    await window.OBR.scene.items.updateItems([target.id], (itemsToUpdate) => {
      for (const item of itemsToUpdate) {
        if (!item.metadata) item.metadata = {};

        // Chave genérica padrão OBR
        item.metadata["owlbear.rodeo/initiative"] = {
          value: initNum
        };

        // Chave utilizada pela extensão Pretty Sordid (se presente)
        item.metadata["com.pretty-sordid.initiative/initiative"] = {
          value: initNum
        };
      }
    });

    console.log(`[Grimório] Iniciativa de ${combatantName} atualizada para ${initNum} no mapa.`);
  } catch (err) {
    console.error("[Grimório] Erro ao sincronizar iniciativa:", err);
  }
}
