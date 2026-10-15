/* ================= v155: meslek derinliği — hakem, sportif direktör, başkan, doktor, gözlemci, yardımcı antrenör, teknik direktör ================= */
/* ---------- Türkçe ek yardımcısı: ek(sözcük, tür) ----------
   tür: gen (-ın), acc (-ı), dat (-a), abl (-dan), loc (-da); "in/i/e/den/de" kısaltmaları da olur.
   Sayılar okunuşlarına göre çekilir: ek(2026,'abl') → 2026’dan, ek(3,'loc') → 3’te, ek(40,'gen') → 40’ın. */
const V155_BIR=['sıfır','bir','iki','üç','dört','beş','altı','yedi','sekiz','dokuz'],V155_ON=['','on','yirmi','otuz','kırk','elli','altmış','yetmiş','seksen','doksan'];
function ekOkunus(w){w=String(w==null?'':w).trim();const m=w.match(/(\d+)$/);if(!m)return (w.split(/\s+/).pop()||w);const n=m[1].replace(/^0+(?=\d)/,'');let z=0;for(let i=n.length-1;i>=0&&n[i]==='0';i--)z++;
  if(z===n.length)return 'sıfır';if(z===0)return V155_BIR[+n[n.length-1]];if(z===1)return V155_ON[+n[n.length-2]];if(z===2)return 'yüz';if(z<6)return 'bin';if(z<9)return 'milyon';return 'milyar';}
function ek(w,t){const T={in:'gen',nin:'gen',i:'acc',yi:'acc',e:'dat',ye:'dat',den:'abl',dan:'abl',de:'loc',da:'loc'}[t]||t;const s=String(w==null?'':w);return s+'’'+sfx(ekOkunus(s),T);}
/* kupa turu adıyla "-de elendi": "4. Tur" → "4. Turda", "Son 16" → "Son 16 turunda" */
function turLoc(n){n=String(n||'');return /\bTur$/i.test(n)?n+'da':n+' turunda';}
/* "İ".toLowerCase() → "i̇" (noktalı i + birleşik nokta) yerine düz "i" */
{const _lc=String.prototype.toLowerCase;String.prototype.toLowerCase=function(){const r=_lc.call(this);return r.indexOf('\u0307')>=0?r.replace(/i\u0307/g,'i'):r;};}
const capTR=s=>{s=String(s||'');return s?s.charAt(0).toLocaleUpperCase('tr-TR')+s.slice(1):s;};

/* ---------- ortak durum ---------- */
function v155(){if(!G)return {q:[],last:{}};G.v155=G.v155||{q:[],last:{}};const V=G.v155;V.q=V.q||[];V.last=V.last||{};return V;}
const V155_DAY=()=>(G&&G.s?G.s.year*400+G.s.day:0);
function v155Push(ev){const V=v155();if(V.q.some(x=>x.k===ev.k&&x.key===ev.key))return;ev.id=(V.n=(V.n||0)+1);V.q.push(ev);if(V.q.length>4)V.q.length=4;try{msg(ev.mt||'board',ev.t,ev.b.replace(/<[^>]+>/g,''));}catch(e){}}

/* ---------- karar penceresi: Devam'ı durdurur ---------- */
const V155_KIND={sd:'Sportif direktörlük kararı',bsk:'Başkanlık kararı',yrd:'Teknik ekip',scout:'Gözlem masası',dr:'Sağlık merkezi',el:'Genel kurul',info:'Bilgi'};
function v155Show(ev){if(!ev)return;const o=ev.o||[['ok','Tamam']];
  openModal(`<section class="v155-dec"><span class="kicker">${esc(V155_KIND[ev.g]||'Karar')}</span><h3>${esc(ev.t)}</h3><div class="v155-b">${ev.b}</div>${ev.x||''}
   <div class="v155-opts">${o.map((x,i)=>`<button class="${i===0?'cta':'btn'} v155-o" data-act="${ev.det?'closeModal':'v155Dec'}" data-k="${esc(x[0])}"${x[3]?' data-auto="1"':''}><b>${esc(x[1])}</b>${x[2]?`<small>${esc(x[2])}</small>`:''}</button>`).join('')}</div>
   ${ev.info?'':`<p class="muted v155-note">Bu karar verilmeden gün ilerlemez.</p>`}</section>`);}
const V155_DEC={};
ACTX.v155Dec=el=>{const V=v155(),ev=V.q.shift();closeModal();if(!ev)return render();let r='';try{const H=V155_DEC[ev.k];r=H?H(ev,el.dataset.k):'';}catch(e){console.warn('v155 karar',e);}if(r)toast(r);save();render();};
/* bekleyen işler: karar kuyruğu, doktorda bekleyen hasta */
function v155Gate(){if(!G||!G.s||G.phase!=='season')return false;if(!$('#modal').hidden)return true;
  const V=v155();if(V.q.length){v155Show(V.q[0]);return true;}
  if(isStaff()&&G.staff==='dr'&&G.job){const w=drWaiting();if(w.length&&V.drSkip!==V155_DAY()){drRemind(w);return true;}}
  return false;}
const V155_GATE=new Set(['stDay','stAdv','stMatch','stCup','stWatch','yrWatch','mgrAdv','mgrPlay','mgrSim','mgrCup','mgrCupW','refGo','ref3','v155Watch']);
document.addEventListener('click',e=>{const el=e.target&&e.target.closest&&e.target.closest('[data-act]');if(!el||!V155_GATE.has(el.dataset.act))return;
  try{if(v155Gate()){e.stopImmediatePropagation();e.preventDefault();}}catch(x){console.warn('v155 gate',x);}},true);
/* hub'da bekleyen karar uyarısı */
function v155Alert(){try{const V=v155();if(!G||G.phase!=='season'||!V.q.length)return '';const ev=V.q[0];return `<button class="talk-alert v155-alert" data-act="v155Open"><b>⏳ Karar bekliyor: ${esc(ev.t)}</b><small>${V.q.length>1?`${V.q.length} karar · `:''}Karar verilmeden gün ilerlemez · aç</small></button>`;}catch(e){return '';}}
ACTX.v155Open=()=>{const V=v155();if(V.q.length)v155Show(V.q[0]);};

/* ---------- ortak: günlük olay üreticisi ---------- */
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.s&&G.phase==='season'){if(isStaff())v155StaffDay();else if(isRole())v155RoleDay();}}catch(e){console.warn('v155 gün',e);}return r;})(nextDay);
const v155Due=(k,days)=>{const V=v155(),t=V.last[k]||0;return V155_DAY()-t>=days;};
const v155Mark=k=>{v155().last[k]=V155_DAY();};

/* =====================================================================
   HAKEM
   ===================================================================== */
/* ipuçlarındaki {a}/{d} ekleri: şablonda işaretlenir, ad yerleşince ünlü uyumuyla çekilir */
(function(){const MAP={ya:'dat',ye:'dat',a:'dat',e:'dat','yı':'acc',yi:'acc',yu:'acc','yü':'acc','ı':'acc',i:'acc',u:'acc','ü':'acc',dan:'abl',den:'abl',tan:'abl',ten:'abl','nın':'gen',nin:'gen',nun:'gen','nün':'gen','ın':'gen',in:'gen',un:'gen','ün':'gen',da:'loc',de:'loc',ta:'loc',te:'loc'};
  const re=/\{([ad])\}(nın|nin|nun|nün|dan|den|tan|ten|yı|yi|yu|yü|ya|ye|da|de|ta|te|ın|in|un|ün|ı|i|u|ü|a|e)(?![a-zçğıöşü])/g;
  const fx=s=>typeof s==='string'?s.replace(re,(m,w,sf)=>`{${w}}\u0001${MAP[sf]}\u0002`):s;
  try{for(const T of INC){T.q=fx(T.q);for(const k in T.c)T.c[k]=T.c[k].map(fx);}}catch(e){console.warn(e);}})();
function refSent(s,an,dn){s=String(s||'');if(an!=null)s=s.replace(/\{a\}/g,an);if(dn!=null)s=s.replace(/\{d\}/g,dn);
  return capTR(s.replace(/([^\s\u0001]+)\u0001(\w+)\u0002/g,(m,w,t)=>w+'’'+sfx(w,t)).replace(/[\u0001\u0002]/g,''));}
refMkInc=(old=>function(F){const out=old.apply(this,arguments);try{for(const I of out){I.q=refSent(I.q,I.att,I.def);I.cues=(I.cues||[]).map(c=>refSent(c,I.att,I.def));}}catch(e){console.warn(e);}return out;})(refMkInc);
refModal=(old=>function(){try{const R=REF,I=R&&R.inc&&R.inc[R.i];if(R&&R.varQ&&I)R.varQ.cue=refSent(R.varQ.cue,I.att||'Hücumcu',I.def||'Savunmacı');}catch(e){}return old.apply(this,arguments);})(refModal);
/* kademeli ceza: uyarı → klasman düşürme → kurs ve uzaklaştırma → men */
mhkApply=(old=>function(R,rt){const M=mhkOf(),m0=M.marks;const r=old.apply(this,arguments);try{if(!isRef()||M.marks<=m0||M.marks>=4)return r;const j=refJob(),T=STF.ref.r;
    if(M.marks===2&&j.lvl>0){j.lvl--;j.title=T[j.lvl];if(G.contract)G.contract.role=j.title;M.dem=(M.dem||0)+1;M.hist[0]&&(M.hist[0].dem=1);
      msg('board','MHK: klasman düşürme',`Sicilindeki ikinci ağır ihlal nedeniyle ${j.title} klasmanına düşürüldün. Atamaların bir alt düzeyden yapılacak; sezon sonu değerlendirmede yeniden yükselebilirsin.`);}
    else if(M.marks===2){M.susp=(M.susp||0)+1;msg('board','MHK: ek görevden uzaklaştırma','Zaten en alt klasmanda olduğun için ceza bir maç ek uzaklaştırmaya çevrildi.');}
    if(M.marks===3){M.kurs=(M.kurs||0)+1;M.susp=(M.susp||0)+1;msg('board','MHK: zorunlu kural kursu',`Sicilindeki üçüncü ağır ihlal: Hakem Gelişim Kursu’na (IFAB kuralları, VAR protokolü) katılman zorunlu. Kurs süresince ${M.susp} maç görev verilmeyecek. Bir ağır ihlal daha meslekten men demek.`);}}catch(e){console.warn(e);}return r;})(mhkApply);
/* hakemin kulübü yok: atandığı ligin "takımı" yalnız takvim için tutulur; kulübün sonuç pencereleri ve maç raporları gösterilmez */
function v155Quiet(fn){const o=openModal,om=msg;openModal=function(){};msg=function(t){if(t==='report')return;return om.apply(this,arguments);};try{return fn();}finally{openModal=o;msg=om;}}
staffMatch=(old=>function(){if(isRef()){const a=arguments,s=this;return v155Quiet(()=>old.apply(s,a));}return old.apply(this,arguments);})(staffMatch);
staffCup=(old=>function(){if(isRef()){const a=arguments,s=this;v155Quiet(()=>old.apply(s,a));try{toast('Kupa günü: bugün başka hakemler görevli');}catch(e){}return;}return old.apply(this,arguments);})(staffCup);
/* menü: hakemle ilgisiz sekmeler gizli */
navCats=(old=>function(){let C=old.apply(this,arguments);try{if(isRef())C=C.map(([n,its])=>[n,its.filter(x=>!['rdr','bdo'].includes(x[0]))]).filter(c=>c[1].length);}catch(e){}return C;})(navCats);
/* atamalar ve gözlemci paneli */
function refUpcoming(n){const j=refJob(),out=[];if(!G.s||!G.s.cal)return out;let wi=G.s.results.length;const M=mhkOf();let susp=M.susp||0;
  for(const d of G.s.cal){if(d<G.s.day)continue;if(out.length>=n)break;const fx=G.s.fixtures[wi]||[];wi++;let row={d,lid:G.s.league};
    if(susp>0){susp--;row.ban=1;out.push(row);continue;}const r=srng('ref'+G.s.year+'-'+d);r();if(j.lvl>=3&&r()<0.3){row.uefa=1;out.push(row);continue;}
    if(!fx.length){row.none=1;out.push(row);continue;}const f=fx[Math.floor(r()*fx.length)];row.h=f[0];row.a=f[1];out.push(row);}
  return out;}
function refClassTarget(){const j=refJob(),good=j.rgood||0,bad=j.rbad||0,score=Math.round(good*0.45)*5-Math.round(bad*0.8)*4,need=26+j.lvl*8,top=j.lvl>=STF.ref.r.length-1;return {good,bad,score,need,top};}
function refObsHTML(){const j=refJob(),M=mhkOf(),up=refUpcoming(3),last=(j.rlog||[])[0],T=refClassTarget(),RT=typeof REF_TN!=='undefined'?REF_TN:{};
  const ups=up.map(x=>`<li><span>${fmtDate(dateOf(x.d))}</span><b>${x.ban?'⛔ Görev yok (MHK cezası)':x.uefa?'Avrupa görevi (UEFA kurası)':x.none?'Atama bekleniyor':`${esc((CLUBS[x.h]||{}).name||'')} – ${esc((CLUBS[x.a]||{}).name||'')}`}</b><em>${x.ban||x.uefa||x.none?'':esc((LEAGUES[x.lid]||{}).short||'')}</em></li>`).join('');
  const brk=last?`<p class="sub-h" style="margin:12px 0 6px"><span>Son maç gözlemci raporu</span><span>${esc((CLUBS[last.h]||{}).short||'')} – ${esc((CLUBS[last.a]||{}).short||'')} · <b class="${last.rt>=8.3?'pos':last.rt<7?'neg':''}">${dec(last.rt,1)}</b></span></p>
    <ul class="v155-obs"><li><span>Başlangıç notu</span><b>8,3</b></li>${(last.log||[]).map(l=>`<li><span>${l[0]}’ ${esc(RT[l[1]]||'Pozisyon')}</span><b class="${l[2]==='hatalı'?'neg':'pos'}">${esc(l[2])}</b></li>`).join('')}</ul>`:'<p class="muted">Henüz yönettiğin maç yok; ilk maçından sonra gözlemci notunun dökümü burada görünür.</p>';
  const pct=T.top?100:clamp(Math.round(Math.max(0,T.score)/T.need*100),0,100);
  const step=['Uyarı','Klasman düşürme','Kurs ve uzaklaştırma','Men'],cur=M.marks>=3?2:M.marks>=2?1:M.marks>=1||M.warn?0:-1;
  return `<section class="panel v155-ref"><p class="sub-h"><span>Atamalar ve gözlemci</span><span>${esc(j.title)}</span></p>
   <p class="sub-h" style="margin:4px 0 6px"><span>Sıradaki görevler</span></p><ul class="cupres v155-up">${ups||'<li><b>Sezon bitti</b></li>'}</ul>${brk}
   <p class="sub-h" style="margin:12px 0 6px"><span>Klasman hedefi</span><span>${T.top?'En üst klasman':`Terfi: ${esc(STF.ref.r[j.lvl+1]||'')}`}</span></p>
   <div class="st-goals"><div class="st-g"><span>Klasman puanı</span><i><em style="width:${pct}%" class="${pct>=100?'ok':''}"></em></i><b>${T.score} / ${T.need}</b></div></div>
   <p class="muted" style="margin:6px 0 0">İyi maç (8,3+): <b>${T.good}</b> · kötü maç (7,0 altı): <b>${T.bad}</b>. Her iyi maç yaklaşık +2,3, her kötü maç −3,2 puan; sezon sonunda hedefi geçersen bir üst klasmana çıkarsın.</p>
   <p class="sub-h" style="margin:12px 0 6px"><span>MHK sicili</span><span>${M.marks}/4</span></p><div class="v155-ladder">${step.map((s,i)=>`<span class="${i<=cur?'on':''}">${s}</span>`).join('')}</div></section>`;}
refHub=(old=>function(){let h=old.apply(this,arguments);try{h+=refObsHTML();}catch(e){console.warn(e);}return h;})(refHub);
/* hakemlikten men: futbolcu emekliliği yerine MHK kararı ekranı */
function viewRefBan(){const j=refJob(),M=mhkOf(),all=j.rlog||[],avg=all.length?all.reduce((a,x)=>a+x.rt,0)/all.length:0,h=(M.hist||[])[0];
  return `<section class="panel v155-ban"><span class="kicker">Merkez Hakem Kurulu kararı</span><h2>Hakemlikten men edildin</h2>
   <p>${esc(PN())}, sicilindeki ${M.marks}. ağır ihlalin ardından MHK tarafından hakem kadrosundan çıkarıldı. ${h?`Son inceleme: ${h.y} sezonu, ${h.big?h.big+' ciddi hata':''}${h.ab?' · gerekçesiz kart':''}${h.rt?` · gözlemci notu ${dec(h.rt,1)}`:''}.`:''}</p>
   <div class="strip"><div><b>${j.seasons||0}</b><span>Sezon</span></div><div><b>${all.length}</b><span>Maç</span></div><div><b>${all.length?dec(avg,2):'-'}</b><span>Not ort.</span></div><div><b>${M.marks}/4</b><span>Sicil</span></div></div><p class="muted" style="margin:0 0 6px">Son klasman: <b>${esc(j.title)}</b></p>
   <p class="muted">Men kararı kesindir; kokart ve klasman hakları düşer. Kariyer geçmişin ve maç raporların arşivde kalır.</p></section>
   ${M.hist&&M.hist.length?`<section class="panel"><p class="sub-h"><span>Sicil geçmişi</span></p><ul class="cupres">${M.hist.slice(0,8).map(x=>`<li><span>${esc(x.y||'')}</span><b>${x.n||0} maç uzaklaştırma${x.dem?' · klasman düşürme':''}</b><em class="res-l">${x.rt?dec(x.rt,1):''}</em></li>`).join('')}</ul></section>`:''}
   <div class="day-ctas v155-banb"><button class="btn" data-act="newCareer">Yeni kariyer başlat · başka bir meslek seç</button><button class="btn" data-act="navGo" data-tab="refs">Maç raporlarım</button></div>`;}
fmCont=(old=>function(){try{if(isRef()&&G.phase==='retired'){toast('Hakemlik kariyerin MHK kararıyla sona erdi');return;}}catch(e){}return old.apply(this,arguments);})(fmCont);
viewRetired=(old=>function(){try{if(isRef()&&G.job&&(G.job.dismissed||(G.job.mhk&&G.job.mhk.marks>=4)))return viewRefBan();}catch(e){console.warn(e);}return old.apply(this,arguments);})(viewRetired);

/* =====================================================================
   DOKTOR
   ===================================================================== */
function drWaiting(){const j=stG();return (j.cases||[]).filter(c=>c&&!c.done&&(c.step===0||c.step===1));}
/* aynı oyuncu iki kez kuyruğa girmez; sakat listesinde olan da yeniden vaka açmaz */
drCaseNew=(old=>function(p){try{const j=stG();if(p&&((j.cases||[]).some(c=>c.k===p.k&&!c.done)||(j.inj&&j.inj[p.k])))return;}catch(e){}const r=old.apply(this,arguments);try{if(V155_INJ&&p)V155_INJ.push(p.name);}catch(e){}return r;})(drCaseNew);
let V155_INJ=null;
function drDedupe(){const j=stG(),seen=new Set();j.cases=(j.cases||[]).filter(c=>{if(!c)return false;if(c.done)return true;if(seen.has(c.k)||(j.inj&&j.inj[c.k]))return false;seen.add(c.k);return true;});}
/* bekleyen hasta: hatırlatma; "Devam" bu karar verilmeden ilerlemez */
function drRemind(w){const j=stG();
  openModal(`<section class="v155-dec"><span class="kicker">Sağlık merkezi</span><h3>${w.length} hasta seni bekliyor</h3><div class="v155-b"><p>Sakatlanan oyuncular muayene edilmeden gün ilerlemez. Bekletilen hastanın durumu kötüleşir, yönetimin memnuniyeti düşer.</p>
   <ul class="cupres">${w.slice(0,8).map(c=>`<li><span>${c.step===1?'Tedavi':'Muayene'}</span><b>${esc(c.name)}</b><em class="${(c.wd||0)>=2?'res-l':''}">${c.wd?c.wd+' gündür':'yeni'}</em></li>`).join('')}</ul></div>
   <div class="v155-opts"><button class="cta v155-o" data-act="v155DrRoom"><b>Muayene odasına git</b><small>Şikâyet, muayene, tetkik, teşhis ve tedavi</small></button>
   <button class="btn v155-o" data-act="drDeleg" data-auto="1"><b>Asistan hekime devret</b><small>Teşhis isabeti düşük · itibar −1, yönetim −1 / hasta</small></button>
   <button class="btn ghost v155-o" data-act="drWait"><b>Bugünlük beklet</b><small>Yönetim memnuniyeti −2; hastaların durumu kötüleşebilir</small></button></div></section>`);}
ACTX.v155DrRoom=()=>{closeModal();try{ACTX.drRoom();}catch(e){console.warn(e);}};
ACTX.drDeleg=()=>{const j=stG();closeModal();let n=0;for(let i=j.cases.length-1;i>=0;i--){const cs=j.cases[i];if(!cs||cs.done||!(cs.step===0||cs.step===1))continue;
    if(cs.step===0){const ok=Math.random()<0.6;cs.dx=ok?cs.i:(cs.opts||[]).find(o=>o!==cs.i);cs.ok=ok;cs.step=1;if(!ok)j.wrong=(j.wrong||0)+1;}
    try{drTreat(i,'std');}catch(e){console.warn(e);j.cases.splice(i,1);}n++;j.rep=clamp((j.rep||0)-1,0,100);stBoard(-1);}
  if(n)msg('injury','Vakalar asistana devredildi',`${n} hasta asistan hekim tarafından standart programla tedaviye alındı. Teşhislerin bir kısmı yanlış olabilir; yönetim işin sana ait olduğunu hatırlatıyor.`);save();render();};
ACTX.drWait=()=>{const V=v155(),j=stG();closeModal();V.drSkip=V155_DAY();stBoard(-2);j.rep=clamp((j.rep||0)-0.5,0,100);toast('Hastalar bugünlük bekliyor · yönetim memnuniyeti −2');save();render();};
/* ihmal: bekleyen hasta kötüleşir */
function drNeglect(){const j=stG();drDedupe();for(const cs of drWaiting()){cs.wd=(cs.wd||0)+1;if(cs.wd>=2){stBoard(-0.6);cs.xw=(cs.xw||0)+(cs.wd%2===0?1:0);if(!cs.worse){cs.worse=1;msg('injury',`${cs.name} bekliyor, durumu kötüleşiyor`,`${cs.name} ${cs.wd} gündür muayene edilmedi. Ağrısı arttı; tedavi süresi uzayacak. Yönetim gecikmeden rahatsız.`);}}}}
drTreat=(old=>function(ci){const j=stG(),cs=j.cases[ci];const k=cs&&cs.k,xw=cs&&cs.xw||0;const r=old.apply(this,arguments);try{if(k&&xw&&j.inj&&j.inj[k]&&!j.inj[k].v155){j.inj[k].v155=1;j.inj[k].w+=xw;}}catch(e){}return r;})(drTreat);
/* ana sayfa: doğrudan teşhis kısayolu yok (muayene odasından geçilir); sakat listesi ile vaka kuyruğu aynı kaynaktan */
drHTML=(old=>function(){let h=old.apply(this,arguments);try{drDedupe();
    h=h.replace(/<p class="sub-h"[^>]*><span>Teşhis<\/span>(?:<span>[^<]*<\/span>)?<\/p><div class="chips">[\s\S]*?<\/div>/g,'');
    const w=drWaiting(),j=stG(),inj=Object.keys(j.inj||{}).length;
    const rows=w.map(c=>{const p=pByKey(c.k);return `<li><span>${p?p.pos:''}</span><b>${esc(c.name)}<small style="display:block;color:var(--chalk-3);font-size:11.5px">${c.step===1?'Teşhis kondu · tedavi planı bekliyor':'Teşhis bekliyor · muayene odasına al'}</small></b><em class="${(c.wd||0)>=2?'res-l':''}">${c.wd?c.wd+' gün':'yeni'}</em></li>`;}).join('');
    h=h.replace(/(<p class="sub-h"><span>Sakatlar listesi<\/span><span>)(\d+)(<\/span><\/p>)/,(m,a,b,c)=>`${a}${inj+w.length}${c}`);
    if(rows){if(h.includes('<p class="sub-h"><span>Sakatlar listesi'))h=h.replace(/(<p class="sub-h"><span>Sakatlar listesi<\/span><span>\d+<\/span><\/p>)(<ul class="cupres">)?/,(m,a,u)=>u?a+u+rows:a+`<ul class="cupres">${rows}</ul>`);}
    if(rows)h=h.replace(/<p class="muted">Kadroda sakat oyuncu yok\.?<\/p>/,'');}catch(e){console.warn(e);}return h;})(drHTML);
/* maç sonu: sakatlananlar pencerede adlarıyla */
staffMatch=(old=>function(){if(!(isStaff()&&G.staff==='dr'))return old.apply(this,arguments);V155_INJ=[];let r;try{r=old.apply(this,arguments);}finally{const L=V155_INJ;V155_INJ=null;
    try{if(L&&L.length&&!$('#modal').hidden){const mc=$('#modalCard'),b=mc.querySelector('button.cta[data-act="closeModal"]');const box=`<div class="v155-inj">🚑 <b>Maçta sakatlananlar:</b> ${L.map(n=>esc(n)).join(', ')}<small>Muayene odasında seni bekliyorlar; muayene edilmeden gün ilerlemez.</small></div>`;if(b)b.insertAdjacentHTML('beforebegin',box);else mc.insertAdjacentHTML('beforeend',box);}}catch(e){}}return r;})(staffMatch);

/* =====================================================================
   GÖZLEMCİ ve YARDIMCI ANTRENÖR: günlük/haftalık kararlar
   ===================================================================== */
function v155StaffDay(){const j=stG(),S=G.s;if(G.staff==='dr'){drNeglect();return;}if(v155().q.length)return;
  const md=nextMatchDay(S.day),left=md!=null?md-S.day:null;
  if(G.staff==='yrd'){const w=(j.wk&&j.wk[S.week])||{},f=ourFixture();if(!f)return;const opp=CLUBS[f[0]===G.club?f[1]:f[0]];
    if(!w.tr&&left!=null&&left<=4&&!v155().q.some(x=>x.k==='yr_tr')&&v155Due('yrtr'+S.week,999)){v155Mark('yrtr'+S.week);const need=typeof yrTeamNeed==='function'?yrTeamNeed():null;
      v155Push({g:'yrd',k:'yr_tr',key:S.week,t:'Haftanın idman planı',b:`<p>${esc(coachOf(G.club).n)}: “${esc(opp.name)} maçı öncesi bu haftanın idman odağını senden bekliyorum.”</p><p class="muted">Takım raporu: son maçlarda en çok zorlandığımız alan <b>${esc(YR_TR[need]||'—')}</b>.</p>`,o:Object.entries(YR_TR).map(([k,v])=>[k,v,''])});}
    else if(!w.an&&left!=null&&left<=2&&!v155().q.some(x=>x.k==='yr_an')&&v155Due('yran'+S.week,999)){v155Mark('yran'+S.week);let pr=null;try{pr=yrProfile(opp.id,'o');}catch(e){}
      v155Push({g:'yrd',k:'yr_an',key:S.week,t:`Rakip analizi: ${opp.name}`,b:`<p>Analiz raporunun teslimine ${left<=0?'bugün':left+' gün'} kaldı. Rakibin son 5 maçtaki gol yolları:</p>${pr?`<div class="bars">${Object.entries(pr.out).map(([k,v])=>`<div><span>${esc(YR_AN[k])}</span><i><em style="width:${v}%"></em></i><b>%${v}</b></div>`).join('')}</div>`:''}`,o:Object.entries(YR_AN).map(([k,v])=>[k,v+' kapatılsın',''])});}
    else if(v155Due('yrreq',9)&&Math.random()<0.12){v155Mark('yrreq');const sq=squadOf(G.club).filter(p=>p.age<=21).sort((a,b)=>potOf(b)-potOf(a));const p=sq[0];if(!p)return;
      v155Push({g:'yrd',k:'yr_req',key:p.k,pk:p.k,t:'Hocanın sorusu: genç oyuncu',b:`<p>${esc(coachOf(G.club).n)}: “${esc(p.name)} (${p.age}) A takım idmanlarında ne durumda? Maç kadrosuna almalı mıyız?”</p>`,o:[['evet','Kadroya alınsın','Gelişimi hızlanır; hazır değilse hoca güveni düşer'],['bekle','Biraz daha beklesin','Temkinli yaklaşım'],['hayir','Hazır değil','Genç oyuncunun morali düşer']]});}}
  else if(G.staff==='scout'){const t=j.task;
    if(t&&!t.done&&t.due!=null&&t.due-S.day<=5&&!t.v155){t.v155=1;if(t.due<S.day)t.due=S.day+2;
      v155Push({g:'scout',k:'sc_dead',key:t.due,t:'Rapor teslim tarihi yaklaşıyor',b:`<p>Yönetim ${esc((SC_POS[t.pos]||t.pos))} mevkisi için istediği raporu bekliyor. Teslime ${Math.max(0,t.due-S.day)} gün kaldı (en fazla ${t.age} yaş, bütçe ${eur(t.bud)}).</p>`,o:[['oner','Listemdeki en uygun adayı öner','Gözlem listesinden mevkiye uyan en iyi oyuncu'],['sure','Ek süre iste','14 gün · yönetim memnuniyeti −3'],['birak','Görevi bırak','İtibar −3, yönetim −5']]});return;}
    if(left!=null&&left>=2&&left<=4&&v155Due('scopp',13)&&Math.random()<0.6){const f=ourFixture();if(!f)return;v155Mark('scopp');const opp=CLUBS[f[0]===G.club?f[1]:f[0]];
      v155Push({g:'scout',k:'sc_opp',key:S.week,opp:opp.id,t:`Hoca rakip raporu istiyor: ${opp.name}`,b:`<p>${esc(coachOf(G.club).n)}, ${esc(opp.name)} maçı öncesi rakibin son maçlarından gözlem raporu istiyor.</p>`,o:[['git','Rakibin maçına git','1 gün · ayrıntılı rapor, hoca ve yönetim memnun'],['video','Video ile hızlı rapor','Daha az ayrıntı'],['red','Bu hafta yetişmez','Yönetim memnuniyeti −2']]});return;}
    if(v155Due('screg',21)&&Math.random()<0.1){v155Mark('screg');let L=[];try{L=scLeagues().filter(l=>l!==G.s.league);}catch(e){}const lid=pick(L);if(!lid)return;
      v155Push({g:'scout',k:'sc_reg',key:lid,lid,t:`Yönetimden talep: ${LEAGUES[lid].name}`,b:`<p>Sportif direktör, ${esc(LEAGUES[lid].name)} için kısa bir pazar raporu istiyor: kiralık ve düşük bedelli fırsatlar.</p>`,o:[['git','Gözlem turuna çık','Lige git, oyuncu keşfet'],['sonra','Gelecek ay','Yönetim memnuniyeti −1']]});}}}
V155_DEC.yr_tr=(ev,k)=>{try{yrSet('tr',k);}catch(e){console.warn(e);}return `İdman odağı: ${YR_TR[k]||k}`;};
V155_DEC.yr_an=(ev,k)=>{try{yrSet('an',k);}catch(e){console.warn(e);}return `Rakip analizi teslim edildi: ${YR_AN[k]||k}`;};
V155_DEC.yr_req=(ev,k)=>{const j=stG(),p=pByKey(ev.pk);if(!p)return '';const ready=p.ovr>=myClub().str-6;
  if(k==='evet'){j.tr=clamp((j.tr||60)+(ready?3:-3),0,100);try{p.ovr=Math.min(potOf(p),p.ovr+(ready?1:0));}catch(e){}msg('coach','Genç oyuncu kadroda',ready?`${p.name} maç kadrosuna alındı; hoca tavsiyenden memnun.`:`${p.name} hazır değildi; ilk idmanlarda zorlandı. Hoca tavsiyeni sorguluyor.`);return ready?'Hoca güveni +3':'Hoca güveni −3';}
  if(k==='hayir'){j.tr=clamp((j.tr||60)+(ready?-1:1),0,100);return 'Genç oyuncu bekleyecek';}return 'Karar ertelendi';};
V155_DEC.sc_dead=(ev,k)=>{const j=stG(),t=j.task;if(!t||t.done)return '';
  if(k==='oner'){const done=new Set((j.reps||[]).map(r=>r.k)),L=(j.short||[]).filter(x=>!done.has(x)).map(pByKey).filter(Boolean);const c=L.filter(p=>p.pos===t.pos).sort((a,b)=>potOf(b)-potOf(a))[0]||L[0];
    if(!c){t.done=true;j.rep=clamp((j.rep||0)-3,0,100);stBoard(-4);msg('board','Rapor teslim edilemedi','Gözlem listende önerilecek oyuncu yoktu. Yönetim görevi başkasına verdi.');return 'Listede aday yok · itibar −3';}
    try{scReport(c.k);}catch(e){console.warn(e);}const t2=j.task;if(t2===t&&!t.done){t.v155=0;if(t.due<=G.s.day)t.due=G.s.day+3;}return `${c.name} önerildi`;}
  if(k==='sure'){t.due+=14;t.v155=0;stBoard(-3);return 'Ek süre: 14 gün · yönetim −3';}
  t.done=true;j.rep=clamp((j.rep||0)-3,0,100);stBoard(-5);msg('board','Görev bırakıldı','Yönetim talebini karşılayamadığını kabul ettin.');try{setTimeout(()=>{if(G&&G.staff==='scout'&&G.phase==='season'&&typeof scTaskNew==='function'){scTaskNew();save();render();}},10);}catch(e){}return 'Görev bırakıldı';};
V155_DEC.sc_opp=(ev,k)=>{const j=stG(),opp=CLUBS[ev.opp];if(!opp)return '';const sq=squadOf(opp.id).slice().sort((a,b)=>b.ovr-a.ovr),co=coachOf(opp.id),best=sq[0];
  if(k==='git'||k==='video'){const det=k==='git';stBoard(det?2:0.8);j.rep=clamp((j.rep||0)+(det?1:0.3),0,100);if(det)j.lvW=G.s.week;
    msg('scout',`Rakip raporu: ${opp.name}`,`${co.n}, ${co.f||'4-2-3-1'} dizilişiyle oynuyor. En tehlikeli oyuncu ${best?best.name+' ('+best.pos+')':'—'}${det&&sq[1]?`; ${sq[1].name} de forma durumunda`:''}. ${det?'Duran toplarda boy avantajları var; kanat bekleri hücuma çok çıkıyor.':'Video kayıtlarından genel bir özet hazırlandı.'}`);return det?'Ayrıntılı rapor teslim edildi':'Kısa rapor teslim edildi';}
  stBoard(-2);return 'Rapor bu hafta yok · yönetim −2';};
V155_DEC.sc_reg=(ev,k)=>{if(k==='git'){try{scGo(ev.lid);}catch(e){console.warn(e);}return '';}stBoard(-1);return 'Pazar raporu ertelendi';};

/* gözlemci ana sayfası: uzun bölümler "Ayrıntılar" altında */
viewStaffHub=(old=>function(){let h=old.apply(this,arguments);try{if(isStaff()&&!isRef()&&G.phase==='season'){h=v155Alert()+h;
    if(G.staff==='scout'){const i=h.indexOf('<div class="stabs">');if(i>=0){const tail=h.slice(i);const m=tail.match(/^([\s\S]*?<\/div>)/);/* sekme başlıkları kalsın, içerik katlansın */
      const k=tail.indexOf('</section>',tail.indexOf('<section'));if(k>0){const first=tail.slice(0,k+10),rest=tail.slice(k+10);if(rest.replace(/\s/g,'').length>400)h=h.slice(0,i)+first+`<details class="v155-more"><summary>Ayrıntılar · ağ, harita, bölgeler, gözlem turu</summary>${rest}</details>`;}}}}}catch(e){console.warn(e);}return h;})(viewStaffHub);
/* kendi personel kartında unvan ve potansiyel yıldızları */
stfCard=(old=>function(cid,i){const r=old.apply(this,arguments);try{const s=stfList(cid)[i];if(s&&s.me&&isStaff()&&G.job){const kk=$('#modalCard .stc-hd .kicker');if(kk)kk.textContent=G.job.title;}
    if(s){const [lo,hi]=potShown(s,G&&G.mode==='mgr'&&cid===G.club);const box=$('#modalCard .stc-st>div:nth-child(2) .stars');if(box){box.style.setProperty('--a',lo);box.style.setProperty('--p',hi);}}}catch(e){}return r;})(stfCard);
stfRowsHTML=(old=>function(cid){let h=old.apply(this,arguments);try{if(isStaff()&&G.job&&cid===G.club)h=h.replace(/(<button class="stf-row me"[^>]*><i>)[^<]*(<\/i>)/,`$1${esc(G.job.title)}$2`);}catch(e){}return h;})(stfRowsHTML);

/* =====================================================================
   SPORTİF DİREKTÖR ve BAŞKAN
   ===================================================================== */
const isBsk=()=>isRole()&&G.m.role==='bsk';
/* hoca ilişkisi (karar olaylarından) maça küçük etki */
mgrMods=(old=>function(){const r=old.apply(this,arguments);try{if(isRole()&&G.m.hcMood!=null){r.u*=1+(G.m.hcMood-60)/1500;}}catch(e){}return r;})(mgrMods);
function v155RoleDay(){const m=G.m,S=G.s,V=v155();if(!m||!m.hc)return;if(m.hcMood==null)m.hcMood=60;
  /* gelen transfer teklifi → onay kararı */
  if(V.q.length)return;
  const b=v155Due('bid',6)?(m.bids||[]).find(x=>x.until>S.day&&!x.v155&&squadOf(G.club).some(p=>p.k===x.k)):null;
  if(b){b.v155=1;v155Mark('bid');const p=pByKey(b.k),c=CLUBS[b.club];if(p&&c){v155Push({g:m.role,k:'bid',key:b.id,bid:b.id,t:`Teklif: ${p.name}`,b:`<p><b>${esc(c.name)}</b>, ${esc(p.name)} (${p.age}, ${p.pos}) için <b>${eur(b.fee)}</b> teklif etti. Piyasa değeri ${eur(pValue(p))}.</p><p class="muted">Hoca ${esc(m.hc.n)}: ${p.ovr>=xiStr()?'“İlk 11 oyuncusu, satılmasın.”':'“Kararı sana bırakıyorum.”'}</p>`,o:[['ac','Pazarlık masasına git','Teklifi incele, karşı teklif ver'],['red','Reddet','Oyuncu kalır'],['nfs','Satılık değil ilan et','Bu sezon teklifleri kapat']]});return;}}
  if(!v155Due('role',11))return;
  const n=Math.random();if(n>0.5)return;v155Mark('role');
  const sq=squadOf(G.club),exp=sq.filter(p=>{try{return ctExpiring(p)&&!(m.ct&&m.ct[p.k]&&m.ct[p.k].end>S.year+1);}catch(e){return false;}}).sort((a,b)=>b.ovr-a.ovr),rp=exp.find(p=>!(V.last['rn'+p.k])&&p.ovr>=myClub().str-3);
  const pool=[];if(rp&&m.role==='sd')pool.push('renew');pool.push('coach');if(v155Due('meet',40))pool.push('meet');if(rp&&m.role==='bsk')pool.push('renew');
  const k=pick(pool);
  if(k==='renew'){V.last['rn'+rp.k]=1;const w=pWage(rp,G.club),nw=rnd5(w*(1.12+Math.max(0,rp.ovr-myClub().str)*0.015),100),bon=Math.round(w*EUR_TL*6/1e3)*1e3;
    v155Push({g:m.role,k:'renew',key:rp.k,pk:rp.k,nw,bon,t:`Sözleşme: ${rp.name}`,b:`<p>${esc(rp.name)} (${rp.age}, güç ${R200(rp.ovr)}) ile sözleşmesi ${ctEnd(rp)} yazında bitiyor. Menajeri <b>${wgT(nw)}</b> ve ${money(bon)} imza parası istiyor (şu an ${wgT(w)}).</p><p class="muted">Yenilenmezse sezon sonunda bedelsiz ayrılır.</p>`,o:[['imza','Talebi kabul et, 3 yıl uzat',`İmza parası ${money(bon)}`],['gor','Görüşme masasına otur','Ayrıntılı pazarlık'],['red','Yenileme yapma','Oyuncu üzülür; sezon sonunda gider']]});}
  else if(k==='coach'){const H=m.hc,v=Math.random()<0.5?'kamp':'disi',bench=sq.filter(p=>p.age>=27).sort((a,b)=>a.ovr-b.ovr)[0];const cost=Math.round(clubBudget(myClub())*VALF*0.006/1e4)*1e4||10000;
    if(v==='disi'&&bench)v155Push({g:m.role,k:'coach',key:'d'+bench.k,v,pk:bench.k,t:`Hocanın talebi: ${bench.name}`,b:`<p>${esc(H.n)}: “${esc(bench.name)} soyunma odasında huzursuzluk çıkarıyor, forma için yeterli değil. Kadro dışı bırakmak istiyorum.”</p>`,o:[['evet','Hocaya destek ver','Hoca memnun; oyuncu küser'],['hayir','Oyuncuyu koru','Hoca ile ilişki gerilir']]});
    else v155Push({g:m.role,k:'coach',key:'k'+S.week,v:'kamp',cost,t:'Hocanın talebi: ara dönem kampı',b:`<p>${esc(H.n)}: “Takım yorgun ve uyumsuz. Milli ara için ${money(cost)} maliyetli kısa bir kamp istiyorum.”</p>`,o:[['evet','Onayla',`Bütçe −${money(cost)} · takım uyumu artar`],['hayir','Reddet','Bütçe korunur; hoca kırılır']]});}
  else if(k==='meet'){v155Mark('meet');const bsk=m.role==='bsk';
    v155Push({g:m.role,k:'meet',key:S.week,t:bsk?'Yönetim kurulu toplantısı':'Yönetim kurulu: transfer planı',b:`<p>${bsk?'Kurul üyeleri ikinci yarı için mali planını soruyor.':'Yönetim, transfer ve maaş planının sunulmasını istiyor.'} Lig sırası ${S.results.length?tablePos()+'.':'—'} · hedef: ${esc((m.obj||{}).txt||'—')} · bütçe ${money(m.budget)}.</p>`,
      o:bsk?[['denge','Dengeli plan sun','Üye desteği +1'],['yatirim','Kadroya yatırım: ek kaynak','Bütçe artar, borç artar, üye desteği −1'],['tasarruf','Tasarruf planı','Borç azalır, taraftar homurdanır']]
        :[['denge','Dengeli plan sun','Yönetim güveni +1'],['ek','Ek transfer bütçesi iste','Güven yüksekse kabul edilir'],['satis','Satış planı sun','Bütçe ihtiyacını satışla kapatma sözü']]});}}
V155_DEC.bid=(ev,k)=>{const m=G.m,b=(m.bids||[]).find(x=>x.id===ev.bid);if(!b)return 'Teklif geçerliliğini yitirdi';const p=pByKey(b.k);
  if(k==='ac'){setTimeout(()=>{try{bidOpen(b.id);}catch(e){console.warn(e);}},0);return '';}
  m.bids=m.bids.filter(x=>x!==b);if(k==='nfs'){m.nfs=m.nfs||{};m.nfs[b.k]=G.s.year;if(p)relAdd(p,4);return `${p?p.name:'Oyuncu'} satılık değil`;}if(p)relAdd(p,1);return 'Teklif reddedildi';};
V155_DEC.renew=(ev,k)=>{const m=G.m,p=squadOf(G.club).find(x=>x.k===ev.pk);if(!p)return '';
  if(k==='imza'){m.ct=m.ct||{};const cur=m.ct[p.k]||{};m.ct[p.k]=Object.assign({},cur,{w:ev.nw,end:G.s.year+3,role:cur.role!=null?cur.role:2});m.budget-=ev.bon;relAdd(p,6);msg('board','Sözleşme uzatıldı',`${p.name} ile ${G.s.year+3} yazına kadar yeni sözleşme imzalandı. Maaş ${wgT(ev.nw)}, imza parası ${money(ev.bon)}.`);return 'Sözleşme uzatıldı';}
  if(k==='gor'){setTimeout(()=>{try{renewStart(p.k);}catch(e){console.warn(e);}},0);return '';}
  relAdd(p,-8);msg('squad',`${p.name} üzgün`,`${p.name}, sözleşmesinin yenilenmeyeceğini öğrendi. Sezon sonunda bedelsiz ayrılacak.`);return 'Yenileme yapılmayacak';};
V155_DEC.coach=(ev,k)=>{const m=G.m;m.hcMood=m.hcMood==null?60:m.hcMood;const p=ev.pk?pByKey(ev.pk):null;
  if(ev.v==='disi'){if(k==='evet'){m.hcMood=clamp(m.hcMood+6,0,100);if(p)relAdd(p,-12);return 'Hoca memnun · oyuncu küstü';}m.hcMood=clamp(m.hcMood-7,0,100);if(p)relAdd(p,4);return 'Hocayla ilişki gerildi';}
  if(k==='evet'){m.budget-=ev.cost;m.hcMood=clamp(m.hcMood+5,0,100);for(const q of squadOf(G.club))relAdd(q,1);try{const f=fmInit();if(f&&f.fm&&f.fm.fam!=null)f.fm.fam=Math.min(100,f.fm.fam+4);}catch(e){}return 'Kamp onaylandı';}
  m.hcMood=clamp(m.hcMood-5,0,100);return 'Kamp reddedildi';};
V155_DEC.meet=(ev,k)=>{const m=G.m,base=Math.round(clubBudget(myClub())*VALF*0.05/1e4)*1e4;
  if(k==='denge'){m.conf=clamp(m.conf+1,0,100);return 'Plan onaylandı';}
  if(k==='yatirim'){const B=bskInit();m.budget+=base;B.debt+=Math.round(base*1.12);m.conf=clamp(m.conf-1,0,100);return `Ek kaynak: ${money(base)} (borçla)`;}
  if(k==='tasarruf'){const B=bskInit();const cut=Math.min(B.debt,base*0.6);B.debt-=cut;m.fans=clamp((m.fans==null?55:m.fans)-2,0,100);m.conf=clamp(m.conf+2,0,100);return 'Tasarruf planı kabul edildi';}
  if(k==='ek'){const ok=Math.random()<clamp(0.2+(m.conf-50)/70,0.05,0.85);if(ok){m.budget+=base;return `Yönetim ${money(base)} ek bütçe verdi`;}m.conf=clamp(m.conf-3,0,100);return 'Ek bütçe reddedildi';}
  m.conf=clamp(m.conf+0.5,0,100);m.v155sell=1;return 'Satış planı not edildi';};

/* SD/başkan ana sayfası: taktik salt okunur, oyuncu görüşmeleri hocada, antrenman ve lisans sekmeleri yok */
talkAdd=(old=>function(){if(isRole())return;return old.apply(this,arguments);})(talkAdd);
talkAlert=(old=>function(){if(isRole())return '';return old.apply(this,arguments);})(talkAlert);
stab=(old=>function(id,tabs){try{if(id==='mhub'&&isRole())tabs=tabs.filter(t=>!t||!['ant','lis'].includes(t[0]));}catch(e){}return old.call(this,id,tabs);})(stab);
viewMgrHub=(old=>function(){let h=old.apply(this,arguments);try{if(isRole()&&G.phase!=='off'){
    h=h.replace(/<button class="btn" data-act="goTak">Diziliş, roller ve talimatlar<\/button>/,`<p class="muted" style="margin:0">Diziliş ve talimatlar teknik direktör ${esc((G.m.hc||{}).n||'')} tarafından belirlenir.</p><button class="btn" data-act="navGo" data-tab="hcm">Teknik direktör yönetimi</button>`);
    h=h.replace(/(<button class="cta big" data-act="mgrPlay">)<span>[^<]*<\/span><small>[^<]*<\/small>/,`$1<span>Maç sonucunu al</span><small>Takımı hoca yönetir · sonuç ve rapor</small>`);
    if(h.includes('data-act="mgrPlay"')&&!h.includes('data-act="v155Watch"'))h=h.replace(/(<button class="cta big" data-act="mgrPlay">[\s\S]*?<\/button>)/,`$1<button class="btn w3b" data-act="v155Watch">🏟 Maçı tribünden izle <small>izleyici modu · taktik yok</small></button>`);
    h=h.replace(/<button class="btn" data-act="mgrSim">Hızlı sonuç<\/button>/,'');
    const H=G.m.hc||{},mood=G.m.hcMood==null?60:G.m.hcMood;h=v155Alert()+h.replace(/(<section class="panel role-hc">[\s\S]*?<\/section>)/,`$1`);
    h=h.replace(/<\/p><\/section>/,`</p><p class="muted" style="margin:6px 0 0">Hocayla ilişki: <b>${Math.round(mood)}</b>${mood<35?' · hoca rahatsız':''}</p></section>`);}}catch(e){console.warn(e);}return h;})(viewMgrHub);
/* tribünden izle: sonuç önce belirlenir, 2B/3B motor aynı skorla izleyici modunda oynar */
ACTX.v155Watch=()=>{if(!isRole()||typeof FX==='undefined'||FX)return;const f=ourFixture();if(!f||dayType(G.s.day)!=='mac')return;const usHome=f[0]===G.club,opp=CLUBS[usHome?f[1]:f[0]];
  const cap=[],o=openModal;openModal=function(h){cap.push(h);};const n0=G.s.results.length;try{mgrPlay(true);}catch(e){console.warn(e);}finally{openModal=o;}
  if(G.s.results.length===n0){if(cap.length)openModal(cap[cap.length-1]);return;}
  let gu=0,go=0;try{const rd=G.s.results[n0],row=rd&&rd.find(r=>r[0]===f[0]&&r[1]===f[1]);if(row){gu=usHome?row[2]:row[3];go=usHome?row[3]:row[2];}}catch(e){}
  const done=()=>{if(cap.length){openModal(cap[cap.length-1]);try{v155RichFT(gu,go,f);}catch(e){}}save();render();};
  try{w3Begin();fxStart({opp,usHome,neutral:false,onEnd:()=>{w3End();document.documentElement.classList.remove('v155-spec');done();}});const S=FX;S.scr=1;S.spec=1;S.forceG=[0,0];S.plan=w3Plan(gu,go);S.end=Math.max(S.end,91*60);$('#fx').classList.add('pl3');document.documentElement.classList.add('v155-spec');
    fxEv(0,`Tribündesin: ${S.U.name} – ${S.O.name}. Takımı ${(G.m&&G.m.hc&&G.m.hc.n)||'teknik direktör'} yönetiyor.`,'bold');try{if(f3Sup()&&!F3.on)f3Toggle(true);}catch(e){}}
  catch(e){console.warn('tribün',e);try{w3End();}catch(_){}document.documentElement.classList.remove('v155-spec');if(FX){try{cancelAnimationFrame(FX.raf);}catch(_){}$('#fx').hidden=true;FX=null;}done();}};
/* w3Begin gölge yönetimi kurar; SD/başkanın asıl G.m'si izleme bitince geri gelir (W3.had) */
/* yönetim ekranı: başkan zaten yönetimdir; SD'nin talepleri sportif direktörlüğe uygun */
viewMgrBoard=(old=>function(){let h=old.apply(this,arguments);try{if(isRole()){
    if(isBsk())h=h.replace(/<section class="panel"><p class="sub-h"><span>Yönetimden talep et<\/span><\/p>[\s\S]*?<\/section>/,`<section class="panel"><p class="sub-h"><span>Yönetim kurulu</span></p><p class="muted" style="margin:0">Kulübün yönetimi sensin. Bütçe, tesis yatırımı, kredi ve sponsorluk kararları Başkanlık ekranında.</p><button class="btn" data-act="navGo" data-tab="bsk" style="margin-top:8px">Başkanlık ekranına git</button></section>`);
    else h=h.replace(/<button class="req" data-act="mreq" data-k="quit"><b>İstifa et<\/b><small>[^<]*<\/small><\/button>/,`<button class="req" data-act="mreq" data-k="quit"><b>Görevden ayrıl</b><small>Sportif direktörlükten istifa; yeni kulüp ararsın</small></button>`).replace('Antrenman tesislerini geliştir','Antrenman ve akademi tesisi (tek seviye)');}}catch(e){}return h;})(viewMgrBoard);
ACTX.visMeet=(old=>function(){const r=old?old.apply(this,arguments):undefined;try{if(isBsk()){const mc=$('#modalCard');mc.querySelectorAll('[data-act="mreq"],[data-act="breq"]').forEach(b=>b.remove());}}catch(e){}return r;})(ACTX.visMeet);
/* tesis seviyesi tek kaynak: kulüp tesisi (cs.fac) = akademi tesisi */
acadInit=(old=>function(){const m=old.apply(this,arguments);try{if(m&&G.club&&CLUBS[G.club]){const cs=cstate(G.club);if(!m.v155fac){m.v155fac=1;cs.fac=clamp(Math.max(cs.fac,m.acadLv||1),1,5);}m.acadLv=cs.fac;}}catch(e){}return m;})(acadInit);
ACTX.acadUp=(old=>function(){const r=old?old.apply(this,arguments):undefined;try{if(G.m&&G.club){const cs=cstate(G.club);cs.fac=clamp(Math.max(cs.fac,G.m.acadLv||1),1,5);G.m.acadLv=cs.fac;save();render();}}catch(e){}return r;})(ACTX.acadUp);
/* yönetim güveni: deplasmanda/iç sahada mağlubiyet güveni artırmaz; beklenti farkı sınırlı */
mgrFinish=(old=>function(gu,go,f){const m=G.m;let c0=null,S0=0,opp=null;try{if(m&&!m.shadow){c0=m.conf;opp=CLUBS[f[0]===G.club?f[1]:f[0]];S0=xiStr();}}catch(e){}
  const r=old.apply(this,arguments);
  try{if(c0!=null&&opp){const win=gu>go,draw=gu===go,usHome=f[0]===G.club,exp=(S0-opp.str)/20+(usHome?0.1:-0.1),dOld=(win?4:draw?0.5:-4)-exp*3,e=clamp(0.5+exp*0.35,0.15,0.85),res=win?1:draw?0.45:0;
      let dNew=(res-e)*7;if(win)dNew=Math.max(dNew,0.8);else if(!draw)dNew=Math.min(dNew,-1);
      const extra=(m.conf-c0)-clamp(dOld,-100,100);m.conf=clamp(c0+dNew+extra,0,100);const cs=cstate(G.club);cs.board=m.conf;
      const mc=$('#modalCard');if(mc&&!$('#modal').hidden){mc.querySelectorAll('.notes li').forEach(li=>{if(/^Yönetim güveni:/.test(li.textContent))li.textContent=`Yönetim güveni: ${Math.round(m.conf)}`;});}}}catch(e){console.warn(e);}
  try{v155RichFT(gu,go,f);}catch(e){console.warn('v155 maç sonu',e);}return r;})(mgrFinish);
/* sezon sonu değerlendirme (SD/başkan) */
mgrSeasonEnd=(old=>function(){const m=G.m;let pre=null;try{if(isRole()){const B=m.role==='bsk'?bskInit():null;pre={pos:tablePos(),obj:m.obj?Object.assign({},m.obj):null,budget:m.budget,debt:B?B.debt:0,conf:m.conf,fans:m.fans,st:Object.assign({},m.st),sp:B&&B.sp?B.sp.n:null,hc:m.hc?m.hc.n:'',yl:seasonLabel(G.s.year)};}}catch(e){}
  const r=old.apply(this,arguments);
  try{if(pre){const c=myClub(),ok=pre.obj?pre.pos<=pre.obj.pos:false;let nx=null;try{nx=mgrObjective(c);}catch(e){}const nb=Math.round(clubBudget(c)*0.3*VALF/1e4)*1e4;
    const verdict=m.sacked?'Yönetim yollarını ayırdı':m.conf>=70?'Yönetim çok memnun':m.conf>=45?'Yönetim memnun, beklentiler sürüyor':'Yönetim ciddi şekilde endişeli';
    v155().rev={yl:pre.yl,pos:pre.pos,obj:pre.obj?pre.obj.txt:'—',ok,st:pre.st,budget:pre.budget,debt:pre.debt,conf:Math.round(m.conf),fans:Math.round(m.fans==null?55:m.fans),sp:pre.sp,hc:pre.hc,verdict,next:nx?nx.txt:'—',nb,role:m.role,sacked:!!m.sacked,seen:0};}}catch(e){console.warn(e);}return r;})(mgrSeasonEnd);
function v155RevHTML(R){if(!R)return '';const bsk=R.role==='bsk';
  return `<section class="v155-rev"><span class="kicker">${bsk?'Başkanlık':'Sportif direktörlük'} · ${esc(R.yl)} sezon değerlendirmesi</span><h3>${esc(R.verdict)}</h3>
   <div class="strip"><div><b>${R.pos}.</b><span>Sıra</span></div><div><b>${R.st.w}-${R.st.d}-${R.st.l}</b><span>G-B-M</span></div><div><b>${R.st.gf}:${R.st.ga}</b><span>Gol</span></div><div><b>${R.conf}</b><span>${bsk?'Üye desteği':'Yönetim güveni'}</span></div></div>
   <ul class="cupres"><li><span>Hedef</span><b>${esc(R.obj)}</b><em class="${R.ok?'res-w':'res-l'}">${R.ok?'başarıldı':'tutmadı'}</em></li>
    <li><span>Finans</span><b>Kalan transfer bütçesi ${money(R.budget)}${bsk?` · borç ${money(R.debt)}`:''}</b><em></em></li>
    ${bsk?`<li><span>Taraftar</span><b>${R.fans} · forma sponsoru ${esc(R.sp||'yok')}</b><em></em></li>`:''}
    <li><span>Teknik direktör</span><b>${esc(R.hc||'—')}</b><em></em></li></ul>
   <p class="sub-h" style="margin:12px 0 6px"><span>Gelecek sezon</span></p><ul class="cupres"><li><span>Hedef</span><b>${esc(R.next)}</b><em></em></li><li><span>Bütçe</span><b>yaklaşık ${money(R.nb)}${bsk?' + devreden bütçenin yarısı':''}</b><em></em></li></ul>
   ${R.sacked?'<p class="pill red">Görevden alındın · yeni bir kulüp seçmelisin</p>':''}<button class="cta" data-act="closeModal" style="margin-top:10px">Tamam</button></section>`;}
render=(old=>function(){const r=old.apply(this,arguments);try{const V=G&&G.v155;if(V&&V.rev&&!V.rev.seen&&isRole()&&G.phase==='off'&&$('#modal').hidden&&!(typeof FX!=='undefined'&&FX)){V.rev.seen=1;setTimeout(()=>{try{if($('#modal').hidden){openModal(v155RevHTML(V.rev));$('#modalCard').classList.add('wide');}}catch(e){}},30);}}catch(e){}return r;})(render);
ACTX.v155Rev=()=>{const V=v155();if(V.rev){openModal(v155RevHTML(V.rev));$('#modalCard').classList.add('wide');}};
viewMgrOff=(old=>function(){let h=old.apply(this,arguments);try{const V=v155();if(isRole()&&V.rev)h=`<button class="talk-alert" data-act="v155Rev"><b>📋 ${esc(V.rev.yl)} sezon değerlendirmesi</b><small>${esc(V.rev.verdict)} · hedefler, finans, gelecek sezon</small></button>`+h;}catch(e){}return h;})(viewMgrOff);

/* ---------- başkan: seçim ve sponsor pazarlığı ---------- */
const V155_PROG={sampiyon:['Şampiyonluk projesi','Yıldız transferleri ve büyük hedefler',{conf:4,fans:3,debt:0.06}],mali:['Mali disiplin','Borcu azaltma, gerçekçi bütçe',{conf:3,fans:-1,debt:-0.04}],altyapi:['Altyapı ve tesis','Akademi, tesis ve yerli oyuncu',{conf:2,fans:2,debt:0.02}]};
elWeek=(old=>function(){const bsk=isBsk(),E=bsk?elInit():null,had=E&&E.cur?Object.assign({},E.cur):null,inb=G.inbox&&G.inbox[0];const r=old.apply(this,arguments);
  try{if(!bsk)return r;const m=G.m;if(!had&&E.cur&&!E.cur.v155){E.cur.v155=1;const ch=E.cur.ch,rp=pick(Object.keys(V155_PROG));E.cur.rp=rp;
      v155Push({g:'el',k:'el_prog',key:E.cur.at,t:'Seçim kampanyası: programını açıkla',b:`<p>Olağan genel kurul ${Math.max(0,E.cur.at-absDay())} gün sonra. Rakip aday <b>${esc(ch)}</b> “${esc(V155_PROG[rp][0])}” programıyla çıkıyor: ${esc(V155_PROG[rp][1].toLocaleLowerCase('tr-TR'))}.</p><p class="muted">Vaatlerin üyelerin oyunu ve kulübün mali yükünü etkiler.</p>`,o:Object.entries(V155_PROG).map(([k,v])=>[k,v[0],v[1]])});}
    if(had&&!E.cur){const won=G.inbox&&G.inbox[0]&&G.inbox[0]!==inb&&/Yeniden başkan seçildin/.test(G.inbox[0].title);const lost=!won;const base=clamp(0.3+m.conf/160+((m.fans||55)-50)/200,0.1,0.9);
      let me=Math.round(clamp(won?Math.max(51,base*100+rint(-4,6)):Math.min(49,base*100+rint(-6,4)),18,86)),tot=rint(4200,18500);const mine=Math.round(tot*me/100);
      E.hist=(E.hist||[]);E.hist.unshift({y:G.s.year,me,ch:had.ch,won});
      v155Push({g:'el',k:'el_res',key:had.at,info:1,t:won?'Genel kurul: yeniden seçildin!':'Genel kurul: seçimi kaybettin',b:`<div class="v155-vote"><div><b>${esc(PN())}</b><i><em style="width:${me}%"></em></i><span>%${me} · ${mine.toLocaleString('tr-TR')} oy</span></div><div><b>${esc(had.ch)}</b><i><em class="r" style="width:${100-me}%"></em></i><span>%${100-me} · ${(tot-mine).toLocaleString('tr-TR')} oy</span></div></div><p>${won?`Üyeler ${had.prog?`“${esc(V155_PROG[had.prog][0])}” programına`:'yönetimine'} güvenini yineledi. 3 yıl daha görevdesin.`:`${esc(had.ch)} başkan seçildi. Görevin sona erdi; yeni bir kulüp arayabilirsin.`}</p>`,o:[['ok',won?'Göreve devam':'Tamam']]});}}catch(e){console.warn(e);}return r;})(elWeek);
V155_DEC.el_prog=(ev,k)=>{const E=elInit(),m=G.m,B=bskInit(),P=V155_PROG[k];if(!P)return '';if(E.cur)E.cur.prog=k;const fx=P[2],base=clubBudget(myClub())*VALF;m.conf=clamp(m.conf+fx.conf,0,100);m.fans=clamp((m.fans==null?55:m.fans)+fx.fans,0,100);
  if(fx.debt>0){const add=Math.round(base*fx.debt/1e4)*1e4;m.budget+=add;B.debt+=Math.round(add*1.1);}else{const cut=Math.min(B.debt,Math.round(base*-fx.debt/1e4)*1e4);B.debt-=cut;m.budget-=cut;}
  msg('board','Seçim programı açıklandı',`“${P[0]}” programınla genel kurula gidiyorsun. ${fx.debt>0?'Vaatlerin için ek kaynak ayrıldı; borç arttı.':'Mali disiplin sözü üyelerin bir kısmını memnun etti.'}`);return `Programın: ${P[0]}`;};
V155_DEC.el_res=()=>'';
ACTX.bskSpNeg=el=>{const B=bskInit(),i=+el.dataset.i,o=B.spO[i];if(!o)return;o.neg=o.neg||{n:0,base:o.amt};
  openModal(`<section class="v155-dec"><span class="kicker">Sponsorluk pazarlığı</span><h3>${esc(o.n)}</h3><div class="v155-b"><p>Teklif: <b>${o.y} yıl</b>, yıllık <b>${money(o.amt)}</b>.${o.neg.n?` Pazarlık turu ${o.neg.n}/2.`:''}</p><p class="muted">Ne kadar yüksek istersen şirketin masadan kalkma ihtimali o kadar artar. İki turdan sonra son teklifini yapar.</p></div>
   <div class="v155-opts">${[[5,'%5 fazlasını iste','Büyük ihtimalle kabul'],[12,'%12 fazlasını iste','Orta risk'],[25,'%25 fazlasını iste','Yüksek risk']].map(([p,l,d],x)=>`<button class="${x===0?'cta':'btn'} v155-o" data-act="bskSpAsk" data-i="${i}" data-p="${p}"><b>${l}</b><small>${money(Math.round(o.amt*(1+p/100)/1e4)*1e4)} · ${d}</small></button>`).join('')}
   <button class="btn v155-o" data-act="bskSp" data-i="${i}"><b>Mevcut teklifi imzala</b><small>${money(o.amt)} · ${o.y} yıl</small></button><button class="btn ghost" data-act="closeModal">Vazgeç</button></div></section>`);};
ACTX.bskSpAsk=el=>{const B=bskInit(),i=+el.dataset.i,o=B.spO[i],p=+el.dataset.p;if(!o)return closeModal();o.neg=o.neg||{n:0,base:o.amt};o.neg.n++;
  const ch=clamp(0.95-p*0.028-o.neg.n*0.06-((o.amt/o.neg.base)-1)*1.2,0.05,0.95),ask=Math.round(o.amt*(1+p/100)/1e4)*1e4;
  if(Math.random()<ch){o.amt=ask;closeModal();B.sp=o;B.spO=[];msg('board','Sponsorluk imzalandı',`${o.n} karşı teklifini kabul etti: ${o.y} yıllık, yıllık ${money(o.amt)}.`);toast('Karşı teklif kabul edildi');save();render();return;}
  if(o.neg.n>=2||Math.random()<p/60){B.spO.splice(i,1);closeModal();msg('board','Sponsor masadan kalktı',`${o.n} pazarlığı sonlandırdı ve teklifini geri çekti.`);toast(`${o.n} teklifini geri çekti`);save();render();return;}
  o.amt=Math.round((o.amt+(ask-o.amt)*0.4)/1e4)*1e4;toast(`${o.n} yeni teklif: ${money(o.amt)}`);save();ACTX.bskSpNeg(el);};
viewBsk=(old=>function(){let h=old.apply(this,arguments);try{const B=bskInit(),E=elInit();h=h.replace(/(<button class="btn sm" data-act="bskSp" data-i="(\d+)">İmzala<\/button>)/g,(m,b,i)=>`<span class="v155-spb"><button class="btn sm ghost" data-act="bskSpNeg" data-i="${i}">Pazarlık</button>${b}</span>`);
    if(E.cur&&E.cur.rp)h=h.replace(/(Rakip aday <b>[^<]*<\/b>\.)/,`$1 Programı: “${esc(V155_PROG[E.cur.rp][0])}”.${E.cur.prog?` Senin programın: “${esc(V155_PROG[E.cur.prog][0])}”.`:''}`);
    if((E.hist||[]).length)h+=`<section class="panel"><p class="sub-h"><span>Seçim geçmişi</span></p><ul class="cupres">${E.hist.slice(0,5).map(x=>`<li><span>${x.y}</span><b>%${x.me} · rakip ${esc(x.ch)}</b><em class="${x.won?'res-w':'res-l'}">${x.won?'kazandın':'kaybettin'}</em></li>`).join('')}</ul></section>`;}catch(e){console.warn(e);}return h;})(viewBsk);

/* =====================================================================
   TEKNİK DİREKTÖR: zengin maç sonu ekranı + maç sonu basın toplantısı + bağlama göre sorular
   ===================================================================== */
function v155RichFT(gu,go,f){const mc=$('#modalCard');if(!mc||$('#modal').hidden||!G.m||G.m.shadow)return;const h3=mc.querySelector('h3');if(!h3||!/Maç sonucu/i.test(h3.textContent)||mc.querySelector('.ms-cols'))return;
  const usHome=f[0]===G.club,hg=usHome?gu:go,ag=usHome?go:gu,H=CLUBS[f[0]],A=CLUBS[f[1]],r=srnd(f.join('')+G.s.year+'v155'+G.s.week);let goals=[];try{goals=stGoalsFrom(f,hg,ag,V155_PS0);}catch(e){}
  const team=(id,gf,ga)=>{const sq=squadOf(id);let xi=[];try{xi=(id===G.club&&G.m.xi&&G.m.xi.length?G.m.xi:autoXI(sq)).map(k=>sq.find(q=>q.k===k)).filter(Boolean);}catch(e){xi=sq.slice(0,11);}try{for(const g of goals){if(g.cid!==id)continue;for(const k of [g.k,g.ak]){if(k&&!xi.some(p=>p.k===k)){const q=sq.find(x=>x.k===k);if(q)xi.push(q);}}}}catch(e){}const avg=xi.reduce((a,p)=>a+p.ovr,0)/Math.max(1,xi.length),win=gf>ga,draw=gf===ga;
    return xi.map(p=>{const g=goals.filter(x=>x.k===p.k).length,a=goals.filter(x=>x.ak===p.k).length;let rt=6.5+(win?0.35:draw?0:-0.35)+g*0.9+a*0.5+(p.ovr-avg)*0.03+(r()-0.5)*0.9;if(p.pos==='KL')rt+=ga===0?0.6:-ga*0.25;if(p.pos==='DF')rt+=ga===0?0.3:-ga*0.12;return {p,g,a,rt:clamp(Math.round(rt*10)/10,4.5,10)};})
      .sort((x,y)=>['KL','DF','OS','KN','FW'].indexOf(x.p.pos)-['KL','DF','OS','KN','FW'].indexOf(y.p.pos));};
  const TH=team(f[0],hg,ag),TA=team(f[1],ag,hg),motm=TH.concat(TA).sort((a,b)=>b.rt-a.rt)[0];if(!motm)return;
  const gl=goals.slice().sort((a,b)=>a.m-b.m).map(x=>`<li class="${x.side?'r':''}"><i>${x.m}’</i>⚽ <span class="plink" data-act="pcard" data-id="${x.cid}" data-k="${x.k}">${esc(x.n)}</span>${x.an?` <small>(asist: ${esc(x.an)})</small>`:''}</li>`).join('');
  const col=(T,c)=>`<div class="ms-col"><p class="sub-h"><span>${crestSVG(c,16)} ${esc(c.short)}</span><span>Reyting</span></p>${T.map(x=>`<div class="ms-r${x===motm?' motm':''}"><span>${x.p.pos}</span><b class="plink" data-act="pcard" data-id="${c.id}" data-k="${x.p.k}">${esc(x.p.name)}</b><small>${'⚽'.repeat(x.g)}${x.a?' 🅰'.repeat(x.a):''}</small><em class="${x.rt>=7.5?'hi':x.rt<6?'lo':''}">${x.rt.toFixed(1)}</em></div>`).join('')}</div>`;
  const board=mc.querySelector('.res-board'),notes=mc.querySelector('ul.notes');
  if(board)board.insertAdjacentHTML('afterend',`${gl?`<ul class="ms-goals">${gl}</ul>`:'<p class="muted" style="text-align:center">Golsüz maç</p>'}<p class="ms-motm">⭐ Maçın oyuncusu: <b>${esc(motm.p.name)}</b> · ${motm.rt.toFixed(1)}</p><div class="ms-cols">${col(TH,H)}${col(TA,A)}</div>`);
  mc.classList.add('wide');
  /* teknik direktör: maç sonu basın toplantısı (kapanınca) */
  if(G.mode==='mgr'&&!isRole()&&Math.random()<0.55){const b=mc.querySelector('button.cta[data-act="closeModal"]');if(b){b.dataset.act='v155PostPress';b.insertAdjacentHTML('afterend','<small class="muted v155-pp">Basın seni bekliyor</small>');V155_POST={gu,go,f,motm:motm.p.name,mine:TH.concat(TA).find(x=>x===motm)&&(usHome?TH:TA).includes(motm)};}}}
let V155_PS0=null,V155_POST=null;
/* maç öncesi gol/asist anlık görüntüsü (gerçek golcüler için) */
mgrFinish=(old=>function(){try{const S=G.s.ps||{},o={};for(const p of squadOf(G.club))if(S[p.k])o[p.k]={g:S[p.k].g||0,a:S[p.k].a||0};const f=arguments[2];if(f){const oid=f[0]===G.club?f[1]:f[0];for(const p of squadOf(oid))if(S[p.k])o[p.k]={g:S[p.k].g||0,a:S[p.k].a||0};}V155_PS0=o;}catch(e){V155_PS0=null;}
  try{return old.apply(this,arguments);}finally{V155_PS0=null;}})(mgrFinish);
function v155Ctx(opp){const out={};try{const last=G.s.results.slice(-5).map(rd=>rd.find(x=>x[0]===G.club||x[1]===G.club)).filter(Boolean);let w=0,l=0;for(const x of last){const u=x[0]===G.club?x[2]:x[3],o=x[0]===G.club?x[3]:x[2];if(u>o)w++;else if(u<o)l++;}out.w=w;out.l=l;out.n=last.length;}catch(e){}
  try{out.tw=twOpen();}catch(e){out.tw=false;}try{out.derby=opp?derbyOf(G.club,opp.id):null;}catch(e){}try{out.pos=G.s.results.length?tablePos():null;}catch(e){}out.diff=opp?opp.str-xiStr():0;return out;}
function v155PreQs(opp){const C=v155Ctx(opp),Q=[];
  if(C.derby)Q.push({q:()=>`${C.derby.n||'Derbi'} öncesi: taraftar sadece galibiyet istiyor. Bu maç sizin için ne ifade ediyor?`,a:[['Derbi bambaşka bir maç, hazırız',{tm:2,opp:1,b:1}],['Üç puanlık bir maç, sakin kalacağız',{tm:1,opp:0,b:0}],['Rakibin bizi korkuttuğunu düşünmüyorum',{tm:2,opp:2.5,b:0}]]});
  if(C.n>=3&&C.l>=3)Q.push({q:()=>`Son ${C.n} maçta ${C.l} mağlubiyet aldınız. Koltuğunuz sallanıyor mu?`,a:[['Sorumluluk bende, düzelteceğiz',{tm:1,opp:0,b:1}],['Oyuncularıma sonuna kadar güveniyorum',{tm:3,opp:0,b:0}],['Bu soruyu cevaplamayacağım',{tm:0,opp:0,b:-2}]]});
  else if(C.n>=3&&C.w>=3)Q.push({q:()=>`Son ${C.n} maçta ${C.w} galibiyet: seri sürecek mi?`,a:[['Ayaklarımız yere basıyor',{tm:1,opp:-0.5,b:1}],['Bu takım her maçı kazanabilir',{tm:2,opp:1,b:0}],['Rakip kim olursa olsun fark etmez',{tm:2,opp:2,b:-0.5}]]});
  if(C.tw)Q.push({q:()=>'Transfer dönemi açık: kadroya takviye yapacak mısınız?',a:[['Kadromdan memnunum',{tm:2,opp:0,b:0}],['Yönetimle görüşüyoruz',{tm:0,opp:0,b:1}],['Bu kadroyla hedefe ulaşmak zor',{tm:-4,opp:0,b:-1}]]});
  else Q.push({q:()=>'Transfer dönemi kapandı. Eksik kaldığınız bir mevki var mı?',a:[['Bu kadroya güveniyorum',{tm:2,opp:0,b:0}],['Altyapıdan oyuncu çıkaracağız',{tm:1,opp:0,b:1}],['Yönetim bizi yalnız bıraktı',{tm:-1,opp:0,b:-3}]]});
  if(opp&&C.diff>=4)Q.push({q:o=>`${o.name} kâğıt üstünde sizden güçlü. Nasıl bir plan var?`,a:[['Disiplinli savunup kontra atağa çıkacağız',{tm:1,opp:-0.5,b:0}],['Kimseden korkumuz yok',{tm:2,opp:1.5,b:0}],['Puan alırsak büyük başarı olur',{tm:-1,opp:-1,b:0.5}]]});
  else if(opp&&C.diff<=-4)Q.push({q:o=>`${o.name} karşısında favori sizsiniz. Rehavet tehlikesi var mı?`,a:[['Hiçbir maçı küçümsemiyoruz',{tm:1,opp:-0.5,b:1}],['Farklı kazanmak istiyoruz',{tm:2,opp:1.5,b:0}],['Onlar bizim seviyemizde değil',{tm:2,opp:2.5,b:-1}]]});
  if(C.pos!=null&&C.pos<=2)Q.push({q:()=>`Zirvedesiniz (${C.pos}. sıra). Şampiyonluk konuşulabilir mi?`,a:[['Maç maç bakıyoruz',{tm:1,opp:0,b:1}],['Hedefimiz şampiyonluk',{tm:2,opp:1,b:0}],['Erken, baskıyı istemiyoruz',{tm:0,opp:0,b:0}]]});
  if(opp)Q.push({q:o=>`${o.name} maçı öncesi: rakibinizi nasıl değerlendiriyorsunuz?`,a:[['Saygı duyuyoruz, zor bir maç olacak',{tm:1,opp:-0.5,b:0}],['Kazanmak için sahaya çıkıyoruz',{tm:2,opp:1,b:1}],['Onlar bizim seviyemizde değil',{tm:3,opp:2.5,b:-1}]]});
  return Q;}
pressConf=(old=>function(opp,next){let keep=null;try{if(G.mode==='mgr'&&!isRole()){const Q=v155PreQs(opp);if(Q.length){keep=PRESS.slice();PRESS.length=0;PRESS.push(Q[0]);}}}catch(e){keep=null;}
  try{return old.apply(this,arguments);}finally{if(keep){PRESS.length=0;keep.forEach(x=>PRESS.push(x));}}})(pressConf);
ACTX.v155PostPress=()=>{const P=V155_POST;V155_POST=null;closeModal();if(!P||!G||!G.m)return;const {gu,go,f}=P,opp=CLUBS[f[0]===G.club?f[1]:f[0]];let D=null;try{D=derbyOf(f[0],f[1]);}catch(e){}
  const win=gu>go,draw=gu===go,big=Math.abs(gu-go)>=3;let q,a;
  if(win&&D){q=`${D.n||'Derbi'} sizin! ${gu}-${go}’lık galibiyeti kime armağan ediyorsunuz?`;a=[['Taraftarımıza, bu gece onların',{tm:2,opp:0,b:2}],['Oyuncularıma, her şeyi verdiler',{tm:3,opp:0,b:0}],['Rakibin sözlerine cevap verdik',{tm:2,opp:2,b:-1}]];}
  else if(win&&big){q=`${gu}-${go}’lık farklı galibiyet. Takımın en iyi maçı mıydı?`;a=[['Mükemmeldi, oyuncularımı tebrik ederim',{tm:3,opp:0,b:1}],['Hâlâ düzeltecek çok şey var',{tm:1,opp:0,b:1}],['Rakip çok zayıftı',{tm:1,opp:1.5,b:-0.5}]];}
  else if(win){q=`${esc(P.motm)} maçın oyuncusu seçildi. Galibiyetin anahtarı neydi?`;a=[['Takım oyunu ve disiplin',{tm:2,opp:0,b:1}],[`${P.motm} farkı yarattı`,{tm:1,opp:0,b:0}],['Hak edilmiş üç puan, başka söze gerek yok',{tm:1,opp:0.5,b:0}]];}
  else if(draw){q='Beraberlik: bir puan mı kazandınız, iki puan mı kaybettiniz?';a=[['Bir puan da değerli',{tm:1,opp:0,b:0}],['Kazanmamız gereken bir maçtı',{tm:-1,opp:0,b:0.5}],['Hakem kararları bizi etkiledi',{tm:1,opp:0.5,b:-1}]];}
  else{q=`${opp?opp.name:'Rakip'} karşısında ${go}-${gu} mağlubiyet. Sorumluluk kimde?`;a=[['Sorumluluk tamamen bende',{tm:2,opp:0,b:1}],['Oyuncular beklentinin altında kaldı',{tm:-4,opp:0,b:0}],['Şanssızdık, oyunun hakkı bu değildi',{tm:0,opp:0,b:-1}]];}
  PCN=null;PCA=a;openModal(`<section class="press"><div class="pr-hd"><span class="kicker">Basın toplantısı</span><h3>Maç sonrası</h3></div><p class="pr-q">“${esc(q)}”</p><div class="pr-a">${a.map(([t],i)=>`<button class="btn" data-act="press" data-k="${i}">${esc(t)}</button>`).join('')}</div><button class="btn ghost" data-act="press" data-k="-1">Toplantıya katılma</button></section>`);};

/* =====================================================================
   ORTAK ARAYÜZ
   ===================================================================== */
render=(old=>function(){const r=old.apply(this,arguments);try{if(!G)return r;document.documentElement.classList.toggle('v155-ref',isRef());
    if(isRef()){const t=$('#top');if(t){t.style.setProperty('--club','#3a4152');const cr=t.querySelector('.top-club>svg');if(cr)cr.outerHTML='<span class="ref-ic">🟨</span>';const tx=t.querySelector('.top-txt');if(tx&&G.job)tx.innerHTML=`<b>${esc(PN())}</b><span>${esc(G.job.title)}${G.phase==='retired'?' · men edildi':''}</span>`;}
      const nb=document.querySelector('.nav-brand');if(nb){const sv=nb.querySelector('svg');if(sv)sv.outerHTML='<span class="ref-ic">🟨</span>';const bb=nb.querySelector('b');if(bb)bb.textContent='Hakem';}}
    /* sayfa başlığı: genel "Kulüp"/"Takım" yerine menüdeki sekme adı */
    const h2=document.querySelector('#view h2.h');if(h2&&/^(Kulüp|Takım)$/.test(h2.textContent.trim())){let lab=null;for(const [,its] of navCats())for(const [,l,a] of its){if(a.tab!==TAB)continue;if(a.k&&typeof KTAB!=='undefined'&&a.k!==KTAB)continue;lab=lab||l;if(a.k)lab=l;}if(lab&&lab!==h2.textContent.trim())h2.textContent=lab;}
    /* sezon dışı: yalnız bilgi olayları (seçim sonucu gibi) bir kez gösterilir */
    {const V=v155();if(G.phase!=='season'&&V.q.length){V.q=V.q.filter(x=>x.info);if(V.q.length&&$('#modal').hidden&&!(typeof FX!=='undefined'&&FX)){const ev=V.q.shift();ev.det=1;setTimeout(()=>{try{if($('#modal').hidden)v155Show(ev);}catch(e){}},40);}}}
    /* bekleyen karar uyarısı (ana sayfa) */
    if(TAB==='hub'&&G.phase==='season'&&(isRole()||isStaff())){const v=$('#view');if(v&&v155().q.length&&!v.querySelector('.v155-alert'))v.insertAdjacentHTML('afterbegin',v155Alert());}}catch(e){}return r;})(render);
/* pasif (devre dışı) düğme: neden çalışmadığını söyle */
document.addEventListener('pointerdown',e=>{try{const b=e.target&&e.target.closest&&e.target.closest('button[disabled],.req[disabled]');if(!b||!b.closest('#view,#modalCard'))return;
  const why=b.dataset.why||b.title||((b.querySelector('small')||{}).textContent||'').trim();toast(why?`Şu an yapılamaz: ${why}`:'Bu işlem şu an kullanılamıyor');}catch(x){}},true);
viewHcm=(old=>function(){let h=old.apply(this,arguments);try{h=h.replace(/(data-act="hcHire" data-i="\d+") disabled>/g,'$1 disabled data-why="önce mevcut teknik direktörü görevden almalısın">');}catch(e){}return h;})(viewHcm);
