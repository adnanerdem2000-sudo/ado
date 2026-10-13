/* ================= v74: hava, zemin ve seyirci etkisi — yağmur, sağanak, kar, sıcak, rüzgâr, sis; ağır zemin; tribün baskısı ================= */
const WX_K={acik:{n:'Açık',ic:'☀️'},bulut:{n:'Bulutlu',ic:'⛅'},yagmur:{n:'Yağmurlu',ic:'🌧'},saganak:{n:'Sağanak yağış',ic:'⛈'},kar:{n:'Kar yağışlı',ic:'🌨'},sicak:{n:'Çok sıcak',ic:'🥵'},ruzgar:{n:'Sert rüzgâr',ic:'💨'},sis:{n:'Sisli',ic:'🌫'}};
const WX_CL={cold:['RUS','NOR','SWE','POL','CZE','UKR','GER','AUT','SUI','DEN','SCO','SRB','CRO'],wet:['ENG','NED','BEL','IRL','WAL','FRA','JPN'],hot:['ESP','ITA','POR','GRE','KSA','MEX','USA'],south:['ARG','BRA','URU','CHI','AUS']};
const WX_MOD={acik:{},bulut:{},yagmur:{pa:-0.03,dr:-0.04,gk:-0.04,g:1.04},saganak:{pa:-0.07,dr:-0.08,sp:-0.04,gk:-0.05,g:0.95},kar:{pa:-0.06,dr:-0.06,sp:-0.08,g:0.9},sicak:{sp:-0.02,st:1.35,g:0.96},ruzgar:{sh:-0.04,pa:-0.02,g:1},sis:{pa:-0.02,g:0.97}};
const WX_BIG={galatasaray:'cehennem',fenerbahce:'cehennem',besiktas:'cehennem',trabzonspor:'cehennem'};
function wxCC(c){try{return CC3[LEAGUES[c.league].cc]||'TUR';}catch(e){return 'TUR';}}
const WX_C={};
function wxOf(homeId,day,awayId){const ck=homeId+'|'+day+'|'+(G.s&&G.s.year)+'|'+awayId;if(WX_C[ck])return WX_C[ck];const v=wxOf0(homeId,day,awayId);if(v)WX_C[ck]=v;return v;}
function wxOf0(homeId,day,awayId){const c=CLUBS[homeId];if(!c||!G.s)return null;const r=srng(homeId+'|'+day+'|'+G.s.year+'wx'),d=dateOf(day);let mo=d.getUTCMonth();const cc=wxCC(c);
  const cl=WX_CL.cold.includes(cc)?'cold':WX_CL.wet.includes(cc)?'wet':WX_CL.hot.includes(cc)?'hot':WX_CL.south.includes(cc)?'south':'tr';if(cl==='south')mo=(mo+6)%12;
  const win=[11,0,1].includes(mo),sum=[5,6,7].includes(mo),spr=[2,3,4].includes(mo);const P=[];const add=(k,w)=>P.push([k,w]);
  add('acik',sum?5:3);add('bulut',3);add('yagmur',cl==='wet'?(win?4:3):win?2.2:spr?1.6:sum?0.5:1.6);add('saganak',sum&&cl!=='hot'?0.7:win?0.6:0.4);
  add('kar',win?(cl==='cold'?2.6:cl==='tr'?0.9:cl==='wet'?0.4:0.05):0);add('sicak',sum?(cl==='hot'?3:cl==='tr'?2:0.8):0);add('ruzgar',0.8);add('sis',win?0.5:0.15);
  let t=P.reduce((a,x)=>a+x[1],0)*r(),k='acik';for(const [kk,w] of P){t-=w;if(t<=0){k=kk;break;}}
  const base={cold:[-2,6,16,8],wet:[5,11,19,12],hot:[11,18,30,20],south:[10,17,27,18],tr:[6,14,28,17]}[cl][win?0:spr?1:sum?2:3];let temp=Math.round(base+(r()-0.5)*8+(k==='sicak'?7:k==='kar'?-6:k==='saganak'?-2:0));if(k==='kar')temp=Math.min(temp,1);
  let cs=null;try{cs=cstate(homeId);}catch(e){}const cap=cs?cs.cap:20000,D=awayId?derbyOf(homeId,awayId):null;let top=false;try{const tb=c.league===G.s.league?table():null;if(tb&&awayId){const i=tb.findIndex(x=>x.id===homeId),j=tb.findIndex(x=>x.id===awayId);top=i<4&&j<4&&i>=0&&j>=0;}}catch(e){}
  const fill=clamp(0.55+(c.str-65)/60+(D?0.25:0)+(top?0.12:0)-(k==='saganak'||k==='kar'?0.08:0)+(r()-0.5)*0.12,0.3,1),att=Math.round(cap*fill/100)*100;
  const atm=Math.round(clamp(fill*70+(WX_BIG[homeId]?20:0)+(D?D.lv*5:0)+Math.min(15,cap/6000),10,100));
  const pitch=k==='saganak'?'Su birikintili':k==='yagmur'?'Ağır':k==='kar'?'Karlı':k==='sicak'?'Kuru ve sert':cs&&cs.cond==='Yenilenmeli'?'Bozuk':'İyi';
  return {k,n:WX_K[k].n,ic:WX_K[k].ic,temp,pitch,att,cap,atm,hell:!!WX_BIG[homeId]&&atm>=80,M:WX_MOD[k]||{},home:homeId};}
function wxTxt(W){return `${W.ic} ${W.n}, ${W.temp}°C · zemin ${W.pitch.toLocaleLowerCase('tr-TR')} · ${W.att.toLocaleString('tr-TR')} seyirci${W.hell?' · cehennem atmosferi':''}`;}
/* 2B maç */
fxStart=(old=>function(o){const r=old.apply(this,arguments);try{const S=FX;if(!S||!o||!o.opp||!G.s)return r;const home=o.neutral?null:(o.usHome?G.club:o.opp.id),away=o.usHome?o.opp.id:G.club;if(!home||!CLUBS[home])return r;
    const W=wxOf(home,G.s.day,away);if(!W)return r;S.wx=W;const M=W.M;for(const T of S.T)for(const p of T.P){for(const k of ['pa','dr','sh','sp','gk'])if(M[k]&&p.a[k]!=null)p.a[k]=clamp(p.a[k]*(1+M[k]),10,99);}
    const Aw=o.usHome?S.O:S.U,hp=(W.atm-50)/100;for(const p of Aw.P)for(const k of ['pa','sh','dr'])if(p.a[k]!=null)p.a[k]=clamp(p.a[k]*(1-Math.max(0,hp)*0.035),10,99);
    S.wxp=[];fxEv(0,`${W.ic} Hava ${W.n.toLocaleLowerCase('tr-TR')}, ${W.temp}°C. Zemin: ${W.pitch.toLocaleLowerCase('tr-TR')}. Tribünlerde ${W.att.toLocaleString('tr-TR')} seyirci${W.hell?'; deplasman takımı için tam bir cehennem':''}.`,'');}catch(e){console.warn(e);}return r;})(fxStart);
fxStM=(old=>function(p){const v=old.apply(this,arguments);try{const W=FX&&FX.wx;if(W&&W.M.st)return v*W.M.st;}catch(e){}return v;})(fxStM);
fxDraw=(old=>function(){old.apply(this,arguments);const S=FX,cv=$('#fxCv');if(!S||!cv||!S.wx)return;const k=S.wx.k;if(!['yagmur','saganak','kar','sis','sicak'].includes(k))return;try{const c=cv.getContext('2d'),dpr=S.dpr,W=S.cw,H=S.ch;c.save();c.setTransform(dpr,0,0,dpr,0,0);
    if(k==='sis'){c.fillStyle='rgba(220,225,235,.18)';c.fillRect(0,0,W,H);c.restore();return;}if(k==='sicak'){c.fillStyle='rgba(255,170,60,.05)';c.fillRect(0,0,W,H);c.restore();return;}
    const n=k==='saganak'?140:k==='yagmur'?80:90,P=S.wxp=S.wxp||[];while(P.length<n)P.push({x:Math.random()*W,y:Math.random()*H,v:0.6+Math.random()*0.8});
    c.fillStyle=k==='kar'?'rgba(255,255,255,.08)':'rgba(20,40,70,.12)';c.fillRect(0,0,W,H);
    if(k==='kar'){c.fillStyle='rgba(255,255,255,.85)';for(const p of P){p.y+=0.8*p.v;p.x+=Math.sin((p.y+p.v*50)/20)*0.4;if(p.y>H){p.y=-4;p.x=Math.random()*W;}c.beginPath();c.arc(p.x,p.y,1.1+p.v,0,6.283);c.fill();}}
    else{c.strokeStyle=k==='saganak'?'rgba(200,220,255,.5)':'rgba(200,220,255,.35)';c.lineWidth=1;c.beginPath();for(const p of P){p.y+=9*p.v;p.x-=2*p.v;if(p.y>H){p.y=-10;p.x=Math.random()*W*1.1;}c.moveTo(p.x,p.y);c.lineTo(p.x+2.5,p.y-11*p.v);}c.stroke();}
    c.restore();}catch(e){}})(fxDraw);
/* hızlı simülasyon */
tacT=(old=>function(opp){const T=old.apply(this,arguments);try{if(!opp||!CLUBS[opp.id]||!G.s||G.mode!=='mgr')return T;const f=ourFixture&&ourFixture();if(!f)return T;const usHome=f[0]===G.club,home=usHome?G.club:opp.id;const W=wxOf(home,nextMatchDay(G.s.day)||G.s.day,usHome?opp.id:G.club);if(!W)return T;
    const g=W.M.g||1,hp=Math.max(0,(W.atm-50)/100)*0.05;return Object.assign({},T,{f:T.f*g*(usHome?1+hp:1-hp),a:T.a*g*(usHome?1-hp:1+hp)});}catch(e){return T;}})(tacT);
/* futbolcu modu */
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(national||!us||!opp||!CLUBS[opp.id]||!CLUBS[us.id])return cfg;const home=usHome?us.id:opp.id;const W=wxOf(home,G.s.day,usHome?opp.id:us.id);if(!W)return cfg;cfg.wx=W;
    const g=W.M.g||1,hp=Math.max(0,(W.atm-50)/100)*0.05;cfg.lamUs*=g*(usHome?1+hp:1-hp);cfg.lamOpp*=g*(usHome?1-hp:1+hp);
    if(W.k==='sicak'&&G.p)cfg.heat=1;}catch(e){}return cfg;})(buildMatch);
applyPlayed=(old=>function(res){try{if(res&&res.cond!=null&&LASTCFG_WX&&LASTCFG_WX.k==='sicak')res.cond=Math.max(0,res.cond-8);}catch(e){}return old.apply(this,arguments);})(applyPlayed);
let LASTCFG_WX=null;
if(typeof simMatch==='function')simMatch=(old=>function(cfg){LASTCFG_WX=cfg&&cfg.wx||null;return old.apply(this,arguments);})(simMatch);
if(typeof startMatch==='function')startMatch=(old=>function(cfg){LASTCFG_WX=cfg&&cfg.wx||null;return old.apply(this,arguments);})(startMatch);
/* ana sayfa: maç günü hava durumu */
function wxNext(){try{const md=nextMatchDay(G.s.day);if(md==null||md-G.s.day>3)return null;const f=ourFixture();if(!f)return null;return {W:wxOf(f[0],md,f[1]),md};}catch(e){return null;}}
viewHub=(old=>function(){const h=old.apply(this,arguments);try{if(G.phase!=='season'||isRef())return h;const X=wxNext();if(!X||!X.W)return h;const W=X.W,ef=W.k==='yagmur'||W.k==='saganak'?'Top zeminde hızlı kayar, ilk dokunuş ve paslar zorlaşır; kaleciler hata yapabilir.':W.k==='kar'?'Oyuncular yavaşlar, top yerde sekmez; uzun toplar daha etkili olabilir.':W.k==='sicak'?'Kondisyon hızlı düşer; rotasyon ve değişiklikler önemli.':W.k==='ruzgar'?'Uzaktan şutlar ve uzun toplar rüzgârdan sapar.':W.k==='sis'?'Görüş kısıtlı; uzun paslar riskli.':'Hava futbol oynamaya çok uygun.';
    const band=`<section class="panel wx-band"><span class="wx-ic">${W.ic}</span><div><b>Maç günü: ${esc(W.n)}, ${W.temp}°C</b><small>Zemin ${esc(W.pitch.toLocaleLowerCase('tr-TR'))} · ${W.att.toLocaleString('tr-TR')} seyirci bekleniyor${W.hell?' · rakip için cehennem atmosferi':W.atm>=80?' · ateşli tribünler':''}</small><small>${esc(ef)}</small></div></section>`;
    const i=h.indexOf('<section class="today">');if(i>=0){const j=h.indexOf('</section>',i);if(j>0)return h.slice(0,j+10)+band+h.slice(j+10);}return h+band;}catch(e){}return h;})(viewHub);
oppAnalysis=(old=>function(){let h=old.apply(this,arguments);try{const X=wxNext();if(h&&X&&X.W)h+=`<p class="muted" style="margin-top:8px">${esc(wxTxt(X.W))}</p>`;}catch(e){}return h;})(oppAnalysis);

