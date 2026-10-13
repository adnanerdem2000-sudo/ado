/* ================= Milli takım: Uluslar Ligi, elemeler, turnuvalar ================= */
const NAT_X=[['Avusturya','AUT','#ed2939','#ffffff',80],['İsviçre','SUI','#d52b1e','#ffffff',80],['Danimarka','DEN','#c8102e','#ffffff',81],['Polonya','POL','#ffffff','#dc143c',78],['Sırbistan','SRB','#c6363c','#ffffff',78],['İskoçya','SCO','#0065bd','#ffffff',76],
 ['Çekya','CZE','#11457e','#ffffff',77],['Macaristan','HUN','#ce2939','#ffffff',77],['Norveç','NOR','#ba0c2f','#ffffff',80],['İsveç','SWE','#006aa7','#fecc00',78],['Romanya','ROU','#fcd116','#002b7f',75],['Slovakya','SVK','#0b4ea2','#ffffff',75],['Slovenya','SVN','#ffffff','#005da4',74],['Galler','WAL','#c8102e','#ffffff',74],['İrlanda','IRL','#169b62','#ffffff',73],['Arnavutluk','ALB','#e41e20','#111111',72]];
const NAT_W=[['Brezilya','BRA','#ffdf00','#009c3b',89],['Arjantin','ARG','#75aadb','#ffffff',90],['Uruguay','URU','#5cbfeb','#ffffff',83],['Kolombiya','COL','#fcd116','#003893',83],['ABD','USA','#ffffff','#1d3f8f',80],['Meksika','MEX','#006847','#ffffff',79],['Japonya','JPN','#1d3f8f','#ffffff',81],['Güney Kore','KOR','#c60c30','#ffffff',78],
 ['Fas','MAR','#c1272d','#006233',83],['Senegal','SEN','#00853f','#fdef42',80],['Nijerya','NGA','#008751','#ffffff',77],['Mısır','EGY','#ce1126','#ffffff',76],['Ekvador','ECU','#ffd100','#034ea2',78],['Avustralya','AUS','#ffcd00','#00843d',75],['Kanada','CAN','#d52b1e','#ffffff',77],['İran','IRN','#239f40','#ffffff',75],['Suudi Arabistan','KSA','#006c35','#ffffff',72],['Fildişi Sahili','CIV','#f77f00','#ffffff',79]];
const natObj=n=>({id:'n'+n[1],name:n[0],short:n[1],c1:n[2],c2:n[3],str:n[4],shape:1,pat:(hash(n[1])>>2)%5,nat:n[1]});
function tourOf(Y){if(Y>=2028&&Y%4===0)return {k:'EURO',name:`Avrupa Şampiyonası ${Y}`,tr:'Avrupa Şampiyonası',ko:['Son 16','Çeyrek Final','Yarı Final','Final'],pool:'eu',host:Y===2032};
  if(Y>=2030&&Y%4===2)return {k:'WC',name:`Dünya Kupası ${Y}`,tr:'Dünya Kupası',ko:['Son 32','Son 16','Çeyrek Final','Yarı Final','Final'],pool:'w'};
  if(Y%2===1)return {k:'NLF',name:`Uluslar Ligi Finalleri ${Y}`,tr:'Uluslar Ligi',ko:['Yarı Final','Final'],pool:'eu',nl:true};return null;}
function natCompOf(day,lv){if(lv!=='A Milli Takım')return 'Hazırlık';const d=dateOf(day),y=d.getUTCFullYear(),m=d.getUTCMonth();
  if(y%2===0&&m>=8&&m<=10)return 'Uluslar Ligi';const nx=tourOf(y+1);if(nx&&!nx.nl)return nx.k==='EURO'?'Avrupa Şampiyonası Elemeleri':'Dünya Kupası Elemeleri';return 'Hazırlık';}
function natKey(comp,day){const y=dateOf(day).getUTCFullYear();return comp==='Uluslar Ligi'?'NL'+(y+1):comp.startsWith('Avrupa')?'EURO'+(y+1):comp.startsWith('Dünya')?'WC'+(y+1):null;}
function natRecord(comp,day,us,them){const key=natKey(comp,day);if(!key)return;G.natq=G.natq||{};const r=G.natq[key]=G.natq[key]||{w:0,d:0,l:0};if(us>them)r.w++;else if(us===them)r.d++;else r.l++;}
function natPanel(){const Y=G.s?G.s.year+1:2027,T=tourOf(Y),t=G.tour;let h='';
  if(t){h+=`<section class="panel"><p class="sub-h"><span>${esc(t.name)}</span><span>${t.won?'Şampiyon':t.alive?'Devam ediyor':'Bitti'}</span></p>${t.res.length?`<ul class="cupres">${t.res.map(x=>`<li><span>${esc(x.n)}</span><b>${esc(x.opp)}</b><em class="${x.us>x.them?'res-w':x.us<x.them?'res-l':'res-d'}">${x.us}-${x.them}${x.pen?` (p. ${x.pen})`:''}</em></li>`).join('')}</ul>`:'<p class="muted">Turnuva henüz başlamadı.</p>'}</section>`;}
  else if(T){const key=T.k+Y,r=(G.natq||{})[T.nl?'NL'+Y:key];h+=`<section class="panel"><p class="sub-h"><span>Milli takım · ${Y} yazı</span><span>${esc(T.name)}</span></p><p class="muted">${T.host?'Türkiye ev sahibi olarak turnuvaya doğrudan katılıyor.':r?`Türkiye’nin ${T.nl?'Uluslar Ligi':'eleme'} karnesi: ${r.w}G ${r.d}B ${r.l}M.`:'Eleme maçları milli takım aralarında oynanıyor.'} A Milli Takım’a çağrılırsan turnuvada forma giyebilirsin.</p></section>`;}
  return h;}
function tourSetup(){if(!isPl()||G.phase==='retired')return;const Y=G.s.year+1,T=tourOf(Y);G.tour=null;if(!T)return;
  const r=(G.natq||{})[T.nl?'NL'+Y:T.k+Y]||{w:0,d:0,l:0};let pq=T.host?1:T.nl?0.22+r.w*0.14-r.l*0.06:0.62+r.w*0.09-r.l*0.08;pq=clamp(pq,0.08,0.97);
  const qual=Math.random()<pq,called=G.p.age>=17&&(OVR()>=NAT_LEVELS[0].req-2||(G.p.caps>=3&&OVR()>=70))&&!(G.p.injury&&G.p.injury.days>30);
  if(!qual){msg('nat',`${T.name}: Türkiye yok`,T.nl?'Türkiye Uluslar Ligi grubunu lider bitiremedi, finallere katılamıyor.':`Türkiye ${T.name} biletini alamadı. Elemelerdeki karne: ${r.w}G ${r.d}B ${r.l}M.`);tourNews(T,Y,false);return;}
  if(!called){msg('nat',`${T.name} kadrosu açıklandı`,`Türkiye ${T.name}’na katılıyor ama ${meN()} kadroda yer almadı. Daha iyi bir sezonla milli formaya göz dikebilirsin.`);tourNews(T,Y,true);return;}
  const pool=(T.pool==='w'?NATIONS.concat(NAT_X,NAT_W):NATIONS.concat(NAT_X)).filter(n=>n[1]!=='TUR'),srt=pool.slice().sort((a,b)=>b[4]-a[4]);
  const grp=T.nl?[]:[srt[Math.floor(Math.random()*6)],srt[8+Math.floor(Math.random()*8)],srt[srt.length-1-Math.floor(Math.random()*6)]].map(natObj);
  G.tour={k:T.k,name:T.name,tr:T.tr,y:Y,ko:T.ko,nl:!!T.nl,pool:pool.map(n=>n[1]),grp,gi:0,gp:{tr:{p:0,gf:0,ga:0}},si:0,res:[],alive:true,done:false,g:0};
  grp.forEach(o=>G.tour.gp[o.short]={p:0,gf:0,ga:0});G.tour.opp=T.nl?natObj(srt[Math.floor(Math.random()*4)]):grp[0];
  msg('nat',`${T.name} kadrosundasın!`,`Teknik direktör ${meNs('acc')} ${T.name} kadrosuna aldı. ${T.nl?'Yarı finalde rakip '+G.tour.opp.name+'.':'Grup rakipleri: '+grp.map(o=>o.name).join(', ')+'.'}`);}
function tourStage(t){return t.nl?t.ko[t.si]:t.gi<3?`Grup · ${t.gi+1}. maç`:t.ko[t.si];}
function tourPlay(sim){const t=G.tour;if(!t||!t.alive)return;const tr=TRnat({off:0}),opp=t.opp,r=OVR()>=tr.str-6?'start':'sub';const cfg=buildMatch(tr,opp,true,r,`${t.name} · ${tourStage(t)}`,true);
  const m=(cfg.lamUs+cfg.lamOpp)/2;cfg.lamUs=m+(cfg.lamUs-m)*0.8;cfg.lamOpp=m+(cfg.lamOpp-m)*0.8;cfg.onEnd=res=>tourFinish(res,cfg);(sim?simMatch:startMatch)(cfg);}
function tourFinish(res,cfg){const t=G.tour,p=G.p,notes=[],win=res.us>res.opp,draw=res.us===res.opp,stage=tourStage(t),opp=t.opp;
  if(res.played){p.caps++;p.natGoals+=res.goals;t.g+=res.goals||0;applyPlayed(res,cfg.role,win,draw,notes,9,false);notes.unshift(`A Milli formasıyla ${p.caps}. maçına çıktın.`);bump('fame',2);}
  const rec={n:stage,opp:opp.name,us:res.us,them:res.opp};
  if(!t.nl&&t.gi<3){const g=t.gp;g.tr.p+=win?3:draw?1:0;g.tr.gf+=res.us;g.tr.ga+=res.opp;const o=g[opp.short];o.p+=res.opp>res.us?3:draw?1:0;o.gf+=res.opp;o.ga+=res.us;
    const others=t.grp.filter(x=>x!==opp);if(others.length===2){const [a,b]=others,[x,y]=simPair(a,b,true);g[a.short].p+=x>y?3:x===y?1:0;g[b.short].p+=y>x?3:x===y?1:0;g[a.short].gf+=x;g[a.short].ga+=y;g[b.short].gf+=y;g[b.short].ga+=x;}
    t.gi++;if(t.gi<3){t.opp=t.grp[t.gi];}
    else{const tb=Object.entries(g).map(([k,v])=>({k,...v})).sort((a,b)=>b.p-a.p||(b.gf-b.ga)-(a.gf-a.ga)||b.gf-a.gf),pos=tb.findIndex(x=>x.k==='tr')+1,me=g.tr;
      const adv=pos<=2||(pos===3&&me.p>=4);t.gpos=pos;if(adv){notes.push(`Grubu ${pos}. sırada bitirdiniz, ${t.ko[0]} turundasınız!`);t.opp=tourDraw(t);}else{t.alive=false;notes.push(`Grubu ${pos}. sırada bitirdiniz. Turnuvaya veda.`);}}}
  else{let adv=win;if(draw){const [x,y]=pens(82,opp.str);adv=x>y;rec.pen=`${x}-${y}`;notes.push(`Uzatmalarda eşitlik bozulmadı. Seri penaltılar: ${x}-${y}.`);}
    if(stage==='Final'){t.alive=false;if(adv){t.won=true;G.trophies.push({year:String(t.y),name:t.name,club:G.club,nat:true});bump('fame',t.k==='WC'?30:t.k==='EURO'?22:10);notes.push(`TÜRKİYE ŞAMPİYON! ${t.name} kupası ay-yıldızlıların!`);}else notes.push('Finalde kaybettiniz. Yine de tarihi bir turnuva.');}
    else if(adv){t.si++;t.opp=tourDraw(t);notes.push(`Tur atlandı! ${t.ko[t.si]} rakibi: ${t.opp.name}.`);}else{t.alive=false;notes.push(`${stage} turunda elendiniz.`);}}
  t.res.push(rec);
  if(!t.alive){t.done=true;if(t.g>=5)G.trophies.push({year:String(t.y),name:`${t.name} Gol Kralı (${t.g} gol)`,club:G.club,nat:true});if(!t.won)tourNews(tourOf(t.y),t.y,false,true);}
  msg('nat',`${t.name} · ${stage}: Türkiye ${res.us}-${res.opp} ${opp.name}`,notes.join(' '));save();
  showResult(cfg.home,cfg.away,res.us,res.opp,res,notes);}
function tourDraw(t){const pool=t.pool.map(c=>NATIONS.concat(NAT_X,NAT_W).find(n=>n[1]===c)).filter(Boolean).filter(n=>!t.res.some(x=>x.opp===n[0])),st=(t.si+1)/t.ko.length;return natObj(wpick(pool.map(n=>[n,Math.exp((n[4]-80)/3*(0.5+st))])));}
function tourNews(T,Y,trIn,skipTr){if(!T)return;const pool=(T.pool==='w'?NATIONS.concat(NAT_X,NAT_W):NATIONS.concat(NAT_X));const w=wpick(pool.map(n=>[n,Math.exp(n[4]/2.6)]));
  const trTxt=trIn&&!skipTr?` Türkiye turnuvayı ${pick(['grupta','son 16’da','çeyrek finalde'])} tamamladı.`:'';msg('nat',`${T.name} şampiyonu: ${w[0]}`,`${T.name} kupasını ${w[0]} kaldırdı.${trTxt}`);}
function tourSimAll(){let g=0;while(G.tour&&G.tour.alive&&g++<12){tourPlay(true);closeModal();}save();render();}
function tourPanelOff(){const t=G.tour;if(!t||t.done)return t&&t.done?`<section class="panel"><p class="sub-h"><span>${esc(t.name)}</span><span>${t.won?'Şampiyon':'Bitti'}</span></p><p class="muted">${t.won?'Türkiye şampiyon oldu! Kupa sende.':'Turnuva sona erdi.'} Kupalar sekmesinde maç sonuçlarını görebilirsin.</p></section>`:'';
  const tr=TRnat({off:0});return `<section class="tour">${ticketHTML(`${t.name} · ${tourStage(t)}`,'Milli takım · tarafsız saha',tr,t.opp,'<span class="pill red">Milli turnuva</span> Ay-yıldızlı formayla sahadasın')}
  <button class="cta big" data-act="tourPlay"><span>Turnuva maçına çık</span><small>${esc(tourStage(t))} · ${esc(t.opp.name)}</small></button><button class="btn" data-act="tourSim">Maçı simüle et</button><button class="btn ghost" data-act="tourSimAll">Kalan turnuvayı simüle et</button></section>`;}

/* ---------- Pres: topu süren rakibi otomatik takip ---------- */
function pressDir(max,dt){const S=MG.S,ce=S.hero,b=S.ball;S.pressing=false;S.pressT=null;
  if(!IN.btn.d||!(S.mode==='def'||S.mode==='cp')||S.phase!=='play')return [IN.jx,IN.jy];
  const o=b.owner&&b.owner.side==='opp'?b.owner:null;let tx,ty;
  if(o){if(S.mode==='def'){const gx=34-o.x,gy=-o.y,gl=Math.hypot(gx,gy)||1;tx=o.x+gx/gl*1.15;ty=o.y+gy/gl*1.15;}
    else{const vl=Math.hypot(o.vx,o.vy);tx=o.x+(vl>0.5?o.vx/vl*1.1:0);ty=o.y+(vl>0.5?o.vy/vl*1.1:0);}}
  else{tx=b.x;ty=b.y;}
  let vx=(tx-ce.x)*2.3+(o?o.vx*0.8:0),vy=(ty-ce.y)*2.3+(o?o.vy*0.8:0);const m=Math.hypot(vx,vy)/max;if(m>1){vx/=m;vy/=m;}
  let jx=(vx/max)*0.93+IN.jx*0.3,jy=(vy/max)*0.93+IN.jy*0.3;const jm=Math.hypot(jx,jy);if(jm>1){jx/=jm;jy/=jm;}
  S.pressing=true;S.pressT=o||b;
  if(o&&dist(ce,o)<1.6&&!(o.stag>0)){S.stam=Math.max(0,S.stam-dt*0.08);const f=1-dt*0.5;o.vx*=f;o.vy*=f;
    if(Math.random()<dt*clamp(0.05+S.C.a.def*0.002-S.iqOpp*0.06,0.02,0.25)){b.owner=null;b.vx=o.vx*0.4+rnd(-2.2,2.2);b.vy=o.vy*0.4+rnd(-2.2,2.2);b.last=o;b.lastT=S.t;b.kind='loose';o.stag=0.35;mgFlash('PRES! TOP AÇILDI','ok',600);vib(25);}}
  return [jx,jy];}

