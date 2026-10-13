/* ================= v112: daha gerçekçi profil yüzleri + profil ↔ 3B ten ve saç rengi birebir aynı =================
   Yüz: hacim veren ışık gradyanı, göz çukuru ve elmacık gölgesi, burun kemeri parlaması, dudak rengi, göz bebeği ve ışık yansıması, boyun gölgesi, formada kumaş ışığı.
   3B: Ado3D artık 5 tonluk paletin en yakınını değil profildeki tonun kendisini (skc/hcc) kullanır. */
let FACE_ID=0;
faceSVG=(old=>function(L,o){let s=old.apply(this,arguments);try{if(!L||!L.sk||!/^#[0-9a-f]{6}$/i.test(L.sk))return s;o=o||{};const id='fc'+(++FACE_ID),sk=L.sk;
  const hi=mixC(sk,'#ffffff',.16),lo=shade(sk,-.2),soc=shade(sk,-.26),lip=mixC(shade(sk,-.12),'#a8483f',.38),blush=mixC(sk,'#d4553f',.5),ey=44+(L.fs===2?0.6:0)+0.2,ez=L.eyz||1;
  const defs=`<defs><radialGradient id="${id}f" cx="42%" cy="34%" r="72%"><stop offset="0" stop-color="${hi}"/><stop offset=".55" stop-color="${sk}"/><stop offset="1" stop-color="${lo}"/></radialGradient>
    <linearGradient id="${id}j" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".16"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
    <radialGradient id="${id}b" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${blush}" stop-opacity=".22"/><stop offset="1" stop-color="${blush}" stop-opacity="0"/></radialGradient></defs>`;
  s=s.replace(/(<svg[^>]*>)/,`$1${defs}`);
  /* forma ışığı: boynun hemen önüne */
  const jer=o.coach?`<path d="M8 112 C10 86 22 76 37 72 L50 84 L63 72 C78 76 90 86 92 112Z" fill="url(#${id}j)"/>`:`<path d="M10 112 C12 86 24 76 38 72 L50 80 L62 72 C76 76 88 86 90 112 Z" fill="url(#${id}j)"/>`;
  s=s.replace(/(\n\s*<rect x="42\.5" y="56")/,`${jer}$1`);
  /* boyun gölgesi */
  s=s.replace(/(<rect x="42\.5" y="56" width="15" height="18" rx="6" fill="[^"]+"\/>)/,`$1<ellipse cx="50" cy="61.5" rx="8" ry="3.6" fill="#000" opacity=".2"/>`);
  /* kafa: düz renk yerine ışık gradyanı; ardından yüz modelleme katmanı */
  let done=false;s=s.replace(new RegExp(`(<(?:ellipse cx="50" cy="42"|path d="M[^"]*")[^>]*?)fill="${sk}"\\/>`),(m,a)=>{done=true;return `${a}fill="url(#${id}f)"/>`+
    `<g pointer-events="none"><ellipse cx="42.5" cy="${ey}" rx="${4.7*ez}" ry="${3.4*ez}" fill="${soc}" opacity=".38"/><ellipse cx="57.5" cy="${ey}" rx="${4.7*ez}" ry="${3.4*ez}" fill="${soc}" opacity=".38"/>
      <ellipse cx="40" cy="51.5" rx="5.5" ry="3.6" fill="url(#${id}b)"/><ellipse cx="60" cy="51.5" rx="5.5" ry="3.6" fill="url(#${id}b)"/>
      <ellipse cx="39.5" cy="48.5" rx="3.6" ry="1.8" fill="#fff" opacity=".1"/><ellipse cx="60.5" cy="48.5" rx="3.6" ry="1.8" fill="#fff" opacity=".07"/>
      <path d="M49.6 41 Q49.2 46 49 48.6" stroke="#fff" stroke-width="1.3" stroke-linecap="round" opacity=".18" fill="none"/>
      <ellipse cx="50" cy="51.2" rx="3.4" ry="1.4" fill="${soc}" opacity=".22"/>
      <path d="M44.3 56 Q47 54.4 50 55.2 Q53 54.4 55.7 56 Q53 59.6 50 59.8 Q47 59.6 44.3 56Z" fill="${lip}" opacity=".78"/>
      <ellipse cx="50" cy="61.2" rx="4.2" ry="1.3" fill="${soc}" opacity=".18"/>
      <path d="M${50-(L.fw||18)+2} 54 Q50 69 ${50+(L.fw||18)-2} 54" stroke="${soc}" stroke-width="1.4" fill="none" opacity=".22"/></g>`;});
  /* göz bebeği + ışık yansıması + üst kapak */
  if(done)s=s.replace(/<\/svg>\s*$/,`<g pointer-events="none"><circle cx="42.8" cy="${ey}" r="${.78*ez}" fill="#0b0705"/><circle cx="57.8" cy="${ey}" r="${.78*ez}" fill="#0b0705"/><circle cx="43.4" cy="${ey-.6}" r="${.42*ez}" fill="#fff" opacity=".9"/><circle cx="58.4" cy="${ey-.6}" r="${.42*ez}" fill="#fff" opacity=".9"/>
    <path d="M${42.5-2.7*ez} ${ey-1.2*ez} Q42.5 ${ey-2.9*ez} ${42.5+2.7*ez} ${ey-1.2*ez}" stroke="${shade(sk,-.45)}" stroke-width=".9" fill="none" stroke-linecap="round"/><path d="M${57.5-2.7*ez} ${ey-1.2*ez} Q57.5 ${ey-2.9*ez} ${57.5+2.7*ez} ${ey-1.2*ez}" stroke="${shade(sk,-.45)}" stroke-width=".9" fill="none" stroke-linecap="round"/></g></svg>`);
}catch(e){}return s;})(faceSVG);
/* ---------- 3B ten ve saç: profildeki rengin kendisi ---------- */
function hex01(h){try{const n=parseInt(String(h).slice(1),16);return [(n>>16)/255,((n>>8)&255)/255,(n&255)/255];}catch(e){return null;}}
f3Look=(old=>function(p,i){const r=old.apply(this,arguments);try{let src=null;try{src=pByKey(p.k);}catch(e){}let L=null;
  if(p&&p.k==='ME'&&typeof lookNow==='function'){try{L=lookNow((G.p&&G.p.age)||25);}catch(e){}}
  if(!L)L=lookOf(p.k,(src&&src.nat)||p.nat||'TUR',(src&&src.age)||p.age||25);
  if(L&&L.sk){r.skc=hex01(L.sk);}if(L&&L.hc){r.hcc=hex01(L.hc);}}catch(e){}return r;})(f3Look);
abLook=(old=>function(p,T){const r=old.apply(this,arguments);try{if(r){const q=Object.assign({spos:p.pos==='KL'?'KL':(p.spos||''),T},p);const f=f3Look(q,0);if(f.skc)r.skc=f.skc;if(f.hcc)r.hcc=f.hcc;}}catch(e){}return r;})(abLook);

