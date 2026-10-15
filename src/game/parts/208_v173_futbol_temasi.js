/* ================= v173: futbol teması — oyuna özgü görünüm (gece maçı çimi, tebeşir çizgileri, skorbord) ve Ayarlar → Görünüm'de tema seçici ================= */
/* Üç tema: 'futbol' (yeni, varsayılan), 'pro' (profesyonel, mor paneller), 'klasik'.
   Kayıt: setsGet().theme. Hiç seçilmemişse (undefined) futbol; daha önce açıkça seçilmiş 'klasik' ya da 'pro' korunur.
   Yalnız görünüm katmanı: body'ye .fut / .pro sınıfı verilir, gerisi style.css'teki "v173 tema" bloklarında. */
const TEMA_L=[['futbol','Futbol','yeni'],['pro','Profesyonel','mevcut'],['klasik','Klasik','']];
function temaAd(){const t=setsGet().theme;return t==='klasik'||t==='pro'?t:'futbol';}
applyTheme=(old=>function(){let r;try{r=old.apply(this,arguments);}catch(e){}
  try{const t=temaAd(),b=document.body;if(b){b.classList.toggle('pro',t==='pro');b.classList.toggle('fut',t==='futbol');}document.documentElement.setAttribute('data-tema',t);}catch(e){}return r;})(applyTheme);
/* Ayarlar: eski "Profesyonel arayüz" onay kutusu yerine tek seçimli tema düğmeleri (Görünüm başlığı altında, v171 düzeni korunur) */
function temaSecHTML(){const k=temaAd();
  return `<div class="thm-set" role="radiogroup" aria-label="Arayüz teması"><span class="field-label">Arayüz teması</span><div class="thm-chips">${TEMA_L.map(([v,a,n])=>`<button type="button" class="chip thm-c thm-${v}" role="radio" data-act="temaSec" data-v="${v}" aria-pressed="${k===v}" aria-checked="${k===v}"><i class="thm-sw" aria-hidden="true"></i><span>${a}${n?` <small>(${n})</small>`:''}</span></button>`).join('')}</div></div>`;}
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc||mc.querySelector('.thm-set'))return r;
    const i=mc.querySelector('input[data-act=themeTog]'),lab=i&&i.closest('label');
    if(lab)lab.insertAdjacentHTML('afterend',temaSecHTML()),lab.remove();
    else{const h=[...mc.querySelectorAll('p.sub-h')].find(p=>/Görünüm/i.test(p.textContent));if(!h)return r;
      const w=mc.querySelector('.wgp-set');(w&&w.previousElementSibling===h?w:h).insertAdjacentHTML('afterend',temaSecHTML());}}catch(e){console.warn('v173 tema ayarı',e);}return r;})(openSettings);
ACTX.temaSec=el=>{const v=el.dataset.v,T=TEMA_L.find(x=>x[0]===v);if(!T)return;const s=setsGet();s.theme=v;setsPut(s);applyTheme();
  document.querySelectorAll('[data-act=temaSec]').forEach(b=>{const on=b.dataset.v===v;b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-checked',String(on));});
  try{toast(`Tema: ${T[1]}`);}catch(e){}};
try{applyTheme();}catch(e){}
