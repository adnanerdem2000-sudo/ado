/* ================= v159: gerçekçi portreler — fotoğraftan ölçülen ten/saç rengi, atletik yüz ve gövde, sporcu saç modelleri ================= */
/* ---------- 1) FotMob fotoğrafından ölçülen ten/saç (TEN_FM, tools/veri/7_gorunus.js) ---------- */
const V159_HC={k:'#120b07',d:'#2b1a10',b:'#4a2f18',l:'#7a5230',s:'#c9a35e',r:'#9a4a22'};
const V159_CK='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function v159Ck(s){let h=0;for(const c of String(s))h=(h*31+c.codePointAt(0))>>>0;return V159_CK[h%62];}
/* gerçek kadro yuvası (ilk kuşak) için ölçüm: {si: ten sırası 0-8 | null, hc: saç rengi | null} */
function tenFM(seed,p){try{if(typeof TEN_FM==='undefined')return null;const m=/^(.+)#(\d+)(?:~0)?$/.exec(String(seed));if(!m)return null;const s=TEN_FM[m[1]];if(!s)return null;
  const i=(+m[2])*3;if(i+3>s.length)return null;const t=s.substr(i,3);if(t==='...')return null;p=p||pRaw(seed);if(!p||v159Ck(p.name)!==t[2])return null;
  return {si:t[0]==='.'?null:+t[0],hc:t[1]==='.'?null:V159_HC[t[1]]};}catch(e){return null;}}
lookOf=(old=>function(seed,nat,age,coach){const L=old.apply(this,arguments);try{if(L&&!L.v159){L.v159=1;L.ag=age;
  if(!coach&&typeof pRaw==='function'){const p=pRaw(seed),T=p&&tenFM(seed,p);
    if(T){const hasL=!!(typeof LOOKS!=='undefined'&&LOOKS[p.name]),r=srng(seed+'v159');
      if(T.si!=null){L.sk=SKN[T.si];L.fsk=1;
        if(!hasL){/* gerçek veri yoksa saç modeli/rengi ölçülen tonla tutarlı olsun (rastgele seçim yalnız uyruğa dayanıyordu) */
          const dkS=['buzz','fade','curlytop','short','afro','braids','dread','bald','crop'],ltS=['short','side','fade','crop','quiff','textured','buzz','medium'];
          if(T.si>=6&&!dkS.includes(L.hs))L.hs=dkS[Math.floor(r()*dkS.length)];
          else if(T.si<=3&&['afro','braids','dread','curlytop'].includes(L.hs)&&r()<0.8)L.hs=ltS[Math.floor(r()*ltS.length)];
          if(!T.hc&&T.si>=5&&/^#(c9a35e|7a5230|9a4a22|e8d27a)/.test(L.hc))L.hc=V159_HC.k;}}
      if(T.hc&&!hasL){const g=age>=34?0.12:0;L.hc=g?mixC(T.hc,'#d9d9d9',g):T.hc;L.fhc=1;}}}}}catch(e){}return L;})(lookOf);
/* 3B: yeni saç modeli anahtarları */
try{if(typeof F3_HS!=='undefined'){if(F3_HS.braids==null)F3_HS.braids=5;}}catch(e){}

/* ---------- 2) çizim ---------- */
let V159_ID=0;
const v159n=x=>Math.round(x*10)/10;
/* saç: arka katman (başın arkası) ve ön katman */
function v159Hair(L,f,T,id,front,o){const hc=L.hc,hs=L.hs||'short',sk=L.sk,a=50-f,b=50+f,coach=!!o.coach,age=o.age||L.ag||25;
  const side=mixC(sk,hc,0.62),fill=`url(#${id}h)`;
  /* saç çizgisi: yaş/teknik adamda geri çekilir */
  const rec=coach&&age>=45?clamp((age-45)/25,0,1)*4:0;let hl=27.5+rec;
  const cap=(v,hlv,sb,col)=>{const H=hlv==null?hl:hlv,S=sb||40;return `<path d="M${v159n(a-0.9)} ${S} C${v159n(a-1)} ${v159n(T+5-v)} ${v159n(50-f*0.62)} ${v159n(T-v)} 50 ${v159n(T-v)} C${v159n(50+f*0.62)} ${v159n(T-v)} ${v159n(b+1)} ${v159n(T+5-v)} ${v159n(b+0.9)} ${S} L${v159n(b-1.3)} ${S} Q${v159n(b-1.6)} ${v159n(H+5)} ${v159n(50+f*0.5)} ${v159n(H+1.2+rec*0.6)} Q50 ${v159n(H-0.6)} ${v159n(50-f*0.5)} ${v159n(H+1.2+rec*0.6)} Q${v159n(a+1.6)} ${v159n(H+5)} ${v159n(a+1.3)} ${S}Z" fill="${col||fill}"/>`;};
  const strands=(n,y0,y1,c)=>{let s='';for(let i=0;i<n;i++){const x=50-f*0.62+i*(f*1.24/(n-1));s+=`M${v159n(x)} ${y1} Q${v159n(x+1.2)} ${v159n((y0+y1)/2)} ${v159n(x+2.2)} ${y0}`;}return `<path d="${s}" stroke="${c}" stroke-width=".55" fill="none" opacity=".45" stroke-linecap="round"/>`;};
  const hiC=mixC(hc,'#ffffff',0.22),dkC=shade(hc,-0.35);
  if(!front){
    if(hs==='afro'){let c='';for(let i=0;i<16;i++){const t=Math.PI*(0.92+1.16*i/15);c+=`<circle cx="${v159n(50+Math.cos(t)*(f+5.5))}" cy="${v159n(33+Math.sin(t)*(f+4))}" r="4.6"/>`;}return `<g fill="${hc}"><ellipse cx="50" cy="31" rx="${v159n(f+6.5)}" ry="${v159n(f+3.5)}"/>${c}</g>`;}
    if(hs==='long')return `<path d="M${v159n(a-2)} 36 C${v159n(a-3)} 18 ${v159n(b+3)} 18 ${v159n(b+2)} 36 L${v159n(b+3.5)} 70 Q${v159n(b-1)} 74 ${v159n(b-4)} 66 L${v159n(a+4)} 66 Q${v159n(a+1)} 74 ${v159n(a-3.5)} 70Z" fill="${dkC}"/>`;
    if(hs==='medium')return `<path d="M${v159n(a-1.6)} 36 C${v159n(a-2.4)} 18 ${v159n(b+2.4)} 18 ${v159n(b+1.6)} 36 L${v159n(b+2)} 55 Q${v159n(b-2)} 56 ${v159n(b-3)} 50 L${v159n(a+3)} 50 Q${v159n(a+2)} 56 ${v159n(a-2)} 55Z" fill="${dkC}"/>`;
    if(hs==='dread'){let s='';for(let i=-4;i<=4;i++)s+=`<path d="M${v159n(50+i*3.9)} 24 Q${v159n(50+i*4.9)} 46 ${v159n(50+i*5.5)} ${62+(i&1)*5}"/>`;return `<g stroke="${hc}" stroke-width="3.3" stroke-linecap="round" fill="none">${s}</g>`;}
    if(hs==='bun')return `<ellipse cx="50" cy="${v159n(T-2.6)}" rx="5.4" ry="4.4" fill="${fill}"/><path d="M46 ${v159n(T-2.2)} Q50 ${v159n(T-5)} 54 ${v159n(T-2.2)}" stroke="${hiC}" stroke-width=".6" fill="none" opacity=".5"/>`;
    return '';}
  switch(hs){
    case 'bald':return `<ellipse cx="44" cy="${T+5}" rx="6" ry="2.6" fill="#fff" opacity=".16"/>${coach||age>=40?`<path d="M${v159n(a+0.2)} 40 Q${v159n(a)} 31 ${v159n(a+2.5)} 28 L${v159n(a+3)} 40Z M${v159n(b-0.2)} 40 Q${v159n(b)} 31 ${v159n(b-2.5)} 28 L${v159n(b-3)} 40Z" fill="${hc}" opacity=".55"/>`:''}`;
    case 'buzz':return cap(0.5,27,40,mixC(hc,sk,0.28))+`<path d="M${v159n(a+2)} 28 Q50 ${T+1} ${v159n(b-2)} 28" stroke="#fff" stroke-width="2" opacity=".06" fill="none"/>`;
    case 'fade':return cap(0.6,28,40,side)+cap(2.4,27.5,31)+strands(6,T+1,26,hiC);
    case 'side':case 'quiff':{const q=hs==='quiff';const v=q?5:3.2;return cap(0.6,28,40,side)+`<path d="M${v159n(a+1.5)} 32 C${v159n(a+1)} ${v159n(T-v+3)} ${v159n(50-f*0.4)} ${v159n(T-v)} ${q?52:50} ${v159n(T-v-(q?1.5:0))} C${v159n(50+f*0.7)} ${v159n(T-v)} ${v159n(b-1)} ${v159n(T+4-v)} ${v159n(b-1.5)} 32 Q${v159n(b-4)} 27 ${v159n(50+f*0.3)} ${q?24.5:26} Q${q?48:46} ${q?22.5:27.5} ${v159n(a+1.5)} 32Z" fill="${fill}"/>${q?'':`<path d="M${v159n(50-f*0.36)} ${v159n(T-v+1.5)} Q${v159n(50-f*0.42)} 23 ${v159n(50-f*0.48)} 28" stroke="${dkC}" stroke-width=".7" fill="none"/>`}`+strands(6,T-v+2,27,hiC);}
    case 'crop':{let z='';const n=7;for(let i=0;i<=n;i++){const x=50-f*0.7+i*(f*1.4/n);z+=`L${v159n(x)} ${i%2?31:29.2}`;}return cap(0.6,28,40,side)+`<path d="M${v159n(a+1.4)} 33 C${v159n(a+1)} ${T+1} ${v159n(50-f*0.6)} ${T-2} 50 ${T-2} C${v159n(50+f*0.6)} ${T-2} ${v159n(b-1)} ${T+1} ${v159n(b-1.4)} 33 ${z.replace(/^L/,'L')}Z" fill="${fill}"/>`+strands(7,T,29,hiC);}
    case 'textured':return cap(2.6,27.5,40)+strands(8,T-1.5,27.5,hiC)+strands(5,T+2,29,dkC);
    case 'medium':return cap(2.8,27,46)+`<path d="M${v159n(a+1.2)} 33 Q${v159n(50-f*0.2)} 25 ${v159n(50+f*0.55)} 27.5 Q${v159n(b-1)} 30 ${v159n(b-0.6)} 36 L${v159n(b+1)} 33 C${v159n(b)} 20 ${v159n(a)} 19 ${v159n(a+1.2)} 33Z" fill="${fill}"/>`+strands(7,T-1,28,hiC)+(L.hb?`<path d="M${v159n(a-0.5)} 29 Q50 ${T+3} ${v159n(b+0.5)} 29" stroke="${L.hbc||'#f4f4f4'}" stroke-width="2.6" fill="none"/>`:'');
    case 'long':return cap(2.4,26.5,44)+`<path d="M${v159n(a-0.5)} 34 Q${v159n(a-1.6)} 50 ${v159n(a+0.5)} 60 L${v159n(a+2.5)} 40Z M${v159n(b+0.5)} 34 Q${v159n(b+1.6)} 50 ${v159n(b-0.5)} 60 L${v159n(b-2.5)} 40Z" fill="${fill}"/>`+strands(6,T-1,27,hiC)+(L.hb?`<path d="M${v159n(a-0.5)} 29 Q50 ${T+3} ${v159n(b+0.5)} 29" stroke="#f4f4f4" stroke-width="2.6" fill="none"/>`:'');
    case 'bun':return cap(0.9,27.5,40)+`<path d="M${v159n(50-f*0.6)} 28 Q48 ${T+3} 49 ${T-0.5} M${v159n(50+f*0.6)} 28 Q52 ${T+3} 51 ${T-0.5} M50 27 L50 ${T}" stroke="${hiC}" stroke-width=".55" fill="none" opacity=".5"/>`;
    case 'mohawk':return cap(0.4,28,40,side)+`<path d="M45 28.5 Q44.2 ${T-5} 50 ${T-9} Q55.8 ${T-5} 55 28.5 Q50 26.8 45 28.5Z" fill="${fill}"/>`+`<path d="M47 27 Q47 ${T-3} 50 ${T-7} M53 27 Q53 ${T-3} 50 ${T-7}" stroke="${hiC}" stroke-width=".5" fill="none" opacity=".5"/>`;
    case 'braids':{let r='';for(let i=-3;i<=3;i++)r+=`M${v159n(50+i*f*0.2)} 28.2 Q${v159n(50+i*f*0.24)} ${T+5} ${v159n(50+i*f*0.16)} ${T-0.2}`;return cap(0.7,27.5,40)+`<path d="${r}" stroke="${hiC}" stroke-width=".8" fill="none" opacity=".55" stroke-dasharray="1.6 .8"/>`;}
    case 'dread':return cap(1.6,27.5,40)+`<g stroke="${hc}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M${v159n(a+1)} 30 L${v159n(a-1)} 56"/><path d="M${v159n(b-1)} 30 L${v159n(b+1)} 56"/><path d="M${v159n(a+5)} 27 L${v159n(a+3.4)} 36"/><path d="M${v159n(b-5)} 27 L${v159n(b-3.4)} 36"/></g><path d="M${v159n(a+1)} 30 L${v159n(a-1)} 56 M${v159n(b-1)} 30 L${v159n(b+1)} 56" stroke="${hiC}" stroke-width=".5" stroke-dasharray="1.2 1.6" opacity=".5"/>`;
    case 'curly':case 'curlytop':case 'afro':{const ct=hs==='curlytop',R=hs==='afro'?4.6:ct?3.4:3.6;let c='';
      const pts=ct?[[-0.62,25.5],[-0.36,21],[-0.1,19.4],[0.16,19.6],[0.42,21.2],[0.64,25.5],[-0.48,27.5],[-0.2,24.4],[0.08,24.4],[0.36,24.6],[0.5,27.6],[-0.06,27.6]]:[[-0.92,33],[-0.86,26],[-0.66,21],[-0.36,18],[0,17],[0.36,18],[0.66,21],[0.86,26],[0.92,33],[-0.5,26.5],[-0.16,26.8],[0.18,26.8],[0.52,26.5]];
      for(const [x,y] of pts)c+=`<circle cx="${v159n(50+x*f)}" cy="${v159n(y+(ct?T-17:T-17)-(hs==='afro'?2:0))}" r="${R}"/>`;
      let hl2='';for(const [x,y] of pts.slice(0,7))hl2+=`<circle cx="${v159n(50+x*f-1)}" cy="${v159n(y+T-17-1.2)}" r="1.1"/>`;
      return (ct?cap(0.6,28,40,side):cap(1.5,27.5,40))+`<g fill="${hc}">${c}</g><g fill="${hiC}" opacity=".35">${hl2}</g>`;}
    default:/* short (crew) */return cap(1.7,27.8,40)+strands(7,T-0.5,27.5,hiC);}
}
function v159Beard(L,f,jw,jy,cy,cw){const hc=L.hc,bd=L.bd;if(!bd)return '';
  const ext=bd==='full'?2.2:bd==='short'?0.8:0,J=jw+ext*0.3,C=cy+ext;
  const out=`M${v159n(50-f*0.99)} 41 L${v159n(50-f*0.99)} 45 C${v159n(50-f*0.97)} 51 ${v159n(50-J-0.5)} ${v159n(jy-2)} ${v159n(50-J)} ${v159n(jy)} C${v159n(50-J*0.8)} ${v159n(C-3)} ${v159n(50-cw-3)} ${v159n(C)} 50 ${v159n(C)} C${v159n(50+cw+3)} ${v159n(C)} ${v159n(50+J*0.8)} ${v159n(C-3)} ${v159n(50+J)} ${v159n(jy)} C${v159n(50+J+0.5)} ${v159n(jy-2)} ${v159n(50+f*0.97)} 51 ${v159n(50+f*0.99)} 45 L${v159n(50+f*0.99)} 41`;
  const inn=` L${v159n(50+f-2.4)} 41 Q${v159n(50+f-3)} 48 ${v159n(50+f*0.5)} 51 Q57 53.4 55.8 55.4 Q50 54.2 44.2 55.4 Q43 53.4 ${v159n(50-f*0.5)} 51 Q${v159n(50-f+3)} 48 ${v159n(50-f+2.4)} 41Z`;
  const mus=`<path d="M44 56.4 Q44.6 54.2 50 54.5 Q55.4 54.2 56 56.4 Q53 55.6 50 56.1 Q47 55.6 44 56.4Z" fill="${hc}" opacity="${bd==='stub'?.35:.9}"/>`;
  if(bd==='mus')return `<path d="M43.6 56.6 Q44.4 54 50 54.4 Q55.6 54 56.4 56.6 Q53 55.5 50 56 Q47 55.5 43.6 56.6Z" fill="${hc}"/>`;
  if(bd==='goatee')return `<path d="M45.6 59.5 Q46 ${v159n(cy+1.5)} 50 ${v159n(cy+1.8)} Q54 ${v159n(cy+1.5)} 54.4 59.5 Q50 61 45.6 59.5Z" fill="${hc}" opacity=".88"/>`+mus.replace(/opacity="[^"]+"/,'opacity=".85"');
  const op=bd==='stub'?.24:bd==='short'?.6:.9;
  return `<path d="${out}${inn}" fill="${hc}" opacity="${op}"/>`+mus+(bd==='full'?`<path d="M${v159n(50-cw)} ${v159n(C-2)} Q50 ${v159n(C+0.8)} ${v159n(50+cw)} ${v159n(C-2)}" stroke="${mixC(hc,'#fff',.25)}" stroke-width=".6" fill="none" opacity=".35"/>`:'');}
faceSVG=function(L,o){o=o||{};L=L||DEF_LOOK;const id='q'+(++V159_ID)+'_';
  const sk=/^#[0-9a-f]{6}$/i.test(L.sk||'')?L.sk:'#c08559',hc=/^#[0-9a-f]{6}$/i.test(L.hc||'')?L.hc:'#2b1a10',coach=!!o.coach,age=o.age||L.ag||25;
  const LL=Object.assign({},L,{sk,hc});
  const fs=L.fs||0,f=v159n(clamp((L.fw||19)*0.93,15.8,19.2)+[0,0.6,-0.5,0.3][fs]),T=17,young=age<18;
  const jw=f*[0.8,0.87,0.76,0.85][fs]*(young?0.94:1),jy=[58,58.5,59.5,58.5][fs],cy=[66.6,66.2,68,66.8][fs],cw=[5.2,6.2,4.8,6.4][fs];
  /* renkler: ışık sol üstten */
  const hi=mixC(sk,'#fff8f0',0.2),lo=shade(sk,-0.22),soc=shade(sk,-0.3),dk=shade(sk,-0.5),lip=mixC(shade(sk,-0.14),'#9e4a42',0.32),lipL=mixC(lip,'#ffffff',0.12),neck=shade(sk,-0.12);
  const ez=clamp(L.eyz||1,0.85,1.15),ey=43.8+(fs===2?0.8:0),eyeC=L.ey||'#2a1a10';
  const brC=L.hs==='bald'&&!coach?shade(sk,-0.55):shade(hc,/^#(c9|d|e)/i.test(hc)?-0.28:0.05);
  const head=`M50 ${T} C${v159n(50+f*0.62)} ${T} ${v159n(50+f)} ${T+7} ${v159n(50+f)} ${T+18} C${v159n(50+f)} ${T+26} ${v159n(50+f*0.98)} ${T+31} ${v159n(50+jw)} ${jy} C${v159n(50+jw*0.8)} ${v159n(cy-3)} ${v159n(50+cw+3)} ${cy} 50 ${cy} C${v159n(50-cw-3)} ${cy} ${v159n(50-jw*0.8)} ${v159n(cy-3)} ${v159n(50-jw)} ${jy} C${v159n(50-f*0.98)} ${T+31} ${v159n(50-f)} ${T+26} ${v159n(50-f)} ${T+18} C${v159n(50-f)} ${T+7} ${v159n(50-f*0.62)} ${T} 50 ${T}Z`;
  const defs=`<defs><radialGradient id="${id}f" cx="40%" cy="36%" r="70%"><stop offset="0" stop-color="${hi}"/><stop offset=".5" stop-color="${sk}"/><stop offset="1" stop-color="${lo}"/></radialGradient>`+
    `<linearGradient id="${id}n" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(sk,-0.3)}"/><stop offset=".45" stop-color="${neck}"/><stop offset="1" stop-color="${neck}"/></linearGradient>`+
    `<radialGradient id="${id}h" cx="38%" cy="20%" r="80%"><stop offset="0" stop-color="${mixC(hc,'#ffffff',0.16)}"/><stop offset=".55" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc,-0.3)}"/></radialGradient>`+
    `<linearGradient id="${id}j" x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient></defs>`;
  /* gövde */
  const nw=f*0.6;
  const neckP=`<path d="M${v159n(50-nw)} 52 L${v159n(50-nw-1.2)} 76 Q50 80 ${v159n(50+nw+1.2)} 76 L${v159n(50+nw)} 52Z" fill="url(#${id}n)"/><path d="M${v159n(50-nw+1.5)} 66 Q${v159n(50-3)} 72 49 78 M${v159n(50+nw-1.5)} 66 Q${v159n(50+3)} 72 51 78" stroke="${lo}" stroke-width=".8" fill="none" opacity=".45"/>`;
  let body;
  if(coach){const su=L.suit||'#20242b';body=`<path d="M2 112 C3 94 11 85 25 81.5 C32 80 37 77 39.5 73.5 L50 86 L60.5 73.5 C63 77 68 80 75 81.5 C89 85 97 94 98 112Z" fill="${su}"/><path d="M39.5 73.5 L50 88 L60.5 73.5 L58 72 L50 80 L42 72Z" fill="#f2f2f2"/><path d="M48.4 80.5 L51.6 80.5 L53.4 100 L50 104 L46.6 100Z" fill="${o.c1||'#8a1d1d'}"/><path d="M48.4 80.5 L51.6 80.5 L50.9 83.4 L49.1 83.4Z" fill="${shade(o.c1||'#8a1d1d',-0.25)}"/><path d="M39.5 73.5 L47 98 L40 83 L35 80Z M60.5 73.5 L53 98 L60 83 L65 80Z" fill="${shade(su,0.18)}"/><path d="M2 112 C3 94 11 85 25 81.5 C32 80 37 77 39.5 73.5 L50 86 L60.5 73.5 C63 77 68 80 75 81.5 C89 85 97 94 98 112Z" fill="url(#${id}j)"/>`;}
  else{const c1=o.c1||'#2a5caa',c2=o.c2||'#ffffff';
    body=`<path d="M40.5 74.2 Q50 71.2 59.5 74.2 L59.5 76 L40.5 76Z" fill="${shade(c1,-0.35)}"/>`+neckP+
    `<path d="M2 112 C3 94 11 85 25 81.5 C32 79.8 37 77.4 39.5 74.4 Q50 81 60.5 74.4 C63 77.4 68 79.8 75 81.5 C89 85 97 94 98 112Z" fill="${c1}"/>`+
    `<path d="M21 83 Q25 95 22 112 M79 83 Q75 95 78 112" stroke="${c2}" stroke-width="1.6" fill="none" opacity=".55"/>`+
    `<path d="M39.5 74.4 Q50 81 60.5 74.4" stroke="${c2}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`+
    `<path d="M2 112 C3 94 11 85 25 81.5 C32 79.8 37 77.4 39.5 74.4 Q50 81 60.5 74.4 C63 77.4 68 79.8 75 81.5 C89 85 97 94 98 112Z" fill="url(#${id}j)"/>`+
    `<path d="M30 92 Q36 96 38 104 M70 92 Q64 96 62 104" stroke="#000" stroke-width="1.2" fill="none" opacity=".1"/>`+
    (o.capt?'<path d="M10 95 L22 90.5 L24.5 97.5 L12.5 102Z" fill="#ffd21f"/><text x="17.4" y="99" font-size="5.5" font-weight="900" text-anchor="middle" fill="#1a1a1a" transform="rotate(-20 17.4 97)">C</text>':'')+
    (o.num!=null&&o.num!==''?`<text x="50" y="105" text-anchor="middle" font-family="Saira Extra Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="16" fill="${c2}" opacity=".95">${esc(String(o.num))}</text>`:'');}
  if(coach)body=`<path d="M40.5 74.2 Q50 71.2 59.5 74.2 L59.5 76 L40.5 76Z" fill="#d8d8d8"/>`+neckP+body;
  /* kulaklar */
  const ear=s=>{const x=50+s*(f+0.2);return `<path d="M${v159n(x)} 39.5 Q${v159n(x+s*3.6)} 38.6 ${v159n(x+s*3.4)} 44 Q${v159n(x+s*3.2)} 50.5 ${v159n(x)} 52Z" fill="${sk}"/><path d="M${v159n(x+s*0.6)} 41.5 Q${v159n(x+s*2.6)} 41 ${v159n(x+s*2.3)} 45 Q${v159n(x+s*2)} 48.5 ${v159n(x+s*0.6)} 49" stroke="${soc}" stroke-width=".8" fill="none" opacity=".7"/>`;};
  /* yüz modelleme: ışık sol üstten; elmacık, yanak çukuru, çene altı, şakak */
  const model=`<path d="M${v159n(50+f*0.45)} ${T+3} Q${v159n(50+f+0.5)} ${T+18} ${v159n(50+jw)} ${jy} Q${v159n(50+cw+2)} ${v159n(cy-0.5)} 50 ${cy} Q${v159n(50+jw*0.9)} 52 ${v159n(50+f*0.45)} ${T+3}Z" fill="#000" opacity=".07"/>`+
    `<ellipse cx="${v159n(50-f*0.55)}" cy="47.4" rx="3.6" ry="1.9" fill="#fff" opacity=".12" transform="rotate(-18 ${v159n(50-f*0.55)} 47.4)"/><ellipse cx="${v159n(50+f*0.55)}" cy="47.4" rx="3.4" ry="1.7" fill="#fff" opacity=".06" transform="rotate(18 ${v159n(50+f*0.55)} 47.4)"/>`+
    `<path d="M${v159n(50-f*0.72)} 50.5 Q${v159n(50-f*0.6)} 56 ${v159n(50-f*0.42)} 59 M${v159n(50+f*0.72)} 50.5 Q${v159n(50+f*0.6)} 56 ${v159n(50+f*0.42)} 59" stroke="${lo}" stroke-width="2.4" fill="none" opacity=".2" stroke-linecap="round"/>`+
    `<ellipse cx="${v159n(50-7.4)}" cy="${v159n(ey-0.6)}" rx="${v159n(4.6*ez)}" ry="${v159n(3.1*ez)}" fill="${soc}" opacity=".3"/><ellipse cx="${v159n(50+7.4)}" cy="${v159n(ey-0.6)}" rx="${v159n(4.6*ez)}" ry="${v159n(3.1*ez)}" fill="${soc}" opacity=".34"/>`+
    `<ellipse cx="50" cy="${T+7}" rx="${v159n(f*0.55)}" ry="4" fill="#fff" opacity=".07"/>`+
    `<ellipse cx="50" cy="${v159n(cy-2.6)}" rx="3.4" ry="1.6" fill="#fff" opacity=".08"/>`+
    (L.frk?`<g fill="${dk}" opacity=".3"><circle cx="41" cy="49" r=".5"/><circle cx="43" cy="50.3" r=".45"/><circle cx="45" cy="49.4" r=".4"/><circle cx="57" cy="49.2" r=".5"/><circle cx="59" cy="50.4" r=".45"/><circle cx="55" cy="49.6" r=".4"/></g>`:'')+
    (L.chin?`<path d="M49.3 ${v159n(cy-2.4)} Q50 ${v159n(cy-1.4)} 50.7 ${v159n(cy-2.4)}" stroke="${lo}" stroke-width=".7" fill="none"/>`:'');
  /* yaş çizgileri */
  const wr=(age>=30?`<path d="M${v159n(46.3)} 52.4 Q44.6 55 45 57.6 M53.7 52.4 Q55.4 55 55 57.6" stroke="${lo}" stroke-width=".7" fill="none" opacity="${age>=45?.6:.3}"/>`:'')+
    (age>=45?`<path d="M42.5 31 Q50 29.6 57.5 31 M44 33.6 Q50 32.6 56 33.6" stroke="${lo}" stroke-width=".6" fill="none" opacity=".55"/><path d="M${v159n(50-11.5)} 44.5 l-1.6 .8 M${v159n(50-11.5)} 45.6 l-1.5 1.2 M${v159n(50+11.5)} 44.5 l1.6 .8 M${v159n(50+11.5)} 45.6 l1.5 1.2" stroke="${lo}" stroke-width=".45" opacity=".6"/>`:'');
  /* gözler */
  const eye=(x,s)=>{const w=3.05*ez,h=1.75*ez;return `<path d="M${v159n(x-w)} ${ey} Q${v159n(x-s*0.3)} ${v159n(ey-h*1.25)} ${v159n(x+w)} ${v159n(ey-0.15)} Q${v159n(x+s*0.2)} ${v159n(ey+h*0.95)} ${v159n(x-w)} ${ey}Z" fill="#efe9e2"/>`+
    `<circle cx="${v159n(x+0.15)}" cy="${v159n(ey-0.1)}" r="${v159n(1.42*ez)}" fill="${eyeC}"/><circle cx="${v159n(x+0.15)}" cy="${v159n(ey-0.1)}" r="${v159n(0.7*ez)}" fill="#090605"/><circle cx="${v159n(x+0.6)}" cy="${v159n(ey-0.65)}" r="${v159n(0.36*ez)}" fill="#fff" opacity=".9"/>`+
    `<path d="M${v159n(x-w-0.2)} ${v159n(ey+0.15)} Q${v159n(x-s*0.3)} ${v159n(ey-h*1.4)} ${v159n(x+w+0.2)} ${v159n(ey-0.2)}" stroke="${shade(sk,-0.62)}" stroke-width="1" fill="none" stroke-linecap="round"/>`+
    `<path d="M${v159n(x-w+0.6)} ${v159n(ey-h-0.9)} Q${v159n(x)} ${v159n(ey-h*1.9-0.4)} ${v159n(x+w-0.2)} ${v159n(ey-h-0.6)}" stroke="${soc}" stroke-width=".55" fill="none" opacity=".6"/>`+
    `<path d="M${v159n(x-w+0.8)} ${v159n(ey+0.9)} Q${v159n(x)} ${v159n(ey+h+0.4)} ${v159n(x+w-0.6)} ${v159n(ey+0.6)}" stroke="${soc}" stroke-width=".45" fill="none" opacity=".45"/>`;};
  const bw=clamp(L.brw||2.5,1.8,3.4)*0.42,bt=(L.btl||0)*0.3;
  const brow=s=>{const xi=50+s*2.7,xo=50+s*11.4,y=39.3;return `<path d="M${v159n(xi)} ${v159n(y+0.7-bt*s*0)} Q${v159n(50+s*7)} ${v159n(y-1.5-bt)} ${v159n(xo)} ${v159n(y+0.4)} Q${v159n(50+s*7)} ${v159n(y-1.5+bw*1.1-bt)} ${v159n(xi)} ${v159n(y+0.7+bw*1.8)}Z" fill="${brC}"/>`;};
  /* burun */
  const nwd=[2.9,3.4,2.6][L.nose||0];
  const nose=`<path d="M48.9 41.5 Q48.4 46.5 ${v159n(50-nwd+0.3)} 50" stroke="${lo}" stroke-width=".8" fill="none" opacity=".35"/><path d="M51.3 41.5 Q52.2 46.5 ${v159n(50+nwd)} 50.2" stroke="${lo}" stroke-width="1.3" fill="none" opacity=".4"/>`+
    `<path d="M49.7 42 Q49.5 46.5 49.6 49.4" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".16" fill="none"/>`+
    `<ellipse cx="50" cy="53.2" rx="${v159n(nwd+0.4)}" ry="1" fill="${lo}" opacity=".4"/>`+
    `<path d="M${v159n(50-nwd)} 50.2 Q${v159n(50-nwd-0.6)} 52.6 ${v159n(50-nwd+1.6)} 52.5 Q50 53.5 ${v159n(50+nwd-1.6)} 52.5 Q${v159n(50+nwd+0.6)} 52.6 ${v159n(50+nwd)} 50.2" stroke="${soc}" stroke-width=".85" fill="none" opacity=".75" stroke-linecap="round"/>`+
    `<ellipse cx="${v159n(50-1.4)}" cy="52.4" rx=".85" ry=".45" fill="${dk}" opacity=".55"/><ellipse cx="${v159n(50+1.4)}" cy="52.4" rx=".85" ry=".45" fill="${dk}" opacity=".55"/><ellipse cx="49.6" cy="50.4" rx="1.1" ry=".8" fill="#fff" opacity=".14"/>`;
  /* ağız */
  const m=L.mth||0,my=57.3,cu=m===0?0:m===1?-0.7:-1.1;
  const mouth=`<path d="M44.8 ${v159n(my+cu*0.6)} Q47.4 ${v159n(my-1.5)} 50 ${v159n(my-0.9)} Q52.6 ${v159n(my-1.5)} 55.2 ${v159n(my+cu*0.6)} Q50 ${v159n(my+0.2)} 44.8 ${v159n(my+cu*0.6)}Z" fill="${lip}"/>`+
    `<path d="M45.4 ${v159n(my+cu*0.4)} Q50 ${v159n(my+3.1+cu*0.4)} 54.6 ${v159n(my+cu*0.4)} Q50 ${v159n(my+0.6)} 45.4 ${v159n(my+cu*0.4)}Z" fill="${lipL}"/>`+
    (m===2?`<path d="M45.8 ${v159n(my+cu*0.5)} Q50 ${v159n(my+1.7)} 54.2 ${v159n(my+cu*0.5)} Q50 ${v159n(my+0.4)} 45.8 ${v159n(my+cu*0.5)}Z" fill="#f4f0ea"/>`:'')+
    `<path d="M44.6 ${v159n(my+cu*0.6)} Q50 ${v159n(my+0.5+(m?0.6:0))} 55.4 ${v159n(my+cu*0.6)}" stroke="${shade(sk,-0.6)}" stroke-width=".75" fill="none" stroke-linecap="round" opacity=".85"/>`+
    `<ellipse cx="50" cy="${v159n(my+1.7)}" rx="2.2" ry=".5" fill="#fff" opacity=".14"/><ellipse cx="50" cy="${v159n(my+3.8)}" rx="3.2" ry="1" fill="${lo}" opacity=".3"/>`;
  const gl=L.gl?`<g fill="rgba(200,220,255,.1)" stroke="#1d1d1d" stroke-width="1.1"><rect x="37.6" y="40.6" width="9.8" height="6.6" rx="2.2"/><rect x="52.6" y="40.6" width="9.8" height="6.6" rx="2.2"/><path d="M47.4 43 Q50 41.8 52.6 43 M37.6 42.6 L${v159n(50-f)} 41.8 M62.4 42.6 L${v159n(50+f)} 41.8" fill="none"/></g>`:'';
  const LLx=Object.assign(LL,{});
  return `<svg viewBox="0 0 100 112" width="78" height="88" aria-hidden="true">${defs}${v159Hair(LLx,f,T,id,false,o)}${body}${ear(-1)}${ear(1)}`+
    `<path d="${head}" fill="url(#${id}f)"/>${model}${wr}${v159Beard(LLx,f,jw,jy,cy,cw)}${v159Hair(LLx,f,T,id,true,o)}`+
    `${brow(-1)}${brow(1)}${eye(42.6,-1)}${eye(57.4,1)}${nose}${mouth}${gl}</svg>`;};
/* varsayılan görünüşlü oyuncu avatarı da yeni çizimle */
try{avatarSVG=(old=>function(c1,c2,num,age){try{return faceSVG(Object.assign({},lookNow(age)),{c1,c2,num,age});}catch(e){return old.apply(this,arguments);}})(avatarSVG);}catch(e){}
/* ---------- 3) kariyer sihirbazı: 9 tonluk ten paleti ve sporcu saç modelleri ---------- */
try{SKIN_OPT.splice(0,SKIN_OPT.length,...SKN);
  const add=[['crop','Kısa kesim (crop)'],['quiff','Kabarık ön'],['curlytop','Kıvırcık üst'],['textured','Dağınık kısa'],['braids','Örgü (cornrow)'],['medium','Orta boy']];
  for(const [k,n] of add)if(!HAIR_OPT.some(x=>x[0]===k))HAIR_OPT.push([k,n]);
  for(const x of HAIR_OPT){if(x[0]==='dread')x[1]='Rasta';if(x[0]==='bun')x[1]='Topuz (man-bun)';if(x[0]==='short')x[1]='Kısa (crew)';if(x[0]==='side')x[1]='Yana tarama (undercut)';}
  if(!BD_OPT.some(x=>x[0]==='short'))BD_OPT.splice(2,0,['short','Kısa sakal']);}catch(e){}
