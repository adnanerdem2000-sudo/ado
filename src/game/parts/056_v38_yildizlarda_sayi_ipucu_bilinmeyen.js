/* ================= v38: yıldızlarda sayı ipucu · bilinmeyen özelliklerde ?? ve aralık karışımı ================= */
const stV=x=>clamp((x-45)/9,0.5,5);
function starsRange(lo,hi,tip){const a=stV(lo),b=stV(hi),wa=a/5*100,wb=b/5*100;
  return `<span class="fm-st rng" tabindex="0" data-tip="${esc(tip)}"><i class="unc" style="width:${wb}%">★★★★★</i><i style="width:${wa}%">★★★★★</i>★★★★★</span>`;}
starsHTML=(old=>function(a,p,big){const h=old(a,p,big);const pp=Math.max(a,p==null?a:p);return h.replace('<span class="stars',`<span tabindex="0" data-tip="${pp>a?`Mevcut ${dec(a,1)} · potansiyel ${dec(pp,1)} / 5`:`${dec(a,1)} / 5 yıldız`}" class="stars`);})(starsHTML);
/* özellik bilinmiyorsa: bazıları ??, bazıları geniş aralık (gözlem bilgisine göre) */
function attrFuzzy(p,name,v,acc,max){const r=srng(p.k+'fz'+name+acc)();const showP=acc<=0?0.32:0.62;if(r>showP)return '??';const w=max===20?(acc<=0?8:6):(acc<=0?24:16);
  const off=Math.floor(srng(p.k+'fo'+name+acc)()*(w+1));let lo=Math.max(1,v-off),hi=Math.min(max,lo+w);if(hi-lo<w)lo=Math.max(1,hi-w);return `${lo}-${hi}`;}
scAttr=(old=>function(p,c,v,i){const r=old(p,c,v,i);if(r==='??'){return attrFuzzy(p,'a'+i,v,scAcc(p),99);}return r;})(scAttr);
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{
    const sc=!(opt&&opt.acad)&&scOn(c),acc=sc?scAcc(p):5,mine=c.id===G.club,mgr=G.mode==='mgr';
    /* bilinmeyen özellik hücreleri */
    if(sc&&acc<=1){const A=fmAttrs(p),V={};for(const k of ['T','M','P','G'])(A[k]||[]).forEach(([n,v])=>V[n]=v);
      h=h.replace(/<div class="fmr"><span>([^<]+)<\/span><b class="vr">[^<]*<\/b><\/div>/g,(m,n)=>{const v=V[n];if(v==null)return m;const s=attrFuzzy(p,n,v,acc,20);return `<div class="fmr"><span>${n}</span><b class="vr${s==='??'?' unk':''}">${s}</b></div>`;});}
    /* M.Y. / P.Y. yıldızları: üstüne gelince sayı ya da aralık */
    let oLo,oHi,pLo,pHi;if(sc){[oLo,oHi]=scRange(p,'o');[pLo,pHi]=scRange(p,'p');}else{oLo=oHi=p.ovr;const pp=pPot(p);pLo=pp[0];pHi=pp[1];if(mine&&mgr){pLo=Math.min(pLo,pHi);}}
    const tip=(t,a,b,note)=>{a=ab200(a);b=ab200(b);return a===b?`${t}: ${a}/200`:`${t}: ${a}–${b}/200${note?' · '+note:''}`;};
    const tipS=(x,t)=>fmStars(stV(x)).replace('<span class="fm-st"',`<span class="fm-st" tabindex="0" data-tip="${t}"`);const myS=oLo===oHi?tipS(oLo,tip('Mevcut yetenek',oLo,oHi)):starsRange(oLo,oHi,tip('Mevcut yetenek',oLo,oHi,'gözlem tahmini'));
    const pyS=pLo===pHi?tipS(pLo,tip('Potansiyel',pLo,pHi)):starsRange(pLo,pHi,tip('Potansiyel',pLo,pHi,sc?'gözlem tahmini':'tahmini'));
    h=h.replace(/<div class="fmi two"><div><span>M\.Y\.<\/span>[\s\S]*?<\/b><\/div><div><span>P\.Y\.<\/span>[\s\S]*?<\/b><\/div><\/div>/,`<div class="fmi two"><div><span>M.Y.</span><b>${myS}</b></div><div><span>P.Y.</span><b>${pyS}</b></div></div>`);
    h=h.replace(/<span class="fm-st"><i style="width:([\d.]+)%">/g,(m,w)=>`<span class="fm-st" tabindex="0" data-tip="${dec(w/20,1)} / 5 yıldız"><i style="width:${w}%">`);
  }catch(e){console.warn(e);}return h;})(fmProfHTML);

