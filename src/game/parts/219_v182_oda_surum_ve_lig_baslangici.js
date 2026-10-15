/* ================= v182: lig başlamadan önce "hazırlık maçları tabloya işlenmez" notu; çevrimiçi odada iki tarafın oyun sürümü farklıysa uyarı ================= */
/* ---------- lig başlangıcı notu (puan durumu ve ana sayfadaki mini tablo) ---------- */
function v182LigNotu(){try{const S=G&&G.s;if(!S||G.phase!=='season'||(S.results||[]).length||!S.cal||S.cal[0]==null||S.day>S.cal[0])return '';
    const gun=S.cal[0]-S.day;return `<p class="v182-not">⚽ Lig ${esc(fmtDate(dateOf(S.cal[0])))} tarihinde başlıyor${gun>0?` (${gun} gün sonra)`:' (bugün)'}. Hazırlık maçları lig tablosuna ve istatistiklere işlenmez.</p>`;}catch(e){return '';}}
viewLeague=(old=>function(){const h=old.apply(this,arguments);try{if((typeof VLG==='undefined'||!VLG||VLG===G.s.league)&&(LTAB==='tbl'||LTAB==='g'||LTAB==='a')){const n=v182LigNotu();if(n){const i=h.search(/<section[^>]*>\s*<div class="tbl-wrap"|<div class="tbl-wrap"/);return i>0?h.slice(0,i)+n+h.slice(i):h.replace(/(<\/h2>)/,'$1'+n);}}}catch(e){}return h;})(viewLeague);
render=(old=>function(){const r=old.apply(this,arguments);try{if(G&&TAB==='hub'){const n=v182LigNotu();const t=n&&document.querySelector('#view .hub-side .mini-t');if(t&&!t.parentElement.querySelector('.v182-not'))t.insertAdjacentHTML('beforebegin',n.replace('class="v182-not"','class="v182-not k"'));}}catch(e){}return r;})(render);
/* ---------- çevrimiçi oda: sürüm parmak izi ---------- */
let V182_IZ=null;
function v182Iz(){if(V182_IZ)return V182_IZ;try{let n=0,h=0;for(const s of document.scripts){const t=s.text||'';n+=t.length;h=(h*31+t.length+(t.charCodeAt(t.length>>1)||0))>>>0;}V182_IZ=(n.toString(36)+h.toString(36)).slice(-10);}catch(e){V182_IZ='?';}return V182_IZ;}
mpSt=(old=>function(){const o=old.apply(this,arguments);try{o.bv=v182Iz();}catch(e){}return o;})(mpSt);
let V182_UY=false;
mpUI=(old=>function(){const r=old.apply(this,arguments);try{const P=MP.peer;if(!mpOn()||!P||!mpPeerLive())return r;
    const fark=P.bv?P.bv!==v182Iz():true;/* eski sürüm bv göndermez */
    if(fark&&!V182_UY){V182_UY=true;const nm=esc(P.n||'Arkadaşın');
      msg('news','🌐 Oyun sürümleri farklı',`${nm} ile oyunun farklı sürümlerini kullanıyorsunuz. Sonuçların ve tablonun ikinizde aynı işlenmesi için ikiniz de sayfayı yenileyin (iPhone’da ana ekrandaki uygulamayı tamamen kapatıp yeniden açın). Güncel sürüm: adnanerdem2000-sudo.github.io/ado`);
      toast('🌐 '+(P.n||'Arkadaşın')+' farklı bir oyun sürümünde: ikiniz de sayfayı yenileyin');}
    const pn=$('#v178Pop');if(pn&&!pn.hidden&&fark&&!pn.querySelector('.v182-uy'))pn.insertAdjacentHTML('beforeend','<p class="v182-uy">⚠ Arkadaşınla farklı oyun sürümlerindesiniz: ikiniz de sayfayı yenileyin.</p>');}catch(e){}return r;})(mpUI);
