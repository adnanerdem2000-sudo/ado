/* ================= v35: FM tarzı "Devam" düğmesi · istatistik tutarlılığı · transfer düzeni ================= */
/* profil/sezon istatistikleri, liderlik tablosuyla aynı kaynaktan */
seasonStats=(old=>function(p,cid){const r=old.apply(this,arguments);try{if(r&&!r.tracked&&CLUBS[cid]){const x=clubSeasonEst(cid)[p.k];if(x)return Object.assign({},r,{ap:x.ap,st:x.st!=null?x.st:r.st,g:x.g,a:x.a,rt:x.rt,mn:(x.st||0)*84+(x.ap-(x.st||0))*22});}}catch(e){}return r;})(seasonStats);
/* yıldız oyuncular daha çok gol atar (tahmini ligler) */
clubSeasonEst=(old=>function(cid){const M=old(cid);try{const S=G.s,c=CLUBS[cid];if(c&&c.league!==S.league&&!M.__adj){for(const k in M){const x=M[k];if(!x||!x.p)continue;const f=clamp((x.p.ovr-55)/25,0.6,1.5);x.g=Math.round(x.g*f);x.a=Math.round(x.a*(0.8+f*0.2));}Object.defineProperty(M,'__adj',{value:1,enumerable:false});}}catch(e){}return M;})(clubSeasonEst);
/* profil başlığında gerçek mevki */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{const m=dpMain(p);h=h.replace(`<span class="fmp-ovr">${POS_TR[p.pos]} · `,`<span class="fmp-ovr">${FMP_PN[m]} · `);}catch(e){}return h;})(fmProfHTML);
/* transfer arama + izleme listesi yan yana */
trHTML=(old=>function(){const h=old.apply(this,arguments);const i=h.indexOf('<section class="panel"><p class="sub-h"><span>Transfer arama');if(i<=0)return h;return `<div class="tr-wrap"><div>${h.slice(i)}</div><div>${h.slice(0,i)}</div></div>`;})(trHTML);
/* FM tarzı: her ekranda sağ üstte "Devam" — günün ana işini yapar (boşluk tuşu da çalışır) */
function fmContTarget(){let host=null;if(TAB==='hub')host=$('#view');else{try{host=document.createElement('div');host.innerHTML=viewHub();}catch(e){return null;}}
  const b=host&&host.querySelector('.cta[data-act]:not([data-act=closeModal])');return b;}
function fmCont(){if(!G||G.phase==='tryout')return;if(!$('#modal').hidden)return;const b=fmContTarget();if(!b){TAB='hub';render();window.scrollTo(0,0);return;}
  if(b.isConnected){b.click();return;}const t=b.cloneNode(true);t.hidden=true;document.body.appendChild(t);t.click();t.remove();}
ACTX.fmCont=()=>fmCont();
renderTop=(old=>function(){old.apply(this,arguments);try{if(!G||G.phase==='tryout'||G.phase==='retired')return;const meta=$('#top .top-meta');if(meta&&!meta.querySelector('.fm-cont'))meta.insertAdjacentHTML('afterbegin',`<button class="fm-cont" data-act="fmCont" title="Devam (boşluk tuşu)"><span>Devam</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button>`);}catch(e){}})(renderTop);
document.addEventListener('keydown',e=>{if(e.key!==' '||e.repeat)return;if(/INPUT|TEXTAREA|SELECT|BUTTON/.test((e.target&&e.target.tagName)||''))return;if(!G||!$('#modal').hidden)return;
  if($('#fx')&&!$('#fx').hidden)return;if($('#mvStage')&&!$('#mvStage').hidden)return;const mt=$('#match');if(mt&&(mt.classList.contains('live')||!mt.hidden&&mt.offsetParent))return;if(!$('#start').hidden)return;e.preventDefault();fmCont();});

