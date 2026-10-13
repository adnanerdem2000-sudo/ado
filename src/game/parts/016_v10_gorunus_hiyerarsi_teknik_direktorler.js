const NAT_TR={ALB:'Arnavutluk',ALG:'Cezayir',ANG:'Angola',ARG:'Arjantin',AUS:'Avustralya',AUT:'Avusturya',AZE:'Azerbaycan',BDI:'Burundi',BEL:'Belçika',BEN:'Benin',BFA:'Burkina Faso',BIH:'Bosna-Hersek',BRA:'Brezilya',BUL:'Bulgaristan',CAN:'Kanada',CGO:'Kongo',CHA:'Çad',CHI:'Şili',CIV:'Fildişi Sahili',CMR:'Kamerun',COD:'DR Kongo',COL:'Kolombiya',COM:'Komorlar',CPV:'Yeşil Burun',CRO:'Hırvatistan',CTA:'Orta Afrika',CUW:'Curaçao',CZE:'Çekya',DEN:'Danimarka',DOM:'Dominik Cum.',ECU:'Ekvador',EGY:'Mısır',ENG:'İngiltere',EQG:'Ekvator Ginesi',ESP:'İspanya',EST:'Estonya',FIN:'Finlandiya',FRA:'Fransa',GAB:'Gabon',GAM:'Gambiya',GEO:'Gürcistan',GER:'Almanya',GHA:'Gana',GLP:'Guadeloupe',GNB:'Gine-Bissau',GRE:'Yunanistan',GUI:'Gine',HAI:'Haiti',HON:'Honduras',HUN:'Macaristan',IDN:'Endonezya',IRL:'İrlanda',ISL:'İzlanda',ISR:'İsrail',ITA:'İtalya',JAM:'Jamaika',JOR:'Ürdün',JPN:'Japonya',KOR:'Güney Kore',KOS:'Kosova',KVX:'Kosova',KSA:'Suudi Arabistan',LBR:'Liberya',MAD:'Madagaskar',MAR:'Fas',MAS:'Malezya',MEX:'Meksika',MKD:'K. Makedonya',MLI:'Mali',MNE:'Karadağ',MTN:'Moritanya',MTQ:'Martinik',NED:'Hollanda',NGA:'Nijerya',NIR:'K. İrlanda',NOR:'Norveç',NZL:'Yeni Zelanda',PAN:'Panama',PAR:'Paraguay',PHI:'Filipinler',POL:'Polonya',POR:'Portekiz',ROU:'Romanya',RUS:'Rusya',SCO:'İskoçya',SEN:'Senegal',SLO:'Slovenya',SVN:'Slovenya',SRB:'Sırbistan',SUI:'İsviçre',SUR:'Surinam',SVK:'Slovakya',SWE:'İsveç',TAN:'Tanzanya',TOG:'Togo',TUN:'Tunus',TUR:'Türkiye',UKR:'Ukrayna',URU:'Uruguay',USA:'ABD',UZB:'Özbekistan',VEN:'Venezuela',WAL:'Galler',ZAM:'Zambiya',GUA:'Guatemala',CRC:'Kosta Rika',CUB:'Küba',KEN:'Kenya',ZIM:'Zimbabve',RSA:'Güney Afrika',UGA:'Uganda',RWA:'Ruanda',LUX:'Lüksemburg',CYP:'Kıbrıs',QAT:'Katar',IRN:'İran',IRQ:'Irak',SYR:'Suriye',LBY:'Libya',CHN:'Çin',BOL:'Bolivya',PER:'Peru',LTU:'Litvanya',LVA:'Letonya',ARM:'Ermenistan',BLR:'Belarus',MDA:'Moldova',SLE:'Sierra Leone',NIG:'Nijer',SUD:'Sudan',ETH:'Etiyopya',UAE:'BAE',FRO:'Faroe Adaları',MLT:'Malta'};
const natName=n=>NAT_TR[n]||n;
function flagImg(n,cls){const u=FLAGS[n];return u?`<img class="flag ${cls||''}" src="${u}" alt="${esc(natName(n))}" title="${esc(natName(n))}" width="60" height="45" loading="lazy">`:`<b class="flag-txt ${cls||''}">${esc(n)}</b>`;}
/* ---------- Oyuncu görünüşü: uyruğa göre ten, saç, sakal, krampon ---------- */
const SKN=['#f6d6bd','#efc6a2','#e2b088','#d39c6e','#c08559','#a8704a','#8c5a39','#6e4329','#52301d'];
const NAT_G={};
'CIV SEN NGA GHA CMR MLI COD GUI BFA GAB ANG TOG BEN GAM ZAM ZIM RSA KEN HAI JAM CPV GNB EQG SLE LBR CGO CTA MOZ TAN UGA SUD ETH ERI BDI RWA MTN NIG COM MAD TRI'.split(' ').forEach(n=>NAT_G[n]='dark');
'BRA COL ECU VEN PAN CRC HON SUR USA CAN URU CUB DOM'.split(' ').forEach(n=>NAT_G[n]='mix');
'FRA ENG NED BEL POR'.split(' ').forEach(n=>NAT_G[n]='mix2');
'TUR MAR ALG TUN EGY ESP ITA GRE ARG MEX IRN KSA QAT UAE IRQ SYR LIB JOR PAR CHI PER BOL AZE GEO ARM ALB KOS MKD ISR CYP MLT MNE LBY PLE'.split(' ').forEach(n=>NAT_G[n]='med');
'JPN KOR CHN PRK VIE THA IDN PHI UZB KAZ MAS KGZ'.split(' ').forEach(n=>NAT_G[n]='east');
const SKW={light:[3,4,3,1,.3,.1,0,0,0],med:[.2,1,3,3,2,.7,.2,0,0],mix:[.3,.8,1.5,2,2,1.6,1.3,1,.6],mix2:[2,2.4,1.6,.8,.6,.7,.9,1,.8],dark:[0,0,0,0,.1,.5,1.6,3,2.6],east:[1,3,2,.5,0,0,0,0,0]};
const HCOL={blond:'#c9a35e',lbrown:'#7a5230',brown:'#4a2f18',dark:'#2b1a10',black:'#120b07',red:'#9a4a22'};
function mixC(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));const x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('');}
const LKC={};
function lookOf(seed,nat,age,coach){const ck=seed+'|'+age+'|'+(coach?1:0);if(LKC[ck])return LKC[ck];
  const r=srng(seed+'lk'),g=NAT_G[nat]||'light',W=SKW[g];
  const wp=a=>{const t=a.reduce((x,y)=>x+y,0);let v=r()*t;for(let i=0;i<a.length;i++){if((v-=a[i])<=0)return i;}return a.length-1;};
  const si=wp(W),sk=g==='east'?['#f3d2ad','#ecc79c','#e0b78a'][wp([1,2,1])]:SKN[si];
  let hc;if(si>=5||g==='east'||g==='dark')hc=HCOL.black;else if(g==='light'||(g==='mix2'&&si<=2))hc=[HCOL.blond,HCOL.lbrown,HCOL.brown,HCOL.dark,HCOL.red][wp([2.2,2.5,2.5,1.5,.3])];else hc=[HCOL.brown,HCOL.dark,HCOL.black][wp([1,2,2])];
  const dk=si>=6;let hs=dk?['buzz','afro','curly','dread','bald','fade','short'][wp([3,1,2,1,1,2,1])]:['short','side','buzz','curly','long','bun','bald','fade','mohawk'][wp([3,2.5,2,1,1,.5,.6,2,.4])];
  if(g==='east')hs=['short','side','fade','long'][wp([3,3,2,.6])];
  let bd=null;if(age>=21&&r()<(coach?0.45:0.42))bd=['stub','stub','full','goatee','mus'][wp([2,1,1.2,.8,.4])];
  if(coach){if(age>=58&&r()<0.45)hs='bald';else if(['long','bun','dread','mohawk','afro'].includes(hs))hs=['short','side','buzz'][Math.floor(r()*3)];}
  const grey=coach?clamp((age-40)/26,0,1)*(0.55+r()*0.5):age>=34?0.12:0;
  const boot=['#14161a','#14161a','#f4f4f4','#ff4f9a','#39d0ff','#c6ff3d','#ff7a1f','#ffd400'][wp([4,2,1.4,.8,.9,.9,.7,.6])];
  return LKC[ck]={sk,hc:grey>0.04?mixC(hc,'#d9d9d9',Math.min(1,grey)):hc,hs,bd,fw:17.6+r()*2.4,ey:g==='light'&&r()<0.25?'#3d6a8a':'#1a120c',gl:!!coach&&r()<0.22,boot,hgt:0.95+r()*0.1,bld:0.92+r()*0.16,suit:['#20242b','#1b2433','#2e3138','#13161b'][Math.floor(r()*4)]};}
function hairSVG(L,front){const f=L.fw,hc=L.hc,a=50-f,b=50+f;
  if(!front){if(L.hs==='afro')return `<circle cx="50" cy="30" r="${f+9}" fill="${hc}"/>`;
    if(L.hs==='long')return `<path d="M${a-3} 40 Q${a-4} 14 50 14 Q${b+4} 14 ${b+3} 40 L${b+4} 70 Q${b-2} 74 ${b-4} 62 L${a+4} 62 Q${a+2} 74 ${a-4} 70Z" fill="${hc}"/>`;
    if(L.hs==='dread')return `<g stroke="${hc}" stroke-width="3.6" stroke-linecap="round" fill="none">${[-4,-3,-2,-1,0,1,2,3,4].map(i=>`<path d="M${50+i*4.4} 22 Q${50+i*5.4} 44 ${50+i*5.9} ${62+(i&1)*5}"/>`).join('')}</g>`;
    if(L.hs==='bun')return `<circle cx="50" cy="12" r="6.6" fill="${hc}"/>`;return '';}
  const cap=`M${a} 41 Q${a-1} 17 50 17 Q${b+1} 17 ${b} 41 Q${b-3} 27 50 26 Q${a+3} 27 ${a} 41Z`;
  switch(L.hs){
    case 'bald':return `<ellipse cx="43" cy="25.5" rx="5.5" ry="2.4" fill="#fff" opacity=".18"/>`;
    case 'buzz':return `<path d="M${a+0.5} 38 Q${a} 19.5 50 19.5 Q${b} 19.5 ${b-0.5} 38 Q${b-3} 27 50 26.5 Q${a+3} 27 ${a+0.5} 38Z" fill="${hc}" opacity=".82"/>`;
    case 'fade':return `<path d="${cap}" fill="${hc}" opacity=".42"/><path d="M${a+3} 31 Q${a+2} 15.5 50 15.5 Q${b-2} 15.5 ${b-3} 31 Q${b-6} 25 50 24.5 Q${a+6} 25 ${a+3} 31Z" fill="${hc}"/>`;
    case 'side':return `<path d="M${a} 42 Q${a-2} 15 52 14.5 Q${b+3} 16 ${b} 40 Q${b-2} 27 58 25.5 Q46 31 ${a+2} 31Z" fill="${hc}"/>`;
    case 'mohawk':return `<path d="${cap}" fill="${hc}" opacity=".32"/><path d="M45 30 Q44 12 50 8 Q56 12 55 30 Q50 27 45 30Z" fill="${hc}"/>`;
    case 'curly':case 'afro':{const R=L.hs==='afro'?6.6:5.6,pts=[];for(let i=0;i<9;i++){const t=Math.PI*(1.02+0.96*i/8);pts.push([50+Math.cos(t)*(f+0.5),40+Math.sin(t)*22]);}
      pts.push([42,19],[50,16],[58,19],[46,24],[54,24]);return `<g fill="${hc}"><path d="${cap}"/>${pts.map(([x,y])=>`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${R}"/>`).join('')}</g>`;}
    case 'long':return `<path d="${cap}" fill="${hc}"/><path d="M${a} 40 Q${a-1.5} 54 ${a+1} 62 L${a+3} 44Z M${b} 40 Q${b+1.5} 54 ${b-1} 62 L${b-3} 44Z" fill="${hc}"/>`;
    case 'dread':return `<path d="${cap}" fill="${hc}"/><g stroke="${hc}" stroke-width="3.4" stroke-linecap="round">${[-1,1].map(s=>`<path d="M${50+s*(f-2)} 30 L${50+s*(f+2)} 58"/><path d="M${50+s*(f-6)} 26 L${50+s*(f-1)} 50"/>`).join('')}</g>`;
    default:return `<path d="${cap}" fill="${hc}"/>`;}}
function faceSVG(L,o){const sk=L.sk,sh=shade(sk,-0.17),dk=shade(sk,-0.42),hc=L.hc,f=L.fw;o=o||{};
  const body=o.coach?`<path d="M8 112 C10 86 22 76 37 72 L50 84 L63 72 C78 76 90 86 92 112Z" fill="${L.suit}"/><path d="M41 72 L50 92 L59 72Z" fill="#f4f4f4"/><path d="M48 77 L52 77 L54 99 L50 104 L46 99Z" fill="${o.c1||'#8a1d1d'}"/><path d="M37 72 L47 98 L42 79Z M63 72 L53 98 L58 79Z" fill="rgba(255,255,255,.09)"/>`
    :`<path d="M10 112 C12 86 24 76 38 72 L50 80 L62 72 C76 76 88 86 90 112 Z" fill="${o.c1}" stroke="${o.c2}" stroke-width="3"/><path d="M38 72 L50 86 L62 72" fill="none" stroke="${o.c2}" stroke-width="4"/>${o.capt?'<path d="M14 92 L26 88 L28 95 L16 99Z" fill="#ffd21f"/>':''}`;
  let beard='';if(L.bd==='stub')beard=`<path d="M${50-f+1} 46 Q${50-f+3} 63 50 65 Q${50+f-3} 63 ${50+f-1} 46 Q${50+f-4} 59 50 60 Q${50-f+4} 59 ${50-f+1} 46Z" fill="${hc}" opacity=".32"/>`;
  else if(L.bd==='full')beard=`<path d="M${50-f+0.5} 44 Q${50-f+2} 66 50 67 Q${50+f-2} 66 ${50+f-0.5} 44 Q${50+f-4} 58 50 58.5 Q${50-f+4} 58 ${50-f+0.5} 44Z" fill="${hc}" opacity=".92"/>`;
  else if(L.bd==='goatee')beard=`<ellipse cx="50" cy="61" rx="5" ry="4" fill="${hc}" opacity=".9"/>`;
  const mus=(L.bd==='full'||L.bd==='goatee'||L.bd==='mus')?`<path d="M43.5 53 Q50 50.2 56.5 53 Q50 55 43.5 53Z" fill="${hc}"/>`:'';
  const wr=o.coach&&o.age>=52?`<path d="M42 31 Q50 29.5 58 31 M43.5 34 Q50 32.8 56.5 34" stroke="${sh}" stroke-width="1" fill="none"/>`:'';
  const gl=L.gl?`<g fill="rgba(200,220,255,.12)" stroke="#1d1d1d" stroke-width="1.4"><rect x="37.5" y="40.2" width="10" height="7.6" rx="2.4"/><rect x="52.5" y="40.2" width="10" height="7.6" rx="2.4"/><path d="M47.5 43 L52.5 43" fill="none"/></g>`:'';
  const brow=L.hs==='bald'&&!o.coach?dk:shade(hc,hc==='#c9a35e'||hc.startsWith('#d')?-0.25:0);
  return `<svg viewBox="0 0 100 112" width="78" height="88" aria-hidden="true">${hairSVG(L,false)}${body}
  <rect x="42.5" y="56" width="15" height="18" rx="6" fill="${sh}"/>
  <ellipse cx="${50-f-0.6}" cy="45" rx="3.1" ry="5" fill="${sh}"/><ellipse cx="${50+f+0.6}" cy="45" rx="3.1" ry="5" fill="${sh}"/>
  <ellipse cx="50" cy="42" rx="${f}" ry="22" fill="${sk}"/><path d="M${50+f*0.35} 22 Q${50+f+1} 30 ${50+f-1} 52 Q${50+f*0.6} 62 50 64 Q${50+f*0.55} 50 ${50+f*0.35} 22Z" fill="#000" opacity=".06"/>
  ${beard}${hairSVG(L,true)}${wr}
  <path d="M38.5 38.5 L46 37.6" stroke="${brow}" stroke-width="2.5" stroke-linecap="round"/><path d="M54 37.6 L61.5 38.5" stroke="${brow}" stroke-width="2.5" stroke-linecap="round"/>
  <ellipse cx="42.5" cy="44" rx="2.6" ry="2.2" fill="#fff" opacity=".85"/><ellipse cx="57.5" cy="44" rx="2.6" ry="2.2" fill="#fff" opacity=".85"/><circle cx="42.8" cy="44.2" r="1.7" fill="${L.ey}"/><circle cx="57.8" cy="44.2" r="1.7" fill="${L.ey}"/>
  <path d="M48.5 46.5 Q50 51 52 49.5" stroke="${sh}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  ${mus}<path d="M44 55.6 Q50 ${o.coach?57.6:58.6} 56 55.6" stroke="${dk}" stroke-width="1.9" fill="none" stroke-linecap="round"/>${gl}
  ${o.num!=null&&!o.coach?`<text x="50" y="106" text-anchor="middle" font-family="Saira Extra Condensed,Arial Narrow,sans-serif" font-weight="800" font-size="19" fill="${o.c2}">${o.num}</text>`:''}</svg>`;}

/* ---------- Maç içi: gerçek kadrodan görünüş ve forma numarası ---------- */
let LOOKQ=null;
function lk2e(L){return {skin:L.sk,hair:L.hc,hs:L.hs,bd:L.bd,boot:L.boot,hgt:L.hgt,bld:L.bld};}
function mkLookQ(C){const f=(t,us)=>{if(!t||!CLUBS[t.id])return null;let sq,R;try{sq=squadOf(t.id);R=squadRoles(t.id);}catch(e){return null;}
    if(us&&G&&isPl()&&G.capt===t.id)for(const k in R)if(R[k]==='Kaptan')R[k]='Takım lideri';
    const m=p=>Object.assign(lk2e(lookOf(p.k,p.nat,p.age)),{num:p.num,capt:R[p.k]==='Kaptan',pname:p.name});
    const gk=sq.filter(p=>p.pos==='KL').sort((a,b)=>b.ovr-a.ovr).map(m),fl=shuffle(sq.filter(p=>p.pos!=='KL'&&!(us&&p.num===C.num)).sort((a,b)=>b.ovr-a.ovr).slice(0,11)).map(m);return {gk,fl};};
  return {us:f(C.us,true),opp:f(C.opp,false)};}
function lookQ(side,o){if(o&&o.isC)return {};const Q=LOOKQ&&LOOKQ[side];
  if(!Q)return {boot:pick(['#14161a','#14161a','#f4f4f4','#39d0ff','#ff4f9a']),hgt:rnd(0.95,1.05),bld:rnd(0.93,1.08),bd:Math.random()<0.25?'stub':null};
  const e=(o&&o.isGK)?Q.gk[0]:Q.fl.shift();return e?Object.assign({},e):{};}

/* ---------- Kadro zinciri: emeklilik ve altyapıdan gelen gençler ---------- */
const SLC={};
function retAgeOf(b){const r=srng(b.k+'rt');return (b.pos==='KL'?35:33)+Math.floor(r()*4)+(b.ovr0>=84?1:0);}
function regenP(id,i,g,start,base){const c=CLUBS[id],L=LEAGUES[c.league],r=srng(id+'#'+i+'~'+g);let cc=L.cc||'TR';const ccs=Object.keys(NAMEP);if(L.tier>=6&&r()<0.2)cc=ccs[Math.floor(r()*ccs.length)];const P=(NAMEP[cc]||NAMEP2[cc]);
  const name=P.f[Math.floor(r()*P.f.length)]+' '+P.l[Math.floor(r()*P.l.length)];const age0=L.youth?L.minAge:17+Math.floor(r()*3);
  const ovr0=Math.round((c.str0||c.str)-(L.youth?3:14)+r()*8);
  return {k:id+'#'+i+'~'+g,name,pos:base.pos,age0,ovr0,nat:CC3[cc],home:id,num:base.num,i,g,start,regen:true};}
function slotGens(id,i){const Y=G&&G.s?G.s.year:2026,key=id+'#'+i,cch=SLC[key];if(cch&&cch.Y===Y)return cch.gens;
  const b0=baseSquad(id)[i];if(!b0)return [];const L=LEAGUES[CLUBS[id].league],gens=[Object.assign({},b0,{g:0,start:2026})];
  for(let g=0;g<14;g++){const cur=gens[gens.length-1];const ra=L.youth?L.maxAge:retAgeOf(cur);cur.ret=ra;const endY=cur.start+(ra-cur.age0)+1;if(endY>Y)break;gens.push(regenP(id,i,gens.length,Math.max(endY,cur.start+1),cur));}
  SLC[key]={Y,gens};return gens;}
function pRaw(k){const m=/^(.+)#(\d+)(?:~(\d+))?$/.exec(k);if(!m||!CLUBS[m[1]])return null;const gs=slotGens(m[1],+m[2]),g=+(m[3]||0),p=gs[g];if(!p)return null;return Object.assign({},p,{alive:g===gs.length-1});}
function natSquad(id){return baseSquad(id).map((b,i)=>{const gs=slotGens(id,i),p=gs[gs.length-1];return Object.assign({},p,ageP(p));});}
function retireNews(){const Y=G.s.year,out=[],mine=[];const ids=new Set([...Object.keys(SQ_REAL),G.club]);
  for(const id of ids){const c=CLUBS[id];if(!c||LEAGUES[c.league].youth)continue;baseSquad(id).forEach((b,i)=>{const gs=slotGens(id,i),last=gs[gs.length-1];if(last.g>0&&last.start===Y){const old=gs[gs.length-2],at=(G.tx&&G.tx[old.k])||id;
    const o=ageP(Object.assign({},old));if(at===G.club)mine.push(old.name);else if(o.ovr>=72||SQ_REAL[id]&&!old.regen)out.push({n:old.name,c:at,a:old.ret,o:o.ovr});}});}
  out.sort((a,b)=>b.o-a.o);
  if(out.length)msg('gundem','Kramponlarını astılar',out.slice(0,10).map(x=>`${x.n} (${CLUBS[x.c]?CLUBS[x.c].name:''}, ${x.a})`).join(', ')+' futbol kariyerlerini noktaladı.');
  if(mine.length)msg('squad','Takımdan emeklilik',`${mine.join(', ')} futbolu bıraktı. Altyapıdan yeni bir genç A takıma yükseldi.`);}

/* ---------- Takım içi roller ve hiyerarşi ---------- */
const ROLES={Kaptan:{w:0.24,c:'cap',d:'Takımın kaptanısın. Soyunma odasında ve yönetim katında sözün geçer.'},
  'Yıldız':{w:0.2,c:'star',d:'Takımın en değerli oyuncularındansın. Yönetim seni memnun tutmak ister.'},
  'Takım lideri':{w:0.14,c:'lead',d:'Kıdemin ve performansınla soyunma odasının sözü dinlenen isimlerindensin.'},
  'İlk 11':{w:0.03,c:'xi',d:'Düzenli forma giyiyorsun ama hiyerarşinin üst sıralarında değilsin.'},
  'Rotasyon':{w:-0.08,c:'rot',d:'Rotasyon oyuncususun. Talepler geri planda kalabilir.'},
  'Genç yetenek':{w:-0.1,c:'young',d:'Genç bir yeteneksin. Önce sahada kendini kanıtlaman bekleniyor.'},
  'Yedek':{w:-0.18,c:'bench',d:'Kadroda geri plandasın. Yönetim taleplerine pek kulak asmaz.'}};
const HIER={yildiz:{n:'Yıldız odaklı',d:'Yönetim büyük isimleri memnun tutar. Yıldızların talepleri kolay kabul edilir, sıradan oyuncularınki zor.'},
  kidem:{n:'Kıdem düzeni',d:'Söz kaptanda ve kulüpte uzun süredir olanlarda. Yeni gelenlerin talepleri pek dinlenmez.'},
  kolektif:{n:'Önce takım',d:'Kimseye ayrıcalık yok. Rolün ne olursa olsun yönetim taleplere temkinli yaklaşır.'}};
function hierType(c){const v=clubVision(c),h=hash(c.id+'hy')%10;if(v==='sampiyon'||v==='hucum')return h<6?'yildiz':h<8?'kidem':'kolektif';
  if(v==='altyapi'||v==='genc')return h<5?'kidem':h<8?'kolektif':'yildiz';if(v==='tutumlu'||v==='savunma')return h<5?'kolektif':h<8?'kidem':'yildiz';return h<4?'yildiz':h<7?'kidem':'kolektif';}
function capScore(p,id){return p.ovr*0.6+Math.min(p.age,33)*1.1+(p.home===id?6:0)+(p.regen?0:1);}
function squadRoles(id){const sq=squadOf(id),c=CLUBS[id],R={};if(!sq.length||!c)return R;const xiK=new Set(G&&G.mode==='mgr'&&id===G.club?mgrXI():autoXI(sq));
  const cc=sq.filter(p=>xiK.has(p.k)&&p.age>=20).sort((a,b)=>capScore(b,id)-capScore(a,id)),cenkC=G&&isPl()&&G.capt===id&&G.club===id;
  const capt=cenkC?null:cc[0],vice=cenkC?cc[0]:cc[1],stars=new Set(sq.filter(p=>p.ovr>=c.str+3).sort((a,b)=>b.ovr-a.ovr).slice(0,2).map(p=>p.k));
  const rot=new Set(sq.filter(p=>!xiK.has(p.k)).sort((a,b)=>b.ovr-a.ovr).slice(0,3).map(p=>p.k));
  for(const p of sq)R[p.k]=p===capt?'Kaptan':stars.has(p.k)?'Yıldız':p===vice?'Takım lideri':xiK.has(p.k)?'İlk 11':p.age<=21?'Genç yetenek':rot.has(p.k)?'Rotasyon':'Yedek';
  return R;}
function clubYears(){let n=1;for(let i=G.history.length-1;i>=0;i--){const h=G.history[i];if(h.club!==G.club||h.pos==='TD')break;n++;}return n;}
function cenkRole(){if(!G||!isPl()||G.phase==='retired'||G.phase==='tryout')return null;const c=myClub();if(!c)return null;if(G.capt===c.id)return 'Kaptan';
  const o=OVR(),sq=squadOf(c.id).filter(p=>p.pos!=='KL'),better=sq.filter(p=>p.ovr>o).length,yrs=clubYears(),L=LEAGUES[c.league];
  if(better<=1&&o>=c.str+3&&!L.youth)return 'Yıldız';
  if(yrs>=3&&better<=5&&G.p.age>=23)return 'Takım lideri';
  const st=G.s&&G.s.stats,sr=st&&st.apps>=4?st.starts/st.apps:null;
  if((better<=7&&(sr==null||sr>=0.5))||(sr!=null&&sr>=0.7))return 'İlk 11';
  if(G.p.age<=21)return 'Genç yetenek';
  if(better<=11||(sr!=null&&sr>=0.3))return 'Rotasyon';return 'Yedek';}
function cenkCapScore(){return OVR()*0.6+Math.min(G.p.age,33)*1.1+clubYears()*3+G.p.fame*0.08+(G.p.trust-50)*0.1;}
function capCheck(){if(!G||!isPl())return;if(G.capt&&G.capt!==G.club)G.capt=null;if(G.capt||G.p.age<19||G.loan)return;const c=myClub();
  const top=Math.max(0,...squadOf(c.id).filter(p=>p.age>=20).map(p=>capScore(p,c.id)));
  if(cenkCapScore()>top+1&&clubYears()>=2){G.capt=c.id;msg('coach','Kol bandı artık sende',`${coachOf(c.id).n}: “Bu sezon takımın kaptanı sensin. Soyunma odası sana bakacak.”`);}}
function hbOf(cs,id){if(cs.hb==null)cs.hb=52+hash(id+'hb')%22;return cs.hb;}
function hierAdj(){const c=myClub(),t=hierType(c),role=cenkRole()||'İlk 11',yrs=clubYears(),cs=cstate(c.id);let w=ROLES[role].w;
  if(t==='yildiz')w*=(role==='Yıldız'||role==='Kaptan')?1.6:w<0?1.4:1;
  else if(t==='kidem'){w*=(role==='Kaptan'||role==='Takım lideri')?1.5:1;w+=yrs<=1?-0.08:yrs>=4?0.06:0;}
  else w=w*0.5-0.05;
  const hb=hbOf(cs,c.id);if(hb<40)w-=(40-hb)/100;return clamp(w,-0.35,0.42);}
function roleRib(role){return role?`<div class="pc-role r-${ROLES[role].c}">${role}</div>`:'';}
function rtag(role){return role?`<u class="rt r-${ROLES[role].c}">${role==='Kaptan'?'C · Kaptan':role}</u>`:'';}

/* ---------- Yönetim talepleri: hiyerarşiye göre kabul ---------- */
function reqP(k){const cs=cstate(G.club),c=myClub(),L=curLeague(),p=G.p,v=clubVision(c),perf=(seasonAvg()||formAvg())-6.5,h=hierAdj(),role=cenkRole()||'İlk 11';
  if(k==='maas'){const ratio=marketValue()*40/Math.max(1,G.contract.wage*52);return clamp(0.22+perf*0.18+(cs.board-50)/150+(p.trust-55)/200+clamp(Math.log10(ratio+0.01)*0.15,-0.2,0.25)+(v==='tutumlu'?-0.15:v==='sampiyon'?0.08:0)+h,0.04,0.88);}
  if(k==='tesis')return clamp(0.18+(cs.board-50)/120+(v==='altyapi'?0.25:v==='tutumlu'?-0.12:0)+(L.tier>=5?0.1:0)+p.fame/300+h*0.8,0.04,0.85);
  if(k==='takviye')return clamp(0.2+(cs.board-50)/120+(v==='sampiyon'?0.2:v==='tutumlu'?-0.15:0)+perf*0.08+h*0.9,0.04,0.8);
  if(k==='kaptan'){if(role==='Kaptan')return 0;const top=Math.max(0,...squadOf(c.id).filter(q=>q.age>=20).map(q=>capScore(q,c.id)));let pp=0.12+(cenkCapScore()-top)/14+h*0.8+perf*0.1;if(hierType(c)==='kidem'&&clubYears()<2)pp-=0.25;if(p.age<20)pp-=0.15;if(G.loan)pp=0;return clamp(pp,0.02,0.85);}
  if(k==='kiralik')return clamp(({Kaptan:0.05,'Yıldız':0.1,'Takım lideri':0.2,'İlk 11':0.42,'Rotasyon':0.8,'Genç yetenek':0.85,'Yedek':0.95}[role])+(cs.board-50)/200,0.03,0.97);
  if(k==='liste'){let pp={Kaptan:0.25,'Yıldız':0.3,'Takım lideri':0.45,'İlk 11':0.7,'Rotasyon':0.9,'Genç yetenek':0.75,'Yedek':0.98}[role];if(hierType(c)==='yildiz'&&role==='Yıldız')pp-=0.12;if(G.contract.years<=1)pp+=0.25;return clamp(pp,0.05,0.98);}
  return 0.5;}
function chanceLbl(p){return p>=0.65?['Yüksek','hi']:p>=0.4?['Orta','mid']:p>=0.2?['Düşük','lo']:['Çok düşük','lo'];}
function boardReq(k){if(G.phase!=='season')return toast('Yaz arasında yönetim toplanmıyor');const cs=cstate(G.club),c=myClub(),p=G.p,v=clubVision(c),role=cenkRole()||'İlk 11';
  const unlist=k==='liste'&&G.tl;if(reqLeft(k)&&!unlist)return toast(`Bu talep için ${reqLeft(k)} gün beklemelisin`);
  if(k==='kiralik'&&G.loan)return toast('Zaten kiralık oynuyorsun');
  if(k==='kaptan'&&role==='Kaptan')return toast('Zaten takımın kaptanısın');
  if(k==='kiralik'&&G.p.age<16)return openModal(`<h3>Yönetimin cevabı</h3><p>Bu yaşta kiralık gönderemeyiz. 16 yaşından sonra yetişkin takımlarına kiralanabilirsin.</p><button class="cta" data-act="closeModal">Tamam</button>`);
  if(k==='tesis'&&(cs.fac>=5||cs.pend))return toast(cs.fac>=5?'Tesisler zaten en üst seviyede':'Yönetimin devam eden bir projesi var');
  if(k==='takviye'&&cs.pend)return toast('Yönetimin devam eden bir projesi var');
  (G.req=G.req||{})[k]=absDay()+REQ[k].cd;
  const P=unlist?1:reqP(k),ok=Math.random()<P;let txt;
  if(k==='maas'){if(ok){const inc=rnd(0.12,0.3)*(role==='Yıldız'||role==='Kaptan'?1.25:1);G.contract.wage=Math.round(G.contract.wage*(1+inc)/50)*50;cs.board=clamp(cs.board-3,0,100);txt=`Yönetim talebini kabul etti. Haftalık maaşın ${money(G.contract.wage)} oldu (+%${Math.round(inc*100)}).`;}
    else{cs.board=clamp(cs.board-6,0,100);txt=role==='Yedek'||role==='Rotasyon'||role==='Genç yetenek'?'Yönetim: “Takımda daha fazla süre aldığında bu konuyu konuşuruz.” Talebin reddedildi.':pick(['Yönetim şu an maaş artışına sıcak bakmıyor: “Önce sahada göster.”','Başkan bütçenin sınırda olduğunu söyledi. Talebin reddedildi.']);}}
  else if(k==='tesis'){if(ok){cs.pend={k:'tesis',at:absDay()+rint(25,45)};txt=`Yönetim ${money(clubBudget(c)*0.08*cs.fac)} bütçeli tesis yenilemesini onayladı. Çalışmalar yaklaşık bir ay sürecek.`;}
    else{cs.board=clamp(cs.board-3,0,100);txt='Yönetim tesis yatırımını bu sezon bütçeye koyamayacağını açıkladı.';}}
  else if(k==='takviye'){if(ok){const n=rint(1,3),at=inWindow()?absDay()+rint(5,12):G.s.year*400+(G.s.day<G.s.win.open?G.s.win.open+rint(3,10):G.s.win.open+400);cs.pend={k:'takviye',n,at};txt=`Yönetim kadroya takviye sözü verdi. Transfer döneminde ${n} yeni oyuncu gelecek.`;}
    else{cs.board=clamp(cs.board-4,0,100);txt='Yönetim mevcut kadroya güvendiğini söyledi, takviye yapılmayacak.';}}
  else if(k==='kiralik'){if(ok){G.wantLoan=true;p.trust=clamp(p.trust-2,0,100);const n=inWindow()?genLoanOffers():0;txt=n?`Yönetim kiralık gitmene onay verdi. ${n} kulüp ilgilendi, gelen kutuna bak.`:'Yönetim talebini not aldı; transfer dönemi açılınca seni kiralayacak kulüp arayacaklar.';}
    else{cs.board=clamp(cs.board-2,0,100);txt=`Yönetim talebini reddetti: “${role==='Kaptan'||role==='Yıldız'?'Takımın en önemli oyuncularından birisin, gitmene izin veremeyiz.':'Bu sezon sana ihtiyacımız var, kiralık gitmen söz konusu değil.'}”`;}}
  else if(k==='liste'){if(unlist){G.tl=false;cs.board=clamp(cs.board+4,0,100);txt='Transfer listesinden çıkarıldın. Yönetim memnun.';}
    else if(ok){G.tl=true;cs.board=clamp(cs.board-6,0,100);p.trust=clamp(p.trust-5,0,100);txt='Yönetim seni transfer listesine koydu. Kulüplerin ilgisi daha hızlı artacak; transfer döneminde teklifler gelir.';if(inWindow())genOffers('mid');}
    else{p.trust=clamp(p.trust-2,0,100);txt=`Yönetim talebini reddetti: “${role==='Kaptan'?'Kaptanımızı satmayı düşünmüyoruz.':role==='Yıldız'?'Takımın yıldızı satılık değil.':'Seni kadroda tutmak istiyoruz.'} Sözleşmen devam ediyor.”`;}}
  else if(k==='kaptan'){if(ok){G.capt=G.club;cs.hb=clamp((cs.hb??60)-6,0,100);txt=`${coachOf(G.club).n} ve yönetim talebini onayladı. Kol bandı artık sende: ${c.name} kaptanı Cenk Kuşku!`;}
    else{cs.board=clamp(cs.board-3,0,100);p.trust=clamp(p.trust-2,0,100);const cp=Object.entries(squadRoles(G.club)).find(([,r])=>r==='Kaptan'),nm=cp?(squadOf(G.club).find(q=>q.k===cp[0])||{}).name:null;
      txt=hierType(c)==='kidem'&&clubYears()<2?'Yönetim: “Bu kulüpte kaptanlık kıdemle kazanılır. Önce burada zaman geçirmelisin.”':`Teknik direktör kararını verdi: kol bandı ${nm?nm+'’de':'mevcut kaptanda'} kalacak.`;}}
  if(ok&&!unlist&&(k==='maas'||k==='tesis'||k==='takviye'))cs.hb=clamp((cs.hb??60)-rint(6,11),0,100);
  msg('board','Yönetim: '+(unlist?'Listeden çıkma':REQ[k].n),txt);save();render();
  openModal(`<h3>Yönetimin cevabı</h3><p>${esc(txt)}</p>${unlist?'':`<p class="muted">Rolün: ${role} · ${HIER[hierType(c)].n} · Kabul ihtimali %${Math.round(P*100)}</p>`}<button class="cta" data-act="closeModal">Tamam</button>`);}
function hierPanel(){const c=myClub(),t=hierType(c),role=cenkRole()||'İlk 11',cs=cstate(c.id),hb=Math.round(hbOf(cs,c.id)),o=OVR(),rank=squadOf(c.id).filter(p=>p.pos!=='KL'&&p.ovr>o).length+1;
  return `<section class="panel"><p class="sub-h"><span>Takımdaki yerin</span><span>${HIER[t].n}</span></p>
  <div class="hier"><b class="role-b r-${ROLES[role].c}">${role}</b><p>${ROLES[role].d}</p></div>
  <p class="muted" style="margin:8px 0 10px">${HIER[t].d}</p>
  <div class="meters">${meter('Hiyerarşi dengesi',hb,lvl(hb))}</div>
  <p class="muted" style="margin-top:8px">Kulüpte ${clubYears()}. sezonun · kadronun ${rank}. en iyi saha oyuncususun. Kabul edilen her talep dengeyi bozar; denge düştükçe yönetim temkinli davranır.</p></section>`;}

/* ---------- Teknik direktörler ---------- */
const FORMS=['4-2-3-1','4-3-3','4-4-2','3-5-2','3-4-3','4-1-4-1','5-3-2','4-4-1-1'];
const LG_TROPHY={sl:'Süper Lig',pl:'Premier League',ll:'LaLiga',it1:'Serie A',de1:'Bundesliga',fr1:'Ligue 1'};
function trophyRank(n){const R={'Şampiyonlar Ligi':100,'Dünya Kupası':99,'Avrupa Şampiyonası':98,'Copa América':96,'Kulüpler Dünya Kupası':92,'Copa Libertadores':90,'Avrupa Ligi':86,'Uluslar Ligi':84,'Konferans Ligi':80,'UEFA Süper Kupa':76,'Premier League':72,LaLiga:72,'Serie A':72,Bundesliga:72,'Ligue 1':70,'Süper Lig':69};
  if(R[n])return R[n];if(/Ligi$|League|Liga$|Şampiyonluğu/.test(n))return 60;if(/Kupa|Cup|Pokal|Copa/.test(n))return n==='Süper Kupa'?30:50;return 40;}
function coachRaw(id){if(G&&G.co&&G.co[id])return G.co[id];const r=COACH_REAL[id];if(r)return {n:r[0],nat:r[1],by:r[2],f:r[3],since:r[4],tr:r[5].map(x=>x.slice()),real:true};
  const c=CLUBS[id];if(!c)return {n:'—',nat:'TUR',by:1975,f:'4-4-2',since:2026,tr:[],real:false};const L=LEAGUES[c.league],cc=L.cc||'TR',R=srng(id+'co'),P=(NAMEP[cc]||NAMEP2[cc]);
  const n=P.f[Math.floor(R()*P.f.length)]+' '+P.l[Math.floor(R()*P.l.length)],by=L.youth?1966+Math.floor(R()*26):1958+Math.floor(R()*30),tr=[];
  if(!L.youth&&R()<0.3)tr.push([`${L.short} Şampiyonluğu`,1]);if(L.tier>=7&&R()<0.25)tr.push([cc==='TR'?'Türkiye Kupası':'Ulusal Kupa',1]);
  return {n,nat:CC3[cc],by,f:FORMS[Math.floor(R()*FORMS.length)],since:2022+Math.floor(R()*5),tr,real:false};}
function cenkCoach(){const m=G.m||{},tr={};G.trophies.filter(t=>/\(TD\)/.test(t.name)).forEach(t=>{const n=t.name.replace(' (TD)','');tr[n]=(tr[n]||0)+1;});
  return {n:PN(),nat:(G.p&&G.p.nat)||'TUR',by:(G.s?G.s.year:2026)-G.p.age,f:TAC[m.tac||'dengeli'].n,since:m.since||(G.s?G.s.year:2026),tr:Object.entries(tr),me:true};}
function coachOf(id){let b;if(G&&G.mode==='mgr'&&id===G.club)b=cenkCoach();else b=coachRaw(id);const add=(!b.me&&G&&G.coT&&G.coT[b.n])||{},tr=b.tr.map(x=>x.slice());
  for(const [k,v] of Object.entries(add)){const e=tr.find(x=>x[0]===k);if(e)e[1]+=v;else tr.push([k,v]);}
  tr.sort((a,b)=>trophyRank(b[0])-trophyRank(a[0])||b[1]-a[1]);return Object.assign({},b,{tr,age:(G&&G.s?G.s.year:2026)-b.by,club:id});}
function newCoachFor(id){const L=LEAGUES[CLUBS[id].league],Y=G.s.year+1;G.coFree=G.coFree||[];
  if(L.tier>=7&&G.coFree.length&&Math.random()<0.55){const i=Math.floor(Math.random()*G.coFree.length),c=G.coFree.splice(i,1)[0];return Object.assign({},c,{since:Y});}
  const cc=L.cc||'TR',R=srng(id+'nc'+Y),P=(NAMEP[cc]||NAMEP2[cc]);return {n:P.f[Math.floor(R()*P.f.length)]+' '+P.l[Math.floor(R()*P.l.length)],nat:CC3[cc],by:Y-36-Math.floor(R()*24),f:FORMS[Math.floor(R()*FORMS.length)],since:Y,tr:[],real:false};}
function coachSeasonEnd(){if(!G||!G.s||G.coY===G.s.year)return;G.coY=G.s.year;G.co=G.co||{};G.coT=G.coT||{};G.coFree=G.coFree||[];const yl=seasonLabel(G.s.year),news=[];
  const lids=Object.keys(LEAGUES).filter(l=>LEAGUES[l].tier>=5||l===G.s.league);
  for(const lid of lids){const L=LEAGUES[lid];let tb;try{tb=lid===G.s.league?table():tableOf(lid,olSync(lid).res);}catch(e){continue;}if(!tb||!tb.length)continue;
    const champ=tb[0].id;if(!(G.mode==='mgr'&&champ===G.club)){const co=coachRaw(champ),tn=LG_TROPHY[lid]||`${L.short} Şampiyonluğu`;const T=G.coT[co.n]=G.coT[co.n]||{};T[tn]=(T[tn]||0)+1;if(L.tier>=8)news.push(`${co.n}, ${CLUBS[champ].name} ile ${tn} kazandı.`);}
    const n=tb.length,byStr=leagueClubs(lid).sort((a,b)=>b.str-a.str).map(c=>c.id);
    tb.forEach((r,i)=>{const id=r.id;if(G.mode==='mgr'&&id===G.club)return;const exp=byStr.indexOf(id),co=coachRaw(id),age=G.s.year-co.by;
      let p=clamp((i-exp)/n*1.4,0,0.65)+0.04;if(i===0)p=0;if(age>=71)p=1;
      if(Math.random()<p){const nw=newCoachFor(id);G.co[id]=nw;if(co.real&&age<70)G.coFree.push(Object.assign({},co));
        if(L.tier>=8)news.push(`${CLUBS[id].name}: ${co.n} ${age>=71?'emekli oldu':'ile yollar ayrıldı'}, yeni teknik direktör ${nw.n}.`);
        if(id===G.club&&isPl()){msg('coach','Yeni teknik direktör',`${CLUBS[id].name} yönetimi ${co.n} ile yollarını ayırdı. Yeni hocan ${nw.n} (${nw.nat}). Forma için kendini yeniden kanıtlaman gerekecek.`);G.p.trust=clamp(G.p.trust-6,25,90);}}});}
  if(G.coFree.length>30)G.coFree.splice(0,G.coFree.length-30);
  if(news.length)msg('gundem',`Teknik direktör gündemi · ${yl}`,news.slice(0,14).join(' '));}
function trophyListHTML(tr){return tr.length?`<ul class="ctr">${tr.map(([n,k])=>`<li><i>${k}×</i><span>${esc(n)}</span></li>`).join('')}</ul>`:'<p class="ctr-none">Henüz büyük bir kupa kazanmadı.</p>';}
function coachCardHTML(id){const co=coachOf(id),c=CLUBS[id],tc=co.tr.reduce((a,x)=>a+x[1],0),yrs=Math.max(1,(G&&G.s?G.s.year:2026)-co.since+1);
  const lk=co.me?Object.assign({},lookOf('cenk','TUR',co.age,true),{sk:'#a8704a',hs:'curly',hc:mixC('#140d09','#d9d9d9',clamp((co.age-40)/30,0,0.9)),bd:'stub',fw:19,gl:false}):lookOf('co:'+co.n,co.nat,co.age,true);
  return `<section class="pcard coachc"><div class="pc-top"><div class="pc-ovr"><b>TD</b><span>${esc(co.f)}</span>${flagImg(co.nat,'fl-card')}${crestSVG(c,28)}</div><div class="pc-photo">${faceSVG(lk,{coach:true,c1:c.c1,c2:c.c2,age:co.age})}</div></div>
  <div class="pc-name">${esc(co.n)}</div><div class="pc-stars">${starsHTML(abStars(coachAb(id)),abStars(coachAb(id)),true)}</div><div class="pc-stats co4"><div><b>${co.age}</b><span>YAŞ</span></div><div class="nat">${flagImg(co.nat,'fl-stat')}<span>${esc(natName(co.nat)).toLocaleUpperCase('tr-TR')}</span></div><div><b>${yrs}</b><span>SEZON</span></div><div><b>${tc}</b><span>KUPA</span></div></div>
  <div class="pc-tr"><span>Kupa başarıları</span>${trophyListHTML(co.tr)}</div>
  <div class="pc-foot"><span>${esc(c.name)}</span><span>${co.since}’ten beri</span></div></section>`;}
function showCoach(id){if(!CLUBS[id])return;openModal(`${coachCardHTML(id)}<div class="offer-btns" style="margin-top:8px"><button class="btn" data-act="squad" data-id="${id}">Kadroya dön</button><button class="btn ghost" data-act="closeModal">Kapat</button></div>`);}
function coachRowHTML(id){const co=coachOf(id),tc=co.tr.reduce((a,x)=>a+x[1],0);
  return `<p class="sub-h" style="margin:12px 0 6px"><span>Teknik direktör</span></p><button class="sqrow coach" data-act="ccard" data-id="${id}"><i>TD</i><b>${esc(co.n)}</b><span>${flagImg(co.nat,'fl-row')} ${co.age} · ${esc(co.f)}</span><em class="tc">${tc?'🏆 '+tc:'—'}</em></button><div class="co-st">${starsHTML(abStars(coachAb(id)),abStars(coachAb(id)))}</div><p class="sub-h" style="margin:12px 0 6px"><span>Teknik ekip</span><span>${STK.length} kişi</span></p><div class="stf-list">${stfRowsHTML(id)}</div>`;}

/* ---------- Kariyer anları ve arşiv ---------- */
const ARC_KEY='cenk-kusku-arsiv';
function msAdd(t,ic,y,a){(G.ms=G.ms||[]).push({y:y||(G.s?seasonLabel(G.s.year):''),a:a??G.p.age,t,ic});}
function msSync(){if(!G||!G.p||!G.totals||G.phase==='tryout'||G.tryout)return;if(!G.cid)G.cid='c'+Date.now().toString(36)+rint(100,999);
  if(isPl())G.peak=Math.max(G.peak||0,OVR());const cl=id=>CLUBS[id]?CLUBS[id].name:'?';let m=G.msS;
  if(!m){G.ms=G.ms||[];if(!G.ms.length){const hs=G.history.filter(h=>h.pos!=='TD');let prev=null;
      if(hs.length){msAdd(`Futbola ${cl(hs[0].club)} altyapısında başladı`,'start',hs[0].year,hs[0].age);prev=hs[0].club;for(const h of hs.slice(1))if(h.club!==prev){msAdd(`Transfer: ${cl(prev)} → ${cl(h.club)}`,'tr',h.year,h.age);prev=h.club;}
        if(prev!==G.club&&isPl())msAdd(`Transfer: ${cl(prev)} → ${cl(G.club)}`,'tr');}
      else msAdd(`Seçmelerin ardından ${cl(G.club)} altyapısına imza attı`,'start');
      G.trophies.forEach(t=>msAdd(t.name,'cup',t.year));}
    m=G.msS={club:G.club,mode:G.mode||'p',tr:G.trophies.length,apps:G.totals.apps,goals:G.totals.goals,caps:G.p.caps,capt:G.capt||null,inj:null,ret:G.phase==='retired'};}
  if(G.club!==m.club||(G.mode||'p')!==m.mode){if(G.mode==='mgr')msAdd(m.mode!=='mgr'?`Teknik direktörlüğe başladı: ${cl(G.club)}`:`Yeni görev: ${cl(G.club)} teknik direktörü`,'td');
    else if(isStaff())msAdd(`Yeni görev: ${cl(G.club)} · ${G.job?G.job.title:''}`,'td');
    else if(G.loan&&G.loan.parent!==G.club)msAdd(`Kiralık: ${cl(G.club)} (${LEAGUES[CLUBS[G.club].league].short})`,'loan');
    else msAdd(`Transfer: ${cl(m.club)} → ${cl(G.club)} (${LEAGUES[CLUBS[G.club].league].short})`,'tr');m.club=G.club;m.mode=G.mode||'p';}
  const th=(a,b,list,f)=>{for(const t of list)if(a<t&&b>=t)f(t);};
  th(m.apps,G.totals.apps,[1,50,100,150,200,300,400,500,600,700],t=>msAdd(t===1?'İlk resmi maçına çıktı':`${t}. resmi maçına çıktı`,'apps'));
  th(m.goals,G.totals.goals,[1,10,25,50,100,150,200,250,300,400],t=>msAdd(t===1?'İlk resmi golünü attı':`Kariyerinde ${t}. golü attı`,'goal'));
  th(m.caps,G.p.caps,[1,10,25,50,75,100],t=>msAdd(t===1?'Milli formayla ilk maçına çıktı':`Milli formayla ${t}. maçına çıktı`,'nat'));
  m.apps=G.totals.apps;m.goals=G.totals.goals;m.caps=G.p.caps;
  if(G.trophies.length>m.tr){G.trophies.slice(m.tr).forEach(t=>msAdd(t.name+(CLUBS[t.club]?` · ${cl(t.club)}`:''),'cup',t.year));m.tr=G.trophies.length;}
  if(G.capt&&G.capt!==m.capt)msAdd(`${cl(G.capt)} kaptanı oldu`,'capt');m.capt=G.capt||null;
  const inj=G.p.injury;if(inj&&inj.serious){const key=inj.name+'|'+inj.total;if(m.inj!==key){msAdd(`Ciddi sakatlık: ${inj.name} (${inj.total} gün)`,'inj');m.inj=key;}}else m.inj=null;
  if(G.phase==='retired'&&!m.ret){msAdd(G.mode==='mgr'?'Teknik direktörlüğü bıraktı':'Futbolu bıraktı','end');m.ret=true;}}
function careerSnap(){const seasons=G.history.map(h=>({y:h.year,a:h.age,c:h.club,l:h.league,td:h.pos==='TD',ap:h.apps,g:h.goals,as:h.assists,r:h.apps&&h.pos!=='TD'?Math.round(h.rsum/h.apps*10)/10:0}));
  const first=G.history[0];return {id:G.cid,name:'Cenk Kuşku',pos:G.p.pos,from:first?first.year:(G.s?seasonLabel(G.s.year):''),to:G.s?seasonLabel(G.s.year):'',age:G.p.age,
    status:G.phase==='retired'?(G.mode==='mgr'?'Emekli teknik direktör':'Emekli'):G.mode==='mgr'?'Teknik direktör':isStaff()?(G.job?G.job.title:'Personel'):'Aktif futbolcu',club:G.club,totals:Object.assign({},G.totals),caps:G.p.caps,natGoals:G.p.natGoals,peak:G.peak||0,
    trophies:G.trophies.map(t=>({y:t.year,n:t.name,c:t.club})),seasons,ms:(G.ms||[]).slice(),mt:G.mt?Object.assign({},G.mt):null,saved:Date.now()};}
function archList(){try{const a=JSON.parse(localStorage.getItem(ARC_KEY)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function archSave(){if(!G||!G.p||G.phase==='tryout'||G.tryout)return;try{msSync();if(!G.history.length&&!G.totals.apps)return;const a=archList().filter(x=>x.id!==G.cid);a.unshift(careerSnap());localStorage.setItem(ARC_KEY,JSON.stringify(a.slice(0,25)));}catch(e){}}
function clubPath(seasons){const out=[];for(const s of seasons){const l=out[out.length-1];if(l&&l.c===s.c&&l.td===s.td){l.to=s.y;l.ap+=s.ap;l.g+=s.g;}else out.push({c:s.c,td:s.td,from:s.y,to:s.y,ap:s.ap,g:s.g,l:s.l});}return out;}
const MS_IC={start:'★',tr:'⇄',loan:'↷',apps:'●',goal:'⚽',nat:'⚑',cup:'🏆',capt:'C',inj:'✚',td:'▣',end:'■',sign:'✎'};
function careerHTML(s,live){const t=s.totals,cp=clubPath(s.seasons),c=CLUBS[s.club]||{c1:'#2a8c4a',c2:'#fff'};
  if(live){const cur=G.s&&G.s.stats&&G.phase==='season'&&isPl()?G.s.stats:null;if(cur&&cur.apps){const l=cp[cp.length-1];if(l&&l.c===G.club&&!l.td){l.to=seasonLabel(G.s.year);l.ap+=cur.apps;l.g+=cur.goals;}else cp.push({c:G.club,td:false,from:seasonLabel(G.s.year),to:seasonLabel(G.s.year),ap:cur.apps,g:cur.goals,l:G.s.league});}
    else if(!cp.length||cp[cp.length-1].c!==G.club)cp.push({c:G.club,td:G.mode==='mgr',from:G.s?seasonLabel(G.s.year):'',to:G.s?seasonLabel(G.s.year):'',ap:0,g:0,l:G.s?G.s.league:''});}
  const head=`<section class="panel car-hd"><div class="car-av">${avatarSVG(c.c1,c.c2,s.status.includes('direktör')?'TD':(G&&G.p?G.p.num:9),s.age)}</div><div><span class="kicker">${esc(s.status)}</span><h3>${esc(s.name)}</h3><small>${s.from}${s.to&&s.to!==s.from?' – '+s.to:''} · ${s.age} yaş${s.peak?` · zirve ${R200(s.peak)} güç`:''}</small></div></section>
  <section class="panel"><div class="strip"><div><b>${t.apps}</b><span>Maç</span></div><div><b>${t.goals}</b><span>Gol</span></div><div><b>${t.assists}</b><span>Asist</span></div><div><b>${s.caps}</b><span>Milli</span></div><div><b>${s.trophies.length}</b><span>Ödül</span></div></div>
  ${s.mt&&s.mt.s?`<p class="muted" style="margin-top:10px;text-align:center">Teknik direktör olarak ${s.mt.s} sezon · ${s.mt.w}G ${s.mt.d}B ${s.mt.l}M</p>`:''}</section>`;
  const path=`<section class="panel"><p class="sub-h"><span>Kulüp yolculuğu</span><span>${cp.length} durak</span></p><ol class="cpath">${cp.map(x=>{const k=CLUBS[x.c];return k?`<li>${crestSVG(k,26)}<div><b>${esc(k.name)}${x.td?' <u class="rt r-xi">TD</u>':''}</b><small>${x.from===x.to?x.from:x.from+' – '+x.to} · ${LEAGUES[x.l]?LEAGUES[x.l].short:''}</small></div><em>${x.td?'':`${x.ap}M ${x.g}G`}</em></li>`:'';}).join('')}</ol></section>`;
  const ms=(s.ms||[]).slice().reverse();
  const tl=`<section class="panel"><p class="sub-h"><span>Kariyer anları</span><span>${ms.length}</span></p>${ms.length?`<ol class="tline">${ms.slice(0,live?60:200).map(m=>`<li class="ms-${m.ic}"><i>${MS_IC[m.ic]||'•'}</i><div><b>${esc(m.t)}</b><small>${esc(m.y)} · ${m.a} yaş</small></div></li>`).join('')}</ol>`:'<p class="muted">Oynadıkça kariyerinin önemli anları burada birikecek.</p>'}</section>`;
  const tr=`<section class="panel"><p class="sub-h"><span>Kupalar ve ödüller</span></p>${s.trophies.length?`<ul class="trophies">${s.trophies.map(x=>`<li><i>${x.y}</i>${esc(x.n)}${CLUBS[x.c]?' · '+esc(CLUBS[x.c].name):''}</li>`).join('')}</ul>`:'<p class="muted">Henüz kupa yok.</p>'}</section>`;
  const tbl=live?'':`<section class="panel"><p class="sub-h"><span>Sezonlar</span></p><div class="tbl-wrap"><table><thead><tr><th class="l">Sezon</th><th>Yaş</th><th class="l">Kulüp</th><th>M</th><th>G</th><th>A</th><th>Ort</th></tr></thead><tbody>${s.seasons.slice().reverse().map(h=>`<tr><td class="l">${h.y}</td><td>${h.a}</td><td class="l club">${CLUBS[h.c]?crestSVG(CLUBS[h.c],16):''}<span>${esc(CLUBS[h.c]?CLUBS[h.c].name:'')}${h.td?' (TD)':''}</span></td><td>${h.ap}</td><td>${h.g}</td><td>${h.as}</td><td>${h.r?dec(h.r):'—'}</td></tr>`).join('')}</tbody></table></div></section>`;
  return head+path+tl+tr+tbl;}
let CTAB='cur';
function viewCareer(){const arc=archList().filter(a=>a.id!==G.cid);
  const chips=`<div class="filt"><button class="chip" data-act="ctab" data-k="cur" aria-pressed="${CTAB==='cur'}">Bu kariyer</button><button class="chip" data-act="ctab" data-k="arc" aria-pressed="${CTAB==='arc'}">Geçmiş kariyerler${arc.length?` <em>${arc.length}</em>`:''}</button></div>`;
  if(CTAB==='arc')return `<h2 class="h">Kariyer</h2>${chips}${arc.length?`<ul class="arcs">${arc.map(a=>{const k=CLUBS[a.club];return `<li><button class="arc" data-act="arcOpen" data-id="${a.id}">${k?crestSVG(k,34):''}<div><b>${esc(a.name)}</b><small>${a.from}${a.to&&a.to!==a.from?' – '+a.to:''} · ${esc(a.status)}</small><span>${a.totals.apps} maç · ${a.totals.goals} gol · ${a.trophies.length} ödül${a.mt&&a.mt.s?` · ${a.mt.s} sezon TD`:''}</span></div></button></li>`;}).join('')}</ul>`:'<p class="empty">Henüz tamamlanmış bir kariyer yok. Emekli olduğunda ya da yeni bir kariyere başladığında eski kariyerin burada saklanır.</p>'}`;
  msSync();return `<h2 class="h">Kariyer</h2>${chips}${careerHTML(careerSnap(),true)}`;}
function showArc(id){const a=archList().find(x=>x.id===id);if(!a)return;openModal(`<div class="arc-modal">${careerHTML(a,false)}</div><button class="cta" data-act="closeModal" style="margin-top:10px">Kapat</button>`);}
function mgrRetire(){G.phase='retired';save();archSave();closeModal();TAB='career';CTAB='cur';render();window.scrollTo(0,0);}
function rshort(role){const m={Kaptan:['C','cap'],'Yıldız':['★','star'],'Takım lideri':['L','lead'],'Genç yetenek':['G','young']}[role];return m?`<u class="rs r-${m[1]}">${m[0]}</u>`:'';}

