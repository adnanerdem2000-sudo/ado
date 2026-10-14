/* ================= v164: haftalık idman takvimi (sabah/öğleden sonra/ekstra) · bireysel odak · duran top editörü ================= */
/* Takım idmanı: 7 gün × 3 oturum; maç günleri otomatik tanınır (maç günü idman yok, maçtan önceki gün hafif/taktik, maçtan sonraki gün toparlanma).
   Etkiler eski sistemlerin üstüne kurulur: kondisyon (m.tcond), taktik uyum (fm.fam), duran top (m.sp), form (m.form), gençlerin gelişimi (m.dev),
   haftalık yoğunluk → m.tp (mgrWeek sakatlık/form hesabı), özellik gelişimi → G.m.v164a[oyuncu][özellik] (1–20 ölçeğinde küçük artışlar, fmAttrs'a yansır). */
const V164S={
  day:{n:'Dayanıklılık',k:'DAYAN.',c:-3.2,fiz:1,form:.04,col:'#ef6b5b',at:['Dayanıklılık','Vücut Zindeliği'],r:1,d:'Uzun koşular ve interval: kondisyon tabanı, form.'},
  hiz:{n:'Hız / çeviklik',k:'HIZ',c:-2.8,fiz:1,form:.03,col:'#ff9f43',at:['Hız','Hızlanma','Çeviklik'],r:1.15,d:'Sprint, çabukluk merdiveni: sakatlık riski en yüksek seans.'},
  guc:{n:'Güç',k:'GÜÇ',c:-2.6,fiz:1,form:.03,col:'#e0566f',at:['Güç','Zıplama','Denge'],r:1,d:'Kuvvet salonu ve ikili mücadele.'},
  tek:{n:'Teknik',k:'TEKNİK',c:-1.6,dev:1,col:'#4ad27f',at:['Teknik','İlk Kontrol','Pas'],r:.35,d:'Pas, top kontrolü, bitiricilik: gençler gelişir.'},
  thu:{n:'Taktik · hücum',k:'T-HÜC.',c:-1.4,fam:.32,col:'#39a0ff',at:['Topsuz Alan','Karar Alma'],r:.3,d:'Hücum kalıpları, koşu yolları: taktik uyum artar.'},
  tsa:{n:'Taktik · savunma',k:'T-SAV.',c:-1.4,fam:.32,col:'#2f6fd6',at:['Pozisyon Alma','Markaj'],r:.3,d:'Blok, pres tetikleri, savunma çizgisi: taktik uyum artar.'},
  dur:{n:'Duran toplar',k:'DURAN',c:-.8,sp:.2,col:'#ffb320',at:['Korner','Serbest Vuruş Kullanma'],r:.15,d:'Korner, frikik, penaltı ve taç rutinleri: duran top etkinliği artar.'},
  pro:{n:'Maç provası',k:'PROVA',c:-1,fam:.4,sp:.05,col:'#8f7cff',r:.2,d:'İlk 11 ile maç planı provası: maçtan önceki gün için ideal.'},
  rak:{n:'Rakip analizi',k:'ANALİZ',c:.4,fam:.12,opp:1,col:'#6dd3e0',r:0,d:'Video ve rakip planı: sıradaki maçta küçük güç bonusu.'},
  top:{n:'Toparlanma',k:'TOPAR.',c:3.4,col:'#7fc8a9',r:0,d:'Havuz, masaj, hafif koşu: kondisyon yenilenir.'},
  din:{n:'Dinlenme',k:'DİNLEN',c:3,col:'#8a8fa3',r:0,d:'Oturum yok: tam dinlenme.'},
  alt:{n:'Altyapıyla ortak',k:'ALTYAPI',c:-1.4,dev:1.4,young:1,col:'#c2e85c',at:['Takım Oyunu','Teknik'],r:.3,d:'U19 ile ortak idman: 21 yaş altı oyuncular hızlı gelişir.'}};
const V164B={n:'Boş',k:'—',c:1.8,col:'#3a4a42',r:0,d:'Program yok; oyuncular serbest.'};
const V164I={dus:{n:'Düşük',m:.55,c:.5,r:.25},orta:{n:'Orta',m:1,c:1,r:1},yuk:{n:'Yüksek',m:1.45,c:1.6,r:2.8}};
const V164SL=['Sabah','Öğleden sonra','Ekstra'];
const V164T={denge:{n:'Dengeli',d:'Her alana dengeli yük; maç haftasına göre yerleşir.'},yogun:{n:'Maç haftası yoğun',d:'Haftada iki maç: düşük yük, toparlanma ve prova ağırlıklı.'},
  kamp:{n:'Kondisyon kampı',d:'Yüksek fiziksel yük: form ve dayanıklılık artar, sakatlık riski yükselir.'},taktik:{n:'Taktik odaklı',d:'Taktik uyum, rakip analizi ve duran toplar öne çıkar.'}};
const V164AREA={gen:[],fiz:['Dayanıklılık','Güç','Hız'],bit:['Bitiricilik','Soğukkanlılık','Kafa Vuruşu'],pas:['Pas','Vizyon','Teknik'],sav:['Markaj','Top Kapma','Pozisyon Alma'],kal:['Refleks','Bire Bir','Hava Hakimiyeti']};
const V164ROL={hedef:['Hedef forvet',['Kafa Vuruşu','Güç','Zıplama'],'FW'],firsat:['Fırsatçı forvet',['Bitiricilik','Topsuz Alan','Soğukkanlılık'],'FW'],
  kanat:['Kanat oyuncusu',['Orta Yapma','Dripling','Hızlanma'],'KN'],ickanat:['İçe kat eden kanat',['Dripling','Uzaktan Şut','Bitiricilik'],'KN'],
  kurucu:['Derin oyun kurucu',['Pas','Vizyon','Karar Alma'],'OS'],kapan:['Top kapan orta saha',['Top Kapma','Çalışkanlık','Agresiflik'],'OS'],b2b:['Kutu kutu orta saha',['Dayanıklılık','Pas','Topsuz Alan'],'OS'],
  stoper:['Stoper',['Markaj','Kafa Vuruşu','Pozisyon Alma'],'DF'],bek:['Hücumcu bek',['Orta Yapma','Dayanıklılık','Hız'],'DF'],
  duran:['Duran top uzmanı',['Korner','Serbest Vuruş Kullanma','Penaltı Kullanma'],''],taci:['Uzun taç atıcı',['Uzun Taç','Güç'],''],
  supurucu:['Süpürücü kaleci',['Kaleden Çıkma','Ayakla Oyun','Refleks'],'KL']};
const V164AT=['Bitiricilik','Dripling','İlk Kontrol','Kafa Vuruşu','Korner','Markaj','Orta Yapma','Pas','Penaltı Kullanma','Serbest Vuruş Kullanma','Teknik','Top Kapma','Uzaktan Şut','Uzun Taç',
  'Karar Alma','Konsantrasyon','Pozisyon Alma','Soğukkanlılık','Topsuz Alan','Vizyon','Dayanıklılık','Güç','Hız','Hızlanma','Zıplama'];
const V164ATK=['Refleks','Bire Bir','Hava Hakimiyeti','Elle Oyun','Kaleden Çıkma','Ayakla Oyun','İletişim','Uzun Atış'];
const v164mgr=()=>!!(G&&G.mode==='mgr'&&G.m&&G.club&&G.s);
function v164Mon(){try{return G.s.day-wdOf(today());}catch(e){return 0;}}
function v164DT(d){try{return dayType(d);}catch(e){return null;}}
const v164IsM=d=>{const t=v164DT(d);return t==='mac'||t==='kupa';};
function v164Opp(d){try{if(v164DT(d)==='kupa'){const c=cupDayFor(d);if(c&&c.r&&c.r.ties){const t=c.r.ties.find(x=>x.includes&&x.includes(G.club));if(t)return clubObj(t[0]===G.club?t[1]:t[0]);}return null;}
  const w=G.s.cal.indexOf(d);if(w<0)return null;const fx=(G.s.fixtures[w]||[]).find(x=>x.includes(G.club));return fx?CLUBS[fx[0]===G.club?fx[1]:fx[0]]:null;}catch(e){return null;}}
/* haftanın günleri: maç günleri ve göreli konum (MG−1, MG+1) */
function v164Week(){const m0=v164Mon(),out=[];for(let i=0;i<7;i++){const d=m0+i,dt=v164DT(d),mt=dt==='mac'||dt==='kupa';
    out.push({i,d,dt,mt,pre:!mt&&v164IsM(d+1),post:!mt&&v164IsM(d-1),pre2:!mt&&v164IsM(d+2),date:dateOf(d)});}return out;}
const v164S0=(t,i)=>({t:t||'',i:i||'orta'});
/* şablon → hafta (maç günlerine göre yerleşir) */
function v164Tpl(key,W){W=W||v164Week();const nM=W.filter(x=>x.mt).length,g=[];let k=0;
  for(const x of W){const S=v164S0;let r;
    if(x.mt)r=[S(),S(),S()];
    else if(key==='yogun'||(key==='denge'&&nM>=2)){r=x.post?[S('top','dus'),S('din'),S()]:x.pre?[S('pro','dus'),S('rak','dus'),S('dur','dus')]:[S('tek','dus'),S('thu'),S()];}
    else if(key==='kamp'){r=x.post?[S('top'),S('day','dus'),S()]:x.pre?[S('pro','dus'),S('tek','dus'),S()]:(k++%2?[S('hiz','yuk'),S('tek'),S('day','dus')]:[S('day','yuk'),S('guc'),S('hiz')]);}
    else if(key==='taktik'){r=x.post?[S('top','dus'),S('rak','dus'),S()]:x.pre?[S('pro'),S('rak','dus'),S('dur','dus')]:(k++%2?[S('tsa'),S('dur'),S('rak','dus')]:[S('thu'),S('tsa'),S('tek','dus')]);}
    else{r=x.post?[S('top','dus'),S('din'),S()]:x.pre?[S('pro','dus'),S('rak','dus'),S()]:x.pre2?[S('thu'),S('dur'),S()]:
      (x.i===6&&!nM?[S('din'),S('din'),S()]:[[S('day'),S('tek'),S()],[S('hiz'),S('tsa'),S('dur','dus')],[S('guc'),S('thu'),S()],[S('tek'),S('tsa'),S()]][k++%4]);}
    g.push(r);}
  return g;}
/* maç günlerine göre otomatik uyarlama (uygulanan oturumlar) */
function v164Eff(x,sl){if(x.mt)return [];return sl.map((s,j)=>{let t=s.t,i=s.i,a=0;const S=V164S[t];
    if(x.pre){if(S&&S.fiz){t='pro';i='dus';a=1;}else if(i==='yuk'){i='orta';a=1;}}
    if(x.post){if(j===0&&t!=='top'&&t!=='din'){t='top';i='dus';a=1;}else if(S&&S.fiz&&i!=='dus'){i='dus';a=1;}}
    return {t,i,a};});}
/* eski kayıt: v39 programı (m.trw) takvime çevrilir */
const V164OLD={tak:'thu',fiz:'day',tek:'tek',dur:'dur',hfk:'top',din:'din'};
function v164Init(){const m=trInit();if(!m)return null;if(!m.v164||!Array.isArray(m.v164.g)||m.v164.g.length!==7){const old=m.trw||TS_DEF,same=JSON.stringify(old)===JSON.stringify(TS_DEF);
    let g;if(same)g=v164Tpl('denge');else{g=[];for(let w=0;w<7;w++){let t=V164OLD[old[(w+6)%7]]||'din';if(t==='thu'&&w%2)t='tsa';g.push([v164S0(t),v164S0(t==='din'?'din':''),v164S0()]);}}
    m.v164={g,tpl:same?'denge':'ozel',auto:true,wk:v164Mon()};v164Sync(m);}
  m.v164a=m.v164a||{};m.spe=v164SpeInit(m);return m;}
/* m.trw (eski okuyucular) ve m.tp (mgrWeek: form/sakatlık) ile eşitle */
const V164TS={day:'fiz',hiz:'fiz',guc:'fiz',tek:'tek',alt:'tek',thu:'tak',tsa:'tak',pro:'tak',rak:'tak',dur:'dur',top:'hfk',din:'din','':'din'};
function v164Load(g){let L=0;for(const d of g)for(const s of d){const S=V164S[s.t];if(S&&S.r>0)L+=S.r*V164I[s.i||'orta'].m;}return L;}
function v164Sync(m){try{const g=m.v164.g;m.trw=m.trw||TS_DEF.slice();for(let w=0;w<7;w++){const s=g[w].find(x=>x.t&&x.t!=='din')||g[w][0];m.trw[(w+6)%7]=V164TS[s.t]||'din';}
  mgrInit();const L=v164Load(g);m.tp.i=L<4.5?'hafif':L<9.5?'normal':'yogun';
  const c={};for(const d of g)for(const s of d)c[s.t]=(c[s.t]||0)+1;const fz=(c.day||0)+(c.hiz||0)+(c.guc||0);
  m.tp.f=(c.alt||0)>=2?'genc':fz>=5?'kondisyon':(c.thu||0)>(c.tsa||0)+1?'hucum':(c.tsa||0)>(c.thu||0)+1?'savunma':'denge';}catch(e){console.warn('v164 eşitleme',e);}}
/* program değerlendirmesi (td önizleme + yardımcı antrenör hoca onayı) */
function v164Eval(g,W){W=W||v164Week();let q=.5;const iss=[],c={};const add=(v,t)=>{q+=v;if(v<0&&t)iss.push([v,t]);};
  for(const x of W){if(x.mt)continue;const sl=g[x.i];for(const s of sl)c[s.t]=(c[s.t]||0)+1;
    if(x.pre){if(sl.some(s=>V164S[s.t]&&V164S[s.t].fiz))add(-.12,`${TR_DAYS_L[x.i]} maçtan önceki gün; ağır fiziksel seans var.`);if(sl.some(s=>s.i==='yuk'))add(-.06,`${TR_DAYS_L[x.i]} (maç öncesi) yüksek yoğunluk.`);if(sl.some(s=>s.t==='pro'||s.t==='rak'))add(.07);}
    if(x.post){if(sl[0].t==='top'||sl[0].t==='din')add(.08);else add(-.1,`${TR_DAYS_L[x.i]} maçtan sonraki gün; toparlanma yok.`);if(sl.some(s=>V164S[s.t]&&V164S[s.t].fiz&&s.i!=='dus'))add(-.08,`${TR_DAYS_L[x.i]} maç ertesi ağır yük.`);}}
  const L=v164Load(g);if(L>11)add(-.16,`Haftalık yük çok yüksek (${dec(L,1)}): sakatlık riski artar.`);else if(L>=3.5&&L<=9.5)add(.08);else if(L<2.5)add(-.1,'Haftalık yük çok düşük: form düşer.');
  if((c.thu||0)+(c.tsa||0)+(c.pro||0)>=2)add(.06);else add(-.05,'Taktik çalışma az.');if(c.dur)add(.05);else add(-.03,'Duran top çalışması yok.');if(c.tek||c.alt)add(.04);
  if(Object.keys(c).filter(k=>k&&k!=='din').length>=5)add(.04);
  return {q:clamp(q,0,1),L,iss:iss.sort((a,b)=>a[0]-b[0]).map(x=>x[1])};}
/* ---------- günlük etki (td) ---------- */
function v164Apply(m,x,eff){const f=fmInit().fm,sq=squadOf(G.club);let dc=1.75,fam=0,sp=0,form=0,risk=0,dur=0;const A=m.v164a;
  for(const s of eff){const S=V164S[s.t]||V164B,I=V164I[s.i]||V164I.orta;
    dc+=S.c<0?S.c*I.c:S.c*(s.t==='top'?{dus:1.1,orta:1,yuk:.8}[s.i]||1:1);fam+=(S.fam||0)*I.m;sp+=(S.sp||0)*I.m;form+=(S.form||0)*I.m;if(S.sp)dur=1;
    if(S.r>0)risk+=.0045*S.r*I.r;
    if(S.dev)for(const p of sq){if(p.age>21||m.inj[p.k])continue;const gap=potOf(p)-p.ovr;if(gap>0)m.dev[p.k]=(m.dev[p.k]||0)+.012*S.dev*I.m*Math.min(1,gap/6);}
    if(S.opp){const nm=nextMatchDay(G.s.day);if(nm!=null){const o=m.v164op&&m.v164op.d===nm?m.v164op.v:0;m.v164op={d:nm,v:Math.min(.3,o+.15*I.m)};}}
    if(S.at)for(const p of sq){if(m.inj[p.k])continue;const af=p.age<=21?1.5:p.age<=25?1.2:p.age<=29?1:p.age<=32?.6:.35,D=A[p.k]=A[p.k]||{};
      for(const n of S.at)D[n]=Math.round(Math.min(4,(D[n]||0)+.0025*I.m*af)*1e4)/1e4;}}
  m.tcond=clamp(m.tcond+dc+(m.tcond<70?1:0),30,100);f.fam=clamp((f.fam||60)+fam,0,100);m.sp=clamp(m.sp+sp-(dur?0:.03),0,10);m.form=clamp((m.form||0)+form,-3,4);
  if(risk>0&&Math.random()<risk*(m.tcond<70?1.5:1)*(UP&&UP('td_gps')?.8:1)){const fit=sq.filter(p=>!m.inj[p.k]);if(fit.length){const p=pick(fit),w=rint(1,3);m.inj[p.k]=w;m.xi=null;
    msg('squad','İdmanda sakatlık',`${p.name} yüksek tempolu idmanda sakatlandı (${w} hafta). Yoğunluğu düşürmek ya da toparlanma eklemek riski azaltır.`);}}
  if(m.tcond<62&&Math.random()<(62-m.tcond)/260){const fit=sq.filter(p=>!m.inj[p.k]);if(fit.length){const p=pick(fit),w=rint(1,3);m.inj[p.k]=w;m.xi=null;msg('squad','Yorgunluk sakatlığı',`${p.name} yorgunluk nedeniyle sakatlandı (${w} hafta). Takım kondisyonu düşük: programa toparlanma ekle.`);}}}
trDay=(old=>function(){if(!v164mgr()||G.m.shadow)return old.apply(this,arguments);let m;try{m=v164Init();}catch(e){return old.apply(this,arguments);}if(!m||G.phase!=='season')return;
  try{const W=v164Week(),x=W[wdOf(today())];if(x.mt){m.tcond=clamp(m.tcond-11,30,100);return;}v164Apply(m,x,m.v164.auto===false?m.v164.g[x.i].map(s=>({t:s.t,i:s.i})):v164Eff(x,m.v164.g[x.i]));}
  catch(e){console.warn('v164 idman günü',e);}})(trDay);
/* haftalık: bireysel odak özellik gelişimi, şablonun yeni haftaya yerleşmesi */
trWeek=(old=>function(){const r=old.apply(this,arguments);try{if(!v164mgr())return r;const m=v164Init();if(!m)return r;const sq=squadOf(G.club),A=m.v164a;
    const n=m.v164.g.reduce((a,d)=>a+d.filter(s=>s.t&&s.t!=='din'&&s.t!=='top').length,0),wf=clamp(.6+n*.05,.6,1.3);
    for(const [k,v] of Object.entries(m.itr||{})){const p=sq.find(x=>x.k===k);if(!p)continue;const L=v.startsWith('at:')?[v.slice(3)]:v.startsWith('rol:')?((V164ROL[v.slice(4)]||[])[1]||[]):(V164AREA[v]||[]);if(!L.length)continue;
      const base=(p.age<=21?.22:p.age<=24?.17:p.age<=28?.11:p.age<=31?.06:.03)*wf*(m.inj[k]?.3:1)/Math.sqrt(L.length),D=A[k]=A[k]||{};
      for(const at of L){const cur=v164At(p,at);D[at]=Math.round(Math.min(4,(D[at]||0)+base*(cur>=18?.3:cur>=16?.6:1))*1e4)/1e4;}}
    if(m.v164.tpl&&m.v164.tpl!=='ozel'){m.v164.g=v164Tpl(m.v164.tpl);}m.v164.wk=v164Mon();v164Sync(m);
    try{for(const k in FMA_C)delete FMA_C[k];}catch(e){}}catch(e){console.warn('v164 hafta',e);}return r;})(trWeek);
/* özellik gelişimi fmAttrs'a yansır (1–20 ölçeği; ham değer ×4,1) */
fmAttrs=(old=>function(p){const A=old.apply(this,arguments);try{const D=G&&G.m&&G.m.v164a&&p&&G.m.v164a[p.k];if(!D)return A;const raw=Object.assign({},A.raw),R0=A.raw;
  for(const n in D)if(raw[n]!=null)raw[n]=clamp(raw[n]+D[n]*4.1,10,99);
  const f=L=>L?L.map(([n,v])=>D[n]&&R0[n]!=null?[n,Math.max(v,to20(clamp(R0[n]+D[n]*4.1,10,99)))]:[n,v]):L;
  return Object.assign({},A,{T:f(A.T),M:f(A.M),P:f(A.P),G:f(A.G),raw});}catch(e){return A;}})(fmAttrs);
function v164At(p,n){try{const A=fmAttrs(p);for(const g of ['T','M','P','G'])for(const [k,v] of (A[g]||[]))if(k===n)return v;}catch(e){}return 10;}
/* rakip analizi: sıradaki maç günü küçük bonus */
xiStr=(old=>function(){const s=old.apply(this,arguments);try{const m=G&&G.mode==='mgr'&&G.m;if(m&&m.v164op&&m.v164op.d===G.s.day)return Math.round((s+m.v164op.v)*10)/10;}catch(e){}return s;})(xiStr);

/* ---------- takvim arayüzü (td ve yardımcı antrenör ortak) ---------- */
let V164PK=null;
function v164Grid(ctx){const td=ctx==='td';let g,auto=true;if(td){const m=v164Init();g=m.v164.g;auto=m.v164.auto!==false;}else{g=v164YrState().g;}
  const W=v164Week(),wd=(()=>{try{return wdOf(today());}catch(e){return -1;}})(),lock=!td&&stG().tr<40;
  const day=x=>{const date=`${x.date.getUTCDate()} ${TR_MONTHS[x.date.getUTCMonth()]}`,tag=x.mt?'MAÇ':x.pre?'MG−1':x.post?'MG+1':'';
    let body;if(x.mt){const o=v164Opp(x.d);body=`<div class="v164-m"><b>${x.dt==='kupa'?'KUPA':'MAÇ'}</b><small>${o?esc(o.short||o.name):''}</small><em>Maç günü idman yok</em></div>`;}
    else{const ef=auto?v164Eff(x,g[x.i]):g[x.i].map(s=>({t:s.t,i:s.i,a:0}));body=g[x.i].map((s,j)=>{const e=ef[j],S=V164S[e.t]||V164B,I=V164I[e.i]||V164I.orta;
      return `<button class="v164-c${e.t?'':' e'}" data-act="v164Cell" data-x="${ctx}" data-d="${x.i}" data-s="${j}" style="--c:${S.col}" ${lock?'disabled':''} title="${esc(V164SL[j]+': '+S.n+(e.a?' (maç günü uyarlaması; planlanan: '+((V164S[s.t]||V164B).n)+')':''))}"><span>${V164SL[j]}</span><b>${S.k}</b><small>${e.t&&e.t!=='din'&&e.t!=='top'?I.n:'&nbsp;'}${e.a?' · oto':''}</small></button>`;}).join('');}
    return `<div class="v164-d${x.i===wd?' v164-td':''}${x.mt?' mt':''}"><div class="v164-dh"><b>${TR_DAYS[x.i]}</b><small>${date}</small>${tag?`<em class="${x.mt?'m':''}">${tag}</em>`:''}</div>${body}</div>`;};
  return `<div class="v164-wk">${W.map(day).join('')}</div>`;}
function v164Legend(){return `<div class="v164-lg">${Object.entries(V164S).map(([k,S])=>`<span style="--c:${S.col}"><i></i>${S.n}</span>`).join('')}</div>`;}
function v164GridOf(ctx){return ctx==='td'?v164Init().v164.g:v164YrState().g;}
function v164Picker(){const P=V164PK;if(!P)return;const g=v164GridOf(P.ctx),s=g[P.d][P.s],W=v164Week(),x=W[P.d];
  const ch=(k,S)=>`<button class="chip v164-pc" data-act="v164Pick" data-t="${k}" aria-pressed="${s.t===k}" style="--c:${S.col}"><i></i>${S.n}</button>`;
  const S=V164S[s.t]||V164B;
  openModal(`<h3>${TR_DAYS_L[P.d]} · ${V164SL[P.s]}</h3>${x.pre?'<p class="muted">Maçtan önceki gün: ağır fiziksel seanslar otomatik olarak hafif provaya çevrilir.</p>':x.post?'<p class="muted">Maçtan sonraki gün: sabah oturumu otomatik olarak toparlanma olur.</p>':''}
   <div class="v164-pk">${ch('',V164B)}${Object.entries(V164S).map(([k,S])=>ch(k,S)).join('')}</div>
   <p class="sub-h" style="margin:10px 0 4px"><span>Yoğunluk</span><span>${esc(S.n)}</span></p><div class="filt">${Object.entries(V164I).map(([k,I])=>`<button class="chip" data-act="v164Int" data-i="${k}" aria-pressed="${(s.i||'orta')===k}">${I.n}</button>`).join('')}</div>
   <p class="muted" style="margin:8px 0">${esc(S.d)}${S.r>0?' Yüksek yoğunluk gelişimi artırır ama sakatlık riskini belirgin yükseltir.':''}</p>
   <div class="day-ctas"><button class="btn" data-act="v164Copy">Bu günü tüm hafta için kopyala</button><button class="cta" data-act="closeModal">Tamam</button></div>`);}
function v164Changed(ctx){if(ctx==='td'){const m=v164Init();m.v164.tpl='ozel';v164Sync(m);}else{const Y=v164YrState();if(Y.st!=='taslak'){Y.st='taslak';}}save();render();}
ACTX.v164Cell=el=>{V164PK={ctx:el.dataset.x,d:+el.dataset.d,s:+el.dataset.s};v164Picker();};
ACTX.v164Pick=el=>{const P=V164PK;if(!P)return;const s=v164GridOf(P.ctx)[P.d][P.s];s.t=el.dataset.t;if(!s.i)s.i='orta';v164Changed(P.ctx);v164Picker();};
ACTX.v164Int=el=>{const P=V164PK;if(!P)return;v164GridOf(P.ctx)[P.d][P.s].i=el.dataset.i;v164Changed(P.ctx);v164Picker();};
ACTX.v164Copy=()=>{const P=V164PK;if(!P)return;const g=v164GridOf(P.ctx),W=v164Week(),src=JSON.parse(JSON.stringify(g[P.d]));for(const x of W)if(!x.mt&&x.i!==P.d&&!(x.i===6))g[x.i]=JSON.parse(JSON.stringify(src));v164Changed(P.ctx);closeModal();toast('Gün, maç günleri ve Pazar dışında tüm haftaya kopyalandı');};
ACTX.v164Tpl=el=>{const k=el.dataset.k,ctx=el.dataset.x||'td';if(ctx==='td'){const m=v164Init();m.v164.tpl=k;m.v164.g=v164Tpl(k);v164Sync(m);}else{const Y=v164YrState();Y.g=v164Tpl(k);Y.st='taslak';}save();render();toast(`${V164T[k].n} şablonu bu haftaya yerleşti`);};
ACTX.v164Auto=()=>{const m=v164Init();m.v164.auto=m.v164.auto===false;save();render();toast(m.v164.auto?'Maç günlerine göre otomatik uyarlama açık':'Otomatik uyarlama kapalı: program olduğu gibi uygulanır');};
ACTX.v164Ask=()=>{const m=v164Init(),W=v164Week(),nM=W.filter(x=>x.mt).length,k=nM>=2?'yogun':m.tcond<75?'denge':(fmInit().fm.fam||60)<70?'taktik':'denge';
  const g=v164Tpl(k,W),e=v164Eval(g,W);m.v164.g=g;m.v164.tpl=k;v164Sync(m);let who='Yardımcı antrenörün';try{const y=stfMine().find(s=>s.role==='yrd');if(y&&y.name)who=`Yardımcı antrenör ${y.name}`;}catch(e){}
  msg('coach','Haftalık idman önerisi',`${who}: “Bu hafta ${nM} maçımız var${m.tcond<75?', takım yorgun':''}. ${V164T[k].n} programını öneriyorum. Program puanı ${Math.round(e.q*100)}/100; haftalık yük ${dec(e.L,1)}.”`);save();render();toast('Yardımcı antrenörün önerisi uygulandı');};
function v164EvalHTML(g,W){const e=v164Eval(g,W);return `<div class="v164-ev"><div class="bar"><i class="${e.q>=.65?'':e.q>=.45?'mid':'low'}" style="width:${Math.round(e.q*100)}%"></i></div><p><b>Program puanı ${Math.round(e.q*100)}</b> · haftalık yük ${dec(e.L,1)} <small>(ideal 3,5–9,5)</small></p>${e.iss.length?`<ul class="notes">${e.iss.slice(0,3).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p class="muted">Program maç haftasıyla uyumlu.</p>'}</div>`;}
/* bireysel odak */
function v164IndOpts(p,v){const gk=p.pos==='KL';const o=[`<option value="">—</option>`];const opt=(k,l)=>`<option value="${k}" ${v===k?'selected':''}>${esc(l)}</option>`;
  o.push(`<optgroup label="Alan">${[['gen',IT_F.gen],['fiz',IT_F.fiz],gk?['kal',IT_F.kal]:['bit',IT_F.bit],['pas',IT_F.pas],['sav',IT_F.sav]].map(([k,l])=>opt(k,l)).join('')}</optgroup>`);
  const rl=Object.entries(V164ROL).filter(([,r])=>gk?r[2]==='KL':r[2]!=='KL');o.push(`<optgroup label="Rol">${rl.map(([k,r])=>opt('rol:'+k,'Rol: '+r[0])).join('')}</optgroup>`);
  o.push(`<optgroup label="Özellik">${(gk?V164ATK:V164AT).map(n=>opt('at:'+n,`Özellik: ${n} (${v164At(p,n)})`)).join('')}</optgroup>`);
  if(!gk){try{const R=fmPosR(p);o.push(`<optgroup label="Yeni mevki">${DP_ORDER.filter(k=>k!=='GK'&&R[k]<15).map(k=>opt('pos:'+k,'Mevki: '+FMP_PN[k]+' ('+dpLvl(R[k]).toLowerCase()+')')).join('')}</optgroup>`);}catch(e){}}
  return o.join('');}
function v164IndProg(p,v,m){if(!v)return '';if(v.startsWith('pos:')){try{const pos=v.slice(4),r=fmPosR(p)[pos];return `<div class="bar sm"><i style="width:${r/20*100}%"></i></div><small>${DPT[pos]} ${dpLvl(r)} (${Math.round(r)}/20)</small>`;}catch(e){return '';}}
  const L=v.startsWith('at:')?[v.slice(3)]:v.startsWith('rol:')?((V164ROL[v.slice(4)]||[])[1]||[]):(V164AREA[v]||[]),D=(m.v164a||{})[p.k]||{};
  const at=L.map(n=>`${n} ${v164At(p,n)}${D[n]>=.05?` <em class="pos">+${dec(D[n],1)}</em>`:''}`).join(' · ');return `<small>${at||''}${at?' · ':''}gelişim +${dec(m.dev[p.k]||0,2)}</small>`;}
function v164IndHTML(m){const sq=squadOf(G.club).sort((a,b)=>DP_ORDER.indexOf(dpMain(a))-DP_ORDER.indexOf(dpMain(b)));
  return `<div class="v164-ind">${sq.map(p=>{const v=m.itr[p.k]||'';return `<div class="v164-ir${v?' on':''}"><div class="v164-in"><span class="plink" data-act="pcard" data-id="${G.club}" data-k="${p.k}">${esc(p.name)}</span><small>${dpTag(p)} · ${p.age} yaş · ${R200(p.ovr)}${m.inj[p.k]?' · <em class="res-l">sakat</em>':''}</small></div>
    <select data-chg="v164Ind" data-k="${p.k}" aria-label="${esc(p.name)} bireysel odak">${v164IndOpts(p,v)}</select><div class="v164-pr">${v164IndProg(p,v,m)}</div></div>`;}).join('')}</div>`;}
function v164TrainView(){const m=v164Init(),f=fmInit().fm,W=v164Week(),inj=Object.entries(m.inj||{}),sq=squadOf(G.club),V=m.v164;
  const bar=(l,v,c,sfx)=>`<div class="tr-m"><span>${l}</span><div class="bar"><i style="width:${clamp(v,0,100)}%;background:${c}"></i></div><b>${Math.round(v)}${sfx||''}</b></div>`;
  const L=v164Load(V.g),risk=L>11?'Yüksek':L>8?'Orta':'Düşük';
  const st=`<section class="panel"><p class="sub-h"><span>Takım durumu</span><span>Form ${m.form>=0?'+':''}${dec(m.form||0)}</span></p>
    ${bar('Kondisyon',m.tcond,m.tcond>=80?'#35d49a':m.tcond>=65?'#ffd166':'#ff6b6b','%')}${bar('Taktik uyum',f.fam||60,'#3fa7ff','%')}${bar('Duran top',m.sp*10,'#ffb320','%')}
    <p class="muted" style="margin:6px 0 0">Haftalık yük ${dec(L,1)} · sakatlık riski <b>${risk}</b>. Kondisyon %65’in altına düşerse yorgunluk sakatlıkları başlar.</p>
    ${inj.length?`<p class="sub-h" style="margin:10px 0 4px"><span>Sakatlar</span></p><ul class="cupres">${inj.map(([k,w])=>{const p=sq.find(x=>x.k===k);return p?`<li><span>${dpTag(p)}</span><b>${esc(p.name)}</b><em class="res-l">${w} hf</em></li>`:'';}).join('')}</ul>`:''}</section>`;
  const tp=`<section class="panel"><p class="sub-h"><span>Şablonlar</span><span>${V.tpl==='ozel'?'Özel program':V164T[V.tpl]?V164T[V.tpl].n:''}</span></p>
    <div class="filt">${Object.entries(V164T).map(([k,t])=>`<button class="chip" data-act="v164Tpl" data-k="${k}" aria-pressed="${V.tpl===k}">${t.n}</button>`).join('')}</div>
    <p class="muted" style="margin:6px 0">${V.tpl!=='ozel'&&V164T[V.tpl]?esc(V164T[V.tpl].d)+' Şablon her hafta maç günlerine göre yeniden yerleşir.':'Hücreleri düzenledin: program her hafta aynen tekrar eder.'}</p>
    <div class="day-ctas"><button class="btn" data-act="v164Ask">Yardımcı antrenörden öneri al</button><button class="btn" data-act="v164Auto" aria-pressed="${V.auto!==false}">${V.auto!==false?'✓ ':''}Maç gününe göre otomatik uyarla</button></div>
    ${v164EvalHTML(V.g,W)}</section>`;
  return `<h2 class="h">Antrenman</h2><div class="tr-grid">${st}${tp}</div>
   <section class="panel"><p class="sub-h"><span>Haftalık idman takvimi</span><span>${TR_DAYS_L[wdOf(today())]}</span></p>${v164Grid('td')}${v164Legend()}
    <p class="muted" style="margin:8px 0 0">Bir hücreye dokunarak oturum türünü ve yoğunluğu seç. Maç günü idman yapılmaz; <b>MG−1</b> hafif/taktik, <b>MG+1</b> toparlanma günüdür (otomatik uyarlama açıkken “oto” yazar).</p></section>
   <section class="panel"><p class="sub-h"><span>Bireysel odak</span><span>${Object.keys(m.itr).length} oyuncu</span></p><p class="muted" style="margin:0 0 8px">Bir alan, rol, tek bir özellik ya da yeni mevki seç. Gelişim haftalık işler; gençler daha hızlı gelişir, takım programındaki oturum sayısı gelişimi hızlandırır.</p>${v164IndHTML(m)}</section>
   <button class="btn" data-act="tab" data-tab="setp">⚑ Duran top editörünü aç</button>`;}
XV.train=()=>{try{if(v164mgr())return v164TrainView();}catch(e){console.warn('v164 antrenman',e);}return viewTrain();};
document.addEventListener('change',e=>{const el=e.target.closest('[data-chg]');if(!el)return;const a=el.dataset.chg;if(!/^v164/.test(a))return;try{const m=v164Init();
  if(a==='v164Ind'){if(el.value)m.itr[el.dataset.k]=el.value;else delete m.itr[el.dataset.k];save();render();}
  else if(a==='v164Tk'){v164SpSet(el.dataset.p,el.value);save();render();}
  else if(a==='v164Mk'){m.spe.mk[el.dataset.id].k=el.value;save();render();}
  else if(a==='v164Pl'){const P=G.plan.wk=G.plan.wk||Array(7).fill(null),i=+el.dataset.i,v=el.value;P[i]=!v?null:v==='din'?{r:1}:{k:v.split(':')[0],i:v.split(':')[1]};save();v164PlModal();render();}}catch(err){console.warn(err);}});

/* ---------- yardımcı antrenör: hafta programı hazırlar, hoca onaylar ---------- */
function v164YrState(){const j=stG(),wk=v164Mon();if(!j.v164||j.v164.w!==wk){const prev=j.v164&&j.v164.g;j.v164={w:wk,g:prev?JSON.parse(JSON.stringify(prev)):v164Tpl('denge'),st:'taslak',q:null,note:''};}return j.v164;}
const V164YR={day:'kondisyon',hiz:'kondisyon',guc:'kondisyon',tek:'teknik',alt:'teknik',thu:'taktik',tsa:'taktik',pro:'taktik',rak:'taktik',dur:'duran',top:'dinlen',din:'dinlen','':'dinlen'};
function v164YrPrw(j,Y){const P=yrPrg();P.d=Y.g.slice(0,5).map(d=>{const s=d.find(x=>x.t&&x.t!=='din'&&x.t!=='top')||d[0];return V164YR[s.t]||'dinlen';});P.set=1;P.w=stWk();}
ACTX.v164YrSend=()=>{const j=stG();if(j.tr<40)return toast('Hoca güveni 40 olunca programı sen hazırlarsın');const Y=v164YrState();if(Y.st==='onay')return toast('Bu haftanın programı zaten onaylandı');
  Y.st='sunuldu';Y.sd=G.s.day;Y.q=v164Eval(Y.g).q;save();render();toast(`Program ${coachOf(G.club).n} hocaya sunuldu; yarın dönüş yapacak`);};
function v164YrDecide(){const j=stG(),Y=j.v164;if(!Y||Y.st!=='sunuldu'||G.s.day<=Y.sd)return;const W=v164Week(),e=v164Eval(Y.g,W),hc=coachOf(G.club).n,pOk=clamp(.2+e.q*.65+(j.tr-40)/120,.08,.95);
  if(Math.random()<pOk){Y.st='onay';Y.q=e.q;j.tr=clamp(j.tr+(e.q>=.7?2:1),0,100);j.pts=(j.pts||0)+(e.q>=.7?1:.5);v164YrPrw(j,Y);
    msg('coach','Program onaylandı',`${hc}: “Haftalık programını onaylıyorum${e.q>=.75?', çok iyi düşünülmüş':''}. Uygulamaya geçiyoruz.” (program puanı ${Math.round(e.q*100)})`);}
  else if(e.q>=.42){const x=W.find(x=>x.pre&&!x.mt)||W.find(x=>x.post&&!x.mt);if(x){if(x.pre)Y.g[x.i]=[v164S0('pro','dus'),v164S0('rak','dus'),v164S0()];else Y.g[x.i][0]=v164S0('top','dus');}
    Y.st='onay';Y.q=v164Eval(Y.g,W).q;v164YrPrw(j,Y);msg('coach','Program değişiklikle onaylandı',`${hc}: “Genel olarak iyi ama ${x?TR_DAYS_L[x.i]+' gününü':'bir günü'} değiştirdim.${e.iss[0]?' '+e.iss[0]:''}”`);}
  else{Y.st='red';j.tr=clamp(j.tr-1.5,0,100);msg('coach','Program reddedildi',`${hc}: “Bu programla oyuncuları sahaya hazır çıkaramayız.${e.iss[0]?' '+e.iss[0]:''} Düzeltip tekrar getir.”`);}}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{if(isStaff()&&G.staff==='yrd'&&G.s&&G.phase==='season'){const j=stG();if(j.tr>=40){const Y=v164YrState(),wd=wdOf(today());
    v164YrDecide();if(Y.st==='onay'&&yrPrg().w!==stWk())v164YrPrw(j,Y);
    if(wd===0&&!Y.ask){Y.ask=1;msg('coach','Haftalık program bekleniyor',`${coachOf(G.club).n}: “Bu haftanın idman programını Çarşamba’ya kadar hazırla, birlikte bakalım.” (Antrenman sekmesi)`);}
    if(wd===3&&(Y.st==='taslak'||Y.st==='red')&&!Y.late){Y.late=1;j.tr=clamp(j.tr-.5,0,100);msg('coach','Hoca kendi programını uyguladı',`${coachOf(G.club).n} bu hafta programını beklemedi ve kendi planını uyguladı. Haftaya erken teslim et.`);}
    if(Y.st==='onay'){const x=v164Week()[wd];if(x&&!x.mt){const sq=squadOf(G.club);j.mdev=j.mdev||{};for(const s of v164Eff(x,Y.g[x.i])){const S=V164S[s.t];if(!S||!S.dev)continue;
      for(const p of sq){if(p.age>21)continue;const gap=potOf(p)-p.ovr;if(gap>0)j.mdev[p.k]=(j.mdev[p.k]||0)+.004*S.dev*V164I[s.i].m*Math.min(1,gap/6);}}}}}}}catch(e){console.warn('v164 yrd',e);}return r;})(nextDay);
staffBonus=(old=>function(){let b=old.apply(this,arguments);try{if(G.staff==='yrd'){const j=stG(),Y=j.v164;if(Y&&Y.st==='onay'&&Y.w===v164Mon()&&j.tr>=40)b+=((Y.q||.5)-.5)*.8;}}catch(e){}return b;})(staffBonus);
function v164YrPanel(){const j=stG(),Y=v164YrState(),lock=j.tr<40,W=v164Week();const ST={taslak:['Taslak','warn'],sunuldu:['Hocada','warn'],onay:['Onaylandı','ok'],red:['Reddedildi','bad']}[Y.st]||['',''];
  return `<section class="panel ${lock?'lock':''}"><p class="sub-h"><span>Haftalık idman takvimi</span><span class="v164-st ${ST[1]}">${ST[0]}</span></p>
   <div class="filt" style="margin:0 0 8px">${Object.entries(V164T).map(([k,t])=>`<button class="chip" data-act="v164Tpl" data-x="yrd" data-k="${k}" ${lock?'disabled':''}>${t.n}</button>`).join('')}</div>
   ${v164Grid('yrd')}${v164Legend()}${v164EvalHTML(Y.g,W)}
   <div class="day-ctas"><button class="cta" data-act="v164YrSend" ${lock||Y.st==='sunuldu'||Y.st==='onay'?'disabled':''}>${Y.st==='red'?'Düzeltip yeniden sun':Y.st==='sunuldu'?'Hoca inceliyor':Y.st==='onay'?'Uygulanıyor':'Hocaya sun'}</button></div>
   <p class="muted">Programı hazırla ve teknik direktöre sun; hoca ertesi gün onaylar, değiştirir ya da reddeder. Onaylanan program maç gücüne ve gençlerin gelişimine yansır.${lock?' <b>Hoca güveni 40 olunca açılır.</b>':''}</p></section>`;}
viewYrPlan=(old=>function(){let h=old.apply(this,arguments);try{if(G.s&&G.s.cal)h=h.replace(/<section class="panel[^"]*"><p class="sub-h"><span>Haftalık antrenman programı<\/span>[\s\S]*?<\/section>/,v164YrPanel());}catch(e){console.warn('v164 yrd görünüm',e);}return h;})(viewYrPlan);

/* ---------- futbolcu: takım programı içinde kişisel haftalık plan ---------- */
function v164PlTeam(x){const t=x.dt;return t&&DT[t]?DT[t]:null;}
function v164PlLbl(e){if(!e)return 'Plana göre';if(e.r)return 'Dinlen';return `${ATTR[e.k]||e.k} · ${(INT[e.i]||INT.normal).n}`;}
planHTML=(old=>function(){let h=old.apply(this,arguments);try{if(!isPl()||!G.s||!G.s.cal)return h;const W=v164Week(),P=(G.plan&&G.plan.wk)||[],wd=wdOf(today());
  const strip=`<div class="v164-pw">${W.map(x=>{const T=v164PlTeam(x),e=P[x.i];return `<div class="${x.i===wd?'v164-td':''}${x.mt?' mt':''}"><b>${TR_DAYS[x.i]}</b><small>${T?esc(T.s):'—'}</small><em>${e?(e.r?'Dinlen':esc(ATTR[e.k]||'')):'·'}</em></div>`;}).join('')}</div>`;
  h=h.replace(/<\/section>\s*$/,`<p class="sub-h" style="margin:10px 0 4px"><span>Haftalık kişisel program</span><button class="btn sm" data-act="v164Pl">Düzenle</button></p>${strip}</section>`);}catch(e){}return h;})(planHTML);
function v164PlModal(){const W=v164Week(),P=(G.plan&&G.plan.wk)||[];const val=e=>!e?'':e.r?'din':`${e.k}:${e.i}`;
  const opts=e=>{const v=val(e);return `<option value="" ${v===''?'selected':''}>Plana göre</option><option value="din" ${v==='din'?'selected':''}>Dinlen</option>${Object.entries(INT).map(([ik,I])=>`<optgroup label="${I.n} yoğunluk">${Object.keys(ATTR).map(k=>`<option value="${k}:${ik}" ${v===k+':'+ik?'selected':''}>${ATTR[k]} · ${I.n}</option>`).join('')}</optgroup>`).join('')}`;};
  openModal(`<h3>Haftalık kişisel program</h3><p class="muted">Takım idmanının yanında her gün yapacağın kişisel çalışma. Maç günü ve maçtan önceki gün yoğun seçimler otomatik olarak normale iner.</p>
   <div class="v164-pl">${W.map(x=>{const T=v164PlTeam(x);return `<div class="${x.mt?'mt':''}"><span><b>${TR_DAYS_L[x.i]}</b><small>${T?esc(T.n):'—'}</small></span><select data-chg="v164Pl" data-i="${x.i}" aria-label="${TR_DAYS_L[x.i]} kişisel çalışma">${opts(P[x.i])}</select></div>`;}).join('')}</div>
   <button class="cta" data-act="closeModal" style="margin-top:10px">Tamam</button>`);}
ACTX.v164Pl=()=>v164PlModal();
autoPlan=(old=>function(){try{if(isPl()&&G.s&&!G.slot&&G.plan&&G.plan.wk){const e=G.plan.wk[wdOf(today())];if(e){const p=G.p;if(p.injury)return doFree('rehab',null,true);if(e.r||p.energy<28)return doFree('rest',null,true);
    let int=e.i||'normal';const nm=nextMatchDay(G.s.day);if(int==='yogun'&&nm!=null&&nm-G.s.day<=1)int='normal';const f0=G.plan.focus,i0=G.plan.int;const r=doFree('indiv',{k:e.k,int},true);G.plan.focus=f0;G.plan.int=i0;return r;}}}catch(err){console.warn('v164 plan',err);}
  return old.apply(this,arguments);})(autoPlan);

/* ================= DURAN TOP EDİTÖRÜ (td) ================= */
const V164CK={yakin:'Yakın direk',uzak:'Uzak direk',nokta:'Penaltı noktası',kisa:'Kısa korner',ceza:'Ceza yayı',karisik:'Karışık'};
const V164FD={sut:'Doğrudan şut',orta:'Ceza sahasına orta',kisa:'Kısa pas'};
const V164FW={yakin:'Yakın direk',uzak:'Uzak direk',nokta:'Penaltı noktası',ceza:'Ceza yayı'};
const V164TH={kisa:'Kısa ve güvenli',uzun:'Ceza sahasına uzun taç'};
const V164DS={alan:['Bölgesel','Yakın direk ve ceza yayı güvende; uzak direğe kaçan koşulara açık.'],adam:['Adam adama','En iyi kafacılar eşleşir; yakın direğe ani koşular tehlikeli.'],karma:['Karışık','Dengeli; belirgin zayıf noktası yok.']};
const V164MK={a1:[29,4],a2:[41,6],a3:[34,11],a4:[38,13],a5:[34,20],b1:[18,34],b2:[50,34]};
const V164ZN={yakin:'Yakın direk',uzak:'Uzak direk',nokta:'Penaltı noktası',ceza:'Ceza yayı',geri:'Geride kalır'};
function v164SpeInit(m){const E=m.spe=m.spe||{};E.ck=E.ck||{L:{rt:'yakin'},R:{rt:'uzak'}};E.fk=E.fk||{dir:{rt:'sut'},wide:{tk:'',rt:'uzak'}};E.pen=E.pen||{alt:''};E.th=E.th||{tk:'',rt:'kisa'};
  E.def=E.def||{sys:'karma',posts:1};E.mk=E.mk||{};for(const id in V164MK)if(!E.mk[id])E.mk[id]={x:V164MK[id][0],y:V164MK[id][1],k:''};E.ck.R.tk=E.ck.R.tk||'';return E;}
/* çizim çerçevesi: x 0–68 (sol korner x=0), y kale çizgisinden uzaklık */
function v164Zone(x,y){if(y>24||Math.abs(x-34)>20.2)return 'geri';if(y>16.5)return 'ceza';if(y<=7.5&&x<34)return 'yakin';if(y<=8.5&&x>=34)return 'uzak';return 'nokta';}
function v164SpSet(kind,k){const m=v164Init(),E=m.spe;m.sett=m.sett||{};
  if(kind==='ckL'){m.sett.ck=k;}else if(kind==='ckR')E.ck.R.tk=k;else if(kind==='fkd')m.sett.fk=k;else if(kind==='fkw')E.fk.wide.tk=k;else if(kind==='pen')m.sett.pen=k;else if(kind==='pen2')E.pen.alt=k;else if(kind==='th')E.th.tk=k;}
function v164SpGet(kind){const m=v164Init(),E=m.spe,S=m.sett||{};return {ckL:S.ck,ckR:E.ck.R.tk,fkd:S.fk,fkw:E.fk.wide.tk,pen:S.pen,pen2:E.pen.alt,th:E.th.tk}[kind]||'';}
const V164KA={ckL:['Korner','Orta Yapma'],ckR:['Korner','Orta Yapma'],fkd:['Serbest Vuruş Kullanma','Uzaktan Şut'],fkw:['Korner','Serbest Vuruş Kullanma'],pen:['Penaltı Kullanma','Soğukkanlılık'],pen2:['Penaltı Kullanma','Soğukkanlılık'],th:['Uzun Taç','Güç']};
function v164XI(){const sq=squadOf(G.club),xi=mgrXI();return xi.map(k=>sq.find(p=>p.k===k)).filter(Boolean);}
function v164TkSel(kind){const xs=v164XI().filter(p=>p.pos!=='KL'),cur=v164SpGet(kind),[a1,a2]=V164KA[kind];const sc=p=>v164At(p,a1)*2+v164At(p,a2);xs.sort((a,b)=>sc(b)-sc(a));
  const best=xs[0];return `<select data-chg="v164Tk" data-p="${kind}" aria-label="Vuruşçu"><option value="">Otomatik${best?` (${esc(best.name)})`:''}</option>${xs.map(p=>`<option value="${p.k}" ${cur===p.k?'selected':''}>${esc(p.name)} · ${a1.split(' ')[0]} ${v164At(p,a1)} · ${a2.split(' ')[0]} ${v164At(p,a2)}</option>`).join('')}</select>`;}
/* işaretçilere otomatik oyuncu (boşsa): kafacılar ceza sahasına, uzaktan şutçu ceza yayına, hızlı savunmacılar geriye */
function v164MkAuto(){const m=v164Init(),E=m.spe,xs=v164XI().filter(p=>p.pos!=='KL'),used=new Set(),out={};const tk=[m.sett&&m.sett.ck].filter(Boolean);
  for(const id in E.mk){const k=E.mk[id].k;if(k&&xs.some(p=>p.k===k)){out[id]=k;used.add(k);}}
  const air=p=>v164At(p,'Kafa Vuruşu')*2+v164At(p,'Zıplama')+v164At(p,'Güç')*.5;
  for(const id in E.mk){if(out[id])continue;const z=v164Zone(E.mk[id].x,E.mk[id].y);const c=xs.filter(p=>!used.has(p.k)&&!tk.includes(p.k));
    c.sort((a,b)=>z==='ceza'?v164At(b,'Uzaktan Şut')-v164At(a,'Uzaktan Şut'):z==='geri'?(v164At(b,'Hız')+(b.pos==='DF'?3:0))-(v164At(a,'Hız')+(a.pos==='DF'?3:0)):air(b)-air(a));
    if(c[0]){out[id]=c[0].k;used.add(c[0].k);}}return out;}
let V164SP={tab:'ck',side:'L'};
function v164Pitch(mode){const m=v164Init(),E=m.spe,mir=V164SP.side==='R',AU=v164MkAuto(),sq=squadOf(G.club),nm=k=>{const p=sq.find(x=>x.k===k);return p?ksur(p.name):'?';};
  const X=x=>mir?68-x:x,rt=mode==='ck'?E.ck[V164SP.side].rt:mode==='fw'?E.fk.wide.rt:null;
  const rr=(x,y,w,h)=>`<rect x="${mir?68-x-w:x}" y="${y}" width="${w}" height="${h}"/>`,zc={yakin:rr(13.84,0,20.16,7.5),uzak:rr(34,0,20.16,8.5),nokta:rr(13.84,7.5,40.32,9),ceza:rr(13.84,16.5,40.32,7.5)};
  const ball=mode==='ck'?`<circle cx="${X(.8)}" cy=".8" r="1.1" class="v164-b"/>`:mode==='fw'?`<circle cx="${X(9)}" cy="17" r="1.1" class="v164-b"/>`:mode==='th'?`<circle cx="${X(.3)}" cy="14" r="1.1" class="v164-b"/>`:'';
  let mk='';if(mode==='def'){const D=E.def,ps=[[30.6,.6],[37.4,.6]].slice(0,D.posts);mk=ps.map(([x,y])=>`<g class="v164-mk d" transform="translate(${X(x)} ${y})"><circle r="1.9"/><text y=".7">D</text></g>`).join('')+
    (D.sys==='adam'?[[30,5],[38,6],[34,11],[37,13]]:D.sys==='alan'?[[27,5.5],[31,5.5],[37,5.5],[41,5.5],[34,10]]:[[29,5.5],[34,5.5],[39,5.5],[36,11]]).map(([x,y],i)=>`<g class="v164-mk d" transform="translate(${X(x)} ${y})"><circle r="1.9"/><text y=".7">${i+1}</text></g>`).join('');}
  else mk=Object.entries(E.mk).map(([id,v],i)=>{const z=v164Zone(v.x,v.y);return `<g class="v164-mk${z===rt?' on':''}${z==='geri'?' bk':''}" data-v164mk="${id}" data-mir="${mir?1:0}" transform="translate(${X(v.x)} ${v.y})"><circle r="2.3"/><text y=".75">${i+1}</text><text class="nm" y="4.6">${esc(nm(AU[id]))}</text></g>`;}).join('');
  return `<svg class="v164-pitch" viewBox="-3 -3.5 74 42" role="img" aria-label="Duran top yerleşimi"><rect x="-3" y="-3.5" width="74" height="42" class="g"/>
   <g class="ln"><path d="M0 0H68"/><rect x="13.84" y="0" width="40.32" height="16.5"/><rect x="24.84" y="0" width="18.32" height="5.5"/><path d="M26.69 16.5A9.15 9.15 0 0 0 41.31 16.5"/><circle cx="34" cy="11" r=".35"/><rect x="30.34" y="-2" width="7.32" height="2" class="gl"/></g>
   ${rt&&zc[rt]?`<g class="zn">${zc[rt]}</g>`:''}${ball}${mk}</svg>`;}
function v164MkList(){const m=v164Init(),E=m.spe,AU=v164MkAuto(),xs=v164XI().filter(p=>p.pos!=='KL');
  return `<div class="v164-ml">${Object.entries(E.mk).map(([id,v],i)=>{const z=v164Zone(v.x,v.y),cur=v.k&&xs.some(p=>p.k===v.k)?v.k:'';const ap=xs.find(p=>p.k===AU[id]);
    return `<div><i class="${z==='geri'?'bk':''}">${i+1}</i><select data-chg="v164Mk" data-id="${id}" aria-label="İşaretçi ${i+1}"><option value="">Otomatik${ap?` (${esc(ap.name)})`:''}</option>${xs.map(p=>`<option value="${p.k}" ${cur===p.k?'selected':''}>${esc(p.name)} · Kafa ${v164At(p,'Kafa Vuruşu')}</option>`).join('')}</select><small>${V164ZN[z]}</small></div>`;}).join('')}</div>`;}
function v164SpQ(){const m=v164Init(),xs=v164XI(),g=(k,a)=>{const p=xs.find(x=>x.k===k);return p?v164At(p,a):null;},AU=k=>{const L=xs.filter(p=>p.pos!=='KL');let b=null,bv=-1;for(const p of L){const v=v164At(p,k);if(v>bv){bv=v;b=p;}}return bv;};
  const ck=g(m.sett&&m.sett.ck,'Korner')??AU('Korner'),fk=g(m.sett&&m.sett.fk,'Serbest Vuruş Kullanma')??AU('Serbest Vuruş Kullanma'),pen=g(m.sett&&m.sett.pen,'Penaltı Kullanma')??AU('Penaltı Kullanma');return {ck,fk,pen};}
function v164SpView(){const m=v164Init(),E=m.spe,T=V164SP.tab,Q=v164SpQ(),st=m.v164st&&m.v164st.y===G.s.year?m.v164st:{f:0,a:0};
  const chips=(obj,cur,act,extra)=>`<div class="filt">${Object.entries(obj).map(([k,l])=>`<button class="chip" data-act="${act}" data-k="${k}"${extra||''} aria-pressed="${cur===k}">${Array.isArray(l)?l[0]:l}</button>`).join('')}</div>`;
  const tabs=[['ck','Korner'],['fk','Serbest vuruş'],['pen','Penaltı'],['th','Taç'],['def','Savunma']];
  let body='';
  if(T==='ck'){const s=V164SP.side,C=E.ck[s];body=`<div class="filt">${[['L','Sol korner'],['R','Sağ korner']].map(([k,l])=>`<button class="chip" data-act="v164Side" data-k="${k}" aria-pressed="${s===k}">${l}</button>`).join('')}</div>
    <div class="sp-row"><span>Kullanan</span>${v164TkSel('ck'+s)}</div><p class="sub-h" style="margin:8px 0 4px"><span>Rutin</span></p>${chips(V164CK,C.rt,'v164Rt',' data-f="ck"')}
    <div class="v164-pw2">${v164Pitch('ck')}${v164MkList()}</div><p class="muted">İşaretçileri sürükleyerek yerleştir: bulunduğu bölge oyuncunun görevini belirler (yakın direk, uzak direk, penaltı noktası, ceza yayı, geride kal). Rutinin hedef bölgesi sarı gösterilir; orada iyi bir kafacı olmalı.</p>`;}
  else if(T==='fk'){body=`<p class="sub-h" style="margin:0 0 4px"><span>Doğrudan (kaleye yakın, merkez)</span></p><div class="sp-row"><span>Kullanan</span>${v164TkSel('fkd')}</div>${chips(V164FD,E.fk.dir.rt,'v164Rt',' data-f="fkd"')}
    <p class="sub-h" style="margin:12px 0 4px"><span>Kanat / dolaylı serbest vuruş</span></p><div class="sp-row"><span>Kullanan</span>${v164TkSel('fkw')}</div>${chips(V164FW,E.fk.wide.rt,'v164Rt',' data-f="fkw"')}
    <div class="v164-pw2">${v164Pitch('fw')}${v164MkList()}</div><p class="muted">Ceza sahası köşesine yakın serbest vuruşlarda ortayı korner düzenindeki koşucular karşılar.</p>`;}
  else if(T==='pen')body=`<div class="sp-row"><span>Penaltıcı</span>${v164TkSel('pen')}</div><div class="sp-row"><span>Yedek penaltıcı</span>${v164TkSel('pen2')}</div><p class="muted">Penaltıcı sahada değilse yedek kullanır. Penaltı Kullanma ve Soğukkanlılık belirleyicidir; duran top antrenmanı küçük katkı yapar.</p>`;
  else if(T==='th')body=`<div class="sp-row"><span>Uzun taççı</span>${v164TkSel('th')}</div>${chips(V164TH,E.th.rt,'v164Rt',' data-f="th"')}<div class="v164-pw2">${v164Pitch('th')}${v164MkList()}</div><p class="muted">Rakip yarı sahanın son bölümündeki taçlarda uzun taç, korner gibi ceza sahasına iner. Uzun Taç özelliği 13’ün altındaysa kısa oynanır.</p>`;
  else body=`<p class="sub-h" style="margin:0 0 4px"><span>Korner savunması</span></p>${chips(V164DS,E.def.sys,'v164Def')}<p class="muted" style="margin:4px 0 8px">${esc(V164DS[E.def.sys][1])}</p>
    <p class="sub-h" style="margin:0 0 4px"><span>Direklerde oyuncu</span></p><div class="filt">${[0,1,2].map(n=>`<button class="chip" data-act="v164Post" data-k="${n}" aria-pressed="${E.def.posts===n}">${n===0?'Yok':n+' direk'}</button>`).join('')}</div>
    <div class="v164-pw2">${v164Pitch('def')}</div><p class="muted">Direkteki oyuncu kafa vuruşlarının bir kısmını çizgiden çıkarır ama markaj yapacak kişi azalır.</p>`;
  return `<h2 class="h">Duran toplar</h2><section class="panel"><div class="v164-sq"><div><b>${Q.ck}</b><span>Korner</span></div><div><b>${Q.fk}</b><span>Frikik</span></div><div><b>${Q.pen}</b><span>Penaltı</span></div><div><b>${dec(m.sp,1)}</b><span>Antrenman /10</span></div><div><b>${st.f}–${st.a}</b><span>Bu sezon gol</span></div></div>
   <p class="muted" style="margin:6px 0 0">Duran top golleri vuruşçunun kalitesine, rutinin rakibin savunma düzenine uygunluğuna ve haftalık duran top çalışmasına bağlıdır.</p></section>
   <section class="panel v164sp"><div class="filt v164-tb">${tabs.map(([k,l])=>`<button class="chip" data-act="v164Tab" data-k="${k}" aria-pressed="${T===k}">${l}</button>`).join('')}</div>${body}</section>
   <button class="btn" data-act="tab" data-tab="train">Antrenman takvimine dön</button>`;}
XV.setp=()=>{try{if(v164mgr())return v164SpView();}catch(e){console.warn('v164 duran top',e);}return '';};
ACTX.v164Tab=el=>{V164SP.tab=el.dataset.k;render();};
ACTX.v164Side=el=>{V164SP.side=el.dataset.k;render();};
ACTX.v164Rt=el=>{const E=v164Init().spe,f=el.dataset.f,k=el.dataset.k;if(f==='ck')E.ck[V164SP.side].rt=k;else if(f==='fkd')E.fk.dir.rt=k;else if(f==='fkw')E.fk.wide.rt=k;else if(f==='th')E.th.rt=k;save();render();};
ACTX.v164Def=el=>{v164Init().spe.def.sys=el.dataset.k;save();render();};
ACTX.v164Post=el=>{v164Init().spe.def.posts=+el.dataset.k;save();render();};
/* işaretçi sürükleme (fare + dokunmatik) */
let V164DR=null;
function v164SvgPt(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());}
document.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('[data-v164mk]');if(!g)return;const svg=g.ownerSVGElement;if(!svg)return;V164DR={g,svg,id:g.dataset.v164mk,mir:g.dataset.mir==='1',x:null,y:null};try{svg.setPointerCapture(e.pointerId);}catch(err){}e.preventDefault();});
document.addEventListener('pointermove',e=>{if(!V164DR)return;const p=v164SvgPt(V164DR.svg,e),x=clamp(p.x,.5,67.5),y=clamp(p.y,.5,37.5);V164DR.x=x;V164DR.y=y;V164DR.g.setAttribute('transform',`translate(${x} ${y})`);e.preventDefault();},{passive:false});
document.addEventListener('pointerup',()=>{const D=V164DR;V164DR=null;if(!D||D.x==null)return;try{const M=v164Init().spe.mk[D.id];M.x=Math.round((D.mir?68-D.x:D.x)*10)/10;M.y=Math.round(D.y*10)/10;save();render();}catch(err){console.warn(err);}});
XICON.setp=NI('<path d="M6 21V4"/><path d="M6 4h11l-2 4 2 4H6"/><circle cx="17" cy="19" r="2"/>');NICON.setp=XICON.setp;
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.mode==='mgr'&&G.phase!=='tryout'&&L.some(x=>x[0]==='train')&&!L.some(x=>x[0]==='setp'))L.push(['setp','Duran toplar']);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(xtabs().some(x=>x[0]==='setp')){const c=C.find(x=>x[1].some(y=>y[0]==='train'));if(c&&!c[1].some(y=>y[0]==='setp')){const i=c[1].findIndex(y=>y[0]==='prep');c[1].splice(i>=0?i+1:c[1].length,0,['setp','Duran toplar',{tab:'setp'}]);}}}catch(e){}return C;})(navCats);
viewPrep=(old=>function(){let h=old.apply(this,arguments);try{if(v164mgr())h=h.replace(/(<span>Duran top görevlileri<\/span>)/,'$1<button class="btn sm" data-act="tab" data-tab="setp">Editör</button>');}catch(e){}return h;})(viewPrep);
if(XV.prep)XV.prep=()=>viewPrep();

/* ================= maç motoru: duran top rutinleri (klasik 2B motor FX) ================= */
/* Kullanıcı takımı: G.m.spe (rutin, işaretçiler, savunma), vuruşçular (m.sett), duran top antrenmanı (m.sp). Rakip: maç başında rastgele bir düzen.
   Etkiler orta düzeydedir; korner kafalarının ek gol beklentisi fxFF (skor dengeleyici) hesabına katılmaz, böylece etkisi emilmez. */
function v164UserT(T){return !!(FX&&T===FX.U&&G&&G.mode==='mgr'&&G.m&&G.m.spe&&!FX.pl3);}
function v164Cfg(T){if(v164UserT(T)){const m=G.m;return {u:1,E:m.spe,tr:clamp(((m.sp||0)-3)/7,-.45,1)};}
  if(!T.__v164){const r=Math.random();T.__v164={u:0,tr:0,E:{ck:{L:{rt:'karisik'},R:{rt:'karisik'}},fk:{dir:{rt:'sut'},wide:{rt:'karisik'}},th:{rt:'kisa'},def:{sys:r<.34?'alan':r<.67?'adam':'karma',posts:Math.random()<.55?1:Math.random()<.5?2:0}}};}return T.__v164;}
const V164MU={alan:{yakin:-5,uzak:4,nokta:-2,ceza:3},adam:{yakin:4,uzak:-3,nokta:1,ceza:-2},karma:{yakin:0,uzak:0,nokta:-1,ceza:0}};
const v164Air=q=>fxAirA(q)+q.a.ph*.3+q.a.sh*.1;
fxTaker=(old=>function(T,kind){try{if(v164UserT(T)){const on=fxOn(T).filter(q=>q.spos!=='KL'),E=G.m.spe,S=G.m.sett||{};const f=k=>k&&on.find(q=>q.k===k);
    if(kind==='co')kind='ck';
    if(kind==='pen'){const p=f(S.pen)||f(E.pen&&E.pen.alt);if(p)return p;}}}catch(e){}return old.call(this,T,kind==='co'?'ck':kind);})(fxTaker);
function v164Tag(T,k){if(FX)FX.spTag={side:T.side,pt:FX.pt||0,k};}
fxCorner=(old=>function(T){const r=old.apply(this,arguments);try{const S=FX,B=S.ball,c=B.own;if(!c)return r;const side=fxV(T,B.y)<34?'L':'R',C=v164Cfg(T);
    if(C.u){const want=side==='L'?(G.m.sett||{}).ck:C.E.ck.R.tk,p=want&&fxOn(T).find(q=>q.k===want&&q.spos!=='KL');if(p&&p!==c){c.cornerTake=0;B_set(p,B.x,B.y);}
      const AU=(()=>{try{return v164MkAuto();}catch(e){return {};}})();for(const id in C.E.mk){const M=C.E.mk[id],k=M.k||AU[id],q=k&&fxOn(T).find(x=>x.k===k);if(!q||q===B.own)continue;const vx=side==='L'?M.x:68-M.x;q.x=fxX(T,FXL-M.y);q.y=fxY(T,vx);q.v164z=v164Zone(M.x,M.y);}}
    S.spCur={k:'co',c:B.own,side,pt:S.pt||0};v164Tag(T,'co');}catch(e){console.warn('v164 korner',e);}return r;})(fxCorner);
/* korner / kanat frikiği / uzun taç: rutine göre orta */
function v164Cross(c,kind){const S=FX,T=c.T,O=fxOpp(T),C=v164Cfg(T),D=v164Cfg(O).E.def,st=S.stats[T.side],cv=fxV(T,c.y),near=cv<34?-1:1;
  let rt=kind==='co'?(C.E.ck[S.spCur&&S.spCur.side||'L']||{}).rt:kind==='fw'||kind==='fd'?(kind==='fd'?'nokta':C.E.fk.wide.rt):'nokta';if(!C.u&&kind==='co'&&Math.random()<.1)rt='kisa';
  if(!rt||rt==='karisik')rt=pick(['yakin','uzak','nokta','nokta']);
  const K=kind==='th'?fxF(c,'Uzun Taç'):kind==='co'?fxF(c,'Korner'):(fxF(c,'Korner')+fxF(c,'Serbest Vuruş Kullanma'))/2,mates=fxOn(T).filter(q=>q!==c&&q.spos!=='KL'),mu=(V164MU[D.sys]||V164MU.karma)[rt]||0;
  if(rt==='kisa'){const q=mates.sort((a,b)=>fxD(a,c)-fxD(b,c))[0];if(q){q.x=fxX(T,FXL-6);q.y=fxY(T,clamp(cv-near*7,2,FXW-2));fxPass(c,q,.95,false);return;}}
  if(rt==='ceza'){const L=mates.filter(q=>q.v164z==='ceza');const q=(L.length?L:mates).slice().sort((a,b)=>(fxF(b,'Uzaktan Şut')+b.a.sh/10)-(fxF(a,'Uzaktan Şut')+a.a.sh/10))[0];
    if(q){q.x=fxX(T,FXL-17.5);q.y=fxY(T,34-near*3);q.spEdge=(S.pt||0)+5;fxPass(c,q,clamp(.8+mu*.02+(K-12)*.01,.5,.95),false);return;}}
  const tu=rt==='yakin'?FXL-4.5:rt==='uzak'?FXL-6:FXL-11,tv=rt==='yakin'?34+near*3:rt==='uzak'?34-near*4.5:34,tx=fxX(T,tu+(Math.random()-.5)*2),ty=fxY(T,tv+(Math.random()-.5)*2.5);
  const zoneL=C.u?mates.filter(q=>q.v164z===rt):[];const pool=(zoneL.length?zoneL:mates.filter(q=>FXL-fxU(T,q.x)<22)).slice().sort((a,b)=>v164Air(b)-v164Air(a));const att=pool[0]||mates[0];
  const defs=fxOn(O).filter(q=>q.spos!=='KL');let def;
  if(D.sys==='adam'||(D.sys==='karma'&&Math.random()<.5)){const ra=mates.slice().sort((a,b)=>v164Air(b)-v164Air(a)),rd=defs.slice().sort((a,b)=>fxAirD(b)-fxAirD(a));const i=Math.max(0,ra.indexOf(att));def=rd[Math.min(rd.length-1,i+(D.posts||0))];}
  else def=defs.sort((a,b)=>Math.hypot(a.x-tx,a.y-ty)-Math.hypot(b.x-tx,b.y-ty))[0];
  if(att){att.x=tx+(Math.random()-.5)*2;att.y=ty+(Math.random()-.5)*2;att.tx=tx;att.ty=ty;}
  st.pa++;c.s.pa++;
  const aw=att?att.a.ph*.3+att.a.sh*.1+fxAirA(att)+Math.random()*30+(K-12)*.7+mu*.8+C.tr*4+(D.posts||0)*1.2:0,dw=def?def.a.ph*.22+def.a.df*.18+fxAirD(def)+Math.random()*30+6:0;
  const ok=att&&Math.random()<clamp(.55+(c.a.pa-65)*.004+(K-12)*.016+C.tr*.03,.2,.88),win=ok&&aw>dw,L=Math.hypot(tx-c.x,ty-c.y);
  S.spH=win?{side:T.side,pt:S.pt||0,f:clamp(1+(K-12)*.015+C.tr*.1+mu*.015-(D.posts||0)*.04,.7,1.35)}:null;
  S.ball.own=null;S.ball.fl={from:c,to:win?att:null,tx,ty,t:0,T:L/20,x0:c.x,y0:c.y,lift:1,kind:'cr',hdr:win,loose:!win,def};S.trail.push({x0:c.x,y0:c.y,x1:tx,y1:ty,t:1,c:T.side});}
fxCross=(old=>function(c){try{const S=FX;if(S&&S.spCur&&S.spCur.c===c){const k=S.spCur.k;S.spCur=null;if(!S.v164off)return v164Cross(c,k);}}catch(e){console.warn('v164 orta',e);}return old.apply(this,arguments);})(fxCross);
fxHeader=(old=>function(a,xg,from){const S=FX,H=S&&S.spH;if(!H||H.side!==a.T.side||(S.pt||0)-H.pt>5)return old.apply(this,arguments);S.spH=null;const st=S.stats[a.T.side],x0=st.xgA||0;
  const r=old.call(this,a,xg*H.f,from);try{st.xgA=x0+xg*.5;}catch(e){}return r;})(fxHeader);
fxDecide=(old=>function(c){try{const S=FX;if(S){
    if(c.spEdge&&c.spEdge>(S.pt||0)){c.spEdge=0;v164Tag(c.T,'co');return fxShoot(c,fxPressure(c));}
    if(c.cornerTake&&(!S.spCur||S.spCur.c!==c))S.spCur={k:'co',c,side:fxV(c.T,c.y)<34?'L':'R',pt:S.pt||0};
    if(c.fkT){v164Tag(c.T,"fk");if(v164UserT(c.T)&&!S.v164off){const rt=G.m.spe.fk.dir.rt;if(rt==='sut'){c.fkT=0;return fxShoot(c,9,'fk');}if(rt==='orta'){c.fkT=0;S.spCur={k:'fd',c,pt:S.pt||0};return fxCross(c);}if(rt==='kisa'){c.fkT=0;}}}}}catch(e){console.warn('v164 karar',e);}
  return old.apply(this,arguments);})(fxDecide);
/* kanat frikiği ve uzun taç: ceza sahasına orta */
function v164SetWide(T,kind){const S=FX,B=S.ball,C=v164Cfg(T);if(S.v164off)return;const on=fxOn(T).filter(q=>q.spos!=='KL');let tk=null;
  if(kind==='fw'){if(C.u){const k=C.E.fk.wide.tk;tk=k&&on.find(q=>q.k===k);}else if(Math.random()>.5)return;tk=tk||on.slice().sort((a,b)=>fxF(b,'Korner')-fxF(a,'Korner'))[0];}
  else{if(C.u){if(C.E.th.rt!=='uzun')return;const k=C.E.th.tk;tk=k&&on.find(q=>q.k===k);}tk=tk||on.slice().sort((a,b)=>fxF(b,'Uzun Taç')-fxF(a,'Uzun Taç'))[0];if(!tk||fxF(tk,'Uzun Taç')<(C.u?13:16)||(!C.u&&Math.random()<.5))return;}
  if(!tk)return;const x=B.x,y=B.y;if(B.own&&B.own!==tk)B.own.cornerTake=0;B_set(tk,x,y);FX.setT=kind==='th'?1.2:1.3;S.spCur={k:kind,c:tk,pt:S.pt||0};v164Tag(T,kind);}
fxSet=(old=>function(T,x,y,kind){const r=old.apply(this,arguments);try{if(kind==='th'&&FX&&fxU(T,x)>74)v164SetWide(T,'th');}catch(e){}return r;})(fxSet);
fxFoul=(old=>function(d,c){const r=old.apply(this,arguments);try{const S=FX,T=c.T,B=S.ball;if(S.setK==='fk'&&B.own&&B.own.T===T&&!B.own.fkT&&!B.own.penT){const u=fxU(T,B.x),v=fxV(T,B.y);if(FXL-u<36&&FXL-u>=8&&Math.abs(v-34)>=14)v164SetWide(T,'fw');}}catch(e){}return r;})(fxFoul);
/* penaltı ve frikik şutu: duran top antrenmanı küçük katkı */
fxShQ=(old=>function(c,pr,setK){let q=old.apply(this,arguments);try{if(setK&&c&&c.T){const C=v164Cfg(c.T);if(setK==='fk')q+=C.tr*.12;else if(setK==='pen')q+=C.tr*.05;}}catch(e){}return q;})(fxShQ);
fxShoot=(old=>function(c,pr,setK){try{if(setK&&c&&c.T)v164Tag(c.T,setK);}catch(e){}return old.apply(this,arguments);})(fxShoot);
/* duran top gollerini say */
fxShotEnd=(old=>function(f){const S=FX;let tag=null;try{const c=f&&f.from;if(f.res==='g'&&c&&S.spTag&&S.spTag.side===c.T.side&&(S.pt||0)-S.spTag.pt<8)tag=S.spTag.k;}catch(e){}
  const r=old.apply(this,arguments);if(tag){try{const side=f.from.T.side;S.spg=S.spg||[{},{}];S.spg[side][tag]=(S.spg[side][tag]||0)+1;S.spTag=null;
    const L={co:'korner',fk:'serbest vuruş',pen:'penaltı',th:'uzun taç',fw:'serbest vuruş',fd:'serbest vuruş'}[tag];if(S.ev[0]&&/GOL!/.test(S.ev[0].t)&&tag!=='pen')S.ev[0].t+=` (${L} sonrası)`;
    if(G&&G.mode==='mgr'&&G.m&&!S.pl3&&!S.v164test){const m=G.m,y=G.s.year;if(!m.v164st||m.v164st.y!==y)m.v164st={y,f:0,a:0};if(side===0)m.v164st.f++;else m.v164st.a++;}}catch(e){}}return r;})(fxShotEnd);
/* Adoball motoru: kullanıcının korner rutini (yakın/uzak/nokta/kısa) motora iletilir; motor aynı sayıda rastgele sayı tüketir, belirlenimcilik bozulmaz */
if(typeof abSetup==='function')abSetup=(old=>function(S){try{const W=ABM.win;if(W){const usE=S.o&&(S.o.usHome||S.o.neutral)?0:1,sides=usE===0?[S.U,S.O]:[S.O,S.U];
    W.__abSpr=sides.map(T=>{if(!v164UserT(T))return null;const rt=(G.m.spe.ck.L||{}).rt,C=v164Cfg(T);return {cor:{yakin:'near',uzak:'far',nokta:'spot',kisa:'short',ceza:'spot'}[rt]||null,w:clamp(.55+C.tr*.2,.35,.8)};});}}catch(e){console.warn('v164 adoball',e);}
  return old.apply(this,arguments);})(abSetup);
