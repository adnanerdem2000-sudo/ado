/* ================= v170: denetim hataları — hakemin kulüp kimliği, milli arada lig maçı, kapanan dönemde bekleyen teklifler, iletilerdeki ekran yolları, yardımcı antrenörün tek haftalık programı ================= */
/* ---------- hakem: kulübe bağlı değil (MHK iletileri, taraftar akışı, kupa günleri) ---------- */
IB_CATS.mhk=['MHK','⚖️','#8c9cff'];if(!IB_ORDER.includes('mhk'))IB_ORDER.splice(IB_ORDER.indexOf('board'),0,'mhk');
const V170_MHK=/^MHK|kokart|klasman|hakem kadrosu|hakem kariyeri|hakemlik|kural kursu|gözlemci notu|maç ataması/i;
function v170RefMsg(m){return !!(m&&!m.offer&&(m.t==='board'||V170_MHK.test(m.title||'')));}
ibCat=(old=>function(m){const c=old.apply(this,arguments);try{if(isRef()&&v170RefMsg(m)&&c&&c.k!=='award'){const D=IB_CATS.mhk;return Object.assign({},c,{k:'mhk',lab:D[0],ic:D[1],col:D[2]});}}catch(e){}return c;})(ibCat);
ibFrom=(old=>function(m){try{if(isRef()&&!m.from&&v170RefMsg(m))return 'MHK';}catch(e){}return old.apply(this,arguments);})(ibFrom);
ibCrestOf=(old=>function(m){const c=old.apply(this,arguments);try{if(isRef()&&c&&c.id===G.club&&!(m.cid===G.club&&m.offer))return null;}catch(e){}return c;})(ibCrestOf);
/* hakeme kulübünün taraftar paylaşımları ve forma tanıtımı gelmez */
fanPosts=(old=>function(){try{if(isRef())return;}catch(e){}return old.apply(this,arguments);})(fanPosts);
msg=(old=>function(t,title,body){try{if(isRef()&&G.club&&CLUBS[G.club]&&/formalarını tanıttı/.test(String(title||''))&&String(title).startsWith(CLUBS[G.club].name))return;}catch(e){}return old.apply(this,arguments);})(msg);
/* hakem: kulübün kupa günü sessizce geçer (o gün başka hakemler görevli) */
function v170RefCup(){const cu=cupToday();if(cu){try{const {c:k,r}=cu,me=myClub(),opp=clubObj(k.opp),usHome=r.neutral?true:!!r.home,S=me.str;const [x,y]=simPair(usHome?{str:S}:opp,usHome?opp:{str:S},r.neutral);
    (G.s.cupDays=G.s.cupDays||[]).push(G.s.day);cupApply(k,usHome?x:y,usHome?y:x,[]);}catch(e){console.warn('hakem kupa',e);}}
  try{staffDay();}catch(e){}nextDay();}
staffCup=(old=>function(){if(!isRef())return old.apply(this,arguments);v170RefCup();save();render();toast('Bugün kupa maçlarında başka hakemler görevliydi');})(staffCup);
staffAdvance=(old=>function(){if(!isRef())return old.apply(this,arguments);let g=0;
  while(g++<60&&G.phase==='season'&&(typeof mpStep!=='function'||mpStep())){const t=dayType(G.s.day);if(t==='mac')break;if(t==='kupa'){v170RefCup();continue;}staffDay();nextDay();}
  save();render();window.scrollTo(0,0);})(staffAdvance);
/* ---------- takvim: FIFA milli arasında lig maçı oynanmaz ---------- */
function v170NtWins(y){const W=[];try{for(let i=0;i+1<NT_DAYS.length;i+=2){const a=dayOfDate(y,NT_DAYS[i][0],NT_DAYS[i][1]),b=dayOfDate(y,NT_DAYS[i+1][0],NT_DAYS[i+1][1]);W.push([Math.min(a,b)-1,Math.max(a,b)]);}}catch(e){}return W;}
buildCal=(old=>function(lid,y){const days=old.apply(this,arguments);try{const L=LEAGUES[lid];if(!L||L.youth||!Array.isArray(days)||!days.length)return days;
    const W=v170NtWins(y),inW=d=>W.some(([a,b])=>d>=a&&d<=b);if(!days.some(inW))return days;
    const used=new Set(days.filter(d=>!inW(d))),out=[];
    for(const d of days){if(!inW(d)){out.push(d);continue;}const w=W.find(([a,b])=>d>=a&&d<=b);let c=null;
      /* önce aradan hemen sonraki hafta içi (Çarşamba/Perşembe), sonra ileriye doğru boş gün */
      for(let k=1;k<=24&&c==null;k++){const x=w[1]+k;if(!used.has(x)&&!used.has(x-1)&&!used.has(x+1)&&!inW(x))c=x;}
      if(c==null)c=d;used.add(c);out.push(c);}
    return out.sort((a,b)=>a-b);}catch(e){console.warn('v170 takvim',e);return days;}})(buildCal);
/* ---------- transfer dönemi kapanınca kulübe gelen teklifler düşer ---------- */
nextDay=(old=>function(){const r=old.apply(this,arguments);try{const m=G&&G.m;if(m&&G.mode==='mgr'&&G.s&&Array.isArray(m.bids)&&m.bids.length&&!inWindow()){const n=m.bids.length;m.bids=[];
      msg('board','Transfer dönemi kapandı',`Oyuncuların için gelen ${n} teklifin süresi doldu. Yeni teklifler bir sonraki transfer döneminde gelebilir.`);}}catch(e){}return r;})(nextDay);
/* ---------- iletilerdeki ekran yolları tıklanabilir bağlantı ---------- */
const V170_YOL=[[/Takım › Transfer › Gelen teklifler ekranından yanıtla\.?/g,'<button type="button" class="ib-go" data-act="v170Git" data-k="bids">Gelen teklifleri aç</button> ve yanıtla.'],
  [/Kadro › Dinamik ekranından görüşebilirsin/g,'<button type="button" class="ib-go" data-act="v170Git" data-k="din">Dinamikler ekranından</button> görüşebilirsin'],
  [/Kariyer › Menajer ve sponsorlar ekranından yanıtla\.?/g,'<button type="button" class="ib-go" data-act="v170Git" data-k="agent">Menajer ve sponsorlar ekranından</button> yanıtla.']];
function v170Yol(s){if(typeof s!=='string'||s.indexOf('›')<0)return s;for(const [re,h] of V170_YOL)s=s.replace(re,h);return s;}
/* ileti kartı çizilirken ekran yolu bağlantıya döner (gövde metni kaçışlı yazılır; eski iletilerde de çalışır) */
msgHTML=(old=>function(m){const h=old.apply(this,arguments);try{if(h.indexOf('msg-body')>0){let r=v170Yol(h);
    /* gelen teklif kalmadıysa "yanıtla" bağlantısı yerine süresinin dolduğu yazılsın */
    if(r.indexOf('data-k="bids"')>0){const live=G&&G.m&&(G.m.bids||[]).some(b=>b.until>G.s.day);if(!live)r=r.replace(/<button type="button" class="ib-go" data-act="v170Git" data-k="bids">Gelen teklifleri aç<\/button> ve yanıtla\./,'<em class="ib-eski">Bu teklifin süresi doldu.</em>');}
    return r;}}catch(e){}return h;})(msgHTML);
function v170NavItem(id){try{for(const [,its] of navCats())for(const it of its)if(it[0]===id)return it[2];}catch(e){}return null;}
ACTX.v170Git=el=>{const k=el.dataset.k;try{if(!$('#modal').hidden)closeModal();}catch(e){}
  if(k==='bids'){TAB='squad';KTAB='transfer';try{STB.trf='gel';}catch(e){}}
  else if(k==='din'){const a=v170NavItem('din');if(a){TAB=a.tab;if(a.k)KTAB=a.k;}else{TAB='squad';KTAB='iliski';}}
  else if(k==='agent'){TAB='agent';}
  render();window.scrollTo(0,0);};
/* ---------- yardımcı antrenör: haftanın idman odağı seçildiyse haftalık program da uygulanmış sayılır ---------- */
function v170YrBagla(){try{if(!isStaff()||G.staff!=='yrd'||!G.s||G.phase!=='season')return;const j=stG();if((j.tr||0)<40)return;const w=(j.wk&&j.wk[G.s.week])||{};const Y=v164YrState();
    /* hocanın idman sorusu kuyruktaysa yanıt beklenir: hoca kendi programına geçmez */
    if(!w.tr){try{if(Y.st==='taslak'||Y.st==='red'){const nm=nextMatchDay(G.s.day);/* soru kuyruktaysa ya da bu hafta lig maçı yoksa (kamp, milli ara) odak sorusu gelemez: ceza yok */
      if(v155().q.some(x=>x.k==='yr_tr')||nm==null||nm-G.s.day>6)Y.late=1;}}catch(e){}return;}if(Y.st!=='taslak'&&Y.st!=='red')return;let q=.55;try{q=Math.max(.55,v164Eval(Y.g).q);}catch(e){}
    Y.st='onay';Y.q=q;Y.late=1;Y.oto=1;try{v164YrPrw(j,Y);}catch(e){}
    msg('coach','Haftalık program uygulandı',`${coachOf(G.club).n}: “Bu hafta ${esc(YR_TR[w.tr]||'seçtiğin')} odağıyla standart programı uyguluyoruz.” Günleri ayrıntılı düzenlemek istersen Antrenman sekmesinden programını sunabilirsin.`);}catch(e){console.warn('v170 yrd',e);}}
nextDay=(old=>function(){v170YrBagla();const r=old.apply(this,arguments);v170YrBagla();return r;})(nextDay);
