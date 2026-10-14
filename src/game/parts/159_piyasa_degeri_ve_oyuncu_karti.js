/* ================= PİYASA DEĞERİ ve OYUNCU KARTI ================= */
const MV_BASE=[1500,6000,20000,15000,40000,150000,400000,1200000,4000000,18000000];
function marketValue(){const p=G.p,c=myClub(),L=LEAGUES[c.league],ovr=OVR();
  const rel=Math.exp(clamp((ovr-c.str)*0.07,-1.2,1.6)),age=p.age,af=age<=17?1:age<=21?1.35:age<=27?1:age<=30?0.7:age<=33?0.4:0.18;
  const potAvg=Object.values(p.pot).reduce((a,b)=>a+b,0)/6,pf=age<=21?1+clamp((potAvg-ovr)/80,0,0.6):1;
  const fm=p.form.length?clamp(1+(formAvg()-6.5)*0.12,0.75,1.3):1,fame=1+p.fame/150,inj=p.injury&&p.injury.serious?0.8:1;
  const v=MV_BASE[L.tier]*rel*af*pf*fm*fame*inj,r=v>=1e6?1e5:v>=1e5?25000:v>=1e4?5000:v>=1000?500:100;return Math.max(r,Math.round(v/r)*r);}
const eur=v=>v>=1e6?dec(v/1e6,2).replace(/,?0+$/,'')+' mn €':v>=1e4?Math.round(v/1e3)+' bin €':v>=1e3?dec(v/1e3,1).replace(',0','')+' bin €':Math.round(v)+' €';
const ATTR_S={sut:'ŞUT',pas:'PAS',dri:'DRİ',hiz:'HIZ',fiz:'FİZ',def:'DEF'},POS_S={FW:'FV',KN:'KN',OS:'OS',DF:'DF',KL:'KL'};
function playerCardHTML(){const p=G.p,c=myClub(),L=LEAGUES[c.league],mv=marketValue(),last=(G.mvh||[]).slice(-1)[0],d=last?mv-last.v:0;
  const tier=L.tier>=5?'gold':L.tier>=3?'silver':'bronze';
  const st=Object.keys(ATTR).map(k=>`<div><b>${Math.floor(p.a[k])}</b><span>${ATTR_S[k]}</span></div>`).join('');
  return `<section class="pcard ${tier}"><div class="pc-top"><div class="pc-ovr"><b>${R200(OVR())}</b><span>${p.k?dpTag(p):meTag(p)}</span><em class="pc-pot">POT ${(r=>potTxt(r[0],r[1]))(myPot())}</em>${flagImg('TUR','fl-card')}${crestSVG(c,28)}</div><div class="pc-photo">${avatarSVG(c.c1,c.c2,p.num,p.age)}</div></div>
  ${roleRib(meRole())}<div class="pc-name">${meN()}</div><div class="pc-stats">${st}</div>
  <div class="pc-mv"><span>Piyasa değeri</span><b>${eur(mv)}</b>${last?`<small class="${d>=0?'up':'down'}">${d>=0?'▲':'▼'} ${eur(Math.abs(d))} · ${last.y} sonu</small>`:`<small>${L.youth?'Altyapı oyuncusu, değeri düşük':'İlk değerleme'}</small>`}</div>
  <div class="pc-foot"><span>${p.age} yaş · ${dec(heightAt(p.age),2)} m · ${p.foot} ayak</span><span>${esc(c.short)} · ${G.contract.years} yıl</span></div></section>`;}

