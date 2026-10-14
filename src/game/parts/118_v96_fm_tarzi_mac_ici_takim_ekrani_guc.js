/* ================= v96: FM tarzı maç içi takım ekranı · güç, kondisyon, reyting, kart, değişiklik, kenardan seslenme ve oyuncu tepkileri ================= */
const ABT={tab:'kadro',sel:null,react:{},last:null};
/* seslenmeye oyuncu tepkisi: kişilik, hocayla ilişki, maçın durumu ve o anki performans */
const SH_FIT={cesaret:d=>d<0?0.18:d===0?0.05:-0.08,iste:d=>d<=0?0.12:-0.05,odak:d=>d>0?0.15:0.02,sakin:d=>0.05,atesle:d=>d<0?0.12:-0.1,ovgu:d=>d>0?0.18:d===0?0:-0.15,sakla:d=>d>0?0.15:-0.05,direkt:d=>d<0?0.1:0};
const SH_P={Profesyonel:0.12,Sakin:0.06,Lider:0.1,'Hırslı':0.02,Hassas:-0.06,Asi:-0.18};
function abReact(p,k,d){let pers='Sakin';try{pers=persOf(p);}catch(e){}let rel=0;try{rel=G.m&&G.m.rel?relOf(p):0;}catch(e){}
  const rt=p.rt||6.5;let pr=0.5+(SH_P[pers]||0)+rel/220+((SH_FIT[k]||(()=>0))(d))+(k==='ovgu'&&rt>=7?0.12:0)+(k==='cesaret'&&rt<6.3?0.1:0)+(k==='atesle'&&pers==='Hassas'?-0.12:0)+(k==='sakin'&&(p.yel||0)>0?0.15:0);
  try{pr+=sF('yrd')*0.08;}catch(e){}pr=clamp(pr,0.08,0.92);const r=Math.random();return r<pr?'pos':r<pr+(1-pr)*0.6?'neu':'neg';}
const AB_RX={pos:['😀','Olumlu'],neu:['😐','Kayıtsız'],neg:['😠','Olumsuz']};
/* seslenme: her oyuncu ayrı tepki verir; olumlu tepki motorda 10 dakikalık etki, olumsuz tepki ters etki */
function abShoutRx(k){const S=ABM.fx,sim=ABM.sim;if(!S||!sim||!FX_SHOUT[k])return null;if(S.t-(S.shoutT||-999)<240){abToast('Az önce seslendin; biraz bekle');return null;}
  S.shoutT=S.t;const d=S.score[0]-S.score[1],on=fxOn(S.U),R={},cnt={pos:0,neu:0,neg:0};
  abShoutEnd();const E=AB_SH[k]||{},saved=[];
  for(const p of on){const r=abReact(p,k,d);R[p.k]=r;cnt[r]++;const q=p.ei!=null?sim.players[p.ei]:null;if(!q||q.off)continue;const o={};
    const f=r==='pos'?1:r==='neg'?-0.6:0;if(!f)continue;for(const a in E){if(q.a[a]==null)continue;o[a]=q.a[a];q.a[a]=clamp(q.a[a]+E[a]*f,1,99);}saved.push([q,o]);
    ABM.adj[p.k]=(ABM.adj[p.k]||0)+(r==='pos'?0.04:-0.04);}
  ABM.shout={until:sim.t+600/sim.C.CK,saved};S.U.sh={k,until:S.t+600};ABT.react=R;ABT.last={k,t:S.t,cnt};
  const tot=on.length||1,txt=cnt.pos/tot>=0.6?'Oyuncuların çoğu olumlu tepki verdi.':cnt.neg/tot>=0.35?'Birkaç oyuncu tepkiyle karşıladı.':'Tepkiler karışık.';
  try{fxEv(fxMin(),`Kenardan: “${FX_SHOUT[k][0]}!” ${txt}`,'tac');}catch(e){}abToast(`“${FX_SHOUT[k][0]}” · ${txt}`);return cnt;}
fxShout=(old=>function(k){const S=FX;if(S&&S.ab&&ABM.sim)return abShoutRx(k);return old.apply(this,arguments);})(fxShout);
/* ---------- panel ---------- */
function abTeamOpen(tab){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const d=W.document;let ov=d.getElementById('abh-team');if(!ov){ov=d.createElement('div');ov.id='abh-team';d.body.appendChild(ov);ov.addEventListener('click',abTeamClick);}
  if(tab)ABT.tab=tab;const st=W.ado2d.state;if(st.running&&!ABM.subPz&&ABT.tab==='kadro'){ABM.subPz=1;try{W.pauseMatch();}catch(e){}}
  ov.innerHTML=abTeamHTML();ov.hidden=false;}
function abTeamHTML(){const S=ABM.fx,U=S.U,w=!!S.watch,can=!S.pl3&&!S.scr&&!S.ref3,left=5-(U.subs||0),mn=fxMin();
  const on=fxOn(U).slice().sort((a,b)=>abOrd(a)-abOrd(b)),bench=(U.bench||[]),sel=ABT.sel&&on.find(p=>p.k===ABT.sel);
  const tabs=[['kadro','Kadro ve değişiklik'],['sesle','Kenardan seslen'],['yakl','Yaklaşım']].map(([k,n])=>`<button type="button" class="abt-tab${ABT.tab===k?' on':''}" data-tt="${k}">${n}</button>`).join('');
  let body='';
  if(ABT.tab==='kadro'){
    body=`<div class="abt-grid"><div class="abt-pitch">${abPitchSVG(on)}</div><div class="abt-tables">
      <table class="abt-t"><thead><tr><th>Mvk</th><th>Oyuncu</th><th title="Genel güç">Güç</th><th title="Kondisyon"><span class="lg">Kondisyon</span><span class="sm">Kond</span></th><th title="Maç reytingi">Rtg</th><th></th><th title="Son seslenmeye tepkisi">Tepki</th></tr></thead><tbody>
      ${on.map(p=>{const c=Math.round(p.st||100),rx=ABT.react[p.k];return `<tr class="${ABT.sel===p.k?'sel':''}${c<55?' tired':''}" data-out="${esc(p.k)}"><td><span class="abt-pos">${esc(posTag(p,U))}</span></td><td class="nm">${esc(p.name)}${p.k==='ME'?' <i class="me">sen</i>':''}</td><td><b class="abt-ovr">${R200(Math.round(p.ovr||0))}</b></td><td><span class="abt-cd"><i style="width:${c}%" class="${c<55?'lo':c<72?'md':''}"></i></span><small>%${c}</small></td><td><b class="abt-rt ${p.rt>=7.5?'g':p.rt>=6.8?'b':p.rt<5.5?'r':p.rt<6.0?'o':''}">${dec(clamp(p.rt||6.5,3,10),1)}</b></td><td>${p.yel?'🟨':''}${p.red?'🟥':''}${p.s&&p.s.g?'⚽'.repeat(Math.min(3,p.s.g)):''}</td><td>${rx?`<span title="${AB_RX[rx][1]}">${AB_RX[rx][0]}</span>`:''}</td></tr>`;}).join('')}
      </tbody></table>
      <p class="abt-h">Yedekler <small>${can?(w?'değişiklik hocaya öneri olarak gider':left+' değişiklik hakkı kaldı'):''}</small></p>
      <table class="abt-t bench"><thead><tr><th>Mvk</th><th>Oyuncu</th><th>Güç</th><th title="Kondisyon"><span class="lg">Kondisyon</span><span class="sm">Kond</span></th><th>Yaş</th><th></th></tr></thead><tbody>
      ${bench.length?bench.map(p=>{const fit=sel?abFit(p,sel):'';return `<tr data-in="${esc(p.k)}" class="${!sel||left<=0||!can?'dis':''}"><td><span class="abt-pos">${esc(dpTag(p))}</span></td><td class="nm">${esc(p.name)}</td><td><b class="abt-ovr">${R200(Math.round(p.ovr||0))}</b></td><td><span class="abt-cd"><i style="width:100%"></i></span><small>%100</small></td><td>${p.age||''}</td><td>${sel&&can&&left>0?`<button type="button" class="btn btn-primary btn-sm" data-in="${esc(p.k)}">${w?'Öner':'Oyuna al'}</button>${fit}`:''}</td></tr>`;}).join(''):'<tr><td colspan="6" class="abt-nob">Yedek yok</td></tr>'}
      </tbody></table></div></div>
      <footer><p>${sel?`<b>${esc(sel.name)}</b> çıkacak. Yerine girecek yedeği seç.`:'Değişiklik için önce sahadan çıkacak oyuncuya dokun.'}</p><button type="button" class="btn btn-primary" data-sx="close">Maça dön</button></footer>`;}
  else if(ABT.tab==='sesle'){const cool=S.t-(S.shoutT||-999)<240,L=ABT.last;
    body=`<div class="abt-sh">${Object.entries(FX_SHOUT).map(([k,v])=>`<button type="button" class="abt-shb" data-sh="${k}"${cool?' disabled':''}><b>${esc(v[0])}</b><small>${esc(v[1])}</small></button>`).join('')}</div>
      ${cool?`<p class="abt-note">Az önce seslendin. ${Math.ceil((240-(S.t-S.shoutT))/60)} dakika sonra yeniden seslenebilirsin.</p>`:''}
      ${L?`<p class="abt-h">Son seslenme: “${esc(FX_SHOUT[L.k][0])}” · ${Math.floor(L.t/60)+1}’ <small>😀 ${L.cnt.pos} · 😐 ${L.cnt.neu} · 😠 ${L.cnt.neg}</small></p><div class="abt-rx">${fxOn(S.U).map(p=>{const r=ABT.react[p.k];return r?`<span class="r-${r}">${AB_RX[r][0]} ${esc(p.sur||p.name)}</span>`:'';}).join('')}</div>`:''}
      ${w?'<p class="abt-note">Yardımcı antrenörsün: seslenme önerin hocaya gider.</p>':''}<footer><p>Olumlu tepki veren oyuncular 10 dakika boyunca etkiyi sahaya yansıtır; olumsuz tepki verenlerde ters etki olur.</p><button type="button" class="btn btn-primary" data-sx="close">Maça dön</button></footer>`;}
  else{body=`<div class="abt-sb"><div class="abh-chips">${Object.entries(TAC).map(([k,v])=>`<button type="button" class="abh-chip${U.tacK===k?' on':''}" data-tac="${k}">${esc(v.n)}</button>`).join('')}</div>
      <p class="abt-note">Ayrıntılı talimatlar (mentalite, tempo, savunma çizgisi, baskı, genişlik, kaleciden oyun kurma) için maç çubuğundaki <b>Talimatlar</b>.</p></div><footer><p>${esc(U.short)} · ${esc(TAC[U.tacK]?TAC[U.tacK].n:'Dengeli')}</p><button type="button" class="btn btn-primary" data-sx="close">Maça dön</button></footer>`;}
  return `<div class="abt"><header><h3>${esc(U.name)}</h3><span class="abt-sc">${mn}’ · ${S.score[0]}-${S.score[1]}</span><button type="button" class="btn btn-ghost icon-btn" data-sx="close" aria-label="Kapat">✕</button></header><nav class="abt-tabs">${tabs}</nav>${body}</div>`;}
const AB_ORD={KL:0,DF:1,OS:2,KN:3,FW:4};
function abOrd(p){const sim=ABM.sim,q=sim&&p.ei!=null?sim.players[p.ei]:null;const R=['GK','LB','LCB','RCB','RB','LDM','RDM','LW','AM','RW','ST'];return q?R.indexOf(q.role):10+(AB_ORD[p.pos]||5);}
function abFit(b,out){const sp=out.pos;return b.pos===sp?' <small class="fit ok">aynı mevki</small>':(b.pos==='KL'||sp==='KL')?' <small class="fit bad">uyumsuz</small>':' <small class="fit">farklı mevki</small>';}
function abPitchSVG(on){const W=ABM.win,hm=(W&&W.__abHomes&&W.__abHomes[abS2E(0)])||[];let h='<svg viewBox="0 0 68 100" class="abt-svg"><rect width="68" height="100" fill="#1f6b3d"/><g fill="none" stroke="rgba(255,255,255,.55)" stroke-width=".4"><rect x="1" y="1" width="66" height="98"/><line x1="1" y1="50" x2="67" y2="50"/><circle cx="34" cy="50" r="8"/><rect x="14" y="83" width="40" height="16"/><rect x="14" y="1" width="40" height="16"/></g>';
  for(const p of on){const i=p.ei!=null?p.ei%11:-1,H=i===0?[.035,.5]:hm[i]||[.4,.5];const x=6+H[1]*56,y=96-((H[0]-0.02)/0.72)*86,c=Math.round(p.st||100),col=c<55?'#ff6b6b':c<72?'#ffd166':'#35d49a';
    h+=`<g data-out="${esc(p.k)}" class="abt-dot${ABT.sel===p.k?' sel':''}" style="cursor:pointer"><circle cx="${x}" cy="${y}" r="4.2" fill="#0b1222" stroke="${col}" stroke-width="1.1"/><text x="${x}" y="${y+1.3}" text-anchor="middle" font-size="3.4" fill="#fff" font-weight="700">${p.num||''}</text><text x="${x}" y="${y+8}" text-anchor="middle" font-size="2.7" fill="#fff">${esc((p.sur||p.name).slice(0,12))}</text><text x="${x+5.2}" y="${y-3}" font-size="2.6" fill="${p.rt>=7?'#7cf0a5':'#e6edf7'}">${dec(clamp(p.rt||6.5,3,10),1)}</text></g>`;}
  return h+'</svg>';}
function abTeamClick(e){const W=ABM.win,S=ABM.fx;if(!W||!S)return;const ov=W.document.getElementById('abh-team'),t=e.target.closest('[data-tt],[data-sx],[data-sh],[data-tac],[data-in],[data-out]');
  if(!t){if(e.target===ov)abTeamClose();return;}
  if(t.dataset.sx==='close'){abTeamClose();return;}
  if(t.dataset.tt){ABT.tab=t.dataset.tt;abTeamOpen();return;}
  if(t.dataset.sh){const k=t.dataset.sh;if(S.watch)fxSuggest('shout',k,()=>abShoutRx(k),`Kenardan “${FX_SHOUT[k][0]}”`);else fxShout(k);abTeamOpen();return;}
  if(t.dataset.tac){const k=t.dataset.tac;if(S.watch)fxSuggest('tac',k,()=>{fxSetTi({},k);},`Yaklaşım: ${TAC[k].n}`);else{fxSetTi({},k);abTacMine(S);abToast(`Yaklaşım: ${TAC[k].n}`);}abTeamOpen();return;}
  if(t.dataset.in&&t.tagName==='BUTTON'&&ABT.sel){const U=S.U,out=U.P.find(p=>p.k===ABT.sel&&!p.off),inP=(U.bench||[]).find(b=>b.k===t.dataset.in);
    if(out&&inP&&(U.subs||0)<5){if(S.watch){S.sel=out.k;fxSuggest('subin',inP.k,()=>fxSub(U,out,inP),`Değişiklik: ${out.sur||out.name} ↔ ${ksur(inP.name)}`);}else fxSub(U,out,inP);ABT.sel=null;}abTeamOpen();return;}
  if(t.dataset.out){ABT.sel=ABT.sel===t.dataset.out?null:t.dataset.out;abTeamOpen();return;}}
function abTeamClose(){const W=ABM.win;if(!W)return;const ov=W.document.getElementById('abh-team');if(ov)ov.hidden=true;ABT.sel=null;if(ABM.subPz){ABM.subPz=0;try{const st=W.ado2d.state;if(!st.sim.finished&&!st.hold)W.startMatch();}catch(e){}}}
/* maç çubuğundaki düğmeler bu ekranı açar */
abSubOpen=function(){abTeamOpen('kadro');};
abSideOpen=function(){abTeamOpen('sesle');};
/* her yeni maçta tepkiler sıfırlanır; ekran açıksa canlı güncellenir */
fxStart=(old=>function(o){ABT.react={};ABT.last=null;ABT.sel=null;ABT.tab='kadro';return old.apply(this,arguments);})(fxStart);
setInterval(()=>{try{const W=ABM.win;if(!W||!ABM.fx)return;const ov=W.document.getElementById('abh-team');if(ov&&!ov.hidden&&ABT.tab!=='kadro'||ov&&!ov.hidden&&!ABM.subPz)ov.innerHTML=abTeamHTML();}catch(e){}},1500);

