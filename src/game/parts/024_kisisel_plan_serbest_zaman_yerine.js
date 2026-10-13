/* ================= kişisel plan (serbest zaman yerine) ================= */
const PLAN_MODES={denge:{n:'Dengeli',d:'Kondisyon iyiyse bireysel idman, yorgunsan dinlenme.'},idman:{n:'Gelişim odaklı',d:'Her gün bireysel idman. Kondisyon çok düşerse dinlenir.'},dinlen:{n:'Dinlenme',d:'Ekstra idman yok; kondisyon hızlı toplanır.'}};
function planHTML(){const p=G.p,pl=G.plan,m=pl.mode||'denge';
  return `<section class="panel"><p class="sub-h"><span>Kişisel plan</span><span>Her gün otomatik</span></p>
  <div class="plan-row"><div><b>${PLAN_MODES[m].n}</b><small>${p.injury?'Sakatlık süresince plan yerine rehabilitasyon uygulanır.':m==='dinlen'?PLAN_MODES[m].d:`Odak: ${ATTR[pl.focus]} · ${INT[pl.int==='yogun'?'yogun':pl.int||'normal'].n} yoğunluk`}</small></div><button class="btn sm" data-act="planEdit">Düzenle</button></div>
  ${G.slotText?`<p class="slot-res">Bugün: ${esc(G.slotText)}</p>`:''}</section>`;}
function planEdit(){const pl=G.plan;openModal(`<h3>Kişisel plan</h3><p>Plan her gün kendiliğinden uygulanır; her gün seçim yapmana gerek yok.</p>
  <div class="seg">${Object.entries(PLAN_MODES).map(([k,v])=>`<button class="chip" data-act="planMode" data-k="${k}" aria-pressed="${(pl.mode||'denge')===k}">${v.n}<small>${v.d}</small></button>`).join('')}</div>
  <p class="sub-h" style="margin:10px 0 4px"><span>Odak özellik</span></p><div class="chips">${Object.keys(ATTR).map(k=>`<button class="chip" data-act="planFocus" data-k="${k}" aria-pressed="${pl.focus===k}">${ATTR[k]}</button>`).join('')}</div>
  <p class="sub-h" style="margin:10px 0 4px"><span>Yoğunluk</span></p><div class="chips">${Object.entries(INT).map(([k,v])=>`<button class="chip" data-act="planInt" data-k="${k}" aria-pressed="${(pl.int||'normal')===k}">${v.n}<small>kondisyon −${v.e}</small></button>`).join('')}</div>
  <button class="cta" data-act="closeModal" style="margin-top:12px">Tamam</button>`);}
function autoPlan(){const p=G.p;if(G.slot)return;const m=G.plan.mode||'denge';if(p.injury)return doFree('rehab',null,true);
  if(m==='dinlen')return doFree('rest',null,true);if(p.energy<(m==='idman'?30:55))return doFree('rest',null,true);
  return doFree('indiv',{k:G.plan.focus,int:G.plan.int||'normal'},true);}

