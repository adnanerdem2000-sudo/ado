/* ================= MATCH RUNNER ================= */
let MR=null;
const CH_NAME={drill:'Şut çalışması',atak:'Şut fırsatı',kontra:'Kontra atak',serbest:'Serbest vuruş',penalti:'Penaltı',savunma:'Rakip atak!',korner:'Korner',dkorner:'Rakip korner',tr_kos:'Koni parkuru',tr_top:'Top sürme parkuru'};
const CH_HINT={
  drill:'Kaleciyle baş başasın. Topu sür, açıyı bul, ŞUT’u basılı tutup bırak. Joystick’i yana iterek köşe seç.',
  atak:'Sol alttan joystick ile koş. ŞUT’u basılı tut, bırakınca vurur; joystick’i yana iterek köşe seç. Beyaz ok pasın kime gideceğini gösterir.',
  kontra:'Önün açık! KOŞ’u basılı tutup depar at. Kaleciyle karşı karşıya kalınca vur ya da koşan arkadaşına pas ver.',
  serbest:'Joystick ile nişangâhı oynat. ŞUT’u basılı tutarken joystick’i yana çekersen falso verirsin; noktalı çizgi topun yolunu gösterir.',
  penalti:'Joystick ile köşeyi seç, ŞUT’u basılı tut ve bırak. Güç çubuğu kırmızıya girerse top üstten gider.',
  savunma:'Rakip kalemize koşuyor! Önüne geç. MÜDAHALE ile ayakta, KAY ile kayarak topu al. Arkadan dalarsan faul ve kart riski var. PRES’i basılı tutarsan Cenk topu süren rakibi otomatik takip eder.',
  savunma_geri:'Rakip kontraya çıktı, sen geride kaldın! KOŞ’u basılı tutup geri dön, adamı yakala ve doğru anda MÜDAHALE et. Yetişince PRES’i basılı tutarsan Cenk onu otomatik takip eder.',
  korner_take:'Korneri sen kullanıyorsun. Joystick ile sarı halkayı ortalamak istediğin yere taşı, ORTA’yı basılı tut ve yeşil İDEAL bölgede bırak. Basılı tutarken yana çekersen falso verirsin.',
  korner_box:'Ceza sahasındasın. Marköründen sıyrılmak için hareket et, KOŞ ile ani çıkış yap. Top sarı halkaya düşerken KAFA’ya bas; joystick ile köşe seç.',
  dkorner:'Rakip korner kullanıyor. “ADAMIN” yazan oyuncuyu bırakma. Top sarı halkaya düşerken KAFA ile uzaklaştır.',
  tr_kos:'Turuncu konilerin arasından sırayla geç. KOŞ’u basılı tutarak depar at, ama kondisyonunu da kolla. Süre bitmeden parkuru tamamla.',
  tr_top:'Topla birlikte konilerin arasından geç, sonra kaleciyi geç ve vur. Hızlı sürersen top ayağından açılır.'};
function startMatch(cfg){
  const WX=(()=>{const mo=today().getUTCMonth(),r=Math.random();if((mo===11||mo<=1)&&r<0.12)return 'kar';if(r<0.3)return 'yagmur';if(r<0.42)return 'ruzgar';return 'acik';})();
  MR=Object.assign({wx:WX,wind:WX==='ruzgar'?rnd(-2.4,2.4):0,mom:0,min:0,gu:0,go:0,adj:0,goals:0,assists:0,tackles:0,yc:0,rc:0,injured:false,injKind:null,out:false,outMin:0,ei:0,fast:false,end:90+rint(1,4),timer:0,cond:clamp(G.p.energy,0,100)},cfg);
  const ev=[];for(let i=poisson(cfg.lamUs);i>0;i--)ev.push({m:rint(1,90),k:'us'});for(let i=poisson(cfg.lamOpp);i>0;i--)ev.push({m:rint(1,90),k:'opp'});
  cfg.chances.forEach(c=>ev.push({m:c.m,k:'ch',type:c.type}));if(cfg.role==='sub')ev.push({m:cfg.entry,k:'in'});if(cfg.injMin)ev.push({m:cfg.injMin,k:'inj'});ev.push({m:45,k:'ht'});
  const ord={in:0,ht:1,us:2,opp:2,ch:3,inj:4};ev.sort((a,b)=>a.m-b.m||ord[a.k]-ord[b.k]);MR.events=ev;
  openMatchView();$('#tabs').hidden=true;$('#mvStage').hidden=true;$('#mvFeed').innerHTML='';$('#mvDone').hidden=true;$('#mvFast').hidden=false;$('#mvFast').textContent='Hızlandır';
  renderBoard();
  const c0=Math.round(MR.cond);feed(0,(cfg.role==='start'?`Hakem başlama düdüğünü çaldı. Cenk Kuşku ilk 11’de, ${G.p.num} numaralı formayla sahada.`:'Hakem başlama düdüğünü çaldı. Cenk Kuşku yedek kulübesinde, ısınmaya hazır.')+` Kondisyonu %${c0}.${c0<50?' Yorgun başlıyor, depar ve sert şut zorlaşacak.':''}`+({yagmur:' Yağmur yağıyor: zemin kaygan, top hızlı kayıyor.',kar:' Kar yağıyor: top ağır, ayakta durmak zor.',ruzgar:' Sert rüzgâr var: havadan gelen toplar sapıyor.'}[MR.wx]||''),c0<50?'opp':'');
  MR.timer=setTimeout(mrStep,500);
}
const condCls=c=>c>=60?'':c>=30?'mid':'low';
function renderBoard(){const h=MR.home,a=MR.away,hs=MR.usHome?MR.gu:MR.go,as=MR.usHome?MR.go:MR.gu,cd=Math.round(MR.cond);
  $('#mvBoard').innerHTML=`<div class="team ${MR.usHome?'me':''}">${crestSVG(h,30)}<b>${esc(h.name)}</b></div><div class="mv-mid"><div class="mv-score">${hs}-${as}</div><div class="mv-min">${Math.min(MR.min,90)}’${MR.min>90?'+'+(MR.min-90):''}</div><div class="mv-comp">${esc(MR.comp)}</div></div><div class="team ${MR.usHome?'':'me'}">${crestSVG(a,30)}<b>${esc(a.name)}</b></div><div class="mv-cond"><span>Cenk · kondisyon</span><i><em class="${condCls(cd)}" style="width:${cd}%"></em></i><b>${MR.out?'Oyun dışı':MR.knock?cd+' · AĞRILI':cd<25?cd+' · YORGUN':cd}</b></div><div class="mv-mom"><span>Baskı</span><i>${[-3,-2,-1,0,1,2,3].map(v=>`<em class="${v===0?'z':''} ${(MR.mom||0)>0&&v>0&&v<=MR.mom?'u':''} ${(MR.mom||0)<0&&v<0&&v>=MR.mom?'d':''}"></em>`).join('')}</i><b>${{acik:'☀',yagmur:'🌧',kar:'❄',ruzgar:'💨'}[MR.wx]||''}</b></div>`;subBtn();}
function feed(m,txt,cls){const li=document.createElement('li');li.className=cls||'';li.innerHTML=`<i>${m?m+'’':'—'}</i><span>${txt}</span>`;const f=$('#mvFeed');f.prepend(li);}
const onPitch=()=>!MR.out&&(MR.role==='start'||MR.min>=MR.entry);
function mrStep(){
  while(MR.ei<MR.events.length&&MR.events[MR.ei].m<=MR.min){
    const e=MR.events[MR.ei++];
    if(e.k==='us'&&(MR.mom||0)<=-2&&Math.random()<0.3){feed(e.m,`${esc(MR.us.name)} bir atak geliştirdi ama baskı altındaki takım bitiremedi.`,'');continue;}
    if(e.k==='opp'&&(MR.mom||0)>=2&&Math.random()<0.3){feed(e.m,`${esc(MR.opp.name)} tehlikeli geldi, savunma son anda kapattı.`,'');continue;}
    if(e.k==='us'){MR.gu++;feed(e.m,`GOL! ${esc(MR.us.name)} — ${tmName()} ağları buldu.`,'us');renderBoard();}
    else if(e.k==='opp'){MR.go++;feed(e.m,`Gol. ${esc(MR.opp.name)} — ${esc(CLUBS[MR.opp.id]?teamScorer(MR.opp.id):'rakip forvet')} skoru değiştirdi.`,'opp');renderBoard();}
    else if(e.k==='ht'){MR.cond=Math.min(100,MR.cond+4);feed(45,`İlk yarı sona erdi. Cenk’in kondisyonu %${Math.round(MR.cond)}.`,'');}
    else if(e.k==='in'){if(!MR.out)feed(e.m,'Cenk Kuşku oyuna girdi! Hoca kenardan son talimatları verdi.','me');}
    else if(e.k==='inj'){if(onPitch()){MR.injured=true;MR.out=true;MR.outMin=e.m;feed(e.m,'Cenk Kuşku yerde kaldı… Sağlık ekibi sahada. Oyuna devam edemiyor.','opp me');}}
    else if(e.k==='ch'){if(!onPitch())continue;runChance(e);return;}
  }
  if(MR.min>=MR.end)return mrFinish();
  if(onPitch()){const p=G.p;MR.cond=Math.max(0,MR.cond-0.42*(1.25-p.a.fiz/200)*(p.up.diyet?0.9:1)*(p.age>=31?1.15:1)*(MR.knock?1.25:1));
    if(MR.knock&&Math.random()<0.0035*proneF()){MR.injured=true;MR.injKind='kas';MR.injSerious=true;MR.out=true;MR.outMin=MR.min;feed(MR.min,'Cenk’in ağrısı arttı, yere yığıldı. Sedyeyle oyundan çıkıyor; sakatlık ciddi görünüyor.','opp me');}
    else if(MR.cond<25&&Math.random()<0.0022*(25-MR.cond)/25*proneF()){MR.injured=true;MR.injKind='kas';MR.out=true;MR.outMin=MR.min;feed(MR.min,'Cenk Kuşku yorgunluktan arka adalesini tuttu. Oyuna devam edemiyor.','opp me');}
    else if(MR.min<88&&((MR.cond<14&&MR.min>=46)||MR.cond<6||(MR.knock&&MR.cond<30&&MR.min>=60))){MR.out=true;MR.outMin=MR.min;MR.subbed=true;feed(MR.min,MR.knock?'Hoca, topallayan Cenk’i oyundan aldı.':'Hoca, kondisyonu biten Cenk’i oyundan aldı.','me');}
    else if(!MR.knock&&MR.min>3&&Math.random()<0.0011*proneF()&&knockHit(MR.min,'Cenk ikili mücadelede sert bir darbe aldı.'))return;}
  MR.min++;renderBoard();MR.timer=setTimeout(mrStep,MR.fast?14:65);
}
const RES={
  injury:{t:'SAKATLANDI',adj:0,cls:'bad'},
  goal:{t:'GOOOL!',adj:1.1,us:1,cg:1,cls:'gold'},assist:{t:'ASİST!',adj:0.75,us:1,as:1,cls:'gold'},tmGoal:{t:'GOL!',adj:0.15,us:1,cls:'gold'},
  tmMiss:{t:'OLMADI',adj:0.05},saved:{t:'KALECİ ÇIKARDI',adj:0},wide:{t:'AUT',adj:-0.15,cls:'bad'},over:{t:'ÜSTTEN AUT',adj:-0.15,cls:'bad'},post:{t:'DİREK!',adj:0.05},
  blocked:{t:'BLOK',adj:-0.1,cls:'bad'},lost:{t:'TOP KAPTIRILDI',adj:-0.22,cls:'bad'},timeout:{t:'ATAK SÖNDÜ',adj:-0.15},offside:{t:'OFSAYT',adj:-0.1,cls:'bad'},
  fouled:{t:'FAUL KAZANDIN',adj:0.1,cls:'ok'},penWon:{t:'PENALTI!',adj:0.3,cls:'gold'},
  tackle:{t:'TOP KAPILDI!',adj:0.45,cls:'ok'},intercept:{t:'ARAYA GİRDİ!',adj:0.4,cls:'ok'},shotBlock:{t:'ŞUTU BLOKLADI!',adj:0.4,cls:'ok'},
  defOk:{t:'ATAK DURDURULDU',adj:0.1,cls:'ok'},oppMiss:{t:'AUT',adj:0.05},oppOff:{t:'OFSAYT',adj:0.1,cls:'ok'},
  foul:{t:'FAUL',adj:-0.2,cls:'bad'},penConceded:{t:'PENALTI GOLÜ',adj:-0.7,opp:1,cls:'bad'},penSaved:{t:'KALECİMİZ KURTARDI',adj:-0.3},
  conceded:{t:'GOL YEDİK',adj:-0.45,opp:1,cls:'bad'},gkSave:{t:'KALECİMİZ KURTARDI',adj:-0.05},
  cleared:{t:'UZAKLAŞTIRDILAR',adj:-0.05},gkClaim:{t:'KALECİ TOPLADI',adj:-0.05},clear:{t:'KAFAYLA UZAKLAŞTIRDI!',adj:0.35,cls:'ok'},
  trDone:{t:'PARKUR TAMAM!',adj:0,cls:'ok'},trMiss:{t:'KAPI KAÇTI',adj:0,cls:'bad'}};
const FEED_TXT={
  injury:()=>'Cenk Kuşku yerde kaldı; sağlık ekibi sahada.',
  goal:()=>pick(['Cenk Kuşku ağları havalandırdı!','Cenk Kuşku köşeye bıraktı, GOL!','Cenk Kuşku’dan müthiş bitiriş!']),
  assist:()=>`Cenk’in pasında ${tmName()} golü attı! ASİST.`,tmGoal:()=>`${tmName()} golü attı.`,
  tmMiss:()=>`${tmName()} vurdu ama gol olmadı.`,saved:()=>'Cenk’in şutunda kaleci gole izin vermedi.',wide:()=>'Cenk’in şutu az farkla auta gitti.',
  over:()=>'Cenk’in şutu üstten auta çıktı.',post:()=>'Cenk’in şutu direkten döndü!',blocked:()=>'Cenk’in vuruşu savunmadan döndü.',lost:()=>'Cenk topu kaptırdı.',
  timeout:()=>'Atak sonuçsuz kaldı.',offside:()=>'Yan hakem bayrağı kaldırdı: ofsayt.',fouled:()=>'Cenk’e faul yapıldı, serbest vuruş kazandık.',
  penWon:()=>'Ceza sahasında faul! Hakem penaltı noktasını gösterdi.',tackle:()=>'Cenk zamanlamasıyla topu kaptı, harika müdahale!',
  intercept:()=>'Cenk pas arasına girdi, topu kazandı!',shotBlock:()=>'Cenk şutun önüne attı kendini, harika blok!',defOk:()=>'Atak savuşturuldu.',
  oppMiss:()=>'Rakibin vuruşu hedefi bulmadı.',oppOff:()=>'Rakip forvet ofsayta düştü.',foul:()=>'Cenk faul yaptı.',
  penConceded:()=>'Cenk’in faulünde verilen penaltıdan gol çıktı.',penSaved:()=>'Cenk penaltıya sebep oldu ama kalecimiz kurtardı!',
  conceded:()=>'Rakip golü buldu.',gkSave:()=>'Kalecimiz rakibin vuruşunu kurtardı.',
  cleared:()=>'Rakip savunma topu uzaklaştırdı.',gkClaim:()=>'Kaleci havadan gelen topu rahat topladı.',clear:()=>'Cenk yükseldi, kafayla uzaklaştırdı!',
  trDone:()=>'Parkur tamamlandı.',trMiss:()=>'Parkurda kapı kaçtı.'};
const fsOK=()=>!!(document.fullscreenEnabled&&document.documentElement.requestFullscreen);
function enterFS(){if(!fsOK()||document.fullscreenElement)return;try{document.documentElement.requestFullscreen({navigationUI:'hide'}).catch(()=>{});}catch(_){}}
function toggleFS(){if(!fsOK())return toast('Bu görünümde tam ekran desteklenmiyor');if(document.fullscreenElement){document.exitFullscreen().catch(()=>{});}else enterFS();}
function openMatchView(){$('#match').hidden=false;document.documentElement.classList.add('playing');window.scrollTo(0,0);if(G&&G.autoFS!==false)enterFS();}
function closeMatchView(){$('#match').hidden=true;$('#match').classList.remove('live');document.documentElement.classList.remove('playing');}
function startMoment(type,C,title,done){
  $('#match').classList.add('live');
  const st=$('#mvStage');st.hidden=false;$('#mvFast').hidden=true;$('#mvSub').hidden=true;$('#mgTitle').textContent=title;
  const p=G.p;resetInput();
  MG.S=makeChance(type,C);mgSetup();MG.crowd=C.drill?[]:genCrowd(C);
  const t=camTarget();MG.cam.x=t.x;MG.cam.y=t.y;MG.shake=0;MG.padK=null;padCtx();
  $('#mgFace').innerHTML=avatarSVG(MG.S.cenk.kit.shirt,MG.S.cenk.kit.trim,p.num,p.age);
  const h=$('#mgHint');h.textContent=CH_HINT[type+'_'+(C.sub||'')]||CH_HINT[type];h.classList.remove('fade');void h.offsetWidth;h.classList.add('fade');
  mgFlash(CH_NAME[type].toUpperCase(),'',0);
  if(!G.tutSeen){MG.S.paused=true;$('#mgTut').hidden=false;}
  MG.S.done=res=>{st.hidden=true;$('#match').classList.remove('live');resetInput();done(res);};
  MG.last=0;MG.acc=0;cancelAnimationFrame(MG.raf);MG.raf=requestAnimationFrame(mgLoop);
}
function runChance(e){const p=G.p;if(e.pre)feed(e.m,e.pre,'');
  let sub=e.sub||null;if(!sub){if(e.type==='savunma'&&(p.pos==='FW'||p.pos==='KN')&&Math.random()<0.6)sub='geri';if(e.type==='korner')sub=(p.pos==='KN'||p.pos==='OS')?(Math.random()<0.75?'take':'box'):(Math.random()<0.15?'take':'box');}
  startMoment(e.type,{capt:cenkRole()==='Kaptan',wx:MR.wx,wind:MR.wind,sub,knock:!!MR.knock,cond:MR.cond,us:MR.us,opp:MR.opp,a:MR.knock?halfA(p.a):p.a,energy:p.energy,morale:p.morale,up:p.up,pos:p.pos,num:p.num,hurt:!!(p.injury&&p.playHurt)||!!MR.knock},`${e.m}’ · ${CH_NAME[e.type]}`,
    res=>{$('#mvFast').hidden=false;applyChance(res,e.m);if(!MR.pendKnock)MR.timer=setTimeout(mrStep,300);});}
function applyChance(res,m){
  const R=RES[res.code];MR.adj+=R.adj+(res.bonus||0)+(res.code==='tmMiss'&&res.fromCenk?0.1:0);
  {const c=res.code,up=['goal','assist','tmGoal','tackle','intercept','shotBlock','clear','penWon','fouled','gkSave'].includes(c),dn=['lost','conceded','foul','penConceded','offside','wide','over'].includes(c);MR.mom=clamp((MR.mom||0)+(up?1:dn?-1:0),-3,3);}if(res.cond!=null)MR.cond=res.cond;if(res.injured){MR.injured=true;MR.injKind=res.injKind||'darbe';}
  if(R.us)MR.gu++;if(R.opp)MR.go++;if(R.cg)MR.goals++;if(R.as)MR.assists++;if(res.code==='tackle'){MR.tackles++;if(Math.random()<0.015){MR.injured=true;}}
  let txt=res.code==='goal'&&res.hdr?pick(['Cenk Kuşku yükseldi, kafayla GOL!','Ortaya Cenk Kuşku’nun kafası değdi: GOL!']):FEED_TXT[res.code]();
  if(res.card==='Y'){MR.yc++;MR.adj-=0.3;if(MR.yc>=2){res.card='R';txt+=' İkinci sarıdan kırmızı kart!';}else txt+=' Sarı kart.';}
  if(res.card==='R'){MR.rc=1;MR.out=true;MR.outMin=m;MR.adj-=1;if(!/kırmızı/.test(txt))txt+=' Direkt kırmızı kart! Oyundan atıldı.';}
  if(MR.injured&&!MR.out){MR.out=true;MR.outMin=m;txt+=' Müdahale sonrası Cenk sakatlandı, kenara geldi.';}
  const kn=!MR.out&&!MR.knock&&((res.code==='fouled'||res.code==='penWon')&&Math.random()<0.18);
  feed(m,txt,(R.us?'us ':R.opp?'opp ':'')+'me');renderBoard();
  if(kn)knockHit(m,'Faulden sonra Cenk yerde kaldı.');
  if(MR.out&&res.code==='penWon'){if(Math.random()<0.76){MR.gu++;feed(m,`Penaltıyı ${tmName()} kullandı: GOL!`,'us');}else feed(m,'Penaltıyı kaleci kurtardı.','');renderBoard();}
  if(!MR.out){
    if(res.code==='penWon')MR.events.splice(MR.ei,0,{m,k:'ch',type:'penalti'});
    else if(res.code==='fouled'&&res.fkY!=null&&res.fkY<31)MR.events.splice(MR.ei,0,{m,k:'ch',type:'serbest'});
    else{const ch=MR.chain||0,c=res.code;let nx=null;
      if(ch<3){if(c==='lost'&&Math.random()<0.5)nx={type:'savunma',sub:'geri',pre:'Rakip topu kaptı ve hızla çıktı! Cenk geri koşuyor.'};
        else if((c==='tackle'||c==='intercept')&&Math.random()<0.35)nx={type:'kontra',pre:'Top kazanıldı, hızlı hücum!'};
        else if((c==='saved'||c==='blocked'||c==='tmMiss')&&Math.random()<0.3)nx={type:'korner',pre:'Top kornere çıktı.'};
        else if((c==='gkSave'||c==='shotBlock'||c==='defOk')&&Math.random()<0.22)nx={type:'dkorner',pre:'Rakip korner kazandı.'};}
      if(nx){MR.chain=ch+1;MR.events.splice(MR.ei,0,Object.assign({m,k:'ch'},nx));}
      else if(Math.abs(MR.mom)>=2&&Math.random()<0.38&&(MR.extra||0)<3&&m<84){MR.extra=(MR.extra||0)+1;const em=Math.min(89,m+rint(2,7)),up=MR.mom>0;
        const e2=up?{m:em,k:'ch',type:pick(['atak','atak','korner','kontra']),pre:'Takım baskı kuruyor, rakip kendi yarı sahasına gömüldü!'}:{m:em,k:'ch',type:pick(['savunma','savunma','dkorner']),pre:'Rakip üst üste ataklarla bastırıyor!'};
        let ix=MR.events.findIndex((x,i)=>i>=MR.ei&&x.m>em);if(ix<0)ix=MR.events.length;MR.events.splice(ix,0,e2);}}
  }
}
function mrFinish(){
  clearTimeout(MR.timer);
  const played=MR.role==='start'||(MR.entry&&MR.events.some(e=>e.k==='in')&&MR.end>=MR.entry&&!(MR.out&&MR.outMin&&MR.outMin<MR.entry));
  const startMin=MR.role==='start'?0:MR.entry,stop=MR.outMin||90,mins=Math.max(1,stop-startMin);
  const win=MR.gu>MR.go,draw=MR.gu===MR.go;
  let rating=6.0+(win?0.35:draw?0.05:-0.25)+MR.adj+gauss()*0.18+(mins<25?-0.1:0);rating=Math.round(clamp(rating,3,10)*10)/10;
  feed(MR.end,`Maç sona erdi: ${esc(MR.home.name)} ${MR.usHome?MR.gu:MR.go}-${MR.usHome?MR.go:MR.gu} ${esc(MR.away.name)}`,'');
  $('#mvFast').hidden=true;$('#mvSub').hidden=true;const d=$('#mvDone');d.hidden=false;d.focus();
  d.onclick=()=>{closeMatchView();$('#tabs').hidden=false;const r=MR;MR=null;r.onEnd({us:r.gu,opp:r.go,played,rating,goals:r.goals,assists:r.assists,yc:r.yc?1:0,rc:r.rc,injured:r.injured,injKind:r.injKind,injSerious:!!r.injSerious,knock:!!(r.knock||r.knockOff),mins,tackles:r.tackles,cond:r.cond});};
}

