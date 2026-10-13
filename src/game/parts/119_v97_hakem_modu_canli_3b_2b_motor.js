/* ================= v97: hakem modu canlı (3B/2B) — motor pozisyonda durur, karar senin · yardımcı hakemler · VAR monitörü · serbest kart · MHK =================
   Football Referee Simulator ve IFAB Kural 12'den: faul/avantaj/penaltı, sarı/kırmızı, ofsayt; VAR yalnız "açık ve net hata"da sahaya çağırır (OFR), son karar hakemindir. */
const ABR={open:0,ask:null,n:0,cap:12,just:{},nextBeh:0,stage:null,sel:null,cues:[],voices:[],warn:[],rp:0,fouls:{}};
REF_TN.gol='Gol kararı';REF_TN.serbest='Kart (oyun dışı)';REF_TN.sim='Simülasyon şüphesi';REF_TN.faul='Faul / kart kararı';
function refLiveOn(){const S=ABM.fx;return !!(S&&FX===S&&S.ref3&&S.ab&&REF&&REF.live);}
function abrSide(e){return e===0?ABM.s0:1-ABM.s0;}
function abrP(i){const sim=ABM.sim,q=sim&&sim.players[i];if(!q)return {name:'?',short:'?',tm:'',num:''};const p=abFxP(i),S=ABM.fx,T=S.T[abrSide(q.team)];return {name:p?p.name:q.name,short:p?(p.sur||p.name):(q.short||q.name),tm:T?T.short:'',num:p&&p.num!=null?p.num:'',yc:q.yc||0,nf:q.nf||0,off:!!q.off,team:q.team};}
function abrVoiceNames(){if(!ABR.vn)ABR.vn=refAsst();return ABR.vn;}
/* hangi pozisyonlarda oyun durur: penaltı, kırmızılık, gol şansı her zaman; sarılıkların bir kısmı; sıradan fauller seyrek (maç başına üst sınır) */
function abrWant(inf){if(ABM.ff||!refLiveOn())return false;const T=inf.truth;if(ABR.n>=ABR.cap+6)return false;
  if(inf.pen||T.card==='R'||T.card==='R2'||inf.dogso>=.3)return true;if(ABR.n>=ABR.cap)return false;
  if(T.card==='Y')return Math.random()<.6;return Math.random()<.12;}
function abrWantGoal(gi){if(ABM.ff||!refLiveOn())return false;if(gi.truth.call!=='gol')return true;return Math.random()<.14;}
/* ---------- gördüklerin: kuralın gerçeğinden türeyen, çelişmeyen işaretler (bazıları görüş açısından kaçabilir) ---------- */
function abrCues(A){const L=[];if(A.kind==='goal'){const T=A.truth.call,mg=A.vr&&A.vr.margin!=null?Math.abs(A.vr.margin):null;
    if(T==='ofs'){L.push(mg!=null&&mg<.25?'Pas anında golcü son savunmacıyla neredeyse aynı hizada':'Pas anında golcü son savunmacının gerisinde görünmüyor');if(Math.random()<.8)L.push('Yan hakem bayrağını kaldırdı');else L.push('Yan hakem bayrağını kaldırmadı, emin değil');}
    else if(T==='faul'){L.push('Gol öncesinde hücum oyuncusu savunmacıyı itmiş olabilir');L.push('Savunmacı yerde, elini yüzüne götürüyor');}
    else{L.push('Pas anında golcü son savunmacının hizasında ya da önünde');L.push(Math.random()<.85?'Yan hakem orta sahaya koşuyor: gol':'Yan hakem bir an duraksadı ama bayrak inik');if(Math.random()<.4)L.push('Gol öncesi temas omuz omuza, normal mücadele');}
    return L;}
  if(A.clean){L.push('Savunmacının ayağı topa gidiyor');L.push(Math.random()<.6?'Hücumcu temastan önce düşüşe geçiyor olabilir':'Temas çok hafif');return L;}
  const s=A.sev||0;L.push(s>=.72?'Yüksek hızda, kontrolsüz müdahale; krampon rakibin bacağında':s>=.42?'Pervasız müdahale: rakibin güvenliğini umursamıyor':'Dikkatsiz müdahale, temas hafif');
  if(A.slide)L.push('Kayarak müdahale');
  L.push(A.att?'Önce topa oynamaya çalıştı':'Topa oynama girişimi yok');
  if(A.dogso>=.4)L.push('Faul yiyen kaleye doğru gidiyordu, arkada savunmacı yok: net gol şansı');else if(A.spa>=.5)L.push('Umut vaat eden bir atak kesildi');
  if(A.pen){if(A.truth.call==='fk')L.push('Temas ceza sahası çizgisinin hemen dışında olabilir');else L.push('Temas ceza sahası içinde');}
  if(L.length>3&&Math.random()<.25)L.splice(1+Math.floor(Math.random()*(L.length-1)),1);      /* bir ayrıntı açıdan kaçar */
  return L;}
/* yardımcı hakem ve dördüncü hakem görüşü: çoğunlukla doğru, bazen yanılır, bazen ikisi çelişir */
function abrTruthTxt(A,T){if(A.kind==='goal')return T==='gol'?'gol temiz, verelim':T==='ofs'?'bence ofsayt var':'golden önce faul var';
  const c=T.card||'none',k=T.call;if(k==='none')return 'bence faul yok, devam';const base=k==='pen'?'penaltı':'faul var';
  return c==='R'?`${base}, kırmızı gerekir`:c==='R2'?`${base}, ikinci sarı, oyundan atılmalı`:c==='Y'?`${base}, sarı yeter`:`${base}, kart gerekmez`;}
function abrWrongOf(A){if(A.kind==='goal'){const o=['gol','ofs','faul'].filter(x=>x!==A.truth.call);return o[Math.floor(Math.random()*o.length)];}
  const T=A.truth,cards=['none','Y','R'].filter(c=>c!==(T.card==='R2'?'R':T.card));let call=T.call;if(A.pen&&Math.random()<.5)call=T.call==='pen'?'fk':'pen';if(A.clean&&Math.random()<.6)call='pen';
  return {call,card:cards[Math.floor(Math.random()*cards.length)]};}
function abrVoices(A){const [a1,a2]=abrVoiceNames(),out=[];const clear=A.kind==='goal'?.78:(A.sev>=.72||A.dogso>=.6||A.clean?.82:.7);
  const say=(nm,rol)=>{const ok=Math.random()<clear;const t=ok?(A.kind==='goal'?A.truth.call:A.truth):abrWrongOf(A);out.push({nm,rol,txt:'Hocam, '+abrTruthTxt(A,t)+'.'});};
  say(a1,A.kind==='goal'?'yardımcı hakem':'yardımcı hakem');if(Math.random()<.4)say(a2,'dördüncü hakem');return out;}
function abrWarns(A){const W=[];if(A.kind!=='foul')return W;const d=abrP(A.d);if(A.nf>=2)W.push(`Bu ${d.short}'in ${A.nf}. faulü`);if(A.yc>=1)W.push(`${d.short}'in sarı kartı var`);return W;}
/* ---------- karar ekranı ---------- */
const ABR_WHY=[['sert','Ciddi faul'],['son_adam','Gol şansını engelleme'],['siddet','Şiddetli hareket']];
function abrCSS(d){if(d.getElementById('abr-style'))return;const st=d.createElement('style');st.id='abr-style';st.textContent=`
#abh-ref{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;display:flex;justify-content:center;pointer-events:none;padding:0 10px 10px}
.abr{pointer-events:auto;width:min(620px,100%);background:rgba(10,16,30,.96);border:1px solid rgba(255,255,255,.12);border-radius:16px 16px 12px 12px;box-shadow:0 -8px 40px rgba(0,0,0,.55);color:#e9eef7;font:500 14px Inter,system-ui,sans-serif;max-height:72vh;display:flex;flex-direction:column}
.abr.min .abr-b{display:none}
.abr-hd{display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.08)}
.abr-tag{font:800 11px Inter,sans-serif;letter-spacing:.08em;background:#ffc93c;color:#1a1300;border-radius:5px;padding:3px 7px}
.abr-tag.var{background:#7fd1ff;color:#05202e}
.abr-hd b{font:800 16px 'Barlow Condensed',Inter,sans-serif}.abr-hd .sp{flex:1;color:#a9b6c8;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.abr-hd button{background:rgba(255,255,255,.08);border:0;color:#fff;border-radius:8px;padding:5px 10px;font:700 12px Inter,sans-serif;cursor:pointer}
.abr-b{overflow:auto;padding:10px 14px 12px}
.abr-q{margin:0 0 8px;font-size:14.5px}.abr-q i{font-style:normal;color:#a9b6c8;font-size:12px}
.abr-c{margin:0 0 8px;padding-left:18px;color:#d3dbe8;font-size:13px}.abr-c li{margin:2px 0}
.abr-v{margin:6px 0;padding:7px 10px;border-radius:9px;background:rgba(255,201,60,.08);border:1px solid rgba(255,201,60,.22);font-size:13px}
.abr-v.var{background:rgba(127,209,255,.1);border-color:rgba(127,209,255,.3)}
.abr-w{margin:6px 0;color:#ffb36b;font-size:12.5px;font-weight:700}
.abr-l{margin:10px 0 5px;font:700 10.5px Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8494af}
.abr-o{display:flex;flex-wrap:wrap;gap:6px}
.abr-o button{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#e9eef7;border-radius:999px;padding:7px 12px;font:600 13px Inter,sans-serif;cursor:pointer}
.abr-o button.on{background:#ffc93c;border-color:#ffc93c;color:#1a1300}
.abr-o button.y.on{background:#ffd23f}.abr-o button.r.on{background:#e5484d;border-color:#e5484d;color:#fff}
.abr-f{display:flex;gap:8px;justify-content:space-between;align-items:center;margin-top:12px;flex-wrap:wrap}
.abr-f .go{background:#1fb6ff;border:0;color:#04121d;font:800 14px Inter,sans-serif;letter-spacing:.04em;text-transform:uppercase;border-radius:10px;padding:10px 18px;cursor:pointer}
.abr-f .go:disabled{opacity:.45;cursor:default}
.abr-f .lnk{background:none;border:1px solid rgba(255,255,255,.2);color:#e9eef7;border-radius:10px;padding:9px 12px;font:600 13px Inter,sans-serif;cursor:pointer}
.abr-f .lnk.off{border-style:dashed;opacity:.6;cursor:default;font-weight:500;font-size:12px}
.abr-res{margin:8px 0 0;padding:8px 10px;border-radius:9px;font-size:13px}.abr-res.ok{background:rgba(31,157,91,.18)}.abr-res.bad{background:rgba(229,72,77,.18)}
.abr-pl{display:grid;grid-template-columns:1fr 1fr;gap:8px}.abr-pl h4{margin:0 0 4px;font:700 11px Inter,sans-serif;letter-spacing:.06em;color:#8494af;text-transform:uppercase}
.abr-pl button{display:flex;gap:6px;align-items:center;width:100%;text-align:left;background:rgba(255,255,255,.04);border:1px solid transparent;color:#e9eef7;border-radius:7px;padding:5px 7px;margin:2px 0;font:500 12.5px Inter,sans-serif;cursor:pointer}
.abr-pl button.on{border-color:#ffc93c;background:rgba(255,201,60,.12)}.abr-pl button .n{min-width:20px;color:#8494af;font-weight:700}.abr-pl button .w{margin-left:auto}
#abh-rcard{}
@media (max-width:600px){.abr{max-height:64vh}.abr-pl{grid-template-columns:1fr}.abr-o button{padding:7px 10px;font-size:12.5px}}`;d.head.appendChild(st);}
function abrRoot(){const W=ABM.win;if(!W)return null;const d=W.document;abrCSS(d);let r=d.getElementById('abh-ref');if(!r){r=d.createElement('div');r.id='abh-ref';d.body.appendChild(r);r.addEventListener('click',abrClick);}return r;}
function abrOpen(A){ABR.ask=A;ABR.open=1;ABR.n++;ABR.stage='dec';ABR.min=abMin();ABR.minz=0;ABR.res=null;
  ABR.sel=A.kind!=='foul'?{call:null}:{call:null,card:null,why:null,to:'d'};ABR.cues=abrCues(A);ABR.voices=abrVoices(A);ABR.warn=abrWarns(A);ABR.varTxt=null;ABR.first=null;
  abrRender();}
function abrCalls(A){if(A.kind==='goal')return [['gol','Gol geçerli'],['ofs','Ofsayt, iptal'],['faul','Hücumda faul, iptal']];
  if(A.pen)return [['pen','Penaltı'],['fk','Serbest vuruş (çizgi dışı)'],['none','Faul yok, devam'],['sim','Simülasyon']];
  return [['fk','Serbest vuruş'],['adv','Avantaj'],['none','Faul yok, devam']];}
function abrRender(){const r=abrRoot();if(!r)return;const A=ABR.ask;if(!A&&ABR.stage!=='card'){r.innerHTML='';return;}
  if(ABR.stage==='card')return abrCardRender(r);
  const S=ABR.sel,isG=A.kind!=='foul',vr=ABR.stage==='var';
  const q=abrQ(A),where=abrWhere(A);
  const calls=abrCalls(A).map(([k,l])=>`<button type="button" data-r="call:${k}" class="${S.call===k?'on':''}">${l}</button>`).join('');
  let cards='';if(!isG&&S.call&&S.call!=='none'){cards=`<div class="abr-l">Kart${S.call==='sim'?' (simülasyon yapana)':''}</div><div class="abr-o"><button type="button" data-r="card:none" class="${S.card==='none'?'on':''}">Kart yok</button><button type="button" class="y ${S.card==='Y'?'on':''}" data-r="card:Y">🟨 Sarı</button>${S.call==='sim'?'':`<button type="button" class="r ${S.card==='R'?'on':''}" data-r="card:R">🟥 Kırmızı</button>`}</div>`;
    if(S.card==='R')cards+=`<div class="abr-l">Kırmızı gerekçesi</div><div class="abr-o">${ABR_WHY.map(([k,l])=>`<button type="button" data-r="why:${k}" class="${S.why===k?'on':''}">${l}</button>`).join('')}</div>`;}
  const ready=isG?!!S.call:!!S.call&&(S.call==='none'||S.card!=null)&&(S.card!=='R'||!!S.why);
  const voices=vr?`<div class="abr-v var">📺 <b>VAR</b>: “${esc(ABR.varTxt||'')}”</div>`:ABR.voices.map(v=>`<div class="abr-v">🎧 <b>${esc(v.nm)}</b> <i style="font-style:normal;color:#a9b6c8">(${v.rol})</i>: “${esc(v.txt)}”</div>`).join('');
  const first=vr&&ABR.first?`<p class="abr-q"><i>Sahadaki ilk kararın: ${esc(abrDecTxt(A,ABR.first))}</i></p>`:'';
  r.innerHTML=`<div class="abr${ABR.minz?' min':''}"><div class="abr-hd"><span class="abr-tag${vr?' var':''}">${vr?'VAR · MONİTÖR':'KARAR ANI'}</span><b>${ABR.min}’</b><span class="sp">${where}</span><button type="button" data-r="min">${ABR.minz?'Aç ▴':'Sahayı gör ▾'}</button></div>
    <div class="abr-b"><p class="abr-q">${q}</p>${first}<ul class="abr-c">${(vr?ABR.varCues:ABR.cues).map(c=>`<li>${esc(c)}</li>`).join('')}</ul>${voices}${ABR.warn.length&&!vr?`<div class="abr-w">⚠ ${ABR.warn.map(esc).join(' · ')}</div>`:''}
    <div class="abr-l">${vr?'Son karar senin':'Kararın'}</div><div class="abr-o">${calls}</div>${cards}
    <div class="abr-f">${ABR.stage==='var'?`<button type="button" class="lnk" data-r="rp">${ABR.rp?'■ Monitörü durdur':'📺 Monitörde tekrar oynat'}</button>`:'<span class="lnk off">Tekrar yok · VAR çağırırsa monitörde izlersin</span>'}<button type="button" class="go" data-r="ok" ${ready?'':'disabled'}>${vr?'Son kararı ver':'Kararı ver'}</button></div></div></div>`;}
function abrQ(A){if(A.kind==='goal'){const sc=A.scorer>=0?abrP(A.scorer):null;return `Gol: <b>${esc(sc?sc.name:'?')}</b> <i>(${esc(sc?sc.tm:'')})</i>${A.own?' · kendi kalesine':''}`;}
  const d=abrP(A.d),o=abrP(A.o);return `${A.clean?'Penaltı itirazı':'Faul'}: <b>${esc(d.name)}</b> <i>(${esc(d.tm)})</i> → <b>${esc(o.name)}</b> <i>(${esc(o.tm)})</i>`;}
function abrWhere(A){return A.kind==='goal'?'Gol pozisyonu':A.pen?'Ceza sahası':'Orta alan';}
function abrDecTxt(A,D){if(A.kind==='goal')return {gol:'gol geçerli',ofs:'ofsayt',faul:'hücumda faul'}[D.call];const c={pen:'penaltı',fk:'serbest vuruş',adv:'avantaj',none:'devam',sim:'simülasyon'}[D.call]||'';return c+(D.card==='Y'?' + sarı kart':D.card==='R'?' + kırmızı kart':'');}
function abrReplay(on){const W=ABM.win;if(!W)return;try{if(on){const A=ABR.ask;ABR.rp=W.ado2d.refReplay({p:A&&A.kind==='foul'?A.d:A&&A.scorer!=null?A.scorer:-1,p2:A&&A.kind==='foul'?A.o:-1,title:ABR.stage==='var'?'VAR · MONİTÖR':'HAKEM GÖZÜ',sub:ABR.stage==='var'?'Saha kenarı incelemesi':'Yavaş çekim',sec:6,slow:.45})?1:0;}else{if(ABR.rp)W.ado2d.skipReplay();ABR.rp=0;}}catch(e){ABR.rp=0;}}
function abrClick(ev){const b=ev.target.closest('[data-r]');if(!b)return;const [k,v]=b.dataset.r.split(':');
  if(ABR.stage==='card')return abrCardClick(k,v);const S=ABR.sel;
  if(k==='min'){ABR.minz=!ABR.minz;return abrRender();}
  if(k==='rp'){if(ABR.stage!=='var')return;abrReplay(!ABR.rp);return abrRender();}
  if(k==='call'){S.call=v;if(S.card===undefined||S.card===null)S.card=v==='none'?null:null;if(v==='none'){S.card=null;S.why=null;}if(v==='sim'){S.card='Y';S.to='o';}else S.to='d';return abrRender();}
  if(k==='card'){S.card=v;if(v!=='R')S.why=null;else if(!S.why&&ABR.ask.truth&&['sert','son_adam','siddet'].includes(ABR.ask.truth.why))S.why=null;return abrRender();}
  if(k==='why'){S.why=v;return abrRender();}
  if(k==='ok')return abrDecide();}
/* ---------- değerlendirme (kuralın gerçeğine göre) ---------- */
function abrJudge(A,D){if(A.kind==='goal'){const t=A.truth.call;if(D.call===t)return {lvl:'ok'};const both=t!=='gol'&&D.call!=='gol';return {lvl:both?'minor':'big'};}
  const T=A.truth,tc=T.call,dc=D.call==='adv'?'fk':D.call;let callOk=dc===tc||(tc==='none'&&D.call==='sim');const callBig=(tc==='pen')!==(dc==='pen');
  if(!callOk&&tc==='fk'&&dc==='none'&&T.card==='none')callOk=false;
  const L={none:0,Y:1,R:2},dl=D.call==='none'?0:L[D.card||'none'],tl=T.card==='R2'?1:L[T.card]||0;let diff=Math.abs(tl-dl);if(T.card==='R2'&&dl===0)diff=2;if(T.card==='R2'&&dl===2)diff=0;
  if(D.call==='sim'){diff=tc==='none'?0:1;}
  const cs=diff===0?'ok':diff===1?(tl===2||dl===2?'mid':'minor'):'big';const abuse=dl===2&&tl===0&&D.call!=='sim';
  const lvl=callBig||cs==='big'?'big':cs==='mid'?'mid':(!callOk||cs==='minor')?'minor':'ok';return {lvl,abuse};}
const ABR_D={ok:.12,minor:-.25,mid:-.45,big:-.8};
function abrType(A){if(A.kind==='goal')return A.truth.call==='ofs'?'ofs':'gol';if(A.clean)return 'sim';if(A.pen)return 'pen';const c=A.truth.card;return c==='R2'?'ikisari':A.dogso>=.4?'dogso':c==='R'||c==='Y'?'kart':'faul';}
function abrVarCues(A){if(A.kind==='goal'){const t=A.truth.call,mg=A.vr&&A.vr.margin!=null?Math.abs(A.vr.margin):null;return t==='ofs'?[`Ofsayt çizgisi çekildi: golcü${mg!=null?` ${Math.max(4,Math.round(mg*100))} cm`:''} önde`]:t==='faul'?['Gol öncesi hücum oyuncusu kollarıyla savunmacıyı itiyor']:['Çizgiler çekildi: golcü son savunmacıyla aynı hizada, ofsayt yok','Gol öncesinde faul yok'];}
  const T=A.truth,L=[];if(A.clean)return ['Savunmacı önce topa dokunuyor; temas hücumcunun düşüşünden sonra'];
  if(A.pen&&T.call==='fk')L.push('Temas noktası ceza sahası çizgisinin dışında');else if(T.call==='pen')L.push('Temas net şekilde ceza sahası içinde');
  if(T.card==='R')L.push(T.why==='son_adam'?'Faul olmasa topçu kaleciyle karşı karşıya kalacaktı':'Krampon açık, bilekten/kaval kemiğinden sert temas');else if(T.card==='Y'||T.card==='R2')L.push('Pervasız ama aşırı güç yok');else L.push('Temas var ama sert değil');return L;}
function abrVarText(A,D){if(A.kind==='goal')return A.truth.call==='ofs'?'Hocam, gol öncesinde ofsayt görüyoruz, monitöre davet ediyoruz.':A.truth.call==='faul'?'Hocam, golden önce olası bir faul var, monitöre davet ediyoruz.':'Hocam, golü iptal ettin ama görüntülerde ihlal yok. Monitöre davet ediyoruz.';
  const T=A.truth;if(T.call==='pen'&&D.call!=='pen')return 'Hocam, ceza sahası içinde olası bir faul var. Monitöre davet ediyoruz.';if(D.call==='pen'&&T.call!=='pen')return 'Hocam, penaltı kararınla ilgili olası açık hata var. Monitöre gel.';
  if(T.card==='R'&&D.card!=='R')return 'Hocam, olası bir kırmızı kart pozisyonu. Monitöre davet ediyoruz.';return 'Hocam, kırmızı kart kararını bir de monitörde görmeni öneriyoruz.';}
function abrDecide(){const A=ABR.ask;if(!A)return;const D=Object.assign({},ABR.sel);if(D.call==='none'){D.card='none';}if(D.card==null)D.card='none';
  const J=abrJudge(A,D),R=REF,big=J.lvl==='big'||(J.lvl==='mid'&&(D.card==='R'||(A.truth.card==='R')));
  if(ABR.stage==='dec'&&big&&hasVAR(R.F)&&Math.random()<.85){ABR.first=D;ABR.stage='var';ABR.varTxt=abrVarText(A,D);ABR.varCues=abrVarCues(A);ABR.sel=A.kind==='goal'?{call:null}:{call:null,card:null,why:null,to:'d'};ABR.minz=0;abrReplay(true);abrRender();return;}
  const viaVar=ABR.stage==='var';abrReplay(false);abrFinish(A,D,J,viaVar);}
function abrFinish(A,D,J,viaVar){const R=REF,mn=ABR.min,ty=abrType(A);
  if(J.lvl==='ok'){R.rt+=viaVar?-.1:ABR_D.ok;R.log.push([mn,ty,viaVar?'VAR sonrası doğru':'doğru']);}
  else{R.rt+=ABR_D[J.lvl]*(viaVar?1.25:1);R.log.push([mn,ty,'hatalı']);if(J.lvl==='big')R.big=(R.big||0)+1;if(J.abuse)R.abuse=(R.abuse||0)+1;}
  const sim=ABM.sim;try{if(A.kind==='goal')sim.refApply({call:D.call});else sim.refApply({call:D.call==='sim'?'sim':D.call,card:D.card,why:D.card==='R'?(D.why||'sert'):D.card==='Y'?(D.call==='sim'?'sim':A.truth.why==='taktik'?'taktik':'faul'):undefined,to:D.call==='sim'?'o':'d'});}catch(e){console.warn('hakem kararı',e);try{sim.refHold=false;sim.refAsk=null;}catch(_){}}
  try{fxEv(mn,`Hakem kararı: ${abrDecTxt(A,D)}${viaVar?' (VAR incelemesi sonrası)':''}.`,'');}catch(e){}
  const ok=J.lvl==='ok';abToast(ok?(viaVar?'📺 VAR sonrası doğru karar.':'✔ Gözlemci notu: doğru karar.'):J.lvl==='big'?'✖ Gözlemci notu: ciddi hata. MHK raporuna girer.':'✖ Gözlemci notu: hatalı karar.');
  ABR.ask=null;ABR.open=0;ABR.stage=null;const r=abrRoot();if(r)r.innerHTML='';}
/* hızlı sona gitmede bekleyen karar kuralın gerçeğiyle kapanır (puanlanmaz) */
function abrAuto(){const sim=ABM.sim,A=sim&&sim.refAsk;if(!A)return;const T=A.truth;try{if(A.kind==='goal')sim.refApply({call:T.call});else sim.refApply({call:T.call,card:T.card==='R2'?'Y':T.card,why:T.why,to:'d'});}catch(e){sim.refHold=false;sim.refAsk=null;}
  if(ABR.ask===A){abrReplay(false);ABR.ask=null;ABR.open=0;ABR.stage=null;const r=abrRoot();if(r)r.innerHTML='';}}
/* ---------- serbest kart: itiraz, zaman geçirme, arbede ---------- */
function abrBehTick(){const sim=ABM.sim,mn=abMin();if(!sim||sim.refHold||ABM.ff)return;if(!ABR.nextBeh)ABR.nextBeh=6+Math.floor(Math.random()*8);if(mn<ABR.nextBeh)return;ABR.nextBeh=mn+8+Math.floor(Math.random()*10);
  const on=sim.players.filter(q=>!q.off&&q.role!=='GK');if(!on.length)return;const [a1,a2]=abrVoiceNames();const r=Math.random(),lead=sim.teams[0].score-sim.teams[1].score;
  if(mn>=70&&lead!==0&&r<.35){const tm=lead>0?0:1,c=sim.players.filter(q=>q.team===tm&&!q.off);const q=c[Math.floor(Math.random()*c.length)];if(!q)return;ABR.just[q.id]={k:'zaman',lv:1,until:mn+4};abToast(`🎧 ${a2}: Hocam, ${abrP(q.id).name} zaman geçiriyor.`);return;}
  if(r<.12){const a=on[Math.floor(Math.random()*on.length)],bs=on.filter(q=>q.team!==a.team),b=bs[Math.floor(Math.random()*bs.length)];if(!b)return;ABR.just[a.id]={k:'siddet',lv:2,until:mn+3,vs:b.id};ABR.just[b.id]={k:'sportmenlik',lv:1,until:mn+3};abToast(`🎧 ${a1}: Hocam, arbede! ${abrP(a.id).name}, ${abrP(b.id).name}'e kafa attı gibi!`);return;}
  const q=on[Math.floor(Math.random()*on.length)];ABR.just[q.id]={k:'itiraz',lv:1,until:mn+3};abToast(`🎧 ${a1}: Hocam, ${abrP(q.id).name} sürekli itiraz ediyor.`);}
/* süresi dolan arbede: kırmızı verilmediyse VAR çağırabilir */
function abrBehExpire(){const mn=abMin(),sim=ABM.sim;for(const id in ABR.just){const J=ABR.just[id];if(mn<=J.until)continue;delete ABR.just[id];
  if(J.k==='siddet'&&!J.done&&sim&&!sim.players[id].off){if(hasVAR(REF.F)&&Math.random()<.7&&!ABR.open){abrCardOpen(+id,{var:true});return;}REF.rt-=.3;REF.log.push([mn,'serbest','hatalı']);}}}
function abrCardOpen(id,o){o=o||{};if(ABR.open)return;ABR.open=1;ABR.stage='card';ABR.cs={id:id!=null?id:null,kind:null,why:null,var:!!o.var};ABR.min=abMin();if(o.var){abToast('📺 VAR: Hocam, ceza almayan bir şiddetli hareket var. Monitöre davet ediyoruz.');try{ABM.sim.refHold=true;}catch(e){}abrReplay(true);}else{try{ABM.sim.refHold=true;}catch(e){}}abrRender();}
const ABR_CY=[['itiraz','İtiraz'],['zaman','Zaman geçirme'],['sportmenlik','Sportmenlik dışı']],ABR_CR=[['siddet','Şiddetli hareket'],['sportmenlik','Hakaret / saldırgan söz'],['tukurme','Tükürme']];
function abrCardRender(r){const C=ABR.cs,sim=ABM.sim,mn=abMin();const team=t=>sim.players.filter(q=>q.team===t&&!q.off).map(q=>{const P=abrP(q.id),J=ABR.just[q.id];return `<button type="button" data-r="pl:${q.id}" class="${C.id===q.id?'on':''}"><span class="n">${esc(String(P.num))}</span>${esc(P.name)}${q.yc?' 🟨':''}<span class="w">${J&&J.until>=mn?(J.lv>1?'⚠⚠':'⚠'):''}</span></button>`;}).join('');
  const T0=ABM.fx.T[abrSide(0)],T1=ABM.fx.T[abrSide(1)];
  const why=C.kind==='Y'?ABR_CY:C.kind==='R'?ABR_CR:[];
  r.innerHTML=`<div class="abr"><div class="abr-hd"><span class="abr-tag${C.var?' var':''}">${C.var?'VAR · MONİTÖR':'KART'}</span><b>${mn}’</b><span class="sp">${C.var?'Ceza almayan şiddetli hareket':'Oyun dışı davranış için kart'}</span><button type="button" data-r="x">Kapat</button></div>
    <div class="abr-b"><p class="abr-q"><i>⚠ işaretli oyuncular için yardımcıların uyarısı var. Gerekçesiz kart MHK'nin dikkatini çeker.</i></p><div class="abr-pl"><div><h4>${esc(T0?T0.short:'')}</h4>${team(0)}</div><div><h4>${esc(T1?T1.short:'')}</h4>${team(1)}</div></div>
    <div class="abr-l">Kart</div><div class="abr-o"><button type="button" class="y ${C.kind==='Y'?'on':''}" data-r="k:Y">🟨 Sarı</button><button type="button" class="r ${C.kind==='R'?'on':''}" data-r="k:R">🟥 Kırmızı</button>${C.var?`<button type="button" data-r="k:none" class="${C.kind==='none'?'on':''}">Kart gerekmez</button>`:''}</div>
    ${why.length?`<div class="abr-l">Gerekçe</div><div class="abr-o">${why.map(([k,l])=>`<button type="button" data-r="w:${k}" class="${C.why===k?'on':''}">${l}</button>`).join('')}</div>`:''}
    <div class="abr-f"><span></span><button type="button" class="go" data-r="ok" ${(C.id!=null&&(C.kind==='none'||(C.kind&&C.why)))?'':'disabled'}>Kartı göster</button></div></div></div>`;}
function abrCardClick(k,v){const C=ABR.cs;if(k==='x'){if(C.var){C.kind='none';return abrCardDo();}return abrCardClose();}if(k==='pl'){C.id=+v;return abrRender();}if(k==='k'){C.kind=v;C.why=null;return abrRender();}if(k==='w'){C.why=v;return abrRender();}if(k==='ok')return abrCardDo();}
function abrCardClose(){abrReplay(false);ABR.open=0;ABR.stage=null;ABR.cs=null;try{if(!ABM.sim.refAsk)ABM.sim.refHold=false;}catch(e){}const r=abrRoot();if(r)r.innerHTML='';}
function abrCardDo(){const C=ABR.cs,sim=ABM.sim,mn=abMin(),R=REF,J=ABR.just[C.id],P=abrP(C.id);const just=J&&J.until>=mn-1;
  if(C.kind&&C.kind!=='none')try{sim.cardNow(C.id,C.kind,C.why);}catch(e){}
  if(J)J.done=1;let ok,lvl='ok';
  if(C.kind==='none'){ok=!(J&&J.lv>1);lvl=ok?'ok':'mid';}
  else if(C.kind==='Y'){ok=!!just;lvl=ok?'ok':'minor';if(just&&J.lv>1){lvl='minor';ok=false;}}
  else{ok=!!(just&&J.lv>1);lvl=ok?'ok':just?'mid':'big';if(!just){R.abuse=(R.abuse||0)+1;}}
  if(ok){R.rt+=C.var?-.1:.12;R.log.push([mn,'serbest',C.var?'VAR sonrası doğru':'doğru']);}else{R.rt+=ABR_D[lvl];R.log.push([mn,'serbest','hatalı']);if(lvl==='big')R.big=(R.big||0)+1;}
  if(C.kind&&C.kind!=='none')abToast(ok?`✔ ${P.name}: kart yerinde.`:`✖ ${P.name}: gerekçesiz kart, gözlemci not aldı.`);
  abrCardClose();}
/* ---------- maç akışı: kancalar ---------- */
function abrSetupSim(sim){sim.userRef=true;sim.noGoal=false;sim.forceGoal=null;sim.refWant=abrWant;sim.refWantGoal=abrWantGoal;
  if(!sim.__abrStep){const st0=sim.step;sim.step=function(){if(sim.refAsk&&ABM.ff)abrAuto();return st0.apply(this,arguments);};sim.__abrStep=1;}}
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{const S=ABM.fx;if(S&&S.ref3&&S.ab&&REF&&REF.f3){
    if(!REF.live){REF.live=1;REF.inc=[];REF.i=0;REF.big=0;REF.abuse=0;Object.assign(ABR,{open:0,ask:null,n:0,just:{},nextBeh:0,stage:null,rp:0,vn:null,fouls:{}});const W=ABM.win;try{W.ado2d.setWatch('wide');}catch(e){}try{fxEv(0,'Bu maçta pozisyonlar canlı: kritik anda oyun durur, kararı sen verirsin. Yardımcıların ve VAR seninle.','bold');}catch(e){}}
    const sim=ABM.sim;if(sim){abrSetupSim(sim);if(sim.refAsk&&!ABR.open){if(ABM.ff)abrAuto();else abrOpen(sim.refAsk);}if(!ABR.open){abrBehTick();abrBehExpire();}}abrBar();}}catch(e){console.warn('hakem canlı',e);}return r;})(abTickCore);
/* ısrarlı faul uyarısı (oyunun durmadığı fauller) */
abEv=(old=>function(e){const r=old.apply(this,arguments);try{if(e.type==='FOUL'&&refLiveOn()&&!ABM.ff){const sim=ABM.sim,q=sim.players[e.p];setTimeout(()=>{try{if(sim.refAsk||!q||q.off)return;const n=q.nf||0;if(n===2||n===3){const [a1]=abrVoiceNames();abToast(`🎧 ${a1}: Hocam, ${abrP(q.id).name} ${n}. faulünü yaptı${n>=3?', ısrarlı faul sarıyı hak ediyor':', dikkat'}.`);if(n>=3)ABR.just[q.id]={k:'israrli',lv:1,until:abMin()+2};}}catch(x){}},30);}}catch(x){}return r;})(abEv);
function abrBar(){const W=ABM.win;if(!W)return;const d=W.document;let b=d.getElementById('abh-rcard');if(!b){const ref=d.getElementById('btn-tactics');if(!ref)return;b=d.createElement('button');b.type='button';b.id='abh-rcard';b.className=ref.className;b.innerHTML='<span aria-hidden="true" style="font-size:16px;line-height:1">🟨</span><span class="mb-t">Kart göster</span>';b.title='Kart göster';ref.parentNode.insertBefore(b,ref.nextSibling);b.addEventListener('click',()=>{if(!ABR.open)abrCardOpen(null);});}
  b.hidden=!refLiveOn();try{const t=d.getElementById('btn-tactics');if(t&&refLiveOn())t.hidden=true;}catch(e){}}
/* maç bitince açık panel kapanır */
fxClose=(old=>function(){try{if(ABR.open||ABR.ask){abrReplay(false);ABR.open=0;ABR.ask=null;ABR.stage=null;const r=abrRoot();if(r)r.innerHTML='';}}catch(e){}return old.apply(this,arguments);})(fxClose);
/* ---------- MHK: uyarı, görevden uzaklaştırma, meslekten men ---------- */
function mhkOf(){const j=refJob();j.mhk=j.mhk||{marks:0,susp:0,warn:0,hist:[]};return j.mhk;}
const MHK_BIG=['pen','kart','ofs','el','ikisari','dogso','siddet','dirsek','oncesi'];
refScore=(old=>function(I,ok,viaVar){const r=old.apply(this,arguments);try{if(!ok&&REF&&MHK_BIG.includes(I.t))REF.big=(REF.big||0)+1;}catch(e){}return r;})(refScore);
function mhkApply(R,rt){const M=mhkOf(),big=R.big||0,ab=R.abuse||0,F=R.F;let lvl=0;
  if(ab>=1||big>=2||rt<6.4)lvl=2;else if((big===1&&rt<7.4)||rt<7)lvl=1;
  const mt=F&&CLUBS[F.h]&&CLUBS[F.a]?`${CLUBS[F.h].name} – ${CLUBS[F.a].name}`:'son maç';
  if(lvl===2){M.marks++;const n=1+(big>=3?1:0)+(ab?1:0)+(rt<6?1:0);M.susp=(M.susp||0)+n;M.hist.unshift({y:seasonLabel(G.s.year),d:G.s.day,n,big,ab,rt});if(M.hist.length>20)M.hist.length=20;
    const why=[big?`${big} ciddi hata`:'',ab?'gerekçesiz kırmızı kart':'',rt<6.4?`gözlemci notu ${dec(rt,1)}`:''].filter(Boolean).join(', ');
    if(M.marks>=4){const j=refJob();j.dismissed=1;msg('board','MHK: hakemlikten men',`${mt} maçındaki yönetimin (${why}) sicilindeki ${M.marks}. ağır ihlal oldu. Merkez Hakem Kurulu, ${PN()}'in hakem kadrosundan çıkarılmasına karar verdi. Hakemlik yolculuğun burada sona erdi.`);G.refEnd=1;}
    else msg('board',M.marks===3?'MHK: son uyarı ve görevden uzaklaştırma':'MHK: ciddi uyarı ve görevden uzaklaştırma',`${mt} maçındaki yönetimin MHK'de incelendi: ${why}. ${n} maç görev verilmeyecek. Sicil: ${M.marks}/4.${M.marks===3?' Bir ağır ihlal daha meslekten men demek.':''}`);}
  else if(lvl===1){M.warn++;msg('board','MHK gözlemci uyarısı',`${mt} maçında${big?' bir ciddi hata':' kararlarda tutarsızlık'} görüldü (not ${dec(rt,1)}). Bu bir uyarıdır; sicile işlenmedi.`);}}
refFinish=(old=>function(){const R=REF;const r=old.apply(this,arguments);try{if(R&&isRef()){const j=refJob(),rt=j.rlog&&j.rlog[0]?j.rlog[0].rt:R.rt;mhkApply(R,rt);}}catch(e){console.warn('MHK',e);}return r;})(refFinish);
/* rapor kapanınca meslekten men uygulanır */
ACTX.closeModal=(old=>function(){const r=old?old.apply(this,arguments):closeModal();try{if(G&&G.refEnd&&isRef()&&!REF&&!FX){G.refEnd=0;G.phase='retired';save();try{archSave();}catch(e){}TAB='hub';render();}}catch(e){}return r;})(ACTX.closeModal);
/* görevden uzaklaştırma: maç günlerinde atama yok */
refFx=(old=>function(){try{if(isRef()){const M=mhkOf();if(M.susp>0)return null;}}catch(e){}return old.apply(this,arguments);})(refFx);
ACTX.refGo=(old=>function(el){let dec=0;try{if(isRef()&&dayType(G.s.day)==='mac'){const M=mhkOf();if(M.susp>0&&M.sd!==G.s.day){M.sd=G.s.day;dec=1;}}}catch(e){}if(dec){const M=mhkOf();M.susp--;msg('board','MHK cezası sürüyor',M.susp>0?`Bu hafta görev verilmedi. Kalan ceza: ${M.susp} maç.`:'Bu hafta görev verilmedi. Cezan bitti; gelecek maç gününde yeniden atanabilirsin.');try{staffMatch();}catch(e){}save();render();return;}return old.apply(this,arguments);})(ACTX.refGo);
refHub=(old=>function(){let h=old.apply(this,arguments);try{const M=mhkOf();const ban=M.susp>0?`<div class="ref-ban">⛔ MHK cezası: <b>${M.susp} maç</b> görev verilmeyecek.</div>`:'';const sic=M.marks?`<div class="ref-sic">MHK sicili: <b>${M.marks}/4</b>${M.marks>=3?' · son uyarı':''}</div>`:'';h=ban+sic+h;}catch(e){}return h;})(refHub);
staffSeasonEnd=(old=>function(){try{if(isRef()){const M=mhkOf();M.marks=Math.max(0,M.marks-1);M.warn=0;}}catch(e){}return old.apply(this,arguments);})(staffSeasonEnd);
render=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.refEnd&&isRef()&&!REF&&!FX&&$('#modal').hidden){G.refEnd=0;G.phase='retired';save();try{archSave();}catch(e){}old.apply(this,arguments);}}catch(e){}return r;})(render);

