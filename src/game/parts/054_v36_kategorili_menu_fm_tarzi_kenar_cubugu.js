/* ================= v36: kategorili menü (FM tarzı kenar çubuğu) ================= */
const NI=(d)=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const NICON={taktik:NI('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8" cy="9" r="1.5"/><circle cx="16" cy="9" r="1.5"/><circle cx="12" cy="15" r="1.5"/><path d="M8 9l4 6 4-6"/>'),
  soz:NI('<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>'),ekip:NI('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M15 15c3 0 6 1.8 6 5"/>'),
  din:NI('<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'),trf:NI('<path d="M4 8h13l-3-3M20 16H7l3 3"/>'),gzl:NI('<circle cx="7" cy="14" r="4"/><circle cx="17" cy="14" r="4"/><path d="M7 10V5h3l1 5M17 10V5h-3l-1 5M11 14h2"/>'),
  cup:NI('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8"/>'),goal:NI('<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.5 5h-5L8 10z"/>'),
  kadro:NI('<circle cx="12" cy="7" r="3.5"/><path d="M5 21c0-4 3-7 7-7s7 3 7 7"/>')};
function navCats(){const mgr=G.mode==='mgr',st=isStaff(),xs=xtabs().map(x=>x[0]),X=(k,l)=>xs.includes(k)?[[k,l,{tab:k}]]:[];
  const G1=['Genel',[['hub','Ana sayfa',{tab:'hub'}],['inbox','Gelen kutusu',{tab:'inbox'}],...X('cal','Takvim')]];
  const RK=['Rekabet',[['league','Lig tablosu',{tab:'league',l:'tbl'}],['goal','Gol ve asist krallığı',{tab:'league',l:'g'}],['cup','Kupalar',{tab:'league',l:'cup'}],...X('avr','Avrupa'),...X('stats','İstatistikler')]];
  const KR=['Kariyer',[['career','Kariyerim',{tab:'career'}],['life','Yaşam ve mağaza',{tab:'life'}]]];
  if(mgr)return [G1,['Takım',[['kadro','Kadro',{tab:'squad',k:'kadro'}],['taktik','Taktik',{tab:'squad',k:'taktik'}],['din','Takım dinamiği',{tab:'squad',k:'iliski'}],['ekip','Teknik ekip',{tab:'squad',k:'ekip'}],['soz','Sözleşmeler',{tab:'squad',k:'soz'}],...X('acad','Altyapı')]],
    ['Transfer',[['trf','Transferler',{tab:'squad',k:'transfer'}],['gzl','Gözlem ağı',{tab:'squad',k:'gozlem'}]]],RK,['Kulüp',[['board','Yönetim ve finans',{tab:'board'}]]],KR];
  if(st){const role=xtabs().filter(x=>['map','med','an'].includes(x[0])).map(x=>[x[0],x[1],{tab:x[0]}]);return [G1,['Kulüp',[['club',G.staff==='scout'?'Gözlem masası':G.staff==='dr'?'Sağlık merkezi':G.staff==='yrd'?'Teknik büro':'Kulüp',{tab:'club'}],...role,...X('kadro','Kadro ve diziliş')]],RK,KR];}
  return [G1,['Oyuncu',[['player','Oyuncu profilim',{tab:'player'}]]],RK,['Kulüp',[['board','Yönetim',{tab:'board'}]]],KR];}
const navIcon=k=>NICON[k]||ICON[k]||XICON[k]||'';
function navOn(a){if(TAB!==a.tab)return false;if(a.k)return KTAB===a.k;if(a.l){const l=LTAB;if(a.l==='tbl')return !['g','a','cup','avr'].includes(l);if(a.l==='g')return l==='g'||l==='a';return l===a.l;}return true;}
function navHTML(){const unread=unreadCount();return navCats().map(([cat,items])=>`<div class="nav-cat"><p>${cat}</p>${items.map(([ic,l,a])=>`<button class="nav-i" data-act="navGo" data-tab="${a.tab}" ${a.k?`data-k="${a.k}"`:''} ${a.l?`data-l="${a.l}"`:''} ${navOn(a)?'aria-current="page"':''}>${navIcon(ic)}<span>${l}</span>${ic==='inbox'&&unread?`<b class="nav-b">${unread>9?'9+':unread}</b>`:''}</button>`).join('')}</div>`).join('');}
ACTX.navGo=el=>{closeModal&&!$('#modal').hidden&&closeModal();TAB=el.dataset.tab;if(el.dataset.k)KTAB=el.dataset.k;if(el.dataset.l){LTAB=el.dataset.l;VLG=null;}render();window.scrollTo(0,0);};
const navWide=()=>window.innerWidth>=1000;
render=(old=>function(){const r=old.apply(this,arguments);try{const on=!!(G&&G.phase!=='tryout'&&navWide()&&!$('#tabs').hidden);document.documentElement.classList.toggle('fm-nav',on);
    if(on){const ti=$('#tabsIn');if(ti)ti.innerHTML=`<div class="nav-brand">${crestSVG(myClub(),26)}<div><b>${esc(myClub().short)}</b><small>${G.mode==='mgr'?'Teknik direktör':isStaff()?({scout:'Gözlemci',dr:'Doktor',yrd:'Yardımcı antrenör'}[G.staff]||'Teknik ekip'):'Futbolcu'}</small></div></div>${navHTML()}`;}}catch(e){console.warn(e);}return r;})(render);
/* mobil: "Daha" penceresi kategorili */
ACTX.moreTabs=()=>{openModal(`<h3>Menü</h3><div class="nav-modal">${navHTML()}</div><button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:8px">Kapat</button>`);};
window.addEventListener('resize',()=>{const w=navWide();if(w!==document.documentElement.classList.contains('fm-nav')&&G)render();});

