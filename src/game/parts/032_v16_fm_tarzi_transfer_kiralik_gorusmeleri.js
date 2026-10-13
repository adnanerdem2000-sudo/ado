/* ================= v16: FM tarzı transfer & kiralık görüşmeleri, sözleşmeler ================= */
const ROLE_ST=['Yedek','Rotasyon','İlk 11','Yıldız'],ROLE_ST2={'Gelecek vaat eden':0.5};
const INST={pesin:['Peşin',1],y2:['2 yıl taksit',0.94],y3:['3 yıl taksit',0.9]};
const rnd5=(v,s)=>Math.max(s,Math.round(v/s)*s);
const stepOf=v=>v>=5e7?1e6:v>=1e7?5e5:v>=2e6?1e5:v>=5e5?25000:v>=1e5?5000:v>=2e4?1000:500;
function lgWageF(lid){const L=LEAGUES[lid];if(!L)return 0.3;return ({9:1.25,8:0.72,7:0.32,6:0.15,5:0.08,4:0.04,3:0.02}[L.tier]||0.02)*(L.cc==='SA'?2.6:L.cc==='BR'?0.8:['SC','AT','DK'].includes(L.cc)?0.6:['GR','CH'].includes(L.cc)?0.7:1);}
function pWage(p,cid){cid=cid||scCidM(p);const m=G.m;if(m&&m.ct&&m.ct[p.k]&&cid===G.club)return m.ct[p.k].w;const c=CLUBS[cid];const w=900*Math.exp((p.ovr-60)/6.5)*lgWageF(c?c.league:'sl')*(0.85+(hash(p.k+'w')%30)/100);return rnd5(w,w>2e4?1000:100);}
const scCidM=p=>(G.tx&&G.tx[p.k])||p.home;
function ctEnd(p){const m=G.m;if(m&&m.ct&&m.ct[p.k])return m.ct[p.k].end;const Y=G.s?G.s.year:2026;let e=2027+hash(p.k+'ct')%4;while(e<=Y)e+=3;return e;}
function wageBill(){const sq=squadOf(G.club);return sq.reduce((a,p)=>a+pWage(p,G.club),0);}
function wbudInit(){const m=G.m;if(!m.wbud||m.wbClub!==G.club||m.wbY!==G.s.year){m.wbClub=G.club;m.wbY=G.s.year;m.wbud=rnd5(wageBill()*(1.06+((clubBudget(myClub())%7)/100)),1000);}return m.wbud;}
function askPrice(p,from){const me=myClub(),c=CLUBS[from],R=squadRoles(from)[p.k]||'Yedek',yl=ctEnd(p)-G.s.year;
  let a=pValue(p)*({Yıldız:1.6,Kaptan:1.5,'Takım lideri':1.35,'İlk 11':1.25,'Genç yetenek':1.3,Rotasyon:1,Yedek:0.85}[R]||1);
  a*=p.age<=23?1.15:p.age>=31?0.85:1;a*=({1:0.7,2:0.9,3:1,4:1.1}[yl]||1.15);if(c&&c.league===me.league)a*=1.2;if(c&&c.str>me.str+4)a*=1.1;
  a*=0.95+(hash(p.k+'ask'+G.s.year)%15)/100;return {a:rnd5(a,stepOf(a)),R,nfs:(R==='Yıldız'||R==='Kaptan')&&c&&c.str>=me.str-2,yl};}
function interestOf(p,from,type){const me=myClub(),c=CLUBS[from],m=G.m,ps=persOf(p),Lm=curLeague(),Lh=LEAGUES[c.league];let I=50+(me.str-c.str)*2.5+(Lm.tier-Lh.tier)*8+((m.rep||40)-40)*0.5;
  const q=G.qual||{};if((q.ucl||[]).includes(G.club))I+=10;if(CC3[Lm.cc]===p.nat)I+=8;else if(UP('td_dil'))I+=5;if(ps==='Hırslı')I+=(me.str-c.str)*1.5;if(ps==='Asi')I-=6;
  const R=squadRoles(from)[p.k];if(type==='loan'&&(R==='Rotasyon'||R==='Yedek'||R==='Genç yetenek'))I+=20;if(Lm.cc==='SA'&&p.age>=29)I+=15;if(Lm.cc==='SA'&&p.age<=25)I-=10;
  return Math.round(clamp(I,0,100));}
function wantRole(p){const sq=squadOf(G.club).filter(x=>x.k!==p.k).sort((a,b)=>b.ovr-a.ovr),rk=sq.filter(x=>x.ovr>p.ovr).length+1;let r=rk<=2?3:rk<=11?2:rk<=16?1:0;
  if(p.age<=21&&potOf(p)>=p.ovr+6&&r<2)return 0.5;if(persOf(p)==='Hırslı'&&r<3)r+=1;return r;}
const roleName=v=>v===0.5?'Gelecek vaat eden':ROLE_ST[v];
function negStart(from,k,type){const m=fmInit(),p=squadOf(from).find(x=>x.k===k);if(!p)return;if(!trWin())return toast('Transfer dönemi kapalı · '+twNextTxt());
  m.negCd=m.negCd||{};if(m.negCd[k]&&m.negCd[k]>G.s.day)return toast(`${CLUBS[from].short} bu oyuncu için bir süre görüşmek istemiyor`);
  const A=askPrice(p,from),wb=wbudInit();
  if(type==='loan'&&(A.R==='Yıldız'||A.R==='Kaptan'))return negMsgOnly(p,from,`${CLUBS[from].name}: “${p.name} kilit oyuncumuz, kiralık vermeyi düşünmüyoruz.”`);
  const I=interestOf(p,from,type);
  m.neg={k,from,type,st:'club',pat:3+(hash(from+'pat')%3),ppat:4,A:A.a,R:A.R,nfs:A.nfs,I,log:[],
    o:{fee:type==='loan'?0:rnd5(A.a*0.8,stepOf(A.a)),inst:'pesin',sell:0,add:0,dur:'sezon',wp:50,opt:'yok',optP:rnd5(A.a,stepOf(A.a))},
    c:{w:0,y:3,role:2,bon:0,ag:0,rc:0,ab:0,gb:0}};
  const n=m.neg;n.log.push(['club',A.nfs&&type==='tr'?`“${p.name} satılık değil. Ancak gerçekten olağanüstü bir teklif gelirse yönetime götürürüz.”`:type==='loan'?`“${p.name} için kiralama şartlarınızı dinleriz. Maaş katkısı ve oynama süresi bizim için önemli.”`:`“${p.name} için teklifinizi bekliyoruz.”`]);
  negOpen();}
function negMsgOnly(p,from,t){openModal(`<h3>Görüşme</h3><p>${esc(t)}</p><button class="cta" data-act="closeModal">Tamam</button>`);}
function negP(){const n=G.m.neg;return n?squadOf(n.from).find(x=>x.k===n.k):null;}
function offerVal(n){const o=n.o;return o.fee*INST[o.inst][1]+o.fee*o.sell/100*0.8+o.fee*o.add/100*0.5;}
function negClub(){const m=G.m,n=m.neg,p=negP();if(!n||!p)return;const o=n.o,c=CLUBS[n.from],A=n.A,bud=m.budget/EUR_TL;
  if(n.type==='tr'){if(o.fee*(o.inst==='pesin'?1:o.inst==='y2'?0.5:0.34)>bud)return toast('İlk ödeme transfer bütçeni aşıyor');
    const need=n.nfs?A*1.5:A,V=offerVal(n);n.log.push(['me',`Teklif: ${eur(o.fee)} (${INST[o.inst][0]})${o.sell?` + %${o.sell} sonraki satıştan pay`:''}${o.add?` + ${eur(o.fee*o.add/100)} bonus`:''}`]);
    if(V>=need){n.st='player';n.log.push(['club',`“Anlaştık. ${p.name} ile sözleşme görüşmesi yapabilirsiniz.”`]);negPlayerInit();}
    else if(V>=need*0.86){n.pat--;const f=rnd5((need-o.fee*o.sell/100*0.8-o.fee*o.add/100*0.5)/INST[o.inst][1],stepOf(need));n.cnt=f;
      n.log.push(['club',pick([`“Yakınız ama yeterli değil. ${eur(f)} olursa anlaşırız.”`,`“${eur(f)} altına inmeyiz.${o.sell?'':' Sonraki satıştan pay eklerseniz esneyebiliriz.'}”`])]);}
    else if(V>=need*0.65){n.pat--;const f=rnd5(need*1.05,stepOf(need));n.cnt=f;n.log.push(['club',`“Bu teklif oyuncunun değerini yansıtmıyor. Masaya ${eur(f)} gibi bir rakamla gelin.”`]);}
    else{n.pat-=2;n.log.push(['club',pick(['“Teklifiniz ciddi değil. Zamanımızı boşa harcamayın.”','“Bu rakamı yönetime götürmem bile mümkün değil.”'])]);}}
  else{const R=n.R,wpN=R==='İlk 11'?100:R==='Genç yetenek'?60:R==='Rotasyon'?50:40,feeAdj=Math.min(40,Math.floor(o.fee/(A*0.05))*10),wpOk=o.wp>=wpN-feeAdj;
    n.log.push(['me',`Kiralık: ${o.dur==='sezon'?'sezon sonuna kadar':'yarım sezon'} · maaşın %${o.wp}'i bizden${o.fee?` · ${eur(o.fee)} kiralama bedeli`:''}${o.opt!=='yok'?` · ${o.opt==='zor'?'zorunlu ':''}satın alma opsiyonu ${eur(o.optP)}`:''}`]);
    if(o.fee>bud)return toast('Kiralama bedeli bütçeni aşıyor');
    const optOk=o.opt==='yok'||(o.opt==='zor'?o.optP>=A*0.85:o.optP>=A*0.95),longOk=!(R==='İlk 11'&&o.dur==='yarim');
    if(wpOk&&optOk&&longOk){n.st='player';n.log.push(['club',`“Kiralama şartları uygun.${R==='Genç yetenek'?' Ama oyuncumuzun düzenli forma bulması şart.':''} Oyuncuyla konuşabilirsiniz.”`]);if(R==='Genç yetenek')n.needPT=1;negPlayerInit();}
    else{n.pat--;n.log.push(['club',!wpOk?`“Maaşın en az %${Math.max(25,wpN-feeAdj)}'ini karşılamalısınız${feeAdj<40?' ya da kiralama bedeli ödemelisiniz':''}.”`:!optOk?`“Opsiyon bedeli çok düşük, en az ${eur(rnd5(A*(o.opt==='zor'?0.85:0.95),stepOf(A)))} olmalı.”`:'“Bu oyuncuyu yarım sezonluğuna vermeyiz.”']);}}
  if(n.pat<=0&&n.st==='club'){n.st='fail';G.m.negCd=G.m.negCd||{};G.m.negCd[n.k]=G.s.day+30;n.log.push(['club','“Görüşmeleri burada bitiriyoruz.”']);msg('board',`Görüşme bitti: ${p.name}`,`${c.name} ${p.name} için görüşmeleri kesti. 30 gün boyunca yeni teklif kabul etmeyecekler.`);}
  save();negOpen();}
function negPlayerInit(){const n=G.m.neg,p=negP(),me=myClub();const cw=pWage(p,n.from),base=pWage(p,G.club);
  const I=n.I,ps=persOf(p);if(I<18){n.st='fail';const w=buyWhy(p,n.from)||'Kulübünüzün projesi ona cazip gelmedi';n.log.push(['ag',`Menajer: “Müvekkilim görüşmeye kapalı. ${w}.”`]);G.m.negCd=G.m.negCd||{};G.m.negCd[n.k]=G.s.day+45;return;}
  const loan=n.type==='loan';n.d={w:rnd5(Math.max(cw*(loan?1:1.12+(I<45?(45-I)/90:0)),base)*(ps==='Hırslı'?1.08:1),cw>2e4?1000:100),y:loan?0:p.age<=23?5:p.age<=29?4:p.age<=32?3:2,role:n.needPT?Math.max(2,wantRole(p)):wantRole(p),
    rc:!loan&&(ps==='Hırslı'||p.ovr>=me.str+4)&&hash(p.k+'rc')%3>0,ag:loan?rnd5(cw*8,500):rnd5(Math.max(n.o.fee*0.06,cw*10),1000),bon:loan?0:rnd5(cw*(6+hash(p.k+'b')%10),1000)};
  if(loan)n.d.w=Math.round(cw*(n.o.wp/100));
  const d=n.d;n.c={w:rnd5(d.w*0.85,d.w>2e4?1000:100),y:d.y||1,role:Math.floor(d.role),bon:rnd5(d.bon*0.6,500),ag:rnd5(d.ag*0.6,500),rc:d.rc?rnd5(n.A*2,stepOf(n.A)):0,ab:0,gb:0};
  n.log.push(['ag',`Menajer: “${p.name} ${loan?'kiralık gelmeye sıcak bakıyor':'kulübünüzle konuşmaya hazır'}. Beklentilerimiz: haftalık ${eur(d.w)}${d.y?`, ${d.y} yıl`:''}, ${roleName(d.role).toLowerCase()} rolü${d.rc?', serbest kalma maddesi':''}. Benim ücretim ${eur(d.ag)}.”`]);}
function negScore(){const n=G.m.neg,d=n.d,c=n.c,p=negP();const parts=[];
  const wr=c.w/d.w;parts.push(['Maaş',wr>=1?Math.min(10,(wr-1)*40):wr>=0.92?(wr-1)*120:-15+(wr-0.92)*200]);
  if(d.y)parts.push(['Süre',-Math.max(0,Math.abs(c.y-d.y)-(p.age>=30&&c.y>d.y?1:0))*7]);
  const rr=c.role-d.role;parts.push(['Rol',rr>=0?Math.min(6,rr*6):rr*16]);
  if(d.bon)parts.push(['İmza parası',clamp((c.bon/d.bon-1)*14,-12,6)]);
  parts.push(['Menajer ücreti',clamp((c.ag/d.ag-1)*22,-18,5)]);
  if(d.rc)parts.push(['Serbest kalma maddesi',c.rc?(c.rc<=n.A*2.2?4:0):-16]);else if(c.rc)parts.push(['Serbest kalma maddesi',c.rc<=n.A*1.3?5:2]);
  if(c.ab)parts.push(['Maç primi',3]);if(c.gb&&(p.pos==='FW'||p.pos==='KN'))parts.push(['Gol primi',4]);
  const tot=parts.reduce((a,x)=>a+x[1],0)+(n.I-50)*0.12+3;return {tot,parts};}
function negPlayer(){const m=G.m,n=m.neg,p=negP();if(!n||n.st!=='player'||!p)return;const c=n.c,bud=m.budget/EUR_TL,wb=wbudInit(),bill=wageBill();
  const cost=(n.type==='tr'?n.o.fee*(n.o.inst==='pesin'?1:n.o.inst==='y2'?0.5:0.34):n.o.fee)+c.ag+c.bon;
  if(cost>bud)return toast(`Toplam ilk ödeme (${eur(cost)}) bütçeni aşıyor`);
  const myW=n.type==='renew'?c.w-pWage(p,G.club):c.w;if(bill+myW>wb*1.0)return toast(`Maaş bütçesi yetmiyor (${eur(bill)} + ${eur(myW)} > ${eur(wb)}/hf)`);
  const S=negScore(),worst=S.parts.slice().sort((a,b)=>a[1]-b[1])[0];
  n.log.push(['me',`Teklif: haftalık ${eur(c.w)}${n.type==='tr'?`, ${c.y} yıl`:''}, rol: ${roleName(c.role)}${c.bon?`, imza ${eur(c.bon)}`:''}, menajer ${eur(c.ag)}${c.rc?`, serbest kalma ${eur(c.rc)}`:''}`]);
  if(S.tot>=0){negDone();return;}
  n.ppat-=1+(n.lastS!=null&&S.tot<=n.lastS+1?1:0);n.lastS=S.tot;const dd=n.d;
  const hint={Maaş:`haftalık ${eur(dd.w)} altı bizim için kabul edilemez`,Süre:`müvekkilim ${dd.y} yıllık bir sözleşme istiyor`,Rol:`${roleName(dd.role).toLowerCase()} statüsü verilmezse gelmez`,'İmza parası':`imza parası en az ${eur(rnd5(dd.bon*0.9,500))} olmalı`,'Menajer ücreti':`benim ücretim ${eur(rnd5(dd.ag*0.9,500))} altında olamaz`,'Serbest kalma maddesi':'sözleşmeye serbest kalma maddesi konmalı'}[worst[0]]||'şartlar yetersiz';
  if(n.ppat<=0){n.st='fail';m.negCd=m.negCd||{};m.negCd[n.k]=G.s.day+45;n.log.push(['ag',`Menajer: “Görüşmeyi sonlandırıyoruz. ${p.name} başka seçenekleri değerlendirecek.”`]);msg('board',`Sözleşme görüşmesi başarısız: ${p.name}`,`${p.name} ile şahsi şartlarda anlaşılamadı.`);}
  else n.log.push(['ag',`Menajer: “${S.tot>-12?'Yaklaştık ama ':''}${hint}.”`]);save();negOpen();}
function negDone(){const m=G.m,n=m.neg,p=negP(),c=n.c,o=n.o,from=n.from,me=myClub();
  if(n.type==='renew'){m.budget-=(c.ag+c.bon)*EUR_TL;m.ct=m.ct||{};m.ct[n.k]={w:c.w,end:G.s.year+c.y,role:c.role,rc:c.rc};m.stat=m.stat||{};m.stat[n.k]=c.role;relAdd(p,8);n.st='done';n.log.push(['ag',`Menajer: “Anlaştık. ${p.name} ${G.s.year+c.y} yılına kadar kulüpte.”`]);
    msg('board',`Sözleşme yenilendi: ${p.name}`,`${p.name} ${G.s.year+c.y} yazına kadar yeni sözleşme imzaladı. Haftalık ${eur(c.w)}, rol: ${roleName(c.role)}.`);save();negOpen();return;}
  let first=n.type==='tr'?o.fee*(o.inst==='pesin'?1:o.inst==='y2'?0.5:0.34):o.fee;m.budget-=(first+c.ag+c.bon)*EUR_TL;
  if(n.type==='tr'&&o.inst!=='pesin'){m.inst=m.inst||[];const nI=o.inst==='y2'?1:2;for(let i=1;i<=nI;i++)m.inst.push({y:G.s.year+i,a:o.fee*(o.inst==='y2'?0.5:0.33),k:n.k,c:from});}
  G.tx=G.tx||{};G.tx[n.k]=G.club;txNote(n.k,G.club,typeof price==='number'&&price<1e10?price:undefined);m.ct=m.ct||{};m.ct[n.k]={w:c.w,end:n.type==='loan'?G.s.year+1:G.s.year+c.y,role:c.role,rc:c.rc,from};
  if(n.type==='loan'){m.loans=m.loans||{};m.loans[n.k]={from,y:G.s.year,opt:o.opt==='yok'?0:o.optP,mand:o.opt==='zor',half:o.dur==='yarim',pt:!!n.needPT};}
  if(o.sell){m.sellOn=m.sellOn||{};m.sellOn[n.k]={c:from,pct:o.sell};}
  m.wbud=Math.max(m.wbud,wageBill());syncStr(G.club);syncStr(from);m.xi=null;m.stat=m.stat||{};m.stat[n.k]=c.role;relOf(p);relAdd(p,18);
  n.st='done';n.log.push(['ag',`Menajer: “Anlaştık! ${p.name} sağlık kontrolünden geçti ve imzayı attı.”`]);
  msg('board',`${n.type==='loan'?'Kiralık':'Transfer'}: ${p.name}`,`${p.name} ${CLUBS[from].name} kulübünden ${n.type==='loan'?'kiralık olarak':eur(o.fee)+' bedelle'} kadromuza katıldı. Haftalık maaş ${eur(c.w)}, rol: ${roleName(c.role)}.`);
  toast(`${p.name} imzaladı!`);save();negOpen();}
function loansEnd(){const m=G.m;if(!m||!m.loans)return;m.optOf=[];for(const [k,l] of Object.entries(m.loans)){const p=pByKey(k);
    if(l.mand&&m.budget>=l.opt*EUR_TL){m.budget-=l.opt*EUR_TL;m.ct[k].end=G.s.year+4;msg('board','Zorunlu opsiyon',`${p?p.name:'Oyuncu'} için ${eur(l.opt)} bonservis ödendi; artık bizim oyuncumuz.`);}
    else{G.tx[k]=l.from;txNote(k,l.from,typeof price==='number'&&price<1e10?price:undefined);delete m.ct[k];if(l.opt)m.optOf.push({k,from:l.from,price:l.opt});msg('squad','Kiralık dönüş',`${p?p.name:'Oyuncu'} kiralık süresi bitti ve ${CLUBS[l.from].name} kulübüne döndü.${l.opt?` ${eur(l.opt)} opsiyonu yaz boyunca kullanılabilir.`:''}`);syncStr(l.from);}
    delete m.loans[k];}syncStr(G.club);m.xi=null;}
function optUse(i){const m=G.m,o=(m.optOf||[])[i];if(!o)return;if(m.budget<o.price*EUR_TL)return toast('Bütçen yetmiyor');const p=pByKey(o.k);m.budget-=o.price*EUR_TL;G.tx[o.k]=G.club;txNote(o.k,G.club,o.price);m.ct[o.k]={w:pWage(p,o.from),end:G.s.year+4,role:2};m.optOf.splice(i,1);syncStr(G.club);syncStr(o.from);m.xi=null;toast(`${p.name} satın alındı`);save();render();}
function instPay(){const m=G.m;if(!m||!m.inst)return;const due=m.inst.filter(x=>x.y<=G.s.year+1);if(!due.length)return;const t=due.reduce((a,x)=>a+x.a,0);m.budget-=t*EUR_TL;m.inst=m.inst.filter(x=>x.y>G.s.year+1);msg('board','Taksit ödemeleri',`Önceki transferlerin taksitleri için ${eur(t)} bütçeden düşüldü.`);}
/* ---------- görüşme ekranı ---------- */
function negStep(f,d){const n=G.m.neg;if(!n)return;const o=n.o,c=n.c;
  if(f==='fee'||f==='optP'){const b=f==='fee'?o:o;const s=stepOf(n.A);b[f]=Math.max(0,b[f]+d*s);}
  else if(f==='w'){c.w=Math.max(100,c.w+d*stepOf(n.d.w*4)/4);c.w=Math.round(c.w);}
  else if(f==='bon'||f==='ag'){c[f]=Math.max(0,c[f]+d*stepOf(Math.max(n.d[f],1e4)));}
  else if(f==='rc'){c.rc=Math.max(0,c.rc+d*stepOf(n.A*2));}
  negOpen();}
function negSet(f,v){const n=G.m.neg;if(!n)return;if(['inst','dur','opt'].includes(f))n.o[f]=v;else if(['sell','add','wp'].includes(f))n.o[f]=+v;else if(['y','role','ab','gb'].includes(f))n.c[f]=+v;negOpen();}
function negOpen(){const m=G.m,n=m.neg,p=negP();if(!n||!p){closeModal();return;}const c=CLUBS[n.from],me=myClub(),o=n.o,cc=n.c,R=n.R,bud=m.budget/EUR_TL;
  const L=lookOf(p.k,p.nat,p.age),stp=(f,v,sub)=>`<div class="ng-stp"><button class="btn sm" data-act="ngA" data-f="${f}" data-d="-1">−</button><b>${v}</b><button class="btn sm" data-act="ngA" data-f="${f}" data-d="1">+</button>${sub?`<small>${sub}</small>`:''}</div>`;
  const chips=(f,opts,cur)=>`<div class="seg2">${opts.map(([k,l])=>`<button class="chip" data-act="ngS" data-f="${f}" data-k="${k}" aria-pressed="${String(cur)===String(k)}">${l}</button>`).join('')}</div>`;
  const pat=(v,mx)=>`<span class="ng-pat">${'●'.repeat(Math.max(0,v))}${'○'.repeat(Math.max(0,mx-v))}</span>`;
  const head=`<div class="ng-hd"><div class="ng-face">${faceSVG(L,{c1:c.c1,c2:c.c2,num:p.num})}</div><div class="ng-id"><b>${esc(p.name)}</b><small>${flagImg(p.nat,'fl-row')} ${dpTag(p)} · ${p.age} yaş · ${esc(c.name)}</small><small>${esc(R)} · ${esc(persOf(p))} · sözleşme ${ctEnd(p)}</small></div><div class="ng-ovr"><b>${R200(p.ovr)}</b><small>POT ${(r=>potTxt(r[0],r[1]))(pPot(p))}</small></div></div>
   <div class="ng-steps">${['Kulüp','Oyuncu','İmza'].map((s,i)=>`<span class="${(n.st==='club'&&i===0)||(n.st==='player'&&i===1)||(n.st==='done'&&i===2)?'on':''}${(n.st==='player'&&i<1)||(n.st==='done'&&i<2)?' ok':''}">${i+1}. ${s}</span>`).join('')}</div>`;
  const log=`<div class="ng-log">${n.log.slice(-6).map(([w,t])=>`<p class="ng-${w}"><i>${w==='me'?'Sen':w==='club'?`${esc(c.name)} · sportif direktör`:'Menajer'}</i>${esc(t)}</p>`).join('')}</div>`;
  let body='';
  if(n.st==='club'&&n.type==='tr'){body=`<div class="ng-info"><span>Piyasa değeri <b>${eur(pValue(p))}</b></span><span>Bütçe <b>${eur(bud)}</b></span><span>Sabır ${pat(n.pat,5)}</span></div>
    <p class="ng-l">Bonservis</p>${stp('fee',eur(o.fee),n.cnt?`Son karşı teklif: ${eur(n.cnt)}`:'')}
    <p class="ng-l">Ödeme</p>${chips('inst',Object.entries(INST).map(([k,v])=>[k,v[0]]),o.inst)}
    <p class="ng-l">Sonraki satıştan pay</p>${chips('sell',[[0,'Yok'],[10,'%10'],[20,'%20'],[30,'%30']],o.sell)}
    <p class="ng-l">Performans bonusları</p>${chips('add',[[0,'Yok'],[5,'+%5'],[10,'+%10'],[20,'+%20']],o.add)}
    <button class="cta" data-act="ngClub">Teklifi gönder</button>`;}
  else if(n.st==='club'){body=`<div class="ng-info"><span>Maaşı <b>${eur(pWage(p,n.from))}/hf</b></span><span>Bütçe <b>${eur(bud)}</b></span><span>Sabır ${pat(n.pat,5)}</span></div>
    <p class="ng-l">Süre</p>${chips('dur',[['yarim','Yarım sezon'],['sezon','Sezon sonuna kadar']],o.dur)}
    <p class="ng-l">Maaş katkısı (bizim ödeyeceğimiz)</p>${chips('wp',[[25,'%25'],[50,'%50'],[75,'%75'],[100,'%100']],o.wp)}
    <p class="ng-l">Kiralama bedeli</p>${stp('fee',eur(o.fee))}
    <p class="ng-l">Satın alma opsiyonu</p>${chips('opt',[['yok','Yok'],['ops','Opsiyonlu'],['zor','Zorunlu']],o.opt)}${o.opt!=='yok'?stp('optP',eur(o.optP)):''}
    <button class="cta" data-act="ngClub">Kiralama teklifi gönder</button>`;}
  else if(n.st==='player'){const S=negScore(),bill=wageBill(),wb=wbudInit();body=`<div class="ng-info"><span>Maaş bütçesi <b>${eur(bill)}/${eur(wb)}</b></span><span>İlgi <b>${n.I}</b></span><span>Sabır ${pat(n.ppat,4)}</span></div>
    <div class="ng-mood"><i><em style="width:${Math.round(clamp(50+S.tot*1.4,3,100))}%"></em></i><small>${S.tot>=0?'Menajer bu şartlardan memnun görünüyor':S.tot>-12?'Yakın, ama bir iki madde eksik':'Beklentilerin oldukça altında'}</small></div>
    <p class="ng-l">Haftalık maaş</p>${stp('w',eur(cc.w),`Beklenti ~${eur(rnd5(n.d.w*(0.95+(hash(n.k)%10)/100),100))}`)}
    ${n.type!=='loan'?`<p class="ng-l">Sözleşme süresi</p>${chips('y',[[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5 yıl']],cc.y)}`:''}
    <p class="ng-l">Kadro rolü (söz)</p>${chips('role',[[0,'Yedek'],[1,'Rotasyon'],[2,'İlk 11'],[3,'Yıldız']],cc.role)}
    ${n.type!=='loan'?`<p class="ng-l">İmza parası</p>${stp('bon',eur(cc.bon))}<p class="ng-l">Serbest kalma maddesi</p>${stp('rc',cc.rc?eur(cc.rc):'Yok')}`:''}
    <p class="ng-l">Menajer ücreti</p>${stp('ag',eur(cc.ag))}
    <p class="ng-l">Primler</p><div class="seg2"><button class="chip" data-act="ngS" data-f="ab" data-k="${cc.ab?0:1}" aria-pressed="${!!cc.ab}">Maç primi</button><button class="chip" data-act="ngS" data-f="gb" data-k="${cc.gb?0:1}" aria-pressed="${!!cc.gb}">Gol primi</button></div>
    <p class="muted" style="margin:6px 0 0">Verdiğin rol bir sözdür: ${roleName(cc.role)} statüsündeki oyuncu yeterince oynamazsa mutsuz olur.</p>
    <button class="cta" data-act="ngPl">Sözleşmeyi öner</button>`;}
  else if(n.st==='done')body=`<div class="ng-res ok">✔ ${esc(p.name)} ${n.type==='loan'?'kiralık olarak':''} kadromuzda!</div><button class="cta" data-act="ngClose">Kadroya git</button>`;
  else body=`<div class="ng-res bad">✖ Görüşme başarısız</div><button class="btn" data-act="closeModal" style="width:100%">Kapat</button>`;
  openModal(`<div class="ng"><p class="sub-h"><span>${n.type==='loan'?'Kiralık görüşmesi':n.type==='renew'?'Sözleşme yenileme':n.type==='free'?'Serbest oyuncu':'Transfer görüşmesi'}</span><span>${crestSVG(me,18)} ${esc(me.short)}</span></p>${head}${log}${body}${n.st==='club'||n.st==='player'?'<button class="btn ghost" data-act="ngQuit" style="width:100%;margin-top:6px">Görüşmeden çekil</button>':''}</div>`);}
/* ---------- FM tarzı oyuncu profili (TD) ---------- */
function bestRoles(p){const kinds=Object.keys(FMR).filter(k=>({GK:'KL',CB:'DF',FB:'DF',DM:'OS',CM:'OS',AM:'OS',WM:'KN',W:'KN',ST:'FW'})[k]===p.pos);const out=[];for(const k of kinds)for(const r of FMR[k])out.push([r[1],roleFit(p,r[0])]);return out.sort((a,b)=>b[1]-a[1]).slice(0,3);}
function mgrProfile(p,c){const m=G.m,mine=c.id===G.club,R=squadRoles(c.id)[p.k],A=mine?null:askPrice(p,c.id),loan=m.loans&&m.loans[p.k],at=pAttrs(p);
  const col=v=>v>=85?'a5':v>=75?'a4':v>=65?'a3':v>=55?'a2':'a1';
  return `<section class="fm-prof"><div class="fp-row"><div><small>Sözleşme</small><b>${ctEnd(p)}${loan?' · kiralık':''}</b></div><div><small>Maaş</small><b>${eur(pWage(p,c.id))}/hf</b></div><div><small>Değer</small><b>${eur(pValue(p))}</b></div></div>
   <div class="fp-row"><div><small>Kişilik</small><b>${esc(persOf(p))}</b></div><div><small>Durum</small><b>${esc(R||'—')}</b></div><div><small>${mine?'Moral':'Transfer'}</small><b>${mine?moodOf(relOf(p))[2]+' '+moodOf(relOf(p))[1]:A.nfs?'Satılık değil':R==='Rotasyon'||R==='Yedek'?'Kiralığa uygun':'Pazarlığa açık'}</b></div></div>
   <div class="fp-attr">${at.map(([l,v])=>`<div><span>${l}</span><b class="${col(v)}">${v}</b></div>`).join('')}</div>
   <p class="fp-l">En uygun roller</p><div class="fp-roles">${bestRoles(p).map(([n,v])=>`<span>${esc(n)} <em>${'★'.repeat(fitStars(v))||'☆'}</em></span>`).join('')}</div>
   ${!mine?`<p class="fp-l">Tahmini istenen bedel <b>${eur(rnd5(A.a*0.9,stepOf(A.a)))} – ${eur(rnd5(A.a*1.15,stepOf(A.a)))}</b></p>`:''}</section>`;}
function optPanel(){const m=G.m;if(!m||!(m.optOf||[]).length)return '';return `<section class="panel"><p class="sub-h"><span>Satın alma opsiyonları</span><span>${m.optOf.length}</span></p>${m.optOf.map((o,i)=>{const p=pByKey(o.k);return p?`<div class="rq"><div><b>${esc(p.name)}</b><small>${dpTag(p)} ${R200(p.ovr)} · ${esc(CLUBS[o.from].short)} · ${eur(o.price)}</small></div><button class="cta sm" data-act="optUse" data-i="${i}">Opsiyonu kullan</button></div>`:'';}).join('')}</section>`;}

function applyTheme(){document.body.classList.toggle('pro',setsGet().theme!=='klasik');}
