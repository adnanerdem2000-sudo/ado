/* ================= v126: hakem modu — VAR çağrısında 3B sahne: hakem saha kenarındaki monitöre yürür, görüntü izlenir, sahaya dönülür, nihai karar sahada verilir =================
   Akış: KARAR ANI → (VAR çağırırsa) “VAR seni monitöre çağırıyor” → hakem 3B'de yürür → monitör görüntüsü (yavaş çekim, döngü) + VAR notları → “Sahaya dön” →
   hakem sahaya döner → “Nihai karar” paneli. Sahne kurulamazsa (2B, kayıt yetersiz) eski monitör tekrarı kullanılır. */
abrReplay=(old=>function(on){const W=ABM.win;
  if(on&&ABR.stage==='var'&&!ABR.vsc){try{const A=ABR.ask;const ok=W&&W.ado2d&&W.ado2d.refVarScene&&W.ado2d.refVarScene({kind:A&&A.kind==='goal'?'goal':'foul',p:A&&A.kind==='foul'?A.d:A&&A.scorer!=null?A.scorer:-1,p2:A&&A.kind==='foul'?A.o:-1,label:A&&A.kind==='goal'?'Gol incelemesi':A&&A.pen?'Penaltı incelemesi':'Kart incelemesi',sec:5,fps:11,
        onWatch:()=>{ABR.stage='varwatch';ABR.minz=false;abrRender();},onBack:()=>{ABR.stage='var';abrRender();}});
      if(ok){ABR.vsc=1;ABR.stage='varwalk';ABR.rp=0;return;}}catch(e){console.warn('VAR sahnesi',e);}}
  if(!on&&ABR.vsc){try{W.ado2d.refVarEnd();}catch(e){}ABR.vsc=0;ABR.rp=0;return;}
  return old.apply(this,arguments);})(abrReplay);
abrRender=(old=>function(){const r=abrRoot();if(!r)return;const A=ABR.ask;
  if(A&&(ABR.stage==='varwalk'||ABR.stage==='varwatch'||ABR.stage==='varback')){const watch=ABR.stage==='varwatch';
    if(watch){r.innerHTML=`<div class="abr var-bar"><div class="vb-row"><span class="abr-tag var">VAR · MONİTÖR</span><b>${ABR.min}’</b><span class="vb-t">“${esc(ABR.varTxt||'')}”</span><button type="button" class="vb-n" data-r="min">${ABR.minz?'Notları gizle ▴':'Notlar ▾'}</button><button type="button" class="go" data-r="varret">Sahaya dön ▸</button></div>${ABR.minz?`<div class="vb-notes">${ABR.first?`<p><i>Sahadaki ilk kararın: ${esc(abrDecTxt(A,ABR.first))}</i></p>`:''}<ul class="abr-c">${(ABR.varCues||[]).map(c=>`<li>${esc(c)}</li>`).join('')}</ul></div>`:''}</div>`;return;}
    r.innerHTML=`<div class="abr var-bar"><div class="vb-row"><span class="abr-tag var">VAR</span><b>${ABR.min}’</b><span class="vb-t">${ABR.stage==='varback'?'Sahaya dönüyorsun…':'VAR seni monitöre çağırdı · hakem saha kenarındaki inceleme alanına yürüyor…'}</span></div></div>`;return;}
  old.apply(this,arguments);
  try{if(ABR.stage==='var'&&ABR.vsc){const f=r.querySelector('.abr-f .lnk');if(f){f.outerHTML='<span class="lnk off">Monitörde izledin · nihai karar sahada</span>';}const tg=r.querySelector('.abr-tag.var');if(tg)tg.textContent='NİHAİ KARAR';const l=r.querySelector('.abr-l');if(l)l.textContent='Nihai kararın';}}catch(e){}})(abrRender);
abrClick=(old=>function(ev){const b=ev.target.closest('[data-r]');if(b&&b.dataset.r==='varret'){if(ABR.stage!=='varwatch')return;try{ABM.win.ado2d.refVarReturn();}catch(e){}ABR.stage='varback';ABR.minz=false;abrRender();return;}
  if(b&&b.dataset.r==='min'&&(ABR.stage==='varwalk'||ABR.stage==='varwatch'||ABR.stage==='varback')){ABR.minz=!ABR.minz;return abrRender();}
  if(b&&(ABR.stage==='varwalk'||ABR.stage==='varwatch'||ABR.stage==='varback'))return;return old.apply(this,arguments);})(abrClick);
/* güvenlik: sahne bir şekilde biterse (sekme değişimi, maç sonu) karar paneli kilitli kalmasın */
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{if(ABR.vsc&&ABR.ask&&(ABR.stage==='varwalk'||ABR.stage==='varwatch'||ABR.stage==='varback')){const W=ABM.win,ph=W&&W.ado2d&&W.ado2d.refVarPhase?W.ado2d.refVarPhase():null;
    if(!ph){ABR.vsc=0;ABR.stage='var';abrRender();}else if(ph==='await'&&ABR.stage!=='var'){ABR.stage='var';abrRender();}}}catch(e){}return r;})(abTickCore);
/* VAR çubuğu biçimi (oyun çerçevesinin içinde) */
abrRoot=(old=>function(){const r=old.apply(this,arguments);try{const d=ABM.win&&ABM.win.document;if(d&&!d.getElementById('abr-style3')){const st=d.createElement('style');st.id='abr-style3';st.textContent=`
.abr.var-bar{width:min(760px,100%);padding:8px 10px;border-radius:14px}
.var-bar .vb-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.var-bar .vb-t{flex:1;min-width:160px;font-size:13px;color:#dfe8f5;line-height:1.35}
.var-bar .vb-n{background:transparent;border:1px solid rgba(255,255,255,.18);color:#cfe3ff;border-radius:8px;padding:6px 10px;font-size:12px;cursor:pointer}
.var-bar .go{padding:8px 14px}
.var-bar .vb-notes{margin-top:6px;font-size:13px;color:#e6edf7}.var-bar .vb-notes p{margin:0 0 4px}
@media (max-width:600px){.var-bar .vb-t{font-size:12px}}`;d.head.appendChild(st);}}catch(e){}return r;})(abrRoot);

