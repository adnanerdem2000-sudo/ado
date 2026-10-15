/* ================= v172: sezon öncesi — futbolcu kampı, hazırlık maçları, kamp sahneleri, boş gün olayları; teknik direktör sezon öncesi hazırlığı =================
   Futbolcu:
   - Yaz kampında 2–4, devre arası kampında 1–2 hazırlık maçı (G.s.hz). Takvimde ve hafta şeridinde görünür; o gün ana düğme "Hazırlık maçına çık"
     (mevcut maç akışı) ve "Hızlı sonuç". Lig tablosunu ve sezon istatistiklerini etkilemez; puan formuna yazılır, hoca güvenini oynanan süreye
     ve performansa göre değiştirir. İlk 11 / yedek / kadro dışı kararını hoca verir (güven, form, güç farkı, kondisyon).
   - Kamp sahneleri (oda arkadaşı, kondisyon testi, kaptanla konuşma, taktik sınavı): v155 karar penceresiyle; karar verilmeden gün ilerlemez.
   - Boş günlerde küçük olaylar (EVENTS / m.ev): haftada en çok 2, en az 3 gün arayla; aynı olay 45 gün içinde tekrar etmez. Yaşa uygun.
   - "Forma rekabeti" iletisine seçenek: hocayla görüş (190_v163 hoca odası), ekstra idman, sabret.
   Teknik direktör:
   - Yaz arasında ya da yeni sezonun ilk gününde "Sezon öncesi hazırlık": kamp yeri ve süresi, hazırlık maçı programı (2–4 maç, rakip seviyesi),
     ön sezon odağı, kaptan seçimi, yönetimle sezon hedefi görüşmesi (m.obj). Etkiler: kondisyon (m.tcond), taktik uyum (fm.fam), takım morali (ilişkiler),
     yönetim güveni (m.conf), bütçe. Hazırlık maçları takvimde; 2B maç (fxStart) ya da hızlı sonuç; lig tablosunu etkilemez.
   - Eski kayıtlar: G.s.hz yalnız yeni sezon kurulurken yazılır; sezon ortasındaki kayıtta bir sonraki yaz devreye girer.
   Kişi adları: oda arkadaşı kurmacadır (fakeName); kaptan ve hoca adla konuşturulmaz. */

/* ---------- ortak ---------- */
function sz172(){if(!G)return {ev:{}};const V=G.sz172=G.sz172||{};V.ev=V.ev||{};return V;}
const SZ172_LV={kolay:'Kolay rakip',denk:'Denk rakip',zor:'Güçlü rakip'};
const SZ172_LVS={kolay:'alt seviye',denk:'denk',zor:'üst seviye'};
DT.hzm={n:'Hazırlık maçı',s:'HAZ.M',d:'Hazırlık maçı. Lig tablosunu etkilemez; hoca kadroyu, kondisyonu ve taktik uyumu sınar.'};
function sz172HzOn(H){try{if(!H||!H.list)return false;if(H.k==='pl')return isPl();if(H.k==='td')return isTD();}catch(e){}return false;}
function sz172Hz(){const H=G&&G.s&&G.s.hz;return H&&sz172HzOn(H)?H:null;}
function sz172HzAt(day){const H=sz172Hz();return H?H.list.find(x=>x.d===day)||null:null;}
const sz172HzToday=()=>G&&G.s?sz172HzAt(G.s.day):null;
function sz172Idx(f){const H=sz172Hz();if(!H||!f)return '';const L=H.list.filter(x=>x.w===f.w);return `${L.indexOf(f)+1}/${L.length}`;}
dayType=(old=>function(day){const t=old.apply(this,arguments);try{if(t==='mac'||t==='milli'||t==='kupa'||!G||G.phase!=='season')return t;const H=G.s&&G.s.hz;if(H&&H.list&&H.list.length&&sz172HzOn(H)&&H.list.some(x=>x.d===day))return 'hzm';}catch(e){}return t;})(dayType);
try{MD_STOP.add('hzm');}catch(e){}
try{for(const a of ['endDay','auto','play','simPlay'])V155_GATE.add(a);}catch(e){}
try{V155_KIND.kamp='Hazırlık kampı';V155_KIND.sz172='Kulüp yönetimi';}catch(e){}

/* rakip seçimi: aynı yaş grubu, seviye farkına göre; önce kendi ülkesinden, kendi liginden değil */
function sz172Opp(lv,used,abroad){const me=myClub(),L=LEAGUES[me.league],youth=!!L.youth;
  const all=Object.values(CLUBS).filter(c=>c&&c.id&&c.id!==G.club&&LEAGUES[c.league]&&!!LEAGUES[c.league].youth===youth&&(!youth||LEAGUES[c.league].maxAge===L.maxAge)&&!used.has(c.id));
  const tg={kolay:[-14,-5],denk:[-4,4],zor:[5,16]}[lv]||[-4,4],tw={kolay:[-30,-5],denk:[-6,6],zor:[5,30]}[lv]||[-6,6];
  const inR=(c,r)=>{const d=(c.str||0)-(me.str||0);return d>=r[0]&&d<=r[1];},tok=c=>youth||(LEAGUES[c.league].tier||0)>=(L.tier||0)-2,cc=c=>abroad?LEAGUES[c.league].cc!==L.cc:LEAGUES[c.league].cc===L.cc;
  const tiers=[c=>inR(c,tg)&&c.league!==me.league&&cc(c)&&tok(c),c=>inR(c,tg)&&c.league!==me.league&&tok(c),c=>inR(c,tw)&&c.league!==me.league&&tok(c),c=>inR(c,tw)];
  for(const f of tiers){const P=all.filter(f);if(P.length)return pick(P);}
  const mid=(tg[0]+tg[1])/2;return all.sort((a,b)=>Math.abs((a.str-me.str)-mid)-Math.abs((b.str-me.str)-mid))[0]||null;}
function sz172FreeDay(d,taken){if(d<1)return false;if(d%7===6)return false;if(taken.some(x=>Math.abs(x-d)<2))return false;try{if(typeof cupAnyDay==='function'&&cupAnyDay(d))return false;}catch(e){}if(G.s.nat&&G.s.nat.day===d)return false;return true;}
function sz172Spread(a,b,n,taken){const out=[];if(b<a)return out;const span=b-a;for(let i=0;i<n;i++){let d=Math.round(a+(n===1?span/2:i*span/(n-1)));
    for(const o of [0,-1,1,-2,2]){if(sz172FreeDay(d+o,taken.concat(out))&&d+o>=a&&d+o<=b){out.push(d+o);break;}}}
  return out.sort((x,y)=>x-y);}
/* devre arası: lig takviminde 16 günden uzun boşluk */
function sz172Winter(){const cal=G.s.cal||[];for(let i=1;i<cal.length;i++)if(cal[i]-cal[i-1]>16)return {pm:cal[i-1],nm:cal[i]};return null;}

/* ---------- futbolcu: sezon kurulurken program ---------- */
function sz172PlGen(){const s=G.s,cal=s.cal;if(!cal||!cal.length)return;const k0=Math.max(1,cal[0]-21),ke=cal[0]-3;
  const used=new Set(),list=[],span=ke-(k0+3),n=span>=14?4:span>=9?3:2,lvs=['kolay','denk','zor','denk'];
  const days=sz172Spread(k0+3,ke,n,[]);days.forEach((d,i)=>{const lv=lvs[i]||'denk',o=sz172Opp(lv,used);if(!o)return;used.add(o.id);list.push({d,opp:o.id,h:i%2===0,lv,w:'y'});});
  const W=sz172Winter();if(W){const nw=W.nm-W.pm>=30?2:1,wd=sz172Spread(W.nm-8,W.nm-3,nw,[]);wd.forEach((d,i)=>{const lv=i?'zor':'denk',o=sz172Opp(lv,used);if(!o)return;used.add(o.id);list.push({d,opp:o.id,h:i%2===1,lv,w:'k'});});}
  /* kamp sahneleri: ilk kamp günleri, maç günlerine denk gelmez */
  const taken=list.map(x=>x.d),sc=[],put=(k,d)=>{for(let j=0;j<4;j++){const x=d+j;if(x>=ke)return;if(!taken.includes(x)&&!sc.some(y=>y.d===x)){sc.push({k,d:x});return;}}};
  put('oda',k0);put('kond',k0+1);put('kaptan',k0+4);put('taktik',Math.max(k0+7,ke-6));
  s.hz={k:'pl',v:1,list,sc};}
newSeason=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.s&&G.phase!=='off'){if(isTD())G.s.hz={k:'td',v:1,list:[],pend:true};else if(isPl())sz172PlGen();}}catch(e){console.warn('sz172 sezon',e);}return r;})(newSeason);

/* ---------- futbolcu: hoca kararı ---------- */
function sz172PlRole(){const p=G.p;if(p.injury&&p.injury.days>0)return 'injured';const c=myClub();
  const s=(OVR()-c.str)+(p.trust-50)/4+(formAvg()-6.5)*4+(p.energy<35?-8:0)+(ROLE_BONUS[G.contract.role]||0)+9+(Math.random()*4-2);
  return s>=0?'start':s>=-16?'sub':'squad';}
const SZ172_ROLE={start:'İlk 11’desin',sub:'Yedek kulübesi · ikinci yarı şans',squad:'Hoca bu maçta sana süre vermeyecek',injured:'Sakatsın, kadroda yok'};

function sz172PlFriendly(sim){const f=sz172HzToday();if(!f||f.done){nextDay();save();render();return;}
  const me=myClub();if(f.opp===G.club||!CLUBS[f.opp]){const o=sz172Opp(f.lv,new Set());if(o)f.opp=o.id;}const opp=CLUBS[f.opp];if(!opp){f.done=true;nextDay();save();render();return;}
  const role=f.role||(f.role=sz172PlRole());
  if(role!=='start'&&role!=='sub'){const [a,b]=simPair(f.h?{str:me.str}:opp,f.h?opp:{str:me.str});return sz172PlEnd({us:f.h?a:b,opp:f.h?b:a,played:false},f,role);}
  const cfg=buildMatch(me,opp,f.h,role,`Hazırlık maçı · ${sz172Idx(f)}`);cfg.friendly=true;cfg.onEnd=res=>sz172PlEnd(res,f,role);
  if(sim)simMatch(cfg);else startMatch(cfg);}
function sz172PlEnd(res,f,role){const p=G.p,notes=[],me=myClub(),opp=CLUBS[f.opp],win=res.us>res.opp,draw=res.us===res.opp,fame0=p.fame;
  if(res.played){applyPlayed(res,role,win,draw,notes,curLeague().tier,false);p.fame=clamp(fame0+Math.max(0,res.rating-7)*0.3,0,100);
    const dt=(res.rating-6.5)*2.4+(role==='start'?0.6:0.3);p.trust=clamp(p.trust+dt,0,100);
    notes.unshift(`Hazırlık maçı: ${res.mins} dakika oynadın, puanın ${dec(res.rating)}.`);notes.push(`Hoca güveni ${dt>=0?'+':'−'}${dec(Math.abs(dt))} · lig tablosu ve sezon istatistiği etkilenmez.`);}
  else if(role==='injured')notes.push('Sakatlığın nedeniyle hazırlık maçında forma giymedin.');
  else{p.trust=clamp(p.trust-0.8,0,100);bump('morale',-2);notes.push('Hoca bu hazırlık maçında sana süre vermedi. İdmanlarda kendini göstermelisin.');}
  f.done=true;f.r=[res.us,res.opp];f.pl=res.played?{rt:res.rating,mn:res.mins,g:res.goals||0,a:res.assists||0}:null;
  const home=f.h?me:opp,away=f.h?opp:me,hg=f.h?res.us:res.opp,ag=f.h?res.opp:res.us;
  msg('report',`Hazırlık maçı: ${home.name} ${hg}-${ag} ${away.name}`,res.played?`${res.mins} dakika · puanın ${dec(res.rating)}${res.goals?` · ${res.goals} gol`:''}${res.assists?` · ${res.assists} asist`:''}. Lig tablosunu etkilemez.`:role==='injured'?'Sakat olduğun için oynamadın.':'Bu maçta süre almadın.');
  nextDay();save();showResult(home,away,hg,ag,res,notes);}
onPlay=(old=>function(sim){try{if(isPl()&&G.phase==='season'&&dayType(G.s.day)==='hzm'){if((typeof MR!=='undefined'&&MR)||(typeof ftMatchOpen==='function'&&ftMatchOpen()))return;return sz172PlFriendly(!!sim);}}catch(e){console.warn('sz172 hazırlık',e);}return old.apply(this,arguments);})(onPlay);
finishDay=(old=>function(){try{if(isPl()&&G.phase==='season'&&dayType(G.s.day)==='hzm')return onPlay(true);}catch(e){}return old.apply(this,arguments);})(finishDay);
/* "Maç gününe ilerle": hazırlık maçında ve bekleyen kamp kararında durur */
const sz172Q=()=>{try{return v155().q.length>0;}catch(e){return false;}};
autoAdvance=function(){const g0={...G.p.a},inj0=!!G.p.injury;let n=0;
  while(n<90&&G.phase==='season'&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac'||t==='milli'||t==='kupa'||t==='hzm')break;if(sz172Q())break;autoPlan();if(DT[t].team&&!G.p.injury)teamSession(t);nextDay();n++;}
  const gains=Object.keys(ATTR).map(k=>[k,G.p.a[k]-g0[k]]).filter(x=>x[1]>=0.05).map(([k,v])=>`${ATTR[k]} +${dec(v)}`);
  save();render();window.scrollTo(0,0);
  if(sz172Q()){try{v155Show(v155().q[0]);}catch(e){}return;}
  if(n)openModal(`<h3>${n} gün geçti</h3><p>Bugün ${fmtLong(today())}: ${DT[dayType(G.s.day)].n}.</p>${gains.length?`<ul class="notes">${gains.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<p>${G.p.injury&&!inj0?'Bu sürede sakatlandın, gelen kutuna bak.':'Gelen kutunda yeni mesajlar olabilir.'}</p><button class="cta" data-act="closeModal">Tamam</button>`);};
mgrAdvance=function(){let g=0;while(g++<120&&G.phase==='season'&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac'||t==='kupa'||t==='hzm')break;if(sz172Q())break;nextDay();}save();render();window.scrollTo(0,0);};

/* ---------- futbolcu: kamp sahneleri ---------- */
const SZ172_TQ={
  DF:['Rakip savunmanın arkasına uzun top attığında savunma hattı ne yapmalı?',[['Hattı birlikte geri çekip ikinci topa hazırlanmak',1],['Ofsayt için tek başına öne çıkmak',0],['Topa en yakın oyuncuya hep birlikte koşmak',0]]],
  OS:['Topu kaybettiğimiz an orta saha oyuncusunun ilk görevi ne?',[['Hemen baskı yapıp rakibin ilk pasını geciktirmek',1],['Durup rakibin ne yapacağını izlemek',0],['Rakip kaleye doğru koşmayı sürdürmek',0]]],
  FW:['Önde pres işareti verildiğinde forvet ne yapar?',[['Eğri koşuyla bir pas yolunu kapatıp topu kenara zorlamak',1],['Topa en kısa yoldan dümdüz koşmak',0],['Orta sahaya dönüp yer tutmak',0]]],
  KN:['Bek bindirme koşusu yaptığında kanat oyuncusu ne yapar?',[['İçeri kat edip bekin koşusuna alan açmak',1],['Çizgide kalıp aynı koridoru kullanmak',0],['Geriye dönüp beki savunmada beklemek',0]]],
  KL:['Rakip korneri kısa kullandığında kaleci ne yapmalı?',[['Yeniden yerleşip savunmayı yeni açıya göre konuşarak düzenlemek',1],['Kaleden çıkıp topa koşmak',0],['Çizgide kalıp sessizce beklemek',0]]]};
function sz172ScEv(S){const p=G.p,y=G.s.year,base={g:'kamp',k:'sz172s',key:'s'+y+':'+S.k,mt:'coach',sc:S.k};
  if(S.k==='oda'){const rm=fakeName();return Object.assign(base,{t:'Kamp: oda arkadaşın',d:{rm},b:`<p>Kamp otelinde odalar dağıtıldı. Oda arkadaşın <b>${esc(rm)}</b>; ${p.age<18?'altyapıdan yaşıtın':'takımın deneyimli isimlerinden biri'}. Valizini açarken “İlk gece nasıl geçsin?” diye soruyor.</p>`,
    o:[['kural','Erken yat, kurallara uy','Kondisyon ↑ · hoca güveni ↑',1],['sohbet','Gece geç saate kadar sohbet','Moral ↑ · kondisyon ↓'],['oyun','Odada oyun turnuvası kur','Moral ↑↑ · geç kalma riski']]});}
  if(S.k==='kond')return Object.assign(base,{t:'Kamp: kondisyon testi',b:'<p>Sabah mekik koşusu testi (artan hızda 20 metre). Kondisyoner sonuçları hocaya tek tek iletecek. Nasıl koşacaksın?</p>',
    o:[['tempo','Kendi temposunu koru','Dengeli sonuç',1],['zorla','Sonuna kadar zorla','Hoca güveni ↑↑ · yorgunluk ve küçük sakatlık riski'],['birak','Erken bırak, enerjini sakla','Kondisyon korunur · hoca güveni ↓']]});
  if(S.k==='kaptan')return Object.assign(base,{t:'Kamp: kaptanla konuşma',b:'<p>Akşam yemeğinde takım kaptanı yanına oturdu: “Yeni sezonda senden çok şey bekliyoruz. Kafandan neler geçiyor?”</p>',
    o:[['tavsiye','Tavsiye iste','Moral ↑ · küçük gelişim',1],['hedef','İlk 11 hedefini açıkça söyle','Güvenin yüksekse kaptan arkanda durur'],['dinle','Daha çok dinle, az konuş','Moral ↑']]});
  if(S.k==='taktik'){const Q=SZ172_TQ[p.pos]||SZ172_TQ.OS,r=srng('sz172t'+y+p.pos)(),opts=Q[1].map((x,i)=>[x,i]);if(r<0.33)opts.push(opts.shift());else if(r<0.66)opts.unshift(opts.pop());
    return Object.assign(base,{t:'Kamp: taktik sınavı',d:{ok:opts.findIndex(x=>x[0][1]===1)},b:`<p>Hoca video odasında tahtaya diziliş çizdi ve sana döndü:</p><p><b>“${esc(Q[0])}”</b></p>`,
      o:opts.map((x,i)=>['c'+i,x[0][0],'',i===0])});}
  return null;}
function sz172ScRes(ev,k){const p=G.p;let r='';
  if(ev.sc==='oda'){if(k==='kural'){bump('energy',5);bump('trust',1);r='Dinlenmiş uyandın; hoca sabah idmanındaki enerjini fark etti.';}
    else if(k==='sohbet'){bump('morale',5);bump('energy',-5);r=`${ev.d&&ev.d.rm||'Oda arkadaşın'} ile kamp boyunca iyi anlaşacaksınız.`;}
    else{bump('morale',7);bump('energy',-8);if(Math.random()<0.3){bump('trust',-2);r='Turnuva uzadı; sabah kahvaltıya geç kaldın, hoca not aldı.';}else r='Koridordaki herkes odanıza toplandı; kampın en eğlenceli gecesiydi.';}}
  else if(ev.sc==='kond'){const sc=p.a.fiz*0.55+p.a.hiz*0.35+p.energy*0.1+rnd(-6,6),bar=myClub().str*0.9;
    if(k==='zorla'){bump('energy',-12);if(sc>=bar){bump('trust',4);r='Takımın en iyi derecelerinden birini yaptın. Kondisyoner hocaya seni gösterdi.';}else{bump('trust',2);r='Sonuna kadar koştun; derecen ortalamanın biraz altında ama çaban not edildi.';}
      if(p.energy<45&&!p.injury&&Math.random()<0.12*proneF()){p.injury=rollInjury(0.3,'kas');msg('injury','Testte kas zorlanması',`${p.injury.name}. ${injTxt(p.injury)} dinlenmen gerekiyor.`);r+=' Ama baldırında bir zorlanma hissettin.';}}
    else if(k==='tempo'){bump('energy',-6);bump('trust',sc>=bar?2:0.5);r=sc>=bar?'Dengeli koştun, derecen iyi çıktı.':'Ortalama bir derece; kampın geri kalanında çalışarak kapatabilirsin.';}
    else{bump('energy',-2);bump('trust',-3);r='Erken bıraktın. Kondisyoner hocaya “daha fazlasını verebilirdi” dedi.';}}
  else if(ev.sc==='kaptan'){if(k==='tavsiye'){bump('morale',4);const kk=pick(['pas','def','dri']);const g=gainAttr(kk,0.12);r=`Kaptan pozisyon alma ve iletişim üzerine ipuçları verdi (${ATTR[kk]} +${dec(g,2)}).`;}
    else if(k==='hedef'){if(p.trust>=55||OVR()>=myClub().str-2){bump('morale',5);bump('trust',1);r='Kaptan gülümsedi: “Bu açlık hoşuma gitti. Antrenmanda arkandayım.”';}else{bump('morale',1);r='Kaptan omzuna vurdu: “Önce idmanda göster, forma kendiliğinden gelir.”';}}
    else{bump('morale',3);r='Kaptanın anlattığı eski sezon hikâyelerini dinledin; takıma biraz daha ısındın.';}}
  else if(ev.sc==='taktik'){const i=+String(k).slice(1),ok=ev.d&&i===ev.d.ok;if(ok){bump('trust',3);const g=gainAttr(p.pos==='FW'||p.pos==='KN'?'pas':'def',0.1);r=`Doğru cevap. Hoca başını salladı: “Tam olarak bu.” (hoca güveni +3, gelişim +${dec(g,2)})`;}
    else{bump('trust',-1);r='Hoca doğru cevabı tahtada gösterdi. Video ödevi verdi: “Yarın tekrar soracağım.”';}}
  try{const m=G.inbox.find(x=>x.sz172s===ev.key);if(m){m.body=m.body+` — Seçimin: ${(ev.o.find(x=>x[0]===k)||[,''])[1]}. ${r}`;m.read=true;}}catch(e){}
  save();return r;}
try{V155_DEC.sz172s=(ev,k)=>sz172ScRes(ev,k);}catch(e){}
function sz172PushSc(S){const ev=sz172ScEv(S);if(!ev)return false;v155Push(ev);try{const m=G.inbox[0];if(m&&m.title===ev.t)m.sz172s=ev.key;}catch(e){}return true;}

/* ---------- futbolcu: boş gün olayları (EVENTS / m.ev; kendiliğinden seçilmez, sz172 üreteci yönetir) ---------- */
const SZ172_EV={
  sz172_ekstra:{ok:()=>!G.p.injury&&G.p.energy>=40,title:'Takım arkadaşından ekstra idman',data:()=>({n:fakeName(),k:G.p.pos==='KL'?'def':G.p.pos==='DF'?pick(['def','fiz']):pick(['sut','pas','dri'])}),
    body:d=>`${d.n} idmandan sonra sahada kalıp birlikte ${ATTR[d.k].toLowerCase()} çalışmayı öneriyor.`,
    o:[['Katıl, 30 dakika çalış',d=>{const g=gainAttr(d.k,0.18);bump('energy',-7);bump('trust',1);return `${ATTR[d.k]} +${dec(g,2)}. ${d.n} ile iyi bir ikili oldunuz.`;}],
       ['Kısa tut, esneme yap',d=>{const g=gainAttr(d.k,0.06);bump('energy',-2);return `Kısa bir çalışma: ${ATTR[d.k]} +${dec(g,2)}.`;}],
       ['Teşekkür et, dinlen',()=>{bump('energy',4);return 'Dinlenmeyi seçtin.';}]]},
  sz172_okul:{ok:()=>G.p.age<18,title:'Okuldan proje ödevi',data:()=>({}),body:()=>'Öğretmenin hafta sonuna kadar teslim edilecek bir proje ödevi verdi. Ailen idmanla dersi dengelemeni istiyor.',
    o:[['Akşamları ödeve ayır',()=>{bump('morale',3);bump('energy',-2);return 'Ödevin zamanında bitti; öğretmenin ve ailen memnun.';}],
       ['Takım arkadaşlarınla birlikte çalış',()=>{bump('morale',5);bump('energy',-4);return 'Kamp odasında ders çalışma grubu kurdunuz; hem ödev bitti hem takım kaynaştı.';}],
       ['Son güne bırak',()=>{bump('morale',-3);bump('energy',-6);return 'Son gece sabaha kadar uğraştın; ertesi gün idmanda uykuluydun.';}]]},
  sz172_aile:{ok:()=>G.p.age>=18,title:'Ailen şehre geliyor',data:()=>({}),body:()=>'Ailen hafta sonu seni ziyarete geliyor. Programında ne kadar yer açacaksın?',
    o:[['Bütün günü onlara ayır',()=>{bump('morale',7);bump('energy',-3);return 'Ailenle güzel bir gün geçirdin; moralin yerinde.';}],
       ['Akşam yemeğinde buluş',()=>{bump('morale',4);return 'Kısa ama keyifli bir akşam yemeği.';}],
       ['Bu hafta olmaz',()=>{bump('morale',-3);bump('energy',3);return 'Ailen anlayışla karşıladı ama biraz kırıldılar.';}]]},
  sz172_medya:{ok:()=>true,title:'Kulüp medyasından röportaj',data:()=>({}),body:()=>G.p.age<16?'Kulübün internet sitesi altyapı köşesi için seninle kısa bir söyleşi yapmak istiyor.':'Kulübün yayın kanalı “Hafta içi” programı için seninle kısa bir röportaj çekmek istiyor.',
    o:[['Samimi konuş, hedeflerini anlat',()=>{bump('fame',1);bump('morale',2);return 'Röportaj taraftarların hoşuna gitti.';}],
       ['Kısa ve takım odaklı konuş',()=>{bump('trust',1);return 'Hoca röportajı izledi: “Ayakları yere basıyor.”';}],
       ['Kibarca reddet',()=>'Röportajı başka bir zamana bıraktın.']]},
  sz172_sosyal:{ok:()=>true,title:'Sosyal sorumluluk projesi',data:()=>({w:pick(['çocuk hastanesine ziyaret','köy okuluna malzeme götürme','engelli çocuklarla futbol etkinliği','fidan dikme günü'])}),body:d=>`Kulübün sosyal sorumluluk birimi seni ${d.w} etkinliğine çağırıyor.`,
    o:[['Katıl',d=>{const im=imInit();im.v=clamp(im.v+3,0,100);bump('fame',1);bump('morale',3);bump('energy',-3);return `${d.w.charAt(0).toUpperCase()+d.w.slice(1)} etkinliğine katıldın; kulüp basını paylaştı, imajın güçlendi.`;}],
       ['Katıl ve imzalı forma götür',d=>{const c=E2U(80);if(G.p.money<c)return 'Paran yetmedi; yine de katıldın ve çocuklarla vakit geçirdin.';G.p.money-=c;const im=imInit();im.v=clamp(im.v+5,0,100);bump('fame',1);bump('morale',4);bump('energy',-3);return 'İmzalı formalar çok sevindirdi; etkinliğin yıldızı sendin.';}],
       ['Programım dolu',()=>{const im=imInit();im.v=clamp(im.v-1,0,100);return 'Etkinliğe katılmadın.';}]]},
  sz172_onleme:{ok:()=>!G.p.injury,title:'Sakatlık önleme programı',data:()=>({}),body:()=>'Fizyoterapist kas dengesi testinde arka adalede zayıflık gördü. Üç haftalık önleyici bir program öneriyor.',
    o:[['Programa başla',()=>{const p=G.p;if(!p.sz172pv){p.prone=(p.prone||0)-1;p.sz172pv={u:absDay()+21};}else p.sz172pv.u=absDay()+21;bump('energy',-2);return 'Üç hafta boyunca idman öncesi ek kuvvet çalışması: sakatlık riskin azaldı.';}],
       ['Yalnız esneme ekle',()=>{bump('energy',1);return 'Esneme rutinini uzattın.';}],
       ['Gerek yok',()=>'Programa katılmadın.']]},
  sz172_beslenme:{ok:()=>G.p.age>=15,title:'Beslenme uzmanıyla görüşme',data:()=>({}),body:()=>'Kulübün beslenme uzmanı maç haftası için kişisel bir beslenme planı hazırladı.',
    o:[['Plana sıkı uy',()=>{bump('energy',6);bump('morale',-1);return 'Daha zinde hissediyorsun.';}],
       ['Esnek uygula',()=>{bump('energy',3);return 'Plana büyük ölçüde uydun.';}],
       ['Kendi düzenimde kalayım',()=>'Alışkanlıklarını değiştirmedin.']]},
  sz172_yenigelen:{ok:()=>G.p.age>=16,title:'Yeni takım arkadaşı',data:()=>({n:fakeName()}),body:d=>`Kadroya yeni katılan ${d.n} şehri ve takımı tanımıyor. Hoca, ona yardımcı olmanı rica etti.`,
    o:[['Şehri gezdir, yemeğe götür',d=>{bump('morale',3);bump('trust',1);bump('energy',-3);return `${d.n} çok mutlu oldu; hoca bu jesti fark etti.`;}],
       ['Soyunma odasında tanıştır',()=>{bump('trust',0.5);return 'Kısa bir tanışma ayarladın.';}],
       ['Zamanım yok',()=>{bump('trust',-1);return 'Hoca biraz bozuldu.';}]]},
  sz172_forma:{ok:()=>false,title:'Forma rekabeti',data:()=>({}),body:()=>'',
    o:[['Hocayla görüş',()=>{setTimeout(()=>{try{v163CoOpen(true);}catch(e){}},80);return 'Hocanın odasına gittin.';}],
       ['Ekstra idmanla cevap ver',()=>{if(G.p.injury)return 'Sakatken ekstra idman yapamazsın; önce iyileşmelisin.';const k=Object.entries(POS[G.p.pos].w).sort((a,b)=>b[1]-a[1])[0][0];const g=gainAttr(k,0.15);bump('energy',-8);bump('trust',1.5);return `İdmandan sonra sahada kaldın: ${ATTR[k]} +${dec(g,2)}, hoca güveni arttı.`;}],
       ['Sabret, sıranı bekle',()=>{bump('morale',-1);return 'Sabırlı olmayı seçtin.';}]]}};
for(const [id,E] of Object.entries(SZ172_EV))EVENTS[id]={c:()=>false,title:E.title,body:E.body,o:E.o};
function sz172EvTick(t){const V=sz172(),now=absDay();if(t==='mac'||t==='milli'||t==='kupa'||t==='hzm')return;
  if((G.inbox||[]).filter(m=>m.ev&&!m.ev.done).length>=2)return;
  const wk=Math.floor(now/7);if(V.wk!==wk){V.wk=wk;V.wn=0;}if(V.wn>=2)return;if(V.last&&now-V.last<3)return;
  if(Math.random()>0.32)return;
  const ids=Object.keys(SZ172_EV).filter(k=>{try{return SZ172_EV[k].ok()&&!(V.ev[k]&&now-V.ev[k]<45);}catch(e){return false;}});if(!ids.length)return;
  const id=pick(ids),E=SZ172_EV[id],d=E.data?E.data():{};V.ev[id]=now;V.last=now;V.wn++;
  msg('event',E.title,E.body(d),{ev:{id,d,done:false,res:''}});}
/* sakatlık önleme programının süresi */
function sz172PvTick(){const p=G.p;if(p.sz172pv&&absDay()>=p.sz172pv.u){p.prone=(p.prone||0)+1;delete p.sz172pv;}}
/* forma rekabeti iletisine seçenek */
try{tmWeek=(old=>function(){const n0=G.inbox.length,f0=G.inbox[0];const r=old.apply(this,arguments);try{const m=G.inbox[0];if(m&&(m!==f0||G.inbox.length!==n0)&&m.title==='Forma rekabeti'&&!m.ev&&/parlıyor/.test(m.body||''))m.ev={id:'sz172_forma',d:{},done:false,res:''};}catch(e){}return r;})(tmWeek);}catch(e){}

/* ---------- futbolcu: günlük akış ---------- */
function sz172PlTick(){const H=sz172Hz(),t=dayType(G.s.day),d=G.s.day;let sc=false;
  if(H){const f=H.list.find(x=>x.d===d&&!x.done);if(f&&!f.role){f.role=sz172PlRole();const o=CLUBS[f.opp];msg('squad','Hazırlık maçı kadrosu',`${o?o.name:'Rakip'} ile bugün hazırlık maçı (${SZ172_LVS[f.lv]} rakip). ${f.role==='start'?'Hoca seni ilk 11’de başlatacak.':f.role==='sub'?'Yedek başlıyorsun; ikinci yarıda şans bulabilirsin.':f.role==='injured'?'Sakat olduğun için kadroda yoksun.':'Hoca bu maçta başka oyuncuları deneyecek; süre almayacaksın.'}`);}
    for(const S of H.sc||[]){if(S.done||S.d>d)continue;S.done=true;if(d-S.d>3||G.p.injury&&S.k==='kond')continue;if(!sc&&sz172PushSc(S))sc=true;}}
  if(!sc)sz172EvTick(t);sz172PvTick();}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.s&&G.phase==='season'){if(isPl())sz172PlTick();}}catch(e){console.warn('sz172 gün',e);}return r;})(nextDay);

/* ---------- futbolcu: ana sayfa ---------- */
function sz172PlBlock(f){const me=myClub(),o=CLUBS[f.opp];if(!o)return '';const role=f.role||(f.role=sz172PlRole());
  const tk=ticketHTML(`Hazırlık maçı · ${sz172Idx(f)}`,`Bugün · ${f.h?'İç saha':'Deplasman'} · ${SZ172_LVS[f.lv]} rakip`,f.h?me:o,f.h?o:me,'<span class="pill">Hazırlık</span> Lig tablosunu etkilemez');
  const play=role==='start'||role==='sub';
  return `<div class="sz172-hz">${tk}<button class="cta big" data-act="play"><span>${play?'Hazırlık maçına çık':'Maçı kenardan izle'}</span><small>${esc(SZ172_ROLE[role])}</small></button>${play?'<button class="btn" data-act="simPlay">Hızlı sonuç</button>':''}</div>`;}
function sz172PrepPanel(){const H=sz172Hz();if(!H||!H.list.length)return '';const d=G.s.day,L=H.list.filter(x=>x.w===(d>(G.s.cal[0]||0)?'k':'y'));if(!L.length||L.every(x=>x.done&&x.d<d-6))return '';
  const rows=L.map(f=>{const o=CLUBS[f.opp];if(!o)return '';const res=f.r?`<b class="${f.r[0]>f.r[1]?'w':f.r[0]<f.r[1]?'l':'d'}">${f.r[0]}-${f.r[1]}</b>`:`<small>${f.d===d?'Bugün':fmtDate(dateOf(f.d))}</small>`;
    return `<li class="${f.d===d?'now':''}">${crestSVG(o,18)}<span>${esc(o.name)}<small>${f.h?'İç saha':'Deplasman'} · ${SZ172_LVS[f.lv]}${f.pl?` · ${f.pl.mn}′ · ${dec(f.pl.rt)}`:f.done&&f.role&&f.role!=='start'&&f.role!=='sub'?' · oynamadın':''}</small></span>${res}</li>`;}).join('');
  return `<section class="panel sz172-pp"><p class="sub-h"><span>${L[0].w==='k'?'Devre arası kampı':'Hazırlık kampı'} · hazırlık maçları</span><span>${L.filter(x=>x.done).length}/${L.length}</span></p><ul class="sz172-fl">${rows}</ul><p class="muted">Hazırlık maçları lig tablosunu etkilemez; oynadığın süre ve puanın hoca güvenine ve formuna yazılır.</p></section>`;}
viewHub=(old=>function(){let h=old.apply(this,arguments);try{if(!isPl()||!G||G.phase!=='season')return h;const f=sz172HzToday();
    if(!f){const nx=sz172NextHz();if(nx)h=h.replace(/(<button class="btn" data-act="auto">)Maç gününe ilerle(?: \(\d+ gün\))?/,`$1Hazırlık maçına ilerle (${nx.d-G.s.day} gün)`);}
    if(f&&!f.done){const blk=sz172PlBlock(f);const h2=h.replace(/<div class="day-ctas">[\s\S]*?<\/div>/,blk);h=h2!==h?h2:blk+h;}
    const pp=sz172PrepPanel();if(pp){const i=h.indexOf('<div class="stab');h=i>0?h.slice(0,i)+pp+h.slice(i):h+pp;}
    if(sz172Q()&&h.indexOf('v155-alert')<0){const a=v155Alert();if(a)h=a+h;}}catch(e){console.warn('sz172 hub',e);}return h;})(viewHub);
weekStripHTML=(old=>function(){const h=old.apply(this,arguments);try{return h.replace(/<div class="day ([^"]*)">(<span class="dn">[^<]*<\/span><b>[^<]*<\/b><span class="dl">HAZ\.M<\/span>)/g,'<div class="day $1 mday hzd">$2');}catch(e){return h;}})(weekStripHTML);

/* ---------- takvim ---------- */
try{V165_EC.hz='f';}catch(e){}
v165Events=(old=>function(d0,d1){const E=old.apply(this,arguments);try{const H=sz172Hz();if(H){const lab=H.k==='td'?'Hazırlık maçı (yönet ya da hızlı sonuç)':'Hazırlık maçı';
    for(const f of H.list){if(f.d<d0||f.d>d1)continue;const o=CLUBS[f.opp];if(!o)continue;let res=null;if(f.r)res=[`${f.r[0]}-${f.r[1]}`,f.r[0]>f.r[1]?'w':f.r[0]===f.r[1]?'d':'l'];
      (E[f.d]=E[f.d]||[]).push({k:'hz',ic:'H',c:o,h:f.n?null:f.h,comp:'Hazırlık',t:o.short||o.name,d:`${lab} · ${o.name} · ${f.n?'tarafsız saha':f.h?'İç saha':'Deplasman'} · ${SZ172_LVS[f.lv]} rakip · lig tablosunu etkilemez`,res});}}}catch(e){}return E;})(v165Events);
v165CalHTML=(old=>function(){let h=old.apply(this,arguments);try{const H=sz172Hz();if(H){for(const f of H.list){const o=CLUBS[f.opp];if(!o)continue;const res=f.r?[`${f.r[0]}-${f.r[1]}`,f.r[0]>f.r[1]?'w':f.r[0]===f.r[1]?'d':'l']:null;
      h=h.replace(new RegExp(`(data-d="${f.d}" aria-label="[^"]*"><span class="n">\\d+</span>)`),`$1${v165Chip({k:'hz',c:o,h:f.n?null:f.h,t:o.short||o.name,res})}`);}
    h=h.replace(/<i class="f" title="[^"]*">H<\/i>/g,'').replace(/<span class="v5i"><\/span>/g,'').replace('<span><i class="lg n"></i>Milli</span>','<span><i class="lg n"></i>Milli</span><span><i class="lg f"></i>Hazırlık</span>');}}catch(e){}return h;})(v165CalHTML);
v165Chip=(old=>function(e,full){try{if(e&&e.k==='hz'&&e.c)return `<span class="v5c f${e.res?' r'+e.res[1]:''}">${crestSVG(e.c,full?18:13)}<i>${e.h==null?'N':e.h?'İ':'D'}</i><b>${esc(e.t)}</b>${e.res?`<em>${e.res[0]}</em>`:''}</span>`;}catch(x){}return old.apply(this,arguments);})(v165Chip);

/* =====================================================================
   TEKNİK DİREKTÖR: sezon öncesi hazırlık
   ===================================================================== */
const SZ172_KAMP={tesis:['Kulüp tesisleri','Masrafsız; tanıdık ortam',0,{c:2,f:3,m:0}],irtifa:['Yüksek irtifa kampı','Dağ kampı: kondisyon odaklı, sessiz',0.004,{c:6,f:3,m:1}],yurtdisi:['Yurt dışı kampı','Güçlü rakipler, prestij; pahalı',0.010,{c:4,f:5,m:2}]};
const SZ172_SURE={10:['10 gün','Kısa: oyuncular dinç kalır',{c:0,f:0,r:0}],14:['14 gün','Dengeli',{c:3,f:2,r:0.1}],18:['18 gün','Uzun: daha çok uyum, sakatlık riski',{c:5,f:4,r:0.35}]};
const SZ172_ODAK={kondisyon:['Kondisyon','Kondisyon ↑↑ · uyum ↑',{c:6,f:1}],taktik:['Taktik','Uyum ↑↑ · duran top ↑',{c:-1,f:6}],denge:['Denge','İkisi de ↑',{c:3,f:3}]};
function sz172TdCost(k){return Math.round(clubBudget(myClub())*VALF*SZ172_KAMP[k][2]/1e4)*1e4;}
function sz172ObjTxt(t,n){return t===1?'Şampiyonluk':t<=3?`İlk ${t}`:t<=n/2?`İlk ${t}`:'Ligde kalmak';}
function sz172Caps(){const sq=squadOf(G.club).filter(p=>p.age>=21);return sq.sort((a,b)=>capScore(b,G.club)-capScore(a,G.club)).slice(0,5);}
function sz172Def(){return {kamp:'tesis',sure:14,fr:['kolay','denk','zor'],odak:'denge',cap:null,hedef:'kabul'};}
let SZ172T=null;
function sz172TdNeed(){const H=sz172Hz();return !!(H&&H.k==='td'&&H.pend&&G.phase==='season'&&G.s.day<(G.s.cal[0]||0));}
function sz172TdOpen(mode){const m=G.m;mode=mode||(G.phase==='off'?'off':'ss');const pre=m.sz172n&&m.sz172n.y===(mode==='off'?G.s.year+1:G.s.year)?m.sz172n:null;
  SZ172T=Object.assign(sz172Def(),pre||{},{mode});if(mode==='ss'){const c=sz172Caps();if(!SZ172T.cap||!c.some(p=>p.k===SZ172T.cap))SZ172T.cap=c[0]?c[0].k:null;}sz172TdRender();}
function sz172TdRender(){const T=SZ172T,m=G.m,c=myClub(),off=T.mode==='off';if(!T)return;
  const chip=(g,v,lab,sub,dis)=>`<button class="chip" data-act="sz172T" data-g="${g}" data-v="${v}" aria-pressed="${String(T[g])===String(v)}"${dis?' disabled':''}><b>${lab}</b>${sub?`<small>${sub}</small>`:''}</button>`;
  const kamp=Object.entries(SZ172_KAMP).map(([k,x])=>{const cost=sz172TdCost(k),dis=cost>0&&m.budget<cost;return chip('kamp',k,x[0],`${x[1]}${cost?` · ${money(cost)}`:''}${dis?' · bütçe yetmiyor':''}`,dis);}).join('');
  const sure=Object.entries(SZ172_SURE).map(([k,x])=>chip('sure',k,x[0],x[1])).join('');
  const fr=T.fr.map((lv,i)=>`<div class="sz172-frr"><span>${i+1}. maç</span><div class="seg">${Object.keys(SZ172_LV).map(v=>`<button class="chip" data-act="sz172T" data-g="fr" data-i="${i}" data-v="${v}" aria-pressed="${lv===v}">${SZ172_LV[v]}</button>`).join('')}</div></div>`).join('');
  const odak=Object.entries(SZ172_ODAK).map(([k,x])=>chip('odak',k,x[0],x[1])).join('');
  let cap='',hed='';
  if(!off){const C=sz172Caps(),auto=C[0];cap=`<div class="sz172-sec"><p class="kicker">Kaptan seçimi</p><div class="seg sz172-cap">${C.map(p=>chip('cap',p.k,esc(ksur(p.name)),`${POS_TR[p.pos]||p.pos} · ${p.age} yaş · ${R200(p.ovr)}${p===auto?' · soyunma odasının adayı':''}`)).join('')}</div></div>`;
    const n=leagueClubs(c.league).length,o=m.obj,up=Math.max(1,o.pos-1),dn=Math.min(n-1,o.pos+2);
    hed=`<div class="sz172-sec"><p class="kicker">Yönetimle sezon hedefi görüşmesi</p><p class="muted">Yönetimin önerdiği hedef: <b>${esc(o.txt)}</b> · yönetim güveni ${Math.round(m.conf)}</p><div class="seg sz172-hed">${chip('hedef','kabul','Hedefi kabul et',`${o.txt} · güven +3`)}${o.pos>1?chip('hedef','iddia','Daha iddialı ol',`${sz172ObjTxt(up,n)} · güven +6 · bütçe +%5`):''}${dn>o.pos?chip('hedef','dusur','Gerçekçi hedef iste',`${sz172ObjTxt(dn,n)} · güven −6`):''}</div></div>`;}
  openModal(`<section class="sz172-td"><span class="kicker">${off?`${seasonLabel(G.s.year+1)} · yaz arası planı`:`${seasonLabel(G.s.year)} · sezon öncesi`}</span><h3>Sezon öncesi hazırlık</h3>
    <p class="muted">${off?'Planın yeni sezon başlarken uygulanır; kaptan ve hedef görüşmesi sezonun ilk gününde yapılır.':`İlk lig maçı ${fmtDate(dateOf(G.s.cal[0]))}. Hazırlık maçları takvime yazılır; lig tablosunu etkilemez.`}</p>
    <button class="cta" data-act="sz172Ok" data-auto="1"><span>${off?'Planı kaydet':'Planı onayla, kampa başla'}</span><small>Kamp: ${SZ172_KAMP[T.kamp][0]} · ${T.sure} gün · ${T.fr.length} hazırlık maçı · odak: ${SZ172_ODAK[T.odak][0].toLowerCase()}</small></button>
    <div class="sz172-sec"><p class="kicker">Kamp yeri</p><div class="seg">${kamp}</div></div>
    <div class="sz172-sec"><p class="kicker">Kamp süresi</p><div class="seg">${sure}</div></div>
    <div class="sz172-sec"><p class="kicker">Hazırlık maçı programı · ${T.fr.length} maç</p>${fr}<div class="sz172-frb"><button class="btn" data-act="sz172Fr" data-v="-1"${T.fr.length<=2?' disabled':''}>− Maç çıkar</button><button class="btn" data-act="sz172Fr" data-v="1"${T.fr.length>=4?' disabled':''}>+ Maç ekle</button></div><p class="muted">Kolay rakip moral ve özgüven verir; güçlü rakip uyumu daha çok artırır ama yenilgi morali bozabilir.</p></div>
    <div class="sz172-sec"><p class="kicker">Ön sezon odağı</p><div class="seg">${odak}</div></div>${cap}${hed}
    <button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:10px">Sonra karar ver</button></section>`);
  try{$('#modalCard').classList.add('sz172m');}catch(e){}}
ACTX.sz172Plan=()=>sz172TdOpen();
ACTX.sz172T=el=>{const T=SZ172T;if(!T)return;const g=el.dataset.g,v=el.dataset.v;if(g==='fr')T.fr[+el.dataset.i]=v;else if(g==='sure')T.sure=+v;else T[g]=v;sz172TdRender();};
ACTX.sz172Fr=el=>{const T=SZ172T;if(!T)return;if(+el.dataset.v>0&&T.fr.length<4)T.fr.push('denk');else if(+el.dataset.v<0&&T.fr.length>2)T.fr.pop();sz172TdRender();};
ACTX.sz172Ok=()=>{const T=SZ172T;if(!T)return;SZ172T=null;const m=G.m;
  if(T.mode==='off'){m.sz172n={y:G.s.year+1,kamp:T.kamp,sure:T.sure,fr:T.fr.slice(),odak:T.odak};closeModal();save();render();return toast('Sezon öncesi planı kaydedildi');}
  closeModal();const r=sz172TdApply(T);save();render();window.scrollTo(0,0);if(r)openModal(r);};
function sz172TdApply(T){const m=G.m,c=myClub(),H=G.s.hz;if(!H||H.k!=='td')return '';const f=fmInit().fm;trInit();const sq=squadOf(G.club),notes=[];
  /* kamp */
  let kamp=T.kamp;const cost=sz172TdCost(kamp);if(cost>0&&m.budget<cost)kamp='tesis';const K=SZ172_KAMP[kamp],cst=sz172TdCost(kamp);if(cst){m.budget-=cst;notes.push(`${K[0]}: ${money(cst)} bütçeden harcandı.`);}
  const avail=Math.max(4,(G.s.cal[0]||14)-3),sure=Math.min(+T.sure||14,avail),S=SZ172_SURE[T.sure]||SZ172_SURE[14],O=SZ172_ODAK[T.odak]||SZ172_ODAK.denge,sf=sure/(+T.sure||14);
  const dc=Math.round((K[3].c+S[2].c*sf+O[2].c)),df=Math.round(K[3].f+S[2].f*sf+O[2].f);
  m.tcond=clamp(Math.min(m.tcond==null?92:m.tcond,76)+dc,30,100);f.fam=clamp((f.fam||50)+df,0,100);if(T.odak==='taktik')m.sp=clamp((m.sp||0)+0.3,0,10);
  if(K[3].m)for(const p of sq)relAdd(p,K[3].m);
  notes.push(`Tatil dönüşü kondisyon %76 → %${Math.round(m.tcond)} · taktik uyum ${df>=0?'+':''}${df} (%${Math.round(f.fam)}).`);
  if(Math.random()<S[2].r){const fit=sq.filter(p=>!m.inj[p.k]);if(fit.length){const p=pick(fit),w=rint(1,2);m.inj[p.k]=w;notes.push(`Uzun kampın yükü: ${p.name} hafif sakatlandı (${w} hf).`);}}
  /* hazırlık maçları */
  const used=new Set(),list=[],n=Math.min(T.fr.length,Math.max(1,Math.floor((avail-2)/3))),days=sz172Spread(Math.min(3,avail),avail,n,[]);
  days.forEach((d,i)=>{const lv=T.fr[i]||'denk',abroad=kamp==='yurtdisi'&&d<=sure+1&&lv!=='kolay',o=sz172Opp(lv,used,abroad);if(!o)return;used.add(o.id);list.push({d,opp:o.id,h:i%2===0,n:abroad?1:0,lv,w:'y'});});
  H.list=list;
  if(list.length)notes.push(`Hazırlık maçları: ${list.map(x=>`${fmtDate(dateOf(x.d))} ${CLUBS[x.opp].short||CLUBS[x.opp].name} (${SZ172_LVS[x.lv]})`).join(', ')}.`);
  /* kaptan */
  const C=sz172Caps(),auto=C[0],cp=sq.find(p=>p.k===T.cap)||auto;if(cp){m.capK=cp.k;relAdd(cp,8);
    if(auto&&cp!==auto){relAdd(auto,-6);try{for(const p of v163Leaders())if(p!==cp&&p!==auto)relAdd(p,-1);}catch(e){}notes.push(`Kaptan: ${cp.name}. ${auto.name} pazubendi kaybetmekten hoşnut değil.`);}
    else{for(const p of sq)if(p!==cp)relAdd(p,1);notes.push(`Kaptan: ${cp.name}. Soyunma odası bu seçimi destekledi.`);}}
  /* hedef */
  const o=m.obj,nL=leagueClubs(c.league).length;
  if(T.hedef==='iddia'&&o.pos>1){o.pos=Math.max(1,o.pos-1);o.txt=sz172ObjTxt(o.pos,nL);m.conf=clamp(m.conf+6,0,100);m.fans=clamp((m.fans==null?62:m.fans)+3,0,100);const b=Math.round(m.budget*0.05/1e4)*1e4;m.budget+=b;notes.push(`Hedef: ${o.txt}. Yönetim iddianı sevdi (güven +6${b?`, ek bütçe ${money(b)}`:''}).`);}
  else if(T.hedef==='dusur'&&o.pos<nL-1){o.pos=Math.min(nL-1,o.pos+2);o.txt=sz172ObjTxt(o.pos,nL);m.conf=clamp(m.conf-6,0,100);notes.push(`Hedef: ${o.txt}. Yönetim hedefi düşürdü ama hayal kırıklığını gizlemedi (güven −6).`);}
  else{m.conf=clamp(m.conf+3,0,100);notes.push(`Hedef: ${o.txt}. Yönetimle aynı sayfadasınız (güven +3).`);}
  try{const cs=cstate(G.club);cs.board=m.conf;}catch(e){}
  H.pend=false;H.plan={kamp,sure,odak:T.odak,cap:cp?cp.k:null,hedef:T.hedef};delete m.sz172n;
  msg('board','Sezon öncesi hazırlık planı',`${K[0]} · ${sure} gün · odak: ${O[0].toLowerCase()}. ${notes.join(' ')}`);
  return `<h3>Kamp başladı</h3><ul class="notes">${notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="cta" data-act="closeModal">Tamam</button>`;}
/* kaptan: TD seçimi squadRoles'a yansır */
squadRoles=(old=>function(id){const R=old.apply(this,arguments);try{if(isTD()&&id===G.club&&G.m.capK&&R[G.m.capK]){for(const k in R)if(R[k]==='Kaptan'&&k!==G.m.capK)R[k]='Takım lideri';R[G.m.capK]='Kaptan';}}catch(e){}return R;})(squadRoles);
/* plan yapılmadan kampa geçilmez (Devam, Maç gününe ilerle, tatil) */
document.addEventListener('click',e=>{const el=e.target&&e.target.closest&&e.target.closest('[data-act]');if(!el||!['mgrAdv','mgrPlay','mgrSim'].includes(el.dataset.act))return;
  try{if(sz172TdNeed()&&$('#modal').hidden){e.stopImmediatePropagation();e.preventDefault();sz172TdOpen('ss');}}catch(x){console.warn('sz172 plan',x);}},true);

/* TD hazırlık maçı: 2B maçın sezon oyuncu istatistiklerine ve gol arşivine yazdıkları geri alınır */
let SZ172SNAP=null;
function sz172TdFr(sim){const f=sz172HzToday();if(!f||f.done){nextDay();save();render();return;}const me=myClub();if(f.opp===G.club||!CLUBS[f.opp]){const o=sz172Opp(f.lv,new Set());if(o)f.opp=o.id;}const opp=CLUBS[f.opp];if(!opp){f.done=true;nextDay();save();render();return;}
  if(!sim){SZ172SNAP=JSON.stringify({pst:G.s.pst||null,gl:G.s.gl||null});return fxStart({opp,usHome:!!f.h||!!f.n,neutral:!!f.n,onEnd:(gu,go)=>sz172TdEnd(f,gu,go)});}
  const S={str:xiStr()},[a,b]=f.h||f.n?simPair(S,opp,!!f.n):simPair(opp,S);const gu=f.h||f.n?a:b,go=f.h||f.n?b:a;sz172TdEnd(f,gu,go);}
function sz172TdEnd(f,gu,go){try{if(SZ172SNAP){const o=JSON.parse(SZ172SNAP);SZ172SNAP=null;if(o.pst)G.s.pst=o.pst;else delete G.s.pst;if(o.gl)G.s.gl=o.gl;else delete G.s.gl;}}catch(e){}const m=G.m,me=myClub(),opp=CLUBS[f.opp],fm=fmInit().fm,sq=squadOf(G.club),notes=[];trInit();const win=gu>go,draw=gu===go;
  const L={kolay:[2,0.15],denk:[3,0.25],zor:[4,0.35]}[f.lv]||[3,0.25];fm.fam=clamp((fm.fam||50)+L[0],0,100);m.tcond=clamp(m.tcond+1,30,100);m.form=clamp((m.form||0)+(win?L[1]:draw?0:-L[1]*0.6),-3,4);
  if(win&&f.lv==='zor'){for(const p of sq)relAdd(p,1);m.fans=clamp((m.fans==null?62:m.fans)+1,0,100);notes.push('Güçlü rakibi yenmek soyunma odasına özgüven verdi.');}
  else if(!win&&!draw&&f.lv==='kolay'){m.conf=clamp(m.conf-1,0,100);for(const p of sq)relAdd(p,-0.5);notes.push('Alt seviye rakibe yenilmek moral bozdu; yönetim de not aldı.');}
  else if(!win&&!draw&&f.lv==='zor')notes.push('Güçlü rakibe yenilgi: hazırlık için öğretici bir maç.');
  if(Math.random()<0.1){const fit=sq.filter(p=>!m.inj[p.k]);if(fit.length){const p=pick(fit),w=1;m.inj[p.k]=w;notes.push(`${p.name} hafif darbe aldı (${w} hf).`);}}
  f.done=true;f.r=[gu,go];const home=f.h||f.n?me:opp,away=f.h||f.n?opp:me,hg=f.h||f.n?gu:go,ag=f.h||f.n?go:gu;
  notes.unshift(`Taktik uyum %${Math.round(fm.fam)} · kondisyon %${Math.round(m.tcond)} · lig tablosunu etkilemez.`);
  msg('report',`Hazırlık maçı: ${home.name} ${hg}-${ag} ${away.name}`,notes.join(' '));
  openModal(`<h3>Hazırlık maçı · ${sz172Idx(f)}</h3><div class="res-board"><div class="team">${crestSVG(home,38)}<b>${esc(home.name)}</b></div><div class="res-score">${hg}-${ag}</div><div class="team">${crestSVG(away,38)}<b>${esc(away.name)}</b></div></div><ul class="notes">${notes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="cta" data-act="closeModal">Devam</button>`);
  nextDay();save();render();}
mgrPlay=(old=>function(sim){try{if(isTD()&&G.phase==='season'&&dayType(G.s.day)==='hzm')return sz172TdFr(!!sim);}catch(e){console.warn('sz172 td hazırlık',e);}return old.apply(this,arguments);})(mgrPlay);

/* TD ana sayfası: hazırlık paneli ve hazırlık maçı günü */
function sz172NextHz(){const H=sz172Hz();if(!H)return null;const nm=nextMatchDay(G.s.day);const L=H.list.filter(x=>!x.done&&x.d>G.s.day&&(nm==null||x.d<nm)).sort((a,b)=>a.d-b.d);return L[0]||null;}
function sz172TdPanel(){const H=sz172Hz();if(!H||H.k!=='td'||G.s.day>=(G.s.cal[0]||0))return '';const m=G.m,P=H.plan,d=G.s.day;
  if(H.pend)return `<section class="panel sz172-pp"><p class="sub-h"><span>Sezon öncesi hazırlık</span><span>Bekliyor</span></p><p class="muted">Kamp yeri ve süresi, hazırlık maçı programı, ön sezon odağı, kaptan seçimi ve yönetimle hedef görüşmesi. Plan yapılmadan kampa geçilmez.</p><button class="btn" data-act="sz172Plan">Hazırlığı planla</button></section>`;
  const rows=H.list.map(f=>{const o=CLUBS[f.opp];if(!o)return '';const res=f.r?`<b class="${f.r[0]>f.r[1]?'w':f.r[0]<f.r[1]?'l':'d'}">${f.r[0]}-${f.r[1]}</b>`:`<small>${f.d===d?'Bugün':fmtDate(dateOf(f.d))}</small>`;return `<li class="${f.d===d?'now':''}">${crestSVG(o,18)}<span>${esc(o.name)}<small>${f.n?'Tarafsız saha':f.h?'İç saha':'Deplasman'} · ${SZ172_LVS[f.lv]}</small></span>${res}</li>`;}).join('');
  const cp=P&&P.cap?squadOf(G.club).find(p=>p.k===P.cap):null,f=fmInit().fm;trInit();
  return `<section class="panel sz172-pp"><p class="sub-h"><span>Sezon öncesi · ${P?SZ172_KAMP[P.kamp][0]+' · '+P.sure+' gün':''}</span><span>${H.list.filter(x=>x.done).length}/${H.list.length} maç</span></p>
    <div class="strip"><div><b>${Math.round(m.tcond)}</b><span>Kondisyon %</span></div><div><b>${Math.round(f.fam||50)}</b><span>Uyum %</span></div><div><b>${Math.round(m.conf)}</b><span>Yönetim</span></div><div><b>${cp?esc(ksur(cp.name)):'—'}</b><span>Kaptan</span></div></div>
    ${rows?`<ul class="sz172-fl">${rows}</ul>`:''}<p class="muted">Hedef: ${esc(m.obj.txt)} · odak: ${P?SZ172_ODAK[P.odak][0].toLowerCase():'—'}</p></section>`;}
viewMgrHub=(old=>function(){let h=old.apply(this,arguments);try{if(!isTD())return h;
    if(G.phase==='off'){const n=G.m.sz172n&&G.m.sz172n.y===G.s.year+1?G.m.sz172n:null,can=!G.m.sacked&&!(G.mustMove);
      const pn=can?`<section class="panel sz172-pp"><p class="sub-h"><span>${seasonLabel(G.s.year+1)} sezon öncesi planı</span><span>${n?'Hazır':'Yapılmadı'}</span></p><p class="muted">${n?`${SZ172_KAMP[n.kamp][0]} · ${n.sure} gün · ${n.fr.length} hazırlık maçı (${n.fr.map(x=>SZ172_LVS[x]).join(', ')}) · odak: ${SZ172_ODAK[n.odak][0].toLowerCase()}`:'Kamp yeri ve süresini, hazırlık maçı programını ve ön sezon odağını şimdiden belirleyebilirsin. Kaptan ve sezon hedefi yeni sezonun ilk günü konuşulur.'}</p><button class="btn" data-act="sz172Plan">${n?'Planı düzenle':'Sezon öncesini planla'}</button></section>`:'';
      const h2=h.replace(/<button class="btn" data-act="friendly">[\s\S]*?<\/button>/,pn);h=h2!==h?h2:h+pn;return h;}
    if(G.phase!=='season')return h;const f=sz172HzToday();
    if(f&&!f.done){const me=myClub(),o=CLUBS[f.opp];if(o){const tk=ticketHTML(`Hazırlık maçı · ${sz172Idx(f)}`,`Bugün · ${f.n?'Tarafsız saha':f.h?'İç saha':'Deplasman'} · ${SZ172_LVS[f.lv]} rakip`,f.h||f.n?me:o,f.h||f.n?o:me,'<span class="pill">Hazırlık</span> Lig tablosunu etkilemez');
      const blk=`${tk}<button class="cta big" data-act="mgrPlay"><span>Hazırlık maçını yönet</span><small>2B maç · deneme kadrosu ve taktik</small></button><button class="btn" data-act="mgrSim">Hızlı sonuç</button>`;
      const t0=h.indexOf('<section class="ticket">');let h2=h;if(t0>=0){const t1=h.indexOf('</section>',t0);h2=h.slice(0,t0)+blk+h.slice(t1+10);h2=h2.replace(/<button class="cta big" data-act="mgrAdv">[\s\S]*?<\/button>/,'');}else h2=h.replace(/<button class="cta big" data-act="mgrAdv">[\s\S]*?<\/button>/,blk);h=h2!==h?h2:blk+h;}}
    else{const nx=sz172NextHz();if(nx)h=h.replace(/(<button class="cta big" data-act="mgrAdv">)<span>[^<]*<\/span><small>[^<]*<\/small>/,`$1<span>Hazırlık maçına ilerle</span><small>${fmtDate(dateOf(nx.d))} · ${nx.d-G.s.day} gün · ${esc(CLUBS[nx.opp]?CLUBS[nx.opp].name:'')}</small>`);}
    const pp=sz172TdPanel();if(pp){let j=-1;for(const key of ['data-act="mgrSim">Hızlı sonuç</button>','data-act="mgrAdv"']){const k=h.indexOf(key);if(k>=0){j=h.indexOf('</button>',k)+9;break;}}if(j<9)j=h.indexOf('<div class="stab');h=j>0?h.slice(0,j)+pp+h.slice(j):pp+h;}}catch(e){console.warn('sz172 td hub',e);}return h;})(viewMgrHub);
/* eski yaz arası "hazırlık maçı oyna" düğmesi yeni sistemle değişti; eylem kalırsa plana yönlendir */
friendly=function(){if(isTD()&&G.phase==='off')return sz172TdOpen('off');};
