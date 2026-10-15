/* ================= v174: oyuncu profili › Sözleşme sekmesi — Football Manager tarzı sözleşme kartı =================
   Kartta görünen her değer oyunun gerçekten kullandığı veriden gelir:
   - Kendi oyuncumuz (TD / SD / başkan): G.m.ct[k] — w (haftalık €), end (30 Haziran yılı), role (0-3 / 0.5), rc (serbest kalma €),
     ab/gb (maç/gol primi: v41 bonusWeek → haftalık maaşın %12 / %25'i), raise, relc (v41 mgrNewSeason), tb, sad, opt, pt, sellp, y0, ptN/ptW (v172 soz72);
     kiralık aldıklarımız G.m.loans[k] (from, y, opt, mand), kiralık verdiklerimiz G.m.lout[k], eski kulübün satış payı G.m.sellOn[k],
     bu sezon ödenen primler G.m.bonP[k]. Maddesi olmayan (devralınan) sözleşmede maaş pWage ile "tahmini" gösterilir.
   - Futbolcu (kendi sözleşmen): G.contract (wage iç birim/hf, years, role) + cl (v172 maddeleri), G.loan, G.next, G.tl.
   - Diğer kulüplerin oyuncuları: maaş pWage (tahmini), bitiş ctEnd; maddeleri oyunda tutulmadığı için "bilinmiyor".
     TD için kulübün istediği bedel askPrice (042'deki aralık), kulübümüzün satış payı G.m.sellRev[k], serbest oyuncu listesi G.m.fa.
   Bu sürümden sonra imzalanan sözleşmelerde imza parası, menajer ücreti, başlangıç sezonu ve kiralık maaş katkısı da kaydedilir
   (ct.bon, ct.ag, ct.s0, loans[k].wp/fee; G.contract.bon/s0). Eski kayıtlarda bu satırlar "kayıtlı değil" yazar. */

/* ---------- yeni imzalarda eksik kalan bilgileri kaydet (eski kayıtlar: alan yok → "kayıtlı değil") ---------- */
function sz74Mark(fn){return function(){const m=G&&G.m,ref=m&&m.ct?Object.assign({},m.ct):{};const r=fn.apply(this,arguments);
  try{const M=G&&G.m;if(M&&M.ct&&G.s)for(const k of Object.keys(M.ct)){const ct=M.ct[k];if(ct&&ct!==ref[k]&&ct.s0==null)ct.s0=G.s.year;}}catch(e){console.warn('v174 imza',e);}return r;};}
negDone=(old=>function(){const m=G.m,n=m&&m.neg,k=n&&n.k,c=n&&n.c?Object.assign({},n.c):null,o=n&&n.o?Object.assign({},n.o):null,ty=n&&n.type;const r=old.apply(this,arguments);
  try{const ct=m&&m.ct&&m.ct[k];if(ct&&c&&n.st==='done'){ct.s0=G.s.year;ct.bon=Math.max(0,+c.bon||0);ct.ag=Math.max(0,+c.ag||0);
      if(ty==='loan'&&m.loans&&m.loans[k]&&o){m.loans[k].wp=+o.wp||0;m.loans[k].fee=Math.max(0,+o.fee||0);}}}catch(e){console.warn('v174 negDone',e);}return r;})(negDone);
try{if(typeof V155_DEC==='object'&&V155_DEC.renew)V155_DEC.renew=(old=>function(ev,k){const r=old.apply(this,arguments);try{if(k==='imza'){const ct=G.m&&G.m.ct&&G.m.ct[ev.pk];if(ct){ct.s0=G.s.year;ct.bon=Math.max(0,Math.round((+ev.bon||0)/EUR_TL));}}}catch(e){}return r;})(V155_DEC.renew);}catch(e){}
try{youthIntake=sz74Mark(youthIntake);}catch(e){}
try{optUse=sz74Mark(optUse);}catch(e){}
try{if(ACTX.acadUpP)ACTX.acadUpP=sz74Mark(ACTX.acadUpP);}catch(e){}
try{if(ACTX.ddDo)ACTX.ddDo=sz74Mark(ACTX.ddDo);}catch(e){}
/* zorunlu satın alma: kiralık sözleşme kalıcı olur → yeni başlangıç */
loansEnd=(old=>function(){const m=G.m,mand=m&&m.loans?Object.keys(m.loans).filter(k=>m.loans[k].mand):[];const r=old.apply(this,arguments);
  try{for(const k of mand){const ct=m.ct&&m.ct[k];if(ct&&!(m.loans&&m.loans[k])&&(!G.tx||G.tx[k]===G.club))ct.s0=G.s.year+1;}}catch(e){}return r;})(loansEnd);
/* futbolcu: imza parası ve başlangıç sezonu */
acceptOffer=(old=>function(o){const r=old.apply(this,arguments);try{if(o&&isPl()&&o.status==='accepted'){let t=null;
    if(o.loan)t=G.next&&G.next.club===o.club&&G.next.loan?G.next.contract:(G.club===o.club?G.contract:null);
    else if(o.renew)t=G.contract;else if(G.next&&G.next.club===o.club)t=G.next.contract;else if(G.club===o.club)t=G.contract;
    if(t&&t.s0==null){t.s0=G.phase==='season'?G.s.year:G.s.year+1;t.bon=Math.max(0,+o.bonus||0);}}}catch(e){console.warn('v174 kabul',e);}return r;})(acceptOffer);

/* ---------- yardımcılar ---------- */
const SZ74_AY=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function sz74Days(endY){try{return Math.round((Date.UTC(endY,5,30)-today().getTime())/DAY_MS);}catch(e){return null;}}
function sz74Left(d){if(d==null)return '';if(d<0)return 'Sona erdi';const mo=Math.floor(d/30.44);if(mo>=12){const y=Math.floor(mo/12),a=mo%12;return `${y} yıl${a?` ${a} ay`:''}`;}return mo>=1?`${mo} ay`:`${Math.max(0,d)} gün`;}
const sz74EndTxt=y=>`30 Haziran ${y}`;
const sz74Un='<span class="sz74-unk">Bilinmiyor</span>';
const sz74No='<span class="sz74-no">Yok</span>';
const sz74Nr='<span class="sz74-unk">Kayıtlı değil</span>';
function sz74Row(l,v,s,cls){return `<div class="sz74-r${cls?' '+cls:''}"><span>${l}</span><b>${v}${s?`<small>${s}</small>`:''}</b></div>`;}
function sz74Box(t,rows,ic){if(!rows)return '';return `<section class="sz74-box"><p class="sz74-bh">${ic?`<i>${ic}</i>`:''}${t}</p>${rows}</section>`;}
/* maaş: seçili dönem önde, üç dönem şeridi (Ayarlar › Maaş gösterimi) */
function sz74Wage(we,est,lid){we=+we||0;const k=wgPer();const strip=we>0?`<div class="sz74-wp">${['hf','ay','yil'].map(x=>`<span class="${x===k?'on':''}"><em>${WGP[x][0]}</em>${amtFmt(wgPerAmt(we,x))}</span>`).join('')}</div>`:'';
  return `<div class="sz74-wage"><b>${wgH(we)}${est?wgEstTag(lid):''}</b>${strip}</div>`;}
function sz74Bar(s0,endY){if(s0==null||endY==null)return '';try{const a=Date.UTC(s0,6,1),b=Date.UTC(endY,5,30),n=today().getTime();if(b<=a)return '';const f=clamp((n-a)/(b-a),0,1);return `<div class="sz74-bar" title="Sözleşmenin %${Math.round(f*100)}’i geride kaldı"><i style="width:${(f*100).toFixed(1)}%"></i></div>`;}catch(e){return '';}}
function sz74Warn(L){return L.length?`<div class="sz74-warns">${L.map(([c,t])=>`<p class="sz74-w ${c}">${t}</p>`).join('')}</div>`:'';}
function sz74Join(p,cid){try{const C=careerOf(p),T=(C.tx||[]).filter(e=>e.to===cid);const e=T[T.length-1];return e?{y:e.y,loan:!!e.loan}:null;}catch(e){return null;}}
function sz74Head(c,title,sub,pill){return `<header class="sz74-hd"><span class="sz74-cr">${c?crestSVG(c,40):''}</span><div><span class="kicker">${title}</span><h3>${c?esc(c.name):'—'}</h3><small>${sub}</small></div>${pill||''}</header>`;}
const sz74Pill=(t,cls)=>`<span class="sz74-pill ${cls||''}">${t}</span>`;

/* ---------- veri modeli: profildeki oyuncu ---------- */
function sz74Data(p,c){const D={k:p.k,c,mode:G.mode||'player'};const m=G.mode==='mgr'?G.m:null,Y=G.s?G.s.year:2026;
  const lout=m&&m.lout&&m.lout[p.k],own=!!(m&&G.club&&(c.id===G.club||(lout&&lout.to===c.id))&&(c.id!==G.club||squadOf(G.club).some(x=>x.k===p.k)));
  D.kind=own?'own':'other';D.lout=own&&lout?lout:null;const cid=own?G.club:c.id;D.cid=cid;
  D.ct=own&&m.ct?m.ct[p.k]||null:null;D.loanIn=own&&m.loans?m.loans[p.k]||null:null;
  D.w=pWage(p,cid);D.est=wgIsEst(p,cid);D.end=ctEnd(p);D.days=sz74Days(D.end);D.R=(squadRoles(c.id)||{})[p.k]||null;
  D.s0=D.ct?(D.ct.s0!=null?D.ct.s0:D.ct.y0!=null?D.ct.y0:null):null;D.join=sz74Join(p,cid);D.Y=Y;
  if(D.ct&&D.ct.pt&&(D.ct.role||0)>=1){const need=D.ct.role>=3?0.6:D.ct.role>=2?0.45:0.25,played=Math.max(0,((G.s&&G.s.week)||1)-1);let st=0;try{st=(clubSeasonEst(G.club)[p.k]||{}).st||0;}catch(e){}D.pt={need,played,st,n:D.ct.ptN||0};}
  if(D.ct&&(D.ct.ab||D.ct.gb)&&m.bonP&&m.bonP[p.k]&&m.bonP[p.k].y===Y){const b=m.bonP[p.k];D.bonPaid=(D.ct.ab?b.ap*Math.round(D.ct.w*0.12):0)+(D.ct.gb?b.g*Math.round(D.ct.w*0.25):0);}
  if(m&&!own&&G.mode==='mgr'){try{const A=askPrice(p,c.id);D.ask=A;}catch(e){}}
  D.sellRev=m&&m.sellRev&&m.sellRev[p.k]||null;D.sellOn=own&&m.sellOn&&m.sellOn[p.k]||null;
  D.fa=!!(m&&!own&&(m.faY===Y+1||m.faY===Y)&&(m.fa||[]).includes(p.k));
  D.neg=m&&m.neg&&m.neg.k===p.k&&m.neg.d&&m.neg.st!=='fail'?m.neg:null;D.negCd=m&&m.negCd&&m.negCd[p.k]>((G.s&&G.s.day)||0)?m.negCd[p.k]-G.s.day:0;
  return D;}

/* ---------- kart: kendi oyuncumuz / diğer kulüplerin oyuncuları ---------- */
function sz74HTML(p,c){const D=sz74Data(p,c),ct=D.ct,L=D.loanIn,Y=D.Y,w=D.w,warn=[],td=typeof isTD==='function'&&isTD();
  const expiring=D.end<=Y+1,roleSt=ct&&ct.role!=null?roleName(ct.role):null;
  /* başlık */
  let pill='';if(D.lout)pill=sz74Pill('Kiralıkta','ln');else if(L)pill=sz74Pill('Kiralık','ln');else if(D.fa)pill=sz74Pill('Serbest','fr');else if(expiring)pill=sz74Pill('Son yıl','ex');else if(D.days!=null&&D.days<=548)pill=sz74Pill('Bitiyor','wa');
  const kick=D.kind==='own'?(L?'Kiralık sözleşme':'Sözleşme · kulübümüz'):'Sözleşme';
  const hc=D.lout?CLUBS[G.club]:c;
  const head=sz74Head(hc,kick,`${esc(D.R||roleSt||'Kadro oyuncusu')} · ${sz74EndTxt(D.end)} tarihine kadar`,pill);
  /* genel */
  const startTxt=D.s0!=null?seasonLabel(D.s0):D.kind==='own'&&ct?sz74Nr:sz74Un;
  let gen=sz74Row('Kulüp',`${esc((D.lout?CLUBS[G.club]:c).name)}`,D.lout?`Şu an kiralık: ${esc(CLUBS[D.lout.to]?CLUBS[D.lout.to].name:'')}`:'')+
    sz74Row('Takımdaki rolü',esc(D.R||'—'),'kadro hiyerarşisi')+
    (D.kind==='own'?sz74Row('Sözleşmedeki rol',roleSt?esc(roleSt):(ct?sz74Nr:sz74Un),ct&&ct.pt&&(ct.role||0)>=1?'rol garantili':ct?'garanti maddesi yok':'devralınan sözleşme'):'')+
    sz74Row('Başlangıç',startTxt,D.join?`Kulübe katılış: ${seasonLabel(D.join.y)}${D.join.loan?' (kiralık)':''}`:'')+
    sz74Row('Bitiş',sz74EndTxt(D.end),D.est&&D.kind!=='own'?'oyunun bu oyuncu için tuttuğu bitiş yılı':'')+
    sz74Row('Kalan süre',sz74Left(D.days),D.days!=null&&D.days>=0?`${Math.max(0,D.days)} gün`:'');
  if(D.pt){const pc=D.pt.played?Math.round(D.pt.st/D.pt.played*100):0;gen+=sz74Row('Oynama süresi garantisi',`İlk 11’de en az %${Math.round(D.pt.need*100)}`,D.pt.played>=8?`Bu sezon: ${D.pt.st}/${D.pt.played} maç (%${pc})`:`8. haftadan sonra izlenir · şu an ${D.pt.st}/${D.pt.played}`);}
  /* maaş ve ödemeler */
  let pay='';
  if(D.lout)pay=sz74Row('Sözleşme maaşı',sz74Wage(w,D.est,myClub().league),'kiralık süresince maaşını kiralayan kulüp öder');
  else pay=sz74Row(L?'Ödediğimiz maaş':'Maaş',sz74Wage(w,D.est,(CLUBS[D.cid]||{}).league),D.est?(D.kind==='own'?'devralınan sözleşme; tutar kulüp maaş ölçeğinden tahmin':'kulüp maaş ölçeğinden tahmin'):'');
  if(D.kind==='own'&&ct){pay+=sz74Row('İmza parası',ct.bon!=null?(ct.bon?eur(ct.bon):sz74No):sz74Nr,ct.bon!=null?(ct.bon?'imzada ödendi':''):'bu sürümden önce imzalandı')+(ct.ag!=null&&ct.ag?sz74Row('Menajer ücreti',eur(ct.ag),'imzada ödendi'):'');}
  else if(D.kind==='own')pay+=sz74Row('İmza parası',sz74Nr,'devralınan sözleşme');
  /* primler */
  let bon='';
  if(D.kind==='own'&&ct){
    bon=sz74Row('Maç primi',ct.ab?`${eur(Math.round(ct.w*0.12))} / maç`:sz74No,ct.ab?'haftalık maaşın %12’si · her pazar ödenir':'')+
      sz74Row('Gol primi',ct.gb?`${eur(Math.round(ct.w*0.25))} / gol`:sz74No,ct.gb?'haftalık maaşın %25’i':'')+
      sz74Row('Şampiyonluk primi',ct.tb?`${eur(ct.tb*ct.w)} / kupa`:sz74No,ct.tb?`${ct.tb} haftalık maaş · sezon sonu`:'')+
      sz74Row('Sadakat primi',ct.sad?`${eur(ct.sad*ct.w)} / sezon`:sz74No,ct.sad?`${ct.sad} haftalık maaş · her yeni sezon başında`:'')+
      (D.bonPaid!=null?sz74Row('Bu sezon ödenen primler',eur(D.bonPaid),'maç ve gol primleri'):'');}
  else if(D.kind==='own')bon=sz74Row('Primler',sz74No,'devralınan sözleşmede prim maddesi yok');
  else bon=sz74Row('Maç / gol / şampiyonluk primi',sz74Un,'kulübün iç bilgisi');
  /* maddeler */
  let cl='';
  if(D.kind==='own'&&ct){
    cl=sz74Row('Serbest kalma bedeli',ct.rc?eur(ct.rc):sz74No,ct.rc?'bedeli ödeyen her kulübe geçerli (yurt içi / yurt dışı ayrımı yok) · transfer dönemlerinde; bedeli yatıran kulüp oyuncuyu pazarlıksız alır':'')+
      sz74Row('Yıllık maaş artışı',ct.raise?`+%${ct.raise} / sezon`:sz74No,ct.raise?`gelecek sezon ${wgT(Math.round(ct.w*(1+ct.raise/100)))}`:'')+
      sz74Row('Küme düşerse maaş indirimi',ct.relc?`−%${ct.relc}`:sz74No,ct.relc?`düşersek ${wgT(Math.round(ct.w*(1-ct.relc/100)))}`:'')+
      sz74Row('Opsiyon yılı',ct.opt?`+1 yıl · ${ct.opt===2?'oyuncu':'kulüp'} lehine`:sz74No,ct.opt?(ct.opt===2?'son yıl biterken oyuncu kulüpten kopmamışsa kullanır':'son yıl biterken gücü takım gücünün en fazla 6 altındaysa kulüp kullanır'):'')+
      sz74Row('Oyuncuya satıştan pay',ct.sellp?`%${ct.sellp}`:sz74No,ct.sellp?'satılırsa bonservisten oyuncuya ödenir':'');}
  else if(D.kind==='own')cl=sz74Row('Serbest kalma bedeli',sz74No,'devralınan sözleşme')+sz74Row('Diğer maddeler',sz74No,'maaş artışı, düşme indirimi, opsiyon kaydı yok');
  else cl=sz74Row('Serbest kalma bedeli',sz74Un,'kulübün iç bilgisi')+sz74Row('Diğer maddeler',sz74Un,'opsiyon, maaş artışı, satıştan pay');
  if(D.sellOn&&CLUBS[D.sellOn.c])cl+=sz74Row('Eski kulübün satış payı',`%${D.sellOn.pct}`,`satarsak bonservisin bu kısmı ${esc(CLUBS[D.sellOn.c].name)} kulübüne ödenir`);
  if(D.sellRev&&CLUBS[D.sellRev.club])cl+=sz74Row('Kulübümüzün satış payı',`%${D.sellRev.pct}`,`${esc(CLUBS[D.sellRev.club].name)} onu başka kulübe satarsa bütçemize`);
  /* kiralık */
  let ln='';
  if(L){const f=CLUBS[L.from];ln=sz74Row('Ana kulüp',f?`${crestSVG(f,14)} ${esc(f.name)}`:'—','bonservisi orada')+sz74Row('Kiralık süresi',`${seasonLabel(L.y)} sezon sonu`,'sezon bitince ana kulübüne döner')+
      sz74Row(L.mand?'Zorunlu satın alma':'Satın alma opsiyonu',L.opt?eur(L.opt):sz74No,L.opt?(L.mand?'sezon sonunda bütçe yeterse otomatik ödenir':'kiralık bitince yaz boyunca kullanılabilir'):'')+
      sz74Row('Maaş katkımız',L.wp!=null?`%${L.wp}`:sz74Nr,L.wp!=null?'maaşın bu kısmını biz ödüyoruz':'bu sürümden önce imzalandı')+
      (L.fee!=null?sz74Row('Kiralama bedeli',L.fee?eur(L.fee):sz74No,''):'');}
  else if(D.lout){const t=CLUBS[D.lout.to];ln=sz74Row('Kiralandığı kulüp',t?`${crestSVG(t,14)} ${esc(t.name)}`:'—',`${seasonLabel(D.lout.y)} sezonu`)+sz74Row('Dönüş','sezon sonunda','yeni sezon başlarken kadroya döner')+sz74Row('Maaş','kiralayan kulüp öder','');}
  /* transfer bilgisi (diğer kulüpler) */
  let tr='';
  if(D.kind==='other'){if(D.ask)tr+=sz74Row('Kulübün istediği bedel',D.ask.nfs?'Satılık değil':`${eur(rnd5(D.ask.a*0.9,stepOf(D.ask.a)))} – ${eur(rnd5(D.ask.a*1.15,stepOf(D.ask.a)))}`,D.ask.nfs?'kilit oyuncu':'tahmini · kalan sözleşme süresi bedeli etkiler');
    if(D.neg&&D.neg.d){const d=D.neg.d;tr+=sz74Row('Menajerin talepleri',`${wgT(d.w)}`,`${d.y?d.y+' yıl · ':''}${esc(roleName(d.role)||'')} rolü${d.rc?' · serbest kalma maddesi istiyor':''}`);}}
  /* uyarılar */
  if(D.days!=null&&D.days<0)warn.push(['bad','Sözleşmesi sona erdi.']);
  else if(L)warn.push(['inf',`Kiralık oyuncu: sezon sonunda ${esc(CLUBS[L.from]?CLUBS[L.from].name:'ana kulübüne')} döner${L.opt?(L.mand?' — zorunlu satın alma maddesi var.':' — satın alma opsiyonu yazın kullanılabilir.'):'.'}`]);
  else if(expiring&&!D.lout){if(D.kind==='own')warn.push(['bad',ct&&ct.opt?`Son yıl: sezon sonunda ${ct.opt===2?'oyuncu':'kulüp'} opsiyonu değerlendirilir; kullanılmazsa bedelsiz ayrılır.`:'Son yıl: yenilenmezse sezon sonunda bedelsiz ayrılır.']);
    else warn.push(['wa',G.mode==='mgr'?`Sözleşmesinin son yılı: kulübü daha düşük bonservis ister${p.age>=27?'; yazın serbest oyuncu olabilir':''}.`:'Sözleşmesinin son yılında.']);}
  if(!L&&!D.lout&&D.days!=null&&D.days>=0&&D.days<183)warn.push(['bad',`Sözleşmenin bitmesine 6 aydan az kaldı (${sz74Left(D.days)}).`]);
  if(D.pt&&D.pt.n===1)warn.push(['bad','Rol garantisi tutulmuyor: oyuncu şikayet etti; düzelmezse tazminat ister.']);else if(D.pt&&D.pt.n===2)warn.push(['bad','Rol garantisi ihlali için tazminat ödendi.']);
  if(D.negCd)warn.push(['wa',`Şu an yeni sözleşme konuşmak istemiyor (${D.negCd} gün).`]);
  if(D.fa)warn.push(['ok','Serbest oyuncu listesinde: bonservis ödemeden görüşülebilir.']);
  if(D.kind==='own'&&!ct&&!D.lout)warn.push(['inf','Göreve gelmeden önce imzalanmış sözleşme: maaş tahmini, ek madde kaydı yok. Yenilediğinde maddeler burada görünür.']);
  /* kısa yollar (yalnız mevcut eylemler) */
  const A=[];if(td&&D.kind==='own'&&!L&&!D.lout){if(D.end<=Y+2)A.push(`<button class="${expiring?'cta':'btn'} sm" data-act="renew" data-k="${esc(p.k)}">Sözleşmeyi yenile</button>`);A.push(`<button class="btn sm" data-act="talk1" data-k="${esc(p.k)}">Birebir görüş</button>`);}
  if(td&&D.kind==='own')A.push(`<button class="btn sm" data-act="navGo" data-tab="squad" data-k="soz">Tüm sözleşmeler</button>`);
  if(D.fa&&td)A.push(`<button class="cta sm" data-act="faGo" data-k="${esc(p.k)}">Serbest oyuncuyla görüş</button>`);
  const acts=A.length?`<div class="sz74-acts">${A.join('')}</div>`:'';
  return `<div class="sz74">${head}${sz74Bar(D.s0,D.end)}${sz74Warn(warn)}<div class="sz74-grid">${sz74Box('Genel',gen,'📄')}${sz74Box(D.lout?'Maaş':'Maaş ve ödemeler',pay,'€')}${L||D.lout?sz74Box('Kiralık şartları',ln,'↔'):''}${sz74Box('Primler',bon,'★')}${sz74Box('Maddeler',cl,'§')}${tr?sz74Box('Transfer',tr,'⇄'):''}</div>${acts}
    <p class="sz74-src">${D.kind==='own'&&ct?'Değerler kulübün kayıtlı sözleşmesinden.':D.est?'Maaş, kulübün ve ligin maaş ölçeğinden tahmin edildi; maddeler kulübün iç bilgisi.':''}</p></div>`;}

/* ---------- kart: futbolcunun kendi sözleşmesi ---------- */
function sz74MeData(){const ct=G.contract||{},cl=ct.cl||{},Y=G.s?G.s.year:2026,off=G.phase==='off';const D={ct,cl,Y,c:myClub(),w:+ct.wage||0,yrs:+ct.years||0};
  /* sezon içinde years bu sezonu da sayar → bitiş Y+years; yaz arasında years bir azalmıştır ama G.s.year hâlâ biten sezon → Y+1+years */
  D.end=D.yrs>0?Y+D.yrs+(off?1:0):null;
  D.days=D.end!=null?sz74Days(D.end):null;D.s0=ct.s0!=null?ct.s0:cl.y0!=null?cl.y0:null;
  if(G.loan){const pc=G.loan.contract||{};D.loan={parent:CLUBS[G.loan.parent],pw:+pc.wage||0,py:+pc.years||0,role:pc.role};D.loan.pend=D.loan.py>0?Y+D.loan.py:null;}
  if(cl.pt){const played=Math.max(0,((G.s&&G.s.week)||1)-1),st=(G.s&&G.s.stats)||{};D.pt={need:{Yıldız:0.7,Kaptan:0.7,'İlk 11':0.55,Rotasyon:0.3}[ct.role]||0.25,played,ap:st.apps||0,bad:!!ct.ptBad};}
  D.pd=cl.pd&&cl.pd.y===Y?cl.pd.s:null;return D;}
function sz74MeHTML(){if(!G.contract)return '<p class="muted">Sözleşmen yok.</p>';const D=sz74MeData(),ct=D.ct,cl=D.cl,w=D.w,Y=D.Y,c=D.c,warn=[],LN=D.loan;
  const youth=!!(curLeague()&&curLeague().youth);
  let pill='';if(LN)pill=sz74Pill('Kiralık','ln');else if(G.next)pill=sz74Pill('İmza atıldı','ok');else if(G.mustMove||D.yrs<=0)pill=sz74Pill('Bitti','ex');else if(D.yrs<=1)pill=sz74Pill('Son yıl','ex');
  const head=sz74Head(c,LN?'Kiralık sözleşmen':'Sözleşmen',`${esc(ct.role||'')}${D.end?` · ${sz74EndTxt(D.end)} tarihine kadar`:''}`,pill);
  let gen=sz74Row('Kulüp',esc(c?c.name:'—'),youth?'altyapı sözleşmesi':'')+sz74Row('Rolün',esc(ct.role||'—'),cl.pt?'rol garantili':'')+
    sz74Row('Başlangıç',D.s0!=null?seasonLabel(D.s0):sz74Nr,D.s0!=null?'':'bu sürümden önce imzalandı')+
    sz74Row('Bitiş',D.end?sz74EndTxt(D.end):LN?'Sezon sonu':'—',`${D.yrs>0?`${D.yrs} sezon`:'süre doldu'}`)+sz74Row('Kalan süre',D.end?sz74Left(D.days):'—',D.days!=null&&D.days>=0?`${D.days} gün`:'');
  if(D.pt){const pc=D.pt.played?Math.round(D.pt.ap/D.pt.played*100):0;gen+=sz74Row('Oynama süresi garantisi',`Maçların en az %${Math.round(D.pt.need*100)}’inde`,D.pt.played>=8?`Bu sezon: ${D.pt.ap}/${D.pt.played} maç (%${pc})`:`8. haftadan sonra izlenir · şu an ${D.pt.ap}/${D.pt.played}`);}
  let pay=sz74Row(LN?'Kiralık maaşın':'Maaş',sz74Wage(w/EUR_TL,false),'')+sz74Row('İmza parası',ct.bon!=null?(ct.bon?money(ct.bon):sz74No):sz74Nr,ct.bon!=null?(ct.bon?'imzada ödendi':''):'bu sürümden önce imzalandı');
  if(D.pd!=null)pay+=sz74Row('Bu sezon ödenen primler',money(D.pd),'maç ve gol primleri');
  const pc=v=>money(Math.round(w*v/100));
  const bon=sz74Row('Maç primi',cl.ab?`${pc(cl.ab)} / maç`:sz74No,cl.ab?`haftalık maaşın %${cl.ab}’i · pazar günleri ödenir`:'')+sz74Row('Gol primi',cl.gb?`${pc(cl.gb)} / gol`:sz74No,cl.gb?`haftalık maaşın %${cl.gb}’i`:'')+
    sz74Row('Şampiyonluk primi',cl.tb?`${money(cl.tb*w)} / kupa`:sz74No,cl.tb?`${cl.tb} haftalık maaş · sezon sonu`:'')+sz74Row('Sadakat primi',cl.sad?`${money(cl.sad*w)} / sezon`:sz74No,cl.sad?`${cl.sad} haftalık maaş · kulüpteki her tamamlanan sezon`:'');
  const nx=v=>wgHU(Math.round(w*v/50)*50);
  let cls=sz74Row('Serbest kalma bedeli',cl.rc?eur(cl.rc):sz74No,cl.rc?'senden güçlü ya da denk, en fazla bir alt seviyedeki liglerden kulüpler (yurt içi / yurt dışı ayrımı yok) · transfer dönemlerinde; kulübün engel olamaz':'yoksa kulübün sezon içinde transferini engelleyebilir')+
    sz74Row('Yıllık maaş artışı',cl.raise?`+%${cl.raise} / sezon`:sz74No,cl.raise?`gelecek sezon ${nx(1+cl.raise/100).replace(/<small[\s\S]*<\/small>/,'')}`:'')+
    sz74Row('Küme düşerse maaş indirimi',cl.relc?`−%${cl.relc}`:sz74No,cl.relc?`düşersek ${nx(1-cl.relc/100).replace(/<small[\s\S]*<\/small>/,'')}`:'')+
    sz74Row('Opsiyon yılı',cl.opt?`+1 yıl · ${cl.opt===2?'senin':'kulübün'} lehine`:sz74No,cl.opt?(cl.opt===2?'sözleşme biterken istersen 1 yıl daha kalırsın':'sezon ortalaman 6,6+ ve maçların %30’unda oynadıysan kulüp kullanır'):'')+
    sz74Row('Sonraki satıştan pay',cl.sell?`%${cl.sell}`:sz74No,cl.sell?'bonservisle ayrılırsan bonservisin bu kısmı sana':'');
  let ln='';if(LN){ln=sz74Row('Ana kulüp',LN.parent?`${crestSVG(LN.parent,14)} ${esc(LN.parent.name)}`:'—','bonservisin orada')+sz74Row('Dönüş','sezon sonunda','')+
      sz74Row('Ana sözleşmen',LN.pend?sz74EndTxt(LN.pend):'—',`${esc(LN.role||'')}${LN.py?` · ${LN.py} sezon`:''}`)+sz74Row('Ana kulüpteki maaşın',sz74Wage(LN.pw/EUR_TL,false),'');}
  if(G.next&&CLUBS[G.next.club]){const n=G.next.contract||{};warn.push(['ok',`${esc(CLUBS[G.next.club].name)} ile ${G.next.loan?'kiralık ':''}anlaştın: yeni sezonda ${esc(n.role||'')} rolüyle ${n.years||1} yıllık sözleşme başlar.`]);}
  if(G.mustMove&&!G.next)warn.push(['bad','Sözleşmen bitti: yeni kulüp bulmalısın.']);
  else if(!LN&&G.phase==='season'&&D.yrs<=1)warn.push(['bad',cl.opt?`Son yıl: sezon sonunda ${cl.opt===2?'opsiyon hakkını kullanabilirsin':'kulüp opsiyonu değerlendirir'}.`:'Son yıl: sezon sonunda yenileme teklifi gelmezse kulüp değiştirmen gerekir.']);
  if(!LN&&D.days!=null&&D.days>=0&&D.days<183&&!G.next)warn.push(['bad',`Sözleşmenin bitmesine 6 aydan az kaldı (${sz74Left(D.days)}).`]);
  if(G.tl)warn.push(['wa','Transfer listesindesin.']);
  if(D.pt&&D.pt.bad)warn.push(['bad',`Rol garantin tutulmuyor.${cl.ptC===Y?' Bu sezon şikayet ettin.':''}`]);
  if(LN)warn.push(['inf',`Kiralıktasın: sezon sonunda ${esc(LN.parent?LN.parent.name:'ana kulübüne')} döneceksin.`]);
  const A=[];try{if(G.phase==='season'&&!youth){const dis=reqLeft('maas')>0;A.push(`<button class="btn sm" data-act="breq" data-k="maas" ${dis?'disabled':''}>${esc(REQ.maas.n)}${dis?` · ${reqLeft('maas')} gün`:''}</button>`);}}catch(e){}
  if(D.pt&&D.pt.bad&&cl.ptC!==Y)A.push('<button class="cta sm" data-act="soz72Sik">Yönetime şikayet et</button>');
  A.push('<button class="btn sm" data-act="tab" data-tab="board">Yönetim</button>');
  return `<div class="sz74 sz74-me">${head}${sz74Bar(D.s0,D.end)}${sz74Warn(warn)}<div class="sz74-grid">${sz74Box('Genel',gen,'📄')}${sz74Box('Maaş ve ödemeler',pay,'€')}${LN?sz74Box('Kiralık şartları',ln,'↔'):''}${youth?'':sz74Box('Primler',bon,'★')+sz74Box('Maddeler',cls,'§')}</div><div class="sz74-acts">${A.join('')}</div>
    <p class="sz74-src">Değerler imzaladığın sözleşmeden. Maddeler bir sonraki görüşmede teklif ekranındaki “Pazarlık” ile istenebilir.</p></div>`;}

/* ---------- profile ekle: Sözleşme sekmesi ---------- */
fmProfHTML=(old=>function(p,c,opt){let h=old.apply(this,arguments);try{if(opt&&opt.acad||!p||!p.k||!c||!CLUBS[c.id]||p.alive===false||LEAGUES[c.league]&&LEAGUES[c.league].youth&&!(G.mode==='mgr'&&c.id===G.club))return h;
    h+=`<section class="fmp-soz" hidden>${sz74HTML(p,c)}</section>`;}catch(e){console.warn('v174 sözleşme kartı',e);}return h;})(fmProfHTML);
function sz74Mount(mc,was){if(!mc)return;const sec=mc.querySelector('.fmp-soz'),nav=mc.querySelector('.pf-tabs'),body=mc.querySelector('.pf-body');if(!sec||!nav||!body||nav.querySelector('[data-k=soz]'))return;
  const b=document.createElement('button');b.dataset.act='pfTab';b.dataset.k='soz';b.textContent='Sözleşme';const ref=nav.querySelector('[data-k=cp]');nav.insertBefore(b,ref||null);
  const pn=document.createElement('div');pn.className='pf-pane';pn.dataset.p='soz';pn.hidden=true;sec.hidden=false;pn.appendChild(sec);body.appendChild(pn);
  if(was==='soz')pfTabGo('soz');}
pfBuild=(old=>function(mc){const was=PF_TAB;const r=old.apply(this,arguments);try{sz74Mount(mc,was);}catch(e){console.warn('v174 sekme',e);}return r;})(pfBuild);
/* futbolcu: Oyuncu › Sözleşme alt sekmesi */
stab=(old=>function(id,tabs){try{if(id==='pl'&&isPl()&&G.contract&&G.phase!=='retired'&&Array.isArray(tabs)&&!tabs.some(t=>t&&t[0]==='soz'))tabs=tabs.concat([['soz','Sözleşme',()=>sz74MeHTML()]]);}catch(e){}return old.call(this,id,tabs);})(stab);
