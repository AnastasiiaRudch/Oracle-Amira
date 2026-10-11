let fblock='all', fsearch='', spread=[], mIdx=-1;
// Inline editing of saved spreads
let editingId=null, editReplaceIdx=null; // editReplaceIdx: card position to replace (null = add)

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
  arr.push({id:'sp_'+Date.now(),name,cards:spread.slice(),date:Date.now()});
  storeSaved(arr);
  spread=[];
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
function renderCardPicker(){
  const q=cpkSearch.toLowerCase().trim();
  const ov=document.getElementById('cpk-ov');
  const sid=ov.dataset.sid;
  const mode=ov.dataset.mode;
  const pos=parseInt(ov.dataset.pos);
  // Cards already in this spread (to show checkmark)
  const s=getSavedById(sid);
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
  const arr=loadSaved();
  const s=arr.find(x=>x.id===sid);
  if(!s)return;
  if(mode==='replace'){
    s.cards[pos]=cardIdx;
  } else {
    // add after pos
    s.cards.splice(pos,0,cardIdx);
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
        // Edit mode: ✕ + ⇄ on cards, single ＋ at the end
        let inner=s.cards.map((ci,pos)=>{
          const c=CARDS[ci];
          return `<div class="sv-card sv-card-edit">
            <img src="data:image/jpeg;base64,${c.img}" alt="${c.name}">
            <div class="sv-card-name">${c.name}</div>
            <div class="sv-card-actions">
              <button class="sv-ca-rm" title="Видалити" onclick="svRemoveCard('${s.id}',${pos})">✕</button>
              <button class="sv-ca-sw" title="Замінити" onclick="openCardPicker('${s.id}','replace',${pos})">⇄</button>
            </div>
          </div>`;
        }).join('');
        inner+=`<div class="sv-add-tile"><button class="sv-add-btn" onclick="openCardPicker('${s.id}','add',${s.cards.length})">＋</button></div>`;
        cardsHtml=`<div class="sv-cards sv-cards-edit">${inner}</div>`;
      } else {
        cardsHtml=`<div class="sv-cards">${s.cards.map((i,pos)=>{
          const c=CARDS[i];
          return `<div class="sv-card" onclick="openM(${i})">
            <img src="data:image/jpeg;base64,${c.img}" alt="${c.name}">
            <div class="sv-card-name">${c.name}</div>
          </div>`;
        }).join('')}</div>`;
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
  else spread.push(i);
  updCount(); renderCatalog(); renderSpread();
  if(mIdx===i) updMBtn();
}
function removeS(i){spread=spread.filter(x=>x!==i);updCount();renderCatalog();renderSpread();}
function clearSpread(){spread=[];updCount();renderCatalog();renderSpread();}
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

function renderSpread(){
  const empty=document.getElementById('semp');
  const grid=document.getElementById('sgrid');
  if(!spread.length){empty.style.display='block';grid.innerHTML='';return;}
  empty.style.display='none';
  grid.innerHTML=spread.map(i=>{
    const c=CARDS[i];
    const bc=bColor(c.block);
    return `<div class="scard" onclick="openM(${i})">
      <div class="scard-img"><img src="data:image/jpeg;base64,${c.img}" alt="${c.name}"></div>
      <div class="scard-body">
        <div class="scard-num">№${c.num} · ${bLabel(c.block)}</div>
        <div class="scard-name">${c.name}</div>
        <div class="scard-badge" style="background:${bc}22;color:${bc};border:1px solid ${bc}44">${bLabel(c.block)}</div>
        <div class="scard-desc formatted">${formatDesc(c.desc)}</div>
      </div>
      <button class="scard-rm" onclick="event.stopPropagation();removeS(${i})">✕ Видалити з розкладу</button>
    </div>`;
  }).join('');
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