/* ================= v61: Sade arayüz — 6 ana bölüm, sekmeli sayfalar, sade ana sayfa, mobil alt menü (ayarlardan Klasik menüye dönülebilir) ================= */
const uiSade=()=>setsGet().ui!=='klasik';
const UIG_ORDER=['Ana sayfa','Takım','Maç','Kulüp','Ben','Eğlence'];
const UIG_IC={'Ana sayfa':NI('<path d="M3 11l9-7 9 7v9H3z"/><path d="M9 20v-6h6v6"/>'),'Takım':NI('<circle cx="9" cy="8" r="3.2"/><circle cx="17" cy="9" r="2.6"/><path d="M3 20c.6-3.6 3-5.5 6-5.5s5.4 1.9 6 5.5"/><path d="M15 15c2.8 0 5 1.4 6 4.5"/>'),
  'Maç':NI('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5l4 3-1.5 4.7h-5L8 10.5z"/>'),'Kulüp':NI('<path d="M12 3l8 3v6c0 4.5-3.4 7.8-8 9-4.6-1.2-8-4.5-8-9V6z"/>'),'Ben':NI('<circle cx="12" cy="8" r="4"/><path d="M4 21c1.2-4.2 4.3-6.3 8-6.3s6.8 2.1 8 6.3"/>'),'Eğlence':NI('<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/>')};
const UIG_MAP={hub:'Ana sayfa',inbox:'Ana sayfa',news:'Ana sayfa',cal:'Ana sayfa',
  kadro:'Takım',taktik:'Takım',trep:'Takım',plan:'Takım',train:'Takım',din:'Takım',ekip:'Takım',soz:'Takım',acad:'Takım',res:'Takım',club:'Takım',mates:'Takım',hcm:'Takım',
  prep:'Maç',mrep:'Maç',league:'Maç',goal:'Maç',cup:'Maç',avr:'Maç',stats:'Maç',awards:'Maç',bdo:'Maç',leg:'Maç',refs:'Maç',
  trc:'Kulüp',trf:'Kulüp',gzl:'Kulüp',loans:'Kulüp',board:'Kulüp',fin:'Kulüp',nt:'Kulüp',hist:'Kulüp',bsk:'Kulüp',
  player:'Ben',perk:'Ben',rout:'Ben',agent:'Ben',career:'Ben',ssum:'Ben',life:'Ben',night:'Eğlence'};
const UIG_CAT={Genel:'Ana sayfa',Oyuncu:'Ben',Takım:'Takım',Transfer:'Kulüp',Rekabet:'Maç',Kulüp:'Kulüp',Kariyer:'Ben'};
function uiGroups(){const G2={};for(const [cat,items] of navCats())for(const it of items){const g=UIG_MAP[it[0]]||UIG_CAT[cat]||'Kulüp';(G2[g]=G2[g]||[]).push(it);}
  /* futbolcu modunda "Takım" yerine takım arkadaşları "Ben" altında kalsın; tek öğeli Takım grubunu Ben'e kat */
  if(G2['Takım']&&G2['Takım'].length===1&&isPl()){G2['Ben']=(G2['Ben']||[]).concat(G2['Takım']);delete G2['Takım'];}
  if(isPl()&&G2['Kulüp']&&G2['Kulüp'].length===1){G2['Ben']=(G2['Ben']||[]).concat(G2['Kulüp']);delete G2['Kulüp'];}
  if(G2['Eğlence'])G2['Eğlence'].push(['casino','Kumarhane ve iddaa',{tab:'_cz'}]);
  return UIG_ORDER.filter(g=>G2[g]&&G2[g].length).map(g=>[g,G2[g]]);}
function uiCurGroup(){for(const [g,items] of uiGroups())if(items.some(([,,a])=>a.tab!=='_cz'&&navOn(a)))return g;return null;}
const UIG_LAST={};
function uiGoAttrs(a){return `data-act="${a.tab==='_cz'?'gbOpen':'navGo'}" data-tab="${a.tab}" ${a.k?`data-k="${a.k}"`:''} ${a.l?`data-l="${a.l}"`:''}`;}
function uiGroupTarget(g,items){const last=UIG_LAST[g];const it=(last&&items.find(x=>x[0]===last))||items[0];return it;}
/* masaüstü kenar menüsü */
navHTML=(old=>function(){if(!uiSade())return old.apply(this,arguments);const unread=unreadCount(),cur=uiCurGroup();
  return `<div class="nav-sade">${uiGroups().map(([g,items])=>{const on=g===cur,t=uiGroupTarget(g,items);return `<div class="nav-g ${on?'on':''}"><button class="nav-gh" ${uiGoAttrs(t[2])} ${on?'aria-current="true"':''}>${UIG_IC[g]||''}<span>${g}</span>${g==='Ana sayfa'&&unread?`<b class="nav-b">${unread>9?'9+':unread}</b>`:''}<i class="nav-n">${items.length>1?items.length:''}</i></button>
    ${on&&items.length>1?`<div class="nav-gi">${items.map(([ic,l,a])=>`<button class="nav-i" ${uiGoAttrs(a)} ${a.tab!=='_cz'&&navOn(a)?'aria-current="page"':''}>${navIcon(ic)}<span>${l}</span>${ic==='inbox'&&unread?`<b class="nav-b">${unread>9?'9+':unread}</b>`:''}</button>`).join('')}</div>`:''}</div>`;}).join('')}</div>`;})(navHTML);
/* sayfa üstünde bölüm sekmeleri (mobil) */
function uiStrip(){const cur=uiCurGroup();if(!cur)return '';const items=(uiGroups().find(x=>x[0]===cur)||[])[1]||[];if(items.length<2)return '';
  return `<nav class="grp-tabs" aria-label="${esc(cur)}">${items.map(([ic,l,a])=>`<button class="grp-t ${a.tab!=='_cz'&&navOn(a)?'on':''}" ${uiGoAttrs(a)}>${l}</button>`).join('')}</nav>`;}
/* mobil alt menü */
function uiBottom(){const cur=uiCurGroup(),unread=unreadCount(),gs=uiGroups(),get=g=>gs.find(x=>x[0]===g);const second=isPl()?'Ben':isStaff()&&get('Görevim')?'Görevim':(get('Takım')?'Takım':'Ben'),third=get('Maç')?'Maç':'Kulüp';
  const btn=(g,lab)=>{const x=get(g);if(!x)return '';const t=uiGroupTarget(g,x[1]);return `<button class="tab ${g===cur?'on':''}" ${uiGoAttrs(t[2])} ${g===cur?'aria-current="page"':''}>${UIG_IC[g]}<span>${lab||g}</span>${g==='Ana sayfa'&&unread?`<span class="badge">${unread>9?'9+':unread}</span>`:''}</button>`;};
  return `${btn('Ana sayfa')}${btn(second)}<button class="tab cont" data-act="fmCont"><b>DEVAM</b><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M9 6l6 6-6 6"/></svg></button>${btn(third)}<button class="tab more ${cur&&![ 'Ana sayfa',second,third].includes(cur)?'on':''}" data-act="moreTabs">${NI('<path d="M4 7h16M4 12h16M4 17h16"/>')}<span>Menü</span></button>`;}
ACTX.moreTabs=(old=>function(){if(!uiSade())return old.apply(this,arguments);const cur=uiCurGroup();
  openModal(`<h3>Menü</h3><div class="ui-menu">${uiGroups().map(([g,items])=>`<section class="ui-mg ${g===cur?'on':''}"><p>${UIG_IC[g]||''}<b>${g}</b></p><div>${items.map(([ic,l,a])=>`<button class="ui-mi" ${uiGoAttrs(a)}>${navIcon(ic)}<span>${l}</span></button>`).join('')}</div></section>`).join('')}</div><button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:8px">Kapat</button>`);})(ACTX.moreTabs);
/* ana sayfa sadeleştirme: önemli kartlar üstte, diğerleri "Ayrıntılar" altında */
function uiHubSimplify(v){if(!v||v.querySelector('.hub-more'))return;const top=v.querySelector(':scope > .hub-top');if(!top)return;const al=v.querySelector(':scope > .hub-al');if(al)top.insertAdjacentElement('afterend',al);
  const keep=new Set([top,al].filter(Boolean));for(const c of v.querySelectorAll(':scope > section.today'))keep.add(c);for(const c of v.querySelectorAll(':scope > .bd-inv,:scope > .scn-band,:scope > .pg-crumb,:scope > h2.h'))keep.add(c);
  const rest=[...v.children].filter(c=>!keep.has(c)&&!c.closest('.hub-top'));if(!rest.length)return;let open=false;try{open=localStorage.getItem('hubMore')==='1';}catch(e){}
  const d=document.createElement('details');d.className='hub-more';if(open)d.open=true;d.innerHTML=`<summary><span>Ayrıntılar</span><small>${G.mode==='mgr'?'taktik, takım kurulumu, rakip analizi, antrenman, kupalar':'antrenman planı, kupalar ve diğer kısayollar'}</small></summary>`;
  rest[0].insertAdjacentElement('beforebegin',d);for(const c of rest)d.appendChild(c);d.addEventListener('toggle',()=>{try{localStorage.setItem('hubMore',d.open?'1':'0');}catch(e){}});}
/* maç hazırlığı: hızlı hazırlık + gelişmiş paneller katlanır */
ACTX.prepQuick=()=>{try{const opp=oiOpp();if(opp){const O=oiGet(opp.id),sq=squadOf(opp.id).slice().sort((a,b)=>b.ovr-a.ovr),star=sq.find(p=>p.pos!=='KL'&&p.pos!=='DF'),wk=sq.filter(p=>p.pos==='DF').sort((a,b)=>a.ovr-b.ovr)[0];O.mark=star?star.k:'';O.weak=wk?wk.k:'';O.press=opp.str>myClub().str+3?'dus':opp.str<myClub().str-4?'yuksek':'nor';}
    const s=sprGet(),F=sprFit();s.ck=Object.entries(F.ck).sort((a,b)=>b[1]-a[1])[0][0];s.df=Object.entries(F.df).sort((a,b)=>b[1]-a[1])[0][0];save();render();toast('Yardımcı antrenör maç planını hazırladı');}catch(e){console.warn(e);toast('Hazırlık yapılamadı');}};
function uiPrepSimplify(v){if(!v||G.mode!=='mgr'||v.querySelector('.prep-more'))return;const grids=[...v.querySelectorAll(':scope > .tr-grid')];if(grids.length<2)return;
  const adv=grids.slice(1);const d=document.createElement('details');d.className='hub-more prep-more';d.innerHTML=`<summary><span>Gelişmiş hazırlık</span><small>rakibe özel talimatlar ve duran top rutinleri</small></summary>`;
  grids[0].insertAdjacentHTML('afterend',`<section class="panel prep-q"><div><b>Hızlı hazırlık</b><small>Yardımcı antrenör rakibe göre markaj, pres ve duran top planını otomatik ayarlasın.</small></div><button class="cta sm" data-act="prepQuick">Asistan hazırlasın</button></section>`);
  v.querySelector('.prep-q').insertAdjacentElement('afterend',d);for(const g of adv)d.appendChild(g);}
render=(old=>function(){const r=old.apply(this,arguments);try{const sade=uiSade();document.documentElement.classList.toggle('ui-sade',sade);if(!sade||!G||G.phase==='tryout')return r;const v=$('#view');
    if(v&&!document.documentElement.classList.contains('fm-nav')){const s=uiStrip();if(s&&!v.querySelector(':scope > .grp-tabs'))v.insertAdjacentHTML('afterbegin',s);const ti=$('#tabsIn');if(ti&&!$('#tabs').hidden)ti.innerHTML=uiBottom();}
    if(v&&TAB==='squad'){const b=v.querySelector('[data-act=ktab]');const st=b&&b.closest('.filt');if(st&&st.parentElement===v)st.style.display='none';}if(TAB==='hub'&&G.mode==='mgr')uiHubSimplify(v);if(TAB==='prep')uiPrepSimplify(v);
    const cg=uiCurGroup();if(cg){for(const [g,items] of uiGroups())if(g===cg){const it=items.find(([,,a])=>a.tab!=='_cz'&&navOn(a));if(it)UIG_LAST[g]=it[0];}}}catch(e){console.warn(e);}return r;})(render);
/* kumarhane: üst menü tek “Cüzdan” düğmesinde */
czRender=(old=>function(){old.apply(this,arguments);try{if(!uiSade())return;const n=document.querySelector('#cz .cz-nav');if(!n||n.querySelector('.cz-menu-b'))return;n.classList.add('sade');n.insertAdjacentHTML('afterbegin',`<button class="cz-menu-b" data-czm="1">💼 Cüzdan ▾</button>`);}catch(e){}})(czRender);
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('[data-czm]');if(b){const n=b.closest('.cz-nav');if(n)n.classList.toggle('open');e.stopPropagation();return;}const n=document.querySelector('#cz .cz-nav.open');if(n&&!e.target.closest('.cz-nav'))n.classList.remove('open');},true);
/* ayarlar: sade / klasik menü */
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');const lab=mc&&[...mc.querySelectorAll('label.hurt')].find(l=>l.querySelector('[data-act=themeTog]'));const h=`<label class="hurt" style="margin:0 0 6px"><input type="checkbox" data-act="uiTog" ${uiSade()?'checked':''}> Sade menü (6 ana bölüm). Kapatırsan klasik menüye dönülür.</label>`;
    if(lab)lab.insertAdjacentHTML('beforebegin',h);else if(mc)mc.insertAdjacentHTML('beforeend',h);}catch(e){}return r;})(openSettings);
ACTX.uiTog=el=>{const st=setsGet();st.ui=uiSade()?'klasik':'sade';setsPut(st);toast(st.ui==='klasik'?'Klasik menüye dönüldü':'Sade menü açık');render();};

