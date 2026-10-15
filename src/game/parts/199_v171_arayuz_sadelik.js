/* ================= v171: arayüz sadeliği — tek Devam + tek "Maç gününe git", hızlı sonuç görünür, düzenli ayarlar ================= */
/* ana sayfa: üst çubukta "Maç gününe git" varken sayfadaki ikinci "Maç gününe ilerle" düğmesi gereksiz;
   telefonda alt çubukta DEVAM varken üstteki ikinci DEVAM gizlenir; hızlı sonuç düğmesi "Ayrıntılar" içinde saklanmaz */
const V171_QUICK=new Set(['simPlay','mgrSim','mgrCup','stMatch','refGo']);
function v171Hub(){try{if(!G||TAB!=='hub')return;const v=$('#view');if(!v)return;
    if(document.querySelector('#top .md-go'))v.querySelectorAll('button.btn[data-act=auto],button.btn[data-act=stAdv]').forEach(b=>{if(!b.classList.contains('cta'))b.remove();});
    const more=v.querySelector('details.hub-more');if(more){const q=[...more.querySelectorAll('button[data-act]')].filter(b=>V171_QUICK.has(b.dataset.act)&&!b.classList.contains('cta'));
      const main=[...v.querySelectorAll('.cta[data-act]')].find(b=>!more.contains(b));if(main&&q.length){let at=main;for(const b of q){at.insertAdjacentElement('afterend',b);at=b;b.classList.add('v171-q');}}}}catch(e){console.warn('v171 ana sayfa',e);}}
function v171Ust(){try{const fc=$('#top .fm-cont');if(!fc)return;const tabs=$('#tabs'),bc=tabs&&!tabs.hidden?tabs.querySelector('.tab.cont'):null;
    fc.classList.toggle('v171-gizli',!!(bc&&bc.offsetParent!==null&&window.innerWidth<=760));}catch(e){}}
render=(old=>function(){const r=old.apply(this,arguments);v171Hub();v171Ust();return r;})(render);
window.addEventListener('resize',()=>{v171Ust();});
/* ---------- ayarlar: maç / kontroller / görünüm / çevrimiçi / isim / kayıt sırası ---------- */
function v171AyarDuzen(){const mc=$('#modalCard');if(!mc||!mc.querySelector('[data-act=autofs],[data-act=rpTog],[data-act=themeTog]'))return;if(mc.querySelector('.v171-h'))return;
  const q=s=>mc.querySelector(s),lab=a=>{const i=q(`input[data-act=${a}]`);return i?i.closest('label'):null;};
  const sub=t=>{const p=document.createElement('p');p.className='sub-h v171-h';p.innerHTML=`<span>${t}</span>`;return p;};
  const ctlH=[...mc.querySelectorAll(':scope > p.sub-h')].find(p=>/Kontroller/i.test(p.textContent)),ctl=q(':scope > .ctl-entry'),oyunH=[...mc.querySelectorAll(':scope > p.sub-h')].find(p=>/^\s*Oyun\s*$/i.test(p.textContent));
  const plm=q(':scope > .plm-set'),ab=q(':scope > .ab-set'),mp=q(':scope > .mp-set'),rn=q(':scope > .rn'),rnH=rn&&rn.previousElementSibling&&rn.previousElementSibling.matches('p.sub-h')?rn.previousElementSibling:null,sv=q(':scope > .sv-box'),btns=q(':scope > .offer-btns');
  const L={fs:lab('autofs'),rp:lab('rpTog'),tr:lab('trscene'),ui:lab('uiTog'),th:lab('themeTog')};
  const pl=!!(G&&isPl());
  /* futbolcuda "Maç motoru" yalnız Pro ve Anlar modlarında iş görür */
  if(ab&&pl){const m=plMode();if(m!=='pro'&&m!=='moment')ab.hidden=true;else{const s=ab.querySelector('p, small');if(s&&!ab.querySelector('.v171-not'))s.insertAdjacentHTML('afterend','<small class="v171-not muted">Futbolcuda yalnız Pro ve Anlar modlarında kullanılır.</small>');}}
  const order=[];
  if(!(pl&&plm))order.push(sub('Maç'));if(pl&&plm)order.push(plm);if(ab)order.push(ab);for(const k of ['fs','rp','tr'])if(L[k])order.push(L[k]);
  if(ctl){order.push(ctlH||sub('Kontroller'));order.push(ctl);}
  order.push(sub('Görünüm'));for(const k of ['ui','th'])if(L[k])order.push(L[k]);
  if(mp)order.push(mp);if(rn){if(rnH)order.push(rnH);order.push(rn);}if(sv)order.push(sv);
  if(!pl&&plm)plm.hidden=true;
  const h3=q(':scope > h3');let at=h3||null;
  for(const el of order){if(!el)continue;if(at)at.insertAdjacentElement('afterend',el);else mc.prepend(el);at=el;}
  if(oyunH)oyunH.remove();if(btns)mc.appendChild(btns);}
openSettings=(old=>function(){const r=old.apply(this,arguments);try{v171AyarDuzen();}catch(e){console.warn('v171 ayarlar',e);}return r;})(openSettings);
/* mod değişince ayarlar yenilensin (maç motoru satırı moda göre görünür) */
if(ACTX.plMode)ACTX.plMode=(old=>function(el){const r=old.apply(this,arguments);try{if($('#modalCard .plm-set'))openSettings();}catch(e){}return r;})(ACTX.plMode);
