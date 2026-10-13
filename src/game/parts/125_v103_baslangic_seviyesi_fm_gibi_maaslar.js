/* ================= v103: başlangıç seviyesi (FM gibi) · maaşlar yıllık ve euro =================
   Her meslekte: Sıfırdan (eski akış) · Orta seviye · Zirve. Orta ve zirvede kulübünü (hakemde ligini) kendin seçersin. */
W.lvl=W.lvl||'sifir';
const LVL_TXT={sifir:['Sıfırdan','Alt seviyeden başlar, yükselerek ilerlersin.'],orta:['Orta seviye','Deneyimli başlarsın: orta lisans/seviye, istediğin kulüp.'],zirve:['Zirve (FM gibi)','En üst lisans ve seviye; istediğin büyük kulüpten hemen başla.']};
function lvlLeagues(){return Object.entries(LEAGUES).filter(([id,L])=>!L.youth&&Object.values(CLUBS).some(c=>c.league===id)).sort((a,b)=>(b[1].cc==='TR')-(a[1].cc==='TR')||(b[1].tier||0)-(a[1].tier||0)).map(([id,L])=>({id,L}));}
function lvlClubs(lg){return Object.values(CLUBS).filter(c=>c.league===lg).sort((a,b)=>(b.str||0)-(a.str||0));}
function lvlDefaults(){const lg=lvlLeagues();if(!W.lg||!LEAGUES[W.lg]){const tr=lg.find(x=>x.L.cc==='TR'&&!x.L.youth);W.lg=(tr||lg[0]).id;}const cl=lvlClubs(W.lg);if(!W.club||!CLUBS[W.club]||CLUBS[W.club].league!==W.lg)W.club=(W.lvl==='zirve'?cl[0]:cl[Math.floor(cl.length/2)]||cl[0]).id;}
function lvlField(){const ref=W.prof==='ref';let h=`<div class="field wz-lvl"><span class="field-label">Başlangıç seviyesi</span><div class="chips">${Object.entries(LVL_TXT).map(([k,[n]])=>`<button class="chip" data-act="wzLvl" data-v="${k}" aria-pressed="${W.lvl===k}">${n}</button>`).join('')}</div><p class="muted" style="margin:6px 0 0;font-size:13px">${LVL_TXT[W.lvl][1]}</p>`;
  if(W.lvl!=='sifir'){lvlDefaults();const lg=lvlLeagues();h+=`<div class="wz-club"><label><span>Lig</span><select id="wzLg">${lg.map(x=>`<option value="${x.id}"${x.id===W.lg?' selected':''}>${esc(x.L.name)}</option>`).join('')}</select></label>${ref?'':`<label><span>Kulüp</span><select id="wzCl">${lvlClubs(W.lg).map(c=>`<option value="${c.id}"${c.id===W.club?' selected':''}>${esc(c.name)}</option>`).join('')}</select></label>`}</div>`;
    const c=CLUBS[W.club];if(c)h+=`<div class="wz-pick">${crestSVG(c,34)}<div><b>${esc(ref?LEAGUES[W.lg].name:c.name)}</b><small>${esc(lvlSummary())}</small></div></div>`;}
  return h+'</div>';}
function lvlSummary(){const z=W.lvl==='zirve',c=CLUBS[W.club];const p=W.prof;
  if(p==='oyuncu'){const o=lvlPlOvr(c);return `${z?'Yıldız':'İlk 11'} · ${z?24:21} yaş · genel güç ${o}`;}
  if(p==='td'||p==='sd'||p==='bsk')return `${p==='td'?(z?'UEFA Pro lisansı':'UEFA A lisansı'):(z?'Tecrübeli yönetici':'Orta düzey yönetici')} · itibar ${z?78:50}`;
  const r=STF[p]&&STF[p].r;const lv=z?r.length-1:1;return `${r?r[lv]:''} · itibar ${z?80:50}`;}
function lvlPlOvr(c){const s=c?c.str||65:65;return W.lvl==='zirve'?clamp(Math.round(s+4),78,88):clamp(Math.round(s-1),60,78);}
ACTX.wzLvl=el=>{W.lvl=el.dataset.v;if(W.lvl!=='sifir')lvlDefaults();showStart();};
document.addEventListener('change',e=>{const t=e.target;if(!t||!t.id)return;if(t.id==='wzLg'){W.lg=t.value;W.club=null;lvlDefaults();showStart();}else if(t.id==='wzCl'){W.club=t.value;showStart();}});
showStart=(old=>function(){old.apply(this,arguments);try{if(W.step!=='kim')return;const b=document.querySelector('#start [data-act=wzGo]');if(!b||document.querySelector('#start .wz-lvl'))return;b.insertAdjacentHTML('beforebegin',lvlField());
    if(W.lvl!=='sifir'){const c=CLUBS[W.club],sp=b.querySelector('span'),sm=b.querySelector('small');if(sp)sp.textContent=W.prof==='ref'?'Kariyere başla':'Kariyere başla';if(sm&&c)sm.textContent=W.prof==='ref'?`${LEAGUES[W.lg].name} hakemi olarak`:`${c.name} · ${LVL_TXT[W.lvl][0]}`;}}catch(e){console.warn('seviye',e);}})(showStart);
/* ---------- başlat ---------- */
wizGo=(old=>function(){if(!W.lvl||W.lvl==='sifir')return old.apply(this,arguments);lvlDefaults();const z=W.lvl==='zirve',p=W.prof;let cid=W.club;
  if(p==='ref'){const cl=lvlClubs(W.lg);cid=(cl[0]||{}).id;}
  if(!CLUBS[cid])return old.apply(this,arguments);
  if(p==='oyuncu'){const c=CLUBS[cid],pos=SEL.pos||'OS',ovr=lvlPlOvr(c),age=z?24:21,pa=z?4:10;G=null;newGame(pos,SEL.foot||'Sağ',cid);wizApply();G.mode='player';const P=G.p,w=POS[pos].w,sw=Object.values(w).reduce((a,b)=>a+b,0)||1;P.age=age;
    for(const k in ATTR){const imp=(w[k]||0)/sw;P.a[k]=clamp(Math.round(ovr+(imp>0.22?3:imp<0.08?-6:0)),30,96);P.pot[k]=clamp(P.a[k]+pa,P.a[k],99);}
    let g=0;while(OVR()<ovr&&g++<40)for(const k in ATTR)P.a[k]=Math.min(99,P.a[k]+0.5);g=0;while(OVR()>ovr&&g++<40)for(const k in ATTR)P.a[k]=Math.max(30,P.a[k]-0.5);
    const role=z?'Yıldız':'İlk 11',L=LEAGUES[c.league];G.contract={years:z?4:3,wage:Math.round(L.wage*({Yıldız:3,'İlk 11':1.6}[role])*lvlStrK(c)/50)*50,role};P.trust=ROLE_TRUST[role]||60;P.fame=z?60:25;P.money=E2U(z?2e6:1.2e5);P.morale=74;
    G.totals={apps:z?160:50,goals:z?(pos==='FW'?70:pos==='KN'?40:pos==='OS'?22:6):(pos==='FW'?14:6),assists:z?30:6};G.inbox=[];G.tutSeen=true;G.phase='season';try{applyBoosts();}catch(e){}
    msg('board',`${c.name} ile sözleşme`,`${PN()}, ${c.name} ile ${G.contract.years} yıllık sözleşme imzaladı. Rolün: ${role}. Yıllık maaşın ${money(G.contract.wage*52)}.`);W.step='list';save();TAB='hub';render();window.scrollTo(0,0);return;}
  old.apply(this,arguments);
  try{if(p==='td'||p==='sd'||p==='bsk'){G.lic={lv:z?'P':'A',exp:z?6:2};G.m.rep=z?78:50;G.p.money=(G.p.money||0)+E2U(z?2e6:2e5);mgrSign(cid);}
    else if(STF[p]){const j=G.job,r=STF[p].r,lv=z?r.length-1:Math.min(1,r.length-1);j.lvl=lv;j.title=r[lv];j.rep=z?80:50;j.tr=Math.max(j.tr||0,z?75:62);if(p==='yrd')G.lic={lv:z?'P':'A',exp:z?6:2};G.p.money=(G.p.money||0)+E2U(z?6e5:8e4);staffSign(cid);}
  }catch(e){console.warn('seviye başlangıç',e);}W.step='list';})(wizGo);
/* maaş kulübün büyüklüğüne göre */
function lvlStrK(c){const s=(c&&c.str)||65;return clamp(Math.pow(s/70,2),.55,2.4);}
mgrSign=(old=>function(id){const r=old.apply(this,arguments);try{const c=CLUBS[id];if(G.contract&&c&&!G.contract.kAdj){G.contract.wage=Math.round(G.contract.wage*lvlStrK(c)/50)*50;G.contract.kAdj=1;}}catch(e){}return r;})(mgrSign);
staffSign=(old=>function(id){const r=old.apply(this,arguments);try{const c=CLUBS[id];if(G.contract&&c&&!isRef()){G.contract.wage=Math.round(G.contract.wage*lvlStrK(c)/50)*50;}}catch(e){}return r;})(staffSign);
/* ---------- maaşlar yıllık gösterilir (euro) ---------- */
const AMT_RE='−?\\d+(?:,\\d+)?(?: (?:mr|mn|bin))? €';
function amtParse(s){const m=String(s).match(/^(−?)(\d+(?:,\d+)?)(?: (mr|mn|bin))? €$/);if(!m)return null;let v=parseFloat(m[2].replace(',','.'));v*=m[3]==='mr'?1e9:m[3]==='mn'?1e6:m[3]==='bin'?1e3:1;return m[1]?-v:v;}
function amtFmt(v){const sg=v<0?'−':'';v=Math.abs(Math.round(v));return sg+(v>=1e9?dec(v/1e9,2).replace(/,?0+$/,'')+' mr €':v>=1e6?dec(v/1e6,2).replace(/,?0+$/,'')+' mn €':v>=1e4?Math.round(v/1e3)+' bin €':v>=1e3?dec(v/1e3,1).replace(',0','')+' bin €':v+' €');}
const yr=s=>{const v=amtParse(s);return v==null?s:amtFmt(v*52);};
function wageYearly(h){if(!h||typeof h!=='string'||!/aftal|\/hf|\/hafta/.test(h))return h;const A=AMT_RE;
  h=h.replace(new RegExp('<dt>Haftalık</dt><dd>('+A+')</dd>','g'),(m,a)=>`<dt>Yıllık maaş</dt><dd>${yr(a)}</dd>`);
  h=h.replace(new RegExp('<b>('+A+')</b><span>Haftalık</span>','g'),(m,a)=>`<b>${yr(a)}</b><span>Yıllık maaş</span>`);
  h=h.replace(new RegExp('('+A+') ?/ ?(?:hf|hafta)\\b','g'),(m,a)=>`${yr(a)}/yıl`);
  h=h.replace(new RegExp('('+A+')( / )('+A+') haftalık','g'),(m,a,s,b)=>`${yr(a)}${s}${yr(b)} yıllık`);
  h=h.replace(new RegExp('('+A+')(</b>)? haftalık','g'),(m,a,b)=>`${yr(a)}${b||''} yıllık`);
  h=h.replace(new RegExp('([Hh])aftalık( maaşın| maaş| maaşı)?( (?:olarak |da |de )?)('+A+')','g'),(m,H,w,sp,a)=>`${H==='H'?'Y':'y'}ıllık${w||''}${sp}${yr(a)}`);
  return h;}
function wageYearlyDom(root){if(!root||!/aftal|\/hf|\/hafta/.test(root.textContent||''))return;
  root.querySelectorAll('dt').forEach(dt=>{if(dt.textContent.trim()==='Haftalık'){const dd=dt.nextElementSibling;if(dd&&amtParse(dd.textContent.trim())!=null){dt.textContent='Yıllık maaş';dd.textContent=yr(dd.textContent.trim());}}});
  root.querySelectorAll('span,small').forEach(sp=>{if(sp.textContent.trim()==='Haftalık'){const b=sp.previousElementSibling;if(b&&amtParse(b.textContent.trim())!=null){sp.textContent='Yıllık maaş';b.textContent=yr(b.textContent.trim());}}});
  const tw=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),L=[];let n;while((n=tw.nextNode()))if(/aftal|\/hf|\/hafta/.test(n.nodeValue))L.push(n);
  for(const t of L){const v=t.nodeValue;if(/^\s*(\/ ?hf|\/hafta|haftalık)/.test(v)){const pe=t.previousSibling;if(pe&&pe.nodeType===1&&amtParse(pe.textContent.trim())!=null){pe.textContent=yr(pe.textContent.trim());t.nodeValue=v.replace(/^(\s*)\/ ?(hf|hafta)\b/,'$1/yıl').replace(/^(\s*)haftalık/,'$1yıllık');continue;}}
    const nv=wageYearly(v);if(nv!==v)t.nodeValue=nv;}}
render=(old=>function(){const r=old.apply(this,arguments);try{wageYearlyDom($('#view'));}catch(e){}return r;})(render);
openModal=(old=>function(h){try{if(typeof h==='string')h=wageYearly(h);}catch(e){}return old.call(this,h,...[].slice.call(arguments,1));})(openModal);
toast=(old=>function(t){try{if(typeof t==='string')t=wageYearly(t);}catch(e){}return old.call(this,t,...[].slice.call(arguments,1));})(toast);

