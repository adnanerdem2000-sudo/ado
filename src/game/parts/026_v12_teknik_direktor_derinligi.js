/* ================= v12: teknik direktör derinliği ================= */
const LIC={C:{n:'UEFA C',max:3,next:'B',exp:1,fee:20000,rep:0},B:{n:'UEFA B',max:5,next:'A',exp:2,fee:120000,rep:22},A:{n:'UEFA A',max:7,next:'P',exp:2,fee:600000,rep:40},P:{n:'UEFA Pro',max:9,next:null}};
const LIC_LG={C:'Amatör ve altyapı',B:'3. Lig ve PGL',A:'1. ve 2. Lig, yurt dışında 2-3. lig',P:'Tüm ligler'};
function licOf(){if(!G.lic)G.lic={lv:'C',exp:0};return G.lic;}
const licMax=()=>LIC[licOf().lv].max;
function licTick(){const l=licOf();if(l.course&&G.s&&G.s.year>=l.course.y){const n=LIC[l.lv].next;if(n){l.lv=n;l.exp=0;msg('board',`${LIC[n].n} lisansı alındı!`,`Kursu başarıyla tamamladın. Artık ${LIC_LG[n].toLowerCase()} seviyesinde takım çalıştırabilirsin.`);}l.course=null;}}
function licCan(){const l=licOf(),L=LIC[l.lv];if(!L.next||l.course)return null;const rep=(G.m&&G.m.rep)||(G.job&&G.job.rep)||0;return {ok:l.exp>=L.exp&&rep>=L.rep&&G.p.money>=L.fee,L};}
function licEnroll(){const l=licOf(),L=LIC[l.lv],c=licCan();if(!c)return;if(!c.ok)return toast(l.exp<L.exp?`Önce ${L.exp} sezon deneyim gerekiyor`:G.p.money<L.fee?'Kurs ücreti için paran yetmiyor':'İtibarın henüz yetersiz');
  G.p.money-=L.fee;l.course={y:G.s.year+1};msg('board',`${LIC[L.next].n} kursuna kaydoldun`,`Kurs ücreti ${money(L.fee)}. Sezon boyunca hafta sonları derslere gideceksin; lisans yeni sezon başında verilecek.`);save();render();}
function licPanel(){const l=licOf(),L=LIC[l.lv],c=licCan();
  return `<section class="panel lic-card"><p class="sub-h"><span>Antrenörlük lisansı</span><span>${L.n}</span></p><div class="lic-steps">${['C','B','A','P'].map(k=>`<i class="${k===l.lv?'on':['C','B','A','P'].indexOf(k)<['C','B','A','P'].indexOf(l.lv)?'done':''}">${LIC[k].n.replace('UEFA ','')}</i>`).join('')}</div>
  <p class="muted" style="margin:8px 0">${LIC_LG[l.lv]} seviyesinde çalışabilirsin. ${l.course?`<b>${LIC[L.next].n}</b> kursundasın; lisans ${l.course.y} yazında gelecek.`:L.next?`Sonraki: ${LIC[L.next].n} · ${L.exp} sezon deneyim (sende ${l.exp}), itibar ${L.rep}+, ücret ${money(L.fee)}.`:'En üst lisansa sahipsin.'}</p>
  ${c?`<button class="btn" data-act="licGo" ${c.ok?'':'disabled'}>${LIC[L.next].n} kursuna kaydol</button>`:''}</section>`;}
{const _j=mgrJobOffers;mgrJobOffers=function(rep,n){const mx=licMax(),mt=Math.min(rep>78?9:rep>64?8:rep>50?7:rep>36?6:rep>22?5:rep>12?4:3,mx);
  const cands=Object.values(CLUBS).filter(c=>{const L=LEAGUES[c.league];return !L.youth&&L.tier<=mt&&L.tier>=Math.max(3,mt-2)&&c.id!==(G.m&&G.m.club)&&(G.mode!=='mgr'||c.id!==G.club);}).map(c=>({c,w:Math.exp(-Math.abs(LEAGUES[c.league].tier-mt+0.5))*(LEAGUES[c.league].cc==='TR'?2.5:1)}));
  const out=[];for(let i=0;i<n&&cands.length;i++){const x=wpick(cands.map(q=>[q,q.w]));cands.splice(cands.indexOf(x),1);out.push(x.c.id);}return out;};}
function startManagerCareer(){G.mode='mgr';G.prof='td';G.lic={lv:'C',exp:0};G.s.year=2025;G.phase='off';G.mustMove=true;G.summary=null;
  G.m={club:null,conf:60,tac:'dengeli',xi:null,budget:0,st:{w:0,d:0,l:0,gf:0,ga:0},rep:12,offers:[],sacked:false,tp:{f:'denge',i:'normal'},form:0,inj:{},dev:{},sc:{},scout:null,shortlist:[]};
  G.m.offers=mgrJobOffers(12,3);msg('board','Antrenörlük kariyeri başlıyor',`${PN()}, UEFA C lisansıyla ilk iş tekliflerini bekliyor. Amatör kulüplerden başlayıp lisansını yükselterek büyük takımlara ulaşabilirsin.`);
  save();TAB='hub';render();window.scrollTo(0,0);}

/* ---------- idman planı ---------- */
const TP_F={denge:{n:'Dengeli',d:'Her alana eşit çalışma.'},hucum:{n:'Hücum',d:'Bitiricilik ve pas oyunu: gol beklentisi artar.'},savunma:{n:'Savunma',d:'Yerleşim ve pres: yenilen gol azalır.'},kondisyon:{n:'Kondisyon',d:'Sakatlık riski azalır, form daha yavaş düşer.'},genc:{n:'Gençler',d:'23 yaş altı oyuncular iki kat hızlı gelişir.'}};
const TP_I={hafif:{n:'Hafif',f:0.4,inj:0.03},normal:{n:'Normal',f:0.8,inj:0.07},yogun:{n:'Yoğun',f:1.3,inj:0.15}};
function mgrInit(){const m=G.m;m.tp=m.tp||{f:'denge',i:'normal'};m.form=m.form||0;m.inj=m.inj||{};m.dev=m.dev||{};m.sc=m.sc||{};m.shortlist=m.shortlist||[];return m;}
function mgrWeek(){const m=mgrInit(),tp=m.tp,I=TP_I[tp.i],sq=squadOf(G.club);
  m.form=clamp(m.form*0.7+I.f*(tp.f==='kondisyon'?0.8:1)+rnd(-0.4,0.4),-3,4);
  for(const k in m.inj){m.inj[k]--;if(m.inj[k]<=0){delete m.inj[k];const p=sq.find(x=>x.k===k);if(p)msg('squad','Sahalara dönüş',`${p.name} tedavisini tamamladı ve takımla çalışmaya başladı.`);}}
  if(Math.random()<I.inj*(tp.f==='kondisyon'?0.6:1)*(1.35-sF('kon')*0.7)*(UP('td_gps')?0.8:1)){const fit=sq.filter(p=>!m.inj[p.k]);if(fit.length){const p=pick(fit),w=Math.max(1,Math.round(rint(1,5)*(1.3-sF('dr')*0.3-sF('fzt')*0.3))-(UP('td_kriyo')?1:0));m.inj[p.k]=w;m.xi=null;msg('squad','İdmanda sakatlık',`${p.name} antrenmanda sakatlandı. Tahmini ${w} hafta yok.`);}}
  for(const p of sq){if(p.age>23)continue;const gap=potOf(p)-p.ovr;if(gap<=0)continue;m.dev[p.k]=(m.dev[p.k]||0)+0.07*I.f*(tp.f==='genc'?2:1)*Math.min(1,gap/6)*facMult()*(p.pos==='KL'?0.7+sF('kal')*0.6:0.7+sF('gen')*0.6);}}
function tpPanel(){const m=mgrInit(),inj=Object.entries(m.inj),sq=squadOf(G.club);
  return `<section class="panel"><p class="sub-h"><span>Antrenman planı</span><span>Form ${m.form>=0?'+':''}${dec(m.form)}</span></p>
  <div class="filt" style="margin:0 0 6px">${Object.entries(TP_F).map(([k,v])=>`<button class="chip" data-act="tpF" data-k="${k}" aria-pressed="${m.tp.f===k}">${v.n}</button>`).join('')}</div>
  <div class="filt" style="margin:0 0 6px">${Object.entries(TP_I).map(([k,v])=>`<button class="chip" data-act="tpI" data-k="${k}" aria-pressed="${m.tp.i===k}">${v.n} yoğunluk</button>`).join('')}</div>
  <p class="muted" style="margin:0">${TP_F[m.tp.f].d} Yoğunluk arttıkça form yükselir ama sakatlık riski artar.</p>
  ${inj.length?`<p class="sub-h" style="margin:10px 0 4px"><span>Sakatlar</span></p><ul class="cupres">${inj.map(([k,w])=>{const p=sq.find(x=>x.k===k);return p?`<li><span>${dpTag(p)}</span><b>${esc(p.name)}</b><em class="res-l">${w} hf</em></li>`:'';}).join('')}</ul>`:''}</section>`;}

/* ---------- transfer arama ---------- */
const TRF={pos:'all',age:99,lg:null,max:0};
const trWin=()=>twOpen();
function trSearch(){const lids=TRF.lg?[TRF.lg]:Object.keys(LEAGUES).filter(l=>LEAGUES[l].tier>=Math.max(4,curLeague().tier-1)&&LEAGUES[l].tier<=curLeague().tier+2&&!LEAGUES[l].youth);
  const out=[];for(const lid of lids)for(const c of leagueClubs(lid)){if(c.id===G.club)continue;for(const p of squadOf(c.id)){if(TRF.pos!=='all'&&p.pos!==TRF.pos)continue;if(p.age>TRF.age)continue;out.push(Object.assign({},p,{club:c.id,price:Math.round(pValue(p)*EUR_TL*1.15/1e4)*1e4}));}}
  return out.sort((a,b)=>(b.ovr+potOf(b)*0.4)-(a.ovr+potOf(a)*0.4)).slice(0,25);}
function trHTML(){const m=mgrInit(),res=trSearch(),lgs=[...new Set([G.s.league,'sl','pl','ll','it1','de1','fr1','pt1','nl1','be1','sa1','br1','sc1','gr1','at1','ch1','dk1','l1','en2','es2','it2','de2','fr2'])];
  return `<section class="panel"><p class="sub-h"><span>Transfer arama</span><span>${trWin()?'<span class="pill good">Pencere açık</span>':'<span class="pill">Pencere kapalı</span>'}</span></p>
  <p class="muted" style="margin:0 0 8px">Bütçe: <b>${money(m.budget)}</b>. ${trWin()?'Teklif yapabilirsin · '+twNextTxt()+'.':twClosedTxt()}</p>
  <div class="filt">${[['all','Hepsi'],['KL','Kaleci'],['DF','Defans'],['OS','Orta saha'],['KN','Kanat'],['FW','Forvet']].map(([k,l])=>`<button class="chip" data-act="trf" data-f="pos" data-v="${k}" aria-pressed="${TRF.pos===k}">${l}</button>`).join('')}</div>
  <div class="filt">${[[99,'Her yaş'],[30,'≤30'],[25,'≤25'],[21,'≤21']].map(([k,l])=>`<button class="chip" data-act="trf" data-f="age" data-v="${k}" aria-pressed="${TRF.age===k}">${l}</button>`).join('')}</div>
  <div class="filt"><button class="chip" data-act="trf" data-f="lg" data-v="" aria-pressed="${!TRF.lg}">Yakın ligler</button>${lgs.map(l=>`<button class="chip" data-act="trf" data-f="lg" data-v="${l}" aria-pressed="${TRF.lg===l}">${LEAGUES[l].short}</button>`).join('')}</div>
  <div class="trl">${res.map(p=>{const [lo,hi]=pPot(p),c=CLUBS[p.club];return `<button class="trrow" data-act="pcard" data-id="${p.club}" data-k="${p.k}"><span class="tp">${dpTag(p)}</span><span class="tn"><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${p.age} · ${c?esc(c.short):''}</small></span><span class="to"><b>${R200(p.ovr)}</b><small>POT ${potTxt(lo,hi)}</small></span><span class="tv ${p.price<=m.budget?'':'no'}">${money(p.price)}</span></button>`;}).join('')||'<p class="muted">Bu filtrelerle oyuncu bulunamadı.</p>'}</div></section>`;}

/* ---------- gözlem ağı ---------- */
function scoutHTML(){const m=mgrInit(),s=m.scout,lgs=Object.keys(LEAGUES).filter(l=>!['u14'].includes(l));
  const rep=(m.reports||[]).slice(0,24).map(r=>{const p=pByKey(r.k);if(!p)return '';const club=Object.entries(G.tx||{}).find(([k])=>k===r.k);const cid=club?club[1]:p.home;const [lo,hi]=pPot(Object.assign({},p,{age:p.age}));
    return `<button class="trrow" data-act="pcard" data-id="${cid}" data-k="${r.k}"><span class="tp">${dpTag(p)}</span><span class="tn"><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${p.age} · ${CLUBS[cid]?esc(CLUBS[cid].short):''}</small></span><span class="to"><b>${R200(p.ovr)}</b><small>POT ${potTxt(lo,hi)}</small></span><span class="tv">${esc(r.note)}</span></button>`;}).join('');
  return `<section class="panel"><p class="sub-h"><span>Gözlem ağı</span><span>${s?esc(LEAGUES[s.lid].short):'Görev yok'}</span></p>
  <p class="muted" style="margin:0 0 8px">Gözlemcini bir lige gönder. Her hafta o ligden potansiyeli yüksek oyuncuları raporlar; raporlanan oyuncuların potansiyeli kesinleşir.</p>
  <div class="filt">${lgs.map(l=>`<button class="chip" data-act="scLg" data-k="${l}" aria-pressed="${s&&s.lid===l}">${LEAGUES[l].short}</button>`).join('')}</div>
  ${rep?`<p class="sub-h" style="margin:10px 0 6px"><span>Raporlar</span><span>${(m.reports||[]).length}</span></p><div class="trl">${rep}</div>`:'<p class="muted">Henüz rapor yok.</p>'}</section>`;}
function scoutWeek(){const m=mgrInit(),s=m.scout;if(!s)return;const all=[];for(const c of leagueClubs(s.lid))if(c.id!==G.club)for(const p of squadOf(c.id))if(!m.sc[p.k])all.push(p);
  all.sort((a,b)=>(potOf(b)-b.age*0.6)-(potOf(a)-a.age*0.6));const got=all.slice(0,8).sort(()=>Math.random()-0.5).slice(0,1+Math.round(sF('sc')*2)+(UP('td_scout')?1:0));m.reports=m.reports||[];
  for(const p of got){m.sc[p.k]=true;const pt=potOf(p);m.reports.unshift({k:p.k,note:pt>=p.ovr+8?'Büyük yetenek':pt>=p.ovr+3?'Gelişime açık':'Hazır oyuncu'});}
  if(m.reports.length>40)m.reports.length=40;if(got.length)msg('scout','Gözlem raporu',`${LEAGUES[s.lid].short} raporu: ${got.map(p=>`${p.name} (${p.age}, ${R200(p.ovr)}, potansiyel ${R200(potOf(p))})`).join(', ')}.`);}
let KTAB='kadro';


