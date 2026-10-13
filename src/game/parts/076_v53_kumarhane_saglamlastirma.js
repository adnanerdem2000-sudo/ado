/* ================= v53: kumarhane sağlamlaştırma ================= */
/* animasyon yarıda kalırsa sonucu hemen ver, hiçbir oyun kilitli kalmasın */
function atFinish(){const A=CZ.at;if(!A||!A.run||!A.order)return;A.run=false;const k=A.pick,rank=A.order.indexOf(k),h=A.H[k],bet=A.bet;const win=A.type==='w'?rank===0:rank<=2,pay=win?Math.round(bet*(A.type==='w'?h.o:h.pl)):0;
  A.com=`Sıralama: ${A.order.slice(0,3).map((j,x)=>`${x+1}. ${A.H[j].n}`).join(' · ')}`;A.lastPos=A.pos;czResult(bet,pay,`At yarışı · ${h.n} ${rank+1}.`);A.H=atNew();A.pos=null;A.order=null;}
CZA.atRun=()=>{const A=CZ.at;if(A.run)return;if(!czBet(CZ.bet))return czRender();A.bet=CZ.bet;A.run=true;CZ.res=null;A.com='Ve start verildi!';
  const left=A.H.map((h,i)=>i),order=[];while(left.length){const j=wpick(left.map(i=>[i,A.H[i].p]));order.push(j);left.splice(left.indexOf(j),1);}A.order=order;
  const T=A.H.map((h,i)=>5.2+order.indexOf(i)*0.32+Math.random()*0.12),ph=A.H.map(()=>Math.random()*6);A.pos=A.H.map(()=>0);czRender();const t0=performance.now();
  const step=now=>{if(!A.run)return;const t=(now-t0)/1000;let lead=0;A.H.forEach((h,i)=>{const x=Math.min(1,Math.pow(t/T[i],1.05)+0.025*Math.sin(t*2.3+ph[i])*(1-Math.min(1,t/T[i])));A.pos[i]=Math.max(0,x);const el=document.getElementById('atH'+i);if(el)el.style.left=(A.pos[i]*88)+'%';if(A.pos[i]>A.pos[lead])lead=i;});
    const c=document.getElementById('atCom');if(c)c.textContent=t<1?'Ve start verildi!':A.pos[lead]<1?`Önde ${A.H[lead].n}! ${t>3.5?'Son düzlüğe giriliyor!':''}`:`${A.H[order[0]].n} çizgiyi ilk geçti!`;
    if(t<Math.max(...T)+0.4)CZ.raf=requestAnimationFrame(step);else{CZ.raf=null;atFinish();if(CZ.view==='at')czRender();}};
  CZ.raf=requestAnimationFrame(step);};
function pkSettleAll(){const P=CZ.pk;if(!P||!P.balls.length)return;for(const b of P.balls.splice(0)){const m=PK_M[b.risk][b.k];czResult(b.bet,Math.round(b.bet*m),`Plinko ${m}×`);}}
czStop=function(){if(CZ.raf)cancelAnimationFrame(CZ.raf);CZ.raf=null;try{if(CZ.cr&&CZ.cr.st==='fly')crCash();}catch(e){}try{if(CZ.at&&CZ.at.run)atFinish();}catch(e){}try{pkSettleAll();}catch(e){}};
/* rulet: masa boşken çevir uyarısı + hızlı bahis */
CZA.rlSpin=(old=>function(){const R=CZ.rl;if(R&&R.spin)return czMsg('Çark dönüyor, sonucu bekle');if(!R||!R.bets.length)return czMsg('Önce masaya fiş koy: bir sayıya, renge ya da tek/çift alanına dokun. Ya da “Hızlı bahis” düğmelerini kullan.');R.t0=Date.now();return old.apply(this,arguments);})(CZA.rlSpin);
CZA.rlQuick=el=>{const R=CZ.rl;if(!R||R.spin)return;R.bets=[{t:el.dataset.t,v:el.dataset.v,a:CZ.bet}];CZA.rlSpin();};
CZV.rl=(old=>function(){let h=old.apply(this,arguments);h=h.replace(/(<button class="cz-btn gold big" data-cz="rlSpin") disabled/,'$1');
  const q=`<div class="rl-quick"><span>Hızlı bahis (${eur(CZ.bet)}):</span>${[['rk','r','Kırmızı'],['rk','b','Siyah'],['tc','t','Tek'],['tc','c','Çift'],['n','0','Sıfır']].map(([t,v,l])=>`<button class="cz-btn ${t==='rk'?(v==='r'?'qr':'qb'):''}" data-cz="rlQuick" data-t="${t}" data-v="${v}" ${CZ.rl&&CZ.rl.spin?'disabled':''}>${l}</button>`).join('')}</div><p class="rl-help">Masada bir alana dokunduğunda seçili fiş oraya konur (birden çok alana oynayabilirsin), sonra ÇEVİR’e bas.</p>`;
  return h.replace('<div class="cz-bb">',q+'<div class="cz-bb">');})(CZV.rl);
/* blackjack ve diğer masalarda kısa yardım */
const CZ_HELP={bj:'Bahsini seç ve DAĞIT’a bas. 21’e yaklaşmaya çalış: Kart çek ya da Dur. 21’i geçersen kaybedersin.',sl:'Bahsini seç ve ÇEVİR’e bas. Ortadaki çizgide yan yana iki ya da üç aynı simge kazandırır.',at:'Önce bir ata dokun, Kazanan ya da İlk 3 seç, sonra YARIŞI BAŞLAT.',cr:'FIRLAT’a bas; çarpan yükselirken PARAYI ÇEK’e basarsan bahsin × çarpan kazanırsın. Top patlarsa bahsi kaybedersin.',pk:'Risk seç ve TOPU BIRAK. Top hangi kutuya düşerse bahsin o kadar katı ödenir.',mn:'Mayın sayısını seç, BAŞLA’ya bas, kutulara dokun. Her elmas çarpanı artırır; mayına basmadan KASAYA AL.',hl:'BAŞLA’ya bas; sonraki kart yüksek mi alçak mı tahmin et. Her doğru tahmin çarpanı büyütür.',dt:'TIRMANMAYA BAŞLA, her katta bir yumurta seç. Ejderhaya denk gelmeden KASAYA AL.',ck:'Bahsini seç ve ÇARKI ÇEVİR.'};
czRender=(old=>function(){old.apply(this,arguments);try{const el=document.getElementById('cz');const H=CZ_HELP[CZ.view];if(el&&H&&!el.querySelector('.cz-help')){const b=el.querySelector('.cz-b');if(b)b.insertAdjacentHTML('afterbegin',`<p class="cz-help">ℹ ${H}</p>`);}}catch(e){}})(czRender);
/* görünüm değişince takılı bayrakları temizle */
CZA.game=(old=>function(el){const r=old.apply(this,arguments);try{if(!CZ.raf){if(CZ.at&&CZ.at.run&&!CZ.at.order)CZ.at.run=false;}if(CZ.rl&&CZ.rl.spin&&CZ.rl.t0&&Date.now()-CZ.rl.t0>7000)CZ.rl.spin=false;}catch(e){}return r;})(CZA.game);
/* her tıklamayı güvenli çalıştır; hata olursa ekranda göster */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#cz [data-cz]');if(!b)return;b.classList.add('pressed');setTimeout(()=>b.classList.remove('pressed'),150);},true);
window.addEventListener('error',ev=>{try{const c=document.getElementById('cz');if(c&&!c.hidden)czMsg('Beklenmeyen hata: '+(ev.message||'bilinmiyor')+' — sayfayı yenileyip tekrar dene.');}catch(e){}});
/* kumarhane açıkken boşluk tuşu oyunu ilerletmesin */
window.addEventListener('keydown',e=>{const c=document.getElementById('cz');if(!c||c.hidden)return;if(e.key===' '&&!/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||'')){e.preventDefault();e.stopImmediatePropagation();}if(e.key==='Escape'){e.stopImmediatePropagation();czClose();}},true);
/* depolama yoksa (korumalı görünüm) "kayıt alanı doldu" uyarısı tekrar tekrar çıkmasın */
const lsOK=(()=>{try{localStorage.setItem('__t','1');localStorage.removeItem('__t');return true;}catch(e){return false;}})();
slotSave=(old=>function(){if(!lsOK){if(!slotSave.w){slotSave.w=1;try{toast('Bu görünümde kayıt yapılamıyor; sayfa kapanınca ilerleme kaybolur.');}catch(e){}}return;}return old.apply(this,arguments);})(slotSave);

