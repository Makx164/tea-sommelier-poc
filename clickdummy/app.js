/* Tee-Sommelier Clickdummy – rein clientseitig, alle Daten sind Mock-Daten. */
(function(){
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const eur = n => n.toFixed(2).replace('.', ',') + ' €';

const state = { symptoms:[], free:'', nogos:'', effects:[], tastes:[], caffeine:'nein', blend:null, size:100, qty:1, cart:[] };

/* ---------- Mock-Kräuterdatenbank (Beispieltexte, keine Heilversprechen) ---------- */
const HERBS = {
  'Melisse':{ic:'🌿',eff:'traditionell zur Entspannung und bei innerer Unruhe genutzt',c:'#6aa84f'},
  'Kamille':{ic:'🌼',eff:'mild, wohltuend für Magen und Bauch',c:'#f1c232'},
  'Lavendel':{ic:'💜',eff:'blumige Note, klassisch für ruhige Abende',c:'#8e7cc3'},
  'Zitronengras':{ic:'🍋',eff:'frisch-zitronig, rundet den Geschmack ab',c:'#c5d86d'},
  'Pfefferminze':{ic:'🌱',eff:'kühlend und klärend, gut nach dem Essen',c:'#38a169'},
  'Ingwer':{ic:'🫚',eff:'wärmt von innen, leicht scharf',c:'#d69e2e'},
  'Fenchel':{ic:'🌾',eff:'traditionell bei Völlegefühl verwendet',c:'#9ac27c'},
  'Rooibos':{ic:'🍂',eff:'koffeinfreie, leicht süßliche Basis',c:'#b45f3b'},
  'Zimt':{ic:'🪵',eff:'würzig-süß, wärmendes Aroma',c:'#8b5a2b'},
  'Hagebutte':{ic:'🌹',eff:'fruchtig-säuerlich, enthält Vitamin C',c:'#e06666'},
  'Holunderblüten':{ic:'🤍',eff:'klassisch in Erkältungstees',c:'#e8e2c9'},
  'Lindenblüten':{ic:'🍃',eff:'mild-blumig, beliebt in der kalten Jahreszeit',c:'#b6d7a8'},
  'Rosmarin':{ic:'🌲',eff:'herb-aromatisch, für einen wachen Kopf',c:'#45818e'},
  'Grüner Tee (Sencha)':{ic:'🍵',eff:'enthält Koffein – sanft belebend',c:'#2f6b3a'},
  'Mate':{ic:'🧉',eff:'enthält Koffein – anregend, rauchig',c:'#7f9b4a'},
  'Orangenschale':{ic:'🍊',eff:'fruchtige Süße ohne Zucker',c:'#f6a23a'},
  'Apfelstücke':{ic:'🍎',eff:'natürliche, fruchtige Süße',c:'#cc4125'},
  'Kardamom':{ic:'🟢',eff:'orientalisch-würzige Note',c:'#93c47d'},
  'Hibiskus':{ic:'🌺',eff:'tiefrote Farbe, fruchtig-herb',c:'#a61c3c'},
  'Süßholz':{ic:'🍬',eff:'natürliche Süße, macht die Mischung mild',c:'#c9a66b'},
};

/* Basismischungen je Hauptwirkung (Mock) */
const BASES = {
  'beruhigend':{name:'Abendruhe',desc:'Eine sanfte Kräutermischung für den Feierabend – blumig, mild und mit frischer Zitrusnote.',
     mix:[['Melisse',35],['Kamille',25],['Zitronengras',20],['Lavendel',10],['Orangenschale',10]],temp:'95 °C',time:'6–8 Min.',dose:'2 TL',
     tip:'Tipp: Am besten 30–60 Minuten vor dem Schlafengehen genießen.'},
  'belebend':{name:'Morgenfrische',desc:'Frisch, klar und spritzig – ein Kräutertee, der dich sanft in den Tag bringt.',
     mix:[['Pfefferminze',35],['Zitronengras',25],['Ingwer',20],['Rosmarin',10],['Orangenschale',10]],temp:'95 °C',time:'5–7 Min.',dose:'2 TL',
     tip:'Tipp: Schmeckt auch kalt aufgegossen mit einer Scheibe Zitrone.'},
  'wärmend':{name:'Winterglut',desc:'Würzig-wärmend mit Ingwer und Zimt auf einer Rooibos-Basis – perfekt für kalte Tage.',
     mix:[['Rooibos',35],['Ingwer',25],['Zimt',20],['Kardamom',10],['Orangenschale',10]],temp:'100 °C',time:'7–10 Min.',dose:'2 TL',
     tip:'Tipp: Mit einem Schuss Hafermilch wird daraus ein cremiger Chai-Ersatz.'},
  'Immunsystem':{name:'Abwehrkraft',desc:'Fruchtig-blumige Mischung mit Hagebutte und Holunderblüten für die Erkältungszeit.',
     mix:[['Hagebutte',30],['Holunderblüten',25],['Ingwer',20],['Lindenblüten',15],['Zitronengras',10]],temp:'100 °C',time:'8–10 Min.',dose:'2–3 TL',
     tip:'Tipp: Bedeckt ziehen lassen, damit die ätherischen Öle im Tee bleiben.'},
  'Fokus':{name:'Klarer Kopf',desc:'Minzig-frisch mit einem Hauch Rosmarin – für konzentrierte Arbeitsphasen.',
     mix:[['Pfefferminze',30],['Melisse',25],['Zitronengras',20],['Rosmarin',15],['Orangenschale',10]],temp:'95 °C',time:'5–7 Min.',dose:'2 TL',
     tip:'Tipp: Ideal in einer Thermoskanne für den Schreibtisch.'},
};

function buildBlend(){
  const primary = state.effects[0] || 'beruhigend';
  const b = JSON.parse(JSON.stringify(BASES[primary]));
  let mix = b.mix;
  const nogo = state.nogos.toLowerCase();
  const swap = (from,to) => { const i = mix.findIndex(m=>m[0]===from); if(i>-1 && !mix.some(m=>m[0]===to)) mix[i][0]=to; };
  // Symptom-Feinjustierung
  if(state.symptoms.includes('Verdauung')) swap('Orangenschale','Fenchel');
  if(state.symptoms.includes('Erkältung') && primary!=='Immunsystem') swap('Zitronengras','Holunderblüten');
  // Geschmack
  if(state.tastes.includes('fruchtig')) { swap('Rosmarin','Apfelstücke'); swap('Kardamom','Hibiskus'); swap('Lavendel','Apfelstücke'); }
  if(state.tastes.includes('würzig') && primary!=='wärmend') swap('Orangenschale','Zimt');
  if(state.tastes.includes('mild')) swap('Rosmarin','Süßholz');
  // Koffein
  if(state.caffeine==='ja' && ['belebend','Fokus'].includes(primary)){
    mix[0] = [primary==='Fokus'?'Grüner Tee (Sencha)':'Mate', mix[0][1]];
    mix.unshift(mix.splice(0,1)[0]);
    b.temp = '80 °C'; b.time = '2–3 Min.';
  } else if(state.caffeine==='ja'){
    const last = mix.length-1; mix[last] = ['Grüner Tee (Sencha)', mix[last][1]];
  }
  // No-Gos (z. B. "kein Ingwer") ersetzen
  Object.keys(HERBS).forEach(h=>{
    const key = h.split(' ')[0].toLowerCase();
    if(nogo.includes(key)){
      const alt = ['Zitronengras','Apfelstücke','Rooibos','Lindenblüten','Süßholz'].find(a=>!mix.some(m=>m[0]===a) && !nogo.includes(a.toLowerCase()));
      mix = mix.map(m=> m[0]===h && alt ? [alt,m[1]] : m);
    }
  });
  mix.sort((a,b)=>b[1]-a[1]);
  b.mix = mix;
  b.price = state.caffeine==='ja' ? 9.90 : 8.90;
  return b;
}

function sizePrice(g, per100){ return ({50: per100*0.55, 100: per100, 250: per100*2.24})[g]; }
function round90(x){ return Math.round(x)-0.10; }

/* ---------- Navigation ---------- */
function go(id){
  if(id==='result' && !state.blend) id='start';
  $$('.screen').forEach(s=>s.classList.toggle('active', s.id==='screen-'+id));
  if(location.hash!=='#'+id) history.replaceState(null,'','#'+id);
  window.scrollTo(0,0);
  if(id==='cart') renderCart();
}
document.addEventListener('click', e=>{
  const t = e.target.closest('[data-go]');
  if(t){ e.preventDefault(); go(t.dataset.go); }
});

/* ---------- Schritt 1 ---------- */
function toggleIn(arr,v){ const i=arr.indexOf(v); i>-1?arr.splice(i,1):arr.push(v); }
$$('#symptomChips .chip').forEach(c=>c.addEventListener('click',()=>{ toggleIn(state.symptoms,c.dataset.val); c.classList.toggle('active'); $('#err1').hidden=true; }));
$('#toStep2').addEventListener('click',()=>{
  state.free=$('#freetext').value.trim(); state.nogos=$('#nogos').value.trim();
  if(!state.symptoms.length && !state.free){ $('#err1').hidden=false; return; }
  // Vorschlag für Wirkung, falls noch nichts gewählt
  if(!state.effects.length){
    const s=state.symptoms; let pre=null;
    if(s.includes('Stress')||s.includes('Schlafprobleme')||s.includes('Innere Unruhe')) pre='beruhigend';
    else if(s.includes('Erkältung')) pre='Immunsystem';
    else if(s.includes('Müdigkeit')) pre='belebend';
    else if(s.includes('Konzentration')) pre='Fokus';
    if(pre){ state.effects=[pre]; renderTiles(); }
  }
  go('step2');
});

/* ---------- Schritt 2 ---------- */
function renderTiles(){
  $$('#effectTiles .tile').forEach(t=>{
    const i=state.effects.indexOf(t.dataset.val);
    t.classList.toggle('active',i>-1);
    let r=t.querySelector('.rank'); if(r) r.remove();
    if(i>-1){ r=document.createElement('span'); r.className='rank'; r.textContent=i+1; t.appendChild(r); }
  });
}
$$('#effectTiles .tile').forEach(t=>t.addEventListener('click',()=>{ toggleIn(state.effects,t.dataset.val); renderTiles(); $('#err2').hidden=true; }));
$$('#tasteChips .chip').forEach(c=>c.addEventListener('click',()=>{ toggleIn(state.tastes,c.dataset.val); c.classList.toggle('active'); }));
$$('#caffeineSeg .seg-btn').forEach(b=>b.addEventListener('click',()=>{ state.caffeine=b.dataset.val; $$('#caffeineSeg .seg-btn').forEach(x=>x.classList.toggle('active',x===b)); }));
$('#toLoading').addEventListener('click',()=>{
  if(!state.effects.length){ $('#err2').hidden=false; return; }
  startLoading();
});

/* ---------- Ladebildschirm ---------- */
let loadTimer=null;
function startLoading(){
  go('loading');
  const steps=$$('#loadSteps li'); steps.forEach(s=>s.className='');
  const bar=$('#loadBar'); bar.style.transition='none'; bar.style.width='0%';
  let i=0; clearInterval(loadTimer);
  const dur = window.__FAST__ ? 150 : 900;
  steps[0].className='doing';
  requestAnimationFrame(()=>{ bar.style.transition=`width ${dur*steps.length}ms linear`; bar.style.width='100%'; });
  loadTimer=setInterval(()=>{
    steps[i].className='done'; i++;
    if(i<steps.length){ steps[i].className='doing'; }
    else { clearInterval(loadTimer); setTimeout(showResult, 250); }
  }, dur);
}

/* ---------- Ergebnis ---------- */
function showResult(){
  const b = state.blend = buildBlend();
  $('#blendName').textContent = b.name;
  const tasteTxt = state.tastes.length ? ` Abgestimmt auf deinen Geschmack: ${state.tastes.join(', ')}.` : '';
  $('#blendDesc').textContent = b.desc + tasteTxt;
  const tags = [...state.symptoms.map(s=>'Bei: '+s), ...state.effects.map(e=>'Wirkung: '+e), state.caffeine==='ja'?'mit Koffein':'koffeinfrei'];
  $('#blendTags').innerHTML = tags.map(t=>`<span class="tag">${t}</span>`).join('');
  // Donut
  let acc=0; const segs=b.mix.map(([n,p])=>{ const s=`${HERBS[n].c} ${acc}% ${acc+p}%`; acc+=p; return s; });
  $('#donut').style.background=`conic-gradient(${segs.join(',')})`;
  $('#legend').innerHTML=b.mix.map(([n,p])=>`<li><i style="background:${HERBS[n].c}"></i>${n.replace(' (Sencha)','')} ${p} %</li>`).join('');
  $('#ingredients').innerHTML=b.mix.map(([n,p])=>`<li><span class="ing-ic">${HERBS[n].ic}</span><span><div class="ing-name">${n}</div><div class="ing-eff">${HERBS[n].eff}</div></span><span class="ing-pct">${p} %</span></li>`).join('');
  $('#brewDose').textContent=b.dose; $('#brewTemp').textContent=b.temp; $('#brewTime').textContent=b.time; $('#brewTip').textContent=b.tip;
  // Preise
  $$('#sizes .size').forEach(s=>{ s.querySelector('small').textContent=eur(round90(sizePrice(+s.dataset.g,b.price))); });
  state.size=100; state.qty=1; updateBuy();
  go('result');
}
function updateBuy(){
  const b=state.blend; if(!b) return;
  $$('#sizes .size').forEach(s=>s.classList.toggle('active', +s.dataset.g===state.size));
  const unit = round90(sizePrice(state.size,b.price));
  $('#price').textContent = eur(unit*state.qty);
  $('#per').textContent = `/ ${state.qty>1?state.qty+' × ':''}${state.size} g`;
  $('#baseprice').textContent = eur(unit/state.size*100)+' / 100 g';
  $('#qVal').textContent = state.qty;
}
$$('#sizes .size').forEach(s=>s.addEventListener('click',()=>{ state.size=+s.dataset.g; updateBuy(); }));
$('#qMinus').addEventListener('click',()=>{ state.qty=Math.max(1,state.qty-1); updateBuy(); });
$('#qPlus').addEventListener('click',()=>{ state.qty=Math.min(9,state.qty+1); updateBuy(); });
$('#addCart').addEventListener('click',()=>{
  const b=state.blend; const unit=round90(sizePrice(state.size,b.price));
  const ex=state.cart.find(c=>c.name===b.name && c.size===state.size);
  if(ex) ex.qty+=state.qty; else state.cart.push({name:b.name,size:state.size,qty:state.qty,unit,mix:b.mix.map(m=>m[0].replace(' (Sencha)','')).join(', ')});
  updateCount();
  const t=$('#toast'); t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1400);
  setTimeout(()=>go('cart'), window.__FAST__?50:700);
});
function updateCount(){ const n=state.cart.reduce((a,c)=>a+c.qty,0); const el=$('#cartCount'); el.textContent=n; el.classList.toggle('zero',n===0); }

/* ---------- Warenkorb ---------- */
function totals(){ const sub=state.cart.reduce((a,c)=>a+c.unit*c.qty,0); const ship = sub===0||sub>=25?0:3.90; return {sub,ship,total:sub+ship}; }
function renderCart(){
  const box=$('#cartItems');
  if(!state.cart.length){ box.innerHTML='<h3>Dein Warenkorb</h3><p class="empty">Noch leer – stell dir zuerst deinen Tee zusammen.<br><br><button class="btn btn-primary" data-go="step1">Meinen Tee zusammenstellen</button></p>'; }
  else box.innerHTML='<h3>Dein Warenkorb</h3>'+state.cart.map((c,i)=>`<div class="cart-item"><div class="pack">🌱</div><div><div class="ci-name">${c.name} · ${c.size} g</div><div class="ci-meta">${c.mix}</div><div class="ci-meta">Menge: ${c.qty} × ${eur(c.unit)} · <button class="remove" data-rm="${i}">Entfernen</button></div></div><div class="ci-price">${eur(c.unit*c.qty)}</div></div>`).join('');
  const t=totals();
  $('#sumSub').textContent=eur(t.sub); $('#sumShip').textContent=t.ship?eur(t.ship):'kostenlos'; $('#sumTotal').textContent=eur(t.total);
  $('#shipHint').textContent = t.sub>0 && t.sub<25 ? `Noch ${eur(25-t.sub)} bis zum kostenlosen Versand.` : (t.sub>=25?'🎉 Kostenloser Versand ab 25 €':'');
  $('#placeOrder').disabled=!state.cart.length; $('#placeOrder').style.opacity=state.cart.length?1:.5;
  $$('[data-rm]').forEach(b=>b.addEventListener('click',()=>{ state.cart.splice(+b.dataset.rm,1); updateCount(); renderCart(); }));
}
$('#placeOrder').addEventListener('click',()=>{
  if(!state.cart.length) return;
  const t=totals();
  $('#doneName').textContent=state.cart.map(c=>c.name).filter((v,i,a)=>a.indexOf(v)===i).join(' & ');
  $('#orderNo').textContent='TS-2026-'+String(Math.floor(1000+Math.random()*9000));
  $('#doneTotal').textContent=eur(t.total);
  const d=new Date(); d.setDate(d.getDate()+3); if(d.getDay()===0) d.setDate(d.getDate()+1);
  $('#doneDate').textContent=d.toLocaleDateString('de-DE',{weekday:'long',day:'numeric',month:'long'});
  state.cart=[]; updateCount();
  go('done');
});

window.addEventListener('hashchange',()=>{ const h=location.hash.slice(1); if(h && h!=='loading' && document.getElementById('screen-'+h) && !document.getElementById('screen-'+h).classList.contains('active')) go(h); });
updateCount();
const start=(location.hash||'#start').slice(1);
go(['start','step1','cart'].includes(start)?start:'start');
})();
