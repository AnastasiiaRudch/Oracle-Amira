let fblock='all', fsearch='', spread=[], mIdx=-1;

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
        <div class="scard-desc">${c.desc}</div>
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
  document.getElementById('mdesc').textContent=c.desc;
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

document.getElementById('search').addEventListener('input',e=>{
  fsearch=e.target.value;
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