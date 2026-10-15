/* ================= v176: çevrimiçi oda düzeltmeleri — ortak fikstür (oda kodundan tohumlu), lig dağılımı ve sezon ortası eşitleme, "1/2" hazır sayacı ================= */
/* 1) Fikstür iki cihazda da aynı kurulsun: oda açıkken yeni sezonun fikstürü oda kodu + lig + yıl tohumuyla karıştırılır */
function mpTohumKaristir(a,seed){const r=srng(seed),x=a.slice();for(let i=x.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[x[i],x[j]]=[x[j],x[i]];}return x;}
function mpFiksturKur(){try{if(!mpOn()||!G.s)return false;const S=G.s;if((S.results||[]).length)return false;
    const ids=leagueClubs(S.league).map(c=>c.id).sort();S.fixtures=makeFixtures(mpTohumKaristir(ids,'oda:'+G.mp.code+':'+S.league+':'+S.year));return true;}catch(e){console.warn('oda fikstür',e);return false;}}
newSeason=(old=>function(){const r=old.apply(this,arguments);try{if(mpFiksturKur()){MP.lastRes='';}}catch(e){}return r;})(newSeason);
/* 2) Eşitleme: misafir, kurucunun lig dağılımını (kendi kulübü hariç) ve — fikstür farklıysa — fikstürünü ve oynanmış sonuçlarını devralır */
mpMerge=(old=>function(o){try{const S=G.s;if(!S||!mpOn())return;
    if(G.mp.role==='guest'&&o.lm&&typeof o.lm==='object'){const yeni=Object.assign({},o.lm);
      /* kendi kulübünün ligi kendi dünyandaki gibi kalır */
      if(G.club&&CLUBS[G.club]){const ben=(G.lgMove||{})[G.club];if(ben!==undefined)yeni[G.club]=ben;else delete yeni[G.club];}
      if(JSON.stringify(yeni)!==JSON.stringify(G.lgMove||{})){G.lgMove=yeni;try{lgApply.k=null;lgApply();}catch(e){}save();}}
    if(o.y!==S.year||o.L!==S.league)return;
    const myH=mpH53(JSON.stringify(S.fixtures||[]),3);
    if(o.fh!==myH&&G.mp.role==='guest'&&Array.isArray(o.fx)&&mpFixOk(o.fx)&&Array.isArray(o.rs)){
      const R0=(S.results||[]).length;
      S.fixtures=JSON.parse(JSON.stringify(o.fx));S.results=JSON.parse(JSON.stringify(o.rs));
      /* hafta sayacı oynanmış tur sayısıyla uyumlu */
      S.week=S.results.length+1;
      /* oynanmış haftaların maç günleri yeniden oynanmasın: takvim devralınan son haftanın ertesi gününe alınır */
      const nR=S.results.length;if(nR&&S.cal&&S.cal[nR-1]!=null&&S.day<=S.cal[nR-1]){S.day=S.cal[nR-1]+1;}
      save();MP.lastRes='';mpPubRes(true);
      msg('news','🌐 Lig fikstürü oda kurucusuyla eşitlendi',R0?`Odaya sezon içinde katıldığın için fikstür ve şimdiye kadarki ${S.results.length} haftanın sonuçları oda kurucusunun dünyasından alındı. Bundan sonra maçlar ikinizde de aynı rakiplerle oynanır ve sonuçlar ortak tabloya işlenir.`:'Bu sezonun fikstürü ikinizde de aynı.');
      try{mpSoftRender();}catch(e){}return;}
    return old.apply(this,arguments);}catch(e){console.warn('oda birleştirme v176',e);}})(mpMerge);
/* oda sonradan açılırsa (Ayarlar ya da katılma) ve sezonda henüz maç yoksa fikstür tohumlu kurulur */
if(typeof ACTX.mpSetTog==='function')ACTX.mpSetTog=(old=>function(){const r=old.apply(this,arguments);try{if(mpFiksturKur()){save();MP.lastRes='';mpPubRes(true);}}catch(e){}return r;})(ACTX.mpSetTog);
wizGo=(old=>function(){const r=old.apply(this,arguments);try{if(G&&G.mp&&G.mp.on&&mpFiksturKur()){save();MP.lastRes='';setTimeout(()=>mpPubRes(true),500);}}catch(e){}return r;})(wizGo);
/* 3) Hazır sayacı: Devam/Hazırım düğmesinin altında kaç kişinin beklendiği (FM'deki gibi): kimse basmadıysa 2/2, biri bastıysa 1/2 */
function mpBekleyen(){const benHazir=!!MP.ready,o=MP.peer&&mpPeerLive()&&MP.peer.rd;return (benHazir?0:1)+(o?0:1);}
mpUI=(old=>function(){const r=old.apply(this,arguments);try{const on=mpOn()&&mpPartnerExists();const n=on?mpBekleyen():0;
    for(const b of document.querySelectorAll('#top .fm-cont,#tabs .tab.cont')){let s=b.querySelector('.mp-say');
      if(!on){if(s)s.remove();continue;}
      if(!s){b.insertAdjacentHTML('beforeend','<small class="mp-say"></small>');s=b.querySelector('.mp-say');}
      const t=`${n}/2`;if(s.textContent!==t)s.textContent=t;s.title=n?`${n} kişi bekleniyor`:'Herkes hazır';s.classList.toggle('bir',n===1);}}catch(e){}return r;})(mpUI);
render=(old=>function(){const r=old.apply(this,arguments);try{mpUI();}catch(e){}return r;})(render);
