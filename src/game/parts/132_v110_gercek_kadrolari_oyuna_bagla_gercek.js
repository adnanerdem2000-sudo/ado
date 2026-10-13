/* v110: gerçek kadroları oyuna bağla · gerçek piyasa değeri · gerçek teknik direktörler */
const SQ_MV={};
(function(){let n=0,pl=0;for(const [id,s] of Object.entries(SQ_RL)){const c=CLUBS[id];if(!c||!s)continue;const rows=s.split(';').map(x=>x.split('|'));const st=c.str;
    SQ_REAL[id]=rows.map(r=>{const d=+r[3]||0;let o=st+d-0.5;if(o>80&&d>0)o=st+d*0.8-0.5;return [r[0],r[1],+r[2]||25,Math.round(clamp(o,35,94)),r[4]||'TUR'];});
    SQ_MV[id]=rows.map(r=>r[5]?(+r[5])*1000:0);n++;pl+=rows.length;}
  try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}SQ_RL.n=n;SQ_RL.pl=pl;
  /* gerçek teknik direktörler */
  for(const [id,r] of Object.entries(COACH_RL)){if(!CLUBS[id])continue;const old=COACH_REAL[id],same=old&&r[0].toLowerCase().includes(String(old[0]).split(' ').pop().toLowerCase());if(same)continue;
    let gen=null;try{const k=COACH_REAL[id];delete COACH_REAL[id];gen=coachRaw(id);if(k)COACH_REAL[id]=k;}catch(e){}
    const cc=(LEAGUES[CLUBS[id].league]||{}).cc;COACH_REAL[id]=[r[0],r[1]||CC3[cc]||'TUR',r[2]||(gen?gen.by:1978),gen?gen.f:'4-2-3-1',2026,[],true];}
})();
/* piyasa değeri: gerçek değer varsa ondan, yoksa formül — kendini kanıtlamamış gençlere düşük çarpan */
function pvAf(a){return a<=21?1.5:a<=23?1.4:a<=26?1.15:a<=28?1:a<=30?.75:a<=32?.5:a<=34?.3:.15;}
function pvRound(v){const r=v>=1e7?5e5:v>=1e6?1e5:v>=1e5?25000:5000;return Math.max(10000,Math.round(v/r)*r);}
function pvReal(p){if(!p||p.g||!p.k)return 0;const m=/^(.+)#(\d+)$/.exec(p.k);if(!m)return 0;const a=SQ_MV[m[1]];return a?(a[+m[2]]||0):0;}
pValue=(old=>function(p){try{const mv=pvReal(p);if(mv){const a0=p.age0||p.age,o0=p.ovr0||p.ovr,o=p.ovr||o0,a=p.age||a0;return pvRound(Math.min(2.5e8,mv*Math.exp((o-o0)/4.3)*pvAf(a)/pvAf(a0)));}
  const a=p.age,o=p.ovr;if(a<=21){const f=o>=78?1.3:o>=74?1:o>=70?.7:.5;return pvRound(Math.min(2.2e8,1.3e6*Math.exp((o-71)/4.3))*f);}if(a<=23&&o<74){return pvRound(1.3e6*Math.exp((o-71)/4.3)*1.05);}}catch(e){}return old.apply(this,arguments);})(pValue);
/* veteranlar: emeklilik yaşı oyuncunun bugünkü yaşından küçük olamaz — en erken bu sezonun sonunda bırakır, iyi olanlar bir yıl daha oynar
   (önceden 36+ yaşındaki gerçek oyuncular — Ronaldo, Van Dijk, Xhaka… — ilk günden kurgusal gençle değişiyordu) */
retAgeOf=(old=>function(b){const r=old.apply(this,arguments);try{if(b&&b.age0&&!b.g)return Math.max(r,b.age0+(b.ovr0>=78?1:0));}catch(e){}return r;})(retAgeOf);
(function(){try{for(const k in SLC)delete SLC[k];}catch(e){}})();

