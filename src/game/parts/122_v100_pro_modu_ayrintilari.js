/* ================= v100: Pro modu ayrıntıları ================= */
/* kaleciler Pro modunda değil, Anlar modunda oynar (kaleciyi elle yönetmek motorda anlamlı değil) */
proUsable=(old=>function(){try{if(G&&G.p&&G.p.pos==='KL')return false;}catch(e){}return old.apply(this,arguments);})(proUsable);
/* üst bilgi: canlı maç notu, şut ve pas sayısı */
pl3Hud=(old=>function(){old.apply(this,arguments);try{if(!PRO.on||!MR)return;const h=$('#pl3Hud');if(!h)return;const me=pl3Me(),c=ABM.sim&&ABM.sim.ctl;const rt=me&&me.rt?me.rt:null;
  let x=h.querySelector('.pro-x');if(!x){x=document.createElement('div');x.className='pro-x';h.appendChild(x);}
  x.innerHTML=`${rt?`<b class="${rt>=7.5?'g':rt<6?'r':''}">${dec(rt,1)}</b>`:''}<span>${c&&c.sh?`Şut ${c.sh}`:''}${c&&c.ps?` · Pas ${c.ps}`:''}${c&&c.got?` · İstediğin pas ${c.got}`:''}</span>`;}catch(e){}})(pl3Hud);
abTickCore=(old=>function(){const r=old.apply(this,arguments);try{if(PRO.on&&ABM.sim){const t=ABM.sim.t;if(t-(PRO.hudT||0)>2||t<(PRO.hudT||0)){PRO.hudT=t;pl3Hud();}}}catch(e){}return r;})(abTickCore);

