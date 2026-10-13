function footOf(p){if(!p||!p.name)return null;const v=FOOT_DB[p.name];if(!v)return null;return {ft:v[0]==='L'?'Sol':v[0]==='B'?'İki ayak':'Sağ',wf:Math.max(1,Math.min(5,+v[1]||3)),src:1};}
pMetaX=(old=>function(p){const M=old.apply(this,arguments);try{const f=footOf(p);if(f){M.ft=f.ft;M.wf=f.wf;M.ftDb=1;}else if(p&&p.k==='ME'&&G&&G.p&&G.p.foot){M.ft=/sol|^l/i.test(G.p.foot)?'Sol':/iki|^b/i.test(G.p.foot)?'İki ayak':'Sağ';}}catch(e){}return M;})(pMetaX);
/* 3B maç motoru: oyuncunun güçlü ayağı gerçek veriden; zayıf ayağı iyi olan oyuncu ara sıra öbür ayağıyla vurur */
f3Look=(old=>function(p,i){const r=old.apply(this,arguments);try{const M=pMetaX(Object.assign({},pByKey(p.k)||{},p));r.ft=M.ft==='Sol'?'L':'R';r.wf=M.wf;r.ftB=M.ft==='İki ayak';}catch(e){}return r;})(f3Look);
const F3FT=[];
f3Look=(old=>function(p,i){const r=old.apply(this,arguments);try{F3FT[i]=[r.ft,r.ftB?5:(r.wf||3)];}catch(e){}return r;})(f3Look);
f3Kick=function(c,kind,pw){try{if(!F3.on||!F3.R||!F3.map||!c)return;const i=F3.map.get(c);if(i==null)return;const B=FX.ball;let k=kind;if(k==='pass'&&B.fl&&((B.fl.h||B.fl.vz||0)>2||Math.hypot((B.fl.tx||0)-(B.fl.x0||0),(B.fl.ty||0)-(B.fl.y0||0))>28))k='pass_high';
  const f=F3FT[i];let foot;if(f&&k!=='head'){const weak=Math.random()<[0,.04,.09,.16,.26,.45][f[1]]||0;foot=weak?(f[0]==='L'?'R':'L'):f[0];}F3.R.kick(i,k,pw,foot);}catch(e){}};
/* sonradan eklenen yıldızlar için gerçek görünüm (boy, ten, saç, renk, sakal) */
Object.assign(LOOKS,{"Arda Güler":[176,2,2,1,0],"Kenan Yıldız":[186,2,4,1,0],"Lamine Yamal":[180,4,7,0,0],"Can Uzun":[187,2,2,1,0]});
/* sezon başında 'yavaş gelişim' denmesin */
devWord=(old=>function(di,p){try{if(seasonFrac()<0.15&&di&&Math.abs(di.delta)<1)return 'sezon yeni başladı';}catch(e){}return old.apply(this,arguments);})(devWord);

