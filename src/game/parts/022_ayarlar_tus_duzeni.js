/* ================= ayarlar: tuş düzeni ================= */
const SET_KEY='kariyer-ayarlar';
function setsGet(){try{return JSON.parse(localStorage.getItem(SET_KEY)||'{}')||{};}catch(e){return {};}}
function setsPut(o){try{localStorage.setItem(SET_KEY,JSON.stringify(o));}catch(e){}}
const LAY_DEF={a:{r:14,b:30,s:86},b:{r:112,b:16,s:68},c:{r:30,b:132,s:64},d:{r:124,b:104,s:58}};
const LAY_LBL={atk:{a:'ŞUT',b:'PAS',c:'KOŞ',d:null},def:{a:'KAY',b:'MÜDAHALE',c:'KOŞ',d:'PRES'}};
function layOf(g){const s=setsGet(),L=(s.lay&&s.lay[g])||{};const o={};for(const k of ['a','b','c','d'])o[k]=Object.assign({},LAY_DEF[k],L[k]||{});return o;}
function applyLayout(g){const L=layOf(g),cust=!!(setsGet().lay&&setsGet().lay[g]);for(const k of ['a','b','c','d']){const el=document.getElementById('btn'+k.toUpperCase());if(!el)continue;if(!cust){el.style.right=el.style.bottom='';continue;}el.style.right=L[k].r+'px';el.style.bottom=L[k].b+'px';}}
let LAYG='atk';
function openSettings(){const L=layOf(LAYG),lb=LAY_LBL[LAYG];
  openModal(`<h3>Ayarlar</h3><p class="sub-h" style="margin:4px 0 8px"><span>Tuş düzeni</span><span>Sürükleyerek taşı</span></p>
  <div class="filt">${[['atk','Hücum'],['def','Savunma']].map(([k,l])=>`<button class="chip" data-act="layG" data-k="${k}" aria-pressed="${LAYG===k}">${l}</button>`).join('')}</div>
  <div class="lay-ed" id="layEd"><div class="lay-joy">JOY</div>${['c','b','a','d'].filter(k=>lb[k]).map(k=>`<div class="lay-b lb-${k}" data-k="${k}" style="right:${L[k].r}px;bottom:${L[k].b}px;width:${L[k].s}px;height:${L[k].s}px"><span>${lb[k]}</span></div>`).join('')}</div>
  <p class="muted" style="margin:6px 0 10px">Düzen maç ekranında sağ alttaki tuş alanına uygulanır. ${LAYG==='def'?'Savunma anlarında (müdahale, kayma, pres) bu düzen kullanılır.':'Topla oynarken, duran toplarda ve hava toplarında bu düzen kullanılır.'}</p>
  <div class="offer-btns"><button class="btn" data-act="layReset">Varsayılana dön</button><button class="cta sm" data-act="closeModal">Kaydet ve kapat</button></div>
  <p class="sub-h" style="margin:14px 0 6px"><span>Oyun</span></p>
  ${fsOK()?`<label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="autofs" ${G&&G.autoFS===false?'':'checked'}> Maça çıkınca otomatik tam ekran</label>`:''}
  <label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="themeTog" ${setsGet().theme==='klasik'?'':'checked'}> Profesyonel arayüz (FM tarzı)</label>
  <label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="rpTog" ${setsGet().rp===false?'':'checked'}> Gollerden sonra ağır çekim tekrar</label>
  ${G&&isPl()?`<label class="hurt" style="margin:0"><input type="checkbox" data-act="trscene" ${G.trScene!==false?'checked':''}> Maç önü idmanını sahada oyna</label>`:''}
  ${G?`<p class="sub-h" style="margin:14px 0 6px"><span>Kariyerdeki ismin</span></p><div class="rn"><input id="rnIn" value="${esc(G.p.name||'')}" maxlength="28" autocomplete="off"><button class="btn" data-act="rename">Kaydet</button></div>`:''}<div class="offer-btns" style="margin-top:12px"><button class="btn" data-act="help">Nasıl oynanır?</button>${G?'<button class="btn" data-act="toMenu">Kariyer seçimine dön</button>':''}</div>`);layDrag();}
function layDrag(){const ed=$('#layEd');if(!ed)return;ed.querySelectorAll('.lay-b').forEach(b=>{let pid=null,sx=0,sy=0,r0=0,b0=0;
  b.addEventListener('pointerdown',e=>{pid=e.pointerId;b.setPointerCapture(pid);sx=e.clientX;sy=e.clientY;r0=parseFloat(b.style.right);b0=parseFloat(b.style.bottom);b.classList.add('drag');e.preventDefault();});
  b.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;const W0=ed.clientWidth,H0=ed.clientHeight,s=b.offsetWidth;const r=clamp(r0-(e.clientX-sx),2,W0-s-2),bt=clamp(b0-(e.clientY-sy),2,H0-s-2);b.style.right=r+'px';b.style.bottom=bt+'px';});
  const up=e=>{if(e.pointerId!==pid)return;pid=null;b.classList.remove('drag');const s=setsGet();s.lay=s.lay||{};const cur=layOf(LAYG);cur[b.dataset.k].r=Math.round(parseFloat(b.style.right));cur[b.dataset.k].b=Math.round(parseFloat(b.style.bottom));s.lay[LAYG]=cur;setsPut(s);};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);});}

