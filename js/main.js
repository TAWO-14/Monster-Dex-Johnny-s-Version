import { Storage } from './storage.js';
import { toast } from './toast.js';
import { renderCombate, initCombatEvents } from './combat.js';
import { renderBestiario, initBestiaryEvents } from './bestiary.js';

let currentTab = 'combate';

export function switchTab(tab) {
  currentTab = tab;
  
  const btnCombate = document.getElementById('tab-btn-combate');
  const btnBestiario = document.getElementById('tab-btn-bestiario');
  const secCombate = document.getElementById('tab-combate');
  const secBestiario = document.getElementById('tab-bestiario');

  if (btnCombate) btnCombate.classList.toggle('active', tab === 'combate');
  if (btnBestiario) btnBestiario.classList.toggle('active', tab === 'bestiario');
  if (secCombate) secCombate.classList.toggle('hidden', tab !== 'combate');
  if (secBestiario) secBestiario.classList.toggle('hidden', tab !== 'bestiario');

  renderApp();
}

export function renderApp() {
  if (currentTab === 'combate') {
    renderCombate();
  } else {
    renderBestiario();
  }
}

// Inicialização
function initApp() {
  Storage.load();

  document.getElementById('tab-btn-combate')?.addEventListener('click', () => switchTab('combate'));
  document.getElementById('tab-btn-bestiario')?.addEventListener('click', () => switchTab('bestiario'));
  document.getElementById('btn-export')?.addEventListener('click', () => Storage.exportBackup());
  
  const fileInput = document.getElementById('file-import');
  document.getElementById('btn-import')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async (e) => { /*... seu código de importação ...*/ });

  initCombatEvents();
  initBestiaryEvents();
  renderApp();
}

document.addEventListener('DOMContentLoaded', () => {
  // Use window.OBR para evitar ReferenceError caso o SDK não carregue rápido o suficiente
  if (typeof window.OBR !== 'undefined') {
    window.OBR.onReady(() => {
      console.log("Conectado ao Owlbear Rodeo!");
      initApp();
      
      // Aqui dentro você poderá colocar os 'listeners' do Owlbear futuramente
      // Exemplo: window.OBR.player.onChange(...)
    });
  } else {
    // Modo Standalone (Navegador comum)
    console.log("Modo Standalone iniciado.");
    initApp();
  }
});