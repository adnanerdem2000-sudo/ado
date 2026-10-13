/* ================= v129: oyuncu kimliği — hazır ana karakter kaldırıldı; her kariyer kullanıcının girdiği ad ve soyadla başlar =================
   - Kariyer sihirbazında ad ve soyad zorunlu (en az 2'şer harf); rastgele ya da hazır ad atanmaz.
   - Metinlerdeki ad meN()/meF()/meNs(ek)/meFs(ek) ile gelir; Türkçe ekler ses uyumuna göre (adEk).
   - Adı olmayan ya da eski sürümün hazır adını taşıyan kayıt açılınca ad ve soyad sorulur. */
ACTX.wzGo=(old=>function(el){if(!wizNameOk()){toast('Kariyere başlamak için adını ve soyadını yaz');try{const k=String(W.fn||'').trim().length<2?'fn':'ln',i=document.querySelector(`#start input[data-in="${k}"]`);if(i){i.focus();i.classList.add('wz-need');}}catch(e){}return;}
  return old?old.apply(this,arguments):wizGo();})(ACTX.wzGo);
const KIM_OLD=2053877477;let kimAsked=0;
function kimNeed(){try{const n=String((G&&G.p&&G.p.name)||'').trim();return !!(G&&G.p&&G.phase)&&(n.split(' ').length<2||hash(n)===KIM_OLD);}catch(e){return false;}}
function kimModal(){const parts=String(G.p.name||'').trim().split(' '),old=hash(String(G.p.name||'').trim())===KIM_OLD,fn=old?'':parts[0]||'',ln=old?'':parts.slice(1).join(' ');
  openModal(`<h3>Adın ne?</h3><p class="muted">Bu kayıtta oyuncunun adı ve soyadı yok. Kariyerine kendi adınla devam et.</p>
   <div class="field"><div class="wz-names"><input id="kimFn" value="${esc(fn)}" maxlength="14" placeholder="Ad" autocomplete="off"><input id="kimLn" value="${esc(ln)}" maxlength="16" placeholder="Soyad" autocomplete="off"></div></div>
   <button class="cta" type="button" data-act="kimSave">Kaydet</button>`);}
ACTX.kimSave=()=>{const cl=x=>String(x||'').replace(/[<>&"`]/g,'').replace(/\s+/g,' ').trim(),fn=cl(($('#kimFn')||{}).value),ln=cl(($('#kimLn')||{}).value);
  if(fn.length<2||ln.length<2){toast('Ad ve soyad en az ikişer harf olmalı');return;}G.p.name=fn+' '+ln;save();closeModal();render();};
render=(old=>function(){const r=old.apply(this,arguments);try{if(!kimAsked&&kimNeed()&&$('#modal').hidden){kimAsked=1;kimModal();}}catch(e){}return r;})(render);
