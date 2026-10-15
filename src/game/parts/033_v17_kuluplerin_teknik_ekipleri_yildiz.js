/* ================= v17: kulüplerin teknik ekipleri (yıldız + potansiyel) ================= */
const STF_R={yrd:{n:'Yardımcı antrenör',a:['Antrenörlük','Taktik','Motivasyon'],e:'Maç gücü ve oyuncu görüşmeleri'},
  huc:{n:'Hücum antrenörü',a:['Hücum çalışması','Teknik','Motivasyon'],e:'Hücum gelişimi ve maç gücü'},
  sav:{n:'Savunma antrenörü',a:['Savunma çalışması','Taktik','Disiplin'],e:'Savunma gelişimi ve maç gücü'},
  kal:{n:'Kaleci antrenörü',a:['Kaleci çalışması','Teknik','Motivasyon'],e:'Kalecilerin gelişimi'},
  kon:{n:'Kondisyoner',a:['Fiziksel çalışma','Spor bilimi','Disiplin'],e:'Sakatlık riski ve form'},
  gen:{n:'Altyapı sorumlusu',a:['Gençlerle çalışma','Teknik','Sabır'],e:'Genç oyuncuların gelişimi'},
  dr:{n:'Takım doktoru',a:['Tıp','Spor bilimi','Teşhis'],e:'Sakatlık süreleri'},
  fzt:{n:'Fizyoterapist',a:['Fizyoterapi','Spor bilimi','Rehabilitasyon'],e:'Sakatlık süreleri ve dönüş'},
  sc:{n:'Baş gözlemci',a:['Yetenek değerlendirme','Potansiyel değerlendirme','Ağ'],e:'Gözlem raporlarının sayısı'},
  ana:{n:'Performans analisti',a:['Maç analizi','Taktik','Veri'],e:'Taktik uyumu ve maç gücü'}};
const STK=Object.keys(STF_R);
const abStars=ab=>clamp(Math.round(ab/10)/2,0.5,5);
function starsHTML(a,p,big){p=Math.max(a,p==null?a:p);return `<span class="stars${big?' big':''}" style="--a:${a};--p:${p}" aria-label="${dec(a,1)} yıldız">★★★★★</span>`;}
const stTxt=v=>String(v).replace('.',',');
function stfQ(cid){const c=CLUBS[cid];if(!c)return 30;const L=LEAGUES[c.league];return clamp((c.str-52)*2.4+(L.tier>=9?6:0)+(L.youth?-10:0),6,92);}
function stfSlot(cid,i,Y){const c=CLUBS[cid],L=LEAGUES[c.league],cc=L.cc||'TR',q=stfQ(cid);let start=2026,g=0;
  for(;;){const r=srng(cid+'$'+i+'~'+g);r();r();const age0=g===0?32+Math.floor(r()*28):29+Math.floor(r()*9),ab0=clamp(q+r()*28-14-(g?5:0),5,97),
      pot=clamp(ab0+(age0<40?6+r()*22:age0<50?r()*10:0),ab0,99),ret=64+Math.floor(r()*6);
    if(Y-start+age0>ret&&g<12){start+=ret-age0+1;g++;continue;}
    const t=Y-start,age=age0+t;let ab=ab0+(pot-ab0)*(1-Math.pow(0.78,t));if(age>60)ab-=(age-60)*1.2;
    let pc=cc;if(r()<0.15){const ks=Object.keys(NAMEP);pc=ks[Math.floor(r()*ks.length)];}const P=NAMEP[pc]||NAMEP2[pc];
    return {k:cid+'$'+i+'~'+g,role:STK[i],name:P.f[Math.floor(r()*P.f.length)]+' '+P.l[Math.floor(r()*P.l.length)],nat:CC3[pc],age,ab:Math.round(clamp(ab,5,99)),pot:Math.round(pot),cy:1+Math.floor(r()*3)};}}
function stfGenList(cid){const Y=G&&G.s?G.s.year:2026;return STK.map((_,i)=>stfSlot(cid,i,Y));}
const STAFF_MAP={yrd:'yrd',scout:'sc',dr:'dr'};
function stfList(cid){if(G&&G.mode==='mgr'&&cid===G.club)return stfMine();const L=stfGenList(cid);
  if(G&&G.mode==='staff'&&cid===G.club&&G.job){const r=STAFF_MAP[G.staff],i=STK.indexOf(r);if(i>=0){const j=G.job,ab=Math.round(clamp(28+j.lvl*13+(j.rep||0)*0.25,10,96));L[i]={k:'me',role:r,name:PN(),nat:(G.p&&G.p.nat)||'TUR',age:G.p.age,ab,pot:Math.max(ab,Math.min(99,ab+30-j.lvl*5)),me:true};}}return L;}
function stfMine(){const m=G.m;if(!m.stf||m.stfClub!==G.club){m.stfClub=G.club;m.stf=stfGenList(G.club).map(s=>Object.assign(s,{w:stWage(s,G.club)}));m.sbud=rnd5(m.stf.reduce((a,s)=>a+s.w,0)*1.2,500);}return m.stf;}
function stWage(s,cid){const c=CLUBS[cid||G.club];return rnd5(260*Math.exp(s.ab/22)*lgWageF(c?c.league:'sl'),100);}
function sF(role){if(!G||!G.club||!CLUBS[G.club])return 0.5;const s=stfList(G.club).find(x=>x&&x.role===role);return s?abStars(s.ab)/5:0.15;}
const stfXi=()=>((sF('yrd')+sF('huc')+sF('sav')+sF('ana'))/4-0.5)*1.6;
const clubCoachF=()=>(sF('huc')+sF('sav')+sF('kon'))/3*0.16;
function coachAb(id){const c=CLUBS[id];if(!c)return 40;if(G&&G.mode==='mgr'&&id===G.club)return clamp(G.m.rep||30,8,99);const co=coachOf(id),tc=co.tr.reduce((a,x)=>a+x[1],0);return Math.round(clamp(stfQ(id)+tc*1.6+(co.real?8:0)+(hash(co.n)%12)-6,8,98));}
function potShown(s,mine){const ps=abStars(s.pot);if(mine||s.me)return [ps,ps];const lo=Math.max(abStars(s.ab),ps-((hash(s.k+'pp')%2)?0.5:0));return [lo,Math.min(5,lo+0.5)];}
function stfAttrs(s){return STF_R[s.role].a.map((n,i)=>[n,clamp(Math.round((s.ab+((r=>(r(),r(),r()))(srng(s.k+'a'+i))*26-13))/5),1,20)]);}
function stfRowsHTML(cid){const L=stfList(cid),mine=G&&G.mode==='mgr'&&cid===G.club;
  return L.map((s,i)=>{const r=STF_R[STK[i]];if(!s)return `<button class="stf-row vac" data-act="stfMkt" data-k="${STK[i]}"><i>${r.n}</i><b>Boş kadro</b><span>İşe alım yap ›</span></button>`;const [lo,hi]=potShown(s,mine);
    return `<button class="stf-row${s.me?' me':''}" data-act="stfCard" data-id="${cid}" data-i="${i}"><i>${r.n}</i><b>${esc(s.name)}${s.me?' (sen)':''}</b><span>${flagImg(s.nat,'fl-row')} ${s.age}</span>${starsHTML(abStars(s.ab),hi)}</button>`;}).join('');}
function stfCard(cid,i){const L=stfList(cid),s=L[i],r=STF_R[STK[i]],c=CLUBS[cid],mine=G&&G.mode==='mgr'&&cid===G.club;if(!s)return;const a=abStars(s.ab),[lo,hi]=potShown(s,mine);
  const col=v=>v>=16?'a5':v>=13?'a4':v>=10?'a3':v>=7?'a2':'a1';
  openModal(`<section class="stf-card"><div class="stc-hd"><div class="stc-face">${faceSVG(lookOf('st:'+s.k,s.nat,s.age,true),{coach:true,c1:c.c1,c2:c.c2,age:s.age})}</div><div><span class="kicker">${esc(r.n)}</span><h3>${esc(s.name)}</h3><small>${flagImg(s.nat,'fl-row')} ${esc(natName(s.nat))} · ${s.age} yaş · ${esc(c.name)}</small></div></div>
   <div class="stc-st"><div><small>Yetenek</small>${starsHTML(a,a,true)}<b>${stTxt(a)} ★</b></div><div><small>Potansiyel</small>${starsHTML(a,hi,true)}<b>${lo===hi?stTxt(hi):stTxt(lo)+'–'+stTxt(hi)} ★</b></div></div>
   <div class="fp-attr stc-at">${stfAttrs(s).map(([n,v])=>`<div><span>${esc(n)}</span><b class="${col(v)}">${v}</b></div>`).join('')}</div>
   <p class="fp-l">Etki alanı <b>${esc(r.e)}</b></p>${mine?`<div class="fp-row" style="margin-top:8px"><div><small>Maaş</small><b>${wgH(s.w)}</b></div><div><small>Sözleşme</small><b>${G.s.year+(s.cy||1)}</b></div><div><small>Yaş durumu</small><b>${s.age<45?'Gelişiyor':s.age<60?'Zirvede':'Düşüşte'}</b></div></div>`:''}</section>
   <div class="offer-btns" style="margin-top:10px">${mine&&!s.me?`<button class="cta sm" data-act="stfMkt" data-k="${STK[i]}">Yerine birini ara</button>`:''}<button class="btn ghost" data-act="closeModal">Kapat</button></div>`);}
/* iş piyasası (TD) */
function appealStars(){const c=myClub(),m=G.m;return clamp((c.str-55)/7+(curLeague().tier>=9?0.5:0)+((m.rep||40)-40)/40+(UP('td_dil')?0.5:0),0.5,5);}
function stfMarket(role){const m=G.m,i=STK.indexOf(role),seed=role+G.s.year+'w'+Math.floor((G.s.week||1)/4)+G.club,out=[],q=stfQ(G.club);
  for(let n=0;n<6;n++){const r=srng(seed+'#'+n);r();r();const age=30+Math.floor(r()*32),ab=Math.round(clamp(q-26+r()*40,5,96)),pot=Math.round(clamp(ab+(age<42?4+r()*22:age<52?r()*8:0),ab,99));
    let pc=curLeague().cc||'TR';if(r()<0.3){const ks=Object.keys(NAMEP);pc=ks[Math.floor(r()*ks.length)];}const P=NAMEP[pc]||NAMEP2[pc];
    const s={k:'mk'+seed+n,role,name:P.f[Math.floor(r()*P.f.length)]+' '+P.l[Math.floor(r()*P.l.length)],nat:CC3[pc],age,ab,pot,cy:2};s.w=rnd5(stWage(s)*1.25,100);s.ok=abStars(ab)<=appealStars()+0.5||r()<0.15;out.push(s);}
  return out.sort((a,b)=>b.ab-a.ab);}
let STM=null;
function stfMktOpen(role){STM=role;const m=G.m,mine=stfMine(),cur=mine.find(s=>s&&s.role===role),bill=mine.reduce((a,s)=>a+(s?s.w:0),0);
  openModal(`<h3>${esc(STF_R[role].n)} ara</h3><p class="muted" style="margin:0">Maaş bütçesi ${amtFmt(bill*52)} / ${amtFmt(m.sbud*52)} yıllık · kulüp cazibesi ${starsHTML(appealStars(),appealStars())}</p>
   ${cur?`<p class="muted" style="margin:0">Mevcut: ${esc(cur.name)} ${starsHTML(abStars(cur.ab),abStars(cur.ab))} · ayrılırsa 12 haftalık tazminat (${eur(cur.w*12)})</p>`:''}
   <div>${stfMarket(role).map((s,n)=>{const [lo,hi]=potShown(s,false);return `<div class="stf-mk"><div><b>${esc(s.name)}</b><small>${flagImg(s.nat,'fl-row')} ${s.age} yaş · ${wgT(s.w)} · POT ${stTxt(lo)}–${stTxt(hi)}★</small></div>${starsHTML(abStars(s.ab),hi)}<button class="${s.ok?'cta':'btn'} sm" data-act="stfHire" data-k="${n}">${s.ok?'İşe al':'Teklif'}</button></div>`;}).join('')}</div>
   <button class="btn ghost" data-act="closeModal">Kapat</button>`);}
function stfHire(n){const m=G.m,role=STM,s=stfMarket(role)[n];if(!s)return;const mine=stfMine(),i=STK.indexOf(role),cur=mine[i],bill=mine.reduce((a,x)=>a+(x?x.w:0),0)-(cur?cur.w:0);
  if(!s.ok)return toast(`${s.name}: “Kulübünüzün projesi şu an bana uygun değil.”`);
  if(bill+s.w>m.sbud){if(!m.sbReq&&m.conf>=55){m.sbReq=G.s.year;m.sbud=rnd5(m.sbud*1.2,500);toast('Yönetim teknik ekip bütçesini %20 artırdı');}else return toast('Teknik ekip maaş bütçesi yetmiyor');if(bill+s.w>m.sbud)return toast('Teknik ekip maaş bütçesi yetmiyor');}
  if(cur){m.budget-=cur.w*12*EUR_TL;msg('board','Teknik ekipte ayrılık',`${cur.name} (${STF_R[role].n}) ile yollar ayrıldı. Tazminat: ${eur(cur.w*12)}.`);}
  mine[i]=Object.assign({},s,{k:'h'+G.s.year+'_'+role+'_'+n});msg('board','Teknik ekibe katılım',`${s.name} ${STF_R[role].n} olarak ekibe katıldı (${stTxt(abStars(s.ab))} yıldız).`);closeModal();toast(`${s.name} işe alındı`);save();render();}
function stfSeason(){const m=G.m;if(!m||!m.stf||m.stfClub!==G.club)return;m.sbReq=0;const out=[];
  m.stf=m.stf.map(s=>{if(!s)return s;s.age++;if(s.age<58)s.ab=Math.round(Math.min(s.pot,s.ab+Math.max(1,(s.pot-s.ab)*0.22)));else if(s.age>60)s.ab=Math.max(5,s.ab-1);
    if(s.age>=67+(hash(s.k)%3)){out.push(s.name);return null;}return s;});
  if(out.length)msg('board','Teknik ekipte emeklilik',`${out.join(', ')} emekli oldu. Boş kalan görevler için işe alım yapmalısın.`);}
function stfView(){const m=G.m,mine=stfMine(),bill=mine.reduce((a,s)=>a+(s?s.w:0),0),c=myClub(),avg=mine.filter(Boolean).reduce((a,s)=>a+abStars(s.ab),0)/Math.max(1,mine.filter(Boolean).length);
  return `<section class="panel"><p class="sub-h"><span>Teknik ekip</span><span>${eur(bill)} / ${eur(m.sbud)} hf</span></p>
   <div class="stf-sum"><div><small>Ekip ortalaması</small>${starsHTML(avg,avg,true)}</div><div><small>Teknik direktör (sen)</small>${starsHTML(abStars(coachAb(G.club)),abStars(coachAb(G.club)),true)}</div></div>
   <p class="muted" style="margin:6px 0 10px">Antrenörler maç gücünü ve gelişimi, kondisyoner ile sağlık ekibi sakatlıkları, gözlemci raporları, analist taktik uyumunu etkiler. Genç ekip üyeleri her sezon potansiyellerine doğru gelişir.</p>
   ${stfRowsHTML(G.club)}</section>`;}

