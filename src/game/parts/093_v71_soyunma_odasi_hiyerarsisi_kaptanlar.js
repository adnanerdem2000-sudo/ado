/* ================= v71: soyunma odası hiyerarşisi — kaptanlar, liderler, gruplar, kıskançlık, mentorluk; uyum performansı etkiler ================= */
const HG_MAP={TUR:'tr',AZE:'tr',BRA:'pt',POR:'pt',ANG:'pt',CPV:'pt',MOZ:'pt',GNB:'pt',ARG:'es',URU:'es',ESP:'es',COL:'es',MEX:'es',CHI:'es',PAR:'es',PER:'es',ECU:'es',VEN:'es',BOL:'es',CRC:'es',HON:'es',
  FRA:'fr',SEN:'fr',CIV:'fr',CMR:'fr',MLI:'fr',ALG:'fr',MAR:'fr',TUN:'fr',BEL:'fr',GUI:'fr',COD:'fr',GAB:'fr',BFA:'fr',HAI:'fr',ENG:'en',SCO:'en',WAL:'en',IRL:'en',NIR:'en',USA:'en',CAN:'en',NGA:'en',GHA:'en',JAM:'en',AUS:'en',RSA:'en',ZAM:'en',ZIM:'en',GAM:'en',SLE:'en',
  GER:'de',AUT:'de',SUI:'de',NED:'nl',DEN:'nd',SWE:'nd',NOR:'nd',FIN:'nd',ISL:'nd',SRB:'bk',CRO:'bk',BIH:'bk',MNE:'bk',SVN:'bk',MKD:'bk',ALB:'bk',KOS:'bk',BUL:'bk',ROU:'bk',GRE:'bk',ITA:'it',POL:'ee',CZE:'ee',SVK:'ee',UKR:'ee',RUS:'ee',HUN:'ee',GEO:'ee',ARM:'ee',JPN:'as',KOR:'as',CHN:'as',IRN:'as',KSA:'as',QAT:'as',UZB:'as'};
const HG_N={tr:'Türk oyuncular',pt:'Portekizce konuşanlar',es:'İspanyolca konuşanlar',fr:'Fransızca konuşanlar',en:'İngilizce konuşanlar',de:'Almanca konuşanlar',nl:'Hollandalılar',nd:'İskandinavlar',bk:'Balkanlılar',it:'İtalyanlar',ee:'Doğu Avrupalılar',as:'Asyalılar',ot:'Diğer yabancılar'};
function hgOf(p){return HG_MAP[p.nat]||'ot';}
function hierGroups(sq,relF){const G2={};for(const p of sq){const g=hgOf(p);(G2[g]=G2[g]||[]).push(p);}const out=[];
  for(const [g,L] of Object.entries(G2)){if(L.length<2)continue;const mood=L.reduce((a,p)=>a+relF(p),0)/L.length,lead=L.slice().sort((a,b)=>capScore(b)-capScore(a))[0];out.push({g,n:HG_N[g]||'Grup',L,mood,lead});}
  return out.sort((a,b)=>b.L.length-a.L.length);}
/* ---------- teknik direktör modu ---------- */
function hierInit(){const m=G.m;if(!m)return null;m.hier=m.hier||{ment:{},ev:[],wk:null};return m.hier;}
function hierJealous(sq,xi){const out=[];const W=p=>pWage(p,G.club);for(const p of sq){if(!xi.includes(p.k))continue;const w=W(p);const r=sq.find(q=>q.k!==p.k&&W(q)>w*1.45&&q.ovr<=p.ovr-2);if(r)out.push([p,r]);}return out.slice(0,5);}
let HIER_C=null;
function hierCalc(){const key=[G.club,G.s&&G.s.day,Object.keys(G.tx||{}).length,JSON.stringify((G.m.hier||{}).ment||{}),(G.m.xi||[]).join()].join('|');if(HIER_C&&HIER_C.key===key)return HIER_C.v;const v=hierCalc0();HIER_C={key,v};return v;}
function hierCalc0(){const m=fmInit(),H=hierInit(),sq=squadOf(G.club),R=squadRoles(G.club),xi=mgrXI();
  const capt=sq.find(p=>R[p.k]==='Kaptan'),vice=sq.filter(p=>R[p.k]==='Takım lideri');
  const lead=sq.filter(p=>p!==capt&&!vice.includes(p)&&(persOf(p)==='Lider'||p.age>=29&&p.ovr>=myClub().str)).sort((a,b)=>capScore(b)-capScore(a)).slice(0,3);
  const groups=hierGroups(sq,relOf),jeal=hierJealous(sq,xi);
  for(const k of Object.keys(H.ment))if(!sq.some(p=>p.k===k)||!sq.some(p=>p.k===H.ment[k]))delete H.ment[k];
  const nm=Object.keys(H.ment).length,bad=groups.filter(g=>g.mood<-15).length;
  const coh=Math.round(clamp(52+groups.reduce((a,g)=>a+g.mood*g.L.length,0)/Math.max(1,sq.length)*0.35-jeal.length*4+(capt?relOf(capt)*0.15:-5)+nm*2-bad*7+lead.reduce((a,p)=>a+relOf(p),0)/Math.max(1,lead.length)*0.08,0,100));
  return {capt,vice,lead,groups,jeal,coh,sq,R};}
harm=(old=>function(){const h=old.apply(this,arguments);try{if(G&&G.mode==='mgr'&&G.m&&!harm._in){harm._in=1;try{const C=hierCalc();return h+(C.coh-50)*0.35;}finally{harm._in=0;}}}catch(e){harm._in=0;}return h;})(harm);
function hrcPanel(){const C=hierCalc(),H=hierInit(),young=C.sq.filter(p=>p.age<=21).sort((a,b)=>b.ovr-a.ovr).slice(0,6),vets=C.sq.filter(p=>p.age>=28).sort((a,b)=>capScore(b)-capScore(a));
  const nm=p=>p?`<b class="clk" data-act="pcard" data-id="${G.club}" data-k="${p.k}">${esc(p.name)}</b>`:'—';const md=v=>moodOf(v)[2];
  return `<section class="panel hrc"><p class="sub-h"><span>Soyunma odası hiyerarşisi</span><span>Uyum ${C.coh}/100</span></p><div class="hier-bar"><i style="width:${C.coh}%" class="${C.coh>=65?'ok':C.coh<40?'bad':''}"></i></div>
   <p class="muted" style="margin:6px 0 10px">Uyum takım gücüne yansır. Kaptanın ve liderlerin seninle iyi anlaşırsa takım krizlerden çabuk çıkar; gruplar arası gerginlik, kıskançlık ve kötü ilişkiler uyumu düşürür, mentorluk artırır.</p>
   <div class="hier-pyr"><div class="hp-l"><span>Kaptan</span>${nm(C.capt)} ${C.capt?md(relOf(C.capt)):''}</div><div class="hp-l"><span>Yardımcı kaptan</span>${C.vice.map(p=>nm(p)+' '+md(relOf(p))).join(', ')||'—'}</div>
    <div class="hp-l"><span>Liderler</span>${C.lead.map(p=>nm(p)+' '+md(relOf(p))).join(', ')||'—'}</div></div>
   <p class="sub-h" style="margin:12px 0 6px"><span>Gruplar</span><span>${C.groups.length}</span></p><div class="hier-g">${C.groups.map(g=>`<div class="hg ${g.mood<-15?'bad':g.mood>20?'ok':''}"><b>${esc(g.n)}</b><small>${g.L.length} oyuncu · lider ${esc(ksur(g.lead.name))} · ${moodOf(g.mood)[1]}</small></div>`).join('')}</div>
   ${C.jeal.length?`<p class="sub-h" style="margin:12px 0 6px"><span>Kıskançlık</span><span>${C.jeal.length}</span></p><ul class="hier-j">${C.jeal.map(([a,b])=>`<li>${nm(a)} (${wgT(pWage(a,G.club))}), kendisinden zayıf ${nm(b)} oyuncusunun daha fazla (${wgT(pWage(b,G.club))}) kazanmasından rahatsız.</li>`).join('')}</ul><p class="muted">Çözüm: sözleşmesini iyileştir ya da birebir görüşmede onu ikna et.</p>`:''}
   <p class="sub-h" style="margin:12px 0 6px"><span>Mentorluk</span><span>${Object.keys(H.ment).length} eşleşme</span></p>
   ${young.length?`<div class="hier-m">${young.map(y=>{const cur=H.ment[y.k],cand=vets.filter(v=>v.pos===y.pos||(v.pos==='OS'&&y.pos!=='KL')).slice(0,3);return `<div class="hm"><div>${nm(y)}<small>${y.age} yaş · ${dpTag(y)} ${R200(y.ovr)}</small></div><div class="seg2">${cand.map(v=>`<button class="chip" data-act="hierMent" data-y="${y.k}" data-v="${v.k}" aria-pressed="${cur===v.k}">${esc(ksur(v.name))}</button>`).join('')||'<span class="muted">Uygun deneyimli oyuncu yok</span>'}</div></div>`;}).join('')}</div><p class="muted">Deneyimli bir oyuncuyu gence mentor yap: genç her hafta biraz daha hızlı gelişir, mentor kendini değerli hisseder.</p>`:'<p class="muted">Kadroda 21 yaş altı oyuncu yok.</p>'}
   ${H.ev.length?`<p class="sub-h" style="margin:12px 0 6px"><span>Son olaylar</span></p><ul class="rdr-ev">${H.ev.slice(0,6).map(e=>`<li><i>${e.ic}</i><span>${esc(e.t)}</span></li>`).join('')}</ul>`:''}</section>`;}
ACTX.hierMent=el=>{HIER_C=null;const H=hierInit(),y=el.dataset.y,v=el.dataset.v;if(H.ment[y]===v)delete H.ment[y];else{H.ment[y]=v;const Y=pByKey(y),V=pByKey(v);if(Y&&V){relAdd(V,4);toast(`${ksur(V.name)}, ${ksur(Y.name)} için mentor oldu`);}}save();render();};
relView=(old=>function(){const h=old.apply(this,arguments);try{const i=h.indexOf('</section>');if(i>0)return h.slice(0,i+10)+hrcPanel()+h.slice(i+10);}catch(e){console.warn(e);}return h;})(relView);
function hierWeekMgr(){const m=G.m,H=hierInit(),C=hierCalc();const ev=(ic,t)=>{H.ev.unshift({ic,t,d:G.s.day});if(H.ev.length>20)H.ev.length=20;};
  for(const [y,v] of Object.entries(H.ment)){m.dev=m.dev||{};m.dev[y]=(m.dev[y]||0)+0.04;const V=pByKey(v);if(V&&Math.random()<0.3)relAdd(V,1);}
  if(C.jeal.length&&Math.random()<0.25){const [a,b]=pick(C.jeal);relAdd(a,-5);ev('😒',`${a.name}, ${b.name} ile maaş farkını soyunma odasında dile getirdi.`);msg('squad',`Kıskançlık: ${a.name}`,`${a.name}, kendisinden daha az katkı veren ${b.name} oyuncusunun daha fazla kazanmasından rahatsız. Takım dinamiği ekranından durumu takip et.`);}
  const bad=C.groups.filter(g=>g.mood<-15);if(bad.length&&Math.random()<0.2){const g=pick(bad);for(const p of g.L)relAdd(p,-2);ev('⚡',`${g.n} grubu ile takımın geri kalanı arasında gerginlik var.`);msg('squad','Soyunma odasında gruplaşma',`${g.n} kendi aralarında kapandı; ${ksur(g.lead.name)} grubun sözcüsü gibi davranıyor. Grubun liderini kazanırsan diğerleri de yumuşar.`);}
  let L=0;try{const R=(G.s.results||[]).slice(-2);for(const rd of R){const x=rd.find(r=>r[0]===G.club||r[1]===G.club);if(x){const us=x[0]===G.club?x[2]:x[3],th=x[0]===G.club?x[3]:x[2];if(us<th)L++;}}}catch(e){}
  if(L>=2&&C.capt&&relOf(C.capt)>10&&Math.random()<0.5){for(const p of C.sq)relAdd(p,2);ev('📣',`Kaptan ${C.capt.name} kötü gidişin ardından takımı topladı.`);msg('squad','Kaptandan konuşma',`${C.capt.name} iki yenilginin ardından soyunma odasında takımı topladı: “Bu formayı taşıyorsak pes etmek yok.” Takımda havası düzeldi.`);}
  else if(L>=2&&C.capt&&relOf(C.capt)<-20&&Math.random()<0.4){for(const p of C.sq)relAdd(p,-2);ev('🗯',`Kaptan ${C.capt.name} basına hocayı eleştiren bir açıklama yaptı.`);msg('squad','Kaptan basına konuştu',`Seninle arası kötü olan kaptan ${C.capt.name}: “Takımda bir şeyler yanlış gidiyor.” Bu açıklama soyunma odasını gerdi.`);}}
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.mode==='mgr'&&G.m&&G.phase==='season'){const H=hierInit(),wk=wkKey();if(H.wk!==wk){H.wk=wk;hierWeekMgr();}}}catch(e){console.warn(e);}return out;})(nextDay);
/* ---------- futbolcu modu ---------- */
function plHier(){const M=tmMates(),c=myClub();if(!M.length||!c)return null;const avg=M.reduce((a,x)=>a+tmRel(x.k),0)/M.length;let yrs=1;try{yrs=clubYears();}catch(e){}
  const s=(yrs-1)*12+(avg-50)*0.6+(OVR()-c.str)*2+G.p.fame*0.2+(G.p.age>=27?5:0);const capt=G.capt===G.club;
  const lv=capt?4:s>=55?3:s>=35?2:s>=15?1:0;const N=['Yeni gelen','Takımın parçası','Etkili oyuncu','Lider','Kaptan'];
  const groups=hierGroups(M.concat([{k:'me',name:G.p.name,nat:'TUR',age:G.p.age,ovr:OVR(),home:null}]),p=>p.k==='me'?20:tmRel(p.k)-50);
  const mentor=G.p.age<=21?M.filter(x=>x.age>=29&&(x.pos===G.p.pos||x.pos==='OS')&&tmRel(x.k)>=50).sort((a,b)=>tmRel(b.k)-tmRel(a.k))[0]:null;
  const mentee=G.p.age>=29?M.filter(x=>x.age<=20&&(x.pos===G.p.pos||x.pos==='OS')).sort((a,b)=>b.ovr-a.ovr)[0]:null;
  const myW=U2E((G.contract&&G.contract.wage)||0),peers=M.filter(x=>Math.abs(x.ovr-OVR())<=4).map(x=>pWage(x,G.club)),pw=peers.length?peers.reduce((a,b)=>a+b,0)/peers.length:myW;
  return {lv,n:N[lv],s:Math.round(s),avg,groups,mentor,mentee,jeal:myW>pw*1.6&&peers.length>=2,capt,coh:Math.round(clamp(avg,0,100))};}
function plHierPanel(){const H=plHier();if(!H)return '';const N=['Yeni gelen','Takımın parçası','Etkili oyuncu','Lider','Kaptan'];
  return `<section class="panel hrc"><p class="sub-h"><span>Soyunma odasındaki yerin</span><span>${esc(H.n)}</span></p><div class="hier-steps">${N.map((n,i)=>`<span class="${i<=H.lv?'on':''}">${n}</span>`).join('')}</div>
   <p class="muted" style="margin:8px 0">Takımda geçirdiğin süre, arkadaşlarınla ilişkilerin, sahadaki etkin ve şöhretin seni hiyerarşide yükseltir. Lider ve kaptanlar hocanın güvenini daha kolay kazanır, takım uyumu da maçlara yansır (takım uyumu ${H.coh}/100).</p>
   <div class="hier-g">${H.groups.map(g=>`<div class="hg ${g.mood<-15?'bad':g.mood>15?'ok':''}"><b>${esc(g.n)}${g.L.some(p=>p.k==='me')?' · senin grubun':''}</b><small>${g.L.length} oyuncu · lider ${esc(ksur(g.lead.name))} · seninle ${g.mood>15?'çok iyi':g.mood>0?'iyi':g.mood>-15?'mesafeli':'gergin'}</small></div>`).join('')}</div>
   ${H.mentor?`<p class="hier-note">🎓 Mentorun: <b>${esc(H.mentor.name)}</b> (${H.mentor.age} yaş). Her hafta tecrübesini aktarıyor; gelişimin biraz hızlı.</p>`:''}
   ${H.mentee?`<p class="hier-note">🎓 Genç ${esc(H.mentee.name)} sana bakıyor. Ona mentorluk ettiğin her hafta takımdaki saygınlığın ve şöhretin artar.</p>`:''}
   ${H.jeal?`<p class="hier-note warn">😒 Maaşın benzer seviyedeki takım arkadaşlarından çok yüksek; bazıları kıskanıyor. Sahada fark yaratmazsan ilişkiler bozulabilir.</p>`:''}</section>`;}
viewMates=(old=>function(){const h=old.apply(this,arguments);try{const p=plHierPanel();if(p){const i=h.indexOf('</h2>');if(i>0)return h.slice(0,i+5)+p+h.slice(i+5);}}catch(e){console.warn(e);}return h;})(viewMates);
tmWeek=(old=>function(){const r=old.apply(this,arguments);try{const H=plHier();if(!H)return r;G.p.hlv=G.p.hlv||0;
    if(H.lv>G.p.hlv&&H.lv<4){msg('event',`Soyunma odasında yükseliş: ${H.n}`,H.lv===3?'Takım arkadaşların artık zor anlarda sana bakıyor. Hoca da bunu fark etti.':H.lv===2?'Sözün soyunma odasında dinleniyor; etkili oyuncular arasındasın.':'Artık takımın bir parçası olarak görülüyorsun.');}G.p.hlv=H.lv;
    if(H.lv>=3)bump('trust',0.4);if(H.mentor){gainAttr((G.plan&&G.plan.focus)||'sut',0.025);if(!G.p.mentMsg||G.p.mentMsg!==H.mentor.k){G.p.mentMsg=H.mentor.k;msg('event','Bir mentorun var',`${H.mentor.name} seni kanatları altına aldı: “Benim yaptığım hataları sen yapma.” Antrenmanlardan sonra birlikte çalışıyorsunuz.`);}}
    if(H.mentee){G.p.fame=clamp(G.p.fame+0.15,0,100);tmAdd(H.mentee.k,2);}
    if(H.jeal&&Math.random()<0.15){const M=tmMates().filter(x=>Math.abs(x.ovr-OVR())<=4);if(M.length){const x=pick(M);tmAdd(x.k,-4);msg('event','Kıskançlık',`${x.name}, maaşının seninkinin yanında çok düşük kaldığını söyleyip soğuk davranmaya başladı.`);}}}catch(e){console.warn(e);}return r;})(tmWeek);
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(isPl()&&!national){const H=plHier();if(H){const f=1+(H.coh-50)/600+(H.lv>=3?0.02:0);cfg.lamUs*=f;}}}catch(e){}return cfg;})(buildMatch);

