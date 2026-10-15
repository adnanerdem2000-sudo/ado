/* ================= v173: maaş gösterimi tercihi — yıllık / aylık / haftalık (Ayarlar › Görünüm) ================= */
/* İç birim değişmez (haftalık); yalnız ekranda hangi dönemin öne çıkacağı seçilir. */
const WGP={yil:['yıllık','/yıl',52],ay:['aylık','/ay',52/12],hf:['haftalık','/hf',1]};
function wgPer(){try{const v=setsGet().wgp;return WGP[v]?v:'yil';}catch(e){return 'yil';}}
function wgPerAmt(we,k){return we*WGP[k][2];}
wgH=function(we,o){we=+we||0;if(we<=0)return (o&&o.zero)||'Ücret yok';const k=wgPer(),alt=k==='yil'?'hf':'yil';
  return `${amtFmt(wgPerAmt(we,k))}<small class="wg-hf">${WGP[k][1]} · ${amtFmt(wgPerAmt(we,alt))}${WGP[alt][1]}</small>`;};
wgT=function(we,o){we=+we||0;if(we<=0)return (o&&o.zero)||'ücret yok';const k=wgPer(),alt=k==='yil'?'hf':'yil';
  return `${amtFmt(wgPerAmt(we,k))}${WGP[k][1]} (${amtFmt(wgPerAmt(we,alt))}${WGP[alt][1]})`;};
wgWallet=function(u){const we=(+u||0)/EUR_TL,k=wgPer(),alt=k==='yil'?'hf':'yil',n=WGP[k][0];
  return we>0?`<div><b>${amtFmt(wgPerAmt(we,k))}</b><span>${n[0].toUpperCase()+n.slice(1)} maaş · ${amtFmt(wgPerAmt(we,alt))}${WGP[alt][1]}</span></div>`:`<div><b>Ücret yok</b><span>${isPl()?'Amatör lisans':'Sözleşme yok'}</span></div>`;};
/* Ayarlar: Görünüm başlığının altına dönem seçici */
function wgPerHTML(){const k=wgPer();return `<div class="wgp-set"><span class="field-label">Maaş gösterimi</span><div class="chips">${Object.entries(WGP).map(([v,a])=>`<button class="chip" data-act="wgPer" data-v="${v}" aria-pressed="${k===v}">${a[0][0].toUpperCase()+a[0].slice(1)}</button>`).join('')}</div></div>`;}
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc||mc.querySelector('.wgp-set'))return r;
    const h=[...mc.querySelectorAll('p.sub-h')].find(p=>/Görünüm/i.test(p.textContent));if(h)h.insertAdjacentHTML('afterend',wgPerHTML());
    else{const ob=mc.querySelector(':scope > .offer-btns');if(ob)ob.insertAdjacentHTML('beforebegin',wgPerHTML());}}catch(e){console.warn('v173 maaş ayarı',e);}return r;})(openSettings);
ACTX.wgPer=el=>{const v=el.dataset.v;if(!WGP[v])return;const s=setsGet();s.wgp=v;setsPut(s);
  document.querySelectorAll('[data-act=wgPer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===v)));
  toast(`Maaşlar ${WGP[v][0]} gösteriliyor`);try{render();}catch(e){}};
