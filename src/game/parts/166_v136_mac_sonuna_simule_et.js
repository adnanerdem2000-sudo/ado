/* ================= v136: 3B/2B maç ekranında "Sonuna simüle et" — kalan dakikalar görüntüsüz oynanır, sonuç kaydedilir =================
   Adoball çerçevesinin araç çubuğuna, "Kritik ana atla"nın yanına düğme eklenir (her meslekte: TD, futbolcu, hakem, gözlemci, doktor). */
function abSimEndBtn(){try{const W=ABM&&ABM.win;if(!W||!ABM.fx)return;const d=W.document,sk=d.getElementById('v2d-skip');if(!sk||d.getElementById('ab-simend'))return;
  const b=d.createElement('button');b.type='button';b.id='ab-simend';b.className=sk.className.replace('mb-skip','mb-skip mb-simend');b.title='Kalan dakikaları hızlıca oynat ve maçı bitir';b.setAttribute('aria-label','Sonuna simüle et');
  b.innerHTML='<span class="sim-ic" aria-hidden="true">⏩</span><span class="mb-t">Sonuna simüle et</span><span class="sim-k" aria-hidden="true">Bitir</span>';
  b.addEventListener('click',()=>{try{if(!ABM.fx||ABM.ff)return;b.disabled=true;b.querySelector('.mb-t').textContent='Simüle ediliyor…';
      const st=W.ado2d&&W.ado2d.state;if(st&&st.hold&&typeof W.startSecondHalf==='function'&&st.hold==='half'){try{W.startSecondHalf();}catch(_){}}
      fxToEnd();}catch(e){console.warn('sonuna simüle',e);b.disabled=false;}});
  sk.insertAdjacentElement('afterend',b);
  if(!d.getElementById('ab-simend-css')){const s=d.createElement('style');s.id='ab-simend-css';s.textContent='#ab-simend{margin-left:6px;border-color:rgba(255,179,32,.55);gap:5px}#ab-simend:disabled{opacity:.6}#ab-simend .sim-ic{font-size:13px;line-height:1}#ab-simend .sim-k{display:none}@media (max-width:700px){.match-bar #ab-simend{width:auto;min-width:40px;padding:0 8px}.match-bar #ab-simend .sim-k{display:inline;font-size:12px;font-weight:800}}';d.head.appendChild(s);}}catch(e){}}
setInterval(()=>{try{if(typeof FX!=='undefined'&&FX&&FX.ab)abSimEndBtn();}catch(e){}},700);
