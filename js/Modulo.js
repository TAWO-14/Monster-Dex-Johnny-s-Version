(function(){
  'use strict';

  /* ===================== estado & persistência ===================== */
  var STORAGE_KEY = 'grimorio_combate_v1';
  var CONDITIONS = ['Cego','Amedrontado','Agarrado','Incapacitado','Invisível','Paralisado','Petrificado','Envenenado','Caído','Restringido','Atordoado','Inconsciente','Surdo','Enfeitiçado'];

  var state = null;
  var currentTab = 'combate';
  var openConditionPanelFor = null;
  var editingCombatantId = null;
  var editingMonsterId = null;
  var draftMonster = null;
  var monsterModalMode = 'view'; // 'view' | 'edit'

  function uid(prefix){
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7);
  }

  function escapeHtml(str){
    if(str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function mod(score){
    var n = Number(score);
    if(isNaN(n)) n = 10;
    return Math.floor((n-10)/2);
  }
  function fmtMod(score){
    var m = mod(score);
    return (m>=0?'+':'') + m;
  }

  function seedMonsters(){
    return [
      {
        id: uid('m'), name:'Goblin', size:'Pequeno', type:'humanoide (goblinoide)', alignment:'neutro e mau',
        ac:15, acNote:'armadura de couro e escudo', hpAvg:7, hpDice:'2d6', speed:'9 m',
        str:10,dex:14,con:10,int:10,wis:8,cha:8,
        saves:'', skills:'Furtividade +6', resistances:'', immunities:'', vulnerabilities:'', conditionImmunities:'',
        senses:'visão no escuro 18 m, percepção passiva 9', languages:'goblin, comum', cr:'1/4 (50 PE)',
        traits:[{name:'Fuga Ágil', text:'Pode usar a ação Desengajar ou Esconder-se como ação bônus em cada turno.'}],
        actions:[
          {name:'Cimitarra', text:'Ataque corpo a corpo com arma: +4 para acertar, alcance 1,5 m. Acerto: 5 (1d6+2) de dano cortante.'},
          {name:'Besta curta', text:'Ataque à distância com arma: +4 para acertar, alcance 24/96 m. Acerto: 5 (1d6+2) de dano perfurante.'}
        ],
        bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
      },
      {
        id: uid('m'), name:'Orc', size:'Médio', type:'humanoide (orc)', alignment:'caótico e mau',
        ac:13, acNote:'armadura de couro cru', hpAvg:15, hpDice:'2d8+6', speed:'9 m',
        str:16,dex:12,con:16,int:7,wis:11,cha:10,
        saves:'', skills:'Intimidação +2', resistances:'', immunities:'', vulnerabilities:'', conditionImmunities:'',
        senses:'visão no escuro 18 m, percepção passiva 10', languages:'comum, orc', cr:'1/2 (100 PE)',
        traits:[{name:'Fúria Agressiva', text:'Como ação bônus, pode se mover até seu deslocamento em direção a um inimigo que possa ver.'}],
        actions:[
          {name:'Machado grande', text:'Ataque corpo a corpo com arma: +5 para acertar, alcance 1,5 m. Acerto: 9 (1d12+3) de dano cortante.'},
          {name:'Azagaia', text:'Ataque corpo a corpo ou à distância: +5 para acertar, alcance 1,5 m ou 9/36 m. Acerto: 6 (1d6+3) de dano perfurante.'}
        ],
        bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
      },
      {
        id: uid('m'), name:'Esqueleto', size:'Médio', type:'morto-vivo', alignment:'leal e mau',
        ac:13, acNote:'armadura de couro', hpAvg:13, hpDice:'2d8+4', speed:'9 m',
        str:10,dex:14,con:15,int:6,wis:8,cha:5,
        saves:'', skills:'', resistances:'', immunities:'veneno', vulnerabilities:'contundente', conditionImmunities:'envenenado, exausto',
        senses:'visão no escuro 18 m, percepção passiva 9', languages:'entende os idiomas que tinha em vida, mas não fala', cr:'1/4 (50 PE)',
        traits:[],
        actions:[
          {name:'Espada curta', text:'Ataque corpo a corpo com arma: +4 para acertar, alcance 1,5 m. Acerto: 5 (1d6+2) de dano perfurante.'},
          {name:'Arco curto', text:'Ataque à distância com arma: +4 para acertar, alcance 24/96 m. Acerto: 5 (1d6+2) de dano perfurante.'}
        ],
        bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
      },
      {
        id: uid('m'), name:'Lobo', size:'Médio', type:'fera', alignment:'sem alinhamento',
        ac:13, acNote:'couro natural', hpAvg:11, hpDice:'2d8+2', speed:'12 m',
        str:12,dex:15,con:12,int:3,wis:12,cha:6,
        saves:'', skills:'Percepção +3, Furtividade +4', resistances:'', immunities:'', vulnerabilities:'', conditionImmunities:'',
        senses:'percepção passiva 13', languages:'—', cr:'1/4 (50 PE)',
        traits:[
          {name:'Faro Aguçado', text:'Tem vantagem em testes de Sabedoria (Percepção) que dependam de olfato.'},
          {name:'Táticas de Matilha', text:'Tem vantagem em ataques contra uma criatura se pelo menos um aliado estiver a 1,5 m dela e não incapacitado.'}
        ],
        actions:[
          {name:'Mordida', text:'Ataque corpo a corpo com arma: +4 para acertar, alcance 1,5 m. Acerto: 7 (2d4+2) perfurante. Alvo faz resistência de Força CD 11 ou é derrubado.'}
        ],
        bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
      },
      {
        id: uid('m'), name:'Zumbi', size:'Médio', type:'morto-vivo', alignment:'neutro e mau',
        ac:8, acNote:'', hpAvg:22, hpDice:'3d8+9', speed:'6 m',
        str:13,dex:6,con:16,int:3,wis:6,cha:5,
        saves:'Sabedoria +0', skills:'', resistances:'', immunities:'veneno', vulnerabilities:'', conditionImmunities:'envenenado',
        senses:'visão no escuro 18 m, percepção passiva 8', languages:'entende os idiomas que tinha em vida, mas não fala', cr:'1/4 (50 PE)',
        traits:[{name:'Fortitude de Morto-Vivo', text:'Se sofrer dano que reduza a 0 PV, faz resistência de Constituição (CD 5 + dano sofrido); se passar, fica com 1 PV. Não funciona contra dano radiante ou crítico.'}],
        actions:[{name:'Pancada', text:'Ataque corpo a corpo com arma: +3 para acertar, alcance 1,5 m. Acerto: 4 (1d6+1) de dano contundente.'}],
        bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
      },
      {
        id: uid('m'), name:'Ogro', size:'Grande', type:'gigante', alignment:'caótico e mau',
        ac:11, acNote:'armadura de peles', hpAvg:59, hpDice:'7d10+21', speed:'12 m',
        str:19,dex:8,con:16,int:5,wis:7,cha:7,
        saves:'', skills:'', resistances:'', immunities:'', vulnerabilities:'', conditionImmunities:'',
        senses:'visão no escuro 18 m, percepção passiva 8', languages:'gigante, comum', cr:'2 (450 PE)',
        traits:[],
        actions:[
          {name:'Porrete grande', text:'Ataque corpo a corpo com arma: +6 para acertar, alcance 3 m. Acerto: 13 (2d8+4) de dano contundente.'},
          {name:'Azagaia', text:'Ataque corpo a corpo ou à distância: +6 para acertar, alcance 3 m ou 18/36 m. Acerto: 11 (2d6+4) de dano perfurante.'}
        ],
        bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
      }
    ];
  }

  function defaultState(){
    return { bestiario: seedMonsters(), combate:{ round:1, currentIndex:0, combatants:[] } };
  }

  function loadState(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      if(raw){
        state = JSON.parse(raw);
        if(!state.bestiario) state.bestiario = seedMonsters();
        if(!state.combate) state.combate = { round:1, currentIndex:0, combatants:[] };
      } else {
        state = defaultState();
        saveState();
      }
    } catch(e){
      console.error('Erro ao carregar dados salvos:', e);
      state = defaultState();
    }
  }

  function saveState(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch(e){
      console.error('Erro ao salvar dados:', e);
      toast('Não foi possível salvar automaticamente — exporte um backup.');
    }
  }

  function toast(msg){
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ el.classList.remove('show'); }, 2200);
  }

  /* ===================== abas ===================== */
  function switchTab(tab){
    currentTab = tab;
    document.getElementById('tab-btn-combate').classList.toggle('active', tab==='combate');
    document.getElementById('tab-btn-bestiario').classList.toggle('active', tab==='bestiario');
    document.getElementById('tab-combate').classList.toggle('hidden', tab!=='combate');
    document.getElementById('tab-bestiario').classList.toggle('hidden', tab!=='bestiario');
    render();
  }

  function render(){
    if(currentTab==='combate') renderCombate(); else renderBestiario();
  }

  /* ===================== combate ===================== */
  function getSortedCombatants(){
    return state.combate.combatants.slice().sort(function(a,b){ return b.initiative - a.initiative; });
  }
  function findCombatant(id){
    for(var i=0;i<state.combate.combatants.length;i++){ if(state.combate.combatants[i].id===id) return state.combate.combatants[i]; }
    return null;
  }

  function renderCombate(){
    document.getElementById('round-number').textContent = state.combate.round;
    var list = document.getElementById('combat-list');
    var sorted = getSortedCombatants();
    if(sorted.length===0){
      list.innerHTML = '<div class="empty-state">Nenhum combatente na mesa. Adicione manualmente ou puxe um monstro do bestiário.</div>';
      return;
    }
    var idx = state.combate.currentIndex % sorted.length;
    var activeId = sorted[idx].id;
    list.innerHTML = sorted.map(function(c){ return renderCombatRow(c, c.id===activeId); }).join('');
  }

  function hpBarClass(pct){
    if(pct <= 25) return 'hp-fill-low';
    if(pct <= 50) return 'hp-fill-mid';
    return 'hp-fill-heal';
  }

  function renderCombatRow(c, isActive){
    var pct = c.hpMax>0 ? Math.max(0, Math.min(100, (c.hpCurrent/c.hpMax)*100)) : 0;
    var barClass = hpBarClass(pct);
    var showDeathSaves = c.isPC && c.hpCurrent<=0 && !c.stable;
    var isDeadRow = (!c.isPC && c.hpCurrent<=0) || (c.isPC && c.deathFail>=3);

    var conditionsHtml = (c.conditions||[]).map(function(cond){
      return '<span class="condition-chip">'+escapeHtml(cond)+
        '<span class="x" data-action="toggle-condition" data-id="'+c.id+'" data-cond="'+escapeHtml(cond)+'">✕</span></span>';
    }).join('');

    var exhaustionHtml = '<span class="exhaustion-ctrl">Exaustão '+
      '<button data-action="exhaustion-down" data-id="'+c.id+'">−</button>'+
      '<span>'+(c.exhaustion||0)+'</span>'+
      '<button data-action="exhaustion-up" data-id="'+c.id+'">+</button></span>';

    var concNote = (c.concentration && c.lastConcDC) ? '<span class="conc-note">CD sugerida para manter concentração: '+c.lastConcDC+'</span>' : '';

    var panelHtml = '';
    if(openConditionPanelFor === c.id){
      panelHtml = '<div class="condition-panel">' + CONDITIONS.map(function(cond){
        var on = (c.conditions||[]).indexOf(cond) !== -1;
        return '<button class="'+(on?'on':'')+'" data-action="toggle-condition" data-id="'+c.id+'" data-cond="'+escapeHtml(cond)+'">'+escapeHtml(cond)+'</button>';
      }).join('') + '</div>';
    }

    var body;
    if(showDeathSaves){
      body =
        '<div class="deathsave-row">'+
          '<span>Inconsciente — testes de morte:</span>'+
          '<span class="ds-group">'+ [0,1,2].map(function(i){
            return '<span class="ds-dot success '+((c.deathSuccess||0)>i?'filled':'')+'" data-action="ds-success" data-id="'+c.id+'" data-idx="'+i+'"></span>';
          }).join('') +'</span>'+
          '<span class="ds-group">'+ [0,1,2].map(function(i){
            return '<span class="ds-dot fail '+((c.deathFail||0)>i?'filled':'')+'" data-action="ds-fail" data-id="'+c.id+'" data-idx="'+i+'"></span>';
          }).join('') +'</span>'+
          '<button class="btn btn-sm" data-action="stabilize" data-id="'+c.id+'">Estabilizar</button>'+
        '</div>';
    } else {
      body =
        '<div class="hp-row">'+
          '<div class="hp-bar-wrap"><div class="hp-bar-fill '+barClass+'" style="width:'+pct+'%"></div></div>'+
          '<span class="hp-text">'+c.hpCurrent+'/'+c.hpMax + ((c.tempHp>0)?(' +'+c.tempHp+' temp'):'') +'</span>'+
          '<input type="number" class="hp-amount" id="amt-'+c.id+'" placeholder="qtd" min="0">'+
          '<button class="btn btn-sm btn-dmg" data-action="apply-dmg" data-id="'+c.id+'">Dano</button>'+
          '<button class="btn btn-sm btn-heal" data-action="apply-heal" data-id="'+c.id+'">Cura</button>'+
        '</div>';
    }

    return (
      '<div class="combat-row '+(isActive?'active-turn':'')+' '+(isDeadRow?'is-dead':'')+'" data-id="'+c.id+'">'+
        '<input type="number" class="cr-init" value="'+c.initiative+'" data-action="set-init" data-id="'+c.id+'">'+
        '<div class="cr-main">'+
          '<div class="cr-name-row">'+
            '<span class="cr-name">'+escapeHtml(c.name)+'</span>'+
            '<span class="cr-tag">'+(c.isPC?'Personagem':'PNJ / Monstro')+'</span>'+
            '<span class="cr-ac">CA '+c.ac+'</span>'+
            (c.concentration ? '<span class="cr-tag" style="border-color:var(--info);color:var(--info)">Concentração</span>' : '')+
          '</div>'+
          body +
          '<div class="conditions-row">'+
            conditionsHtml + exhaustionHtml + concNote +
            '<button class="btn btn-sm btn-ghost" data-action="open-conditions" data-id="'+c.id+'">+ condição</button>'+
          '</div>'+
          panelHtml +
        '</div>'+
        '<div class="cr-side-actions">'+
          '<button class="btn-icon" data-action="duplicate-combatant" data-id="'+c.id+'" title="Duplicar">⧉</button>'+
          '<button class="btn-icon" data-action="edit-combatant" data-id="'+c.id+'" title="Ajustar">✎</button>'+
          '<button class="btn-icon" data-action="remove-combatant" data-id="'+c.id+'" title="Remover">✕</button>'+
        '</div>'+
      '</div>'
    );
  }

  function addCombatantManual(){
    var name = document.getElementById('add-name').value.trim() || 'Combatente';
    var init = parseInt(document.getElementById('add-init').value, 10) || 0;
    var ac = parseInt(document.getElementById('add-ac').value, 10) || 10;
    var hp = parseInt(document.getElementById('add-hp').value, 10) || 10;
    var isPC = document.getElementById('add-ispc').checked;
    state.combate.combatants.push(newCombatant(name, init, ac, hp, isPC));
    document.getElementById('add-name').value = '';
    saveState(); render();
    toast(name + ' adicionado ao combate.');
  }

  function newCombatant(name, init, ac, hpMax, isPC, sourceMonsterId){
    return {
      id: uid('c'), name: name, initiative: init, ac: ac, hpMax: hpMax, hpCurrent: hpMax,
      tempHp: 0, isPC: !!isPC, conditions: [], exhaustion: 0, concentration: false, lastConcDC: 0,
      deathSuccess: 0, deathFail: 0, stable: false, sourceMonsterId: sourceMonsterId || null
    };
  }

  function addCombatantFromMonster(monsterId){
    var m = null;
    for(var i=0;i<state.bestiario.length;i++){ if(state.bestiario[i].id===monsterId){ m=state.bestiario[i]; break; } }
    if(!m) return;
    var dexMod = mod(m.dex);
    var roll = Math.floor(Math.random()*20) + 1 + dexMod;
    var baseName = m.name;
    var count = 0;
    state.combate.combatants.forEach(function(c){
      if(c.name===baseName || c.name.indexOf(baseName+' (')===0) count++;
    });
    var name = count>0 ? (baseName + ' (' + (count+1) + ')') : baseName;
    var c = newCombatant(name, roll, m.ac, m.hpAvg, false, m.id);
    state.combate.combatants.push(c);
    saveState();
    if(currentTab==='combate') render();
    toast(name + ' entrou no combate (iniciativa ' + roll + ').');
  }

  function applyDamage(id){
    var input = document.getElementById('amt-'+id);
    var amt = parseInt(input && input.value, 10) || 0;
    if(amt<=0) return;
    var c = findCombatant(id);
    if(!c) return;
    var dmg = amt;
    if(c.tempHp>0){
      var absorbed = Math.min(c.tempHp, dmg);
      c.tempHp -= absorbed; dmg -= absorbed;
    }
    c.hpCurrent = Math.max(0, c.hpCurrent - dmg);
    if(c.concentration && dmg>0){ c.lastConcDC = Math.max(10, Math.floor(dmg/2)); }
    saveState(); render();
  }

  function applyHeal(id){
    var input = document.getElementById('amt-'+id);
    var amt = parseInt(input && input.value, 10) || 0;
    if(amt<=0) return;
    var c = findCombatant(id);
    if(!c) return;
    c.hpCurrent = Math.min(c.hpMax, c.hpCurrent + amt);
    if(c.hpCurrent>0){ c.stable = false; c.deathSuccess = 0; c.deathFail = 0; }
    saveState(); render();
  }

  function nextTurn(){
    var sorted = getSortedCombatants();
    if(sorted.length===0) return;
    state.combate.currentIndex++;
    if(state.combate.currentIndex >= sorted.length){ state.combate.currentIndex = 0; state.combate.round++; }
    saveState(); render();
  }
  function prevTurn(){
    var sorted = getSortedCombatants();
    if(sorted.length===0) return;
    state.combate.currentIndex--;
    if(state.combate.currentIndex < 0){ state.combate.currentIndex = sorted.length-1; if(state.combate.round>1) state.combate.round--; }
    saveState(); render();
  }
  function clearCombat(){
    if(!confirm('Limpar todos os combatentes da mesa?')) return;
    state.combate = { round:1, currentIndex:0, combatants:[] };
    saveState(); render();
  }

  /* ===================== eventos: combate ===================== */
  document.getElementById('combat-list').addEventListener('click', function(e){
    var btn = e.target.closest('[data-action]');
    if(!btn) return;
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');
    var c = id ? findCombatant(id) : null;

    if(action==='apply-dmg') applyDamage(id);
    else if(action==='apply-heal') applyHeal(id);
    else if(action==='remove-combatant'){
      state.combate.combatants = state.combate.combatants.filter(function(x){ return x.id!==id; });
      saveState(); render();
    }
    else if(action==='duplicate-combatant'){
      if(c){
        var copy = JSON.parse(JSON.stringify(c));
        copy.id = uid('c');
        var base = c.name.replace(/\s*\(\d+\)$/,'');
        var count = 0;
        state.combate.combatants.forEach(function(x){ if(x.name===base || x.name.indexOf(base+' (')===0) count++; });
        copy.name = base + ' (' + (count+1) + ')';
        state.combate.combatants.push(copy);
        saveState(); render();
      }
    }
    else if(action==='edit-combatant') openCombatantModal(id);
    else if(action==='open-conditions'){
      openConditionPanelFor = (openConditionPanelFor===id) ? null : id;
      render();
    }
    else if(action==='toggle-condition'){
      if(c){
        var cond = btn.getAttribute('data-cond');
        var arr = c.conditions || (c.conditions=[]);
        var pos = arr.indexOf(cond);
        if(pos===-1) arr.push(cond); else arr.splice(pos,1);
        saveState(); render();
      }
    }
    else if(action==='exhaustion-up'){ if(c){ c.exhaustion = Math.min(6,(c.exhaustion||0)+1); saveState(); render(); } }
    else if(action==='exhaustion-down'){ if(c){ c.exhaustion = Math.max(0,(c.exhaustion||0)-1); saveState(); render(); } }
    else if(action==='ds-success'){ if(c){ var idx=parseInt(btn.getAttribute('data-idx'),10); c.deathSuccess=idx+1; if(c.deathSuccess>=3){ c.stable=true; toast(c.name+' estabilizou.'); } saveState(); render(); } }
    else if(action==='ds-fail'){ if(c){ var idx2=parseInt(btn.getAttribute('data-idx'),10); c.deathFail=idx2+1; if(c.deathFail>=3){ toast(c.name+' morreu.'); } saveState(); render(); } }
    else if(action==='stabilize'){ if(c){ c.stable=true; saveState(); render(); } }
  });

  document.getElementById('combat-list').addEventListener('change', function(e){
    var input = e.target.closest('[data-action="set-init"]');
    if(!input) return;
    var c = findCombatant(input.getAttribute('data-id'));
    if(c){ c.initiative = parseInt(input.value,10) || 0; saveState(); render(); }
  });

  document.getElementById('btn-next-turn').addEventListener('click', nextTurn);
  document.getElementById('btn-prev-turn').addEventListener('click', prevTurn);
  document.getElementById('btn-clear-combat').addEventListener('click', clearCombat);
  document.getElementById('btn-toggle-add').addEventListener('click', function(){
    document.getElementById('add-panel').classList.toggle('hidden');
  });
  document.getElementById('btn-confirm-add').addEventListener('click', addCombatantManual);

  /* ===================== modal: combatente ===================== */
  function openCombatantModal(id){
    var c = findCombatant(id);
    if(!c) return;
    editingCombatantId = id;
    document.getElementById('ed-name').value = c.name;
    document.getElementById('ed-ac').value = c.ac;
    document.getElementById('ed-hpmax').value = c.hpMax;
    document.getElementById('ed-hpcur').value = c.hpCurrent;
    document.getElementById('ed-temphp').value = c.tempHp || 0;
    document.getElementById('ed-ispc').checked = !!c.isPC;
    document.getElementById('ed-conc').checked = !!c.concentration;
    document.getElementById('combatant-modal-overlay').classList.add('open');
  }
  function closeCombatantModal(){
    document.getElementById('combatant-modal-overlay').classList.remove('open');
    editingCombatantId = null;
  }
  document.getElementById('btn-save-combatant').addEventListener('click', function(){
    var c = findCombatant(editingCombatantId);
    if(!c) return;
    c.name = document.getElementById('ed-name').value.trim() || c.name;
    c.ac = parseInt(document.getElementById('ed-ac').value,10) || 0;
    c.hpMax = parseInt(document.getElementById('ed-hpmax').value,10) || 0;
    c.hpCurrent = Math.max(0, Math.min(c.hpMax, parseInt(document.getElementById('ed-hpcur').value,10) || 0));
    c.tempHp = parseInt(document.getElementById('ed-temphp').value,10) || 0;
    c.isPC = document.getElementById('ed-ispc').checked;
    c.concentration = document.getElementById('ed-conc').checked;
    if(c.hpCurrent>0){ c.stable=false; c.deathSuccess=0; c.deathFail=0; }
    saveState(); closeCombatantModal(); render();
  });
  document.querySelector('[data-action="close-combatant-modal"]').addEventListener('click', closeCombatantModal);
  document.getElementById('combatant-modal-overlay').addEventListener('click', function(e){
    if(e.target.id==='combatant-modal-overlay') closeCombatantModal();
  });

  /* ===================== bestiário ===================== */
  function renderBestiario(){
    var q = (document.getElementById('search-input').value || '').toLowerCase().trim();
    var grid = document.getElementById('bestiary-grid');
    var filtered = state.bestiario.filter(function(m){
      return m.name.toLowerCase().indexOf(q)!==-1 || (m.type||'').toLowerCase().indexOf(q)!==-1;
    });
    if(filtered.length===0){
      grid.innerHTML = '<div class="empty-state">Nenhum monstro encontrado. Crie um novo ou importe um backup.</div>';
      return;
    }
    grid.innerHTML = filtered.map(renderMonsterCard).join('');
  }

  function renderMonsterCard(m){
    return (
      '<div class="monster-card">'+
        '<div class="mc-name">'+escapeHtml(m.name)+'</div>'+
        '<div class="mc-meta">'+escapeHtml(m.size||'')+' '+escapeHtml(m.type||'')+' · CR '+escapeHtml(m.cr||'—')+'</div>'+
        '<div class="mc-stats-row"><span>CA '+ (m.ac||'—') +'</span><span>PV '+ (m.hpAvg||'—') +'</span><span>Desl. '+escapeHtml(m.speed||'—')+'</span></div>'+
        '<div class="mc-actions">'+
          '<button class="btn btn-sm" data-action="view-monster" data-id="'+m.id+'">Ver</button>'+
          '<button class="btn btn-sm btn-primary" data-action="add-to-combat" data-id="'+m.id+'">+ Combate</button>'+
        '</div>'+
      '</div>'
    );
  }

  document.getElementById('search-input').addEventListener('input', renderBestiario);
  document.getElementById('bestiary-grid').addEventListener('click', function(e){
    var btn = e.target.closest('[data-action]');
    if(!btn) return;
    var action = btn.getAttribute('data-action');
    var id = btn.getAttribute('data-id');
    if(action==='view-monster') openMonsterModal(id, 'view');
    else if(action==='add-to-combat') addCombatantFromMonster(id);
  });
  document.getElementById('btn-new-monster').addEventListener('click', function(){
    openMonsterModal(null, 'edit');
  });

  /* ===================== modal: monstro ===================== */
  function emptyMonster(){
    return {
      id:null, name:'', size:'Médio', type:'', alignment:'',
      ac:10, acNote:'', hpAvg:10, hpDice:'', speed:'9 m',
      str:10,dex:10,con:10,int:10,wis:10,cha:10,
      saves:'', skills:'', resistances:'', immunities:'', vulnerabilities:'', conditionImmunities:'',
      senses:'', languages:'', cr:'',
      traits:[], actions:[], bonusActions:[], reactions:[], legendaryActions:[], legendaryNote:'', notes:''
    };
  }

  function openMonsterModal(id, mode){
    editingMonsterId = id;
    if(id){
      var found = state.bestiario.filter(function(m){ return m.id===id; })[0];
      draftMonster = JSON.parse(JSON.stringify(found));
    } else {
      draftMonster = emptyMonster();
    }
    monsterModalMode = mode;
    renderMonsterModal();
    document.getElementById('monster-modal-overlay').classList.add('open');
  }
  function closeMonsterModal(){
    document.getElementById('monster-modal-overlay').classList.remove('open');
    editingMonsterId = null; draftMonster = null;
  }
  document.getElementById('monster-modal-overlay').addEventListener('click', function(e){
    if(e.target.id==='monster-modal-overlay') closeMonsterModal();
  });

  function renderMonsterModal(){
    var box = document.getElementById('monster-modal-box');
    box.innerHTML = (monsterModalMode==='view') ? monsterViewHtml(draftMonster) : monsterFormHtml(draftMonster);
    attachMonsterModalEvents();
  }

  function monsterViewHtml(m){
    var abilities = ['str','dex','con','int','wis','cha'];
    var labels = {str:'FOR',dex:'DES',con:'CON',int:'INT',wis:'SAB',cha:'CAR'};
    var abilitiesHtml = '<div class="sv-abilities">' + abilities.map(function(a){
      return '<div class="sv-ability"><b>'+m[a]+' ('+fmtMod(m[a])+')</b>'+labels[a]+'</div>';
    }).join('') + '</div>';

    function line(label, value){
      if(!value) return '';
      return '<div class="sv-line"><b>'+label+'.</b> '+escapeHtml(value)+'</div>';
    }
    function entries(title, list){
      if(!list || list.length===0) return '';
      var html = '<div class="sv-block-title">'+title+'</div>';
      html += list.map(function(it){
        return '<div class="sv-entry"><b>'+escapeHtml(it.name)+'.</b> '+escapeHtml(it.text)+'</div>';
      }).join('');
      return html;
    }

    var legendaryIntro = (m.legendaryActions && m.legendaryActions.length>0)
      ? '<div class="sv-entry">'+ (m.legendaryNote ? escapeHtml(m.legendaryNote) : 'Pode realizar 3 ações lendárias, escolhendo entre as opções abaixo. Apenas uma pode ser usada por vez, no final do turno de outra criatura.') +'</div>'
      : '';

    return (
      '<div class="modal-header">'+
        '<h2 class="modal-title">'+escapeHtml(m.name || 'Monstro')+'</h2>'+
        '<button class="btn-icon" data-action="close-monster-modal">✕</button>'+
      '</div>'+
      '<div class="stat-view">'+
        '<div class="sv-meta">'+escapeHtml(m.size||'')+' '+escapeHtml(m.type||'')+(m.alignment? (', '+escapeHtml(m.alignment)) : '')+'</div>'+
        line('Classe de Armadura', m.ac + (m.acNote? ' ('+m.acNote+')':'')) +
        line('Pontos de Vida', m.hpAvg + (m.hpDice? ' ('+m.hpDice+')':'')) +
        line('Deslocamento', m.speed) +
        '<hr>'+
        abilitiesHtml +
        '<hr>'+
        line('Resistência de testes', m.saves) +
        line('Perícias', m.skills) +
        line('Resistências a dano', m.resistances) +
        line('Imunidades a dano', m.immunities) +
        line('Vulnerabilidades a dano', m.vulnerabilities) +
        line('Imunidades a condição', m.conditionImmunities) +
        line('Sentidos', m.senses) +
        line('Idiomas', m.languages) +
        line('Nível de Desafio', m.cr) +
        entries('Traços', m.traits) +
        entries('Ações', m.actions) +
        entries('Ações Bônus', m.bonusActions) +
        entries('Reações', m.reactions) +
        ((m.legendaryActions && m.legendaryActions.length>0) ? ('<div class="sv-block-title">Ações Lendárias</div>'+legendaryIntro) : '') +
        entries('', m.legendaryActions) +
        (m.notes ? '<div class="sv-notes">'+escapeHtml(m.notes)+'</div>' : '') +
      '</div>'+
      '<div class="modal-actions">'+
        '<button class="btn push-left" data-action="delete-monster">Excluir</button>'+
        '<button class="btn" data-action="duplicate-monster">Duplicar</button>'+
        '<button class="btn btn-primary" data-action="edit-monster">Editar</button>'+
      '</div>'
    );
  }

  function repeatListHtml(listName, items, label){
    var itemsHtml = (items||[]).map(function(it, i){
      return (
        '<div class="repeat-item">'+
          '<div class="repeat-item-head">'+
            '<input type="text" placeholder="Nome" data-list="'+listName+'" data-idx="'+i+'" data-field="name" value="'+escapeHtml(it.name)+'">'+
            '<button class="repeat-remove" data-action="remove-list-item" data-list="'+listName+'" data-idx="'+i+'">remover</button>'+
          '</div>'+
          '<textarea placeholder="Descrição / efeito" data-list="'+listName+'" data-idx="'+i+'" data-field="text">'+escapeHtml(it.text)+'</textarea>'+
        '</div>'
      );
    }).join('');
    return (
      '<div class="form-section">'+
        '<div class="form-section-title">'+label+'</div>'+
        '<div data-list-container="'+listName+'">'+itemsHtml+'</div>'+
        '<button class="btn btn-sm" data-action="add-list-item" data-list="'+listName+'">+ adicionar</button>'+
      '</div>'
    );
  }

  function monsterFormHtml(m){
    var abilities = ['str','dex','con','int','wis','cha'];
    var labels = {str:'Força',dex:'Destreza',con:'Constituição',int:'Inteligência',wis:'Sabedoria',cha:'Carisma'};
    var abilitiesHtml = abilities.map(function(a){
      return (
        '<div class="field ability-box">'+
          '<label>'+labels[a]+'</label>'+
          '<input type="number" data-field="'+a+'" value="'+m[a]+'">'+
          '<div class="ability-mod">'+fmtMod(m[a])+'</div>'+
        '</div>'
      );
    }).join('');

    return (
      '<div class="modal-header">'+
        '<h2 class="modal-title">'+(editingMonsterId? 'Editar monstro' : 'Novo monstro')+'</h2>'+
        '<button class="btn-icon" data-action="close-monster-modal">✕</button>'+
      '</div>'+

      '<div class="form-section">'+
        '<div class="form-section-title">Identificação</div>'+
        '<div class="form-grid">'+
          '<div class="field field-wide"><label>Nome</label><input type="text" data-field="name" value="'+escapeHtml(m.name)+'"></div>'+
          '<div class="field"><label>Tamanho</label>'+
            '<select data-field="size">' + ['Miúdo','Pequeno','Médio','Grande','Enorme','Descomunal'].map(function(s){
              return '<option '+(m.size===s?'selected':'')+'>'+s+'</option>';
            }).join('') + '</select>'+
          '</div>'+
          '<div class="field"><label>Tipo</label><input type="text" data-field="type" value="'+escapeHtml(m.type)+'" placeholder="ex: humanoide (goblinoide)"></div>'+
          '<div class="field"><label>Alinhamento</label><input type="text" data-field="alignment" value="'+escapeHtml(m.alignment)+'"></div>'+
        '</div>'+
      '</div>'+

      '<div class="form-section">'+
        '<div class="form-section-title">Combate</div>'+
        '<div class="form-grid">'+
          '<div class="field"><label>CA</label><input type="number" data-field="ac" value="'+m.ac+'"></div>'+
          '<div class="field"><label>Nota da CA</label><input type="text" data-field="acNote" value="'+escapeHtml(m.acNote)+'" placeholder="ex: armadura de couro"></div>'+
          '<div class="field"><label>PV médio</label><input type="number" data-field="hpAvg" value="'+m.hpAvg+'"></div>'+
          '<div class="field"><label>Dado de PV</label><input type="text" data-field="hpDice" value="'+escapeHtml(m.hpDice)+'" placeholder="ex: 2d6+2"></div>'+
          '<div class="field"><label>Deslocamento</label><input type="text" data-field="speed" value="'+escapeHtml(m.speed)+'"></div>'+
          '<div class="field"><label>Nível de desafio</label><input type="text" data-field="cr" value="'+escapeHtml(m.cr)+'" placeholder="ex: 1/4 (50 PE)"></div>'+
        '</div>'+
      '</div>'+

      '<div class="form-section">'+
        '<div class="form-section-title">Atributos</div>'+
        '<div class="form-grid cols-6">'+abilitiesHtml+'</div>'+
      '</div>'+

      '<div class="form-section">'+
        '<div class="form-section-title">Perícias &amp; resistências</div>'+
        '<div class="form-grid">'+
          '<div class="field"><label>Resistência de testes</label><input type="text" data-field="saves" value="'+escapeHtml(m.saves)+'"></div>'+
          '<div class="field"><label>Perícias</label><input type="text" data-field="skills" value="'+escapeHtml(m.skills)+'"></div>'+
          '<div class="field"><label>Resistências a dano</label><input type="text" data-field="resistances" value="'+escapeHtml(m.resistances)+'"></div>'+
          '<div class="field"><label>Imunidades a dano</label><input type="text" data-field="immunities" value="'+escapeHtml(m.immunities)+'"></div>'+
          '<div class="field"><label>Vulnerabilidades a dano</label><input type="text" data-field="vulnerabilities" value="'+escapeHtml(m.vulnerabilities)+'"></div>'+
          '<div class="field"><label>Imunidades a condição</label><input type="text" data-field="conditionImmunities" value="'+escapeHtml(m.conditionImmunities)+'"></div>'+
        '</div>'+
      '</div>'+

      '<div class="form-section">'+
        '<div class="form-section-title">Sentidos &amp; idiomas</div>'+
        '<div class="form-grid">'+
          '<div class="field"><label>Sentidos</label><input type="text" data-field="senses" value="'+escapeHtml(m.senses)+'"></div>'+
          '<div class="field"><label>Idiomas</label><input type="text" data-field="languages" value="'+escapeHtml(m.languages)+'"></div>'+
        '</div>'+
      '</div>'+

      repeatListHtml('traits', m.traits, 'Traços') +
      repeatListHtml('actions', m.actions, 'Ações') +
      repeatListHtml('bonusActions', m.bonusActions, 'Ações bônus') +
      repeatListHtml('reactions', m.reactions, 'Reações') +
      repeatListHtml('legendaryActions', m.legendaryActions, 'Ações lendárias') +

      '<div class="form-section">'+
        '<div class="form-section-title">Notas do mestre</div>'+
        '<textarea data-field="notes" placeholder="táticas, segredos, ganchos de história...">'+escapeHtml(m.notes)+'</textarea>'+
      '</div>'+

      '<div class="modal-actions">'+
        '<button class="btn" data-action="cancel-monster-edit">Cancelar</button>'+
        '<button class="btn btn-primary" data-action="save-monster">Salvar monstro</button>'+
      '</div>'
    );
  }

  function attachMonsterModalEvents(){
    var box = document.getElementById('monster-modal-box');

    box.querySelectorAll('input[data-field], select[data-field], textarea[data-field]').forEach(function(el){
      var evt = (el.tagName==='SELECT') ? 'change' : 'input';
      el.addEventListener(evt, function(){
        var field = el.getAttribute('data-field');
        var val = el.value;
        if(el.type==='number') val = parseInt(val,10) || 0;
        draftMonster[field] = val;
        if(['str','dex','con','int','wis','cha'].indexOf(field)!==-1){
          var modEl = el.parentElement.querySelector('.ability-mod');
          if(modEl) modEl.textContent = fmtMod(val);
        }
      });
    });

    box.querySelectorAll('[data-list][data-field]').forEach(function(el){
      el.addEventListener('input', function(){
        var list = el.getAttribute('data-list');
        var idx = parseInt(el.getAttribute('data-idx'),10);
        var field = el.getAttribute('data-field');
        draftMonster[list][idx][field] = el.value;
      });
    });

    box.addEventListener('click', monsterModalClickHandler);
  }

  function monsterModalClickHandler(e){
    var btn = e.target.closest('[data-action]');
    if(!btn) return;
    var action = btn.getAttribute('data-action');

    if(action==='close-monster-modal') closeMonsterModal();
    else if(action==='edit-monster'){ monsterModalMode='edit'; renderMonsterModal(); }
    else if(action==='cancel-monster-edit'){
      if(editingMonsterId){ monsterModalMode='view'; openMonsterModal(editingMonsterId,'view'); }
      else closeMonsterModal();
    }
    else if(action==='save-monster'){
      if(!draftMonster.name || !draftMonster.name.trim()){ toast('Dê um nome ao monstro antes de salvar.'); return; }
      if(editingMonsterId){
        var idx = -1;
        for(var i=0;i<state.bestiario.length;i++){ if(state.bestiario[i].id===editingMonsterId){ idx=i; break; } }
        draftMonster.id = editingMonsterId;
        if(idx!==-1) state.bestiario[idx] = draftMonster;
      } else {
        draftMonster.id = uid('m');
        state.bestiario.push(draftMonster);
      }
      saveState();
      toast('Monstro salvo.');
      closeMonsterModal();
      renderBestiario();
    }
    else if(action==='delete-monster'){
      if(confirm('Excluir "'+draftMonster.name+'" do bestiário?')){
        state.bestiario = state.bestiario.filter(function(m){ return m.id!==editingMonsterId; });
        saveState(); closeMonsterModal(); renderBestiario();
      }
    }
    else if(action==='duplicate-monster'){
      var copy = JSON.parse(JSON.stringify(draftMonster));
      copy.id = uid('m');
      copy.name = copy.name + ' (cópia)';
      state.bestiario.push(copy);
      saveState();
      toast('Monstro duplicado.');
      closeMonsterModal(); renderBestiario();
    }
    else if(action==='add-list-item'){
      var list = btn.getAttribute('data-list');
      draftMonster[list].push({name:'', text:''});
      renderMonsterModal();
    }
    else if(action==='remove-list-item'){
      var list2 = btn.getAttribute('data-list');
      var idx2 = parseInt(btn.getAttribute('data-idx'),10);
      draftMonster[list2].splice(idx2,1);
      renderMonsterModal();
    }
  }

  /* ===================== exportar / importar ===================== */
  document.getElementById('btn-export').addEventListener('click', function(){
    var blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    var d = new Date();
    var stamp = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    a.href = url; a.download = 'grimorio-backup-'+stamp+'.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast('Backup exportado.');
  });

  document.getElementById('btn-import').addEventListener('click', function(){
    document.getElementById('file-import').click();
  });
  document.getElementById('file-import').addEventListener('change', function(e){
    var file = e.target.files[0];
    if(!file) return;
    var reader = new FileReader();
    reader.onload = function(evt){
      try{
        var imported = JSON.parse(evt.target.result);
        if(imported.bestiario && Array.isArray(imported.bestiario)){
          var existingIds = {};
          state.bestiario.forEach(function(m){ existingIds[m.id]=true; });
          imported.bestiario.forEach(function(m){
            if(existingIds[m.id]) m.id = uid('m');
            state.bestiario.push(m);
          });
        }
        if(imported.combate && confirm('Substituir o combate atual pelos dados importados?')){
          state.combate = imported.combate;
        }
        saveState(); render();
        toast('Dados importados.');
      } catch(err){
        console.error(err);
        toast('Arquivo inválido — não foi possível importar.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  /* ===================== tabs & init ===================== */
  document.getElementById('tab-btn-combate').addEventListener('click', function(){ switchTab('combate'); });
  document.getElementById('tab-btn-bestiario').addEventListener('click', function(){ switchTab('bestiario'); });

  document.addEventListener('keydown', function(e){
    if(e.key==='Escape'){ closeCombatantModal(); closeMonsterModal(); }
  });

  loadState();
  render();

})();