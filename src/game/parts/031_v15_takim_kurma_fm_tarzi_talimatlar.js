/* ================= v15: takım kurma (FM tarzı), talimatlar, oyuncu ilişkileri ================= */
const FMF={
  '4-4-2':[['KL',.5,.04],['DF',.12,.24],['DF',.37,.18],['DF',.63,.18],['DF',.88,.24],['KN',.12,.54],['OS',.37,.48],['OS',.63,.48],['KN',.88,.54],['FW',.37,.82],['FW',.63,.82]],
  '4-3-3':[['KL',.5,.04],['DF',.12,.24],['DF',.37,.18],['DF',.63,.18],['DF',.88,.24],['OS',.5,.36],['OS',.28,.52],['OS',.72,.52],['KN',.14,.76],['FW',.5,.84],['KN',.86,.76]],
  '4-2-3-1':[['KL',.5,.04],['DF',.12,.24],['DF',.37,.18],['DF',.63,.18],['DF',.88,.24],['OS',.36,.4],['OS',.64,.4],['KN',.14,.66],['OS',.5,.64],['KN',.86,.66],['FW',.5,.85]],
  '4-1-4-1':[['KL',.5,.04],['DF',.12,.24],['DF',.37,.18],['DF',.63,.18],['DF',.88,.24],['OS',.5,.35],['KN',.12,.6],['OS',.37,.56],['OS',.63,.56],['KN',.88,.6],['FW',.5,.85]],
  '4-4-1-1':[['KL',.5,.04],['DF',.12,.24],['DF',.37,.18],['DF',.63,.18],['DF',.88,.24],['KN',.12,.52],['OS',.37,.46],['OS',.63,.46],['KN',.88,.52],['FW',.5,.68],['FW',.5,.86]],
  '3-5-2':[['KL',.5,.04],['DF',.25,.19],['DF',.5,.16],['DF',.75,.19],['KN',.09,.48],['OS',.32,.46],['OS',.5,.36],['OS',.68,.46],['KN',.91,.48],['FW',.38,.82],['FW',.62,.82]],
  '3-4-3':[['KL',.5,.04],['DF',.25,.19],['DF',.5,.16],['DF',.75,.19],['KN',.1,.48],['OS',.37,.44],['OS',.63,.44],['KN',.9,.48],['KN',.17,.78],['FW',.5,.85],['KN',.83,.78]],
  '5-3-2':[['KL',.5,.04],['DF',.08,.3],['DF',.29,.18],['DF',.5,.16],['DF',.71,.18],['DF',.92,.3],['OS',.28,.5],['OS',.5,.44],['OS',.72,.5],['FW',.38,.82],['FW',.62,.82]]};
function slotKind(s){const [p,x,y]=s;if(p==='KL')return 'GK';if(p==='DF')return (x<.2||x>.8)?'FB':'CB';if(p==='OS')return y<.4?'DM':y>.6?'AM':'CM';if(p==='KN')return y<.6?'WM':'W';return 'ST';}
const KIND_N={GK:'Kaleci',CB:'Stoper',FB:'Bek',DM:'Defansif OS',CM:'Merkez OS',AM:'Ofansif OS',WM:'Kanat OS',W:'Kanat forvet',ST:'Santrfor'};
const FMR={GK:[['kl','Kaleci','KL'],['sk','Libero kaleci','LK']],CB:[['st','Stoper','ST'],['bpd','Topla oynayan stoper','TOS'],['ns','Temizleyici','TMZ']],
  FB:[['fb','Bek','BK'],['wb','Bindiren bek','BB'],['ifb','Ters bek','TB']],DM:[['dm','Ön libero','ÖL'],['dlp','Derin oyun kurucu','DOK'],['bw','Top kapan','TK']],
  CM:[['cm','Merkez OS','MO'],['b2b','Box-to-box','B2B'],['ap','Oyun kurucu','OK']],AM:[['am','Ofansif OS','OO'],['t10','On numara','10'],['sf','Gölge forvet','GF']],
  WM:[['wm','Kanat OS','KO'],['wb2','Kanat bek','KB'],['wp','Kanat oyun kurucu','KOK']],W:[['w','Kanat','KN'],['iw','Ters kanat','TK'],['if','İç forvet','İF']],
  ST:[['af','Bitirici','BİT'],['tm','Hedef adam','HA'],['f9','Sahte 9','S9'],['pf','Pres forveti','PF']]};
/* öznitelik ağırlıkları: saha ŞUT PAS DRİ HIZ FİZ DEF · kaleci REF POZ ELL AYK HIZ FİZ */
const RW={kl:[3,2.5,1,.5,0,1],sk:[2,1.5,1,2.5,2,.5],st:[0,.5,0,1,2,3],bpd:[0,2,.5,.5,1,2.5],ns:[0,0,0,1,3,3],fb:[0,1,.5,1.5,1,2],wb:[.3,1,1,2.5,1.5,1],ifb:[0,2.5,1,1,1,1.5],
  dm:[0,1,0,.5,2,3],dlp:[.3,3,1,0,.5,1],bw:[0,.5,0,1,3,3],cm:[.5,2,1,.5,1,1],b2b:[1,1.5,1,1,2.5,1],ap:[.5,3,2,.5,0,0],am:[1.5,2,2,.5,0,0],t10:[1.5,3,2.5,0,0,0],sf:[3,1,1.5,1.5,.5,0],
  wm:[.5,1.5,1.5,2,1,.5],wb2:[0,1,1,2.5,1.5,1.5],wp:[.5,3,2,1,0,0],w:[.5,1.5,2.5,3,0,0],iw:[1,2.5,2.5,1.5,0,0],if:[2.5,1,2.5,2.5,0,0],af:[3,0,1,2.5,.5,0],tm:[2,.5,0,0,3.5,0],f9:[1.5,3,2.5,1,0,0],pf:[1.5,0,.5,2,3,1]};
/* rol etkisi: hücum, savunma, topa sahip olma, pres */
const RE={kl:[0,.5,0,0],sk:[0,0,1,.5],st:[0,1,0,0],bpd:[0,0,1,0],ns:[-.3,1.3,-.5,0],fb:[0,.8,0,0],wb:[1,-.3,.3,.3],ifb:[0,.3,1,0],dm:[0,1,0,.3],dlp:[.3,0,1.5,0],bw:[0,.8,-.3,1.2],
  cm:[.3,.3,.5,.3],b2b:[.5,.3,0,1],ap:[.8,-.3,1.2,0],am:[1,0,.3,0],t10:[1.5,-.5,.8,-.8],sf:[1.5,-.3,0,.3],wm:[.5,.3,.3,.3],wb2:[.3,.8,0,.3],wp:[.6,0,1,0],w:[1,0,0,.2],iw:[1,0,.6,0],if:[1.5,-.3,0,.2],
  af:[1.5,0,-.3,0],tm:[1,0,0,0],f9:[.8,0,1.2,0],pf:[.6,0,0,1.5]};
const DUTY={sav:['Savunma',[-.5,.5,0,0]],des:['Destek',[0,0,0,0]],huc:['Hücum',[.6,-.5,0,0]]};
const Z5=[0,0,0,0,0];
/* takım talimatları: [hücum, savunma, topa sahip olma, pres, fiziksel yük] */
const TI=[
 {g:'pos',k:'pas',n:'Pas mesafesi',o:[['kisa','Kısa',[-.3,0,2,0,0]],['kar','Karışık'],['direkt','Direkt',[1,0,-1.5,0,0]]],d:'kar'},
 {g:'pos',k:'tempo',n:'Tempo',o:[['dus','Düşük',[-.8,.3,1,0,-.5]],['nor','Normal'],['yuk','Yüksek',[1.2,-.3,-.5,0,1]]],d:'nor'},
 {g:'pos',k:'gen',n:'Hücum genişliği',o:[['dar','Dar',[-.2,.3,.6,0,0]],['nor','Normal'],['gen','Geniş',[.8,-.3,0,0,.3]]],d:'nor'},
 {g:'pos',k:'yon',n:'Hücum yönü',o:[['sol','Sol'],['kar','Karışık'],['mer','Merkez'],['sag','Sağ']],d:'kar'},
 {g:'pos',k:'orta',n:'Ortalar',o:[['az','Az',[0,0,.5,0,0]],['nor','Normal'],['bol','Bol orta',[.6,0,-.5,0,0]]],d:'nor'},
 {g:'pos',k:'sut',n:'Şut tercihi',o:[['sabir','Pozisyon bekle',[.2,0,.8,0,0]],['nor','Normal'],['uzak','Uzaktan dene',[.4,0,-.6,0,0]]],d:'nor'},
 {g:'pos',k:'drip',n:'Bire bir',o:[['az','Topu çabuk ver',[0,0,.6,0,0]],['nor','Normal'],['cok','Çalım at',[.6,0,-.3,0,.3]]],d:'nor'},
 {g:'pos',k:'arka',n:'Savunma arkasına',o:[['hayir','Ayağa oyna',[0,0,.5,0,0]],['nor','Normal'],['evet','Arkaya at',[.8,0,-.5,0,.3]]],d:'nor'},
 {g:'tr',k:'kayip',n:'Top kaybında',o:[['karsi','Karşı pres',[.4,.2,0,2,1.2]],['nor','Normal'],['geri','Geri çekil',[-.3,1,0,-1,-.5]]],d:'nor'},
 {g:'tr',k:'kazan',n:'Top kazanınca',o:[['kontra','Kontra atak',[1.2,-.2,-.8,0,.5]],['nor','Normal'],['tut','Topu sakla',[-.2,.3,1.2,0,-.3]]],d:'nor'},
 {g:'tr',k:'kaleci',n:'Kaleci oyun kurulumu',o:[['kisa','Kısa dağıt',[0,-.2,1,0,0]],['kar','Karışık'],['uzun','Uzun vur',[.3,.2,-1,0,0]]],d:'kar'},
 {g:'tr',k:'set',n:'Hücuma çıkış',o:[['yavas','Sabırla yerleş',[0,.3,.8,0,0]],['nor','Normal'],['hizli','Hızlı çık',[.7,0,-.3,0,.3]]],d:'nor'},
 {g:'def',k:'hat',n:'Savunma çizgisi',o:[['derin','Derin',[-.5,1,-.3,-1,0]],['nor','Normal'],['yuksek','Yüksek',[.5,-.6,.3,1,.3]]],d:'nor'},
 {g:'def',k:'pres',n:'Pres hattı',o:[['dus','Düşük blok',[-.5,1.2,-.5,-1.5,-.5]],['orta','Orta blok'],['yuk','Önde pres',[.5,-.3,0,2,1.2]]],d:'orta'},
 {g:'def',k:'yog',n:'Pres yoğunluğu',o:[['az','Az',[0,.3,0,-1,-.6]],['nor','Normal'],['cok','Çok fazla',[0,0,0,1.5,1]]],d:'nor'},
 {g:'def',k:'mud',n:'Müdahaleler',o:[['yum','Ayakta kal',[0,-.2,0,0,0]],['nor','Normal'],['sert','Sert gir',[0,.6,0,.3,0]]],d:'nor'},
 {g:'def',k:'ofs',n:'Ofsayt taktiği',o:[['hayir','Kullanma'],['evet','Kullan',[0,.4,0,.3,0]]],d:'hayir'},
 {g:'def',k:'mark',n:'Markaj',o:[['alan','Alan'],['adam','Adam adama',[0,.4,0,.4,.5]]],d:'alan'},
 {g:'def',k:'yonl',n:'Rakibi yönlendir',o:[['kenar','Kenara',[0,.5,0,0,0]],['nor','Serbest'],['mer','İçeri',[0,-.2,0,.4,0]]],d:'nor'}];
const TI_G={pos:'Topa sahipken',tr:'Geçiş',def:'Savunmada'};
const PRESET={denge:{n:'Dengeli',tac:'dengeli',ti:{}},tiki:{n:'Tiki-taka',tac:'dengeli',ti:{pas:'kisa',gen:'gen',kazan:'tut',kayip:'karsi',hat:'yuksek',pres:'yuk',kaleci:'kisa',sut:'sabir',drip:'az',arka:'hayir',set:'yavas'}},
  gegen:{n:'Gegenpress',tac:'pres',ti:{tempo:'yuk',kayip:'karsi',pres:'yuk',yog:'cok',hat:'yuksek',kazan:'kontra',arka:'evet'}},
  kontra:{n:'Kontra atak',tac:'dengeli',ti:{pas:'direkt',tempo:'yuk',kazan:'kontra',pres:'dus',hat:'derin',arka:'evet',kayip:'geri',set:'hizli'}},
  otobus:{n:'Otobüsü çek',tac:'savunma',ti:{pas:'direkt',tempo:'dus',gen:'dar',pres:'dus',hat:'derin',kayip:'geri',kazan:'tut',yog:'az',mark:'adam',kaleci:'uzun'}},
  uzun:{n:'Uzun top',tac:'hucum',ti:{pas:'direkt',orta:'bol',kaleci:'uzun',gen:'gen',arka:'evet',set:'hizli'}}};
const PERS=[['Profesyonel',3],['Sakin',3],['Lider',1.5],['Hırslı',2],['Hassas',1.5],['Asi',1.2]],PERS_OK={Profesyonel:.8,Sakin:.7,Lider:.6,'Hırslı':.45,Hassas:.4,Asi:.2},PERS_B={Profesyonel:10,Sakin:5,Lider:5,'Hırslı':-5,Hassas:0,Asi:-25};
let FMS=-1,FMT='pos';KTAB='taktik';
function fmInit(){const m=mgrInit();if(!m.valf){m.valf=1;m.budget=(m.budget||0)*VALF;}if(m.fmClub!==G.club){m.fmClub=G.club;m.rel={};m.talks=[];m.prom=[];m.ban={};m.bw={};m.trq={};m.tw={};if(m.fm)m.fm.fam=50;}
  if(!m.fm){m.fm={f:'4-4-2',roles:null,ti:{},fam:55};m.xi=null;}const f=m.fm;if(!FMF[f.f])f.f='4-4-2';
  if(!f.roles||f.roles.length!==11)f.roles=FMF[f.f].map(s=>({r:FMR[slotKind(s)][0][0],d:'des'}));
  FMF[f.f].forEach((s,i)=>{if(!FMR[slotKind(s)].some(r=>r[0]===f.roles[i].r))f.roles[i]={r:FMR[slotKind(s)][0][0],d:f.roles[i].d||'des'};});
  for(const t of TI)if(!t.o.some(o=>o[0]===f.ti[t.k]))f.ti[t.k]=t.d;m.rel=m.rel||{};m.talks=m.talks||[];m.prom=m.prom||[];m.ban=m.ban||{};m.bw=m.bw||{};m.trq=m.trq||{};m.tw=m.tw||{};return m;}
const PADJ={'DF-OS':4,'OS-DF':4,'OS-KN':3,'KN-OS':3,'KN-FW':3,'FW-KN':3,'OS-FW':5,'FW-OS':5,'DF-KN':5,'KN-DF':5};
function posPen(pp,sp){if(pp===sp)return 0;if(pp==='KL'||sp==='KL')return 25;return PADJ[pp+'-'+sp]||10;}
function roleFit(p,r){const at=pAttrs(p).map(a=>a[1]),w=RW[r];let s=0,n=0;w.forEach((x,i)=>{s+=x*at[i];n+=x;});return n?s/n-p.ovr:0;}
const fitStars=v=>v>=3?3:v>=-1?2:v>=-6?1:0;
function slotEff(p,i){const m=G.m,f=m.fm,s=FMF[f.f][i];return p.ovr-dpPen(p,s)+roleFit(p,f.roles[i].r)*0.25;}
function mgrXI(){const m=fmInit(),inj=m.inj||{},ban=m.ban||{},sq=squadOf(G.club).filter(p=>!inj[p.k]&&!ban[p.k]),by={};sq.forEach(p=>by[p.k]=p);
  let xi=(m.xi||[]).slice(0,11);while(xi.length<11)xi.push(null);const seen=new Set();xi=xi.map(k=>k&&by[k]&&!seen.has(k)?(seen.add(k),k):null);
  if(xi.some(k=>!k)){const PO={KL:0,FW:1,KN:2,DF:3,OS:4},order=[0,1,2,3,4,5,6,7,8,9,10].sort((a,b)=>PO[FMF[m.fm.f][a][0]]-PO[FMF[m.fm.f][b][0]]);
    for(const pass of [0,1])for(const i of order){if(xi[i])continue;const best=sq.filter(p=>!seen.has(p.k)&&(pass||p.pos===FMF[m.fm.f][i][0])).sort((a,b)=>slotEff(b,i)-slotEff(a,i))[0];if(best){xi[i]=best.k;seen.add(best.k);}}}
  m.xi=xi.filter(Boolean).length===11?xi:xi.filter(Boolean);return m.xi;}
function persOf(p){const r=srng(p.k+'pers')(),tot=PERS.reduce((a,x)=>a+x[1],0);let t=r*tot;for(const [n,w] of PERS){t-=w;if(t<=0)return n;}return 'Sakin';}
function relOf(p){const m=G.m;if(!m)return 0;m.rel=m.rel||{};if(m.rel[p.k]==null){const rep=m.rep||30,resp=(rep-(p.ovr-45)*1.2)*0.5;m.rel[p.k]=Math.round(clamp(15+PERS_B[persOf(p)]+resp+(srng(p.k+'r0')()*20-10),-60,70));}return m.rel[p.k];}
function relAdd(p,v){const m=G.m;relOf(p);m.rel[p.k]=Math.round(clamp(m.rel[p.k]+v,-100,100));}
const moodOf=v=>v>40?['cm','Çok mutlu','😀']:v>15?['mu','Mutlu','🙂']:v>-10?['no','Normal','😐']:v>-35?['ms','Mutsuz','🙁']:['kr','Kriz','😠'];
function harm(){const sq=squadOf(G.club);return sq.length?sq.reduce((a,p)=>a+relOf(p),0)/sq.length:0;}
function xiStr(){const m=G.m;if(!m)return myClub().str;const sq=squadOf(G.club),xi=mgrXI(),f=fmInit().fm,S=FMF[f.f];let s=0,n=0,rf=0;
  xi.forEach((k,i)=>{const p=sq.find(x=>x.k===k);if(!p||!S[i])return;s+=p.ovr-dpPen(p,S[i])-(relOf(p)<-30?1.5:0);rf+=roleFit(p,f.roles[i].r);n++;});if(!n)return myClub().str;
  s=s/n+(n<11?-(11-n)*3:0)+(m.form||0)*0.5+(f.fam-60)/25+clamp((harm()-10)/40,-1.2,0.8)+clamp(rf/n*0.08,-0.8,0.8)+stfXi()+shopXi();return Math.round(s*10)/10;}
/* taktik analizi */
function tacDims(){const m=fmInit(),f=m.fm,sq=squadOf(G.club),xi=mgrXI(),S=FMF[f.f],D=[0,0,0,0,0],W=[];
  const add=(v,k)=>{if(v)for(let i=0;i<v.length;i++)D[i]+=v[i]*(k==null?1:k);};
  const ps=xi.map((k,i)=>({p:sq.find(x=>x.k===k),i})).filter(x=>x.p),out=ps.filter(x=>x.p.pos!=='KL'),at=x=>pAttrs(x.p).map(a=>a[1]),avg=out.reduce((a,x)=>a+x.p.ovr,0)/Math.max(1,out.length);
  const att=(idx,flt)=>{const L=out.filter(flt||(()=>true));return L.length?L.reduce((a,x)=>a+at(x)[idx],0)/L.length:avg;};
  ps.forEach(x=>{const r=f.roles[x.i];add(RE[r.r],0.6);if(r.d&&x.p.pos!=='KL')add(DUTY[r.d][1],0.6);});add([-2.7,-3.2,-0.5,-0.75,0]);
  for(const t of TI){const o=t.o.find(o=>o[0]===f.ti[t.k]);if(o)add(o[2]);}
  const T={hucum:[1.5,-1,0,0,.3],dengeli:Z5,savunma:[-1.5,1.5,-.3,-.5,-.3],pres:[.5,-.3,0,1.5,1]}[m.tac]||Z5;add(T);
  const ti=f.ti;
  if(ti.pas==='kisa'&&att(1)<avg-2){W.push(['Oyuncuların pas becerisi kısa pas oyununa yetmiyor; top kayıpları artar.','bad']);add([0,-.6,-1,0,0]);}
  const fz=att(4);if((ti.kayip==='karsi'||ti.pres==='yuk'||ti.yog==='cok'||m.tac==='pres')&&fz<avg-1){W.push(['Kadronun fiziği yoğun prese uygun değil; maç sonlarında düşüş yaşanır.','bad']);add([0,-.8,0,-.5,0]);}
  const dfh=att(3,x=>x.p.pos==='DF');if(ti.hat==='yuksek'&&dfh<avg-3){W.push(['Savunma oyuncuları yavaş; yüksek çizgi arkaya atılan toplara açık.','bad']);add([0,-1.2,0,0,0]);}
  const fw=out.filter(x=>x.p.pos==='FW');if(ti.orta==='bol'){const air=fw.some(x=>f.roles[x.i].r==='tm'||at(x)[4]>=avg+2);if(!air){W.push(['Bol orta istiyorsun ama ceza sahasında hava topu oyuncusu yok.','bad']);add([-.6,0,0,0,0]);}else{W.push(['Hedef adam ortalarla iyi besleniyor.','good']);add([.5,0,0,0,0]);}}
  if(ti.arka==='evet'){const h=att(3,x=>x.p.pos==='FW'||x.p.pos==='KN');if(h>=avg+2){W.push(['Hücumcuların hızı savunma arkasına koşulara çok uygun.','good']);add([.6,0,0,0,0]);}else if(h<avg-2){W.push(['Hücumcular yavaş; arkaya atılan toplar boşa gidiyor.','bad']);add([-.5,0,0,0,0]);}}
  if(ti.yon==='sol'||ti.yon==='sag'){const side=x=>S[x.i][1]<.35?'sol':S[x.i][1]>.65?'sag':'';const sv=d=>{const L=out.filter(x=>side(x)===d);return L.length?L.reduce((a,x)=>a+x.p.ovr,0)/L.length:0;};
    const me=sv(ti.yon),ot=sv(ti.yon==='sol'?'sag':'sol');if(me>=ot+2){W.push([`${ti.yon==='sol'?'Sol':'Sağ'} kanadın daha güçlü; hücumları oraya yönlendirmek mantıklı.`,'good']);add([.6,0,0,0,0]);}else if(me<ot-1){W.push([`${ti.yon==='sol'?'Sol':'Sağ'} kanat zayıf taraf; hücum yönünü gözden geçir.`,'bad']);add([-.5,0,0,0,0]);}}
  if(ti.gen==='gen'&&!out.some(x=>S[x.i][1]<.2||S[x.i][1]>.8))W.push(['Geniş oyun için kanatlarda oyuncu yok.','bad']);
  if(ti.mud==='sert')W.push(['Sert müdahaleler kart ve penaltı riskini artırır.','warn']);
  if(ti.ofs==='evet'&&ti.hat==='derin')W.push(['Derin savunma çizgisiyle ofsayt taktiği pek işe yaramaz.','warn']);
  if(m.tac==='hucum'&&ti.hat==='derin'&&ti.pres==='dus')W.push(['Hücum yaklaşımıyla düşük blok çelişiyor; takım ikiye bölünebilir.','bad']);
  const mis=ps.filter(x=>dpPen(x.p,S[x.i])>=5);if(mis.length)W.push([`${mis.map(x=>x.p.name.split(' ').slice(-1)[0]).join(', ')} doğal mevkisinin dışında oynuyor.`,'bad']);
  const badR=ps.filter(x=>roleFit(x.p,f.roles[x.i].r)<-6);if(badR.length)W.push([`${badR.map(x=>x.p.name.split(' ').slice(-1)[0]).join(', ')} verilen role uygun değil.`,'warn']);
  if(D[4]>3)W.push(['Fiziksel yük çok yüksek: sakatlık riski artar.','bad']);if(f.fam<45)W.push(['Takım bu sisteme henüz alışamadı (uyum düşük).','warn']);
  const cl=v=>Math.round(clamp(50+v*4,8,96));return {atk:cl(D[0]),def:cl(D[1]),pos:cl(D[2]),prs:cl(D[3]),load:D[4],W};}
function tacT(opp){const m=fmInit(),T=TAC[m.tac]||TAC.dengeli,d=tacDims(),me=myClub();let f=clamp(1+(d.atk-50)/250+(d.pos-50)/600,0.85,1.16),a=clamp(1-(d.def-50)/250-(d.prs-50)/600+(d.atk-50)/700+Math.max(0,d.load-3)*0.02,0.84,1.18);
  if(opp){if(m.fm.ti.kazan==='kontra'&&opp.str>me.str+3)f*=1.06;if(m.fm.ti.hat==='yuksek'&&opp.str>me.str+5)a*=1.05;if(m.fm.ti.pas==='kisa'&&opp.str<me.str-3)f*=1.04;}
  return {n:`${T.n} · ${m.fm.f}`,f:T.f*f,a:T.a*a};}
/* düzenleme */
function fmForm(k){const m=fmInit();if(m.fm.f===k)return;const old=m.xi||[];m.fm.f=k;m.fm.roles=null;m.fm.fam=Math.max(20,m.fm.fam-15);fmInit();
  m.xi=null;FMS=-1;mgrXI();toast(`Diziliş: ${k} · uyum düştü`);save();render();}
function fmTi(k,v){const m=fmInit();if(m.fm.ti[k]===v)return;m.fm.ti[k]=v;m.fm.fam=Math.max(20,m.fm.fam-2);m.fm.pre=null;save();render();}
function fmPreset(k){const m=fmInit(),P=PRESET[k];m.tac=P.tac;for(const t of TI)m.fm.ti[t.k]=P.ti[t.k]||t.d;m.fm.pre=k;m.fm.fam=Math.max(20,m.fm.fam-8);toast(`${P.n} şablonu uygulandı`);save();render();}
function fmSel(i){FMS=FMS===i?-1:i;if(FMS>=0)STB.tak='oyn';render();}
function fmPut(i,k){const m=fmInit(),xi=mgrXI().slice(),j=xi.indexOf(k);if(j>=0){xi[j]=xi[i];xi[i]=k;}else xi[i]=k;m.xi=xi;save();render();}
function fmRole(i,r){const m=fmInit();m.fm.roles[i].r=r;save();render();}
function fmDuty(i,d){const m=fmInit();m.fm.roles[i].d=d;save();render();}
function fmAuto(){const m=fmInit();m.xi=null;mgrXI();toast('Asistan en iyi 11’i seçti');save();render();}
function ksur(n){const a=n.split(' ');return a.length>1?a.slice(-1)[0]:n;}
function tacView(){const m=fmInit(),f=m.fm,S=FMF[f.f],sq=squadOf(G.club),xi=mgrXI(),c=myClub(),d=tacDims(),inj=m.inj||{},ban=m.ban||{};
  const slots=S.map((s,i)=>{const p=sq.find(x=>x.k===xi[i]);const R=FMR[slotKind(s)].find(r=>r[0]===f.roles[i].r);if(!p)return `<button class="fm-slot empty${FMS===i?' sel':''}" style="left:${s[1]*100}%;top:${s[0]==='KL'?91:(1-s[2])*84+4}%" data-act="fmSel" data-i="${i}"><span class="fm-sh">+</span><b>${KIND_N[slotKind(s)]}</b></button>`;
    const pp=dpPen(p,s),fs=fitStars(roleFit(p,f.roles[i].r)),md=moodOf(relOf(p));
    return `<button class="fm-slot${FMS===i?' sel':''} ${pp>=10?'bad':pp>0?'mid':''}" style="left:${s[1]*100}%;top:${s[0]==='KL'?91:(1-s[2])*84+4}%" data-act="fmSel" data-i="${i}"><span class="fm-sh" style="background:${c.c1};color:${c.c2}">${R200(p.ovr)}</span><i class="fm-md m-${md[0]}"></i><b>${esc(ksur(p.name))}</b><small>${R?R[2]:''}${s[0]!=='KL'?'·'+DUTY[f.roles[i].d][0][0]:''} ${'★'.repeat(fs)}</small></button>`;}).join('');
  let sel='';if(FMS>=0&&S[FMS]){const s=S[FMS],kind=slotKind(s),p=sq.find(x=>x.k===xi[FMS]),r=f.roles[FMS];
    const cands=sq.filter(q=>!inj[q.k]&&!ban[q.k]&&q.k!==xi[FMS]).map(q=>({q,e:slotEff(q,FMS)})).sort((a,b)=>b.e-a.e).slice(0,9);
    sel=`<section class="panel fm-selp"><p class="sub-h"><span>${KIND_N[kind]} · ${s[0]}</span><span>${p?esc(p.name):'Boş'}</span></p>
    <div class="filt">${FMR[kind].map(([k,n])=>`<button class="chip" data-act="fmRole" data-i="${FMS}" data-k="${k}" aria-pressed="${r.r===k}">${n}${p?` <em class="st">${'★'.repeat(fitStars(roleFit(p,k)))||'☆'}</em>`:''}</button>`).join('')}</div>
    ${s[0]!=='KL'?`<div class="filt" style="margin-top:4px">${Object.entries(DUTY).map(([k,v])=>`<button class="chip" data-act="fmDuty" data-i="${FMS}" data-k="${k}" aria-pressed="${r.d===k}">${v[0]}</button>`).join('')}</div>`:''}
    <p class="sub-h" style="margin:10px 0 4px"><span>Bu mevkiye oyuncu koy</span><span>uygunluğa göre</span></p>
    ${cands.map(({q,e})=>{const inX=xi.includes(q.k),md=moodOf(relOf(q));return `<button class="fm-cand" data-act="fmPut" data-i="${FMS}" data-k="${q.k}"><span class="tp">${dpTag(q)}</span><b>${esc(q.name)}${inX?' <u>İLK 11</u>':''}</b><span class="md" title="${md[1]}">${md[2]}</span><em>${R200(q.ovr)}</em><small>${Math.round(e)}</small></button>`;}).join('')}</section>`;}
  const bench=sq.filter(q=>!xi.includes(q.k)).sort((a,b)=>b.ovr-a.ovr).map(q=>{const md=moodOf(relOf(q));return `<button class="fm-b" data-act="${FMS>=0?'fmPut':'pcard'}" data-i="${FMS}" data-id="${G.club}" data-k="${q.k}"><span>${dpTag(q)}</span><b>${esc(ksur(q.name))}</b><em>${R200(q.ovr)}</em><i>${inj[q.k]?'🚑':ban[q.k]?'⛔':md[2]}</i></button>`;}).join('');
  const bar=(l,v,cl)=>`<div class="fm-bar"><span>${l}</span><i><em class="${cl||''}" style="width:${v}%"></em></i><b>${v}</b></div>`;
  const tiRows=TI.filter(t=>t.g===FMT).map(t=>`<div class="ti-row"><span>${t.n}</span><div class="seg2">${t.o.map(o=>`<button class="chip" data-act="fmTi" data-k="${t.k}" data-v="${o[0]}" aria-pressed="${f.ti[t.k]===o[0]}">${o[1]}</button>`).join('')}</div></div>`).join('');
  return `<section class="panel"><p class="sub-h"><span>Diziliş</span><span>Uyum %${Math.round(f.fam)}</span></p><div class="filt">${Object.keys(FMF).map(k=>`<button class="chip" data-act="fmForm" data-k="${k}" aria-pressed="${f.f===k}">${k}</button>`).join('')}</div>
   <div class="fm-pitch">${slots}</div><div class="fm-tools"><button class="btn sm" data-act="fmAuto">Asistan: en iyi 11</button><span class="muted">${FMS>=0?'Aşağıdan oyuncu ve rol seç':'Mevkiye dokun: rol, görev, oyuncu'}</span></div></section>
   ${stab('tak',[['oyn','Oyuncular',()=>`${sel}<section class="panel"><p class="sub-h"><span>Yedekler</span><span>${sq.length-xi.length}</span></p><div class="fm-bench">${bench}</div></section>`],['tal','Talimatlar',()=>`<section class="panel"><p class="sub-h"><span>Taktik şablonu</span><span>${f.pre?PRESET[f.pre].n:'Özel'}</span></p><div class="filt">${Object.entries(PRESET).map(([k,v])=>`<button class="chip" data-act="fmPre" data-k="${k}" aria-pressed="${f.pre===k}">${v.n}</button>`).join('')}</div>
   <p class="sub-h" style="margin:10px 0 4px"><span>Ana yaklaşım</span></p><div class="filt">${Object.entries(TAC).map(([k,v])=>`<button class="chip" data-act="tac" data-k="${k}" aria-pressed="${m.tac===k}">${v.n}</button>`).join('')}</div></section>
   <section class="panel"><p class="sub-h"><span>Takım talimatları</span><span>${TI.filter(t=>f.ti[t.k]!==t.d).length} özel</span></p><div class="filt">${Object.entries(TI_G).map(([k,v])=>`<button class="chip" data-act="fmTab" data-k="${k}" aria-pressed="${FMT===k}">${v}</button>`).join('')}</div>${tiRows}</section>`],['ana','Analiz',()=>`<section class="panel"><p class="sub-h"><span>Taktik analizi</span><span>Asistan raporu</span></p>${bar('Hücum',d.atk)}${bar('Savunma',d.def)}${bar('Topa sahip olma',d.pos)}${bar('Pres',d.prs)}${bar('Uyum',Math.round(f.fam),'fam')}${bar('Takım kimyası',Math.round(clamp(50+harm(),0,100)),'har')}
   <ul class="fm-w">${d.W.map(([t,k])=>`<li class="${k}">${esc(t)}</li>`).join('')||'<li class="good">Sistem kadronla uyumlu görünüyor.</li>'}</ul></section>`]])}`;}
/* ---------- oyuncu ilişkileri ---------- */
const TALK={sure:{t:'forma şansı bulamadığı için ofisine geldi',q:'“Hocam, bu takımda yerimi hak ettiğimi düşünüyorum. Neden oynamıyorum?”',o:[['soz','4 hafta içinde en az 2 maça başlayacaksın (söz ver)'],['rek','Rekabet var, idmanda kendini göster'],['kapi','Mutlu değilsen gidebilirsin']]},
  olay:{t:'antrenmanda takım arkadaşıyla kavga etti',q:'Olay basına da yansıdı. Soyunma odası tepkini bekliyor.',o:[['ceza','Para cezası kes'],['ozel','Özel olarak konuş'],['disari','2 hafta kadro dışı bırak']]},
  taktik:{t:'oyun anlayışını basına eleştirdi',q:'“Bu kadar geride oynarsak kazanamayız. Daha cesur olmalıyız.”',o:[['dinle','Haklısın, değerlendireceğim'],['sert','Taktik benim işim'],['takim','Takım için oynamalısın']]},
  rol:{t:'sahadaki görevinden memnun değil',q:'“Bu mevkide verimli olamıyorum. Beni doğal yerimde oynatın.”',o:[['dinle','Haklısın, değerlendireceğim'],['sert','Takımın ihtiyacı bu'],['takim','Sana güveniyorum, uyum sağla']]}};
function talkAdd(p,type){const m=fmInit();if(m.talks.some(t=>t.k===p.k)||m.talks.length>=3)return;m.talks.push({k:p.k,type,w:G.s.week});msg('squad',`${p.name} seninle konuşmak istiyor`,`${p.name} ${TALK[type].t}. Kadro › Dinamik ekranından görüşebilirsin.`);}
function relWeek(){const m=fmInit(),sq=squadOf(G.club),xi=mgrXI(),c=myClub(),f=m.fm,S=FMF[f.f],wk=G.s.week;if(!sq.length)return;
  f.fam=Math.min(100,f.fam+3+sF('ana')*5+(UP('td_tahta')?1:0)+(UP('td_veri')?1.5:0));for(const k in m.ban){m.ban[k]--;if(m.ban[k]<=0)delete m.ban[k];}
  const top=sq.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,13).map(p=>p.k),R=squadRoles(G.club);
  for(const p of sq){const inX=xi.includes(p.k),ps=persOf(p),imp=top.includes(p.k)||R[p.k]==='Yıldız'||R[p.k]==='Kaptan';
    if(inX){m.bw[p.k]=0;relAdd(p,1);}else if(imp&&!(m.inj||{})[p.k]&&!m.ban[p.k]){m.bw[p.k]=(m.bw[p.k]||0)+1;if(m.bw[p.k]>=3)relAdd(p,ps==='Hırslı'||ps==='Asi'?-6:-3);if(m.bw[p.k]===3)talkAdd(p,'sure');}
    if(inX&&(ps==='Hırslı'||ps==='Asi')&&p.ovr>=c.str+2&&m.tac==='savunma'&&!(m.tw[p.k]>wk-6)&&Math.random()<0.35){m.tw[p.k]=wk;talkAdd(p,'taktik');}
    const i=xi.indexOf(p.k);if(i>=0&&S[i]&&dpPen(p,S[i])>=5&&ps!=='Profesyonel'&&!(m.tw[p.k]>wk-6)&&Math.random()<0.3){m.tw[p.k]=wk;talkAdd(p,'rol');}
    if(ps==='Asi'&&relOf(p)<5&&Math.random()<0.08)talkAdd(p,'olay');
    if(relOf(p)<=-45&&!m.trq[p.k]){m.trq[p.k]=1;msg('squad',`${p.name} kulüpten ayrılmak istiyor`,`${p.name} seninle anlaşamadığını açıkça söyledi ve transfer talep etti. Sahada isteksiz oynayacak (performans düşer). Konuşarak ilişkiyi düzeltebilir ya da satabilirsin.`);}
    if(m.trq[p.k]&&relOf(p)>-20)delete m.trq[p.k];}
  m.sw=m.sw||{};for(const [k,role] of Object.entries(m.stat||{})){const p=sq.find(x=>x.k===k);if(!p){delete m.stat[k];continue;}if(xi.includes(k)||(m.inj||{})[k]){m.sw[k]=0;continue;}m.sw[k]=(m.sw[k]||0)+1;
    if(role>=2&&m.sw[k]>=2){relAdd(p,role>=3?-8:-5);if(m.sw[k]===2)msg('squad',`${p.name} rolünden şikayetçi`,`${p.name}: “Sözleşmede bana ${roleName(role).toLowerCase()} rolü söz verilmişti ama oynamıyorum.”`);}}
  for(const pr of m.prom.slice()){const p=sq.find(x=>x.k===pr.k);if(!p){m.prom.splice(m.prom.indexOf(pr),1);continue;}if(xi.includes(pr.k))pr.got++;
    if(pr.got>=pr.need){relAdd(p,8);msg('squad','Sözünü tuttun',`${p.name} verdiğin sözü tuttuğun için mutlu.`);m.prom.splice(m.prom.indexOf(pr),1);}
    else if(wk>=pr.until){relAdd(p,-30);for(const q of sq)if(q.k!==p.k&&Math.random()<0.3)relAdd(q,-2);msg('squad','Söz tutulmadı',`${p.name}'e verdiğin forma sözünü tutmadın. Oyuncu çok kırgın; soyunma odasında da güven sarsıldı.`);m.prom.splice(m.prom.indexOf(pr),1);}}
  for(const w of m.watch||[]){const p=sq.find(x=>x.k===w.k);if(!p||wk<w.until)continue;w.done=true;const ok=w.type==='taktik'?m.tac!=='savunma':(()=>{const i=mgrXI().indexOf(p.k);return i<0||dpPen(p,S[i])<5;})();
    relAdd(p,ok?6:-15);msg('squad',ok?'Oyuncu memnun':'Oyuncu hayal kırıklığında',`${p.name}: ${ok?'“Söylediklerimi dikkate aldığınız için teşekkürler hocam.”':'“Değerlendireceğim demiştiniz ama hiçbir şey değişmedi.”'}`);}
  m.watch=(m.watch||[]).filter(w=>!w.done);
  if(tacDims().load>3&&Math.random()<0.25){const fit=sq.filter(p=>!(m.inj||{})[p.k]&&xi.includes(p.k));if(fit.length){const p=pick(fit),w=rint(1,4);m.inj[p.k]=w;msg('squad','Yüklenme sakatlığı',`${p.name} yoğun pres temposu nedeniyle sakatlandı (${w} hafta).`);}}}
function talkDo(i,o){const m=fmInit(),t=m.talks[i];if(!t)return;const sq=squadOf(G.club),p=sq.find(x=>x.k===t.k);m.talks.splice(i,1);if(!p){save();render();return;}
  const ps=persOf(p),ok=Math.random()<clamp(PERS_OK[ps]+((m.rep||40)-40)/200+sF('yrd')*0.12-0.06+(UP('td_lider')?0.1:0),0.05,0.95),wk=G.s.week,others=v=>{for(const q of sq)if(q.k!==p.k)relAdd(q,v);};let r='';
  if(t.type==='sure'){if(o==='soz'){relAdd(p,12);m.prom.push({k:p.k,until:wk+4,need:2,got:0});r=`${p.name} sözüne güvendi. 4 hafta içinde 2 maça başlatmalısın.`;}
    else if(o==='rek'){relAdd(p,ok?4:-10);r=ok?`${p.name} mesajı aldı: “Haklısınız, çalışıp formayı alacağım.”`:`${p.name} cevabından hiç hoşlanmadı.`;}
    else{relAdd(p,-20);m.trq[p.k]=1;r=`${p.name} transfer listesine girmek istediğini söyledi.`;}}
  else if(t.type==='olay'){if(o==='ceza'){relAdd(p,ps==='Asi'?-18:-10);others(2);r=`Para cezası kesildi. Takım otoriteni takdir etti; ${p.name} kızgın.`;}
    else if(o==='ozel'){relAdd(p,ok?10:-8);r=ok?`${p.name} hatasını kabul etti ve özür diledi.`:`${p.name} konuşmayı ciddiye almadı.`;}
    else{relAdd(p,-25);m.ban[p.k]=2;m.xi=null;others(3);r=`${p.name} iki hafta kadro dışı. Soyunma odasında disiplin mesajı alındı.`;}}
  else{if(o==='dinle'){relAdd(p,6);(m.watch=m.watch||[]).push({k:p.k,type:t.type,until:wk+2});r=`${p.name} iki hafta içinde değişiklik bekliyor.`;}
    else if(o==='sert'){relAdd(p,ps==='Asi'?-20:-12);others(1);r=`${p.name} sert cevabından sonra sessizleşti.`;}
    else{relAdd(p,ok?6:-10);r=ok?`${p.name}: “Tamam hocam, takım için elimden geleni yapacağım.”`:`${p.name} ikna olmadı.`;}}
  m.tlog=m.tlog||[];m.tlog.unshift({y:seasonLabel(G.s.year),w:wk,n:p.name,r});if(m.tlog.length>12)m.tlog.length=12;toast(r);save();render();}
function talkOpen(k){const m=fmInit(),p=squadOf(G.club).find(x=>x.k===k);if(!p)return;if(m.talks.some(t=>t.k===k)){KTAB='iliski';render();return;}
  if(m.tk&&m.tk[k]===G.s.week)return toast('Bu hafta bu oyuncuyla zaten konuştun');(m.tk=m.tk||{})[k]=G.s.week;
  const v=relOf(p),ok=Math.random()<clamp(PERS_OK[persOf(p)]+0.15,0.1,0.95);relAdd(p,ok?(v<0?7:3):-4);toast(ok?`${p.name} görüşmeden memnun ayrıldı`:`${p.name} görüşmede gerildi`);save();render();}
function talkAlert(){const m=fmInit();return m.talks.length?`<button class="talk-alert" data-act="goRel"><b>💬 ${m.talks.length} oyuncu seninle konuşmak istiyor</b><small>${m.talks.map(t=>{const p=pByKey(t.k);return p?esc(ksur(p.name)):'';}).join(', ')} · Dinamik ekranına git</small></button>`:'';}
function relView(){const m=fmInit(),sq=squadOf(G.club).slice().sort((a,b)=>relOf(a)-relOf(b)),xi=mgrXI(),h=harm(),hm=moodOf(h);
  const talks=m.talks.map((t,i)=>{const p=sq.find(x=>x.k===t.k);if(!p)return '';const T=TALK[t.type],L=lookOf(p.k,p.nat,p.age),c=myClub();
    return `<div class="talk"><div class="talk-hd"><div class="talk-face">${faceSVG(L,{c1:c.c1,c2:c.c2,num:p.num})}</div><div><b>${esc(p.name)}</b><small>${esc(persOf(p))} · ${moodOf(relOf(p))[1]} · ${dpTag(p)} ${R200(p.ovr)}</small></div></div><p class="talk-q">${esc(p.name)} ${T.t}.<br><i>${esc(T.q)}</i></p>
      <div class="talk-o">${T.o.map(([k,l])=>`<button class="btn" data-act="talk" data-i="${i}" data-k="${k}">${esc(l)}</button>`).join('')}</div></div>`;}).join('');
  const rows=sq.map(p=>{const v=relOf(p),md=moodOf(v),why=m.trq[p.k]?'Ayrılmak istiyor':m.ban[p.k]?'Kadro dışı':(m.bw[p.k]||0)>=3?`${m.bw[p.k]} haftadır oynamıyor`:m.prom.some(x=>x.k===p.k)?'Söz verildi':v<-20&&persOf(p)==='Asi'?'Otoriteni sorguluyor':v<-20?'Seninle anlaşamıyor':xi.includes(p.k)?'İlk 11':'';
    return `<div class="rel"><span class="md">${md[2]}</span><div><b>${esc(p.name)}</b><small>${dpTag(p)} ${R200(p.ovr)} · ${esc(persOf(p))}${why?' · '+why:''}</small></div><i class="relb"><em class="m-${md[0]}" style="width:${Math.round(clamp(50+v/2,3,100))}%"></em></i><button class="btn sm ghost" data-act="talkOpen" data-k="${p.k}">Konuş</button></div>`;}).join('');
  return `<section class="panel"><p class="sub-h"><span>Soyunma odası</span><span>${hm[2]} ${hm[1]}</span></p><p class="muted" style="margin:0">Takım kimyası maç gücünü etkiler. Uzun süre oynamayan önemli oyuncular, sözünü tutmaman, kişilik çatışmaları ve senden daha büyük isme sahip yıldızlar ilişkileri bozar. Mutsuz (−30 altı) oyuncular sahada isteksiz oynar.</p></section>
   ${stab('rel',[['gor',`Görüşmeler${m.talks.length?' · '+m.talks.length:''}`,()=>talks||'<section class="panel"><p class="muted" style="margin:0">Şu an seninle görüşmek isteyen oyuncu yok.</p></section>'],['ili','İlişkiler',()=>`<section class="panel"><p class="sub-h"><span>Oyuncu ilişkileri</span><span>${sq.length}</span></p>${rows}</section>`],['gec','Geçmiş',()=>(m.tlog||[]).length?`<section class="panel"><p class="sub-h"><span>Son görüşmeler</span></p><ul class="cupres">${m.tlog.map(l=>`<li><span>${l.w}. hf</span><b>${esc(l.n)}<small style="display:block;color:var(--chalk-3);font-size:11.5px">${esc(l.r)}</small></b></li>`).join('')}</ul></section>`:'<section class="panel"><p class="muted" style="margin:0">Henüz görüşme yapılmadı.</p></section>']])}`;}
function buyWhy(p,id){const m=G.m,ps=persOf(p),me=myClub();
  if(ps==='Asi'&&Math.random()<0.35)return 'Sözleşme şartlarında anlaşılamadı; oyuncunun talepleri çok yüksek';
  if((m.rep||30)<(p.ovr-45)*1.6&&Math.random()<0.5)return 'Teknik direktörün itibarı oyuncuyu ikna etmeye yetmedi';
  if(p.ovr>me.str+6&&Math.random()<0.45)return 'Oyuncu kulübün hedeflerini yeterince büyük bulmadı';
  if((ps==='Hırslı')&&m.tac==='savunma'&&(p.pos==='FW'||p.pos==='KN')&&Math.random()<0.5)return 'Oyun anlayışınızı fazla defansif buldu';
  return null;}
function mgrSquadView(){const t=KTAB,m=fmInit();return `<h2 class="h">Takım</h2><div class="filt">${[['taktik','Taktik'],['kadro','Kadro'],['soz','Sözleşme'],['ekip','Ekip'],['iliski',`Dinamik${m.talks.length?' · '+m.talks.length:''}`],['transfer','Transfer'],['gozlem','Gözlem']].map(([k,l])=>`<button class="chip" data-act="ktab" data-k="${k}" aria-pressed="${t===k}">${l}</button>`).join('')}</div>
  ${t==='taktik'?tacView():t==='soz'?contractsHTML():t==='ekip'?stfView():t==='iliski'?relView():t==='transfer'?trTabs():t==='gozlem'?scoutHTML():`<section class="panel">${squadHTML(G.club)}</section>`}`;}

