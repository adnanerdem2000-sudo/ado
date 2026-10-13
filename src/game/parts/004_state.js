/* ================= STATE ================= */
let G=null,TAB='hub',SEL={pos:'FW',foot:'Sağ',club:null,int:'normal'},afterModal=null,confirmNew=false,INF='all',DR=null;
const SAVE_KEY='futbol-kariyer-v3';(function(){try{for(const k of Object.keys(localStorage)){if(k!==SAVE_KEY&&/^[a-z]+-[a-z]+-kariyer-v3$/.test(k)){if(localStorage.getItem(SAVE_KEY)==null)localStorage.setItem(SAVE_KEY,localStorage.getItem(k));localStorage.removeItem(k);}}}catch(e){}})();/* eski sürümün kayıt anahtarından taşı */
function save(){try{msSync();}catch(e){}try{localStorage.setItem(SAVE_KEY,JSON.stringify(G));}catch(e){}}
function load(){try{const s=localStorage.getItem(SAVE_KEY);const g=s?JSON.parse(s):null;return g&&g.v===4?g:null;}catch(e){return null;}}
const myClub=()=>CLUBS[G.club];
const curLeague=()=>LEAGUES[G.s.league];
const seasonLabel=y=>`${y}/${String(y+1).slice(2)}`;
function OVR(a=G.p.a,pos=G.p.pos){const w=POS[pos].w;let s=0;for(const k in w)s+=w[k]*a[k];return Math.round(s);}
const formAvg=()=>G.p.form.length?G.p.form.reduce((a,b)=>a+b,0)/G.p.form.length:6.5;
const seasonAvg=()=>G.s.stats.apps?G.s.stats.rsum/G.s.stats.apps:0;
const blankStats=()=>({apps:0,starts:0,goals:0,assists:0,rsum:0,mins:0,yc:0,rc:0});
function bump(k,v){G.p[k]=clamp(G.p[k]+v,0,100);}

/* ---------- Takvim ----------
   Sezon, 24 Ağustos’a denk gelen pazartesi başlar: 2,5 hafta hazırlık kampı, ardından iki haftada bir cumartesi lig maçı.
   7. haftadan sonra devre arası (ara transfer dönemi), 14. hafta nisanda. */
const DAY_MS=86400000,TR_DAYS=['Pzt','Sal','Çar','Per','Cum','Cmt','Paz'],TR_DAYS_L=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'],TR_MONTHS=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'],TR_MONTHS_L=['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık'];
function seasonStartTs(y){const d=Date.UTC(y,6,20),wd=(new Date(d).getUTCDay()+6)%7;return d-wd*DAY_MS;}
const ROUND_DAY=r=>G.s.cal[r-1];
function dateOf(day,y){return new Date(seasonStartTs(y??G.s.year)+day*DAY_MS);}
const wdOf=d=>(d.getUTCDay()+6)%7;
function fmtDate(d,year){return `${TR_DAYS[wdOf(d)]} ${d.getUTCDate()} ${TR_MONTHS[d.getUTCMonth()]}${year?' '+d.getUTCFullYear():''}`;}
function fmtLong(d){return `${TR_DAYS_L[wdOf(d)]}, ${d.getUTCDate()} ${TR_MONTHS_L[d.getUTCMonth()]} ${d.getUTCFullYear()}`;}
const today=()=>dateOf(G.s.day);
const when=()=>!G||!G.s?'':G.phase==='off'?`Yaz arası · ${G.s.year+1}`:fmtDate(today(),true);
function nextMatchDay(day){for(const d of G.s.cal)if(d>=day)return d;return null;}
function prevMatchDay(day){let p=null;for(const d of G.s.cal){if(d<day)p=d;else break;}return p;}
const DT={
  mac:{n:'Maç günü',s:'MAÇ',d:'Lig maçı. Isınma 1 saat önce başlıyor.'},
  milli:{n:'Milli maç',s:'MİLLİ',d:'Milli takım formasıyla maç.'},
  kupa:{n:'Kupa maçı',s:'KUPA',d:'Kupa gecesi! Eleme usulü maç; ışıklar altında büyük heyecan.'},
  toparlanma:{n:'Toparlanma',s:'TOPAR.',d:'Maç sonrası hafif koşu, havuz ve masaj.',team:1,e:-6,gain:{fiz:0.3}},
  izin:{n:'İzin günü',s:'İZİN',d:'Takım çalışmıyor. Gün senin.'},
  kondisyon:{n:'Kondisyon idmanı',s:'KOND.',d:'Sürat, dayanıklılık ve kuvvet istasyonları.',team:1,e:12,gain:{hiz:1,fiz:1}},
  teknik:{n:'Teknik idman',s:'TEKNİK',d:'Pas, top kontrolü ve bitiricilik çalışması.',team:1,e:8,gain:{pas:1,dri:1,sut:0.8}},
  taktik:{n:'Taktik idman',s:'TAKTİK',d:'Pres, savunma yerleşimi ve duran toplar.',team:1,e:6,gain:{def:1,pas:0.6},trust:0.6},
  hazirlik:{n:'Maç hazırlığı',s:'HAZIR.',d:'Hafif tempo, duran top provası. Kadro bugün açıklanır.',team:1,e:3,gain:{sut:0.3}},
  oyun:{n:'Çift kale maç',s:'Ç.KALE',d:'İdmanda iki takım. Hoca herkesi tek tek izliyor.',team:1,e:10,gain:{dri:0.6,sut:0.6,pas:0.6},trust:0.2},
  kamp:{n:'Hazırlık kampı',s:'KAMP',d:'Çift antrenman: sabah kondisyon, akşam taktik.',team:1,e:14,gain:{hiz:0.8,fiz:1.2,pas:0.6,dri:0.6},trust:0.4},
  tatil:{n:'Devre arası',s:'TATİL',d:'Lig arada, takım izinde. Ara transfer dönemi açık.'},
  yaz:{n:'Yaz dönemi',s:'YAZ',d:'Takım henüz toplanmadı. Dinlen ya da bireysel çalış.'},
};
const PATTERN={1:'hazirlik',2:'taktik',3:'teknik',4:'kondisyon',5:'oyun',6:'teknik',7:'kondisyon',8:'teknik',9:'taktik',10:'oyun',11:'kondisyon',12:'teknik',13:'taktik'};
function dayType(day){
  if(G.s.nat&&G.s.nat.day===day)return 'milli';
  if(G.phase==='season'&&cupDayFor(day))return 'kupa';
  const cal=G.s.cal,nm=nextMatchDay(day);if(nm===day)return 'mac';
  if(day<cal[0]-21)return 'yaz';
  if(day<cal[0]-4)return day%7===6?'izin':'kamp';
  const pm=prevMatchDay(day);
  if(pm!=null&&day===pm+1)return 'toparlanma';
  if(G.s.cupDays&&G.s.cupDays.includes(day-1))return 'toparlanma';
  if(nm!=null&&nm-day===1)return 'hazirlik';
  if(pm!=null&&day===pm+2)return 'izin';
  if(nm==null)return 'izin';
  if(pm!=null&&nm-pm>16){if(day<nm-10)return 'tatil';return day%7===6?'izin':'kamp';}
  return PATTERN[nm-day]||'teknik';}

function msg(t,title,body,extra){G.inbox.unshift(Object.assign({id:uid(),t,title,body,read:false,when:when()},extra||{}));if(G.inbox.length>120)G.inbox.length=120;}

function makeFixtures(ids){const n=ids.length,arr=ids.slice(),rounds=[];for(let r=0;r<n-1;r++){const rd=[];for(let i=0;i<n/2;i++){const a=arr[i],b=arr[n-1-i];rd.push(r%2?[b,a]:[a,b]);}rounds.push(rd);arr.splice(1,0,arr.pop());}return rounds.concat(rounds.map(rd=>rd.map(([a,b])=>[b,a])));}
function lambdas(hs,as){const d=(hs-as)/18;return [clamp(1.3*Math.exp(d*0.9)+0.12,0.2,4.2),clamp(1.1*Math.exp(-d*0.9),0.15,4)];}
function simScore(h,a){const [lh,la]=lambdas(CLUBS[h].str,CLUBS[a].str);return [poisson(lh),poisson(la)];}
const PS_ROLES=[['FW',0.36,0.14],['KN',0.2,0.26],['OS',0.16,0.28],['OS',0.1,0.18],['DF',0.08,0.08],['FW',0.1,0.06]];
function genPS(L){const ps={};for(const c of leagueClubs(L))for(const p of squadOf(c.id)){if(p.pos==='KL')continue;const q=Math.max(0.25,(p.ovr-c.str+12)/12);ps[p.k]={n:p.name,c:c.id,gw:GWP[p.pos]*q,aw:AWP[p.pos]*q,g:0,a:0};}return ps;}
/* Lig istatistikleri: her golün atanı ve asistçisi kulüp kadrosundan seçilir; oyuncunun kendi golleri ve asistleri gerçek maçtan gelir. */
function creditGoals(cid,n,me){const pl=Object.values(G.s.ps).filter(p=>p.c===cid);if(!pl.length)return;let cg=me?Math.min(me.g,n):0,ca=me?me.a:0;
  for(let i=0;i<n;i++){if(cg>0){cg--;if(Math.random()<0.7)wpick(pl.map(p=>[p,p.aw])).a++;continue;}
    const sc=wpick(pl.map(p=>[p,p.gw]));sc.g++;if(ca>0){ca--;continue;}if(Math.random()<0.72){const o=pl.filter(p=>p!==sc);wpick(o.map(p=>[p,p.aw])).a++;}}}
function creditRound(rd,me){for(const [h,a,hg,ag] of rd){creditGoals(h,hg,h===G.club?me:null);creditGoals(a,ag,a===G.club?me:null);}}
function leaders(k){const arr=Object.values(G.s.ps||{}).map(p=>({n:p.n,c:p.c,v:p[k]}));if(isPl())arr.push({n:(meN()),c:G.club,v:G.s.stats[k==='g'?'goals':'assists'],me:true});return arr.sort((x,y)=>y.v-x.v||(y.me?1:0)-(x.me?1:0));}
function newSeason(year){const L=myClub().league;G.s={year,week:1,day:0,league:L,cal:buildCal(L,year),win:{open:dayOfDate(year,0,2),close:dayOfDate(year,0,31)},fixtures:makeFixtures(shuffle(leagueClubs(L).map(c=>c.id))),results:[],stats:blankStats(),nat:null,squad:null,sacked:{},ps:genPS(L),mon:null,mrs:[],totw:0};G.slot=false;G.slotText='';}
function switchLeague(L){G.s.league=L;G.s.cal=buildCal(L,G.s.year);const wk=G.s.cal.filter(d=>d<G.s.day).length+1;G.s.week=wk;G.s.ps=genPS(L);G.s.fixtures=makeFixtures(shuffle(leagueClubs(L).map(c=>c.id)));G.s.results=[];for(let w=0;w<wk-1;w++){const rd=G.s.fixtures[w].map(([h,a])=>{const [x,y]=simScore(h,a);return [h,a,x,y];});G.s.results.push(rd);creditRound(rd,null);}}
const ourFixture=()=>G.s.fixtures[G.s.week-1]&&G.s.fixtures[G.s.week-1].find(f=>f.includes(G.club));
function table(){return tableOf(G.s.league,G.s.results);}
function tableOld(){const T={};leagueClubs(G.s.league).forEach(c=>T[c.id]={id:c.id,o:0,g:0,b:0,m:0,a:0,y:0,p:0});
  G.s.results.forEach(rd=>rd.forEach(([h,a,hg,ag])=>{const H=T[h],A=T[a];if(!H||!A)return;H.o++;A.o++;H.a+=hg;H.y+=ag;A.a+=ag;A.y+=hg;if(hg>ag){H.g++;A.m++;H.p+=3;}else if(hg<ag){A.g++;H.m++;A.p+=3;}else{H.b++;A.b++;H.p++;A.p++;}}));
  return Object.values(T).sort((x,y)=>y.p-x.p||(y.a-y.y)-(x.a-x.y)||y.a-x.a);}
const tablePos=()=>table().findIndex(r=>r.id===G.club)+1;

function newGame(pos,foot,clubId){
  const P=POS[pos],a={},pot={};
  for(const k in ATTR){a[k]=P.base[k]+rnd(-2,2);pot[k]=clamp(Math.round(P.base[k]+50+rnd(-3,4)),58,95);}
  const focus=Object.entries(P.w).sort((x,y)=>y[1]-x[1])[0][0];
  G={v:4,phase:'season',p:{name:(typeof wizName==='function'?wizName():''),pos,foot,num:P.num,age:12,a,pot,energy:100,morale:70,trust:58,fame:0,money:500,form:[],injury:null,ban:0,yellows:0,up:{},caps:0,natGoals:0,playHurt:false,lic:`34-14-${rint(1000,9999)}`},
     club:clubId,contract:{years:2,wage:LEAGUES.u14.wage,role:'Altyapı'},s:null,history:[],trophies:[],inbox:[],next:null,mustMove:false,totals:{apps:0,goals:0,assists:0},summary:null,
     watch:{},plan:{focus,int:'normal'},slot:false,slotText:'',tutSeen:false};
  newSeason(2026);
  msg('coach',('Hoş geldin '+meF()+'!'),`${CLUBS[clubId].name} altyapısına imza attın. Hocan: “Burada herkes yerini sahada kazanır. Hazırlık kampı bugün başlıyor, ilk lig maçımız ${fmtDate(dateOf(ROUND_DAY(1)),true)}.” Gözlemciler maçları izliyor; iyi oynarsan üst liglerden bile kapın çalınabilir.`);
  save();
}

