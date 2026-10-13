/* ================= v77: sosyal medya ve takipçi — paylaşımlar taraftar sevgisini, sponsorlukları ve takipçiyi etkiler; yanlış paylaşım kriz çıkarır ================= */
const SMP={
  idman:{n:'Antrenman fotoğrafı',ic:'🏋️',d:'Güvenli. Taraftar çalıştığını görür.',v:1,love:1,risk:0},
  tes:{n:'Taraftara teşekkür',ic:'🙏',d:'Maçtan sonra en çok etkileşim alan paylaşım.',v:1.3,love:3,risk:0},
  aile:{n:'Aile ve özel hayat',ic:'❤️',d:'Takipçi kazandırır, imajı yumuşatır.',v:1.4,love:1,img:1,risk:0},
  yardim:{n:'Yardım kampanyası',ic:'🤝',d:'İmajın ve şöhretin artar.',v:1.1,love:2,img:4,fame:0.6,risk:0},
  spn:{n:'Sponsor paylaşımı',ic:'💼',d:'Sponsor ödemesi alırsın; sık yaparsan takipçi sıkılır.',v:0.7,love:-1,risk:0,spn:1},
  gece:{n:'Gece hayatı fotoğrafı',ic:'🍸',d:'Viral olabilir ama hoca ve basın tepki gösterebilir.',v:1.8,love:0,risk:0.3},
  laf:{n:'Rakibe laf sokma',ic:'🔥',d:'Çok etkileşim alır; disiplin ve taraftar krizi riski yüksek.',v:2.4,love:2,risk:0.38},
  hoca:{n:'Hocaya sitem',ic:'😤',d:'Forma alamıyorsan duygularını paylaşırsın; çok riskli.',v:2,love:-1,risk:0.6}};
const SMM={tes:{n:'Taraftara teşekkür',ic:'🙏',d:'Taraftar memnuniyeti artar.',v:1.2,risk:0},idman:{n:'İdmandan kareler',ic:'📸',d:'Güvenli, medya ilişkisi biraz artar.',v:1,risk:0},
  laf:{n:'Rakibe gönderme',ic:'🔥',d:'Taraftar coşar; rakip ve federasyon tepki gösterebilir.',v:2.2,risk:0.35},hakem:{n:'Hakem eleştirisi',ic:'📺',d:'Taraftar destekler ama disiplin riski yüksek.',v:2,risk:0.5}};
function smOn(){return G&&G.s&&(isPl()||G.mode==='mgr');}
function smInit(){if(!G.sm){const f=isPl()?G.p.fame:(G.m&&G.m.rep)||30;G.sm={fol:Math.round(smTarget(f)*0.8),love:55,eng:0.05,posts:[],last:-9,ban:0,inc:0,n:{}};}return G.sm;}
function smTarget(f){return Math.round(800*Math.exp(f/9));}
function smHandle(){const n=(isPl()?(G.p.name||'oyuncu'):coachOf(G.club).n)||'futbol';return '@'+n.toLocaleLowerCase('tr-TR').replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u').replace(/[^a-z0-9]/g,'')+(isPl()?'':'_official');}
const smK=n=>n>=1e6?`${(n/1e6).toFixed(1).replace('.',',')} Mn`:n>=1e3?`${String(Math.round(n/100)/10).replace('.',',')} bin`:String(n);
const SM_COM={pos:['Kralsın! 👑','Bu forma sana yakışıyor','Seninle gurur duyuyoruz','Efsane yolunda 🔥','Her maç böyle oyna!'],neg:['Önce sahada göster','Bunu paylaşma vakti mi?','Takıma odaklan artık','Hayal kırıklığı…'],vir:['Bu paylaşım her yerde! 😂','Tarih yazdın','Gündem oldun yine']};
function smPost(k){const S=smInit(),T=(isPl()?SMP:SMM)[k];if(!T)return;if(S.ban>G.s.day)return toast(`Kulüp sosyal medya yasağı koydu (${S.ban-G.s.day} gün)`);if(S.last===G.s.day)return toast('Bugün zaten paylaşım yaptın');
  if(k==='spn'&&!(imInit().deals||[]).length)return toast('Paylaşım yapacağın bir sponsorun yok');
  S.last=G.s.day;S.n[k]=(S.n[k]||0)+1;const rep=S.posts.filter(p=>p.k===k&&G.s.day-p.d<10).length,fatigue=1/(1+rep*0.6);
  const vir=Math.random()<0.05*T.v,base=S.fol*S.eng*T.v*fatigue*(0.6+Math.random()*0.8)*(vir?6:1),likes=Math.round(base),gain=Math.round(S.fol*(0.004*T.v*fatigue+(vir?0.06:0))*(0.5+Math.random()));
  S.fol+=gain;let txt='',cr=null;const crisis=Math.random()<(T.risk||0);
  if(isPl()){S.love=clamp(S.love+(T.love||0)*fatigue+(vir?3:0),0,100);if(T.img)imInit().v=clamp(imInit().v+T.img,0,100);if(T.fame)G.p.fame=clamp(G.p.fame+T.fame,0,100);if(k==='idman')G.p.trust=clamp(G.p.trust+0.5,0,100);
    if(T.spn){const pay=Math.round(Math.min(40000,S.fol*0.015+500)/50)*50;G.p.money+=E2U(pay);S.inc+=pay;txt=` Sponsor ödemesi: ${eur(pay)}.`;}
    if(crisis)cr=smCrisisPl(k);}
  else{const m=trInit();if(k==='tes')m.fans=clamp(m.fans+2,0,100);if(k==='idman')m.media=clamp((m.media||50)+1,0,100);if(k==='laf'||k==='hakem')m.fans=clamp(m.fans+2,0,100);if(crisis)cr=smCrisisMgr(k);}
  const com=pick(vir?SM_COM.vir:cr?SM_COM.neg:SM_COM.pos);S.posts.unshift({d:G.s.day,k,likes,gain,vir:vir?1:0,cr:cr?1:0,com});if(S.posts.length>30)S.posts.length=30;
  try{feedAdd({src:isPl()?(meN()):coachOf(G.club).n,h:smHandle(),cat:'fan',mood:cr?-1:1,txt:`${T.ic} ${T.n}${cr?'':' · '+smK(likes)+' beğeni'}`});}catch(e){}
  toast(cr?'Paylaşımın kriz çıkardı!':vir?`Viral oldu! +${smK(gain)} takipçi`:`${smK(likes)} beğeni · +${smK(gain)} takipçi`+txt);save();render();}
function smCrisisPl(k){const S=G.sm,fine=Math.round(clamp(OVR()*150,1000,60000)/500)*500;G.p.money-=E2U(fine);S.ban=G.s.day+7;imHit(k==='hoca'?8:5);
  const t={gece:['Gece hayatı paylaşımı olay oldu',`Maç haftası gece kulübünde çekilen fotoğrafın gündem oldu. Hoca: “Profesyonellik bunu gerektirmez.”`,()=>{G.p.trust=clamp(G.p.trust-6,0,100);}],
    laf:['Laf sokma paylaşımı kriz çıkardı',`Rakibe yönelik paylaşımın federasyonun dikkatini çekti; taraftar grupları birbirine girdi.`,()=>{G.p.trust=clamp(G.p.trust-3,0,100);if(G.riv&&typeof rivEv==='function')rivEv(`${G.p.name}, sosyal medyada ${G.riv.n}’e gönderme yaptı; ortalık karıştı.`);}],
    hoca:['Hocaya sitem eden paylaşım',`Forma alamadığını ima eden paylaşımın soyunma odasında bomba etkisi yarattı.`,()=>{G.p.trust=clamp(G.p.trust-12,0,100);try{for(const x of tmMates().slice(0,5))tmAdd(x.k,-3);}catch(e){}}]}[k]||['Paylaşım tepki çekti','Paylaşımın yanlış anlaşıldı.',()=>{}];
  t[2]();msg('board',t[0],`${t[1]} Kulüp ${eur(fine)} para cezası kesti ve 7 gün sosyal medya yasağı getirdi.`);try{feedAdd({src:'Magazin Manşet',h:'@magazinmanset',cat:'gen',txt:`${t[0]}: ${G.p.name}`});}catch(e){}return 1;}
function smCrisisMgr(k){const m=trInit(),S=G.sm;S.ban=G.s.day+7;m.media=clamp((m.media||50)-5,0,100);m.conf=clamp((m.conf||50)-3,0,100);const fine=Math.round(clamp(myClub().str*600,8000,60000)/1000)*1000;m.budget-=fine*EUR_TL;
  msg('board',k==='hakem'?'Hakem paylaşımına disiplin cezası':'Paylaşımın tepki çekti',`Sosyal medyadaki paylaşımın nedeniyle PFDK ${eur(fine)} para cezası verdi. Yönetim, bir hafta paylaşım yapmamanı istedi.`);return 1;}
/* haftalık: takipçi şöhrete yaklaşır, sosyal medya geliri */
function smWeek(){const S=smInit(),f=isPl()?G.p.fame:(G.m&&G.m.rep)||30,tg=smTarget(f)*(0.7+S.love/100*0.6);S.fol=Math.max(100,Math.round(S.fol+(tg-S.fol)*0.08));S.eng=clamp(0.03+S.love/1500+(G.s.day-S.last<7?0.01:-0.005),0.015,0.1);
  if(isPl()&&S.fol>=20000){const inc=Math.round(Math.min(25000,S.fol*0.0006)/10)*10;if(inc>0){G.p.money+=E2U(inc);S.inc+=inc;}}
  if(isPl()&&S.love<30&&Math.random()<0.2)msg('event','Taraftar sana kırgın','Sosyal medyada sana yönelik eleştiriler artıyor. Taraftarı yeniden kazanmak için teşekkür ve yardım paylaşımları işe yarayabilir.');}
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(smOn()&&G.phase==='season'){const S=smInit(),wk=wkKey();if(S.wk!==wk){S.wk=wk;smWeek();}}}catch(e){console.warn(e);}return out;})(nextDay);
/* maç sonrası: taraftar sevgisi sonuca göre */
applyPlayed=(old=>function(res,role,win,draw){const r=old.apply(this,arguments);try{if(isPl()&&G.sm){const S=G.sm;S.love=clamp(S.love+(win?1.2:draw?0:-1)+((res.rating||6.5)-6.7)*1.5+(res.goals||0)*1.5,0,100);S.fol+=Math.round(S.fol*0.002*(res.goals||0)*(1+G.p.fame/50));}}catch(e){}return r;})(applyPlayed);
/* sayfa */
function viewSm(){const S=smInit(),T=isPl()?SMP:SMM,ban=S.ban>G.s.day;
  const kpi=`<div class="fin-kpi"><div><span>Takipçi</span><b>${smK(S.fol)}</b><small>${S.posts[0]?`son paylaşım +${smK(S.posts[0].gain)}`:'henüz paylaşım yok'}</small></div><div><span>Taraftar sevgisi</span><b>${Math.round(S.love)}</b><small>${S.love>=70?'Çok seviliyorsun':S.love>=45?'İyi':S.love>=30?'Mesafeli':'Kırgın'}</small></div><div><span>Etkileşim</span><b>%${(S.eng*100).toFixed(1).replace('.',',')}</b></div>${isPl()?`<div><span>Sosyal medya geliri</span><b>${eur(S.inc)}</b><small>toplam</small></div>`:''}</div>`;
  return `<h2 class="h">Sosyal medya</h2><section class="panel sm-hd"><div class="sm-av">${esc((isPl()?G.p.name:coachOf(G.club).n||'?')[0])}</div><div><b>${esc(isPl()?G.p.name:coachOf(G.club).n)}</b><small>${esc(smHandle())} · ✔ doğrulanmış hesap</small></div></section>${kpi}
   ${ban?`<section class="panel sm-ban">🚫 Kulübün koyduğu sosyal medya yasağı ${S.ban-G.s.day} gün daha sürüyor.</section>`:''}
   <section class="panel"><p class="sub-h"><span>Paylaşım yap</span><span>günde 1</span></p><div class="sm-grid">${Object.entries(T).map(([k,x])=>`<button class="sm-b ${x.risk>=0.3?'risk':''}" data-act="smPost" data-k="${k}" ${ban||S.last===G.s.day?'disabled':''}><span>${x.ic}</span><b>${esc(x.n)}</b><small>${esc(x.d)}</small>${x.risk?`<em>Risk %${Math.round(x.risk*100)}</em>`:''}</button>`).join('')}</div>
   <p class="muted" style="margin:8px 0 0">Takipçi sayın şöhretinle birlikte büyür. Taraftar sevgisi yüksekken paylaşımların daha çok etkileşim alır${isPl()?'; 20 bin takipçiden sonra haftalık sosyal medya geliri başlar, sponsor paylaşımları ek ödeme getirir':''}. Riskli paylaşımlar viral olabilir ama kriz, para cezası ve paylaşım yasağı getirebilir.</p></section>
   <section class="panel"><p class="sub-h"><span>Paylaşımların</span><span>${S.posts.length}</span></p>${S.posts.length?`<ul class="sm-l">${S.posts.map(p=>{const x=T[p.k]||{n:p.k,ic:'•'};return `<li class="${p.cr?'cr':p.vir?'vir':''}"><span>${x.ic}</span><div><b>${esc(x.n)}</b><small>${twD(p.d)} · ♥ ${smK(p.likes)} · +${smK(p.gain)} takipçi${p.vir?' · VİRAL':''}${p.cr?' · KRİZ':''}</small><i>“${esc(p.com)}”</i></div></li>`;}).join('')}</ul>`:'<p class="muted">Henüz paylaşım yapmadın.</p>'}</section>`;}
ACTX.smPost=el=>smPost(el.dataset.k);
XICON.sm=NI('<rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10 18h4M9 8.5l2 2 4-4"/>');NICON.sm=XICON.sm;Object.assign(XV,{sm:()=>viewSm()});if(typeof UIG_MAP!=='undefined')UIG_MAP.sm='Ben';
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(smOn()&&!L.some(x=>x[0]==='sm'))L.push(['sm','Sosyal medya']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(smOn()){const g=C.find(x=>x[0]==='Kariyer')||C.find(x=>x[0]==='Oyuncu')||C.find(x=>x[0]==='Kulüp')||C[C.length-1];if(g&&!g[1].some(x=>x[0]==='sm'))g[1].push(['sm','Sosyal medya',{tab:'sm'}]);}}catch(e){}return C;})(navCats);

