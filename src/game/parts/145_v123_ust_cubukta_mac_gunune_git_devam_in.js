/* ================= v123: üst çubukta “Maç gününe git” — Devam'ın yanında küçük düğme =================
   Günleri art arda ilerletir; maç/kupa/milli maç gününe gelince, bir karar penceresi açılınca ya da gün ilerlemeyince durur. */
const MD_STOP=new Set(['mac','kupa','milli']);
/* hakemin görevi yalnız lig maçlarında: kulübün kupa günü onun için durak değil */
function mdStopT(t){try{if(typeof isRef==='function'&&isRef())return t==='mac';}catch(e){}return MD_STOP.has(t);}
function mdLeft(){try{if(!G||!G.s||G.phase!=='season')return null;const d=G.s.day;for(let k=d;k<d+120;k++){let t='';try{t=dayType(k);}catch(e){}if(mdStopT(t))return k-d;}return null;}catch(e){return null;}}
let MD_RUN=false;
function mdGo(){if(MD_RUN||!G||!G.s)return;if(!$('#modal').hidden)return toast('Önce açık pencereyi kapat');
  try{if(mdStopT(dayType(G.s.day)))return fmCont();}catch(e){}
  MD_RUN=true;let n=0;const btn=$('#top .md-go');if(btn)btn.classList.add('run');
  const stop=(why)=>{MD_RUN=false;const b=$('#top .md-go');if(b)b.classList.remove('run');if(why)toast(why);try{renderTop();}catch(e){}};
  const step=()=>{try{if(!G||!G.s||G.phase!=='season')return stop();if(!$('#modal').hidden)return stop('Bir karar seni bekliyor');if([...document.querySelectorAll('#fx,#match,#mvStage')].some(x=>!x.hidden&&getComputedStyle(x).display!=='none'))return stop();
      const t=dayType(G.s.day);if(mdStopT(t))return stop();if(n++>70)return stop();
      const d0=G.s.day,y0=G.s.year;fmCont();
      setTimeout(()=>{if(!G||!G.s)return stop();const busy=[...document.querySelectorAll('#fx,#match,#mvStage')].some(x=>!x.hidden&&getComputedStyle(x).display!=='none');if(G.s.day===d0&&G.s.year===y0)return stop(busy?null:$('#modal').hidden?'İlerlemeden önce bekleyen bir iş var':'Bir karar seni bekliyor');step();},30);}catch(e){console.warn('mdGo',e);stop();}};
  step();}
ACTX.mdGo=()=>mdGo();
renderTop=(old=>function(){old.apply(this,arguments);try{if(!G||!G.s||G.phase==='tryout'||G.phase==='retired')return;const meta=$('#top .top-meta'),fc=meta&&meta.querySelector('.fm-cont');if(!fc)return;
  const ex=meta.querySelector('.md-go');if(ex)ex.remove();const left=mdLeft();if(left==null)return;
  const lab=left===0?'Maç günü':`Maç gününe git`;fc.insertAdjacentHTML('afterend',`<button class="md-go${MD_RUN?' run':''}" data-act="mdGo" title="${left===0?'Bugün maç günü':`Maç gününe ilerle (${left} gün)`}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l7 7-7 7M12 5l7 7-7 7"/></svg><span>${lab}</span>${left>0?`<small>${left} gün</small>`:''}</button>`);}catch(e){}})(renderTop);
/* 3B motor: sahada 11'den az uygun oyuncu kalırsa boş yerler yedeklerden (yoksa altyapıdan) doldurulur — nadir “null.ovr” hatası */
abAssign=(old=>function(T){const r=old.apply(this,arguments);try{if(r&&r.res&&r.res.some(x=>!x)){const used=new Set(r.res.filter(Boolean));const pool=(T.bench||[]).filter(b=>b&&!b.off&&!used.has(b));
  for(let i=0;i<r.res.length;i++)if(!r.res[i]){const b=pool.shift()||{k:'FILL'+i+'_'+(T.id||''),name:'Altyapı oyuncusu',pos:i===0?'KL':'OS',spos:i===0?'KL':'OS',ovr:42,age:18,nat:'TUR'};r.res[i]=b;if(!r.homes[i]&&i>0)r.homes[i]=[.4,.5];}}}catch(e){}return r;})(abAssign);

