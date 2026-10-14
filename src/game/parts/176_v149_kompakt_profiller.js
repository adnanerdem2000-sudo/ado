/* ================= v149: kompakt profiller — oyuncu ve kulüp sayfaları daha az dikey yer kaplar; uzun listeler ilk satırlarıyla gelir, "Tümünü göster (N)" ile açılır (bilgi silinmez) ================= */
const KMP_OPEN={};   /* oturum boyunca açık bırakılan listeler (anahtar → true) */
/* bir listenin ilk n satırını göster, kalanını katla; satır sayısı n+2'yi geçmiyorsa dokunma */
function kmpFold(box,rows,n,key,after){try{if(!box||box.dataset.kmp)return;rows=[...rows];if(rows.length<=n+2)return;
  rows.forEach((r,i)=>{if(i>=n)r.classList.add('kmp-h');});box.dataset.kmp=key;box.classList.add('kmp-fold');if(KMP_OPEN[key])box.classList.add('kmp-open');
  const b=document.createElement('button');b.type='button';b.className='kmp-more';b.dataset.act='kmpMore';b.dataset.key=key;b.dataset.n=String(rows.length);b.textContent=KMP_OPEN[key]?'Daha az göster':`Tümünü göster (${rows.length})`;
  (after||box).insertAdjacentElement('afterend',b);}catch(e){}}
ACTX.kmpMore=el=>{const k=el.dataset.key,root=el.closest('.pf-body')||document,box=root.querySelector(`[data-kmp="${k}"]`);if(!box)return;
  const on=!box.classList.contains('kmp-open');box.classList.toggle('kmp-open',on);KMP_OPEN[k]=on;el.textContent=on?'Daha az göster':`Tümünü göster (${el.dataset.n})`;
  if(!on)try{box.scrollIntoView({block:'nearest'});}catch(e){}};
/* oyuncu profili: kariyer anları, sezon tablosu, transferler, kulüp yolculuğu */
function kmpPlayer(mc){try{if(!mc)return;
  mc.querySelectorAll('.pf-pane ol.tline').forEach(ol=>kmpFold(ol,ol.children,6,'tline'));
  mc.querySelectorAll('.pf-pane table.kr-t').forEach(t=>{const tb=t.tBodies[0];if(tb)kmpFold(t,tb.rows,8,'krt',t.closest('.tbl-wrap')||t);});
  mc.querySelectorAll('.pf-pane ul.kr-tx').forEach(ul=>kmpFold(ul,ul.children,6,'krtx'));
  mc.querySelectorAll('.pf-pane ol.cpath').forEach(ol=>kmpFold(ol,ol.children,5,'cpath'));
  /* telefonda simgesi metnin içinde kalan düğme boş görünmesin: baştaki simgeyi <i> içine al */
  mc.querySelectorAll('.pf-acts .pf-b').forEach(b=>{if(b.querySelector('i'))return;const s=b.querySelector('span');if(!s)return;const m=s.textContent.match(/^([^\p{L}\p{N}\s]+)\s*/u);if(!m)return;
    const i=document.createElement('i');i.textContent=m[1];b.insertBefore(i,s);s.textContent=s.textContent.slice(m[0].length);});
}catch(e){}}
pfBuild=(old=>function(mc){const r=old.apply(this,arguments);try{kmpPlayer(mc);}catch(e){}return r;})(pfBuild);
pfTabGo=(old=>function(){const r=old.apply(this,arguments);try{kmpPlayer($('#modalCard'));}catch(e){}return r;})(pfTabGo);
/* kulüp sayfası: altyapı listeleri ve kupa listeleri; kadro satırları CSS ile sıkılaşır */
function kmpClub(){try{const mc=$('#modalCard');if(!mc||!mc.classList.contains('cp'))return;const b=mc.querySelector('.cp-body');if(!b)return;
  b.querySelectorAll('.cp-two ul.cp-pl').forEach((ul,i)=>kmpFold(ul,ul.children,8,'cppl'+i));
  b.querySelectorAll('ul.trophies').forEach((ul,i)=>kmpFold(ul,ul.children,8,'cptr'+i));
  b.querySelectorAll('.cp-two table.sqt').forEach((t,i)=>{const tb=t.tBodies[0];if(tb)kmpFold(t,tb.rows,8,'cpsz'+i,t.closest('.tbl-wrap')||t);});
}catch(e){}}
showClub=(old=>function(){const r=old.apply(this,arguments);try{kmpClub();}catch(e){}return r;})(showClub);
ACTX.cpTab=(old=>function(){const r=old.apply(this,arguments);try{kmpClub();}catch(e){}return r;})(ACTX.cpTab);
