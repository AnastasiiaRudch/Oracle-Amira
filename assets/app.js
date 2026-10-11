let fblock='all', fsearch='', spread=[], mIdx=-1, currentSavedId=null;

// ── SAVED SPREADS (localStorage) ──────────────────────────────────────────
const LS_KEY='oracle_saved_spreads';
function loadSaved(){try{return JSON.parse(localStorage.getItem(LS_KEY)||'[]')}catch{return[]}}
function storeSaved(arr){try{localStorage.setItem(LS_KEY,JSON.stringify(arr))}catch{}}

function openSaveDialog(){
  if(!spread.length){alert('Розклад порожній — додайте картки перед збереженням.');return;}
  const inp=document.getElementById('sdlg-input');
  // Pre-fill with current spread name if editing a saved one
  inp.value=currentSavedId?getSavedById(currentSavedId)?.name||'':'';
  document.getElementById('sdlg-ov').classList.add('on');
  setTimeout(()=>inp.focus(),80);
}
function closeSaveDialog(){
  document.getElementById('sdlg-ov').classList.remove('on');
  document.getElementById('sdlg-input').value='';
}
function confirmSave(){
  const name=document.getElementById('sdlg-input').value.trim();
  if(!name)return;
  const arr=loadSaved();
  const now=Date.now();
  if(currentSavedId){
    // Update existing
    const idx=arr.findIndex(x=>x.id===currentSavedId);
    if(idx>=0){arr[idx]={id:currentSavedId,name,cards:spread.slice(),date:now};}
    else{arr.push({id:currentSavedId,name,cards:spread.slice(),date:now});}
  } else {
    const id='sp_'+now;
    arr.push({id,name,cards:spread.slice(),date:now});
    currentSavedId=id;
  }
  storeSaved(arr);
  closeSaveDialog();
  updNameBar();
  renderSaved();
}
function getSavedById(id){return loadSaved().find(x=>x.id===id)||null}
function loadSpread(id){
  const s=getSavedById(id);
  if(!s)return;
  spread=s.cards.slice();
  currentSavedId=id;
  updCount();updNameBar();renderCatalog();renderSpread();
  // Switch to spread tab
  document.querySelectorAll('.tnav-btn').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.page').forEach(x=>x.classList.remove('on'));
  document.querySelector('.tnav-btn[data-pg="sp"]').classList.add('active');
  document.getElementById('sp').classList.add('on');
}
function deleteSaved(id){
  if(!confirm('Видалити цей розклад?'))return;
  const arr=loadSaved().filter(x=>x.id!==id);
  storeSaved(arr);
  if(currentSavedId===id){currentSavedId=null;updNameBar();}
  renderSaved();
}
function detachSaved(){currentSavedId=null;updNameBar();}
function updNameBar(){
  const bar=document.getElementById('sp-name-bar');
  if(currentSavedId){
    const s=getSavedById(currentSavedId);
    if(s){document.getElementById('sp-name-text').textContent=s.name;bar.style.display='flex';return;}
  }
  bar.style.display='none';
}
function renderSaved(){
  const arr=loadSaved();
  const empty=document.getElementById('saved-empty');
  const list=document.getElementById('saved-list');
  if(!arr.length){empty.style.display='block';list.innerHTML='';return;}
  empty.style.display='none';
  list.innerHTML=arr.slice().reverse().map(s=>{
    const d=new Date(s.date);
    const dateStr=d.toLocaleDateString('uk-UA',{day:'2-digit',month:'2-digit',year:'numeric'});
    const preview=s.cards.slice(0,5).map(i=>`<img src="data:image/jpeg;base64,${CARDS[i].img}" alt="${CARDS[i].name}" title="${CARDS[i].name}">`).join('');
    const more=s.cards.length>5?`<span class="sv-more">+${s.cards.length-5}</span>`:'';
    const active=s.id===currentSavedId?' sv-active':'';
    return `<div class="sv-item${active}" data-id="${s.id}">
      <div class="sv-top">
        <div class="sv-info">
          <div class="sv-name">${s.name}</div>
          <div class="sv-meta">${s.cards.length} карт · ${dateStr}</div>
        </div>
        <div class="sv-btns">
          <button class="sv-btn sv-load" onclick="loadSpread('${s.id}')">Завантажити</button>
          <button class="sv-btn sv-del" onclick="deleteSaved('${s.id}')">🗑</button>
        </div>
      </div>
      <div class="sv-preview">${preview}${more}</div>
    </div>`;
  }).join('');
}

// Save dialog keyboard
document.addEventListener('keydown',e=>{
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