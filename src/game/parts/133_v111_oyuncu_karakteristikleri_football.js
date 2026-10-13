/* ================= v111: oyuncu karakteristikleri (Football Manager "player traits") =================
   Profilde görünür, maç motorunda davranışı değiştirir (ab/sim.js [trait]) ve sahada halka + bildirim + anlatımla görünür. */
const TRAITS={
  arakos:{n:'Sık sık araya koşu yapar',s:'Araya koşu',ic:'🏃',col:'#3fe0ff',d:'Savunma çizgisinin arkasına sürekli koşu atar; ara paslar onu arar.',c:['{n} savunmanın arkasına sızdı!','{n} yine araya koştu, ofsayt çizgisinde.','{n} stoperlerin arasından derine koşuyor.']},
  toplakos:{n:'Topla beraber sık sık koşar',s:'Topla koşar',ic:'⚽',col:'#ffc93c',d:'Pas yerine topu sürmeyi tercih eder; boş alan gördüğünde topla ilerler.',c:['{n} topu ayağına aldı, sürüyor…','{n} topla birlikte ileri çıktı.','{n} bir kez daha topu kendisi taşıyor.']},
  hiz:{n:'Hızını kullanır',s:'Hızını kullanır',ic:'⚡',col:'#7cff6b',d:'Topu önüne atıp rakibini hızıyla geçmeye çalışır.',c:['{n} topu önüne attı, hızıyla geçmeye çalışıyor!','{n} depara kalktı, kimse yetişemiyor.','{n} hızını konuşturuyor.']},
  uzak:{n:'Uzaktan şut dener',s:'Uzaktan şut',ic:'🎯',col:'#ff9f43',d:'Ceza sahası dışından şut çekmekten çekinmez.',c:['{n} uzaktan şansını denedi!','{n} ceza sahası dışından vurdu.','{n} yine uzak mesafeden kaleyi yokladı.']},
  uzunpas:{n:'Uzun pas dener',s:'Uzun pas',ic:'📐',col:'#b48cff',d:'Oyunun yönünü uzun toplarla değiştirir, koşuculara derin pas atar.',c:['{n} uzun topla oyunun yönünü değiştirdi.','{n} derine uzun bir top gönderdi.','{n} kanat değiştiren bir pas attı.']},
  kisapas:{n:'Kısa pas oynar',s:'Kısa pas',ic:'🔁',col:'#8fd3ff',d:'Riskten kaçınır, topu kısa paslarla dolaştırır.',c:[]},
  bindir:{n:'Bindirme yapar',s:'Bindirme',ic:'↗',col:'#4dd0e1',d:'Bek olarak kanat oyuncusunun dışından sürekli bindirmeye çıkar.',c:['{n} kanattan bindirmeye çıktı.','{n} dış koridordan boş alana koşuyor.']},
  sert:{n:'Sert oynar',s:'Sert oynar',ic:'🦵',col:'#ff6b6b',d:'İkili mücadelelere sert girer; daha çok faul yapar ve kart riski taşır.',c:['{n} sert girdi!','{n} acımasız bir müdahale yaptı.','{n} yine ayağını sakınmadı.']},
  didis:{n:'Rakiplerle didişir',s:'Didişir',ic:'😤',col:'#ff8a3d',d:'Rakipleriyle ağız dalaşına girer, sinirleri çabuk gerilir.',c:['{n} rakibiyle didişiyor, hakem araya girdi.','{n} rakibine bir şeyler söyledi, ortam gerildi.','{n} itiraz edip rakibiyle tartıştı.']}
};
/* bilinen oyuncular için elle seçilmiş karakteristikler (kamuya açık oyun tarzı tanımlarına göre) */
const TR_REAL={'Victor Osimhen':['arakos','sert'],'Rafael Leão':['toplakos','hiz'],'Kylian Mbappé':['hiz','arakos'],'Vinícius Júnior':['toplakos','hiz','didis'],'Erling Haaland':['arakos'],
  'Lamine Yamal':['toplakos','uzak'],'Mohamed Salah':['arakos','uzak'],'Jude Bellingham':['arakos','didis'],'Bukayo Saka':['toplakos'],'Declan Rice':['uzunpas'],'Rodri':['kisapas','uzunpas'],
  'Federico Valverde':['uzak','arakos'],'Bruno Fernandes':['uzak','uzunpas','didis'],'Lautaro Martínez':['arakos','didis'],'Harry Kane':['uzunpas','uzak'],'Ousmane Dembélé':['toplakos','uzak'],
  'Achraf Hakimi':['bindir','hiz'],'Trent Alexander-Arnold':['uzunpas','uzak'],'Alphonso Davies':['bindir','hiz'],'Pedri':['kisapas'],'Frenkie de Jong':['kisapas','toplakos'],
  'Mason Greenwood':['uzak','toplakos'],'Barış Alper Yılmaz':['hiz','toplakos','didis'],'Kerem Aktürkoğlu':['arakos','uzak'],'Arda Güler':['uzak','uzunpas'],'Kenan Yıldız':['toplakos'],
  'Nicolò Barella':['didis','arakos'],'Cristian Romero':['sert','didis'],'Casemiro':['sert','uzak'],'Antonio Rüdiger':['sert','didis'],'Leandro Paredes':['uzunpas','didis'],
  'Dani Carvajal':['bindir','didis'],'Theo Hernández':['bindir','toplakos'],'Jeremie Frimpong':['bindir','hiz'],'Florian Wirtz':['kisapas','toplakos'],'Jamal Musiala':['toplakos'],'Cole Palmer':['uzak'],
  'Michael Olise':['toplakos','uzak'],'Khvicha Kvaratskhelia':['toplakos','uzak'],'Raphinha':['uzak','arakos'],'Mattéo Guendouzi':['didis','arakos'],'Hakan Çalhanoğlu':['uzunpas','uzak'],'Orkun Kökçü':['uzunpas'],
  'Jamie Vardy':['arakos','didis'],'Kyle Walker':['hiz','bindir'],'Lucas Torreira':['sert','didis'],'Wilfried Singo':['hiz','sert'],'Davinson Sánchez':['sert']};
const TRC={};
function pTraits(p){if(!p)return [];const key=(p.k||'')+'|'+p.ovr+'|'+(p.age||'');if(TRC[key])return TRC[key];let out=[];
  try{const nm=String(p.name||'').replace(/^\d+\.\s*/,'');if(TR_REAL[nm]&&!p.g){out=TR_REAL[nm].slice();return TRC[key]=out;}
    if(p.pos==='KL')return TRC[key]=[];
    const X=fmAttrs(p),A=X.raw||X,g=(n,d)=>{const v=A[n];return v==null?d:v;},o=p.ovr||60,r=srng((p.k||p.name)+'trt'),pos=p.pos,df=pos==='DF',os=pos==='OS',kn=pos==='KN',fw=pos==='FW';
    const sc={
      arakos:(fw?6.5:kn?1.5:os?-5.5:-30)+(g('Topsuz oyun',o)-o)*.9+(g('Hız',o)-o)*.4,
      toplakos:(kn?6.5:fw?2.5:os?.5:-12)+(g('Top sürme',o)-o)*.9+(g('Hız',o)-o)*.3,
      hiz:(kn?1:fw?-1:df?-9:-11)+(g('Hız',o)-o)*.8+(g('Hızlanma',o)-o)*.4+(g('Hız',o)>=84?5:0),
      uzak:(os?5:fw?3:kn?3:-25)+(g('Uzaktan şut',o)-o)*1.1,
      uzunpas:(os?.5:df?-5.5:-14)+(g('Vizyon',o)-o)*.8+(g('Pas',o)-o)*.4,
      kisapas:(os?4:df?-2.5:-12)+(g('Takım oyunu',o)-o)*.6+(g('Pas',o)-o)*.4-(g('Vizyon',o)-o)*.3,
      bindir:(df&&(p.spos==='SLB'||p.spos==='SĞB'||(!p.spos&&r()<.42))?6:-40)+(g('Hız',o)-o)*.6+(g('Dayanıklılık',o)-o)*.4,
      sert:(df?2:os?0:-6)+(g('Agresiflik',o)-o)*.8+(g('Güç',o)-o)*.3,
      didis:-6+(g('Agresiflik',o)-o)*.6-(g('Soğukkanlılık',o)-o)*.4+r()*6};
    for(const k in sc)sc[k]+=r()*4-2;
    const max=o>=82?3:o>=72?2:1;out=Object.entries(sc).filter(([,v])=>v>3.5).sort((a,b)=>b[1]-a[1]).slice(0,max).map(x=>x[0]);
    if(out.includes('uzunpas')&&out.includes('kisapas'))out=out.filter(k=>k!=='kisapas');}catch(e){out=[];}
  return TRC[key]=out;}
function trChips(p,big){const L=pTraits(p);if(!L.length)return big?'<p class="muted" style="font-size:12.5px">Belirgin bir oyun karakteristiği yok.</p>':'';
  return `<div class="trt-chips${big?' big':''}">${L.map(k=>{const t=TRAITS[k];return `<span class="trt" style="--tc:${t.col}" title="${esc(t.d)}"><i>${t.ic}</i>${esc(big?t.n:t.s)}</span>`;}).join('')}</div>`;}
/* motor kaydına karakteristikleri ekle → ab/sim.js trApply */
abRec=(old=>function(p,role,T){const r=old.apply(this,arguments);try{const L=pTraits(p);if(L.length)r.tr=L.slice();}catch(e){}return r;})(abRec);
/* profil: Genel sekmesinin başına "Oyun karakteristikleri" */
pfBuild=(old=>function(mc){const r=old.apply(this,arguments);try{if(!mc||!PF_CUR)return r;const gr=mc.querySelector('.pf-genr');if(!gr||gr.querySelector('.trt-sec'))return r;
  let p=null;try{p=pByKey(PF_CUR.k);}catch(e){}if(!p&&PF_CUR.k==='ME'&&G&&G.p)p=Object.assign({k:'ME',name:PN(),pos:G.p.pos,ovr:G.p.ovr,age:G.p.age},G.p);if(!p)return r;
  const sec=document.createElement('section');sec.className='trt-sec';sec.innerHTML=`<p class="fmp-sec">Oyun karakteristikleri</p>${trChips(p,true)}${pTraits(p).map(k=>`<p class="trt-d"><b>${TRAITS[k].ic} ${esc(TRAITS[k].n)}</b> — ${esc(TRAITS[k].d)}</p>`).join('')}`;
  gr.insertBefore(sec,gr.firstChild);}catch(e){console.warn('trait',e);}return r;})(pfBuild);
/* kulüp sayfası → oyuncu profili → kapatınca kulüp sayfasına geri dön */
let PF_BACK=null;
showPCard=(old=>function(){let was=false;try{was=$('#modalCard').classList.contains('cp')&&!$('#modal').hidden;}catch(e){}const r=old.apply(this,arguments);if(was&&CP.id)PF_BACK=CP.id;return r;})(showPCard);
closeModal=(old=>function(){const r=old.apply(this,arguments);try{if(PF_BACK&&$('#modal').hidden){const id=PF_BACK;PF_BACK=null;showClub(id);}}catch(e){}return r;})(closeModal);
showClub=(old=>function(){PF_BACK=null;return old.apply(this,arguments);})(showClub);
/* kulüp sayfası kilit oyuncular listesinde karakteristik simgeleri */
cpBody=(old=>function(id,tab){let h=old.apply(this,arguments);try{if(tab==='gen'||tab==='alt'){const sq=squadOf(id),by={};sq.forEach(p=>by[p.k]=p);
  h=h.replace(/<li data-act="pcard" data-id="([^"]+)" data-k="([^"]+)">([\s\S]*?)<b>([^<]*)<\/b>/g,(m,cid,k,pre,nm)=>{const p=by[k];const L=p?pTraits(p):[];return `<li data-act="pcard" data-id="${cid}" data-k="${k}">${pre}<b>${nm}${L.length?` <span class="trt-ic">${L.map(x=>`<i title="${esc(TRAITS[x].n)}">${TRAITS[x].ic}</i>`).join('')}</span>`:''}</b>`;});}}catch(e){}return h;})(cpBody);
/* ---------- sahada görünürlük: halka + bildirim + anlatım ---------- */
const TRV={last:{},com:-99,ring:null};
function trShow(ei,k){const W=ABM.win,sim=ABM.sim;if(!W||!sim||!TRAITS[k])return;const q=sim.players[ei];if(!q||q.off)return;const key=ei+k,now=sim.t;if(TRV.last[key]!=null&&now-TRV.last[key]<25)return;TRV.last[key]=now;
  const t=TRAITS[k],fp=abFxP(ei),nm=fp?(fp.sur||fp.name):(q.short||q.name);
  /* halka: 2,6 sn */
  W.__abTr=[{id:ei,col:t.col}];clearTimeout(TRV.ring);TRV.ring=setTimeout(()=>{try{W.__abTr=null;}catch(e){}},2600);
  /* bildirim (iframe içinde) */
  try{const D=W.document;let box=D.getElementById('abh-trt');if(!box){box=D.createElement('div');box.id='abh-trt';box.style.cssText='position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:60;display:flex;flex-direction:column;gap:6px;align-items:center;pointer-events:none;font-family:Inter,system-ui,sans-serif';D.body.appendChild(box);}
    try{let cv=null,best=0;D.querySelectorAll('canvas').forEach(c=>{const rr=c.getBoundingClientRect();if(rr.width*rr.height>best&&rr.width>0){best=rr.width*rr.height;cv=rr;}});if(cv){box.style.top=Math.max(8,cv.top+52)+'px';box.style.left=(cv.left+cv.width/2)+'px';}}catch(e){}
    const side=q.team!=null?abE2S(q.team):0,el=D.createElement('div');el.style.cssText=`background:rgba(10,16,28,.88);border:1px solid ${t.col};border-left:4px solid ${t.col};color:#eef3fb;padding:6px 12px;border-radius:9px;font-size:13px;font-weight:600;box-shadow:0 6px 18px rgba(0,0,0,.45);transition:opacity .4s,transform .4s;opacity:0;transform:translateY(-6px);white-space:nowrap`;
    el.innerHTML=`<span style="margin-right:6px">${t.ic}</span>${esc(nm)} <span style="color:${t.col};font-weight:700">· ${esc(t.s)}</span>${side===0?'':' <small style="opacity:.6">(rakip)</small>'}`;box.appendChild(el);requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='none';});
    while(box.children.length>2)box.firstChild.remove();setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),450);},2400);}catch(e){}
  /* anlatım: maç başına seyrek (en az 4 oyun dakikası arayla) */
  try{const mn=abMin();if(t.c.length&&mn-TRV.com>=4){TRV.com=mn;const s=t.c[Math.floor(Math.random()*t.c.length)].replace('{n}',nm);const side=abE2S(q.team);fxEv(mn,`${t.ic} ${s}`,side===0?'us':'opp');}}catch(e){}}
abEv=(old=>function(e){const r=old.apply(this,arguments);try{const sim=ABM.sim;if(!sim||!FX||!FX.ab)return r;const t=e.type,P=sim.players;
  if(t==='KICKOFF'&&e.meta&&e.meta.first!==false&&sim.t<5){TRV.last={};TRV.com=-99;}
  if(t==='TRAIT'&&e.meta)trShow(e.p,e.meta.k);
  else if(t==='FOUL'){const f=P[e.p],v=P[e.p2];if(f&&f.tr&&f.tr.includes('sert'))trShow(e.p,'sert');else if(f&&f.tr&&f.tr.includes('didis')&&Math.random()<.7)trShow(e.p,'didis');else if(v&&v.tr&&v.tr.includes('didis')&&Math.random()<.5)trShow(e.p2,'didis');}
  else if(t==='SHOT'){const p=P[e.p];if(p&&p.tr&&p.tr.includes('uzak')){const gx=sim.teams[p.team].dir>0?105:0;if(Math.hypot(gx-e.x,34-e.y)>21)trShow(e.p,'uzak');}}
  else if(t==='PASS'){const p=P[e.p],q=P[e.p2];if(p&&q&&p.tr&&p.tr.includes('uzunpas')&&Math.hypot(q.x-e.x,q.y-e.y)>30)trShow(e.p,'uzunpas');}}catch(x){}return r;})(abEv);
/* FM profilindeki eski "oyun karakteristikleri" listesi de aynı karakteristikleri göstersin (iki farklı liste olmasın) */
fmPPM=(old=>function(p,A){try{const L=pTraits(p);return L.map(k=>`${TRAITS[k].ic} ${TRAITS[k].n}`);}catch(e){return old.apply(this,arguments);}})(fmPPM);
/* kullanıcı isteği: maç izlerken karakteristik bildirimi, halkası ve anlatım satırı gösterilmez (davranış motorda sürer, profilde görünür) */
trShow=function(){};

