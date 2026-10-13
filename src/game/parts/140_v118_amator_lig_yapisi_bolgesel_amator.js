/* ================= v118: amatör lig yapısı — Bölgesel Amatör Lig 12 grup, İstanbul Süper Amatör Lig 6 grup (2026-27 gerçek takımlar) =================
   Kaynaklar: TFF PGL statüsü 2026-27 (12 grup), egesporlife/oguzhanspor/yerel basın grup listeleri, amatorfutbol.org (İstanbul SAL 2026/27).
   Kadrolar: yalnız 18 yaş ve üstü, kaynağı olan oyuncular (TFF Türkiye Kupası maç kâğıtları, SofaScore); eksikler oyuna özgü oyuncularla tamamlanır.
   Tek sayılı gruplarda her hafta bir takım BAY geçer. Futbolcu kariyeri dışında U14 ve U16 ligleri listelenmez. */
(function(){
  /* --- ligler --- */
  Object.assign(LEAGUES.bal,{name:'Bölgesel Amatör Lig · 4. Grup',short:'BAL',fam:'bal',gn:4});
  Object.assign(LEAGUES.sal,{name:'İstanbul Süper Amatör Lig · 1. Grup',short:'Süper Amatör',fam:'sal',gn:1});
  for(const [lid,g] of Object.entries(AMG.groups)){if(LEAGUES[lid])continue;const base=LEAGUES[g.fam];
    LEAGUES[lid]=Object.assign({},base,{name:(g.fam==='bal'?'Bölgesel Amatör Lig':'İstanbul Süper Amatör Lig')+` · ${g.gn}. Grup`,short:g.fam==='bal'?'BAL':'Süper Amatör',fam:g.fam,gn:g.gn});}
  LEAGUES.samx=Object.assign({},LEAGUES.sal,{name:'İstanbul Amatör Ligi',short:'Amatör',hidden:true,fam:null,gn:null});
  /* --- kulüpler --- */
  const ab=n=>{const w=String(n).replace(/^(İstanbul|Ist\.?|İst\.?)\s+/i,'').split(/\s+/).filter(x=>!/^(SK|FSK|FK|AŞ|A\.Ş\.?|Spor|Kulübü)$/i.test(x));const f=(w[0]||n).replace(/[^0-9A-Za-zÇĞİÖŞÜçğıöşü]/g,'');return (/^\d/.test(f)&&w[1]?f+w[1]:f).slice(0,3).toLocaleUpperCase('tr-TR');};
  for(const [id,c] of Object.entries(AMG.clubs)){if(CLUBS[id])continue;CLUBS[id]=Object.assign({id,str0:c.str},c,{short:ab(c.name)});ORIG_LG[id]=c.league;}
  for(const [id,[nm,lid,city]] of Object.entries(AMG.rename)){const c=CLUBS[id];if(!c)continue;c.name=nm;c.league=lid;ORIG_LG[id]=lid;if(city&&!c.city)c.city=city;}
  for(const [id,l] of Object.entries(AMG.move)){if(CLUBS[id]){CLUBS[id].league=l;ORIG_LG[id]=l;}}
  /* --- dünya listesi: grupları ana ligin hemen arkasına --- */
  /* WORLD betiğin ilerisinde tanımlı: hazır olunca ekle (v64 ile aynı yöntem) */
  const late=()=>{try{const ins=(after,ids)=>{const i=WORLD.indexOf(after);ids.filter(x=>!WORLD.includes(x)).forEach((x,k)=>WORLD.splice(i+1+k,0,x));};
    ins('bal',Object.keys(AMG.groups).filter(l=>AMG.groups[l].fam==='bal'&&l!=='bal').sort((a,b)=>AMG.groups[a].gn-AMG.groups[b].gn));
    ins('sal',Object.keys(AMG.groups).filter(l=>AMG.groups[l].fam==='sal'&&l!=='sal').sort((a,b)=>AMG.groups[a].gn-AMG.groups[b].gn));return true;}catch(e){return false;}};
  if(!late())setTimeout(()=>{late();try{if(G)render();}catch(e){}},0);
  /* --- gerçek (yetişkin) oyuncular + oyuna özgü tamamlama --- */
  for(const [id,rows] of Object.entries(AMG.squads)){const c=CLUBS[id];if(!c)continue;let gen=[];try{gen=genSquad(c);}catch(e){}
    const need={};gen.forEach(r=>need[r[1]]=(need[r[1]]||0)+1);const out=[];
    for(const [nm,pos,age] of rows){let p=pos;if(p==='?'){p=Object.entries(need).sort((a,b)=>b[1]-a[1])[0];p=p&&p[1]>0?p[0]:'OS';}need[p]=(need[p]||0)-1;
      const r=srng(id+nm),d=Math.round(r()*8-5+(age>=24&&age<=30?1:0)-(age>=33?2:0));out.push([nm,p,age,clamp(c.str+d,30,70),'TUR']);}
    for(const g of gen){if((need[g[1]]||0)>0){need[g[1]]--;out.push(g.slice(0,5));}}
    SQ_REAL[id]=out;}
  try{Object.assign(HW_REAL,AMG.hw);}catch(e){}
  try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}
  /* --- yükselme/düşme çiftleri: amatör zincirini özel kurala bırak --- */
  for(let i=LG_PAIRS.length-1;i>=0;i--){const P=LG_PAIRS[i];if((P.u==='l3'&&P.d==='bal')||(P.u==='bal'&&P.d==='sal'))LG_PAIRS.splice(i,1);}
})();
function amFam(f){return WORLD.filter(l=>LEAGUES[l]&&LEAGUES[l].fam===f).sort((a,b)=>LEAGUES[a].gn-LEAGUES[b].gn);}
/* tek sayılı gruplar: fikstürde BAY */
makeFixtures=(old=>function(ids){if(ids&&ids.length%2===1)return old(ids.concat([null])).map(rd=>rd.filter(p=>p[0]!=null&&p[1]!=null));return old.apply(this,arguments);})(makeFixtures);
buildCal=function(lid,y){const L=LEAGUES[lid],n=leagueClubs(lid).length,R=n%2?2*n:2*(n-1),am=L.tier<=4;
  let first=dayOfDate(y,am?8:7,am?5:8);while(wdOf(new Date(seasonStartTs(y)+first*DAY_MS))!==5)first++;
  const last=dayOfDate(y,4,am?16:24),B=BREAK[L.cc||'TR'],b0=B?dayOfDate(y,B[0][0],B[0][1]):1e9,b1=B?dayOfDate(y,B[1][0],B[1][1]):-1;
  const sats=[];for(let d=first;d<=last;d+=7)if(!(d>=b0&&d<=b1))sats.push(d);
  let days=[];
  if(R<=sats.length){for(let i=0;i<R;i++)days.push(sats[Math.round(i*(sats.length-1)/Math.max(1,R-1))]);}
  else{const extra=R-sats.length,mid=new Set();for(let k=0;k<extra;k++){let i=clamp(Math.floor((k+0.5)*sats.length/extra),1,sats.length-1);while(mid.has(sats[i]-4)&&i<sats.length-1)i++;mid.add(sats[i]-4);}days=[...sats,...mid];}
  days=[...new Set(days)].sort((a,b)=>a-b);while(days.length<R)days.push(days[days.length-1]+4);return days.slice(0,R);};
/* kendi takımımız BAY ise o haftanın maçları oynatılır ve sonraki haftaya geçilir */
function byeCheck(){try{if(!G||!G.s||!G.club||!G.s.fixtures)return;let guard=0;
  while(guard++<3){const rd=G.s.fixtures[G.s.week-1];if(!rd||rd.some(f=>f.includes(G.club)))return;if(!rd.length&&G.s.week>G.s.fixtures.length)return;
    if(G.s.results.length>=G.s.week)return;
    const res=rd.map(([h,a])=>{const [x,y]=simScore(h,a);return [h,a,x,y];});G.s.results.push(res);try{creditRound(res,null);}catch(e){}
    const wk=G.s.week;G.s.week++;try{msg('coach',`${wk}. hafta: BAY`,`Grubumuz tek sayıda takımdan oluştuğu için bu hafta maçımız yok. Diğer maçlar oynandı; puan durumu güncellendi.`);}catch(e){}
    /* son hafta BAY ise sezonu bitir (normalde maç sonunda tetiklenir) */
    if(G.s.week>G.s.cal.length&&G.phase==='season'&&!byeCheck.end){byeCheck.end=1;try{if(typeof isStaff==='function'&&isStaff())staffSeasonEnd();else if(G.mode==='mgr')mgrSeasonEnd();else seasonEnd();save();}catch(e){console.warn('bay sezon sonu',e);}finally{byeCheck.end=0;}return;}}}catch(e){console.warn('bay',e);}}
render=(old=>function(){byeCheck();return old.apply(this,arguments);})(render);
nextDay=(old=>function(){byeCheck();const r=old.apply(this,arguments);byeCheck();return r;})(nextDay);
/* amatör yükselme/düşme */
lgPromote=(old=>function(prev){const out=old.apply(this,arguments);try{const mv=Object.assign({},G.lgMove||{}),tb={};const T=lid=>tb[lid]||(tb[lid]=lgFinalTable(lid,prev));
  const po=(ids,notes)=>{let L=ids.slice();while(L.length>1){const nx=[];for(let i=0;i<Math.floor(L.length/2);i++){const [w,s]=koWin(L[2*i],L[2*i+1],false);nx.push(w);notes.push(`${CLUBS[L[2*i]].short}–${CLUBS[L[2*i+1]].short} ${s}`);}if(L.length%2)nx.push(L[L.length-1]);L=nx;}return L[0];};
  /* BAL grup birincilerinin 3. Lig'e çıkışı ve 3. Lig'den düşüş v121'de (3 gruplu 3. Lig ile birlikte) */
  /* 2) Süper Amatör grup birincileri play-off → 1 takım BAL 4. Grup'a (İstanbul), oranın sonuncusu kazananın grubuna */
  const sg=amFam('sal').filter(l=>leagueClubs(l).length>1),sw=sg.map(l=>T(l)[0]&&T(l)[0].id).filter(Boolean);
  if(sw.length&&leagueClubs('bal').length){const notes=[];const w=po(shuffle(sw.slice()),notes),wl=CLUBS[w].league,tb4=T('bal');let dn=tb4[tb4.length-1].id;if(mv[dn]==='l3')dn=tb4[tb4.length-2].id;mv[w]='bal';if(mv[dn]!=='l3')mv[dn]=wl;notes.unshift(`Play-off şampiyonu: ${CLUBS[w].name} (${LEAGUES[wl].name})`);out.push({u:'bal',d:wl,ups:[w],downs:[dn],notes});}
  for(const [k,l] of Object.entries(mv))if(ORIG_LG[k]===l)delete mv[k];G.lgMove=mv;}catch(e){console.warn('amatör yükselme',e);}return out;})(lgPromote);
lgZones=(old=>function(lid){const Z=old.apply(this,arguments);try{const L=LEAGUES[lid];if(L&&L.fam==='sal'&&Z.length)Z[0]='po';if(lid==='bal'&&Z.length)Z[Z.length-1]='dn';}catch(e){}return Z;})(lgZones);
/* lig listeleri: gizli lig yok; futbolcu kariyeri dışında U14/U16 yok; gruplar tek düğme + alt liste */
function lgShow(l){const L=LEAGUES[l];if(!L||L.hidden)return false;if((l==='u14'||l==='u16')&&!(G&&typeof isPl==='function'&&isPl()))return false;return true;}
lvlLeagues=(old=>function(){return old.apply(this,arguments).filter(x=>!x.L.hidden);})(lvlLeagues);

