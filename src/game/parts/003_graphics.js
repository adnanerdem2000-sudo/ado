/* ================= GRAPHICS ================= */
function starPts(cx,cy,R,r,rot=-Math.PI/2){const p=[];for(let i=0;i<10;i++){const a=rot+i*Math.PI/5,d=i%2?r:R;p.push((cx+Math.cos(a)*d).toFixed(1)+','+(cy+Math.sin(a)*d).toFixed(1));}return p.join(' ');}
let CRN=0;
function crestSVG(c,size=40){
  {const nc=c&&typeof c.id==='string'&&/^n[A-Z]{3}$/.test(c.id)?c.id.slice(1):null;if(nc&&typeof FLAGS!=='undefined'&&FLAGS[nc])return `<img class="crest crest-fl" src="${FLAGS[nc]}" width="${size}" height="${Math.round(size*0.75)}" alt="" style="flex-shrink:0;border-radius:3px;box-shadow:0 0 0 1px rgba(255,255,255,.35)">`;}
  const id='k'+(CRN++),h=hash(c.id);
  const shape=c.shape??h%3,pat=c.pat??(h>>2)%5;
  const SH=['M50 4 L94 15 V56 C94 86 74 104 50 116 C26 104 6 86 6 56 V15 Z',null,'M10 6 H90 V62 C90 90 70 108 50 116 C30 108 10 90 10 62 Z'];
  const el=shape===1?'<circle cx="50" cy="60" r="46"/>':`<path d="${SH[shape]}"/>`;
  let body;
  if(c.flag==='TR'){body=`<rect width="100" height="120" fill="#e30a17"/><circle cx="44" cy="60" r="22" fill="#fff"/><circle cx="50" cy="60" r="17.6" fill="#e30a17"/><polygon points="${starPts(73,60,9.5,3.8,Math.PI)}" fill="#fff"/>`;}
  else{const A=c.c1,B=c.c2;body=`<rect width="100" height="120" fill="${A}"/>`+['',`<rect x="50" width="50" height="120" fill="${B}"/>`,[12.5,37.5,62.5].map(x=>`<rect x="${x}" width="12.5" height="120" fill="${B}"/>`).join(''),`<path d="M-10 34 L34 -10 L120 76 L76 120Z" fill="${B}"/>`,`<rect y="44" width="100" height="24" fill="${B}"/>`][pat];}
  const L=c.short.length;
  const label=c.flag==='TR'?'':`<text x="50" y="${L>3?70:73}" text-anchor="middle" font-family="Saira Extra Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="${L>3?26:L>2?33:40}" fill="#fff" stroke="rgba(0,0,0,.6)" stroke-width="5" paint-order="stroke">${esc(c.short)}</text>`;
  const star=((c.star||h%6===0)&&c.flag!=='TR')?`<polygon points="${starPts(50,24,7,3)}" fill="#fff" stroke="rgba(0,0,0,.45)" stroke-width="1.5"/>`:'';
  return `<svg class="crest" viewBox="0 0 100 120" width="${size}" height="${Math.round(size*1.2)}" aria-hidden="true" style="flex-shrink:0"><defs><clipPath id="${id}">${el}</clipPath></defs><g clip-path="url(#${id})">${body}</g>${star}${label}<g fill="none" stroke="rgba(255,255,255,.9)" stroke-width="3">${el}</g><g fill="none" stroke="rgba(0,0,0,.45)" stroke-width="1.2">${el}</g></svg>`;
}
/* Cenk: esmer, kısa siyah saç, 1,74 boy */
function avatarSVG(c1,c2,num,age){
  const skin='#a8704a',sh='#8e5b39',hair='#140d09';
  const curls=[[30,37,6],[30.5,29,6.5],[34.5,21.5,7],[41.5,16.5,7],[50,14.5,7.5],[58.5,16.5,7],[65.5,21.5,7],[69.5,29,6.5],[70,37,6],[38,25,6],[46,21,6.5],[54,21,6.5],[62,25,6],[43.5,28,5],[56.5,28,5],[50,26,5.5]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  const shine=[[36,20],[47,15],[59,17],[66,27],[32,30],[52,23],[42,25]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7"/>`).join('');
  const scruff=age>=19?`<path d="M34 49 Q36 63 50 65 Q64 63 66 49 Q64 59 50 60 Q36 59 34 49Z" fill="${hair}" opacity=".35"/>`:'';
  return `<svg viewBox="0 0 100 112" width="78" height="88" aria-hidden="true">
  <path d="M10 112 C12 86 24 76 38 72 L50 80 L62 72 C76 76 88 86 90 112 Z" fill="${c1}" stroke="${c2}" stroke-width="3"/>
  <path d="M38 72 L50 86 L62 72" fill="none" stroke="${c2}" stroke-width="4"/>
  <rect x="42.5" y="57" width="15" height="17" rx="6" fill="${sh}"/>
  <ellipse cx="50" cy="42" rx="19" ry="22" fill="${skin}"/>
  <ellipse cx="30.8" cy="45" rx="3.2" ry="5.2" fill="${sh}"/><ellipse cx="69.2" cy="45" rx="3.2" ry="5.2" fill="${sh}"/>
  <g fill="${hair}">${curls}</g><g fill="#5a3b26" opacity=".7">${shine}</g>
  <path d="M38.5 38.5 L46 37.5" stroke="${hair}" stroke-width="2.6" stroke-linecap="round"/><path d="M54 37.5 L61.5 38.5" stroke="${hair}" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="42.5" cy="44" r="2.3" fill="${hair}"/><circle cx="57.5" cy="44" r="2.3" fill="${hair}"/>
  <path d="M48.5 46.5 Q50 51 52 49.5" stroke="${sh}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M43.5 55 Q50 58.5 56.5 55" stroke="#5a3220" stroke-width="2" fill="none" stroke-linecap="round"/>${scruff}
  <text x="50" y="106" text-anchor="middle" font-family="Saira Extra Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="19" fill="${c2}">${num}</text></svg>`;
}
const ICON={
  career:'<svg viewBox="0 0 24 24"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5"/></svg>',
  squad:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5M14.5 14.6c2.6-.4 5 .9 5.8 4.4"/></svg>',
  board:'<svg viewBox="0 0 24 24"><path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6M9 11h.01M15 11h.01"/></svg>',
  hub:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 5v14"/><circle cx="12" cy="12" r="2.6"/></svg>',
  player:'<svg viewBox="0 0 24 24"><path d="M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3c-.6 1.4-2.2 2.2-4 2.2S8.6 5.4 8 4z"/></svg>',
  league:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16M9 4v16"/></svg>',
  inbox:'<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="m3 7 9 6 9-6"/></svg>',
  life:'<svg viewBox="0 0 24 24"><path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4l-5.3 3 1.2-6-4.5-4.1 6-.7z"/></svg>',
  train:'<svg viewBox="0 0 24 24"><path d="M12 3 7 20h10z"/><path d="M5 20h14M9 13h6"/></svg>',
  rest:'<svg viewBox="0 0 24 24"><path d="M19 14.5A8 8 0 1 1 9.5 5a6.5 6.5 0 0 0 9.5 9.5z"/></svg>',
  video:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>',
  social:'<svg viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg>',
  rehab:'<svg viewBox="0 0 24 24"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>',
  family:'<svg viewBox="0 0 24 24"><path d="M3 11 12 4l9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>',
};

