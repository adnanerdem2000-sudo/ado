/* ================= YÖNETİM: tesis, stadyum, talepler ================= */
function stadCap(c,rel){const L=LEAGUES[c.league];if(L.tier>=9)return Math.round((24000+rel*56000)/500)*500;const base=[250,500,1200,1000,2500,4000,7000,12000,26000][L.tier];const v=base*(0.6+rel*1.4);const r=v>=10000?500:v>=1000?100:50;return Math.round(v/r)*r;}
function stadName(c){const L=LEAGUES[c.league],n=c.name.replace(/ (U1[4-9])$/,'');return L.tier<=3?`${n} Sahası`:`${n} Stadyumu`;}
function cstate(id){G.cs=G.cs||{};let s=G.cs[id];if(!s){const c=CLUBS[id],L=LEAGUES[c.league],strs=leagueClubs(c.league).map(x=>x.str),mn=Math.min(...strs),mx=Math.max(...strs),rel=(c.str-mn)/((mx-mn)||1),h=hash(id+'f');
    s=G.cs[id]={fac:clamp(Math.round(1+L.tier*0.38+rel*1.2+(clubVision(c)==='altyapi'?0.6:0)),1,5),cap:stadCap(c,rel),cond:['Yenilenmeli','Orta','İyi','Çok iyi'][clamp(Math.round(rel*1.6+(h%3)/2+(L.tier>=8?0.8:0)),0,3)],board:55,boost:0,pend:null};}
  return s;}
function applyBoosts(){for(const c of Object.values(CLUBS))c.str=c.str0;if(!G||!G.cs)return;for(const [id,s] of Object.entries(G.cs))if(s.boost&&CLUBS[id])CLUBS[id].str=CLUBS[id].str0+s.boost;}
const facMult=()=>(0.8+cstate(G.club).fac*0.1)*(0.92+clubCoachF());
const REQ={
  maas:{n:'Maaş artışı iste',d:'Sözleşmeni iyileştirmelerini iste.',cd:60},
  tesis:{n:'Tesis yatırımı iste',d:'Antrenman tesislerinin geliştirilmesini talep et.',cd:120},
  takviye:{n:'Kadroya takviye iste',d:'Yönetimden güçlü transferler yapmasını iste.',cd:90},
  kiralik:{n:'Kiralık gitmek istiyorum',d:'Süre bulmak için kiralık gönderilmeyi iste.',cd:45},
  liste:{n:'Ayrılmak istiyorum',d:'Transfer listesine girersin: ilgi hızla artar, hoca ve yönetim bozulur.',cd:20},
  kaptan:{n:'Kaptanlık iste',d:'Kol bandını takmak istediğini teknik direktöre ve yönetime söyle.',cd:150}};
const absDay=()=>G.s.year*400+G.s.day;
const reqLeft=k=>{const t=(G.req||{})[k];return t?Math.max(0,t-absDay()):0;};
function boardTick(){const cs=G.cs&&G.cs[G.club];if(cs&&cs.hb!=null&&cs.hb<72)cs.hb=Math.min(72,cs.hb+0.12);if(!cs||!cs.pend||absDay()<cs.pend.at)return;const c=myClub();
  if(cs.pend.k==='tesis'){cs.fac=Math.min(5,cs.fac+1);msg('board','Tesisler yenilendi',`${c.name} antrenman tesisleri ${cs.fac}. seviyeye yükseldi. İdmanlardan daha fazla gelişeceksin.`);}
  else{cs.boost=(cs.boost||0)+cs.pend.n;c.str=c.str0+cs.boost;msg('board','Takviyeler geldi',`${c.name} ${cs.pend.n} yeni oyuncuyla kadrosunu güçlendirdi.`);}
  cs.pend=null;}
function viewBoard(){const c=myClub(),L=curLeague(),cs=cstate(G.club),p=G.p,stars=n=>`${'★'.repeat(n)}<i class="off">${'★'.repeat(5-n)}</i>`;
  return `<h2 class="h">Yönetim</h2>
  <section class="panel"><div class="club-hd">${crestSVG(c,52)}<div><h3>${esc(c.name)}</h3><span>${L.name}</span></div></div>${visLine(c)}
   <div class="meters" style="margin-top:12px">${meter('Yönetim güveni',cs.board,lvl(cs.board))}${meter('Hoca güveni',p.trust,'blue')}</div></section>${hierPanel()}
  <button class="btn" data-act="squad" data-id="${G.club}">Takım kadrosu ve oyuncu kartları</button>
  <section class="panel"><p class="sub-h"><span>Kulüp durumu</span><span>${G.loan?'Kiralık kulübün':''}</span></p>
   <div class="fac"><div><span>Antrenman tesisi</span><b class="stars">${stars(cs.fac)}</b><small>İdman gelişimi ×${dec(0.8+cs.fac*0.1,1)}</small></div>
   <div class="clk" data-act="ccard" data-id="${G.club}"><span>Teknik direktör</span><b>${esc(coachOf(G.club).n)}</b><small>${flagImg(coachOf(G.club).nat,'fl-row')} ${coachOf(G.club).age} yaş · kart ›</small></div><div><span>Stadyum</span><b>${esc(stadName(c))}</b><small>${cs.cap.toLocaleString('tr-TR')} kişilik · zemin ${cs.cond.toLowerCase()}</small></div>
   <div><span>Yıllık bütçe</span><b>${money(clubBudget(c))}</b><small>${cs.boost?`+${cs.boost} takviye`:''}</small></div>
   ${cs.pend?`<div><span>Devam eden proje</span><b>${cs.pend.k==='tesis'?'Tesis yenilemesi':'Transfer çalışması'}</b><small>${Math.max(0,cs.pend.at-absDay())} gün içinde</small></div>`:''}</div></section>
  <section class="panel"><p class="sub-h"><span>Sözleşmen</span><span>${G.tl?'<span class="pill red">Transfer listesinde</span>':''}</span></p>
   <dl class="offer-terms"><div><dt>Rol</dt><dd>${G.contract.role}</dd></div><div><dt>Haftalık</dt><dd>${money(G.contract.wage)}</dd></div><div><dt>Süre</dt><dd>${G.loan?'Kiralık · sezon sonu':G.contract.years+' yıl'}</dd></div><div><dt>Piyasa değeri</dt><dd>${eur(marketValue())}</dd></div></dl>
   ${G.loan?`<p class="muted" style="margin:8px 0 0">Bonservisin ${esc(CLUBS[G.loan.parent].name)} kulübünde. Sezon sonunda geri döneceksin.</p>`:''}</section>
  <section class="panel"><p class="sub-h"><span>Yönetimden talep et</span><span>${G.phase==='season'?'Sezon içinde':'Yaz arası'}</span></p><div class="reqs">${Object.entries(REQ).map(([k,r])=>{const un=k==='liste'&&G.tl,left=reqLeft(k),dis=G.phase!=='season'||(left&&!un)||(k==='kiralik'&&G.loan)||(k==='kaptan'&&(meRole()==='Kaptan'||!!G.loan));
    return `<button class="req" data-act="breq" data-k="${k}" ${dis?'disabled':''}><b>${un?'Listeden çıkmak istiyorum':r.n}</b><small>${left&&!un?left+' gün sonra tekrar':un?'İlgi normale döner, yönetim memnun olur':k==='kaptan'&&meRole()==='Kaptan'?'Kol bandı zaten sende':r.d}</small>${!dis&&!un?(()=>{const [l,cl]=chanceLbl(reqP(k));return `<em class="ch ${cl}">Kabul şansı: ${l}</em>`;})():''}</button>`;}).join('')}</div></section>`;}

