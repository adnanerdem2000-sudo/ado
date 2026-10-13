/* ================= v107: muayene odası — bütün vücutlu karakterler ve adım adım onaylı akış ================= */
function droHair(L,cx,cy){const hc=L.hc||'#1d1d1d',hs=L.hs||'short';const top=`M${cx-19} ${cy-4}C${cx-20} ${cy-26} ${cx+20} ${cy-26} ${cx+19} ${cy-4}C${cx+14} ${cy-14} ${cx-14} ${cy-14} ${cx-19} ${cy-4}Z`;
  switch(hs){case 'bald':return '';
    case 'buzz':case 'fade':return `<path d="M${cx-18} ${cy-6}C${cx-18} ${cy-24} ${cx+18} ${cy-24} ${cx+18} ${cy-6}C${cx+12} ${cy-15} ${cx-12} ${cy-15} ${cx-18} ${cy-6}Z" fill="${hc}" opacity="${hs==='buzz'?.75:.95}"/>`;
    case 'afro':return `<circle cx="${cx}" cy="${cy-12}" r="25" fill="${hc}"/>`;
    case 'curly':case 'dread':return `<g fill="${hc}">${[[-14,-8],[-8,-16],[0,-19],[8,-16],[14,-8],[-17,0],[17,0]].map(([x,y])=>`<circle cx="${cx+x}" cy="${cy+y}" r="7.5"/>`).join('')}</g>`;
    case 'long':return `<path d="${top}" fill="${hc}"/><path d="M${cx-19} ${cy-6}C${cx-24} ${cy+18} ${cx-20} ${cy+30} ${cx-12} ${cy+34}L${cx-14} ${cy+4}Z M${cx+19} ${cy-6}C${cx+24} ${cy+18} ${cx+20} ${cy+30} ${cx+12} ${cy+34}L${cx+14} ${cy+4}Z" fill="${hc}"/>`;
    case 'bun':return `<circle cx="${cx}" cy="${cy-26}" r="8" fill="${hc}"/><path d="${top}" fill="${hc}"/>`;
    case 'mohawk':return `<path d="M${cx-5} ${cy-6}C${cx-6} ${cy-30} ${cx+6} ${cy-30} ${cx+5} ${cy-6}Z" fill="${hc}"/>`;
    case 'side':return `<path d="${top}" fill="${hc}"/><path d="M${cx-19} ${cy-6}C${cx-10} ${cy-22} ${cx+12} ${cy-22} ${cx+19} ${cy-10}L${cx+8} ${cy-12}C${cx} ${cy-10} ${cx-10} ${cy-8} ${cx-19} ${cy-6}Z" fill="${hc}"/>`;
    default:return `<path d="${top}" fill="${hc}"/>`;}}
function droBeard(L,cx,cy){const hc=L.hc||'#1d1d1d';switch(L.bd){case 'full':return `<path d="M${cx-17} ${cy+2}C${cx-16} ${cy+22} ${cx-6} ${cy+27} ${cx} ${cy+27}C${cx+6} ${cy+27} ${cx+16} ${cy+22} ${cx+17} ${cy+2}C${cx+12} ${cy+12} ${cx+6} ${cy+11} ${cx} ${cy+11}C${cx-6} ${cy+11} ${cx-12} ${cy+12} ${cx-17} ${cy+2}Z" fill="${hc}" opacity=".9"/>`;
  case 'stub':return `<path d="M${cx-16} ${cy+4}C${cx-14} ${cy+22} ${cx+14} ${cy+22} ${cx+16} ${cy+4}C${cx+10} ${cy+14} ${cx-10} ${cy+14} ${cx-16} ${cy+4}Z" fill="${hc}" opacity=".35"/>`;
  case 'goatee':return `<path d="M${cx-6} ${cy+15}C${cx-5} ${cy+25} ${cx+5} ${cy+25} ${cx+6} ${cy+15}Z" fill="${hc}" opacity=".9"/>`;
  case 'mus':return `<path d="M${cx-8} ${cy+11}C${cx-3} ${cy+8} ${cx+3} ${cy+8} ${cx+8} ${cy+11}C${cx+3} ${cy+10} ${cx-3} ${cy+10} ${cx-8} ${cy+11}Z" fill="${hc}"/>`;default:return '';}}
function droChar(L,o){o=o||{};L=L||{sk:'#d9a77c',hc:'#2b1a10',hs:'short'};const sk=L.sk||'#d9a77c',skd=typeof shade==='function'?shade(sk,-0.18):sk,c1=o.c1||'#1f6feb',c2=o.c2||'#ffffff',coat=!!o.coat,cx=60,cy=38;
  const lum=h=>{try{const n=parseInt(h.slice(1),16);return ((n>>16)*299+((n>>8)&255)*587+(n&255)*114)/1000;}catch(e){return 128;}};const numC=lum(c1)>150?'#151515':'#ffffff';
  const legs=coat?`<rect x="44" y="176" width="13" height="74" rx="5" fill="#2b3442"/><rect x="63" y="176" width="13" height="74" rx="5" fill="#252d3a"/><path d="M41 250h18v8H39z M61 250h18l2 8H61z" fill="#14171c"/>`
    :`<rect x="45" y="182" width="12" height="22" rx="5" fill="${sk}"/><rect x="63" y="182" width="12" height="22" rx="5" fill="${skd}"/><rect x="44" y="202" width="14" height="48" rx="5" fill="${c1}"/><rect x="62" y="202" width="14" height="48" rx="5" fill="${c1}" opacity=".9"/><rect x="44" y="208" width="14" height="4" fill="${c2}"/><rect x="62" y="208" width="14" height="4" fill="${c2}"/><path d="M40 248h19v10H38z M61 248h19l2 10H61z" fill="#121418"/><path d="M38 256h21M61 256h21" stroke="#e8e8e8" stroke-width="1.6"/>`;
  const shorts=coat?'':`<path d="M42 150h36l2 36H62l-2-12-2 12H40z" fill="${c2}"/><path d="M42 150h36v6H42z" fill="${c1}" opacity=".5"/>`;
  const arms=`<path d="M33 80c-6 4-9 18-9 34l-1 34h10l2-30 3-24z" fill="${coat?'#f4f7fa':c1}"/><path d="M87 80c6 4 9 18 9 34l1 34H87l-2-30-3-24z" fill="${coat?'#e6ebf0':c1}" opacity=".95"/>`+
    (coat?'':`<path d="M24 112h10l-1 36H23z" fill="${sk}"/><path d="M86 112h10l1 36H87z" fill="${skd}"/>`)+`<circle cx="28" cy="152" r="5.5" fill="${sk}"/><circle cx="92" cy="152" r="5.5" fill="${skd}"/>`;
  const torso=coat?`<path d="M36 76c6-6 16-8 24-8s18 2 24 8l4 112H32z" fill="#f4f7fa"/><path d="M60 72 52 84l8 70 8-70z" fill="#7fb2d9"/><path d="M60 82l-3 6 3 40 3-40z" fill="#244a73"/><path d="M60 72 46 90l6 6M60 72l14 18-6 6" fill="none" stroke="#cdd6df" stroke-width="2"/><path d="M45 84c-2 14 4 24 15 26c11-2 17-12 15-26" fill="none" stroke="#34404d" stroke-width="2.2"/><circle cx="60" cy="112" r="4" fill="#9aa7b4"/><rect x="66" y="120" width="12" height="8" rx="2" fill="#dfe6ec"/><path d="M60 120v68" stroke="#d3dbe2" stroke-width="1.5"/>`
    :`<path d="M36 76c6-6 16-8 24-8s18 2 24 8l2 76H34z" fill="${c1}"/><path d="M84 76l2 76H72l4-74z" fill="#000" opacity=".1"/><path d="M50 70c4 6 16 6 20 0" fill="none" stroke="${c2}" stroke-width="4"/><text x="60" y="122" text-anchor="middle" font-family="Barlow Condensed,Inter,sans-serif" font-weight="800" font-size="26" fill="${numC}">${o.num!=null?esc(String(o.num)):''}</text>`;
  const neck=`<path d="M53 56h14v16c-4 3-10 3-14 0z" fill="${skd}"/>`;
  const head=`<ellipse cx="${cx-18}" cy="${cy+3}" rx="3.5" ry="5.5" fill="${skd}"/><ellipse cx="${cx+18}" cy="${cy+3}" rx="3.5" ry="5.5" fill="${skd}"/><ellipse cx="${cx}" cy="${cy}" rx="18" ry="21" fill="${sk}"/><path d="M${cx+6} ${cy-18}c8 6 12 16 12 18c0 10-4 18-10 22c4-8 6-24-2-40z" fill="#000" opacity=".08"/>`+
    `<path d="M${cx-11} ${cy-4}q4-3 8 0M${cx+3} ${cy-4}q4-3 8 0" stroke="${L.hc||'#222'}" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="${cx-7}" cy="${cy+2}" rx="2.2" ry="2.6" fill="#1b1b1b"/><ellipse cx="${cx+7}" cy="${cy+2}" rx="2.2" ry="2.6" fill="#1b1b1b"/><circle cx="${cx-6.3}" cy="${cy+1.2}" r=".7" fill="#fff"/><circle cx="${cx+7.7}" cy="${cy+1.2}" r=".7" fill="#fff"/>`+
    `<path d="M${cx} ${cy+3}q-3 6 0 8q2 0 3-1" stroke="${skd}" stroke-width="1.6" fill="none"/>`+(o.mood==='pain'?`<path d="M${cx-6} ${cy+15}q6-4 12 0" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>`:`<path d="M${cx-6} ${cy+13}q6 5 12 0" stroke="#7a3b2e" stroke-width="2" fill="none" stroke-linecap="round"/>`)+droBeard(L,cx,cy)+droHair(L,cx,cy);
  return `<svg class="dro-char" viewBox="0 0 120 266" width="${o.w||110}" height="${Math.round((o.w||110)*266/120)}" aria-hidden="true"><ellipse cx="60" cy="260" rx="30" ry="5" fill="#000" opacity=".22"/>${legs}${shorts}${arms}${torso}${neck}${head}</svg>`;}
droPatientSVG=function(){const p=DRO.p,c=CLUBS[G.club]||{c1:'#1f6feb',c2:'#fff'};let L=null;try{L=lookOf(p.k,p.nat,p.age);}catch(e){}return droChar(L,{c1:c.c1,c2:c.c2,num:p.num,mood:'pain',w:118});};
droDocSVG=function(){let L=null;try{L=G.p.look||lookOf('me-dr','TUR',G.p.age||40,true);}catch(e){}return droChar(L,{coat:true,w:104});};
/* ---------- adım adım akış: adım onaylanmadan sonraki açılmaz ---------- */
const DRO_REQ={sk:{n:2,t:'Hastaya en az 2 soru sor'},mu:{n:2,t:'En az 2 muayene yap (vücut haritası dahil)'},tt:{n:1,t:'Bir tetkik iste ya da tetkike gerek olmadığını onayla'}};
function droDone(step){if(step==='sk')return Object.keys(DRO.asked||{}).length;if(step==='mu')return Object.keys(DRO.did||{}).filter(k=>!/^t/.test(k)).length;if(step==='tt')return Object.keys(DRO.did||{}).filter(k=>/^t/.test(k)&&DRO.did[k]).length+(DRO.ttSkip?1:0);return 0;}
droOpen=(old=>function(cs){old.apply(this,arguments);DRO.unl=cs.step===1?4:0;DRO.ttSkip=0;droUIOnly();})(droOpen);
droUI=(old=>function(){let h=old.apply(this,arguments);try{const cs=droCase();if(!cs)return h;const idx=DRO_STEPS.findIndex(x=>x[0]===DRO.step),unl=DRO.unl||0;
  /* kilitli sekmeler */
  h=h.replace(/<button type="button" class="dro-tab([^"]*)" data-dro="tab:(\w+)"([^>]*)>/g,(m,cls,k,rest)=>{const i=DRO_STEPS.findIndex(x=>x[0]===k);const lock=i>unl||(cs.step===1&&k!=='tx');const done=i<unl;return `<button type="button" class="dro-tab${cls}${done?' done':''}${lock?' lock':''}" data-dro="tab:${k}" ${lock?'disabled':''}>${done?'✔ ':lock?'🔒 ':''}`;}).replace(/data-dro="tab:(\w+)"([^>]*)>(✔ |🔒 )?(\d)\. /g,(m,k,r,ic,n)=>`data-dro="tab:${k}"${r}>${ic||''}${n}. `);
  /* sonraki adım düğmesi: koşul sağlanınca */
  const R=DRO_REQ[DRO.step];if(R){const have=droDone(DRO.step),ok=have>=R.n,nm=DRO_STEPS[idx+1][1];
    const btn=`<div class="dro-next"><button type="button" class="cta sm" data-dro="next" ${ok?'':'disabled'}>${ok?`Onayla, ${nm.toLowerCase()} adımına geç ›`:`${R.t} (${Math.min(have,R.n)}/${R.n})`}</button>${DRO.step==='tt'&&!ok?'<button type="button" class="btn sm" data-dro="ttskip">Tetkike gerek yok</button>':''}</div>`;
    h=h.replace(/<div class="dro-next">[\s\S]*?<\/div>(?=<\/div><div class="dro-notes">)/,btn);}}catch(e){console.warn(e);}return h;})(droUI);
droClick=(old=>function(ev){const b=ev.target.closest('[data-dro]');if(!b)return old.apply(this,arguments);const [k,v]=b.dataset.dro.split(':');
  if(k==='tab'){const i=DRO_STEPS.findIndex(x=>x[0]===v);if(i>(DRO.unl||0))return;}
  if(k==='next'){const R=DRO_REQ[DRO.step];if(R&&droDone(DRO.step)<R.n)return;const i=DRO_STEPS.findIndex(x=>x[0]===DRO.step);DRO.unl=Math.max(DRO.unl||0,i+1);DRO.step=DRO_STEPS[i+1][0];droSay(DRO.step==='mu'?'Tamam hocam, muayene olayım.':DRO.step==='tt'?'Tahlil gerekiyor mu hocam?':DRO.step==='dx'?'Ne düşünüyorsunuz hocam?':'');droUIOnly();return;}
  if(k==='ttskip'){DRO.ttSkip=1;droFind('Tetkik istenmedi; klinik bulgularla karar verilecek','');const i=DRO_STEPS.findIndex(x=>x[0]==='tt');DRO.unl=Math.max(DRO.unl||0,i+1);DRO.step='dx';droUIOnly();return;}
  if(k==='dx'){if((DRO.unl||0)<3)return;DRO.unl=4;}
  return old.apply(this,arguments);})(droClick);

