/* ================= v75: futbolcu maçında rakip hocanın maç içi hamleleri + maçın havası maç günü tahminiyle aynı ================= */
const WX_PL={yagmur:'yagmur',saganak:'yagmur',kar:'kar',ruzgar:'ruzgar'};
startMatch=(old=>function(cfg){const r=old.apply(this,arguments);try{if(typeof MR!=='undefined'&&MR&&cfg){
    if(cfg.wx){const k=WX_PL[cfg.wx.k]||'acik';MR.wx=k;MR.wind=k==='ruzgar'?(MR.wind||rnd(-2.4,2.4)):0;const li=$('#mvFeed li span');if(li){li.innerHTML=li.innerHTML.replace(/ (Yağmur yağıyor|Kar yağıyor|Sert rüzgâr var)[^]*$/,'')+' '+esc(wxTxt(cfg.wx))+'.';}}
    MR.oai={co:CLUBS[cfg.opp&&cfg.opp.id]?oaiCoachN(cfg.opp.id):'Rakip hoca',f:{},pi:0};
    if(cfg.mk)setTimeout(()=>{try{feed(1,`🧠 ${esc(MR.oai.co)} ${meFs('dat')} adam adama markaj koydu; her topta yanında bir savunmacı var.`,'');}catch(e){}},300);}}catch(e){console.warn(e);}return r;})(startMatch);
function mrOpp(){const A=MR&&MR.oai;if(!A||MR.national)return;const m=MR.min,d=MR.go-MR.gu,F=A.f,co=esc(A.co),ins=(ev)=>{let i=MR.ei;while(i<MR.events.length&&MR.events[i].m<=ev.m)i++;MR.events.splice(i,0,ev);};
  /* rakip geride: hücuma kalkar → hem rakip baskısı hem oyuncuya kontra alanı */
  if(m>=55&&d<0&&!F.atk){F.atk=1;feed(m,`🧠 ${co} hücuma kalktı: bir savunmacıyı çıkarıp forvet soktu. Arkada boşluklar oluşacak.`,'');if(Math.random()<0.4)ins({m:rint(m+3,88),k:'opp'});if(Math.random()<0.75)ins({m:rint(m+4,89),k:'ch',type:'atak'});}
  /* rakip önde: geri çekilir, zaman geçirir */
  if(m>=68&&d>0&&!F.def){F.def=1;feed(m,`🧠 ${co} skoru korumak için bloğunu geriye çekti; her duran topta zaman geçiriyorlar.`,'');for(let i=MR.ei;i<MR.events.length;i++){const e=MR.events[i];if(e.k==='us'&&Math.random()<0.3)e.k='blk';}MR.end+=1;}
  /* skor eşit, son bölüm: rakip risk alır ya da beraberliğe razı olur */
  if(m>=75&&d===0&&!F.eq){F.eq=1;if(Math.random()<0.5){feed(m,`🧠 ${co} galibiyet için son kozlarını oynuyor; iki forvetle baskı kuruyor.`,'');if(Math.random()<0.35)ins({m:rint(m+2,89),k:'opp'});if(Math.random()<0.5)ins({m:rint(m+3,89),k:'ch',type:'atak'});}else feed(m,`🧠 ${co} beraberliğe razı görünüyor; takım geriye yaslandı.`,'');}
  /* oyuncu gol attıysa: ikinci adam */
  if(m>=25&&MR.goals>=1&&!F.dbl&&onPitch()){F.dbl=1;feed(m,`🧠 ${co} ${meFs('gen')} yanına ikinci bir oyuncu verdi; boş alan bulmak zorlaşacak.`,'');for(let i=MR.events.length-1;i>=MR.ei;i--){const e=MR.events[i];if(e.k==='ch'&&!['savunma','dkorner'].includes(e.type)){MR.events.splice(i,1);break;}}}
  /* devre arası: geride olan rakip konuşma yapar */
  if(m>=46&&m<=47&&d<0&&!F.ht){F.ht=1;feed(46,`🧠 ${co} devre arasında soyunma odasında sert konuştu; rakip ikinci yarıya istekli başladı.`,'');if(Math.random()<0.3)ins({m:rint(48,60),k:'opp'});}}
mrStep=(old=>function(){try{if(typeof MR!=='undefined'&&MR&&MR.oai){const i0=MR.ei;mrOpp();}}catch(e){console.warn(e);}const i0=typeof MR!=='undefined'&&MR?MR.ei:0;const r=old.apply(this,arguments);
  try{if(MR&&MR.events)for(let i=i0;i<MR.ei;i++){const e=MR.events[i];if(e&&e.k==='blk')feed(e.m,`${esc(MR.us.name)} kapanan savunmaya çarptı; pozisyon son anda bloke edildi.`,'');}}catch(e){}return r;})(mrStep);

