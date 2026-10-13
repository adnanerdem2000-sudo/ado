/* ================= v121: TFF 2. Lig iki grup (Beyaz/Kırmızı), 3. Lig üç grup — 2026-27 gerçek format · alt liglerde gerçek oyuncu isimleri =================
   Kaynaklar: TFF 2026-27 2. Lig ve 3. Lig statüleri, kura listeleri (haberturk, politikam, beinsports), Altınordu kararı (fanatik, 10.07.2026),
   Yeni Malatyaspor PFDK kararı (beinsports, 23.09.2026); kadrolar SofaScore, besoccer, gzt/yenisafak, TFF maç kâğıtları, mackolik, sporzip.
   2. Lig: grup lideri doğrudan, 2–5. sıralar play-off (2-5, 3-4 çift maç, final tek maç) → grup başına 2 takım 1. Lig'e; 18'li grupta son 3, 17'li grupta son 2 düşer.
   3. Lig: 3 grup, aynı yükselme sistemi (6 takım); her grupta 15–18. sıralar Bölgesel Amatör Lig'e düşer. BAL grup birincileri 3. Lig'e çıkar.
   1. Lig'in son 4 takımı 2. Lig'e düşer. Yeni gelen takımlar şehir/bölge yakınlığına göre gruplara dağıtılır. */
(function(){
  /* --- ligler --- */
  Object.assign(LEAGUES.l2,{name:'TFF 2. Lig · Kırmızı Grup',short:'2. Lig',fam:'l2',gn:2,gname:'Kırmızı Grup'});
  LEAGUES.l2b=Object.assign({},LEAGUES.l2,{name:'TFF 2. Lig · Beyaz Grup',fam:'l2',gn:1,gname:'Beyaz Grup'});
  Object.assign(LEAGUES.l3,{name:'TFF 3. Lig · 1. Grup',short:'3. Lig',fam:'l3',gn:1});
  LEAGUES.l3b=Object.assign({},LEAGUES.l3,{name:'TFF 3. Lig · 2. Grup',fam:'l3',gn:2});
  LEAGUES.l3c=Object.assign({},LEAGUES.l3,{name:'TFF 3. Lig · 3. Grup',fam:'l3',gn:3});
  LEAGUES.trx=Object.assign({},LEAGUES.l3,{name:'Lig dışı (faaliyette değil)',short:'Lig dışı',hidden:true,fam:null,gn:null});
  try{Object.assign(DOMC.TR.lg,{l2b:1,l3b:0,l3c:0});}catch(e){}
  try{LIC_LG.B='3. Lig ve Bölgesel Amatör Lig';}catch(e){}
  /* --- kulüpler --- */
  const ab=n=>{const w=String(n).replace(/^(İstanbul|Ist\.?|İst\.?)\s+/i,'').split(/\s+/).filter(x=>!/^(SK|FSK|FK|AŞ|A\.Ş\.?|Spor|Kulübü|GMG|Merkür|Kızılkaya|Yaz|Sigorta|Eti|Gübre|Ejderoğlu)$/i.test(x));const f=(w[0]||n).replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü]/g,'');return (/^\d/.test(f)&&w[1]?f+w[1]:f).slice(0,3).toLocaleUpperCase('tr-TR');};
  for(const [id,c] of Object.entries(TRG.clubs)){if(CLUBS[id])continue;CLUBS[id]=Object.assign({id,str0:c.str},c,{short:ab(c.short||c.name)});ORIG_LG[id]=c.league;}
  const hide=id=>{if(CLUBS[id]){CLUBS[id].league='trx';ORIG_LG[id]='trx';}};
  hide('altinordu');hide('pg12_turgutreisspor');
  try{CLUB_INFO.altinordu=Object.assign({},CLUB_INFO.altinordu||{},{lig_notu:"Katılım belgelerini süresinde vermediği için TFF kararıyla (10.07.2026) 2026-27'de liglere katılmıyor; 2. Lig Kırmızı Grup 17 takımla oynanıyor."});}catch(e){}
  try{CLUB_INFO.pg12_turgutreisspor=Object.assign({},CLUB_INFO.pg12_turgutreisspor||{},{lig_notu:'Ekim 2026: maddi nedenlerle Bölgesel Amatör Lig\'den çekildi.'});}catch(e){}
  for(const [id,c] of Object.entries(TRG.city))if(CLUBS[id]&&!CLUBS[id].city)CLUBS[id].city=c;
  try{Object.assign(CLUB_INFO,TRG.info);}catch(e){}
  try{Object.assign(HW_REAL,TRG.hw);}catch(e){}
  /* --- profesyonel kadrolar (v110 ile aynı yöntem) --- */
  for(const [id,s] of Object.entries(TRG.sq)){const c=CLUBS[id];if(!c)continue;const rows=s.split(';').map(x=>x.split('|'));const st=c.str;
    SQ_REAL[id]=rows.map(r=>{const d=+r[3]||0;return [r[0],r[1],+r[2]||25,Math.round(clamp(st+d-0.5,35,94)),r[4]||'TUR'];});SQ_MV[id]=rows.map(r=>r[5]?(+r[5])*1000:0);}
  /* --- amatör kulüpler: gerçek isimler, eksik mevkiler oyuna özgü oyuncularla --- */
  for(const [id,rows] of Object.entries(TRG.am)){const c=CLUBS[id];if(!c)continue;let gen=[];try{gen=genSquad(c);}catch(e){}
    const need={};gen.forEach(r=>need[r[1]]=(need[r[1]]||0)+1);const out=[];
    for(const [nm,pos,age0] of rows){let p=pos;if(p==='?'||!need.hasOwnProperty(p)&&p!=='KL'){p=Object.entries(need).sort((a,b)=>b[1]-a[1])[0];p=p&&p[1]>0?p[0]:'OS';}need[p]=(need[p]||0)-1;
      const r=srng(id+nm),age=age0||Math.round(18+r()*12),d=Math.round(r()*8-5+(age>=24&&age<=30?1:0)-(age>=33?2:0));out.push([nm,p,age,clamp(c.str+d,30,70),'TUR']);}
    for(const g of gen){if((need[g[1]]||0)>0){need[g[1]]--;out.push(g.slice(0,5));}}
    if(!out.some(r=>r[1]==='KL')){const g=gen.find(r=>r[1]==='KL');if(g)out.unshift(g.slice(0,5));}
    SQ_REAL[id]=out;}
  try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}
  /* --- teknik direktörler --- */
  const coach=(id,nm)=>{if(!CLUBS[id]||!nm)return;const old=COACH_REAL[id];if(old&&String(nm).toLowerCase().includes(String(old[0]).split(' ').pop().toLowerCase()))return;
    let gen=null;try{const k=COACH_REAL[id];delete COACH_REAL[id];gen=coachRaw(id);if(k)COACH_REAL[id]=k;}catch(e){}
    COACH_REAL[id]=[nm,'TUR',gen?gen.by:1980,gen?gen.f:'4-2-3-1',2026,[],true];};
  for(const [id,r] of Object.entries(TRG.coach))coach(id,r[0]);
  for(const [id,nm] of Object.entries(TRG.amtd))coach(id,nm);
  /* --- yükselme çiftleri: 1. Lig–2. Lig ve 2. Lig–3. Lig özel kurala --- */
  for(let i=LG_PAIRS.length-1;i>=0;i--){const P=LG_PAIRS[i];if((P.u==='l1'&&P.d==='l2')||(P.u==='l2'&&P.d==='l3'))LG_PAIRS.splice(i,1);}
  /* --- dünya listesi --- */
  const late=()=>{try{const ins=(after,ids,before)=>{ids.filter(x=>!WORLD.includes(x)).forEach((x,k)=>{const i=WORLD.indexOf(after);WORLD.splice(before?i:i+1+k,0,x);});};
    ins('l2',['l2b'],true);ins('l3',['l3b','l3c']);return true;}catch(e){return false;}};
  if(!late())setTimeout(()=>{late();try{if(G)render();}catch(e){}},0);
})();
/* ---------- bölge yakınlığı ---------- */
const TR_REG=(()=>{const R={MAR:'İstanbul Edirne Kırklareli Tekirdağ Çanakkale Balıkesir Bursa Bilecik Yalova Kocaeli Sakarya',EGE:'İzmir Manisa Aydın Denizli Muğla Uşak Kütahya Afyonkarahisar',
  AKD:'Antalya Isparta Burdur Mersin Adana Osmaniye Hatay Kahramanmaraş',IC:'Ankara Konya Karaman Aksaray Niğde Nevşehir Kırşehir Kırıkkale Kayseri Yozgat Sivas Eskişehir Çankırı',
  KAR:'Zonguldak Bartın Karabük Kastamonu Sinop Samsun Amasya Tokat Çorum Ordu Giresun Trabzon Rize Artvin Gümüşhane Bayburt Düzce Bolu',
  DOG:'Erzurum Erzincan Kars Ardahan Iğdır Ağrı Van Muş Bitlis Bingöl Elazığ Malatya Tunceli Hakkari',GDA:'Gaziantep Kilis Adıyaman Şanlıurfa Diyarbakır Mardin Batman Siirt Şırnak'};
  const M={};for(const [k,v] of Object.entries(R))for(const c of v.split(' '))M[c]=k;return M;})();
function trCity(id){const c=CLUBS[id];return c?String(c.city||'').trim():'';}
function trReg(id){return TR_REG[trCity(id)]||'';}
/* gelen takımları ailedeki gruplara dağıt: grup büyüklükleri eşitlenir, aynı şehir/bölge tercih edilir */
function trPlace(inc,groups,mv){const fin=id=>mv[id]||CLUBS[id].league;const mem={};groups.forEach(l=>mem[l]=Object.values(CLUBS).filter(c=>fin(c.id)===l&&!inc.includes(c.id)).map(c=>c.id));
  const tot=inc.length+groups.reduce((s,l)=>s+mem[l].length,0),k=groups.length,base=Math.floor(tot/k);let ex=tot%k;
  const tgt={};groups.slice().sort((a,b)=>mem[b].length-mem[a].length).forEach(l=>{tgt[l]=base+(ex>0?1:0);ex--;});
  const aff=(id,l)=>{const ci=trCity(id),rg=trReg(id);let s=0;for(const x of mem[l]){if(ci&&trCity(x)===ci)s+=3;else if(rg&&trReg(x)===rg)s+=1;}return s/Math.max(1,mem[l].length);};
  /* en seçici takımlar önce: en yüksek yakınlık farkı */
  const order=inc.slice().sort((a,b)=>{const fa=Math.max(...groups.map(l=>aff(a,l))),fb=Math.max(...groups.map(l=>aff(b,l)));return fb-fa;});
  for(const id of order){let best=null,bs=-1;for(const l of groups){if(mem[l].length>=tgt[l])continue;const s=aff(id,l);if(s>bs){bs=s;best=l;}}
    if(!best)best=groups.slice().sort((a,b)=>mem[a].length-mem[b].length)[0];mv[id]=best;mem[best].push(id);}}
/* 2–5 play-off: 2-5 ve 3-4 çift maç, kazananlar tek maç final */
function trPO(tab,notes){const id=i=>tab[i]&&tab[i].id;if(!id(4))return id(1);const [a,s1]=koWin(id(1),id(4),true),[b,s2]=koWin(id(2),id(3),true),[w,s3]=koWin(a,b,false);
  notes.push(`${CLUBS[id(1)].short}–${CLUBS[id(4)].short} ${s1}`,`${CLUBS[id(2)].short}–${CLUBS[id(3)].short} ${s2}`,`Final ${CLUBS[a].short}–${CLUBS[b].short} ${s3}`);return w;}
function trDn2(n){return n>=18?3:2;}
lgPromote=(old=>function(prev){const out=old.apply(this,arguments);try{const mv=Object.assign({},G.lgMove||{}),tb={};const T=l=>tb[l]||(tb[l]=lgFinalTable(l,prev));
  /* G.lgMove birikimlidir: bu turda taşınan = kaydı bulunduğu ligden farklı */const movedNow=id=>mv[id]!==undefined&&CLUBS[id]&&mv[id]!==CLUBS[id].league;
  const fam=f=>amFam(f).filter(l=>leagueClubs(l).length>1);const F2=fam('l2'),F3=fam('l3'),FB=fam('bal');
  /* 1. Lig ↔ 2. Lig */
  const t1=leagueClubs('l1').length?T('l1'):[],d1=t1.slice(-4).map(r=>r.id).filter(id=>!movedNow(id));
  const u2=[],d2=[],n2=[];for(const l of F2){const t=T(l);if(t.length<6)continue;u2.push(t[0].id);const notes=[];u2.push(trPO(t,notes));n2.push(`${LEAGUES[l].gname||LEAGUES[l].name}: şampiyon ${CLUBS[t[0].id].name}; play-off ${notes.join(', ')}`);t.slice(-trDn2(t.length)).forEach(r=>d2.push(r.id));}
  /* 3. Lig ↔ 2. Lig ve BAL */
  const u3=[],d3=[],n3=[];for(const l of F3){const t=T(l);if(t.length<8)continue;u3.push(t[0].id);const notes=[];u3.push(trPO(t,notes));n3.push(`${LEAGUES[l].gn}. Grup: şampiyon ${CLUBS[t[0].id].name}; play-off ${notes.join(', ')}`);t.slice(-4).forEach(r=>d3.push(r.id));}
  const ub=[];for(const l of FB){const t=T(l);const w=t[0]&&t[0].id;if(w&&!movedNow(w))ub.push(w);}
  /* önce tüm çıkışlar, sonra gelenler gruplara (grup büyüklükleri dengeli kalsın) */
  u2.forEach(id=>mv[id]='l1');[...d2,...d3].forEach(id=>mv[id]='__dn');[...u3,...ub].forEach(id=>mv[id]='__up');
  if(F2.length)trPlace([...d1,...u3],F2,mv);if(F3.length)trPlace([...d2,...ub],F3,mv);if(FB.length)trPlace(d3,FB,mv);
  if(u2.length||d1.length)out.push({u:'l1',d:F2[0],ups:u2.slice(),downs:d1.slice(),notes:n2});
  if(u3.length||d2.length)out.push({u:F2[0],d:F3[0],ups:u3.slice(),downs:d2.slice(),notes:n3});
  if(ub.length||d3.length)out.push({u:F3[0],d:FB[0],ups:ub.slice(),downs:d3.slice(),notes:[`Bölgesel Amatör Lig grup birincileri 3. Lig'e yükseldi (${ub.length} takım).`]});
  for(const [k,l] of Object.entries(mv)){if(l.startsWith('__'))delete mv[k];else if(ORIG_LG[k]===l)delete mv[k];}G.lgMove=mv;
  /* aynı turda eski kayıtlar: 2. Lig/3. Lig çiftleri artık yok */
}catch(e){console.warn('tr yükselme',e);}return out;})(lgPromote);
/* tablo bölgeleri */
lgZones=(old=>function(lid){const Z=old.apply(this,arguments);try{const L=LEAGUES[lid],n=Z.length;if(!L||!n)return Z;
  if(lid==='l1'){for(let i=Math.max(0,n-4);i<n;i++)Z[i]='dn';}
  else if(L.fam==='l2'||L.fam==='l3'){Z.fill('');Z[0]='up';for(let i=1;i<=4&&i<n;i++)Z[i]='po';const dn=L.fam==='l2'?trDn2(n):4;for(let i=Math.max(5,n-dn);i<n;i++)Z[i]='dn';}
  else if(L.fam==='bal'){Z[0]='up';}}catch(e){}return Z;})(lgZones);
/* kurallar ekranı */
rulesHTML=(old=>function(lid){let h=old.apply(this,arguments);try{const L=LEAGUES[lid];if(!L||L.cc!=='TR')return h;const n=leagueClubs(lid).length,li=[];
  const head=`${n} takım, çift devreli lig: her takım ${2*(n-1)} maç oynar${n%2?'; takım sayısı tek olduğu için her hafta bir takım BAY geçer':''}.`;
  if(lid==='l1'){li.push(head,'Galibiyet 3, beraberlik 1, mağlubiyet 0 puan.','Süper Lig: ilk 2 takım doğrudan, 3–6. sıralar play-off ile 1 takım daha yükselir.','Son 4 takım 2. Lig\'e düşer (gruplara bölgesine göre dağıtılır).');}
  else if(L.fam==='l2'){li.push(head,'2. Lig iki gruptan oluşur: Beyaz Grup ve Kırmızı Grup (2026-27: 18 + 17 takım; Altınordu liglere katılmadı).','Grup lideri doğrudan 1. Lig\'e yükselir.','2–5. sıralar play-off oynar: 2.–5. ve 3.–4. iki maç (ilk maç 4. ve 5.\'nin sahasında), kazananlar tarafsız sahada tek maç final; kazanan 1. Lig\'e çıkar. Toplam 4 takım yükselir.',`Son ${trDn2(n)} takım 3. Lig'e düşer (18 takımlı grupta 3, 17 takımlı grupta 2).`);}
  else if(L.fam==='l3'){li.push(head,'3. Lig 18\'er takımlı 3 bölgesel gruptan oluşur.','Grup lideri doğrudan 2. Lig\'e yükselir; 2–5. sıralar play-off oynar (2.–5., 3.–4. iki maç, final tek maç). Toplam 6 takım yükselir.','Her grupta 15–18. sıralar (4 takım) Bölgesel Amatör Lig\'e düşer.');
    if(lid==='l3c')li.push('Yeni Malatyaspor 23.09.2026 PFDK kararıyla amatöre düşürüldü; grup 17 takımla devam ediyor.');}
  else if(L.fam==='bal'){li.push(head,'Bölgesel Amatör Lig 12 gruptan oluşur (TFF adı: Profesyonelliğe Geçiş Ligi).','Her grubun birincisi 3. Lig\'e yükselir.',lid==='bal'?'4. Grup\'un (İstanbul) sonuncusu İstanbul Süper Amatör Lig\'e düşer; Süper Amatör grup birincilerinin play-off şampiyonu buraya çıkar.':'3. Lig\'den düşen takımlar bölgelerine göre gruplara katılır.');}
  else if(L.fam==='sal'){li.push(head,'İstanbul Süper Amatör Lig 6 gruptan oluşur.','Grup birincileri play-off oynar; şampiyon Bölgesel Amatör Lig 4. Grup\'a yükselir.');}
  else return h;
  li.push('Galibiyet 3, beraberlik 1, mağlubiyet 0 puan. Eşitlikte averaj, sonra atılan gol.');if(lid==='l1')li.splice(1,1);
  try{const cup=lgRule(lid).cup;if(cup)li.push(`Yerel kupa: ${cup} (tek maçlık eleme, beraberlikte penaltılar).`);}catch(e){}
  h=h.replace(/<ul class="rules">[\s\S]*?<\/ul>/,`<ul class="rules">${li.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`);}catch(e){}return h;})(rulesHTML);
/* yıldızlara dokununca sayı (200 üzerinden) açık kalsın */
document.addEventListener('click',e=>{const t=e.target&&e.target.closest?e.target.closest('.fm-st[data-tip],.stars[data-tip]'):null;document.querySelectorAll('.tip-on').forEach(x=>{if(x!==t)x.classList.remove('tip-on');});if(t)t.classList.toggle('tip-on');});

