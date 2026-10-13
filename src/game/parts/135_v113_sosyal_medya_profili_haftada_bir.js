/* ================= v113: sosyal medya profili — haftada bir paylaşım, canlı beğeni ve yorumlar, maç performansına göre tepki, günlük takipçi =================
   Instagram benzeri profil: başlık (yüz, takipçi, gönderi), paylaşım ızgarası, gönderi ayrıntısı (canlı beğeni sayacı, yorumlar), bildirimler, takipçi grafiği. */
const SM2={k:null,cap:0,live:null};
SMP.mac={n:'Maç sonu karesi',ic:'📸',d:'Son maçtan bir kare. Performansın iyiyse çok beğeni, kötüyse eleştiri alır.',v:1.5,love:2,risk:0,mac:1};
SMM.mac={n:'Maç sonu mesajı',ic:'📸',d:'Son maçı yorumla; sonuç iyiyse taraftar coşar, kötüyse tepki gelir.',v:1.4,risk:0,mac:1};
function smUser(seed){const cc=(LEAGUES[(myClub()||{}).league]||{}).cc||'TR',P=NAMEP[cc]||(typeof NAMEP2!=="undefined"&&NAMEP2[cc])||NAMEP.TR,r=srng('smu'+seed),f=P.f[Math.floor(r()*P.f.length)],l=P.l[Math.floor(r()*P.l.length)],c=myClub()||{short:'fc'};
  const low=x=>String(x).toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');
  const st=[()=>low(f)+'.'+low(l),()=>low(f)+low(l).slice(0,1)+Math.floor(r()*99),()=>low(c.short||c.name)+'_'+low(f),()=>low(f)+'_'+(1900+Math.floor(r()*125)),()=>'the'+low(f)+low(l).slice(0,3),()=>low(l)+'.'+low(c.short||'fc')];
  return {h:st[Math.floor(r()*st.length)](),hue:Math.floor(r()*360)};}
/* son lig maçı: sonuç, puan, gol, asist (oyuncuysa) */
function smLastM(){const S=smInit();const L=S.lastM;if(!L)return null;const days=G.s.day-L.d;if(days>10)return null;return Object.assign({days},L);}
function smMood(){const m=smLastM(),S=smInit();let v=(S.love-55)/60;if(m){const res=m.gf>m.ga?1:m.gf===m.ga?0:-1;let x=res*.7;if(m.pl){x+=(m.r-6.7)*.65+m.g*.45+m.a*.25-(m.rc?1:0);}else if(isPl())x-=.2;x*=Math.exp(-m.days/6);v+=x;}return clamp(v,-2,2);}
function smTrack(){try{const S=smInit(),R=G.s.results||[];if(S._rl==null){S._rl=R.length;S._ap=G.s.stats?G.s.stats.apps:0;return;}if(R.length>S._rl){const rd=R[R.length-1],m=rd.find(x=>x[0]===G.club||x[1]===G.club);
    if(m){const h=m[0]===G.club,gf=h?m[2]:m[3],ga=h?m[3]:m[2],opp=h?m[1]:m[0],ap=G.s.stats?G.s.stats.apps:0,pl=isPl()&&ap>S._ap;
      const fm=(G.p&&G.p.form)||[];S.lastM={d:G.s.day,gf,ga,opp,pl,r:pl?(fm[fm.length-1]||6.5):0,g:pl?(G.s.stats.goals-(S._gs||0)):0,a:pl?(G.s.stats.assists-(S._as||0)):0};
      /* maçtan sonra anlık takipçi hareketi */
      const mood=smMood();S.fol=Math.max(100,Math.round(S.fol*(1+0.004*mood)+(pl&&S.lastM.g?S.fol*0.003*S.lastM.g:0)));smNote(mood>0.6?`${gf}-${ga} sonrası profilin hareketlendi: yeni takipçiler geliyor`:mood<-0.6?`${gf}-${ga} sonrası profiline eleştiri yağıyor`:`${gf}-${ga} sonrası taraftarlar profilinde konuşuyor`,mood>0.6?1:mood<-0.6?-1:0);}
    S._rl=R.length;S._ap=G.s.stats?G.s.stats.apps:0;}S._gs=G.s.stats?G.s.stats.goals:0;S._as=G.s.stats?G.s.stats.assists:0;}catch(e){}}
function smNote(t,m){const S=smInit();S.notif=S.notif||[];S.notif.unshift({d:G.s.day,t,m:m||0});if(S.notif.length>40)S.notif.length=40;}
/* takipçi: her gün şöhrete doğru ilerler */
function smDay(){const S=smInit(),f=isPl()?G.p.fame:(G.m&&G.m.rep)||30,tg=smTarget(f)*(0.7+S.love/100*0.6),mood=smMood();const before=S.fol;
  S.fol=Math.max(100,Math.round(S.fol+(tg-S.fol)*0.012+S.fol*(0.0006*mood+(Math.random()-.5)*0.0012)));S.dayGain=S.fol-before;
  S.hist=S.hist||[];S.hist.push([absDay(),S.fol]);if(S.hist.length>120)S.hist.shift();}
smWeek=function(){const S=smInit();S.eng=clamp(0.03+S.love/1500+(G.s.day-S.last<7?0.01:-0.005),0.015,0.1);
  if(isPl()&&S.fol>=20000){const inc=Math.round(Math.min(25000,S.fol*0.0006)/10)*10;if(inc>0){G.p.money+=E2U(inc);S.inc+=inc;}}
  if(isPl()&&S.love<30&&Math.random()<0.2)msg('event','Taraftar sana kırgın','Sosyal medyada sana yönelik eleştiriler artıyor. Taraftarı yeniden kazanmak için teşekkür ve yardım paylaşımları işe yarayabilir.');};
nextDay=(old=>function(){const out=old.apply(this,arguments);try{if(smOn()&&G.phase==='season'){smTrack();smDay();}}catch(e){console.warn(e);}return out;})(nextDay);
/* başlık önerileri */
function smCaps(k){const m=smLastM(),c=myClub()||{name:''},o=m&&CLUBS[m.opp]?CLUBS[m.opp]:null,on=o?(o.short||o.name):'rakip',w=m&&m.gf>m.ga,l=m&&m.gf<m.ga,sc=m?`${m.gf}-${m.ga}`:'';
  const T={mac:m?(w?[`${sc}! 3 puan bizim 💪`,`Ne maçtı! ${c.short||c.name} ❤️`,m.pl&&m.g?`Gol${m.g>1?'ler':''} takımım için ⚽`:`Hep birlikte daha güçlüyüz`]:l?[`Kafalar yukarı, devam ediyoruz.`,`Bu sonuç bize yakışmadı. Özür dileriz.`,`Bir sonraki maça odaklanma vakti.`]:[`${sc}. Bir puan da puandır.`,`Daha fazlasını hak ettik.`,`Mücadele bitmez 💪`]):[`Sahaya dönmeye sabırsızlanıyorum`,`Yeni hafta, yeni hedefler`,`Hazırız!`],
    idman:['Çalışmaya devam 🏋️','Bugün de ter döktük','Bahane yok, sadece iş'],tes:['Destekleriniz için teşekkürler ❤️','Siz olmadan olmaz!','Tribünler muhteşemdi 🙏'],
    aile:['Ailemle güzel bir gün ❤️','En büyük destekçilerim','Biraz dinlenme vakti'],yardim:['Birlikte daha güçlüyüz 🤝','Destek olan herkese teşekkürler','Küçük bir iyilik büyük fark yaratır'],
    spn:['Yeni kramponlarımla sahadayım ⚡','Partnerime teşekkürler','Yeni sezon, yeni ekipman'],gece:['Güzel bir akşam 🍸','Arkadaşlarla','Hafta sonu modu'],
    laf:[`${on} taraftarına selamlar 😏`,'Sahada konuşuruz','Bazıları çok konuşuyor…'],hoca:['Sabırla bekliyorum…','Sahada olmak istiyorum','Her şey daha iyi olacak'],hakem:['Bu kararlar maçın kaderini değiştirdi','VAR nerede?','Söyleyecek söz yok…']};
  return (T[k]||['…','…','…']);}
/* gönderi görseli (stil sahibi küçük sahneler) */
function smImg(p,size){const c=myClub()||{c1:'#1f6feb',c2:'#fff'},c1=c.c1,c2=c.c2,k=p.k,sz=size||'100%';let face='';try{face=faceSVG(lookNow((G.p&&G.p.age)||25),{c1,c2,num:isPl()?(G.p.num||10):null,coach:!isPl()});}catch(e){}
  const fc=face.replace(/<svg [^>]*>/,'').replace(/<\/svg>$/,''),me=`<g transform="translate(30 22) scale(.4)">${fc}</g>`;
  const bg={mac:`<rect width="100" height="100" fill="#0d2a16"/><rect y="55" width="100" height="45" fill="#1f7a3a"/><path d="M0 55h100" stroke="#fff" stroke-width=".6" opacity=".5"/><g fill="${c1}" opacity=".85">${[...Array(18)].map((_,i)=>`<circle cx="${3+i*5.6}" cy="${12+(i%3)*5}" r="2.2"/>`).join('')}</g><g fill="${c2}" opacity=".5">${[...Array(18)].map((_,i)=>`<circle cx="${5+i*5.6}" cy="${24+(i%2)*4}" r="2"/>`).join('')}</g>`,
    idman:`<rect width="100" height="100" fill="#2f8f4e"/><g opacity=".25" fill="#fff">${[0,1,2,3].map(i=>`<rect x="${i*28}" y="0" width="14" height="100"/>`).join('')}</g><g fill="#ff7a1f">${[15,35,65,85].map(x=>`<path d="M${x-3} 92h6l-3-8z"/>`).join('')}</g>`,
    tes:`<rect width="100" height="100" fill="#151a26"/><g>${[...Array(40)].map((_,i)=>`<circle cx="${(i*13)%100}" cy="${8+Math.floor(i/8)*9}" r="2.4" fill="${i%3?c1:c2}" opacity=".85"/>`).join('')}</g><path d="M0 60h100v40H0z" fill="#1f7a3a"/>`,
    aile:`<rect width="100" height="100" fill="#f3d9c4"/><circle cx="80" cy="18" r="12" fill="#ffd27a" opacity=".8"/><path d="M0 70 Q50 58 100 70V100H0z" fill="#e8b996"/><text x="82" y="88" font-size="14">❤️</text>`,
    yardim:`<rect width="100" height="100" fill="#e9f4ff"/><circle cx="50" cy="50" r="40" fill="#bfe0ff"/><text x="74" y="90" font-size="16">🤝</text>`,
    spn:`<rect width="100" height="100" fill="#111"/><rect x="0" y="70" width="100" height="30" fill="${c1}"/><text x="50" y="92" text-anchor="middle" font-family="Barlow Condensed,Inter,sans-serif" font-weight="800" font-size="11" fill="#fff" letter-spacing="2">SPONSOR</text>`,
    gece:`<rect width="100" height="100" fill="#1a0f2e"/><g opacity=".7">${[...Array(10)].map((_,i)=>`<circle cx="${(i*23)%100}" cy="${(i*37)%60}" r="${3+i%4}" fill="${['#ff4fd8','#4fd8ff','#ffd24f'][i%3]}" opacity=".5"/>`).join('')}</g>`,
    laf:`<rect width="100" height="100" fill="#2a0d0d"/><text x="50" y="88" text-anchor="middle" font-size="22">🔥</text>`,
    hoca:`<rect width="100" height="100" fill="#3a3f48"/><rect x="0" y="66" width="100" height="10" fill="#22262d"/>`,
    hakem:`<rect width="100" height="100" fill="#13161c"/><rect x="62" y="12" width="26" height="18" rx="2" fill="#2d3748"/><text x="75" y="25" text-anchor="middle" font-size="8" fill="#fff" font-weight="800">VAR</text>`}[k]||`<rect width="100" height="100" fill="#1b2433"/>`;
  const m=p.m;const score=k==='mac'&&m?`<g><rect x="30" y="4" width="40" height="14" rx="3" fill="rgba(0,0,0,.65)"/><text x="50" y="14.5" text-anchor="middle" font-family="Barlow Condensed,Inter,sans-serif" font-weight="800" font-size="10" fill="#fff">${m.gf} - ${m.ga}</text></g>`:'';
  return `<svg viewBox="0 0 100 100" width="${sz}" height="${sz}" preserveAspectRatio="xMidYMid slice" style="display:block">${bg}${me}${score}</svg>`;}
/* paylaşım */
function smCanPost(){const S=smInit();if(S.ban>G.s.day)return [false,`Kulübün sosyal medya yasağı ${S.ban-G.s.day} gün daha sürüyor`];if(S.wkPost===wkKey()){const left=7-(absDay()%7);return [false,`Bu hafta paylaşım yaptın. Sonraki paylaşım ${left} gün sonra açılır.`];}return [true,''];}
smPost=function(k,capI){const S=smInit(),T=(isPl()?SMP:SMM)[k];if(!T)return;const ok=smCanPost();if(!ok[0])return toast(ok[1]);
  if(k==='spn'&&!(imInit().deals||[]).length)return toast('Paylaşım yapacağın bir sponsorun yok');if(T.mac&&!smLastM())return toast('Paylaşacak yakın tarihli bir maç yok');
  S.last=G.s.day;S.wkPost=wkKey();S.n[k]=(S.n[k]||0)+1;const rep=S.posts.filter(p=>p.k===k&&G.s.day-p.d<35).length,fatigue=1/(1+rep*0.45);
  const mood=smMood(),mf=T.mac?Math.exp(0.55*mood):Math.exp(0.3*mood),vir=Math.random()<0.05*T.v*(mood>1?1.6:1),base=S.fol*S.eng*T.v*fatigue*mf*(0.75+Math.random()*0.5)*(vir?5:1);
  const likes=Math.max(3,Math.round(base)),gain=Math.round(S.fol*(0.004*T.v*fatigue*Math.max(0.2,mf)+(vir?0.05:0))*(0.5+Math.random())*(mood<-1?0.3:1));
  S.fol+=gain;let txt='',cr=null;const crisis=Math.random()<(T.risk||0);
  if(isPl()){S.love=clamp(S.love+(T.love||0)*fatigue*(mood<-0.8&&!T.mac?0.4:1)+(vir?3:0)+(T.mac?mood*1.5:0),0,100);if(T.img)imInit().v=clamp(imInit().v+T.img,0,100);if(T.fame)G.p.fame=clamp(G.p.fame+T.fame,0,100);if(k==='idman')G.p.trust=clamp(G.p.trust+0.5,0,100);
    if(T.spn){const pay=Math.round(Math.min(40000,S.fol*0.015+500)/50)*50;G.p.money+=E2U(pay);S.inc+=pay;txt=` Sponsor ödemesi: ${eur(pay)}.`;}if(crisis)cr=smCrisisPl(k);}
  else{const m=trInit();if(k==='tes')m.fans=clamp(m.fans+2,0,100);if(k==='idman')m.media=clamp((m.media||50)+1,0,100);if(k==='laf'||k==='hakem')m.fans=clamp(m.fans+2,0,100);if(T.mac)m.fans=clamp(m.fans+mood,0,100);if(crisis)cr=smCrisisMgr(k);}
  const caps=smCaps(k),cap=caps[clamp(capI|0,0,caps.length-1)];
  const post={id:Date.now()%1e9,d:G.s.day,y:G.s.year,k,cap,likes,gain,vir:vir?1:0,cr:cr?1:0,mood:Math.round(mood*100)/100,m:T.mac?smLastM():null,com:smComments(k,mood,likes,!!cr),t0:Date.now()};
  post.nc=Math.max(post.com.length,Math.round(likes*(0.008+Math.abs(mood)*0.004)));
  S.posts.unshift(post);if(S.posts.length>40)S.posts.length=40;
  smNote(`Yeni gönderin yayında: “${cap}”`,0);
  try{feedAdd({src:isPl()?(G.p.name||'Cenk Kuşku'):coachOf(G.club).n,h:smHandle(),cat:'fan',mood:cr?-1:mood>0?1:mood<-0.5?-1:0,txt:`${T.ic} ${cap}`});}catch(e){}
  SM2.k=null;save();render();smOpen(post.id,true);if(cr)toast('Paylaşımın kriz çıkardı!');else if(vir)toast(`Viral oldu! +${smK(gain)} takipçi`);else if(txt)toast(txt.trim());};
/* yorumlar: ruh hâline göre olumlu / olumsuz; takım arkadaşları ve kulüp hesabı da yazar */
const SMC={
  pos:['Kralsın! 👑','Bu forma sana yakışıyor 🔥','Seninle gurur duyuyoruz','Efsane yolunda','Her maç böyle oyna!','Helal olsun 👏','Ligin en iyisi','Gözümüz arkada değil 💪','Tribünler seni seviyor ❤️','Böyle devam!','🔥🔥🔥','Maşallah 🧿'],
  mac_w:['Ne maçtı ama! {sc} 🔥','{opp} karşısında harikaydınız','3 puan çok önemliydi 💪','Bu galibiyet sana ait','Sahada aslan gibiydin'],
  goal:['O gol ne öyle! ⚽','Golünü 10 kere izledim','Gol makinesi 🎯','O vuruş efsaneydi'],
  neg:['Önce sahada göster','Bunu paylaşma vakti mi?','Takıma odaklan artık','Hayal kırıklığı…','Maaşını hak etmiyorsun','Bu performansla paylaşım mı yapıyorsun?','Taraftarı biraz düşün','Yeter artık 😡','Sosyal medyayı bırak antrenmana gel'],
  mac_l:['{opp} karşısında rezildik','{sc}… utanç verici','Bu sonucu kimse hak etmedi','Sahada yoktun','Ter dökmeden kazanamazsınız'],
  neu:['Sezon uzun, moral bozmak yok','Bir sonraki maça bakalım','Yolun açık olsun','👏','Başarılar','💯','Hadi bakalım…']};
function smComments(k,mood,likes,cr){const m=smLastM(),o=m&&CLUBS[m.opp]?(CLUBS[m.opp].short||CLUBS[m.opp].name):'rakip',sc=m?`${m.gf}-${m.ga}`:'',out=[];
  const n=clamp(Math.round(4+Math.log10(Math.max(10,likes))*2.2),5,16),pPos=clamp(.55+.22*mood-(cr?.5:0),.05,.95),pNeg=clamp(.18-.2*mood+(cr?.45:0),.02,.9);
  const mates=(()=>{try{return isPl()?tmMates().slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8):squadOf(G.club).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8);}catch(e){return [];}})();
  const fill=t=>t.replace('{opp}',o).replace('{sc}',sc);
  for(let i=0;i<n;i++){const r=Math.random();let s,t;if(r<pPos){s=1;const pool=[...SMC.pos];if(k==='mac'&&m&&m.gf>m.ga)pool.push(...SMC.mac_w,...SMC.mac_w);if(m&&m.pl&&m.g)pool.push(...SMC.goal);t=fill(pool[Math.floor(Math.random()*pool.length)]);}
    else if(r<pPos+pNeg){s=-1;const pool=[...SMC.neg];if(m&&m.gf<m.ga)pool.push(...SMC.mac_l,...SMC.mac_l);t=fill(pool[Math.floor(Math.random()*pool.length)]);}else{s=0;t=SMC.neu[Math.floor(Math.random()*SMC.neu.length)];}
    const u=smUser(Date.now()+'_'+i+Math.random());out.push({u:u.h,hue:u.hue,t,s,lk:Math.max(0,Math.round((s>0?1:s<0?.7:.3)*Math.random()*likes*0.004)),v:0});}
  /* tanınmış hesaplar: iyi gidişte takım arkadaşı, kulüp hesabı */
  if(mood>-.3&&mates.length&&!cr){const q=mates[Math.floor(Math.random()*mates.length)];out.splice(Math.min(1,out.length),0,{u:smHandleOf(q.name),t:mood>0.8?'Kardeşim 🔥🔥':mood>0.2?'💪💪':'Devam 👊',s:1,lk:Math.round(likes*0.02),v:1,hue:200});}
  if(mood>0.5&&!cr){const c=myClub();if(c)out.splice(0,0,{u:smHandleOf(c.short||c.name)+'_official',t:k==='mac'?'Maçın adamı! ⭐':'❤️',s:1,lk:Math.round(likes*0.04),v:1,hue:0,club:1});}
  return out.slice(0,18);}
function smHandleOf(n){return String(n||'').toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/ı/g,'i').replace(/[^a-z0-9]/g,'');}
/* gönderi ayrıntısı: canlı beğeni sayacı ve akan yorumlar */
function smPostHTML(p){const T=(isPl()?SMP:SMM)[p.k]||{n:p.k,ic:'•'},now=Date.now(),age=(now-(p.t0||0))/1000,live=p.t0&&age<18;
  return `<div class="sm2-post"><div class="sm2-pimg">${smImg(p)}</div><div class="sm2-pside"><div class="sm2-ph"><div class="sm2-av sm">${smAv()}</div><div><b>${esc(smHandle().slice(1))}</b> <i class="sm2-ok">✔</i><small>${twD(p.d)}${p.vir?' · <em class="vir">VİRAL</em>':''}${p.cr?' · <em class="cr">KRİZ</em>':''}</small></div><button type="button" class="pf-x" data-act="closeModal" aria-label="Kapat">✕</button></div>
    <p class="sm2-cap"><b>${esc(smHandle().slice(1))}</b> ${esc(p.cap||T.n)}</p>
    <ul class="sm2-com" id="sm2-com">${p.com.map((c,i)=>`<li class="${c.s>0?'p':c.s<0?'n':''}"${live?' hidden':''} data-i="${i}"><span class="sm2-av xs" style="--h:${c.hue}">${esc((c.u||'?')[0].toUpperCase())}</span><div><b>${esc(c.u)}${c.v?' <i class="sm2-ok">✔</i>':''}</b> ${esc(c.t)}<small>${c.lk?`♥ ${smK(c.lk)}`:''}</small></div></li>`).join('')}</ul>
    <div class="sm2-act"><div class="sm2-big"><span class="sm2-heart">♥</span><b id="sm2-likes">${smK(live?0:p.likes)}</b> beğeni · <span id="sm2-nc">${smK(live?0:p.nc||p.com.length)}</span> yorum</div><small>${live?'<span class="sm2-livetag">CANLI</span> etkileşim geliyor…':`+${smK(p.gain||0)} takipçi kazandırdı`}</small></div></div></div>`;}
function smOpen(id,fresh){const S=smInit(),p=S.posts.find(x=>x.id===id);if(!p)return;smFix(p);openModal(smPostHTML(p));const mc=$('#modalCard');mc.classList.add('sm2-modal');
  clearInterval(SM2.live);if(!(p.t0&&(Date.now()-p.t0)/1000<18))return;
  const t0=p.t0,dur=12000,L=p.likes,NC=p.nc||p.com.length,lis=[...mc.querySelectorAll('#sm2-com li')];
  SM2.live=setInterval(()=>{const el=$('#sm2-likes');if(!el||!mc.classList.contains('sm2-modal')){clearInterval(SM2.live);return;}const f=clamp((Date.now()-t0)/dur,0,1),e=1-Math.pow(1-f,2.4);el.textContent=smK(Math.round(L*e));const nc=$('#sm2-nc');if(nc)nc.textContent=smK(Math.round(NC*e));
    const show=Math.floor(e*lis.length+0.2);lis.forEach((li,i)=>{if(i<show&&li.hidden){li.hidden=false;li.classList.add('in');}});const h=mc.querySelector('.sm2-heart');if(h){h.classList.remove('pop');void h.offsetWidth;h.classList.add('pop');}
    if(f>=1){clearInterval(SM2.live);const s=mc.querySelector('.sm2-act small');if(s)s.textContent=`+${smK(p.gain||0)} takipçi kazandırdı`;}},450);}
closeModal=(old=>function(){try{$('#modalCard').classList.remove('sm2-modal');clearInterval(SM2.live);}catch(e){}return old.apply(this,arguments);})(closeModal);
openModal=(old=>function(){try{$('#modalCard').classList.remove('sm2-modal');}catch(e){}return old.apply(this,arguments);})(openModal);
function smFix(p){if(typeof p.com==='string'){p.com=[{u:smUser(p.d+'o').h,hue:120,t:p.com,s:p.cr?-1:1,lk:0}];}if(!p.id)p.id=p.d*1000+(p.k||'').length;if(!p.cap)p.cap=((isPl()?SMP:SMM)[p.k]||{}).n||'';return p;}
function smAv(){try{const c=myClub()||{c1:'#1f6feb',c2:'#fff'};return faceSVG(lookNow((G.p&&G.p.age)||25),{c1:c.c1,c2:c.c2,num:isPl()?(G.p.num||10):null,coach:!isPl()});}catch(e){return '';}}
function smSpark(H){if(!H||H.length<2)return '';const v=H.map(x=>x[1]),mn=Math.min(...v),mx=Math.max(...v),W=240,Hh=46,pts=v.map((y,i)=>`${(i/(v.length-1)*W).toFixed(1)},${(Hh-((y-mn)/Math.max(1,mx-mn))*(Hh-6)-3).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${W} ${Hh}" width="100%" height="${Hh}" preserveAspectRatio="none" class="sm2-spark"><polyline points="${pts}" fill="none" stroke="var(--led,#35d49a)" stroke-width="2"/><polyline points="0,${Hh} ${pts} ${W},${Hh}" fill="var(--led,#35d49a)" opacity=".12" stroke="none"/></svg>`;}
viewSm=function(){const S=smInit();S.posts.forEach(smFix);const T=isPl()?SMP:SMM,can=smCanPost(),nm=isPl()?G.p.name:coachOf(G.club).n,c=myClub()||{name:''},mood=smMood(),m=smLastM();
  const pos=isPl()?(POS_TR[G.p.pos]||G.p.pos||'Futbolcu'):'Teknik direktör',dg=S.dayGain||0;
  const head=`<section class="panel sm2-hd"><div class="sm2-av lg">${smAv()}</div><div class="sm2-id"><div class="sm2-nm"><b>${esc(smHandle().slice(1))}</b><i class="sm2-ok">✔</i></div>
      <div class="sm2-st"><div><b>${S.posts.length}</b><span>gönderi</span></div><div><b>${smK(S.fol)}</b><span>takipçi</span></div><div><b>${smK(180+Math.round(S.fol**0.25))}</b><span>takip</span></div></div>
      <p class="sm2-bio"><b>${esc(nm)}</b><br>${esc(pos)} · ${esc(c.name)} ${crestSVG(c,14)}<br><small>Bugün ${dg>=0?'+':''}${smK(Math.abs(dg))}${dg<0?' kaybı':''} takipçi · etkileşim %${(S.eng*100).toFixed(1).replace('.',',')}</small></p></div></section>`;
  const moodTx=mood>1?'Taraftar coşkulu 🔥':mood>0.3?'Taraftar memnun 🙂':mood>-0.3?'Taraftar sakin':mood>-1?'Taraftar huzursuz 😕':'Taraftar öfkeli 😡';
  const stat=`<div class="fin-kpi"><div><span>Taraftar havası</span><b>${moodTx}</b><small>${m?`son maç ${m.gf}-${m.ga}${m.pl?` · puanın ${String(m.r.toFixed?m.r.toFixed(1):m.r).replace('.',',')}`:''}`:'yakın tarihli maç yok'}</small></div><div><span>Taraftar sevgisi</span><b>${Math.round(S.love)}</b><small>${S.love>=70?'Çok seviliyorsun':S.love>=45?'İyi':S.love>=30?'Mesafeli':'Kırgın'}</small></div>${isPl()?`<div><span>Sosyal medya geliri</span><b>${eur(S.inc)}</b><small>toplam</small></div>`:''}<div><span>Takipçi (son ${Math.min(120,(S.hist||[]).length)} gün)</span>${smSpark(S.hist)||'<b>—</b>'}</div></div>`;
  const comp=`<section class="panel"><p class="sub-h"><span>Yeni gönderi</span><span>haftada 1</span></p>${!can[0]?`<p class="sm2-wait">⏳ ${esc(can[1])}</p>`:''}
      <div class="sm-grid">${Object.entries(T).map(([k,x])=>{const dis=!can[0]||(x.mac&&!m);return `<button class="sm-b ${x.risk>=0.3?'risk':''} ${SM2.k===k?'on':''}" data-act="smPick" data-k="${k}" ${dis?'disabled':''}><span>${x.ic}</span><b>${esc(x.n)}</b><small>${esc(x.d)}</small>${x.risk?`<em>Risk %${Math.round(x.risk*100)}</em>`:''}</button>`;}).join('')}</div>
      ${SM2.k&&can[0]?`<div class="sm2-comp"><div class="sm2-prev">${smImg({k:SM2.k,m})}</div><div><p class="sub-h"><span>Açıklama seç</span></p>${smCaps(SM2.k).map((t,i)=>`<label class="sm2-cap-o"><input type="radio" name="smcap" data-act="smCap" data-i="${i}" ${SM2.cap===i?'checked':''}> ${esc(t)}</label>`).join('')}
        <p class="muted" style="font-size:12px;margin:6px 0">${mood>0.3?'Taraftar şu an seninle; bu gönderi çok beğeni alabilir.':mood<-0.3?'Son maç kötü geçti; gönderin eleştiri alabilir.':'Taraftar sakin; tepkiler karışık olabilir.'}</p><button class="btn cta" data-act="smShare">Paylaş</button></div></div>`:''}</section>`;
  const grid=`<section class="panel"><p class="sub-h"><span>Gönderiler</span><span>${S.posts.length}</span></p>${S.posts.length?`<div class="sm2-grid">${S.posts.map(p=>`<button class="sm2-tile${p.cr?' cr':p.vir?' vir':''}" data-act="smOpen" data-i="${p.id}">${smImg(p)}<span class="sm2-ov"><b>♥ ${smK(p.likes)}</b><b>💬 ${smK(p.nc||p.com.length)}</b></span></button>`).join('')}</div>`:'<p class="muted">Henüz paylaşım yapmadın. İlk gönderin profilini başlatır.</p>'}</section>`;
  const nt=(S.notif||[]).slice(0,10);const notif=`<section class="panel"><p class="sub-h"><span>Bildirimler</span></p>${nt.length?`<ul class="sm2-nt">${nt.map(n=>`<li class="${n.m>0?'p':n.m<0?'n':''}"><i>${twD(n.d)}</i>${esc(n.t)}</li>`).join('')}</ul>`:'<p class="muted">Henüz bildirim yok.</p>'}</section>`;
  return `<h2 class="h">Sosyal medya</h2>${head}${S.ban>G.s.day?`<section class="panel sm-ban">🚫 Kulübün koyduğu sosyal medya yasağı ${S.ban-G.s.day} gün daha sürüyor.</section>`:''}${stat}<div class="sm2-cols"><div>${comp}${grid}</div><div>${notif}</div></div>`;};
ACTX.smPick=el=>{SM2.k=el.dataset.k;SM2.cap=0;render();};
ACTX.smCap=el=>{SM2.cap=+el.dataset.i||0;};
ACTX.smShare=()=>{if(SM2.k)smPost(SM2.k,SM2.cap);};
ACTX.smOpen=el=>smOpen(+el.dataset.i);
ACTX.smPost=el=>{SM2.k=el.dataset.k;SM2.cap=0;render();};

