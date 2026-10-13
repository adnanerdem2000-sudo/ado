/* ================= v49: kumarhane yeniden tasarım (tam ekran, animasyonlu) ================= */
const CZF=[{n:'Zemin kat',s:'Klasikler',min:10,max:1000,need:0},{n:'1. kat',s:'Hızlı oyunlar',min:50,max:10000,need:400},{n:'VIP salon',s:'Yüksek limit',min:500,max:100000,need:2500}];
const CZG={rl:{n:'Rulet',f:0,d:'Avrupa ruleti · tek sıfır'},bj:{n:'Blackjack',f:0,d:'Kasa 17’de durur · 3:2'},sl:{n:'Gol Makinesi',f:0,d:'3 makaralı slot · %92'},at:{n:'At yarışı',f:0,d:'Canlı yarış · kazanan ya da ilk 3'},
  cr:{n:'Füze Top',f:1,d:'Çarpan uçarken parayı çek'},pk:{n:'Plinko',f:1,d:'Topu bırak · risk seç'},mn:{n:'Mayın Tarlası',f:1,d:'Elması bul, mayından kaç'},hl:{n:'Yüksek mi Alçak mı',f:1,d:'Kart tahmini · seri çarpan'},
  dt:{n:'Ejderha Kulesi',f:2,d:'Yumurtayı seç, ejderhaya yakalanma'},ck:{n:'Şans Çarkı',f:2,d:'Çarkı çevir · 10x’e kadar'}};
const CZ_CHIPS=[10,50,100,500,1000,5000,25000,100000],CZ_COL={10:'#e9e6dc',50:'#d23b3b',100:'#2f6fd6',500:'#7a3fd1',1000:'#f0b429',5000:'#1f9d55',25000:'#e2559a',100000:'#151515'};
const czK=v=>v>=1000?(v/1000)+'K':''+v;
let CZ={view:'lobby',floor:0,bet:10,res:null};
function czG(){const g=gbInit();g.ch=g.ch||0;g.vip=g.vip||0;g.debt=g.debt||0;g.items=g.items||{sig:0,car:0,geri:0};g.hist=g.hist||[];g.wag=g.wag||0;g.lossT=g.lossT||null;g.cps=g.cps||[];return g;}
const czFl=()=>CZF[CZ.floor];
function czUnl(i){const g=czG();return g.vip>=CZF[i].need;}
function chipSVG(v,s=34){const c=CZ_COL[v]||'#888',dk=v===10?'#9a9483':shade(c,-0.35),tx=v===10||v===1000?'#1a1a1a':'#fff';
  return `<svg viewBox="0 0 40 40" width="${s}" height="${s}" class="czc"><circle cx="20" cy="20" r="19" fill="${dk}"/><circle cx="20" cy="20" r="17" fill="${c}"/><circle cx="20" cy="20" r="17" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="5 6.4" opacity=".85"/><circle cx="20" cy="20" r="11.5" fill="${c}" stroke="${dk}" stroke-width="1.2"/><text x="20" y="24" text-anchor="middle" font-size="${czK(v).length>3?9:11}" font-weight="800" fill="${tx}" font-family="Inter,Arial">${czK(v)}</text></svg>`;}
/* ---------- bahis ve sonuç ---------- */
function czBet(amt){const g=czG(),F=czFl();amt=Math.round(amt);if(amt<F.min)return toast(`Bu katta en az ${eur(F.min)}`),false;if(amt>F.max)return toast(`Bu katta en fazla ${eur(F.max)}`),false;if(g.ch<amt){toast('Fişin yetmiyor · Kasa’dan fiş al');return false;}
  g.ch-=amt;g.wag+=amt;g.vip+=Math.round(amt/10);gbHeat(clamp(1+amt/3000,1,6));return true;}
function czResult(bet,pay,label){const g=czG();let note='';
  if(pay>bet&&g.items.car>0){const ex=Math.round((pay-bet)*0.25);pay+=ex;g.items.car--;note=` · Kazanç kartı +${eur(ex)}`;}
  if(pay<bet&&g.items.sig>0){const back=Math.round((bet-pay)*0.5);pay+=back;g.items.sig--;note=` · Sigorta iadesi ${eur(back)}`;}
  g.ch+=pay;const net=pay-bet;if(net>0)g.won+=net;else g.lost-=net;g.lossT=net<0?{v:-net,label}:null;
  g.hist.unshift({l:label,net:Math.round(net)});if(g.hist.length>14)g.hist.length=14;CZ.res={net,label,note};gbPressCheck();save();czTicker();return net;}
/* ---------- arayüz ---------- */
function czOpen(){if(!gbAdult())return toast('18 yaşından küçükler giremez');czG();let el=document.getElementById('cz');if(!el){el=document.createElement('div');el.id='cz';el.className='cz';document.body.appendChild(el);}el.hidden=false;document.documentElement.classList.add('cz-on');CZ.view='lobby';CZ.res=null;czRender();}
function czClose(){czStop();const el=document.getElementById('cz');if(el)el.hidden=true;document.documentElement.classList.remove('cz-on');save();try{render();}catch(e){}}
function czStop(){if(CZ.raf)cancelAnimationFrame(CZ.raf);CZ.raf=null;if(CZ.cr&&CZ.cr.st==='fly'){CZ.cr.st='done';}}
function czHead(){const g=czG();return `<header class="cz-h"><div class="cz-logo"><b>GRAND KARTAL</b><span>CASINO · ${esc(czFl().n.toUpperCase())}</span></div>
  <div class="cz-bal"><div>${chipSVG(1000,26)}<span>Fiş</span><b id="czCh">${eur(Math.round(g.ch))}</b></div><div><span>Nakit</span><b>${money(G.p.money)}</b></div>${g.debt>0?`<div class="cz-debt"><span>Tefeci borcu</span><b>${eur(Math.round(g.debt))}</b></div>`:''}<div><span>VIP puan</span><b>${g.vip}</b></div></div>
  <nav class="cz-nav">${CZ.view!=='lobby'?'<button data-cz="lobby">◂ Salon</button>':''}<button data-cz="go" data-v="kasa">Kasa</button><button data-cz="go" data-v="tef">Tefeci</button><button data-cz="go" data-v="kart">Şans kartları</button><button data-cz="go" data-v="bayi">Bayi</button>${g.items.geri>0&&g.lossT?`<button class="cz-geri" data-cz="geri">⟲ Son kaybı geri al</button>`:''}<button class="cz-x" data-cz="close">Çıkış ✕</button></nav></header>`;}
function czTicker(){const t=document.getElementById('czTk');if(t)t.innerHTML=czTkHTML();const c=document.getElementById('czCh');if(c)c.textContent=eur(Math.round(czG().ch));}
const czTkHTML=()=>czG().hist.map(h=>`<span class="${h.net>0?'pos':h.net<0?'neg':''}">${esc(h.l)} ${h.net>0?'+':h.net<0?'−':''}${eur(Math.abs(h.net))}</span>`).join('');
function czBetBar(extra){const F=czFl(),g=czG(),vals=CZ_CHIPS.filter(v=>v>=F.min&&v<=F.max);if(CZ.bet<F.min||CZ.bet>F.max)CZ.bet=F.min;
  return `<div class="cz-bb"><div class="cz-chips">${vals.map(v=>`<button data-cz="chip" data-v="${v}" class="${CZ.bet===v?'on':''}">${chipSVG(v)}</button>`).join('')}</div><div class="cz-bv"><button data-cz="bx" data-v="0.5">½</button><b>${eur(CZ.bet)}</b><button data-cz="bx" data-v="2">2×</button></div>${extra||''}</div>`;}
function czRender(){const el=document.getElementById('cz');if(!el)return;const V=CZ.view;let body='';
  if(V==='lobby')body=czLobby();else if(V==='kasa')body=czKasa();else if(V==='tef')body=czTef();else if(V==='kart')body=czKart();else if(V==='bayi')body=czBayi();else if(CZV[V])body=CZV[V]();
  const r=CZ.res;el.innerHTML=`<div class="cz-in">${czHead()}${r?`<div class="cz-res ${r.net>0?'pos':r.net<0?'neg':''}">${esc(r.label)}: ${r.net>0?'KAZANDIN +'+eur(Math.round(r.net)):r.net<0?'Kaybettin −'+eur(Math.round(-r.net)):'Berabere'}${esc(r.note||'')}</div>`:''}<main class="cz-b">${body}</main><footer class="cz-tk" id="czTk">${czTkHTML()}</footer><p class="cz-warn">Kumar bağımlılık yapabilir. Kasa uzun vadede her zaman kazanır; sık oynarsan basına düşersin.</p></div>`;
  if(CZ.after){const f=CZ.after;CZ.after=null;setTimeout(f,30);}}
function czLobby(){const g=czG();return `<div class="cz-fl">${CZF.map((F,i)=>`<button data-cz="floor" data-v="${i}" class="${CZ.floor===i?'on':''} ${czUnl(i)?'':'lock'}"><b>${F.n}</b><small>${F.s} · ${eur(F.min)}–${eur(F.max)}${czUnl(i)?'':` · 🔒 ${F.need} VIP puan`}</small></button>`).join('')}</div>
  <div class="cz-games">${Object.entries(CZG).map(([k,G0])=>{const open=czUnl(G0.f);return `<button class="cz-gm ${open?'':'lock'}" data-cz="game" data-v="${k}"><div class="cz-art">${CZART[k]}</div><b>${G0.n}</b><small>${G0.d}</small><em>${CZF[G0.f].n}${open?'':' · kilitli'}</em></button>`;}).join('')}</div>
  <p class="cz-tip">VIP puanı her 10 € bahiste 1 artar. Yeni katlar ve şans kartları VIP puanıyla açılır. Fişi Kasa’dan alır, çıkarken nakde çevirirsin.</p>`;}
/* ---------- oyun görselleri (lobi) ---------- */
const CZART={
 rl:`<svg viewBox="0 0 100 70"><circle cx="50" cy="35" r="30" fill="#5a2d0c"/><circle cx="50" cy="35" r="26" fill="#1b1b1b"/>${[...Array(18)].map((_,i)=>`<path d="M50 35 L${50+26*Math.cos(i*Math.PI/9)} ${35+26*Math.sin(i*Math.PI/9)} A26 26 0 0 1 ${50+26*Math.cos((i+1)*Math.PI/9)} ${35+26*Math.sin((i+1)*Math.PI/9)}Z" fill="${i===0?'#178a3e':i%2?'#c4202c':'#151515'}"/>`).join('')}<circle cx="50" cy="35" r="12" fill="#d9b54a"/><circle cx="50" cy="35" r="4" fill="#7a5a12"/><circle cx="70" cy="22" r="3" fill="#fff"/></svg>`,
 bj:`<svg viewBox="0 0 100 70"><rect x="22" y="12" width="30" height="44" rx="4" fill="#fff" transform="rotate(-10 37 34)"/><text x="30" y="34" font-size="14" font-weight="800" fill="#111" transform="rotate(-10 37 34)">A♠</text><rect x="46" y="10" width="30" height="44" rx="4" fill="#fff" transform="rotate(8 61 32)"/><text x="52" y="34" font-size="14" font-weight="800" fill="#c4202c" transform="rotate(8 61 32)">K♥</text></svg>`,
 sl:`<svg viewBox="0 0 100 70"><rect x="14" y="8" width="72" height="54" rx="8" fill="#c4202c"/><rect x="20" y="18" width="60" height="30" rx="4" fill="#fff"/><text x="26" y="40" font-size="18">⚽</text><text x="44" y="40" font-size="20" font-weight="900" fill="#c4202c">7</text><text x="60" y="40" font-size="18">🏆</text><rect x="86" y="14" width="5" height="20" rx="2" fill="#d9b54a"/><circle cx="88.5" cy="12" r="4" fill="#d9b54a"/></svg>`,
 at:`<svg viewBox="0 0 100 70"><rect x="0" y="48" width="100" height="22" fill="#2f7d3b"/><path d="M0 50h100" stroke="#fff" stroke-width="1" stroke-dasharray="4 4"/><text x="18" y="50" font-size="30" transform="scale(-1 1) translate(-100 0)">🐎</text><text x="58" y="44" font-size="20" transform="scale(-1 1) translate(-112 0)">🐎</text><rect x="88" y="20" width="3" height="40" fill="#fff"/></svg>`,
 cr:`<svg viewBox="0 0 100 70"><path d="M8 62 Q50 60 70 30 T92 8" fill="none" stroke="#4ad27f" stroke-width="3"/><text x="78" y="18" font-size="14">⚽</text><text x="10" y="22" font-size="16" font-weight="900" fill="#4ad27f">4.20×</text></svg>`,
 pk:`<svg viewBox="0 0 100 70">${[0,1,2,3,4].map(r=>[...Array(r+3)].map((_,i)=>`<circle cx="${50+(i-(r+2)/2)*12}" cy="${10+r*11}" r="2" fill="#fff"/>`).join('')).join('')}${['#ef3b36','#ff8a3d','#ffd23d','#4ad27f','#ffd23d','#ff8a3d','#ef3b36'].map((c,i)=>`<rect x="${11+i*11.4}" y="62" width="10" height="7" rx="2" fill="${c}"/>`).join('')}<circle cx="53" cy="27" r="3.5" fill="#ff4fd8"/></svg>`,
 mn:`<svg viewBox="0 0 100 70">${[...Array(15)].map((_,i)=>`<rect x="${14+(i%5)*15}" y="${6+Math.floor(i/5)*20}" width="13" height="18" rx="3" fill="${i===7?'#c4202c':i%3===0?'#1f9d55':'#2b2f45'}"/>`).join('')}<text x="57" y="32" font-size="12">💣</text><text x="14" y="21" font-size="11">💎</text></svg>`,
 hl:`<svg viewBox="0 0 100 70"><rect x="30" y="8" width="38" height="54" rx="5" fill="#fff"/><text x="38" y="44" font-size="26" font-weight="900" fill="#111">8</text><text x="74" y="28" font-size="18" fill="#4ad27f">▲</text><text x="74" y="56" font-size="18" fill="#ef3b36">▼</text></svg>`,
 dt:`<svg viewBox="0 0 100 70">${[0,1,2,3].map(r=>[0,1,2].map(i=>`<rect x="${24+i*18}" y="${52-r*14}" width="16" height="11" rx="2" fill="${r===3&&i===1?'#c4202c':'#3b2f5c'}"/>`).join('')).join('')}<text x="44" y="18" font-size="12">🐉</text><text x="27" y="61" font-size="9">🥚</text></svg>`,
 ck:`<svg viewBox="0 0 100 70"><circle cx="50" cy="38" r="28" fill="#222"/>${[...Array(12)].map((_,i)=>`<path d="M50 38 L${50+28*Math.cos(i*Math.PI/6)} ${38+28*Math.sin(i*Math.PI/6)} A28 28 0 0 1 ${50+28*Math.cos((i+1)*Math.PI/6)} ${38+28*Math.sin((i+1)*Math.PI/6)}Z" fill="${['#f0b429','#2f6fd6','#e2559a','#1f9d55'][i%4]}"/>`).join('')}<circle cx="50" cy="38" r="6" fill="#fff"/><path d="M50 4 l-5 8 h10z" fill="#fff"/></svg>`};
/* ---------- kasa, tefeci, şans kartları ---------- */
function czKasa(){const g=czG(),cash=Math.floor(U2E(G.p.money));return `<section class="cz-p"><h3>Kasa</h3><p class="muted">Nakit paranı fişe çevir. Fişler kumarhanedeki hesabında kalır; istediğin an nakde geri çevirebilirsin.</p>
  <div class="cz-row">${[100,1000,10000,100000].filter(v=>v<=cash).map(v=>`<button class="cz-btn" data-cz="buy" data-v="${v}">${chipSVG(Math.min(v,100000),24)} ${eur(v)} fiş al</button>`).join('')}${cash>0?`<button class="cz-btn" data-cz="buy" data-v="${cash}">Tüm nakit (${eur(cash)})</button>`:''}</div>
  <div class="cz-row"><button class="cz-btn gold" data-cz="cash" ${g.ch<1?'disabled':''}>Tüm fişleri bozdur (${eur(Math.round(g.ch))})</button></div></section>`;}
function czTef(){const g=czG(),dd=g.debt>0?Math.max(0,g.due-absDay()):0,base=[1000,5000,25000].map(v=>v*(CZ.floor+1));
  return `<section class="cz-p tef"><div class="tef-hd"><div class="tef-face">🕴</div><div><h3>Tefeci Kemal</h3><p>“Fiş mi bitti? Kemal abin burada. Ama iki hafta içinde %30 fazlasıyla geri isterim. Ödemezsen… adamlarım seni bulur.”</p></div></div>
  ${g.debt>0?`<p class="cz-debtline">Borcun: <b>${eur(Math.round(g.debt))}</b> · ${dd>0?`${dd} gün içinde ödemelisin`:'<b class="neg">VADESİ GEÇTİ</b>'}</p><div class="cz-row"><button class="cz-btn gold" data-cz="pay" data-v="ch">Fişle öde</button><button class="cz-btn" data-cz="pay" data-v="cash">Nakitle öde</button></div>`:''}
  <div class="cz-row">${base.map(v=>`<button class="cz-btn" data-cz="loan" data-v="${v}" ${g.debt>base[2]*2?'disabled':''}>${eur(v)} borç al</button>`).join('')}</div><p class="muted">Vadesi geçen borç günlük faiz işler. Tefecinin adamları önce paranı alır, para yoksa canını yakar: sakatlık, moral kaybı ve magazin manşetleri.</p></section>`;}
const CZ_IT={sig:['Kayıp sigortası',300,'Bir sonraki kaybının yarısı geri gelir'],car:['Kazanç kartı',400,'Bir sonraki kazancın net kârına +%25'],geri:['Geri sar',900,'Son kaybettiğin eli tamamen geri al']};
function czKart(){const g=czG();return `<section class="cz-p"><h3>Şans kartları</h3><p class="muted">VIP puanınla al. Sigorta ve kazanç kartı bir sonraki elde kendiliğinden devreye girer; Geri sar’ı kaybettikten sonra üst menüden kullanırsın.</p>
  <div class="cz-cards">${Object.entries(CZ_IT).map(([k,[n,c,d]])=>`<div class="cz-it"><b>${n}</b><small>${d}</small><em>Elinde: ${g.items[k]}</em><button class="cz-btn" data-cz="item" data-v="${k}" ${g.vip<c?'disabled':''}>${c} VIP puan</button></div>`).join('')}</div></section>`;}
/* ---------- RULET ---------- */
const RL_ORD=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const rlCol=n=>n===0?'g':RL_RED.includes(n)?'r':'b';
function rlWheel(){const st=360/37,R=120;let s='';RL_ORD.forEach((n,i)=>{const a0=(i*st-90-st/2)*Math.PI/180,a1=((i+1)*st-90-st/2)*Math.PI/180,c={g:'#178a3e',r:'#c4202c',b:'#151515'}[rlCol(n)];
  s+=`<path d="M0 0 L${R*Math.cos(a0)} ${R*Math.sin(a0)} A${R} ${R} 0 0 1 ${R*Math.cos(a1)} ${R*Math.sin(a1)}Z" fill="${c}" stroke="#d9b54a" stroke-width=".6"/><text transform="rotate(${i*st}) translate(0 ${-R+13})" text-anchor="middle" font-size="10" font-weight="700" fill="#fff">${n}</text>`;});
  return `<svg viewBox="-135 -135 270 270" class="rl-svg"><circle r="132" fill="#5a2d0c"/><circle r="126" fill="#3a1c06"/><g id="rlRot" style="transform:rotate(${CZ.rl?CZ.rl.rot:0}deg)">${s}<circle r="78" fill="#2a1505"/><circle r="70" fill="#5a2d0c"/>${[0,1,2,3].map(i=>`<rect x="-4" y="-66" width="8" height="40" rx="3" fill="#d9b54a" transform="rotate(${i*90})"/>`).join('')}<circle r="14" fill="#d9b54a"/></g><path d="M0 -122 l-8 -12 h16z" fill="#fff"/>${CZ.rl&&CZ.rl.ball?`<circle id="rlBall" cx="0" cy="-104" r="6" fill="#fff" stroke="#999"/>`:''}</svg>`;}
function rlBoard(){const B=CZ.rl.bets,amt=(t,v)=>B.filter(b=>b.t===t&&b.v==v).reduce((a,b)=>a+b.a,0),cell=(t,v,l,cls)=>{const a=amt(t,v);return `<button class="rlb ${cls||''}" data-cz="rlAdd" data-t="${t}" data-v="${v}">${l}${a?`<i>${czK(a)}</i>`:''}</button>`;};
  let nums='';for(let r=0;r<3;r++)for(let c=0;c<12;c++){const n=c*3+3-r;nums+=cell('n',n,n,'n '+rlCol(n));}
  return `<div class="rl-board"><div class="rl-z">${cell('n',0,'0','n g')}</div><div class="rl-ns">${nums}</div><div class="rl-col">${[1,2,3].map(k=>cell('col',k,'2:1')).join('')}</div>
  <div class="rl-out">${[['dz',1,'1–12'],['dz',2,'13–24'],['dz',3,'25–36']].map(x=>cell(...x)).join('')}</div><div class="rl-out2">${[['y',1,'1–18'],['tc','c','Çift'],['rk','r','◆ Kırmızı','r'],['rk','b','◆ Siyah','b'],['tc','t','Tek'],['y',2,'19–36']].map(x=>cell(...x)).join('')}</div></div>`;}
function rlPay(b,n){if(b.t==='n')return n===+b.v?36:0;if(n===0)return 0;if(b.t==='rk')return rlCol(n)===b.v?2:0;if(b.t==='tc')return (n%2===1)===(b.v==='t')?2:0;if(b.t==='y')return (+b.v===1?n<=18:n>=19)?2:0;if(b.t==='dz')return Math.ceil(n/12)===+b.v?3:0;if(b.t==='col')return (n%3)===({1:0,2:2,3:1})[+b.v]?3:0;return 0;}
const CZV={};
CZV.rl=()=>{CZ.rl=CZ.rl||{bets:[],rot:0,last:[]};const R=CZ.rl,tot=R.bets.reduce((a,b)=>a+b.a,0);
  return `<div class="cz-tbl felt rl"><div class="rl-left">${rlWheel()}<div class="rl-last">${R.last.map(n=>`<span class="${rlCol(n)}">${n}</span>`).join('')}</div></div><div class="rl-right">${rlBoard()}${czBetBar(`<div class="cz-act"><span>Masadaki: <b>${eur(tot)}</b></span><button class="cz-btn" data-cz="rlClr" ${R.spin?'disabled':''}>Temizle</button><button class="cz-btn gold big" data-cz="rlSpin" ${R.spin||!tot?'disabled':''}>ÇEVİR</button></div>`)}</div></div>`;};
const CZA={};
CZA.rlAdd=el=>{const R=CZ.rl;if(R.spin)return;const tot=R.bets.reduce((a,b)=>a+b.a,0);if(tot+CZ.bet>czFl().max)return toast(`Masa limiti ${eur(czFl().max)}`);const e=R.bets.find(b=>b.t===el.dataset.t&&b.v==el.dataset.v);if(e)e.a+=CZ.bet;else R.bets.push({t:el.dataset.t,v:el.dataset.v,a:CZ.bet});CZ.res=null;czRender();};
CZA.rlClr=()=>{CZ.rl.bets=[];czRender();};
CZA.rlSpin=()=>{const R=CZ.rl,tot=R.bets.reduce((a,b)=>a+b.a,0);if(R.spin||!tot)return;const F=czFl();if(tot<F.min)return toast(`En az ${eur(F.min)}`);if(!czBet(tot))return czRender();
  const n=Math.floor(Math.random()*37),i=RL_ORD.indexOf(n),st=360/37;R.spin=true;R.ball=true;CZ.res=null;const target=Math.ceil(R.rot/360)*360+360*6-i*st;czRender();
  requestAnimationFrame(()=>{const g=document.getElementById('rlRot');if(g){g.style.transition='transform 4.6s cubic-bezier(.12,.62,.15,1)';g.style.transform=`rotate(${target}deg)`;}const b=document.getElementById('rlBall');if(b){b.animate([{transform:'rotate(0deg)'},{transform:`rotate(${-360*8}deg)`}],{duration:4600,easing:'cubic-bezier(.2,.6,.2,1)'});}});
  setTimeout(()=>{R.rot=target;R.spin=false;R.ball=false;const pay=R.bets.reduce((a,b)=>a+b.a*rlPay(b,n),0);R.last.unshift(n);if(R.last.length>12)R.last.length=12;czResult(tot,pay,`Rulet ${n} ${({g:'yeşil',r:'kırmızı',b:'siyah'})[rlCol(n)]}`);R.bets=[];if(CZ.view==='rl')czRender();},4700);};
/* ---------- BLACKJACK ---------- */
const czCard=(c,h)=>h?`<span class="pc back"></span>`:`<span class="pc ${c.s==='♥'||c.s==='♦'?'red':''}"><b>${c.r}</b><i>${c.s}</i><b class="br">${c.r}</b></span>`;
CZV.bj=()=>{const B=CZ.bj;const hand=(h,hide)=>`<div class="pcs">${h.map((c,i)=>czCard(c,hide&&i===1)).join('')}</div>`;
  if(!B||B.st==='end')return `<div class="cz-tbl felt bj"><p class="bj-arc">BLACKJACK ÖDER 3:2 · KASA 17’DE DURUR</p>${B?`<div class="bj-s"><small>Kasa · ${bjVal(B.h)}</small>${hand(B.h)}</div><div class="bj-s"><small>Sen · ${bjVal(B.p)}</small>${hand(B.p)}</div>`:'<div class="bj-empty">Bahsini seç ve dağıt</div>'}${czBetBar(`<div class="cz-act"><button class="cz-btn gold big" data-cz="bjDeal">DAĞIT</button></div>`)}</div>`;
  return `<div class="cz-tbl felt bj"><p class="bj-arc">BAHİS ${eur(B.bet)}</p><div class="bj-s"><small>Kasa</small>${hand(B.h,true)}</div><div class="bj-s"><small>Sen · ${bjVal(B.p)}</small>${hand(B.p)}</div><div class="cz-act"><button class="cz-btn gold big" data-cz="bjHit">KART ÇEK</button><button class="cz-btn big" data-cz="bjStand">DUR</button>${B.p.length===2&&czG().ch>=B.bet?'<button class="cz-btn big" data-cz="bjDbl">İKİYE KATLA</button>':''}</div></div>`;};
function czBjEnd(){const B=CZ.bj;while(bjVal(B.h)<17)B.h.push(B.d.pop());const pv=bjVal(B.p),dv=bjVal(B.h);let pay=0,l='';
  if(pv>21)l='Battın';else if(pv===21&&B.p.length===2&&!(dv===21&&B.h.length===2)){pay=B.bet*2.5;l='BLACKJACK!';}else if(dv>21||pv>dv){pay=B.bet*2;l=dv>21?'Kasa battı':'Kazandın';}else if(pv===dv){pay=B.bet;l='Berabere';}else l='Kasa kazandı';
  B.st='end';czResult(B.bet,pay,`Blackjack · ${l}`);}
CZA.bjDeal=()=>{if(!czBet(CZ.bet))return czRender();const d=bjDeck();CZ.bj={bet:CZ.bet,d,p:[d.pop(),d.pop()],h:[d.pop(),d.pop()],st:'play'};CZ.res=null;if(bjVal(CZ.bj.p)===21)czBjEnd();czRender();};
CZA.bjHit=()=>{const B=CZ.bj;if(!B||B.st!=='play')return;B.p.push(B.d.pop());if(bjVal(B.p)>21)czBjEnd();czRender();};
CZA.bjStand=()=>{const B=CZ.bj;if(!B||B.st!=='play')return;czBjEnd();czRender();};
CZA.bjDbl=()=>{const B=CZ.bj;if(!B||B.st!=='play'||B.p.length!==2)return;const g=czG();if(g.ch<B.bet)return toast('Fişin yetmiyor');g.ch-=B.bet;g.wag+=B.bet;B.bet*=2;B.p.push(B.d.pop());czBjEnd();czRender();};
/* ---------- SLOT: Gol Makinesi ---------- */
const SL_S=[['top','⚽',6],['eld','🧤',5],['kra','👟',4],['kup','🏆',2],['yil','⭐',2],['7','7',1]],SL_3={top:5,eld:8,kra:14,kup:40,yil:40,'7':150},SL_2={top:1,eld:1.2,kra:1.5,kup:2.5,yil:2.5,'7':5};
const slSym=k=>{const s=SL_S.find(x=>x[0]===k);return k==='7'?'<b class="sl7">7</b>':s[1];};
const slRand=()=>wpick(SL_S.map(s=>[s[0],s[2]]));
CZV.sl=()=>{CZ.sl=CZ.sl||{r:['top','7','kup'],spin:false};const S=CZ.sl;
  return `<div class="cz-tbl slm"><div class="sl-mc"><div class="sl-top">GOL MAKİNESİ</div><div class="sl-win">${S.r.map((k,i)=>`<div class="sl-reel"><div class="sl-strip" id="slR${i}">${(S.strip&&S.strip[i]||[k]).map(x=>`<div class="sl-c">${slSym(x)}</div>`).join('')}</div></div>`).join('')}<div class="sl-line"></div></div>
  <table class="sl-pay"><tr><th>3 aynı</th>${SL_S.map(s=>`<td>${slSym(s[0])}<b>${SL_3[s[0]]}×</b></td>`).join('')}</tr><tr><th>yan yana 2</th>${SL_S.map(s=>`<td><b>${SL_2[s[0]]}×</b></td>`).join('')}</tr></table></div>
  ${czBetBar(`<div class="cz-act"><button class="cz-btn gold big" data-cz="slSpin" ${S.spin?'disabled':''}>ÇEVİR</button></div>`)}</div>`;};
CZA.slSpin=()=>{const S=CZ.sl;if(S.spin)return;if(!czBet(CZ.bet))return czRender();const bet=CZ.bet,r=[slRand(),slRand(),slRand()];S.spin=true;CZ.res=null;
  S.strip=r.map((k,i)=>{const a=[...Array(14+i*5)].map(slRand);a.push(k);return a;});S.prev=S.r;S.r=r;czRender();
  requestAnimationFrame(()=>{r.forEach((k,i)=>{const el=document.getElementById('slR'+i);if(!el)return;const n=S.strip[i].length-1;el.style.transform='translateY(0)';void el.offsetHeight;el.style.transition=`transform ${1.1+i*0.5}s cubic-bezier(.15,.7,.2,1.05)`;el.style.transform=`translateY(${-n*100/ (n+1)}%)`;});});
  setTimeout(()=>{S.spin=false;const [a,b,c]=r;let m=0;if(a===b&&b===c)m=SL_3[a];else if(a===b)m=SL_2[a];else if(b===c)m=SL_2[b];S.strip=null;czResult(bet,Math.round(bet*m),`Gol Makinesi ${m?m+'×':''}`);if(CZ.view==='sl')czRender();},2200);};
/* ---------- AT YARIŞI (canlı) ---------- */
const HC=['#ef3b36','#2f6fd6','#f0b429','#1f9d55','#7a3fd1','#e2559a'];
function atNew(){const H=raceNew().slice(0,6);const tot=H.reduce((a,h)=>a+h.p,0);H.forEach((h,i)=>{h.p/=tot;h.o=Math.max(1.4,Math.round(0.88/h.p*10)/10);h.pl=Math.max(1.1,Math.round(h.o/3.1*10)/10);h.c=HC[i];});return H;}
CZV.at=()=>{CZ.at=CZ.at||{H:atNew(),pick:0,type:'w',run:false};const A=CZ.at;
  return `<div class="cz-tbl at"><div class="at-track" id="atTr">${A.H.map((h,i)=>`<div class="at-ln"><span class="at-no" style="background:${h.c}">${i+1}</span><div class="at-h" id="atH${i}" style="left:${A.pos?A.pos[i]*88:0}%"><span class="at-e">🐎</span><i style="background:${h.c}"></i></div></div>`).join('')}<div class="at-fin"></div></div><p class="at-com" id="atCom">${A.com||'Atlar start makinesinde…'}</p>
  <div class="at-list">${A.H.map((h,i)=>`<button class="at-pk ${A.pick===i?'on':''}" data-cz="atPick" data-v="${i}" ${A.run?'disabled':''}><span class="at-no" style="background:${h.c}">${i+1}</span><b>${esc(h.n)}</b><small>Kazanan ${dec(h.o,1)} · İlk 3 ${dec(h.pl,1)}</small></button>`).join('')}</div>
  ${czBetBar(`<div class="cz-act"><div class="cz-seg"><button data-cz="atType" data-v="w" class="${A.type==='w'?'on':''}">Kazanan</button><button data-cz="atType" data-v="p" class="${A.type==='p'?'on':''}">İlk 3</button></div><button class="cz-btn gold big" data-cz="atRun" ${A.run?'disabled':''}>YARIŞI BAŞLAT</button></div>`)}</div>`;};
CZA.atPick=el=>{CZ.at.pick=+el.dataset.v;czRender();};CZA.atType=el=>{CZ.at.type=el.dataset.v;czRender();};
CZA.atRun=()=>{const A=CZ.at;if(A.run)return;if(!czBet(CZ.bet))return czRender();const bet=CZ.bet;A.run=true;CZ.res=null;A.com='Ve start verildi!';
  const left=A.H.map((h,i)=>i),order=[];while(left.length){const j=wpick(left.map(i=>[i,A.H[i].p]));order.push(j);left.splice(left.indexOf(j),1);}
  const T=A.H.map((h,i)=>5.2+order.indexOf(i)*0.32+Math.random()*0.12),ph=A.H.map(()=>Math.random()*6);A.pos=A.H.map(()=>0);czRender();const t0=performance.now();
  const step=now=>{const t=(now-t0)/1000;let lead=0;A.H.forEach((h,i)=>{const x=Math.min(1,Math.pow(t/T[i],1.05)+0.025*Math.sin(t*2.3+ph[i])*(1-Math.min(1,t/T[i])));A.pos[i]=Math.max(0,x);const el=document.getElementById('atH'+i);if(el)el.style.left=(A.pos[i]*88)+'%';if(A.pos[i]>A.pos[lead])lead=i;});
    const c=document.getElementById('atCom');if(c)c.textContent=t<1?'Ve start verildi!':A.pos[lead]<1?`Önde ${A.H[lead].n}! ${t>3.5?'Son düzlüğe giriliyor!':''}`:`${A.H[order[0]].n} çizgiyi ilk geçti!`;
    if(t<Math.max(...T)+0.4)CZ.raf=requestAnimationFrame(step);else{CZ.raf=null;A.run=false;const k=A.pick,rank=order.indexOf(k),h=A.H[k];const win=A.type==='w'?rank===0:rank<=2,pay=win?Math.round(bet*(A.type==='w'?h.o:h.pl)):0;
      A.com=`Sıralama: ${order.slice(0,3).map((j,x)=>`${x+1}. ${A.H[j].n}`).join(' · ')}`;czResult(bet,pay,`At yarışı · ${h.n} ${rank+1}.`);A.H=atNew();A.pos=null;if(CZ.view==='at')czRender();}};
  CZ.raf=requestAnimationFrame(step);};
/* ---------- FÜZE TOP (crash) ---------- */
CZV.cr=()=>{CZ.cr=CZ.cr||{st:'idle',m:1,hist:[],auto:0};const C=CZ.cr;
  return `<div class="cz-tbl dark cr"><div class="cr-hist">${C.hist.map(x=>`<span class="${x>=2?'pos':'neg'}">${x.toFixed(2)}×</span>`).join('')}</div><div class="cr-wrap"><canvas id="crCv" width="760" height="300"></canvas><div class="cr-m ${C.st==='boom'?'boom':''}" id="crM">${C.st==='boom'?'💥 '+C.cp.toFixed(2)+'×':C.m.toFixed(2)+'×'}</div></div>
  ${czBetBar(`<div class="cz-act"><div class="cz-seg">${[0,1.5,2,3,5,10].map(v=>`<button data-cz="crAuto" data-v="${v}" class="${C.auto===v?'on':''}">${v?'Oto '+v+'×':'Oto kapalı'}</button>`).join('')}</div>${C.st==='fly'?`<button class="cz-btn gold big pulse" data-cz="crOut">PARAYI ÇEK · ${eur(Math.round(C.bet*C.m))}</button>`:`<button class="cz-btn gold big" data-cz="crGo">FIRLAT</button>`}</div>`)}</div>`;};
CZA.crAuto=el=>{CZ.cr.auto=+el.dataset.v;czRender();};
function crDraw(){const cv=document.getElementById('crCv');if(!cv)return;const C=CZ.cr,x=cv.getContext('2d'),W=cv.width,H=cv.height;x.clearRect(0,0,W,H);
  x.strokeStyle='rgba(255,255,255,.08)';x.lineWidth=1;for(let i=1;i<5;i++){x.beginPath();x.moveTo(0,H*i/5);x.lineTo(W,H*i/5);x.stroke();}
  const tm=Math.max(6,C.t+1),mm=Math.max(2,C.m*1.15),px=t=>30+(W-60)*t/tm,py=m=>H-20-(H-40)*(m-1)/(mm-1);
  x.beginPath();x.moveTo(px(0),py(1));for(let t=0;t<=C.t;t+=0.05)x.lineTo(px(t),py(Math.exp(0.22*t)));x.lineTo(px(C.t),py(C.m));x.strokeStyle=C.st==='boom'?'#ef3b36':'#4ad27f';x.lineWidth=4;x.stroke();
  x.lineTo(px(C.t),H-20);x.lineTo(px(0),H-20);x.closePath();x.fillStyle=C.st==='boom'?'rgba(239,59,54,.12)':'rgba(74,210,127,.12)';x.fill();
  x.font='28px serif';x.fillText(C.st==='boom'?'💥':'⚽',px(C.t)-14,py(C.m)+10);}
CZA.crGo=()=>{const C=CZ.cr;if(C.st==='fly')return;if(!czBet(CZ.bet))return czRender();const U=Math.random();C.cp=Math.max(1,Math.floor(0.96/Math.max(1e-6,U)*100)/100);if(C.cp<1.01&&Math.random()<0.5)C.cp=1;C.bet=CZ.bet;C.st='fly';C.m=1;C.t=0;C.out=false;CZ.res=null;czRender();const t0=performance.now();
  const step=now=>{if(C.st!=='fly')return;C.t=(now-t0)/1000;C.m=Math.exp(0.22*C.t);if(C.auto&&C.m>=C.auto&&C.auto<=C.cp){C.m=C.auto;crCash();return;}
    if(C.m>=C.cp){C.m=C.cp;C.st='boom';crDraw();C.hist.unshift(C.cp);if(C.hist.length>12)C.hist.length=12;czResult(C.bet,0,`Füze Top ${C.cp.toFixed(2)}× patladı`);if(CZ.view==='cr')czRender();setTimeout(()=>{if(CZ.view==='cr')crDraw();},20);return;}
    const m=document.getElementById('crM');if(m)m.textContent=C.m.toFixed(2)+'×';const b=document.querySelector('[data-cz=crOut]');if(b)b.textContent=`PARAYI ÇEK · ${eur(Math.round(C.bet*C.m))}`;crDraw();CZ.raf=requestAnimationFrame(step);};CZ.raf=requestAnimationFrame(step);};
function crCash(){const C=CZ.cr;if(C.st!=='fly')return;C.st='done';const m=Math.floor(C.m*100)/100;C.hist.unshift(C.cp);if(C.hist.length>12)C.hist.length=12;czResult(C.bet,Math.round(C.bet*m),`Füze Top ${m.toFixed(2)}× çekildi (patlama ${C.cp.toFixed(2)}×)`);czRender();setTimeout(crDraw,20);}
CZA.crOut=()=>crCash();
/* ---------- PLINKO ---------- */
const PK_R=10,PK_SH={dusuk:[5,2,1.4,1.1,1,0.5,1,1.1,1.4,2,5],orta:[18,5,2,1.4,0.6,0.4,0.6,1.4,2,5,18],yuksek:[80,14,4,1.2,0.3,0.2,0.3,1.2,4,14,80]};
const PK_M={};(()=>{const C=(n,k)=>{let r=1;for(let i=1;i<=k;i++)r=r*(n-i+1)/i;return r;};for(const [k,a] of Object.entries(PK_SH)){const ev=a.reduce((s,v,i)=>s+v*C(PK_R,i)/Math.pow(2,PK_R),0),f=0.96/ev;PK_M[k]=a.map(v=>{const x=v*f;return x>=10?Math.round(x):Math.round(x*10)/10;});}})();
CZV.pk=()=>{CZ.pk=CZ.pk||{risk:'orta',balls:[],last:null};const P=CZ.pk;
  return `<div class="cz-tbl dark pkb"><canvas id="pkCv" width="560" height="500"></canvas>${czBetBar(`<div class="cz-act"><div class="cz-seg">${[['dusuk','Düşük'],['orta','Orta'],['yuksek','Yüksek']].map(([k,l])=>`<button data-cz="pkRisk" data-v="${k}" class="${P.risk===k?'on':''}">${l} risk</button>`).join('')}</div><button class="cz-btn gold big" data-cz="pkDrop">TOPU BIRAK</button></div>`)}</div>`;};
function pkDraw(){const cv=document.getElementById('pkCv');if(!cv)return;const P=CZ.pk,x=cv.getContext('2d'),W=cv.width,H=cv.height,g=W/(PK_R+3);x.clearRect(0,0,W,H);
  for(let r=0;r<PK_R;r++)for(let i=0;i<=r+2;i++){x.beginPath();x.arc(W/2+(i-(r+2)/2)*g,40+r*g*0.95,4,0,7);x.fillStyle='#e9e6dc';x.fill();}
  const M=PK_M[P.risk],by=40+PK_R*g*0.95+6;M.forEach((m,i)=>{const cx=W/2+(i-PK_R/2)*g,hue=Math.abs(i-PK_R/2)/(PK_R/2);x.fillStyle=`hsl(${50-hue*50},90%,${P.hit===i&&P.hitT>0?70:52}%)`;x.beginPath();x.roundRect(cx-g/2+3,by,g-6,30,6);x.fill();x.fillStyle='#1a1a1a';x.font='bold 12px Inter,Arial';x.textAlign='center';x.fillText(m+'×',cx,by+19);});
  for(const b of P.balls){x.beginPath();x.arc(b.x,b.y,8,0,7);x.fillStyle='#ff4fd8';x.shadowColor='#ff4fd8';x.shadowBlur=12;x.fill();x.shadowBlur=0;}}
CZA.pkRisk=el=>{if(CZ.pk.balls.length)return toast('Toplar düşerken risk değiştirilemez');CZ.pk.risk=el.dataset.v;CZ.after=pkDraw;czRender();};
CZA.pkDrop=()=>{const P=CZ.pk;if(P.balls.length>=5)return;if(!czBet(CZ.bet))return czRender();const path=[];let k=0;for(let r=0;r<PK_R;r++){const d=Math.random()<0.5?0:1;k+=d;path.push(d);}
  P.balls.push({bet:CZ.bet,path,k,risk:P.risk,t:0,x:0,y:0});CZ.res=null;czTicker();
  if(!CZ.raf){let last=performance.now();const step=now=>{const cv=document.getElementById('pkCv');const W=cv?cv.width:560,g=W/(PK_R+3),X=(r,c)=>W/2+(c-r/2)*g,Y=r=>26+r*g*0.95;const dt=Math.min(0.05,(now-last)/1000);last=now;
      for(const b of P.balls.slice()){b.t+=dt*5;const r=Math.floor(b.t),f=b.t-r;if(r>=PK_R){P.balls.splice(P.balls.indexOf(b),1);P.hit=b.k;P.hitT=0.5;const m=PK_M[b.risk][b.k];czResult(b.bet,Math.round(b.bet*m),`Plinko ${m}×`);if(CZ.view==='pk'){czRender();}continue;}
        let c=0;for(let i=0;i<r;i++)c+=b.path[i];b.x=X(r,c)+(X(r+1,c+b.path[r])-X(r,c))*f;b.y=Y(r)+(Y(r+1)-Y(r))*f-Math.sin(f*Math.PI)*9;}
      if(P.hitT>0)P.hitT-=dt;pkDraw();if(P.balls.length||P.hitT>0)CZ.raf=requestAnimationFrame(step);else{CZ.raf=null;pkDraw();}};CZ.raf=requestAnimationFrame(step);}};
/* ---------- MAYIN TARLASI ---------- */
const mnMul=(m,k)=>{let r=0.97;for(let i=0;i<k;i++)r*=(25-i)/(25-m-i);return Math.floor(r*100)/100;};
CZV.mn=()=>{CZ.mn=CZ.mn||{m:3,st:'idle',open:[],mines:[]};const M=CZ.mn,k=M.open.length;
  return `<div class="cz-tbl dark mn"><div class="mn-grid">${[...Array(25)].map((_,i)=>{const o=M.open.includes(i),bomb=M.mines.includes(i),show=M.st==='boom'||M.st==='cash';return `<button class="mn-t ${o?'gem':''} ${show&&bomb?'bomb':''} ${show&&!o&&!bomb?'dim':''}" data-cz="mnTap" data-v="${i}" ${M.st!=='play'||o?'disabled':''}>${o?'💎':show&&bomb?'💣':''}</button>`;}).join('')}</div>
  <div class="mn-info"><div><span>Mayın</span><div class="cz-seg">${[1,3,5,10,15].map(v=>`<button data-cz="mnM" data-v="${v}" class="${M.m===v?'on':''}" ${M.st==='play'?'disabled':''}>${v}</button>`).join('')}</div></div><div><span>Şu anki çarpan</span><b>${M.st==='play'?mnMul(M.m,k).toFixed(2):'1.00'}×</b></div><div><span>Sonraki elmas</span><b>${mnMul(M.m,k+1).toFixed(2)}×</b></div></div>
  ${M.st==='play'?`<div class="cz-act"><button class="cz-btn gold big" data-cz="mnCash" ${k?'':'disabled'}>KASAYA AL · ${eur(Math.round(M.bet*mnMul(M.m,k)))}</button></div>`:czBetBar(`<div class="cz-act"><button class="cz-btn gold big" data-cz="mnGo">BAŞLA</button></div>`)}</div>`;};
CZA.mnM=el=>{CZ.mn.m=+el.dataset.v;czRender();};
CZA.mnGo=()=>{const M=CZ.mn;if(!czBet(CZ.bet))return czRender();const all=[...Array(25)].map((_,i)=>i).sort(()=>Math.random()-0.5);M.mines=all.slice(0,M.m);M.open=[];M.st='play';M.bet=CZ.bet;CZ.res=null;czRender();};
CZA.mnTap=el=>{const M=CZ.mn,i=+el.dataset.v;if(M.st!=='play'||M.open.includes(i))return;if(M.mines.includes(i)){M.st='boom';czResult(M.bet,0,`Mayın Tarlası · ${M.open.length} elmas sonra mayın`);}else{M.open.push(i);if(M.open.length>=25-M.m){M.st='cash';czResult(M.bet,Math.round(M.bet*mnMul(M.m,M.open.length)),'Mayın Tarlası · tüm elmaslar!');}}czRender();};
CZA.mnCash=()=>{const M=CZ.mn;if(M.st!=='play'||!M.open.length)return;M.st='cash';const m=mnMul(M.m,M.open.length);czResult(M.bet,Math.round(M.bet*m),`Mayın Tarlası ${m.toFixed(2)}×`);czRender();};
/* ---------- YÜKSEK Mİ ALÇAK MI ---------- */
const HL_R=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
const hlCard=()=>({r:1+Math.floor(Math.random()*13),s:pick(BJ_S)});
CZV.hl=()=>{CZ.hl=CZ.hl||{st:'idle',c:hlCard(),m:1,sk:3,trail:[]};const L=CZ.hl,r=L.c.r,pH=(14-r)/13,pL=r/13;const c=x=>`<span class="pc big ${x.s==='♥'||x.s==='♦'?'red':''}"><b>${HL_R[x.r-1]}</b><i>${x.s}</i><b class="br">${HL_R[x.r-1]}</b></span>`;
  return `<div class="cz-tbl felt hl"><div class="hl-trail">${L.trail.map(x=>`<span class="pc mini ${x.s==='♥'||x.s==='♦'?'red':''}"><b>${HL_R[x.r-1]}</b><i>${x.s}</i></span>`).join('')}</div><div class="hl-main">${c(L.c)}<div class="hl-m"><span>Çarpan</span><b>${L.m.toFixed(2)}×</b>${L.st==='play'?`<small>Kasaya al: ${eur(Math.round(L.bet*L.m))}</small>`:''}</div></div>
  ${L.st==='play'?`<div class="cz-act"><button class="cz-btn big up" data-cz="hlG" data-v="h">▲ Yüksek ya da eşit<small>%${Math.round(pH*100)} · ${(0.97/pH).toFixed(2)}×</small></button><button class="cz-btn big dn" data-cz="hlG" data-v="l">▼ Düşük ya da eşit<small>%${Math.round(pL*100)} · ${(0.97/pL).toFixed(2)}×</small></button><button class="cz-btn" data-cz="hlSkip" ${L.sk?'':'disabled'}>Atla (${L.sk})</button><button class="cz-btn gold big" data-cz="hlCash" ${L.m>1?'':'disabled'}>KASAYA AL</button></div>`:czBetBar(`<div class="cz-act"><button class="cz-btn gold big" data-cz="hlGo">BAŞLA</button></div>`)}</div>`;};
CZA.hlGo=()=>{const L=CZ.hl;if(!czBet(CZ.bet))return czRender();L.st='play';L.bet=CZ.bet;L.m=1;L.sk=3;L.trail=[];CZ.res=null;czRender();};
CZA.hlSkip=()=>{const L=CZ.hl;if(L.st!=='play'||!L.sk)return;L.sk--;L.trail.push(L.c);L.c=hlCard();czRender();};
CZA.hlG=el=>{const L=CZ.hl;if(L.st!=='play')return;const r=L.c.r,h=el.dataset.v==='h',p=h?(14-r)/13:r/13,n=hlCard();L.trail.push(L.c);if(L.trail.length>10)L.trail.shift();L.c=n;const ok=h?n.r>=r:n.r<=r;
  if(ok){L.m=Math.round(L.m*0.97/p*100)/100;}else{L.st='idle';czResult(L.bet,0,`Yüksek/Alçak · ${HL_R[n.r-1]} geldi`);L.m=1;}czRender();};
CZA.hlCash=()=>{const L=CZ.hl;if(L.st!=='play'||L.m<=1)return;L.st='idle';czResult(L.bet,Math.round(L.bet*L.m),`Yüksek/Alçak ${L.m.toFixed(2)}×`);L.m=1;czRender();};
/* ---------- EJDERHA KULESİ ---------- */
const DT_D={kolay:[4,1],orta:[3,1],zor:[2,1]};
CZV.dt=()=>{CZ.dt=CZ.dt||{d:'orta',st:'idle',row:0,picks:[],skulls:[],m:1};const D=CZ.dt,[n,s]=DT_D[D.d],p=(n-s)/n;
  const over=D.st!=='play'&&D.st!=='idle';const rows=[...Array(8)].map((_,r)=>`<div class="dt-r ${r===D.row&&D.st==='play'?'cur':''}"><em>${(()=>{let m=1;for(let i=0;i<=r;i++)m*=0.97/p;return (Math.floor(m*100)/100).toFixed(2);})()}×</em>${[...Array(n)].map((_,i)=>{const sk=!!(D.skulls[r]&&D.skulls[r].includes(i)),pk=D.picks[r]===i;return `<button class="dt-t ${pk?(sk?'bad':'ok'):over&&sk?'sk':''}" data-cz="dtTap" data-v="${i}" ${D.st!=='play'||r!==D.row?'disabled':''}>${pk?(sk?'🐉':'🥚'):over&&sk?'💀':''}</button>`;}).join('')}</div>`).reverse().join('');
  return `<div class="cz-tbl dark dt"><div class="dt-tw">${rows}</div><div class="mn-info"><div><span>Zorluk</span><div class="cz-seg">${Object.keys(DT_D).map(k=>`<button data-cz="dtD" data-v="${k}" class="${D.d===k?'on':''}" ${D.st==='play'?'disabled':''}>${k[0].toUpperCase()+k.slice(1)}</button>`).join('')}</div></div><div><span>Çarpan</span><b>${D.m.toFixed(2)}×</b></div></div>
  ${D.st==='play'?`<div class="cz-act"><button class="cz-btn gold big" data-cz="dtCash" ${D.row?'':'disabled'}>KASAYA AL · ${eur(Math.round(D.bet*D.m))}</button></div>`:czBetBar(`<div class="cz-act"><button class="cz-btn gold big" data-cz="dtGo">TIRMANMAYA BAŞLA</button></div>`)}</div>`;};
CZA.dtD=el=>{CZ.dt.d=el.dataset.v;czRender();};
CZA.dtGo=()=>{const D=CZ.dt;if(!czBet(CZ.bet))return czRender();const [n,s]=DT_D[D.d];D.skulls=[...Array(8)].map(()=>[...Array(n)].map((_,i)=>i).sort(()=>Math.random()-0.5).slice(0,s));D.picks=[];D.row=0;D.m=1;D.st='play';D.bet=CZ.bet;CZ.res=null;czRender();};
CZA.dtTap=el=>{const D=CZ.dt;if(D.st!=='play')return;const i=+el.dataset.v,[n,s]=DT_D[D.d];D.picks[D.row]=i;if(D.skulls[D.row].includes(i)){D.st='boom';czResult(D.bet,0,`Ejderha Kulesi · ${D.row+1}. katta ejderha`);}else{D.m=Math.floor(D.m*0.97/((n-s)/n)*100)/100;D.row++;if(D.row>=8){D.st='cash';czResult(D.bet,Math.round(D.bet*D.m),'Ejderha Kulesi · ZİRVE!');}}czRender();};
CZA.dtCash=()=>{const D=CZ.dt;if(D.st!=='play'||!D.row)return;D.st='cash';czResult(D.bet,Math.round(D.bet*D.m),`Ejderha Kulesi ${D.m.toFixed(2)}×`);czRender();};
/* ---------- ŞANS ÇARKI ---------- */
const CK_V=[0,1.5,0,0,2,0,0,0,1.5,0,0,3,0,0,2,0,0,0,1.5,0,0,10,0,0];
const CK_C=v=>v===0?'#2b2f45':v>=10?'#f0b429':v>=4?'#e2559a':v>=2.5?'#7a3fd1':v>=1.8?'#2f6fd6':'#1f9d55';
CZV.ck=()=>{CZ.ck=CZ.ck||{rot:0,spin:false};const K=CZ.ck,n=CK_V.length,st=360/n,R=130;
  const seg=CK_V.map((v,i)=>{const a0=(i*st-90-st/2)*Math.PI/180,a1=((i+1)*st-90-st/2)*Math.PI/180;return `<path d="M0 0 L${R*Math.cos(a0)} ${R*Math.sin(a0)} A${R} ${R} 0 0 1 ${R*Math.cos(a1)} ${R*Math.sin(a1)}Z" fill="${CK_C(v)}" stroke="#111" stroke-width="1.5"/><text transform="rotate(${i*st}) translate(0 ${-R+22})" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${v?v+'×':'—'}</text>`;}).join('');
  return `<div class="cz-tbl dark ck"><svg viewBox="-150 -150 300 300" class="ck-svg"><circle r="146" fill="#d9b54a"/>${[...Array(24)].map((_,i)=>`<circle cx="${140*Math.cos(i*Math.PI/12)}" cy="${140*Math.sin(i*Math.PI/12)}" r="3" fill="#fff8d0"/>`).join('')}<g id="ckRot" style="transform:rotate(${K.rot}deg)">${seg}</g><circle r="18" fill="#111" stroke="#d9b54a" stroke-width="4"/><path d="M0 -128 l-12 -20 h24z" fill="#fff" stroke="#111" stroke-width="2"/></svg>
  ${czBetBar(`<div class="cz-act"><button class="cz-btn gold big" data-cz="ckSpin" ${K.spin?'disabled':''}>ÇARKI ÇEVİR</button></div>`)}</div>`;};
CZA.ckSpin=()=>{const K=CZ.ck;if(K.spin)return;if(!czBet(CZ.bet))return czRender();const bet=CZ.bet,n=CK_V.length,i=Math.floor(Math.random()*n),st=360/n,target=Math.ceil(K.rot/360)*360+360*5-i*st+(Math.random()-0.5)*st*0.6;K.spin=true;CZ.res=null;czRender();
  requestAnimationFrame(()=>{const g=document.getElementById('ckRot');if(g){g.style.transition='transform 4.2s cubic-bezier(.1,.65,.12,1)';g.style.transform=`rotate(${target}deg)`;}});
  setTimeout(()=>{K.rot=target;K.spin=false;czResult(bet,Math.round(bet*CK_V[i]),`Şans Çarkı ${CK_V[i]}×`);if(CZ.view==='ck')czRender();},4300);};
/* ---------- BAYİ: Sayısal Loto + iddaa kuponu ---------- */
CZ.cp=[];
function czBayi(){const g=czG(),F=betFixtures(),L=g.lastDraw,sel=CZ.cp,odds=sel.reduce((a,s)=>a*betOdds(F[s.i].h,F[s.i].a)[s.s],1);
  return `<div class="cz-bayi"><section class="cz-p"><h3>Sayısal Loto</h3><p class="muted">6 sayı seç · kupon ${eur(5)} · çekiliş çarşamba ve cumartesi · 6 bilen ${eur(2500000)}</p><div class="lt-g">${[...Array(49)].map((_,i)=>`<button class="lt-n ${(GB.lt||[]).includes(i+1)?'on':''}" data-cz="ltP" data-v="${i+1}">${i+1}</button>`).join('')}</div><div class="cz-row"><button class="cz-btn" data-cz="ltR">Rastgele</button><button class="cz-btn gold" data-cz="ltB" ${(GB.lt||[]).length===6?'':'disabled'}>Kuponu yatır (nakit)</button></div>${g.lotto.length?`<p class="muted">Bekleyen ${g.lotto.length} kupon</p>`:''}${L?`<p class="muted">Son çekiliş: ${L.D.join(' - ')} · ${L.tot?'ikramiye '+eur(L.tot):'ikramiye yok'}</p>`:''}</section>
  <section class="cz-p"><h3>Maç bahsi · kupon</h3><p class="gb-warn">⚠ Futbolla ilgili meslekte maç bahsi yasaktır. Kupondaki her maç yakalanma riskini artırır; kendi takımının maçı en tehlikelisi.</p>
   ${F.length?`<div class="bh-l">${F.map((f,i)=>{const o=betOdds(f.h,f.a);return `<div class="bh-r ${f.h===G.club||f.a===G.club?'own':''}"><span class="bh-lg">${esc(LEAGUES[f.lid].short)}</span><b>${esc(CLUBS[f.h].short)} – ${esc(CLUBS[f.a].short)}</b>${o.map((x,j)=>`<button class="cz-o ${sel.some(s=>s.i===i&&s.s===j)?'on':''}" data-cz="cpT" data-i="${i}" data-s="${j}">${['1','X','2'][j]} <b>${x.toFixed(2)}</b></button>`).join('')}</div>`;}).join('')}</div>`:'<p class="muted">Şu an bahse açık maç yok.</p>'}
   <div class="cp-slip"><b>Kupon: ${sel.length} maç · toplam oran ${odds.toFixed(2)}</b><div class="cz-seg">${[20,100,500,2000,10000].map(v=>`<button data-cz="cpA" data-v="${v}" class="${CZ.cpA===v?'on':''}">${eur(v)}</button>`).join('')}</div><span>Olası kazanç: <b>${eur(Math.round((CZ.cpA||20)*odds))}</b></span><button class="cz-btn gold" data-cz="cpGo" ${sel.length?'':'disabled'}>Kuponu oyna (nakit)</button></div>
   ${g.cps.length?`<p class="muted">Açık kuponların: ${g.cps.map(c=>`${c.sel.length} maç · ${c.o.toFixed(2)} · ${eur(c.amt)}`).join(' | ')}</p>`:''}</section></div>`;}
CZA.ltP=el=>{GB.lt=GB.lt||[];const n=+el.dataset.v,i=GB.lt.indexOf(n);if(i>=0)GB.lt.splice(i,1);else if(GB.lt.length<6)GB.lt.push(n);czRender();};
CZA.ltR=()=>{GB.lt=[...Array(49)].map((_,i)=>i+1).sort(()=>Math.random()-0.5).slice(0,6);czRender();};
CZA.ltB=()=>{if((GB.lt||[]).length!==6)return;const g=czG();if(!gbPay(5))return toast('Nakit yetmiyor');gbHeat(1);g.lotto.push({n:GB.lt.slice().sort((a,b)=>a-b),d:G.s.day});GB.lt=[];save();toast('Kupon yatırıldı');czRender();};
CZA.cpT=el=>{const i=+el.dataset.i,s=+el.dataset.s,k=CZ.cp.findIndex(x=>x.i===i);if(k>=0){if(CZ.cp[k].s===s)CZ.cp.splice(k,1);else CZ.cp[k].s=s;}else{if(CZ.cp.length>=6)return toast('Kuponda en fazla 6 maç');CZ.cp.push({i,s});}czRender();};
CZA.cpA=el=>{CZ.cpA=+el.dataset.v;czRender();};
CZA.cpGo=()=>{const F=betFixtures(),g=czG(),amt=CZ.cpA||20;if(!CZ.cp.length)return;const sel=CZ.cp.map(x=>{const f=F[x.i];return f&&{lid:f.lid,w:f.w,h:f.h,a:f.a,sel:x.s,o:betOdds(f.h,f.a)[x.s]};}).filter(Boolean);if(!sel.length)return;if(!gbPay(amt))return toast('Nakit yetmiyor');gbHeat(6+sel.length);
  let pc=1,own=false;for(const s of sel){const o=s.h===G.club||s.a===G.club;own=own||o;pc*=1-(o?0.35:s.lid===G.s.league?0.14:0.06)*(1+g.caught*0.5);}CZ.cp=[];
  if(Math.random()<1-pc){czClose();betCaught(own);return;}const o=Math.round(sel.reduce((a,s)=>a*s.o,1)*100)/100;g.cps.push({sel,o,amt,d:G.s.day});save();toast(`Kupon yatırıldı · oran ${o}`);czRender();};
function cpSettle(){const g=czG(),S=G.s;if(!g.cps.length||!S)return;const keep=[];for(const c of g.cps){let lost=false,pend=false;for(const b of c.sel){let rd=null;if(b.lid===S.league)rd=S.results[b.w];else if(LEAGUES[b.lid]){const o=olSync(b.lid);rd=o&&o.res[b.w];}const res=rd&&rd.find(x=>x[0]===b.h&&x[1]===b.a);if(!res){pend=true;continue;}const r=res[2]>res[3]?0:res[2]===res[3]?1:2;if(r!==b.sel)lost=true;}
    if(lost){g.lost+=c.amt;msg('event','Kupon yattı',`${c.sel.length} maçlık kuponun tutmadı (${eur(c.amt)}).`);continue;}if(pend){if(G.phase!=='off')keep.push(c);continue;}const p=Math.round(c.amt*c.o);gbWin(p);g.won+=p-c.amt;msg('event','KUPON TUTTU!',`${c.sel.length} maçlık kuponun tuttu: ${eur(c.amt)} → ${eur(p)}.`);}g.cps=keep;}
/* ---------- genel aksiyonlar ---------- */
Object.assign(CZA,{close:()=>czClose(),lobby:()=>{czStop();CZ.view='lobby';CZ.res=null;czRender();},go:el=>{czStop();CZ.view=el.dataset.v;CZ.res=null;czRender();},
  floor:el=>{const i=+el.dataset.v;if(!czUnl(i))return toast(`${CZF[i].need} VIP puan gerekli`);CZ.floor=i;CZ.bet=CZF[i].min;czRender();},
  game:el=>{const k=el.dataset.v,G0=CZG[k];if(!czUnl(G0.f))return toast(`${CZF[G0.f].n} için ${CZF[G0.f].need} VIP puan gerekli`);if(CZ.floor<G0.f){CZ.floor=G0.f;CZ.bet=CZF[G0.f].min;}CZ.view=k;CZ.res=null;if(k==='cr')CZ.after=crDraw;if(k==='pk')CZ.after=pkDraw;czRender();},
  chip:el=>{CZ.bet=+el.dataset.v;czRender();if(CZ.view==='cr')setTimeout(crDraw,10);if(CZ.view==='pk')setTimeout(pkDraw,10);},
  bx:el=>{const F=czFl();CZ.bet=clamp(Math.round(CZ.bet*+el.dataset.v),F.min,F.max);czRender();if(CZ.view==='cr')setTimeout(crDraw,10);if(CZ.view==='pk')setTimeout(pkDraw,10);},
  buy:el=>{const v=+el.dataset.v,g=czG();if(!gbPay(v))return toast('Nakit yetmiyor');g.ch+=v;save();toast(`${eur(v)} fiş alındı`);czRender();},
  cash:()=>{const g=czG();if(g.ch<1)return;gbWin(g.ch);toast(`${eur(Math.round(g.ch))} nakde çevrildi`);g.ch=0;save();czRender();},
  loan:el=>{const v=+el.dataset.v,g=czG();g.ch+=v;g.debt+=Math.round(v*1.3);g.due=Math.max(g.due||0,absDay()+14);g.loans=(g.loans||0)+1;gbHeat(8);msg('event','Tefeciden borç',`Tefeci Kemal’den ${eur(v)} aldın. ${eur(Math.round(v*1.3))} borcunu 14 gün içinde ödemelisin.`);save();czRender();},
  pay:el=>{const g=czG();if(g.debt<=0)return;if(el.dataset.v==='ch'){const p=Math.min(g.ch,g.debt);g.ch-=p;g.debt-=p;}else{const have=U2E(G.p.money),p=Math.min(have,g.debt);G.p.money-=E2U(p);g.debt-=p;}g.debt=Math.round(g.debt);if(g.debt<=0){g.debt=0;g.due=0;toast('Borcunu kapattın');}save();czRender();},
  item:el=>{const k=el.dataset.v,g=czG(),c=CZ_IT[k][1];if(g.vip<c)return;g.vip-=c;g.items[k]++;save();toast(CZ_IT[k][0]+' alındı');czRender();},
  geri:()=>{const g=czG();if(!g.items.geri||!g.lossT)return;g.items.geri--;g.ch+=g.lossT.v;g.lost-=g.lossT.v;toast(`⟲ ${eur(g.lossT.v)} geri sarıldı`);g.lossT=null;save();czRender();}});
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-cz]');if(!b||b.disabled)return;const f=CZA[b.dataset.cz];if(f){e.preventDefault();try{f(b);}catch(err){console.warn(err);}}});
/* tefeci vadesi ve kupon sonuçları */
function tefDay(){const g=czG();if(g.debt<=0||!g.due||absDay()<=g.due)return;g.debt=Math.round(g.debt*1.02);if(g.punT&&absDay()<g.punT)return;g.punT=absDay()+5;
  const take=Math.min(U2E(G.p.money),g.debt);if(take>0){G.p.money-=E2U(take);g.debt-=Math.round(take);}
  if(g.debt<=0){g.debt=0;g.due=0;msg('event','Tefecinin adamları geldi','Kapına dayanan adamlar borcun karşılığını hesabından zorla tahsil etti.');return;}
  const nm=G.p.name||'Oyuncu';msg('gundem','Tefecinin adamları seni sıkıştırdı',`${nm} gece yarısı otoparkta tefecinin adamlarının saldırısına uğradı. Borç: ${eur(Math.round(g.debt))}.`);gbHeat(25);
  if(isPl()){G.p.morale=clamp(G.p.morale-15,0,100);G.p.energy=clamp(G.p.energy-30,0,100);if(!G.p.injury&&Math.random()<0.5){G.p.injury=rollInjury(0.7);msg('injury','Darp sonucu sakatlık',`${G.p.injury.name}. Yaklaşık ${injTxt(G.p.injury)} sahalardan uzaktasın.`);}if(typeof imHit==='function')imHit(10);}
  else if(G.mode==='mgr'&&G.m){G.m.rep=clamp((G.m.rep||40)-5,5,95);G.m.conf=clamp(G.m.conf-8,0,100);}else if(G.job){G.job.rep=clamp(G.job.rep-6,0,100);}
}
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(G&&G.gb){tefDay();if(G.s&&G.phase==='season')cpSettle();}}catch(e){console.warn(e);}return out;})(nextDay);
ACTX.gbOpen=()=>czOpen();

