function pHW(p){if(!p)return null;const nm=String(p.name||'').replace(/^\d+\.\s*/,'');const R=HW_REAL[nm];let h=null,w=null,wq=false;
  if(R){h=R[0];w=R[1];}
  if(!h){try{const D=typeof LOOKS!=='undefined'&&LOOKS[nm];if(D)h=D[0];}catch(e){}}
  if(!h){const r=srng((p.k||nm)+'hgt');h=p.pos==='KL'?186+Math.floor(r()*9):p.pos==='DF'?180+Math.floor(r()*11):p.pos==='FW'?177+Math.floor(r()*12):172+Math.floor(r()*13);}
  if(!w){const r=srng((p.k||nm)+'wgt'),bmi=({KL:23.6,DF:23.4,OS:22.6,KN:22.1,FW:23.1}[p.pos]||22.8)+(r()*1.6-.8);w=Math.round(bmi*(h/100)*(h/100));wq=true;}
  return {h,w,wq,real:!!R};}
pMetaX=(old=>function(p){const M=old.apply(this,arguments);try{const X=pHW(p);if(X){M.h=X.h;M.w=X.wq?'~'+X.w:X.w;M.wn=X.w;}}catch(e){}return M;})(pMetaX);
f3Look=(old=>function(p,i){const r=old.apply(this,arguments);try{let src=null;try{src=pByKey(p.k);}catch(e){}const X=pHW(Object.assign({},src||{},p));if(X){r.h=X.h;r.w=X.w;}}catch(e){}return r;})(f3Look);
/* ---------- potansiyel ---------- */
const POT_C={};
function potHead(a){const T={15:18,16:16,17:14,18:12,19:10,20:8,21:6.5,22:5,23:3.5,24:2.2,25:1.2,26:.5};return a<=15?18:a>=27?0:T[a];}
function potCore(p){const key=(p.k||p.name)+'|'+p.ovr0+'|'+p.age0;if(POT_C[key]!=null)return POT_C[key];const a0=p.age0!=null?p.age0:p.age,o0=p.ovr0!=null?p.ovr0:p.ovr,r=srng((p.k||p.name)+'pt2');let t;
  const mv=typeof pvReal==='function'?pvReal(p):0;
  if(mv){const ex=1.3e6*Math.exp((o0-71)/4.3)*(a0<=21?1.5:a0<=23?1.4:a0<=26?1.15:1);t=clamp(0.42+0.3*Math.log2(mv/ex),0.12,1.4);}
  else if(p.g){t=r()<0.07?0.9+r()*0.5:0.22+r()*0.55;}
  else t=0.18+r()*0.42;
  return POT_C[key]=Math.round(clamp(Math.max(o0,o0+potHead(a0)*t+(r()*2-1)),30,97));}
potOf=(old=>function(p){if(!p||p.ng||p.k==='ME'||p.ovr0==null)return old.apply(this,arguments);const cur=ageP(p).ovr;return Math.max(cur,potCore(p));})(potOf);
/* gelişim: her yıl potansiyele doğru (gençlerde hızlı), 29 yaşından sonra düşüş — sezon içinde yumuşak geçiş */
function agePot(p,start){const yrs=G&&G.s?Math.max(0,G.s.year-start):0;let age=p.age0,o=p.ovr0;const pt=potCore(p);
  for(let y=0;y<yrs;y++){if(age<28){const rate=age<21?0.3:age<24?0.24:0.16;o+=Math.max(0,pt-o)*rate+(age<24?0.15:0);}else o+=age<29?0:age<32?-1:-2.5;age++;}return {age,ovr:Math.round(clamp(o,30,96))};}
ageP=(old=>function(p){if(!p||p.ng||p.k==='ME'||p.age0==null||p.ovr0==null||!p.k)return old.apply(this,arguments);try{const st=p.start||2026,r=agePot(p,st);
  if(!G||!G.s||G.phase==='tryout')return r;const f=typeof seasonFrac==='function'?seasonFrac():0;if(f<=0)return r;const n=agePot(p,st-1);if(n.ovr===r.ovr)return r;
  return Object.assign({},r,{ovr:Math.round(clamp(r.ovr+(n.ovr-r.ovr)*f,30,96)),ovrS:r.ovr,ovrN:n.ovr});}catch(e){return old.apply(this,arguments);}})(ageP);
(function(){try{for(const k in SLC)delete SLC[k];}catch(e){}})();
/* ---------- FM tarzı 200'lük yetenek ---------- */
function ab200(o){const P=[[30,40],[40,60],[50,80],[60,100],[70,125],[80,150],[90,180],[97,200]];if(o<=30)return 40;for(let i=1;i<P.length;i++)if(o<=P[i][0]){const [a,b]=P[i-1],[c,d]=P[i];return Math.round(b+(o-a)/(c-a)*(d-b));}return 200;}
pfBuild=(old=>function(mc){const r=old.apply(this,arguments);try{if(!mc||!PF_CUR)return r;const gr=mc.querySelector('.pf-genr');if(!gr||gr.querySelector('.ca-sec'))return r;let p=null;try{p=pByKey(PF_CUR.k);}catch(e){}if(!p)return r;
  const pr=pPot(p),lo=ab200(pr[0]),hi=ab200(pr[1]),ca=ab200(p.ovr),X=pHW(p);const sec=document.createElement('section');sec.className='ca-sec';
  sec.innerHTML=`<div class="ca-row"><div><span>Mevcut yetenek</span><b>${ca}<small>/200</small></b></div><div><span>Potansiyel</span><b>${lo===hi?lo:`${lo}–${hi}`}<small>/200</small></b></div><div><span>Boy</span><b>${X.h} cm</b></div><div><span>Kilo</span><b>${X.wq?'~':''}${X.w} kg</b>${X.wq?'<small class="ca-q">tahmini</small>':''}</div></div>`;
  const t=gr.querySelector('.trt-sec');if(t)t.after(sec);else gr.insertBefore(sec,gr.firstChild);}catch(e){console.warn('ca',e);}return r;})(pfBuild);

