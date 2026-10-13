/* ================= CANLI TÖREN ================= */
let BDC=null;
ACTX.bdoWatch=el=>{const R=bdoAll()[el.dataset.y];if(!R)return toast('Tören bulunamadı');closeModal&&$('#modal')&&!$('#modal').hidden&&closeModal();bdcOpen(R);};
function bdcPerson(x,kind){return `<div class="bdc-fig ${kind||''}"><div class="bdc-head">${bdoFace(x)}</div><i class="bdc-legs"></i></div>`;}
function bdcCard(x,cls,extra){const c=CLUBS[x.c];return `<div class="bdc-card ${cls||''}"><div class="bdc-cf">${bdoFace(x)}</div><b>${esc(x.n)}</b><small>${c?crestSVG(c,16)+' '+esc(c.short):''}${x.nat?' '+flagImg(x.nat,'fl-row'):''}</small>${extra?`<em>${extra}</em>`:''}</div>`;}
function bdcOpen(R){bdcClose(true);const el=document.createElement('div');el.id='bdc';el.className='bdc';document.body.appendChild(el);document.documentElement.classList.add('bdc-on');
  const H=R.hosts||BDO_HOSTS[0];
  el.innerHTML=`<div class="bdc-stage" id="bdcStage"><div class="bdc-arch"></div><div class="bdc-lights"><i></i><i></i><i></i></div><div class="bdc-screen" id="bdcScr"></div>
    <div class="bdc-floor"><div class="bdc-steps"></div><div class="bdc-lect"><span>BALLON D'OR</span></div><div class="bdc-ped" id="bdcPed">${BDO_BALL}</div></div>
    <div class="bdc-hosts">${bdcPerson({n:H[0],k:'host:'+H[0],nat:'ENG',age:45},'host h1')}${bdcPerson({n:H[1],k:'host:'+H[1],nat:'NED',age:55},'host h2')}</div>
    <div class="bdc-walk" id="bdcWalk"></div><div class="bdc-crowd" id="bdcCrowd">${Array.from({length:46},(_,i)=>`<i style="left:${(i%23)*4.4+1+(i>22?2:0)}%;bottom:${i>22?2:14}%;--d:${(i*37%10)/10}s"></i>`).join('')}</div><canvas id="bdcConf"></canvas></div>
   <div class="bdc-sub" id="bdcSub"><b></b><span></span></div>
   <div class="bdc-ctl"><span class="bdc-tit">${R.no}. Ballon d’Or · ${R.y}</span><button data-bdc="spd" id="bdcSpd">⏩ Hızlandır 1×</button><button data-bdc="end">⏭ Sona geç</button><button data-bdc="snd" id="bdcSnd">🔊</button><button data-bdc="leave" class="lv">🚪 Törenden ayrıl</button></div>`;
  el.addEventListener('click',e=>{const b=e.target.closest('[data-bdc]');if(!b)return;const a=b.dataset.bdc;if(a==='spd'){BDC.spd=BDC.spd>=4?1:BDC.spd*2;b.textContent=`⏩ Hızlandır ${BDC.spd}×`;}else if(a==='end')bdcJump();else if(a==='leave')bdcClose();else if(a==='snd'){BDC.snd=!BDC.snd;b.textContent=BDC.snd?'🔊':'🔇';try{localStorage.setItem('bdcSnd',BDC.snd?'1':'0');}catch(_){}}});
  let snd=true;try{snd=localStorage.getItem('bdcSnd')!=='0';}catch(_){}
  BDC={R,i:0,spd:1,t:null,snd,steps:bdcScript(R),conf:null};const sb=$('#bdcSnd');if(sb)sb.textContent=snd?'🔊':'🔇';R.seen=1;try{save();}catch(e){}
  for(const f of document.querySelectorAll('#bdcCrowd i'))f.style.animationDelay=f.style.getPropertyValue('--d');
  bdcNext();}
function bdcClose(silent){const S=BDC;if(S){clearTimeout(S.t);cancelAnimationFrame(S.raf);}BDC=null;const el=$('#bdc');if(el)el.remove();document.documentElement.classList.remove('bdc-on');try{if(window.speechSynthesis)speechSynthesis.cancel();}catch(e){}if(!silent){try{render();}catch(e){}}}
function bdcNext(){const S=BDC;if(!S)return;if(S.i>=S.steps.length)return;const st=S.steps[S.i++];try{st.f&&st.f();}catch(e){console.warn(e);}S.t=setTimeout(bdcNext,(st.d||1500)/S.spd);}
function bdcJump(){const S=BDC;if(!S)return;const j=S.steps.findIndex(s=>s.fin);if(j<0||S.i>j)return;clearTimeout(S.t);S.i=j;bdcWalk(null);bdcNext();}
function bdcSay(who,txt){const el=$('#bdcSub');if(!el)return;el.querySelector('b').textContent=who?who+':':'';const sp=el.querySelector('span');sp.textContent='';let i=0;clearInterval(bdcSay.iv);bdcSay.iv=setInterval(()=>{if(!BDC){clearInterval(bdcSay.iv);return;}i+=2;sp.textContent=txt.slice(0,i);if(i>=txt.length)clearInterval(bdcSay.iv);},18);}
function bdcScreen(h,cls){const el=$('#bdcScr');if(!el)return;el.className='bdc-screen '+(cls||'');el.innerHTML=h;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');}
function bdcWalk(x,txt){const w=$('#bdcWalk');if(!w)return;if(!x){w.innerHTML='';w.className='bdc-walk';return;}w.innerHTML=bdcPerson(x,'win')+(txt?`<span class="bdc-wn">${esc(txt)}</span>`:'');w.className='bdc-walk go';}
function bdcAward(on){const p=$('#bdcPed');if(p)p.classList.toggle('lift',!!on);}
function bdcSpot(on){const s=$('#bdcStage');if(s)s.classList.toggle('spot',!!on);}
/* sesler: WebAudio ile davul ve alkış */
let BDA=null;function bdcAudio(){if(!BDC||!BDC.snd)return null;try{BDA=BDA||new (window.AudioContext||window.webkitAudioContext)();if(BDA.state==='suspended')BDA.resume();return BDA;}catch(e){return null;}}
function bdcNoise(dur,vol,f0,f1,shape){const A=bdcAudio();if(!A)return;const n=Math.floor(A.sampleRate*dur),buf=A.createBuffer(1,n,A.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<n;i++){const t=i/n;let env=shape==='roll'?(0.35+0.65*t)*(0.6+0.4*Math.abs(Math.sin(i/A.sampleRate*2*Math.PI*14))):shape==='clap'?Math.min(1,t*8)*Math.pow(1-t,1.2)*(0.55+0.45*Math.random()*(Math.random()<0.02?2:1)):Math.pow(1-t,2);d[i]=(Math.random()*2-1)*env;}
  const src=A.createBufferSource();src.buffer=buf;const fl=A.createBiquadFilter();fl.type='bandpass';fl.frequency.setValueAtTime(f0,A.currentTime);fl.frequency.linearRampToValueAtTime(f1,A.currentTime+dur);fl.Q.value=0.7;const g=A.createGain();g.gain.value=vol;src.connect(fl);fl.connect(g);g.connect(A.destination);src.start();}
const bdcRoll=(d)=>bdcNoise(d||2,0.28,180,260,'roll'),bdcClap=(d)=>bdcNoise(d||3,0.35,1400,2200,'clap'),bdcHit=()=>bdcNoise(0.5,0.6,90,60,'hit');
/* konfeti */
function bdcConfetti(){const cv=$('#bdcConf');if(!cv||!BDC)return;const st=$('#bdcStage'),W=cv.width=st.clientWidth,H=cv.height=st.clientHeight,c=cv.getContext('2d');const P=Array.from({length:180},()=>({x:Math.random()*W,y:-Math.random()*H*0.6,vx:(Math.random()-0.5)*1.6,vy:1.5+Math.random()*2.6,r:Math.random()*6.28,s:4+Math.random()*5,col:['#f3c74a','#fff3b0','#ffffff','#d9a521','#ff6a5f','#7cc4ff'][Math.floor(Math.random()*6)]}));
  const t0=performance.now();const fr=now=>{if(!BDC)return;c.clearRect(0,0,W,H);for(const p of P){p.x+=p.vx*BDC.spd;p.y+=p.vy*BDC.spd;p.r+=0.1;c.save();c.translate(p.x,p.y);c.rotate(p.r);c.fillStyle=p.col;c.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);c.restore();}if(now-t0<9000)BDC.raf=requestAnimationFrame(fr);else c.clearRect(0,0,W,H);};BDC.raf=requestAnimationFrame(fr);}
/* senaryo */
function bdcScript(R){const H=R.hosts||BDO_HOSTS[0],S=[],me=R.top.findIndex(x=>x.me),cl=id=>CLUBS[id]?CLUBS[id].name:'';const say=(w,t,d)=>S.push({d:d||Math.max(2400,t.length*48),f:()=>bdcSay(w,t)});
  const pl=isPl(),meName=pl&&G.p?(G.p.name||'Cenk Kuşku'):(G&&G.p&&G.p.name)||'';
  S.push({d:2600,f:()=>{bdcScreen(`<div class="bdc-logo">${BDO_BALL}<b>BALLON D'OR</b><small>${R.no}. TÖREN · PARİS · THÉÂTRE DU CHÂTELET</small></div>`,'logo');bdcClap(3);}});
  say(H[0],`İyi akşamlar Paris, iyi akşamlar dünya! ${R.no}. Ballon d’Or törenine hoş geldiniz.`);
  say(H[1],`Bu gece ${R.season} sezonunun en iyilerini ödüllendireceğiz. Salonda futbolun bütün yıldızları var.`);
  if(me>=0)S.push({d:3200,f:()=>{bdcScreen(`<div class="bdc-cam">${bdcCard(R.top[me],'me','📷 Canlı · salonda')}</div>`,'cam');bdcSay(H[0],`Ve kameralarımız ${meName} üzerinde! Bu gece 30 aday arasında… Heyecan dorukta.`);}});
  if(G.mode==='mgr'&&R.cruyff.some(x=>x.me))S.push({d:3000,f:()=>{bdcScreen(`<div class="bdc-cam">${bdcCard(R.cruyff.find(x=>x.me),'me','📷 Canlı · Cruyff adayı')}</div>`,'cam');bdcSay(H[1],`Johan Cruyff Trophy adaylarından ${R.cruyff.find(x=>x.me).n} da salonda.`);}});
  const side=(title,L,line,extraF,spk)=>{if(!L||!L.length)return;S.push({d:3400,f:()=>{bdcScreen(`<p class="bdc-st">${title}</p><div class="bdc-row">${L.map(x=>bdcCard(x,'',extraF?extraF(x):'')).join('')}</div>`,'list');bdcSay(spk||H[0],line);}});
    S.push({d:2300,f:()=>{bdcSay(spk||H[1],'Zarf açılıyor… ve kazanan…');bdcRoll(2);}});
    const w=L[0];S.push({d:3600,f:()=>{bdcHit();bdcClap(3.5);bdcScreen(`<p class="bdc-st">${title}</p><div class="bdc-row">${L.map((x,i)=>bdcCard(x,i===0?'win':'dim',extraF?extraF(x):'')).join('')}</div>`,'list');bdcSay(spk||H[1],`${w.n}!${w.me?' Bu sensin! Sahneye çıkıyorsun!':''}`);bdcWalk(w,w.n);}});
    S.push({d:3000,f:()=>{bdcAward(true);bdcSay(w.n,w.me?'İnanılmaz bir duygu. Takım arkadaşlarıma, hocama ve aileme teşekkür ederim!':`Çok teşekkür ederim. Bu ödül takım arkadaşlarımın ve ${cl(w.c)||'kulübümün'} emeği.`);}});
    S.push({d:900,f:()=>{bdcAward(false);bdcWalk(null);}});};
  side('KOPA TROPHY · YILIN EN İYİ GENCİ',R.kopa,'Kopa Trophy, 21 yaş altındaki en iyi oyuncuya veriliyor. Adaylar ekranda.',x=>`${x.age} yaş · ${x.g} gol`);
  side('YASHIN TROPHY · YILIN EN İYİ KALECİSİ',R.yashin,'Efsanevi Lev Yaşin adına verilen ödül: dünyanın en iyi kalecisi kim?',x=>`${x.r} ort.`);
  if(R.muller[0])side('GERD MÜLLER TROPHY · GOL KRALI',[R.muller[0]].concat(R.muller.slice(1)),'Gerd Müller Trophy, sezonun en golcü oyuncusuna gidiyor.',x=>`${x.g} gol`);
  if(R.cruyff[0])side('JOHAN CRUYFF TROPHY · YILIN TEKNİK DİREKTÖRÜ',R.cruyff.map(x=>Object.assign({k:'co:'+x.n,age:52},x)),'Yılın teknik direktörü ödülü Johan Cruyff adına veriliyor.',x=>CLUBS[x.c]?esc(CLUBS[x.c].short):'');
  if(R.club)S.push({d:3200,f:()=>{bdcScreen(`<p class="bdc-st">YILIN KULÜBÜ</p><div class="bdc-club">${crestSVG(CLUBS[R.club],110)}<b>${esc(cl(R.club))}</b></div>`,'list');bdcSay(H[0],`Yılın kulübü: ${cl(R.club)}! Salon ayakta.`);bdcClap(2.5);}});
  say(H[1],'Ve şimdi gecenin en büyük anı. Ballon d’Or sıralamasını açıklıyoruz.',2600);
  for(let a=29;a>=10;a-=5){const grp=R.top.slice(Math.max(10,a-4),a+1).reverse();if(!grp.length)continue;S.push({d:2300,f:()=>{bdcScreen(`<p class="bdc-st">BALLON D’OR SIRALAMASI</p><ol class="bdc-lst">${grp.map(x=>{const i=R.top.indexOf(x);return `<li class="${x.me?'me':''}"><i>${i+1}</i>${CLUBS[x.c]?crestSVG(CLUBS[x.c],18):''}<b>${esc(x.n)}</b><em>${x.pts}</em></li>`;}).join('')}</ol>`,'list');if(grp.some(x=>x.me))bdcSay(H[0],`${meName}, ${R.top.findIndex(x=>x.me)+1}. sırada!`);}});}
  for(let i=Math.min(9,R.top.length-1);i>=3;i--){const x=R.top[i];S.push({d:2100,f:()=>{bdcScreen(`<p class="bdc-st">${i+1}. SIRA</p>${bdcCard(x,x.me?'me big':'big',`${x.pos==='KL'?x.ap+' maç · '+x.r+' ort.':x.g+' gol · '+x.a+' asist'} · ${x.pts} puan`)}`,'one');if(x.me)bdcSay(H[0],`${i+1}. sırada ${x.n}! Harika bir sezon.`);}});}
  const t3=R.top.slice(0,3);
  S.push({d:3400,fin:true,f:()=>{bdcWalk(null);bdcAward(false);bdcScreen(`<p class="bdc-st">PODYUM</p><div class="bdc-row">${t3.map(x=>bdcCard(x,x.me?'me':'','?')).join('')}</div>`,'list');bdcSay(H[0],'Podyumda üç isim kaldı. Salonda çıt çıkmıyor…');}});
  if(t3[2])S.push({d:3000,f:()=>{bdcScreen(`<p class="bdc-st">ÜÇÜNCÜ</p>${bdcCard(t3[2],t3[2].me?'me big':'big',`${t3[2].pts} puan`)}`,'one');bdcSay(H[1],`Üçüncü sırada… ${t3[2].n}!`);bdcClap(2);}});
  if(t3[1])S.push({d:3000,f:()=>{bdcScreen(`<p class="bdc-st">İKİNCİ</p>${bdcCard(t3[1],t3[1].me?'me big':'big',`${t3[1].pts} puan`)}`,'one');bdcSay(H[1],`İkinci sırada… ${t3[1].n}!`);bdcClap(2);}});
  S.push({d:3000,f:()=>{bdcSpot(true);bdcScreen(`<div class="bdc-logo">${BDO_BALL}<b>BALLON D’OR ${R.y}</b><small>Ödülü geçen yılın sahibi ${esc(R.pres)} takdim ediyor</small></div>`,'logo');bdcSay(R.pres,'Zarfı açıyorum… Ballon d’Or’un yeni sahibi…');bdcRoll(3);}});
  const W=t3[0];S.push({d:4200,f:()=>{bdcHit();bdcClap(5);bdcConfetti();bdcScreen(`<p class="bdc-st gold">BALLON D’OR ${R.y}</p>${bdcCard(W,(W.me?'me ':'')+'big gold',`${CLUBS[W.c]?esc(CLUBS[W.c].name):''} · ${W.pts} puan`)}`,'one win');bdcSay(R.pres,`${W.nat==='TUR'?W.n.toLocaleUpperCase('tr-TR'):W.n.toUpperCase()}!${W.me?' Türk futbolu için tarihî bir gece!':''}`);bdcWalk(W,W.n);}});
  S.push({d:3600,f:()=>{bdcAward(true);bdcSay(H[0],`${W.n} sahnede! Altın Top’u ${R.pres}’in elinden alıyor. Salon ayakta alkışlıyor.`);bdcClap(3);}});
  S.push({d:4200,f:()=>{bdcSay(W.n,W.me?'Bu ödülü bana inanan herkese, ailemden altyapı hocalarıma kadar herkese armağan ediyorum. Ve taraftarlarımıza: bu kupa sizin!':`Bu, hayatımın en özel gecesi. ${cl(W.c)||'Kulübüme'} ve takım arkadaşlarıma, bu ödülü birlikte kazandık.`);}});
  S.push({d:2600,f:()=>{bdcSay(H[1],`${R.no}. Ballon d’Or töreninin sonuna geldik. İyi geceler Paris!`);bdcClap(2);}});
  S.push({d:600000,f:()=>{const s=$('#bdcSub');if(s)s.insertAdjacentHTML('beforeend','<button class="cta sm bdc-fin" data-bdc="leave">Töreni kapat</button>');}});
  return S;}

