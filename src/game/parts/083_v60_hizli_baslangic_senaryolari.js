/* ================= v60: Hızlı başlangıç senaryoları ================= */
const SCN=[
 {id:'kurtarici',m:'td',club:'eyupspor',t:'Kurtarıcı',d:'Takım 9 haftada sadece 2 puan topladı, küme düşme hattında. Yönetim sana son bir şans veriyor.',goal:'Sezonu küme düşme hattının üstünde bitir',dif:3,ic:'🛟',
  setup(){scnBadStart(9);G.m.conf=32;},ok:()=>tablePos()<=table().length-4,prog:()=>`${tablePos()}. sıra · güvenli bölge ${table().length-4}. sıra`},
 {id:'hasret',m:'td',club:'fenerbahce',t:'Şampiyonluk hasreti',d:'Taraftar yıllardır şampiyonluk bekliyor. Bütçe büyük ama sabır yok: yönetim güveni düşük başlıyor.',goal:'Süper Lig şampiyonu ol',dif:3,ic:'🏆',
  setup(){G.m.conf=46;G.m.budget=Math.round(G.m.budget*1.4);},ok:()=>tablePos()===1,prog:()=>`${tablePos()}. sıra`},
 {id:'borc',m:'td',club:'besiktas',t:'Borç batağı',d:'Kulübün kasası boş. Transfer bütçesi sıfır, maaşlar yüksek. Satmadan alamazsın.',goal:'İlk 4’te bitir (Avrupa)',dif:3,ic:'💸',
  setup(){G.m.budget=0;msg('board','Mali tablo kritik','Kulübün borçları nedeniyle transfer bütçen sıfır. Oyuncu satarak bütçe yaratabilirsin. Hedef: ilk 4.');},ok:()=>tablePos()<=4,prog:()=>`${tablePos()}. sıra · hedef ilk 4`},
 {id:'anadolu',m:'td',club:'samsunspor',t:'Anadolu kaplanı',d:'Karadeniz’in iddialı kulübü, büyüklerin arasına girmek istiyor.',goal:'İlk 3’te bitir',dif:2,ic:'🐯',
  setup(){},ok:()=>tablePos()<=3,prog:()=>`${tablePos()}. sıra`},
 {id:'hollywood',m:'td',club:'wrx',t:'Hollywood masalı',d:'Ünlü sahiplerinin desteğiyle yükselen Galler kulübü Premier League kapısında.',goal:'Championship’te ilk 2 (doğrudan çıkış)',dif:2,ic:'🎬',
  setup(){G.m.budget=Math.round(G.m.budget*1.3);},ok:()=>tablePos()<=2,prog:()=>`${tablePos()}. sıra`},
 {id:'devler',m:'td',club:'liv',t:'Devler Ligi',d:'Avrupa’nın en büyük kupası tek hedef. Kadro hazır, gerisi senin elinde.',goal:'Şampiyonlar Ligi’ni kazan',dif:3,ic:'⭐',
  setup(){},ok:()=>{try{return euBoard('ucl').champ===G.club;}catch(e){return false;}},prog:()=>{try{const B=euBoard('ucl');return B&&B.champ?(B.champ===G.club?'Şampiyon!':'Elendin'):'Kupada mücadele sürüyor';}catch(e){return '';}}},
 {id:'sakarya',m:'td',club:'sakaryaspor',t:'Uyuyan dev',d:'Bir zamanlar Süper Lig’de olan köklü kulüp 2. Lig’de. Şehir yeniden ayağa kalkmak istiyor.',goal:'2. Lig şampiyonu ol',dif:2,ic:'🌲',
  setup(){},ok:()=>tablePos()===1,prog:()=>`${tablePos()}. sıra`},
 {id:'ruhr',m:'td',club:'schalke',t:'Ruhr’un kalbi',d:'Schalke Bundesliga’ya döndü. Taraftar Avrupa geceleri istiyor.',goal:'Bundesliga’da ilk 7',dif:2,ic:'⛏',
  setup(){},ok:()=>tablePos()<=7,prog:()=>`${tablePos()}. sıra`},
 {id:'sondans',m:'pl',club:'besiktas',pos:'FW',age:34,ovr:80,pa:0,role:'İlk 11',fame:72,cash:2e6,tot:[420,170,55],t:'Son dans',d:'34 yaşındasın ve bu sezon sözleşmenin son yılı. Kariyerine yakışır bir veda sezonu istiyorsun.',goal:'Sezonda 15 lig golü at',dif:2,ic:'🕺',
  setup(){},ok:()=>G.s.stats.goals>=15,prog:()=>`${G.s.stats.goals}/15 gol`},
 {id:'harika',m:'pl',club:'fcb',pos:'KN',age:17,ovr:73,pa:20,role:'Gelişim',fame:30,cash:2e4,tot:[6,1,1],t:'Harika çocuk',d:'La Masia’dan A takıma yeni çıktın. Herkes yeni bir yıldız bekliyor.',goal:'İlk sezonunda 20 lig maçına çık',dif:2,ic:'🌟',
  setup(){},ok:()=>G.s.stats.apps>=20,prog:()=>`${G.s.stats.apps}/20 maç`},
 {id:'vitrin',m:'pl',club:'rizespor',pos:'OS',age:21,ovr:70,pa:14,role:'İlk 11',fame:12,cash:4e4,tot:[48,6,9],t:'Vitrine çık',d:'Avrupa kulüpleri seni izliyor. İyi bir sezon büyük bir transfer getirebilir.',goal:'Piyasa değerini 12 mn €’ya çıkar',dif:2,ic:'📈',
  setup(){},ok:()=>marketValue()>=12e6,prog:()=>`${eur(marketValue())} / 12 mn €`},
 {id:'yildiz',m:'pl',club:'galatasaray',pos:'FW',age:25,ovr:84,pa:6,role:'Yıldız',fame:60,cash:1.5e6,tot:[210,92,30],t:'Altın Top yolu',d:'Süper Lig’in en büyük yıldızısın. Dünyanın seni görmesi için olağanüstü bir sezon lazım.',goal:'Ballon d’Or sıralamasında ilk 10’a gir',dif:3,ic:'🥇',
  setup(){},ok:()=>{const R=G.bdo&&G.bdo[seasonLabel(G.s.year)];return !!R&&R.top.findIndex(x=>x.me)>=0&&R.top.findIndex(x=>x.me)<10;},prog:()=>`${G.s.stats.goals} gol · ${G.s.stats.assists} asist`},
 {id:'donus',m:'pl',club:'trabzonspor',pos:'DF',age:28,ovr:77,pa:3,role:'İlk 11',fame:35,cash:3e5,tot:[230,12,18],t:'Sakatlıktan dönüş',d:'Ağır bir dizi sakatlığından dönüyorsun. 6 hafta daha tedavi var, sonra formanı geri almalısın.',goal:'Sezonda 18 lig maçına çık',dif:2,ic:'🩹',
  setup(){G.p.injury={name:'Ön çapraz bağ (rehabilitasyon)',days:42,total:200,serious:true};},ok:()=>G.s.stats.apps>=18,prog:()=>`${G.s.stats.apps}/18 maç`},
 {id:'premier',m:'pl',club:'new',pos:'KN',age:23,ovr:79,pa:8,role:'İlk 11',fame:40,cash:6e5,tot:[120,22,25],t:'Premier League’de bir Türk',d:'Newcastle’a büyük bir bonservisle geldin. İngiliz basını seni mercek altına aldı.',goal:'8 gol ve 8 asist',dif:3,ic:'🇬🇧',
  setup(){},ok:()=>G.s.stats.goals>=8&&G.s.stats.assists>=8,prog:()=>`${G.s.stats.goals} gol · ${G.s.stats.assists} asist`}];
const scnById=id=>SCN.find(s=>s.id===id);
function scnWins(){try{return JSON.parse(localStorage.getItem('scnWins')||'{}');}catch(e){return {};}}
function scnBadStart(n){const S=G.s,m=G.m;for(let w=S.results.length;w<n&&w<S.fixtures.length;w++){let pts=0;const rd=S.fixtures[w].map(([h,a])=>{let [x,y]=simScore(h,a);if(h===G.club||a===G.club){const us=h===G.club;let gu=us?x:y,go=us?y:x;if(w===2||w===6){go=gu;}else if(gu>=go){go=gu+1;}if(us){x=gu;y=go;}else{x=go;y=gu;}m.st.gf+=gu;m.st.ga+=go;if(gu>go)m.st.w++;else if(gu===go)m.st.d++;else m.st.l++;}return [h,a,x,y];});S.results.push(rd);creditRound(rd,null);S.week++;}
  S.day=Math.max(S.day,(S.cal[S.week-1]||S.day+7)-4);}
function scnStart(id){const sc=scnById(id);if(!sc)return;G=null;
  if(sc.m==='td'){W.prof='td';W.age=W.age||38;wizGo();G.lic={lv:'P',exp:6};G.m.rep=Math.max(G.m.rep||0,sc.dif>=3?62:45);mgrSign(sc.club);}
  else{newGame(sc.pos,'Sağ',sc.club);G.mode='player';const p=G.p,w=POS[sc.pos].w,sw=Object.values(w).reduce((a,b)=>a+b,0)||1;p.age=sc.age;
    for(const k in ATTR){const imp=(w[k]||0)/sw;p.a[k]=clamp(Math.round(sc.ovr+(imp>0.22?3:imp<0.08?-6:0)),30,96);p.pot[k]=clamp(p.a[k]+sc.pa,p.a[k],99);}
    let g=0;while(OVR()<sc.ovr&&g++<40)for(const k in ATTR)p.a[k]=Math.min(99,p.a[k]+0.5);g=0;while(OVR()>sc.ovr&&g++<40)for(const k in ATTR)p.a[k]=Math.max(30,p.a[k]-0.5);
    const L=LEAGUES[CLUBS[sc.club].league];G.contract={years:sc.id==='sondans'?1:3,wage:Math.round(L.wage*({Yıldız:3,'İlk 11':1.6,'Gelişim':0.6}[sc.role]||1)/50)*50,role:sc.role};p.trust=ROLE_TRUST[sc.role]||55;p.fame=sc.fame;p.money=E2U(sc.cash);p.morale=72;
    G.totals={apps:sc.tot[0],goals:sc.tot[1],assists:sc.tot[2]};G.inbox=[];G.tutSeen=true;G.phase='season';try{applyBoosts();}catch(e){}}
  G.scn={id,y:G.s.year,res:null};try{sc.setup();}catch(e){console.warn(e);}
  msg('board',`Senaryo: ${sc.t}`,`${sc.d} Hedef: ${sc.goal}. Sezon sonunda değerlendirileceksin.`);W.step='list';save();TAB='hub';render();window.scrollTo(0,0);toast(`Senaryo başladı: ${sc.t}`);}
ACTX.scnGo=el=>scnStart(el.dataset.k);
/* başlangıç ekranı */
showStart=(old=>function(){if(W.step!=='scn'){old.apply(this,arguments);try{if(W.step==='list'){const b=document.querySelector('#start [data-act=startGame]');if(b&&!document.querySelector('#start [data-k=scn]'))b.insertAdjacentHTML('beforebegin',`<button class="btn scn-btn" data-act="wz" data-k="scn"><span>🎬 Hızlı başlangıç senaryoları</span><small>${SCN.length} hazır hikâye: kurtarıcı, şampiyonluk, son dans, Altın Top yolu…</small></button>`);}}catch(e){}return;}
  $('#app').hidden=true;$('#tabs').hidden=true;const st=$('#start');st.hidden=false;const win=scnWins();
  const card=s=>{const c=CLUBS[s.club];return `<button class="scn-card" data-act="scnGo" data-k="${s.id}"><div class="scn-top"><span class="scn-ic">${s.ic}</span>${c?crestSVG(c,34):''}<div><b>${esc(s.t)}</b><small>${c?esc(c.name):''} · ${s.m==='td'?'Teknik direktör':`Futbolcu · ${s.age} yaş`}</small></div>${win[s.id]?'<em class="scn-ok">✓</em>':''}</div><p>${esc(s.d)}</p><div class="scn-goal">🎯 ${esc(s.goal)}<span>${'★'.repeat(s.dif)}${'☆'.repeat(3-s.dif)}</span></div></button>`;};
  st.innerHTML=`<button class="btn ghost sm wz-back" data-act="wz" data-k="list">‹ Geri</button><h2 class="h">Hızlı başlangıç senaryoları</h2><p class="muted">Hazır bir hikâyeyle hemen başla. Sezon sonunda hedefine ulaşıp ulaşmadığın değerlendirilir; başardığın senaryolar ✓ ile işaretlenir.</p>
   <p class="field-label" style="margin:12px 0 8px">Teknik direktör</p><div class="scn-grid">${SCN.filter(s=>s.m==='td').map(card).join('')}</div>
   <p class="field-label" style="margin:16px 0 8px">Futbolcu</p><div class="scn-grid">${SCN.filter(s=>s.m==='pl').map(card).join('')}</div>`;window.scrollTo(0,0);})(showStart);
/* ana sayfada hedef bandı */
viewHub=(old=>function(){const h=old.apply(this,arguments);try{const C=G.scn,sc=C&&scnById(C.id);if(sc&&C.y===G.s.year&&!C.res&&G.phase==='season'){let pr='';try{pr=sc.prog();}catch(e){}
      return `<section class="panel scn-band"><span class="scn-ic">${sc.ic}</span><div><b>Senaryo · ${esc(sc.t)}</b><small>🎯 ${esc(sc.goal)}</small></div><em>${esc(pr)}</em></section>`+h;}}catch(e){}return h;})(viewHub);
/* sezon sonu değerlendirme */
seasonAwards=(old=>function(){const r=old.apply(this,arguments);try{const C=G.scn,sc=C&&scnById(C.id);if(sc&&!C.res&&C.y===G.s.year){const ok=!!sc.ok();C.res=ok?'ok':'fail';
      if(ok){const w=scnWins();w[sc.id]=1;try{localStorage.setItem('scnWins',JSON.stringify(w));}catch(e){}msg('event',`Senaryo başarıldı: ${sc.t}!`,`Hedefe ulaştın: ${sc.goal}. Kariyerine dilediğin gibi devam edebilirsin.`);if(isPl())G.p.fame=clamp(G.p.fame+4,0,100);else if(G.m)G.m.rep=clamp((G.m.rep||40)+5,0,100);}
      else msg('event',`Senaryo başarısız: ${sc.t}`,`Hedef tutmadı (${sc.goal}). Yine de kariyerine devam edebilirsin ya da başlangıç ekranından senaryoyu yeniden dene.`);}}catch(e){console.warn(e);}return r;})(seasonAwards);

