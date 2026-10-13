/* ================= v80: test turundan düzeltmeler ================= */
/* DEVAM düğmesi bilgi/karar bantlarındaki düğmelere (basın düellosu, VAR, transfer son günü, rakip, rekor) kendiliğinden basmasın */
fmContTarget=function(){let host=null;if(TAB==='hub')host=$('#view');else{try{host=document.createElement('div');host.innerHTML=viewHub();}catch(e){return null;}}
  if(!host)return null;const L=[...host.querySelectorAll('.cta[data-act]:not([data-act=closeModal])')];const T=L.filter(b=>!b.closest('.pw-band,.vp-band,.dd-band,.rv-mini,.lc-band,.wx-band,.hrc'));
  /* yaz arası milli turnuva sürüyorsa önce turnuva maçı */
  try{if(G&&G.tour&&G.tour.alive){const tp=T.find(b=>b.dataset.act==='tourPlay');if(tp)return tp;}}catch(e){}
  return T[0]||null;};
/* Sezon özeti: yavaş çekim düğmesi tekrar oynamıyorken de durumunu göstersin */
let GL_SLOW=false;
ACTX.glSlow=el=>{GL_SLOW=!GL_SLOW;if(typeof GLR!=='undefined'&&GLR)GLR.spd=GL_SLOW?0.4:1;const b=el||document.querySelector('[data-act=glSlow]');if(b){b.textContent=GL_SLOW?'🐢 Yavaş çekim: açık':'🐢 Yavaş çekim';b.setAttribute('aria-pressed',String(GL_SLOW));}if(!(typeof GLR!=='undefined'&&GLR))toast(GL_SLOW?'Yavaş çekim açık: bir gole dokun':'Normal hız');};
/* Oyuncu kartı: ödül/rekor/geçmiş listelerinde artık o kulüpte olmayan ya da futbolu bırakan oyuncuya dokununca sessiz kalmasın */
showPCard=(old=>function(id,k){try{if(id&&k&&CLUBS[id]&&!squadOf(id).some(x=>x.k===k)){const to=G.tx&&G.tx[k];if(to&&to!==id&&CLUBS[to]&&squadOf(to).some(x=>x.k===k))return old.call(this,to,k);
  const p=pRaw(k);if(p&&!p.alive)return toast(`${p.name} futbolu bıraktı`);if(p){for(const cid of Object.keys(CLUBS)){if(CLUBS[cid]&&CLUBS[cid].league===CLUBS[id].league&&cid!==id&&squadOf(cid).some(x=>x.k===k))return old.call(this,cid,k);}return toast(`${p.name} artık ${CLUBS[id].short||CLUBS[id].name} kadrosunda değil`);}return toast('Oyuncu bilgisi bulunamadı');}}catch(e){console.warn(e);}return old.apply(this,arguments);})(showPCard);
/* DEVAM: hedef düğme pasifse (ör. sözleşme bitti, teklif seçilmedi) sessiz kalmasın, ne yapılacağını göstersin */
fmCont=(old=>function(){try{if(G&&G.phase!=='tryout'&&$('#modal').hidden){const b=fmContTarget();if(b&&b.disabled){if(TAB!=='hub'){TAB='hub';render();}
  const end40=isPl()&&G.p&&G.p.age+1>=40;const t=document.querySelector(end40?'#view [data-act=retire]':'#view [data-act=accept],#view [data-act=plFind],#view .offer-btns');if(t)t.scrollIntoView({behavior:'smooth',block:'center'});
  if(end40)return toast('Kramponları asma zamanı: “Jübileye çık” ile kariyerini noktala');
  toast(isPl()&&G.mustMove&&!G.next?(plOpenN()?'Yeni sezondan önce masadaki tekliflerden birini kabul etmelisin':'Önce yeni bir kulüp bulmalısın: menajerinle kulüp ara'):'Devam etmeden önce bekleyen bir karar var');return;}}}catch(e){console.warn(e);}return old.apply(this,arguments);})(fmCont);
/* Futbolcu: sözleşme bitti, bütün teklifler reddedildi → kilitlenme yerine menajerle yeni kulüp arama */
function plOpenN(){return ((G&&G.inbox)||[]).filter(m=>m.offer&&m.offer.status==='open').length;}
function plFindBand(){if(!isPl()||!G||G.phase!=='off'||!G.mustMove||G.next||plOpenN())return '';const used=(G.plFind||0)>=3;
  return `<section class="panel pw-band"><span style="font-size:26px">📞</span><div><small>Sözleşmen bitti · masada teklif yok</small><b>Yeni sezona başlamadan önce bir kulüple anlaşman gerekiyor.</b><p class="muted" style="margin:0 0 8px;font-size:12.5px">Menajerin kulüplerle görüşüp seni önerebilir. Reddettiğin kulüpler yeniden, belki daha düşük şartlarla, masaya dönebilir.</p><div class="offer-btns"><button class="cta sm" data-act="plFind">📞 Menajerinle kulüp ara${used?' (son şans)':''}</button></div></div></section>`;}
ACTX.plFind=()=>{if(!isPl()||!G.mustMove||G.next)return;G.plFind=(G.plFind||0)+1;let n=0;try{for(let i=0;i<2&&!plOpenN();i++)n+=genOffers('end')||0;}catch(e){console.warn(e);}
  if(!plOpenN()){const eff=effRating(),seen=new Set(),pool=[];for(const m of G.inbox||[]){const o=m.offer;if(o&&o.club&&CLUBS[o.club]&&!seen.has(o.club)&&o.club!==G.club){seen.add(o.club);pool.push(CLUBS[o.club]);}}
    if(!pool.length){for(const c of leagueClubs(myClub().league))if(c.id!==G.club)pool.push(c);}
    pool.sort((a,b)=>a.str-b.str);const k=Math.min(pool.length,3);for(let i=0;i<k;i++){const c=pool[i];try{const o=makeOffer(c,Math.max(1,eff-clubNeed(c)),'end');if(o)pushOffer(o);}catch(e){console.warn(e);}}}
  const N=plOpenN();toast(N?`Menajerin ${N} kulüpten teklif getirdi`:'Şu an ilgilenen kulüp çıkmadı, yarın yeniden dene');save();render();};
viewHub=(old=>function(){const h=old.apply(this,arguments);try{const b=plFindBand();if(b)return b+h;}catch(e){}return h;})(viewHub);
/* Lisans: senaryo kariyerlerinde yanlış yazılmış seviye ('Pro') yaz arası ana sayfayı çökertiyordu; eski kayıtları da düzelt */
licOf=(old=>function(){const l=old.apply(this,arguments);if(l&&!LIC[l.lv])l.lv=/^p/i.test(String(l.lv||''))?'P':/^a/i.test(String(l.lv||''))?'A':/^b/i.test(String(l.lv||''))?'B':'C';return l;})(licOf);

