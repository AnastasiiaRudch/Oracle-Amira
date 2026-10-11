let fblock='all', fsearch='', spread=[], mIdx=-1;
// Inline editing of saved spreads
let editingId=null, editReplaceIdx=null; // editReplaceIdx: card position to replace (null = add)
// Draft spread groups: [{label:string, count:number}]
let spreadGroups=[];

// ── SAVED SPREADS (localStorage) ──────────────────────────────────────────
const LS_KEY='oracle_saved_spreads';
function loadSaved(){try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch{return[]}}
function storeSaved(arr){try{localStorage.setItem(LS_KEY,JSON.stringify(arr))}catch{}}

// ── SAVE DIALOG (for new spreads from draft) ──────────────────────────────
function openSaveDialog(){
  if(!spread.length){alert('Розклад порожній — додайте картки перед збереженням.');return;}
  document.getElementById('sdlg-input').value='';
  document.getElementById('sdlg-title').textContent='💾 Зберегти розклад';
  document.getElementById('sdlg-ov').classList.add('on');
  setTimeout(()=>document.getElementById('sdlg-input').focus(),80);
}
function closeSaveDialog(){
  document.getElementById('sdlg-ov').classList.remove('on');
  document.getElementById('sdlg-input').value='';
}
function confirmSave(){
  const name=document.getElementById('sdlg-input').value.trim();
  if(!name)return;
  const arr=loadSaved();
  arr.push({id:'sp_'+Date.now(),name,cards:spread.slice(),groups:spreadGroups.slice(),date:Date.now()});
  storeSaved(arr);
  spread=[];spreadGroups=[];
  updCount();
  renderCatalog();
  renderSpread();
  closeSaveDialog();
  renderSaved();
}

// ── INLINE EDITING of saved spreads ───────────────────────────────────────
function getSavedById(id){return loadSaved().find(x=>x.id===id)||null}

function deleteSaved(id){
  if(!confirm('Видалити цей розклад?'))return;
  storeSaved(loadSaved().filter(x=>x.id!==id));
  if(editingId===id){editingId=null;}
  renderSaved();
}

function renameSaved(id,name){
  const arr=loadSaved();
  const s=arr.find(x=>x.id===id);
  if(!s)return;
  // Save as-is (with trailing spaces) while typing; trim happens on toggleEditMode
  s.name=name||s.name;
  storeSaved(arr);
}

function finishRename(id){
  const arr=loadSaved();
  const s=arr.find(x=>x.id===id);
  if(!s)return;
  const trimmed=s.name.trim();
  if(trimmed){s.name=trimmed;storeSaved(arr);}
}

function toggleEditMode(id){
  if(editingId===id){finishRename(id);editingId=null;}
  else{editingId=id;}
  renderSaved();
}

// Remove a card from a saved spread at position pos
function svRemoveCard(id,pos){
  const arr=loadSaved();
  const s=arr.find(x=>x.id===id);
  if(!s)return;
  // Adjust groups: reduce count of the group containing pos; remove group if count drops to 0
  if(s.groups&&s.groups.length){
    const ng=normalizeGroups(s.cards,s.groups);
    let cursor=0;
    for(const g of ng){
      if(pos>=cursor&&pos<cursor+g.count){g.count--;break;}
      cursor+=g.count;
    }
    // Merge zero-count groups and clean up
    const merged=[];
    for(const g of ng){
      if(g.count<=0)continue;
      if(!g.label&&merged.length&&!merged[merged.length-1].label){merged[merged.length-1].count+=g.count;}
      else{merged.push({...g});}
    }
    s.groups=merged.length===1&&!merged[0].label?[]:merged;
  }
  s.cards.splice(pos,1);
  s.date=Date.now();
  storeSaved(arr);
  renderSaved();
}

// Open card-picker popup: mode 'add'|'replace', for spread id, at position pos
function openCardPicker(id,mode,pos){
  editReplaceIdx=(mode==='replace')?pos:null;
  document.getElementById('cpk-ov').dataset.sid=id;
  document.getElementById('cpk-ov').dataset.mode=mode;
  document.getElementById('cpk-ov').dataset.pos=pos;
  cpkSearch=''; cpkBlock='all';
  document.getElementById('cpk-search').value='';
  document.getElementById('cpk-clear').style.display='none';
  document.querySelectorAll('.cpk-fbtn').forEach(b=>b.classList.toggle('active',b.dataset.b==='all'));
  renderCardPicker();
  document.getElementById('cpk-ov').classList.add('on');
}
function closeCardPicker(){document.getElementById('cpk-ov').classList.remove('on');}
document.getElementById('cpk-ov').addEventListener('click',e=>{if(e.target===document.getElementById('cpk-ov'))closeCardPicker();});
function cpkSetBlock(b){
  cpkBlock=b;
  document.querySelectorAll('.cpk-fbtn').forEach(x=>x.classList.toggle('active',x.dataset.b===b));
  renderCardPicker();
}

let cpkSearch='', cpkBlock='all';
function spOpenPickerForGroup(gi){
  const ov=document.getElementById('cpk-ov');
  ov.dataset.sid='__draft__';ov.dataset.mode='add';ov.dataset.pos='-1';ov.dataset.gi=gi;
  cpkSearch='';cpkBlock='all';
  document.getElementById('cpk-search').value='';
  document.getElementById('cpk-clear').style.display='none';
  document.querySelectorAll('.cpk-fbtn').forEach(b=>b.classList.toggle('active',b.dataset.b==='all'));
  renderCardPicker();
  ov.classList.add('on');
}
function renderCardPicker(){
  const q=cpkSearch.toLowerCase().trim();
  const ov=document.getElementById('cpk-ov');
  const sid=ov.dataset.sid;
  const mode=ov.dataset.mode;
  const pos=parseInt(ov.dataset.pos);
  // Cards already in this spread (to show checkmark)
  const s=sid==='__draft__'?{cards:spread}:getSavedById(sid);
  const inSpread=new Set(s?s.cards:[]);
  const filtered=CARDS.map((c,i)=>({c,i})).filter(({c})=>{
    if(cpkBlock!=='all'&&c.block!==cpkBlock)return false;
    if(!q)return true;
    return String(c.num)===q||c.name.toLowerCase().includes(q);
  });
  document.getElementById('cpk-grid').innerHTML=filtered.map(({c,i})=>{
    const already=inSpread.has(i)&&!(mode==='replace'&&s&&s.cards[pos]===i);
    return `<div class="cpk-card${already?' cpk-in':''}" ${already?'':'onclick="pickCard('+i+')"'}>
      <img src="data:image/jpeg;base64,${c.img}" alt="${c.name}">
      <div class="cpk-name">${c.name}</div>
      ${already?'<div class="cpk-badge">✓</div>':''}
    </div>`;
  }).join('');
}
function pickCard(cardIdx){
  const ov=document.getElementById('cpk-ov');
  const sid=ov.dataset.sid;
  const mode=ov.dataset.mode;
  const pos=parseInt(ov.dataset.pos);
  // Special case: adding to draft spread group
  if(sid==='__draft__'){
    if(spread.includes(cardIdx)){closeCardPicker();return;}
    const toGi=parseInt(ov.dataset.gi);
    const ng=normalizeGroups(spread,spreadGroups);
    spread.push(cardIdx);
    if(ng.length){
      // Add card to the specified group (or last group if gi=-1)
      if(toGi>=0&&toGi<ng.length){ng[toGi].count++;}
      else{ng[ng.length-1].count++;}
      spreadGroups=ng;
    }
    // If no groups, spreadGroups stays [] — card added ungrouped
    updCount();renderCatalog();closeCardPicker();renderSpread();
    return;
  }
  const arr=loadSaved();
  const s=arr.find(x=>x.id===sid);
  if(!s)return;
  if(mode==='replace'){
    s.cards[pos]=cardIdx;
    // groups unchanged for replace
  } else {
    // add — append card to end of specified group (dataset.gi), or plain append
    const toGi=parseInt(ov.dataset.gi||'-1');
    if(s.groups&&s.groups.length&&toGi>=0){
      // Insert card at end of target group: find insertion position
      const ng=normalizeGroups(s.cards,s.groups);
      let insertPos=s.cards.length;// default: end
      let cursor=0;
      for(let gi=0;gi<=toGi&&gi<ng.length;gi++){cursor+=ng[gi].count;}
      insertPos=cursor;// end of toGi group
      s.cards.splice(insertPos,0,cardIdx);
      ng[toGi].count++;
      s.groups=ng;
    } else {
      s.cards.splice(pos>=0?pos:s.cards.length,0,cardIdx);
      // No groups — just append
    }
  }
  s.date=Date.now();
  storeSaved(arr);
  closeCardPicker();
  renderSaved();
}
let expandedSaved=new Set();
function toggleSavedExpand(id){
  if(expandedSaved.has(id))expandedSaved.delete(id);
  else expandedSaved.add(id);
  renderSaved();
}
function renderSaved(){
  const arr=loadSaved();
  const empty=document.getElementById('saved-empty');
  const list=document.getElementById('saved-list');
  if(!arr.length){empty.style.display='block';list.innerHTML='';return;}
  empty.style.display='none';
  // Remember cursor position for active input before re-render
  const activeInput=document.activeElement;
  const activeId=activeInput&&activeInput.classList.contains('sv-name-input')?activeInput.dataset.id:null;
  const activeCursor=activeId?activeInput.selectionStart:null;
  list.innerHTML=arr.slice().reverse().map(s=>{
    const d=new Date(s.date);
    const dateStr=d.toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric'});
    const isOpen=expandedSaved.has(s.id)||editingId===s.id;
    const isEditing=editingId===s.id;
    let cardsHtml='';
    if(isOpen){
      if(isEditing){
        // Edit mode: group headers (editable), cards with ✕/⇄, split buttons between groups
        const ng=normalizeGroups(s.cards,s.groups||[]);
        let inner='';let cardPos=0;
        const mkSvCard=(ci,p)=>{const c=CARDS[ci];return `<div class="sv-card sv-card-edit" draggable="true" ondragstart="svDragStart(event,'${s.id}',${p})" ondragend="svDragEnd(event)" ondragover="svDragOver(event)" ondragleave="svDragLeave(event)" ondrop="svDrop(event,'${s.id}',${p})"><img src="data:image/jpeg;base64,${c.img}" alt="${c.name}"><div class="sv-card-name">${c.name}</div><div class="sv-card-badge" style="background:${bColor(c.block)}22;color:${bColor(c.block)};border:1px solid ${bColor(c.block)}55">${bLabel(c.block)}</div><div class="sv-card-actions"><button class="sv-ca-rm" title="Видалити" onclick="svRemoveCard('${s.id}',${p})">✕</button><button class="sv-ca-sw" title="Замінити" onclick="openCardPicker('${s.id}','replace',${p})">⇄</button></div></div>`;};
        const mkSvAddTile=(sid,gi)=>`<div class="sv-add-card-tile" onclick="openCardPicker('${sid}','add-to-group',-1);document.getElementById('cpk-ov').dataset.gi='${gi}'"><span>＋</span></div>`;
        if(!ng.length){
          // No groups — cards + inline + tile + new-label button
          inner+=s.cards.map((ci,p)=>mkSvCard(ci,p)).join('');
          inner+=mkSvAddTile(s.id,-1);
          inner+=`<div class="sv-add-label-tile"><button class="sv-add-label-btn" onclick="svAddGroupNew('${s.id}')">＋ Нова мітка</button></div>`;
        } else {
          for(let gi=0;gi<ng.length;gi++){
            const g=ng[gi];const gStart=cardPos;
            // Group header — also a drop target
            inner+=`<div class="sv-group-header sv-group-droptarget" data-start="${gStart}" ondragover="svDragOver(event)" ondragleave="svDragLeave(event)" ondrop="svDropGroup(event,'${s.id}',${gi})"><input class="sv-group-input" data-id="${s.id}" data-start="${gStart}" maxlength="80" oninput="svRenameGroup('${s.id}',${gStart},this.value)" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()" placeholder="Назва мітки..."><button class="sv-group-del" title="Видалити мітку" onclick="svRemoveGroup('${s.id}',${gStart})">✕</button></div>`;
            for(let j=0;j<g.count;j++){
              inner+=mkSvCard(s.cards[cardPos],cardPos);
              cardPos++;
            }
            // Inline + tile after last card of this group
            inner+=mkSvAddTile(s.id,gi);
          }
          // "New label" button at the bottom
          inner+=`<div class="sv-add-label-tile"><button class="sv-add-label-btn" onclick="svAddGroupNew('${s.id}')">＋ Нова мітка</button></div>`;
        }
        cardsHtml=`<div class="sv-cards sv-cards-edit">${inner}</div>`;
      } else {
        // View mode: render with group headers
        const rows=buildGroupedRows(s.cards,s.groups||[]);
        let inner='';
        for(const row of rows){
          if(row.type==='label'){
            inner+=`<div class="sv-group-label">${row.text}</div>`;
          } else {
            const c=CARDS[row.cardIdx];
            inner+=`<div class="sv-card" onclick="openM(${row.cardIdx})">
              <img src="data:image/jpeg;base64,${c.img}" alt="${c.name}">
              <div class="sv-card-name">${c.name}</div>
              <div class="sv-card-badge" style="background:${bColor(c.block)}22;color:${bColor(c.block)};border:1px solid ${bColor(c.block)}55">${bLabel(c.block)}</div>
            </div>`;
          }
        }
        cardsHtml=`<div class="sv-cards">${inner}</div>`;
      }
    }
    return `<div class="sv-item${isEditing?' sv-editing':''}" data-id="${s.id}">
      <div class="sv-top" ${isEditing?'':'onclick="toggleSavedExpand(\''+s.id+'\')" style="cursor:pointer"'}>
        <div class="sv-chevron">${isOpen?'▾':'▸'}</div>
        <div class="sv-info">
          ${isEditing
            ? `<input class="sv-name-input" data-id="${s.id}" maxlength="60" oninput="renameSaved('${s.id}',this.value)" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()" onblur="renameSaved('${s.id}',this.value)">`
            : `<div class="sv-name">${s.name}</div>`}
          <div class="sv-meta">${s.cards.length} карт · ${dateStr}</div>
        </div>
        <div class="sv-btns" onclick="event.stopPropagation()">
          <button class="sv-btn sv-edit${isEditing?' sv-edit-active':''}" onclick="toggleEditMode('${s.id}')">${isEditing?'✓ Готово':'✏️ Редагувати'}</button>
          <button class="sv-btn sv-del" onclick="deleteSaved('${s.id}')">🗑</button>
        </div>
      </div>
      ${cardsHtml}
    </div>`;
  }).join('');
  // Set input values via JS to preserve trailing spaces (HTML attribute strips them)
  arr.forEach(s=>{
    const inp=list.querySelector(`.sv-name-input[data-id="${s.id}"]`);
    if(inp){
      inp.value=s.name;
      if(s.id===activeId){inp.focus();try{inp.setSelectionRange(activeCursor,activeCursor);}catch(e){}}
    }
    // Set group label input values
    const ng=normalizeGroups(s.cards,s.groups||[]);
    let cursor=0;
    for(const g of ng){
      if(g.label!==undefined){
        const gi=list.querySelector(`.sv-group-input[data-id="${s.id}"][data-start="${cursor}"]`);
        if(gi)gi.value=g.label;
      }
      cursor+=g.count;
    }
  });
}

// Keyboard shortcuts
document.addEventListener('keydown',e=>{
  if(document.getElementById('cpk-ov').classList.contains('on')){
    if(e.key==='Escape')closeCardPicker();
    return;
  }
  if(document.getElementById('sdlg-ov').classList.contains('on')){
    if(e.key==='Enter')confirmSave();
    if(e.key==='Escape')closeSaveDialog();
  }
});

// Category formatting for card descriptions
const CAT_MAP = [
  // Relationships
  { pat: /^(В вопросах взаимоотношени[яхй][а-я]*\s*:)/i, icon:'💞', cls:'cat-rel' },
  { pat: /^(Вопросы взаимоотношений\s*:)/i,               icon:'💞', cls:'cat-rel' },
  { pat: /^(В вопросах отношений\s*:)/i,                   icon:'💞', cls:'cat-rel' },
  { pat: /^(Отношения\s*:)/i,                              icon:'💞', cls:'cat-rel' },
  // Career & money
  { pat: /^(Карьера и денежные дела\s*:)/i,                icon:'💰', cls:'cat-mon' },
  { pat: /^(Карьера и деньги\s*:)/i,                       icon:'💰', cls:'cat-mon' },
  { pat: /^(Карьера и денежные вопросы\s*:)/i,             icon:'💰', cls:'cat-mon' },
  { pat: /^(Карьера и денежный вопрос\s*:)/i,              icon:'💰', cls:'cat-mon' },
  { pat: /^(Карьера\s*:)/i,                                icon:'💰', cls:'cat-mon' },
  // Personality
  { pat: /^(Характеристика личности\s*:)/i,                icon:'👤', cls:'cat-per' },
  // Health
  { pat: /^(Здоровье\s*:)/i,                               icon:'🌿', cls:'cat-hlt' },
  { pat: /^(В вопросах здоровья\s*:)/i,                    icon:'🌿', cls:'cat-hlt' },
  // Magic
  { pat: /^(В вопросах магии\s*:)/i,                       icon:'🔮', cls:'cat-mag' },
  { pat: /^(В магических вопросах\s*:)/i,                  icon:'🔮', cls:'cat-mag' },
  { pat: /^(Магия\s*:)/i,                                  icon:'🔮', cls:'cat-mag' },
  { pat: /^(Не магическая трактовка\s*:)/i,                icon:'🔮', cls:'cat-mag' },
  // Chakra — covers "Чакра:", "Чакры:", and "Чакра в ресурсе..." (no colon)
  // Note: \b doesn't work with Cyrillic in JS, so use lookahead instead
  { pat: /^(Чакр[аы](?=[\s:,.]|$))/i,                     icon:'✨', cls:'cat-chk' },
  // Answer
  { pat: /^(Отве[тТ]?[еЕ]?\s*:.+)/i,                      icon:'🌟', cls:'cat-ans' },
  // Advice
  { pat: /^(Совет от карт\s*:)/i,                          icon:'🕯️', cls:'cat-adv' },
  { pat: /^(Совет карты\s*:)/i,                            icon:'🕯️', cls:'cat-adv' },
  { pat: /^(Как вести себя\s*:)/i,                         icon:'🕯️', cls:'cat-adv' },
  { pat: /^(В магии\s*:)/i,                               icon:'🔮', cls:'cat-mag' },
  { pat: /^(Особенность карты\s*:)/i,                     icon:'🕯️', cls:'cat-adv' },
  { pat: /^(Соответствие\s*:)/i,                          icon:'🕯️', cls:'cat-adv' },
  { pat: /^(Дополняет информацию[^:]*:)/i,               icon:'🔮', cls:'cat-mag' },
  { pat: /^(Карта может показать[^:]*:)/i,               icon:'🕯️', cls:'cat-adv' },
];

function formatDesc(text) {
  // Split into lines, detect category headers, wrap them
  const lines = text.split('\n');
  let html = '';
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { html += '<br>'; continue; }
    let matched = false;
    for (const {pat, icon, cls} of CAT_MAP) {
      const m = trimmed.match(pat);
      if (m) {
        // Split "Category: rest of text"
        // The matched group m[1] is the label part (with colon if present)
        const labelRaw = m[1];
        const colonIdx = trimmed.indexOf(':');
        let label, rest;
        if (colonIdx > 0 && colonIdx < 70) {
          label = trimmed.slice(0, colonIdx + 1);
          rest = trimmed.slice(colonIdx + 1).trim();
        } else {
          // No colon — whole line is the category text (e.g. "Чакра в ресурсе, энергия...")
          label = labelRaw;
          rest = trimmed.slice(labelRaw.length).trim();
        }
        html += `<div class="desc-block"><span class="desc-cat ${cls}">${icon} ${label}</span>${rest ? ' <span class="desc-body">' + rest + '</span>' : ''}</div>`;
        matched = true;
        break;
      }
    }
    if (!matched) {
      html += `<p class="desc-line">${trimmed}</p>`;
    }
  }
  return html;
}

function bLabel(b){return b==='Леноран'?'Ленорман':b==='Загальний'?'Загальний':'Магічний'}
function bColor(b){return b==='Леноран'?'#4d8bc9':b==='Загальний'?'#c97a4d':'#9b4dc9'}
function inS(i){return spread.includes(i)}

function toggleS(i){
  if(inS(i)) spread=spread.filter(x=>x!==i);
  else {
    spread.push(i);
    // New card goes as its own unlabeled group, not absorbed into existing groups
    if(spreadGroups.length){
      spreadGroups.push({label:'',count:1});
    }
  }
  updCount(); renderCatalog(); renderSpread();
  if(mIdx===i) updMBtn();
}
function removeS(i){
  const pos=spread.indexOf(i);
  spread=spread.filter(x=>x!==i);
  // Adjust draft groups
  if(pos>=0&&spreadGroups.length){
    const ng=normalizeGroups([...spread,i],spreadGroups);
    let cursor=0;
    for(const g of ng){if(pos>=cursor&&pos<cursor+g.count){g.count--;break;}cursor+=g.count;}
    const merged=[];
    for(const g of ng){
      if(g.count<=0)continue;
      if(!g.label&&merged.length&&!merged[merged.length-1].label)merged[merged.length-1].count+=g.count;
      else merged.push({...g});
    }
    spreadGroups=merged.length===1&&!merged[0].label?[]:merged;
  }
  updCount();renderCatalog();renderSpread();
}
function clearSpread(){spread=[];spreadGroups=[];updCount();renderCatalog();renderSpread();}

// ── GROUP/LABEL HELPERS ───────────────────────────────────────────────────────
// Normalize groups so their counts sum exactly to cards.length, no negatives.
// Empty groups (count=0) are kept if they have a label (they're drop targets).
function normalizeGroups(cards, groups){
  if(!groups||!groups.length)return[];
  if(!cards.length){
    // No cards: keep only labeled groups as empty placeholders
    return groups.filter(g=>g.label).map(g=>({label:g.label,count:0}));
  }
  // First pass: preserve labeled empty groups, distribute cards among the rest
  // Strategy: labeled groups keep their count (clamped), unlabeled fill remaining
  const result=groups.map(g=>({label:g.label||'',count:Math.max(0,g.count||0)}));
  const total=cards.length;
  const currentSum=result.reduce((s,g)=>s+g.count,0);
  if(currentSum!==total){
    // Adjust: add/remove cards from last non-empty group or last group
    const diff=total-currentSum;
    if(diff>0){
      // Need to add cards — put them in last group
      if(result.length)result[result.length-1].count+=diff;
    } else {
      // Need to remove cards — take from end
      let toRemove=-diff;
      for(let i=result.length-1;i>=0&&toRemove>0;i--){
        const take=Math.min(result[i].count,toRemove);
        result[i].count-=take;toRemove-=take;
      }
    }
  }
  // Remove unlabeled groups with count=0 — but keep the LAST group always (it may be a newly added empty label)
  return result.filter((g,i)=>g.count>0||g.label||(i===result.length-1));
}
// Build flat array of {type:'label',text} | {type:'card',cardIdx,pos} for rendering
function buildGroupedRows(cards, groups){
  const ng=normalizeGroups(cards,groups);
  const rows=[];
  let pos=0;
  if(!ng.length){for(let i=0;i<cards.length;i++)rows.push({type:'card',cardIdx:cards[i],pos:i});return rows;}
  for(const g of ng){
    if(g.label)rows.push({type:'label',text:g.label,count:g.count,startPos:pos});
    for(let j=0;j<g.count;j++){rows.push({type:'card',cardIdx:cards[pos],pos:pos});pos++;}
  }
  return rows;
}
// Save groups on a saved spread
function svSaveGroups(id,groups){
  const arr=loadSaved();const s=arr.find(x=>x.id===id);if(!s)return;
  s.groups=groups;storeSaved(arr);
}
// Add a group boundary: split so that there's a new (empty-label) group starting at afterPos+1
function svAddGroup(id,afterPos){
  const arr=loadSaved();const s=arr.find(x=>x.id===id);if(!s)return;
  // Special case: "add label to all cards" — afterPos === cards.length-1, just wrap all in one group
  if(!s.groups||!s.groups.length){
    s.groups=[{label:'',count:s.cards.length}];
  } else {
    s.groups=splitGroupsAt(s.cards,s.groups,afterPos);
  }
  storeSaved(arr);renderSaved();
}
function splitGroupsAt(cards,groups,afterPos){
  // afterPos = last card index of the group that should end here (0-based)
  // We insert a new boundary after afterPos
  const ng=normalizeGroups(cards,groups);
  if(!ng.length)return [{label:'',count:cards.length}];
  // Build result by splitting the group that contains afterPos
  const result=[];let cursor=0;
  for(let gi=0;gi<ng.length;gi++){
    const g=ng[gi];
    const gEnd=cursor+g.count-1;
    if(afterPos>=cursor&&afterPos<gEnd){
      // Split this group: first part ends at afterPos, second starts at afterPos+1
      const firstCount=afterPos-cursor+1;
      const secondCount=g.count-firstCount;
      result.push({label:g.label,count:firstCount});
      result.push({label:'',count:secondCount});
    } else {
      result.push({label:g.label,count:g.count});
    }
    cursor+=g.count;
  }
  return result;
}
// Remove the label from a group (make it unlabeled, merge if adjacent unlabeled)
function svRemoveGroup(id,startPos){
  const arr=loadSaved();const s=arr.find(x=>x.id===id);if(!s)return;
  const ng=normalizeGroups(s.cards,s.groups||[]);
  let cursor=0;
  for(let gi=0;gi<ng.length;gi++){
    if(cursor===startPos){ng[gi].label='';break;}
    cursor+=ng[gi].count;
  }
  // Merge consecutive unlabeled groups
  const merged=[];
  for(const g of ng){
    if(!g.label&&merged.length&&!merged[merged.length-1].label){
      merged[merged.length-1].count+=g.count;
    } else {merged.push({...g});}
  }
  s.groups=merged.filter(g=>g.label||merged.length>1?true:false);
  if(merged.length===1&&!merged[0].label)s.groups=[];
  storeSaved(arr);renderSaved();
}
// Update label text for group at startPos
function svRenameGroup(id,startPos,text){
  const arr=loadSaved();const s=arr.find(x=>x.id===id);if(!s)return;
  const ng=normalizeGroups(s.cards,s.groups||[]);
  let cursor=0;
  for(const g of ng){if(cursor===startPos){g.label=text;break;}cursor+=g.count;}
  s.groups=ng;storeSaved(arr);
}
// Draft spread group functions
// Always appends a new empty group at the end
function spAddGroup(){
  if(!spreadGroups.length){
    // No groups yet — wrap ALL cards in one group with empty label (one input appears)
    spreadGroups=[{label:'',count:spread.length}];
  } else {
    // Normalize first, then append a new empty group (avoid double-appending)
    const ng=normalizeGroups(spread,spreadGroups);
    const last=ng[ng.length-1];
    if(last&&!last.label&&last.count===0){/* already have empty group, just focus it */}
    else{ng.push({label:'',count:0});}
    spreadGroups=ng;
  }
  renderSpread();
  // Auto-focus the last group input
  setTimeout(()=>{
    const inputs=document.querySelectorAll('#sgrid .sp-group-input');
    if(inputs.length)inputs[inputs.length-1].focus();
  },30);
}
function spRemoveGroup(startPos){
  const ng=normalizeGroups(spread,spreadGroups);
  let cursor=0;
  for(const g of ng){if(cursor===startPos){g.label='';break;}cursor+=g.count;}
  const merged=[];
  for(const g of ng){
    if(!g.label&&merged.length&&!merged[merged.length-1].label){merged[merged.length-1].count+=g.count;}
    else{merged.push({...g});}
  }
  spreadGroups=merged.length===1&&!merged[0].label?[]:merged;
  renderSpread();
}
function spRenameGroup(startPos,text){
  const ng=normalizeGroups(spread,spreadGroups);
  let cursor=0;
  for(const g of ng){if(cursor===startPos){g.label=text;break;}cursor+=g.count;}
  spreadGroups=ng;// no renderSpread() — preserves input focus
}
function updCount(){
  document.getElementById('spill').textContent=spread.length;
  document.getElementById('spill2').textContent=spread.length;
}

// TABS
document.querySelectorAll('.tnav-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tnav-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));
  b.classList.add('active');
  document.getElementById(b.dataset.pg).classList.add('on');
  if(b.dataset.pg==='sp') renderSpread();
  if(b.dataset.pg==='saved') renderSaved();
}));

function renderCatalog(){
  const q=fsearch.toLowerCase().trim();
  const grid=document.getElementById('grid');
  const nr=document.getElementById('nores');
  const filtered=CARDS.map((c,i)=>({c,i})).filter(({c})=>{
    if(fblock!=='all'&&c.block!==fblock) return false;
    if(!q) return true;
    return String(c.num)===q||c.name.toLowerCase().includes(q);
  });
  document.getElementById('cnt').textContent=filtered.length+' карт';
  if(!filtered.length){grid.innerHTML='';nr.style.display='block';return;}
  nr.style.display='none';
  grid.innerHTML=filtered.map(({c,i})=>`
    <div class="card">
      <div class="cimg" onclick="openM(${i})">
        <img src="data:image/jpeg;base64,${c.img}" alt="${c.name}" loading="lazy">
        <span class="cbadge b-${c.block}">${bLabel(c.block)}</span>
      </div>
      <div class="ctitle" onclick="openM(${i})">
        <span class="cnum">${c.num}.</span>
        <span class="cname">${c.name}</span>
      </div>
      <div class="cdesc" onclick="openM(${i})">${c.desc.substring(0,280)}</div>
      <div class="cfoot">
        <button class="btn-add${inS(i)?' ins':''}" onclick="toggleS(${i})">${inS(i)?'✓ У розкладі':'＋ До розкладу'}</button>
        <button class="btn-view" onclick="openM(${i})">ℹ</button>
      </div>
    </div>`).join('');
}

// ── DRAG AND DROP ─────────────────────────────────────────────────────────────
let spDragPos=-1;
function spDragStart(e,pos){spDragPos=pos;e.dataTransfer.effectAllowed='move';setTimeout(()=>e.currentTarget.classList.add('sp-dragging'),0);}
function spDragEnd(e){spDragPos=-1;e.currentTarget.classList.remove('sp-dragging');document.querySelectorAll('.sp-dragover,.sv-dragover').forEach(el=>el.classList.remove('sp-dragover','sv-dragover'));}
function spDragOver(e,pos){e.preventDefault();e.stopPropagation();e.dataTransfer.dropEffect='move';e.currentTarget.classList.add('sp-dragover');}
function spDragLeave(e){e.currentTarget.classList.remove('sp-dragover');}
// Drop ON a card — card moves to same group, reorders before/after target
function spDrop(e,targetPos){
  e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('sp-dragover');
  if(spDragPos<0||spDragPos===targetPos)return;
  spMoveCard(spDragPos,targetPos,null);// null = same group as target
}
// Drop ON a group header — card moves to that group (appended at end of group)
function spDropGroup(e,toGi){
  e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('sp-dragover');
  if(spDragPos<0)return;
  const ng=normalizeGroups(spread,spreadGroups);
  let cursor=0,fromGi=-1;
  for(let gi=0;gi<ng.length;gi++){for(let j=0;j<ng[gi].count;j++){if(cursor===spDragPos)fromGi=gi;cursor++;}}
  if(fromGi===toGi)return;
  spMoveCard(spDragPos,-1,toGi);
}
function spMoveCard(fromPos,toPos,toGiOverride){
  const ng=normalizeGroups(spread,spreadGroups);
  let cursor=0,fromGi=-1,toGi=-1;
  for(let gi=0;gi<ng.length;gi++){
    for(let j=0;j<ng[gi].count;j++){
      if(cursor===fromPos)fromGi=gi;
      if(toPos>=0&&cursor===toPos)toGi=gi;
      cursor++;
    }
  }
  if(toGiOverride!==null)toGi=toGiOverride;
  const cardIdx=spread[fromPos];
  const newSpread=[...spread];
  newSpread.splice(fromPos,1);
  let insertAt;
  if(toPos>=0){insertAt=toPos>fromPos?toPos-1:toPos;}
  else{// append to end of toGi
    let c=0;for(let gi=0;gi<=toGi;gi++)c+=ng[gi].count;
    insertAt=Math.max(0,c-1+(toGi>fromGi?0:-1));
  }
  newSpread.splice(insertAt,0,cardIdx);
  spread=newSpread;
  if(ng.length&&fromGi>=0&&toGi>=0&&fromGi!==toGi){
    ng[fromGi].count--;ng[toGi].count++;
    spreadGroups=ng.filter(g=>g.count>0||g.label);
    if(spreadGroups.length===1&&!spreadGroups[0].label)spreadGroups=[];
  }
  updCount();renderCatalog();renderSpread();
}

// Saved spread DnD
let svDragInfo=null;// {sid, fromPos}
function svDragStart(e,sid,pos){svDragInfo={sid,pos};e.dataTransfer.effectAllowed='move';setTimeout(()=>e.currentTarget.classList.add('sp-dragging'),0);}
function svDragEnd(e){svDragInfo=null;e.currentTarget.classList.remove('sp-dragging');document.querySelectorAll('.sp-dragover,.sv-dragover').forEach(el=>el.classList.remove('sp-dragover','sv-dragover'));}
function svDragOver(e){e.preventDefault();e.stopPropagation();e.currentTarget.classList.add('sv-dragover');}
function svDragLeave(e){e.currentTarget.classList.remove('sv-dragover');}
function svDrop(e,sid,toPos){
  e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('sv-dragover');
  if(!svDragInfo||svDragInfo.sid!==sid||svDragInfo.pos===toPos)return;
  svMoveCard(sid,svDragInfo.pos,toPos,null);
}
function svDropGroup(e,sid,toGi){
  e.preventDefault();e.stopPropagation();e.currentTarget.classList.remove('sv-dragover');
  if(!svDragInfo||svDragInfo.sid!==sid)return;
  svMoveCard(sid,svDragInfo.pos,-1,toGi);
}
function svMoveCard(sid,fromPos,toPos,toGiOverride){
  const arr=loadSaved();const s=arr.find(x=>x.id===sid);if(!s)return;
  const ng=normalizeGroups(s.cards,s.groups||[]);
  let cursor=0,fromGi=-1,toGi=-1;
  for(let gi=0;gi<ng.length;gi++){
    for(let j=0;j<ng[gi].count;j++){
      if(cursor===fromPos)fromGi=gi;
      if(toPos>=0&&cursor===toPos)toGi=gi;
      cursor++;
    }
  }
  if(toGiOverride!==null)toGi=toGiOverride;
  const cardIdx=s.cards[fromPos];
  s.cards.splice(fromPos,1);
  let insertAt;
  if(toPos>=0){insertAt=toPos>fromPos?toPos-1:toPos;}
  else{let c=0;for(let gi=0;gi<=toGi;gi++)c+=ng[gi].count;insertAt=Math.max(0,c-1+(toGi>fromGi?0:-1));}
  s.cards.splice(insertAt,0,cardIdx);
  if(ng.length&&fromGi>=0&&toGi>=0&&fromGi!==toGi){
    ng[fromGi].count--;ng[toGi].count++;
    s.groups=ng.filter(g=>g.count>0||g.label);
    if(s.groups.length===1&&!s.groups[0].label)s.groups=[];
  }
  s.date=Date.now();storeSaved(arr);renderSaved();
}

// svAddGroupNew: always appends a new empty label group at the end
function svAddGroupNew(id){
  const arr=loadSaved();const s=arr.find(x=>x.id===id);if(!s)return;
  if(!s.groups||!s.groups.length){
    // Wrap all cards in one group with empty label
    s.groups=[{label:'',count:s.cards.length}];
  } else {
    const ng=normalizeGroups(s.cards,s.groups);
    const last=ng[ng.length-1];
    if(last&&!last.label&&last.count===0){/* already have empty group, just focus it */}
    else{ng.push({label:'',count:0});}
    s.groups=ng;
  }
  storeSaved(arr);renderSaved();
  // Auto-focus the last group input in this saved spread
  setTimeout(()=>{
    const inputs=document.querySelectorAll(`.sv-edit-groups-${id} .sv-group-input, [data-sid="${id}"] .sv-group-input`);
    if(inputs.length)inputs[inputs.length-1].focus();
    else{// fallback: find last sv-group-input in any saved spread edit block
      const all=document.querySelectorAll('.sv-group-input');
      if(all.length)all[all.length-1].focus();
    }
  },30);
}

function renderSpread(){
  const empty=document.getElementById('semp');
  const grid=document.getElementById('sgrid');
  if(!spread.length){empty.style.display='block';grid.innerHTML='';spreadGroups=[];return;}
  empty.style.display='none';
  const ng=normalizeGroups(spread,spreadGroups);
  let html='';let cardPos=0;
  const mkCard=(i,pos)=>{const c=CARDS[i];const bc=bColor(c.block);return `<div class="scard" draggable="true" ondragstart="spDragStart(event,${pos})" ondragend="spDragEnd(event)" ondragover="spDragOver(event,${pos})" ondragleave="spDragLeave(event)" ondrop="spDrop(event,${pos})" onclick="openM(${i})"><div class="scard-img"><img src="data:image/jpeg;base64,${c.img}" alt="${c.name}"></div><div class="scard-body"><div class="scard-num">№${c.num} · ${bLabel(c.block)}</div><div class="scard-name">${c.name}</div><div class="scard-badge" style="background:${bc}22;color:${bc};border:1px solid ${bc}44">${bLabel(c.block)}</div><div class="scard-desc formatted">${formatDesc(c.desc)}</div></div><button class="scard-rm" onclick="event.stopPropagation();removeS(${i})">✕ Видалити</button></div>`;};
  if(!ng.length){
    // No groups — cards then a small add button row
    html+=spread.map((i,p)=>mkCard(i,p)).join('');
    html+=`<div class="sp-addlbl-row"><button class="sp-addcard-btn-ungrouped" onclick="spOpenPickerForGroup(-1)">＋ Додати картку</button><button class="sp-addlbl-btn" onclick="spAddGroup()">＋ Нова мітка</button></div>`;
  } else {
    for(let gi=0;gi<ng.length;gi++){
      const g=ng[gi];const gStart=cardPos;
      // Group header with embedded + button (right side), also a drop target
      html+=`<div class="sp-group-row"><div class="sp-group-label-wrap sp-group-droptarget" ondragover="spDragOver(event,${cardPos})" ondragleave="spDragLeave(event)" ondrop="spDropGroup(event,${gi})"><input class="sp-group-input" data-start="${gStart}" maxlength="80" oninput="spRenameGroup(${gStart},this.value)" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()" placeholder="Назва мітки..." value="${(g.label||'').replace(/"/g,'&quot;')}"><button class="sp-group-addcard-icon" title="Додати картку" onclick="event.stopPropagation();spOpenPickerForGroup(${gi})">＋</button><button class="sp-group-del" onclick="spRemoveGroup(${gStart})">✕</button></div></div>`;
      for(let j=0;j<g.count;j++){
        html+=mkCard(spread[cardPos],cardPos);
        cardPos++;
      }
    }
    // "New label" button at the bottom
    html+=`<div class="sp-addlbl-row"><button class="sp-addlbl-btn" onclick="spAddGroup()">＋ Нова мітка</button></div>`;
  }
  grid.innerHTML=html;
}

function openM(i){
  mIdx=i;
  const c=CARDS[i];
  document.getElementById('mimg').src='data:image/jpeg;base64,'+c.img;
  const mb=document.getElementById('mbadge');
  mb.textContent=bLabel(c.block);mb.className='mbadge b-'+c.block;
  document.getElementById('mtitle').textContent=c.name;
  document.getElementById('mnum').textContent='Карта №'+c.num+' · '+bLabel(c.block)+' блок';
  document.getElementById('mdesc').innerHTML=formatDesc(c.desc);
  updMBtn();
  document.getElementById('mov').classList.add('on');
  document.body.style.overflow='hidden';
}
function updMBtn(){
  const b=document.getElementById('madd');
  if(inS(mIdx)){b.textContent='✓ У розкладі (натисніть щоб видалити)';b.classList.add('ins');}
  else{b.textContent='＋ Додати до розкладу';b.classList.remove('ins');}
}
function closeM(){document.getElementById('mov').classList.remove('on');document.body.style.overflow='';mIdx=-1;}
document.getElementById('mov').addEventListener('click',e=>{if(e.target===document.getElementById('mov'))closeM();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeM();});
document.getElementById('madd').addEventListener('click',()=>{if(mIdx>=0)toggleS(mIdx);});

function clearSearch(){
  const inp=document.getElementById('search');
  inp.value=''; fsearch='';
  document.getElementById('srch-clear').classList.remove('vis');
  renderCatalog();
  inp.focus();
}

document.getElementById('search').addEventListener('input',e=>{
  fsearch=e.target.value;
  document.getElementById('srch-clear').classList.toggle('vis', e.target.value.length>0);
  if(/^\d+$/.test(e.target.value.trim())){
    fblock='all';
    document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));
    document.querySelector('.fbtn[data-b="all"]').classList.add('active');
  }
  renderCatalog();
});
document.querySelectorAll('.fbtn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.fbtn').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');fblock=b.dataset.b;renderCatalog();
}));

renderCatalog();