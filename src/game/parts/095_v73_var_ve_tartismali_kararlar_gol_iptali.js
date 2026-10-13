/* ================= v73: VAR ve tartışmalı kararlar — gol iptali, penaltı incelemesi, kırmızı kart incelemesi; maç sonrası gündem ve basın tepkisi ================= */
const VAR_DIS=['ofsayt (omuz önde)','gol öncesi faul','hücum oyuncusunun eliyle oynaması','topun önceden çizgiyi geçmesi'];
function varLog(S,o){(S.varN=S.varN||[]).push(Object.assign({m:fxMin()},o));}
fxShotEnd=(old=>function(f){const S=FX;let pre=null;try{if(S&&f&&f.res==='g'&&f.from&&!f.setK&&S.phase==='play'){const c=f.from,T=c.T,as=c.lastFrom&&S.pt-c.lfT<6&&c.lastFrom.T===T?c.lastFrom:null;pre={c,T,as,n:(S.grec||[]).length,ns:S.scorers.length};}}catch(e){}
  const r=old.apply(this,arguments);
  try{if(pre&&S===FX&&!S.pl3&&!S.scr&&Math.random()<0.075){pre.dis=Math.random()<0.55;pre.why=pick(VAR_DIS);S.varPend=pre;fxEv(fxMin(),'📺 VAR golü inceliyor…','bold');try{fxSay('Bir dakika, VAR golü inceliyor.',true);}catch(e){}}}catch(e){console.warn(e);}return r;})(fxShotEnd);
function varResolve(toSide){const S=FX,V=S.varPend;S.varPend=null;if(!V)return false;const mn=fxMin(),T=V.T;
  if(!V.dis){fxEv(mn,`📺 VAR: gol geçerli! ${T.name} sevinci yeniden başlıyor.`,'bold');varLog(S,{k:'gol-ok',side:T.side,t:`${T.short} golü VAR incelemesinden sonra geçerli sayıldı`});return false;}
  S.score[T.side]=Math.max(0,S.score[T.side]-1);const c=V.c;c.s.g=Math.max(0,c.s.g-1);c.rt-=1;if(V.as){V.as.s.as=Math.max(0,V.as.s.as-1);V.as.rt-=0.6;}
  if(T===S.U&&S.scorers.length>V.ns){const i=S.scorers.lastIndexOf(c.k);if(i>=0)S.scorers.splice(i,1);}if(S.grec&&S.grec.length>V.n)S.grec.length=V.n;S.pop=null;S.cel=null;try{fxPopUI();}catch(e){}
  fxEv(mn,`❌ GOL İPTAL! VAR: ${V.why}. Skor ${S.score[0]}-${S.score[1]}.`,'red');try{fxSay(`Gol iptal! ${V.why}.`,true);}catch(e){}
  varLog(S,{k:'gol-iptal',side:T.side,t:`${T.short} golü VAR ile iptal edildi (${V.why})`,against:T===S.U});
  const D=S.T[toSide];fxSet(D,fxX(D,6),34,'gk');try{fxLam();}catch(e){}return true;}
fxKick=(old=>function(toSide){const S=FX;try{if(S&&S.varPend&&!(S._goalNow&&S.phase==='play')){if(varResolve(toSide))return;}}catch(e){console.warn(e);}return old.apply(this,arguments);})(fxKick);
fxFoul=(old=>function(d,c){const S=FX;if(!S)return old.apply(this,arguments);const off0=d.off,own0=S.ball.own;const T=c.T,O=d.T,u=fxU(T,c.x),v=fxV(T,c.y),near=FXL-u<19&&FXL-u>=16.5&&Math.abs(v-34)<20;
  const r=old.apply(this,arguments);const mn=fxMin();
  try{/* kırmızı kart incelemesi */
    if(!off0&&d.off&&d.yel<2&&Math.random()<0.15){d.off=false;d.yel=1;fxEv(mn,`📺 VAR: ${d.name} için verilen kırmızı kart sarıya çevrildi.`,'bold');varLog(S,{k:'kirmizi-iptal',side:O.side,t:`${O.short} oyuncusu ${d.sur} kırmızı kartı VAR ile sarıya döndü`,against:O!==S.U});fxLam();}
    /* penaltı iptali */
    else if(S.setK==='pen'&&S.ball.own!==own0&&Math.random()<0.12){const tk=S.ball.own;if(tk){tk.penT=0;tk.dt=0.4;}fxEv(mn,`📺 VAR: temas yetersiz, penaltı kararı iptal edildi!`,'red');varLog(S,{k:'pen-iptal',side:T.side,t:`${T.short} lehine verilen penaltı VAR ile iptal edildi`,against:T===S.U});fxSet(O,fxX(O,6),34,'gk');}
    /* dışarıda verilen faul aslında ceza sahası içi */
    else if(near&&S.setK==='fk'&&Math.random()<0.06){fxEv(mn,`📺 VAR: faul ceza sahası çizgisinin üzerinde! Karar penaltıya döndü.`,'bold');const tk=fxTaker(T,'pen');fxSet(T,fxX(T,FXL-11),34,'pen');S.ball.own=tk;tk.x=fxX(T,FXL-11);tk.y=34;S.ball.x=tk.x;S.ball.y=34;tk.penT=1;tk.dt=1.4;varLog(S,{k:'pen-var',side:T.side,t:`${T.short} lehine VAR incelemesiyle penaltı verildi`,against:T!==S.U});}}catch(e){console.warn(e);}return r;})(fxFoul);
/* ---------- maç sonrası gündem ---------- */
const VAR_HD=['Hakem kararları tartışılıyor','VAR yine gündemde','Tartışmalı pozisyonlar maçın önüne geçti'];
function varPost(opp,against,list,us,th){const W=G;if(!against&&Math.random()<0.5)return;const c=CLUBS[opp];const txt=list.map(x=>`${x.m}’ ${x.t}`).join('; ');
  msg('press',pick(VAR_HD),`${myClub().short} ${us}-${th} ${c?c.short:''} maçındaki kararlar spor programlarının ana konusu: ${txt}. ${against?'Taraftarlar sosyal medyada hakeme tepki gösteriyor.':'Rakip cephe kararlardan şikâyetçi.'}`);
  try{feedAdd({src:'Spor Gündemi',h:'@sporgundemi',cat:'gen',txt:`${pick(VAR_HD)}: ${txt}`.slice(0,270)});}catch(e){}
  if(against&&!isStaff()&&!isRef()){G.vp={opp,d:G.s.day,txt,us,th};}}
function vpBand(){const V=G&&G.vp;if(!V||!G.s||G.s.day-V.d>3)return '';const c=CLUBS[V.opp];
  return `<section class="panel pw-band vp-band"><span style="font-size:26px">📺</span><div><small>Maç sonrası · ${c?esc(c.name):''} maçı</small><b>Hakem kararları aleyhine oldu. Basın senden açıklama bekliyor.</b><p class="muted" style="margin:0 0 8px;font-size:12.5px">${esc(V.txt)}</p><div class="offer-btns"><button class="cta sm" data-act="vpR" data-k="sert">🔥 Hakemi eleştir</button><button class="btn sm" data-act="vpR" data-k="sakin">🤝 Saygılı ol</button><button class="btn sm ghost" data-act="vpR" data-k="yok">Yorum yapma</button></div></div></section>`;}
ACTX.vpR=el=>{const V=G.vp;if(!V)return;const k=el.dataset.k;G.vp=null;const me=isPl()?(G.p.name||'Cenk Kuşku'):(G.mode==='mgr'?coachOf(G.club).n:'');
  if(k==='sert'){const q=pick(['Bu kararlar maçın sonucunu değiştirdi. VAR odasında ne izlediklerini merak ediyorum.','Emeğimiz çalındı. Federasyon bu hakemleri açıklamalı.','Her hafta aynı şey oluyor; artık susmayacağız.']);
    msg('press',`${me}: “${q}”`,'Sert açıklaman taraftarı arkana aldı ama Disiplin Kurulu inceleme başlattı.');
    if(G.mode==='mgr'&&G.m){const m=trInit();m.fans=clamp(m.fans+3,0,100);m.media=clamp((m.media||50)-3,0,100);const fine=Math.round(clamp(myClub().str*800,10000,80000)/1000)*1000;m.budget-=fine*EUR_TL;
      if(Math.random()<0.35){G.m.tlBan=(G.m.tlBan||0)+1;msg('board','Disiplin cezası',`PFDK hakem eleştirisi nedeniyle ${eur(fine)} para cezası ve 1 maç saha kenarı cezası verdi.`);}else msg('board','Disiplin cezası',`PFDK hakem eleştirisi nedeniyle ${eur(fine)} para cezası verdi.`);}
    else if(isPl()){const fine=Math.round(clamp(OVR()*120,2000,20000)/500)*500;G.p.money-=E2U(fine);G.p.fame=clamp(G.p.fame+1,0,100);if(Math.random()<0.25){G.p.ban=(G.p.ban||0)+1;msg('board','Disiplin cezası',`Hakem eleştirisi nedeniyle ${eur(fine)} para cezası ve 1 maç men cezası aldın.`);}else msg('board','Disiplin cezası',`Hakem eleştirisi nedeniyle ${eur(fine)} para cezası aldın.`);}}
  else if(k==='sakin'){msg('press',`${me}: “Kararları tartışmayacağım, bize düşen daha iyi oynamak.”`,'Olgun tavrın medyada övgüyle karşılandı.');if(G.mode==='mgr'&&G.m){const m=trInit();m.media=clamp((m.media||50)+3,0,100);m.conf=clamp((m.conf||50)+1,0,100);}else if(isPl())G.p.trust=clamp(G.p.trust+1,0,100);}
  save();render();};
viewHub=(old=>function(){const h=old.apply(this,arguments);try{const b=vpBand();if(b)return b+h;}catch(e){}return h;})(viewHub);
mgrFinish=(old=>function(gu,go,f,sc){const S=FX&&FX.varN?FX:null,list=S?S.varN.slice():null;const r=old.apply(this,arguments);
  try{const opp=f[0]===G.club?f[1]:f[0];if(list&&list.length){varPost(opp,list.some(x=>x.against),list,gu,go);}
    else if(!S&&Math.random()<0.06){const ag=Math.random()<0.5,t=pick(ag?[`${myClub().short} lehine verilmeyen net bir penaltı`,`${myClub().short} golü tartışmalı ofsaytla iptal edildi`,'Rakibe verilen tartışmalı penaltı']:['Rakibin iptal edilen golü','Rakip lehine verilmeyen penaltı']);varPost(opp,ag,[{m:rint(10,88),t}],gu,go);}}catch(e){console.warn(e);}return r;})(mgrFinish);
/* futbolcu modu: maç sonrası tartışmalı kararlar */
finishLeague=(old=>function(res,f,role){const r=old.apply(this,arguments);try{if(isPl()&&res&&res.played!==false&&Math.random()<0.07){const opp=f[0]===G.club?f[1]:f[0],ag=Math.random()<0.55;
    const t=pick(ag?['Takımımızın golü VAR’dan döndü','Lehimize verilmeyen net bir penaltı','Rakibe verilen tartışmalı penaltı',`${G.p.name||'Cenk'}’in düşürüldüğü pozisyonda faul çalınmadı`]:['Rakibin iptal edilen golü','Rakip lehine verilmeyen penaltı']);
    varPost(opp,ag,[{m:rint(10,88),t}],res.us,res.opp);}}catch(e){console.warn(e);}return r;})(finishLeague);
/* saha kenarı cezası: bir maç tribünden */
fxStart=(old=>function(o){const r=old.apply(this,arguments);try{if(G.mode==='mgr'&&G.m&&G.m.tlBan>0&&FX&&!FX.watch){G.m.tlBan--;FX.tlBan=1;fxEv(0,'🚫 Saha kenarı cezalısın: maçı tribünden izliyorsun. Değişiklikleri yardımcın uygulayacak.','red');}}catch(e){}return r;})(fxStart);

