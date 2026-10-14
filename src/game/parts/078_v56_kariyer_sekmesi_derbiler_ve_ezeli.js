/* ================= v56: kariyer sekmesi, derbiler ve ezeli rekabetler, maç primleri, rakip dizilişi ================= */
/* ---------- oyuncu profili: Kariyer / Karşılaştır sekmeleri üst panelde açılsın ---------- */
function fmpMoveSec(root,k){const s=root&&root.closest?root.closest('.fmp'):null;if(!s)return;const info=s.querySelector('.fmp-info');if(!info)return;
  const cls=k==='kr'?'.fmp-krx':k==='cp'?'.fmp-cpx:not(.sr-cp)':null;if(!cls)return;const sec=s.querySelector(cls);if(sec&&sec.parentElement!==info){info.appendChild(sec);}}
ACTX.fmpTab=(old=>function(el){const r=old?old(el):null;try{fmpMoveSec(el,el.dataset.k);const s=el.closest('.fmp');if(s){const info=s.querySelector('.fmp-info');if(info)info.scrollTop=0;}}catch(e){console.warn(e);}return r;})(ACTX.fmpTab);

/* ---------- DERBİLER: dünya futbolunun büyük rekabetleri ---------- */
/* [kulüp A, kulüp B, ad, seviye 1-3, kısa hikâye] — seviye 3: ezeli rakip */
const DERBY=[
 ['galatasaray','fenerbahce','Kıtalararası Derbi',3,'Türk futbolunun en büyük rekabeti. Boğaz’ın iki yakası, yüz yılı aşan bir husumet.'],
 ['besiktas','fenerbahce','İstanbul Derbisi',3,'Kadıköy ile Beşiktaş arasında kuşaklardır süren bir gerilim.'],
 ['besiktas','galatasaray','İstanbul Derbisi',3,'Şehrin iki köklü kulübü; tribünler haftalar önceden hazırlanır.'],
 ['trabzonspor','fenerbahce','Karadeniz–İstanbul Rekabeti',2,'1970’lerden beri şampiyonluk yarışlarının belirleyicisi.'],
 ['trabzonspor','galatasaray','Karadeniz–İstanbul Rekabeti',2,'Anadolu’nun İstanbul hegemonyasına meydan okuması.'],
 ['trabzonspor','besiktas','Karadeniz–İstanbul Rekabeti',2,'Avni Aker’den Papara Park’a sert geçen maçlar.'],
 ['samsunspor','trabzonspor','Karadeniz Derbisi',2,'Karadeniz’in iki büyüğü arasında yerel gurur savaşı.'],
 ['rizespor','trabzonspor','Karadeniz Derbisi',1,'Komşu şehirlerin çekişmesi.'],
 ['ankaragucu','genclerbirligi','Ankara Derbisi',2,'Başkentin iki rengi.'],
 ['kocaelispor','sakaryaspor','Marmara Derbisi',2,'Tribünlerin en ateşli olduğu Anadolu derbilerinden.'],
 ['sivasspor','kayserispor','Anadolu Derbisi',2,'Komşu iki şehrin yıllara dayanan çekişmesi.'],
 ['antalyaspor','alanyaspor','Akdeniz Derbisi',1,'Akdeniz kıyısında bölge üstünlüğü.'],
 ['goztepe','altinordu','İzmir Derbisi',1,'İzmir’in köklü kulüpleri karşı karşıya.'],
 ['bursaspor','amedspor','Gergin Rekabet',1,'Son yıllarda yüksek tansiyonlu geçen maçlar.'],
 ['karagumruk','istanbulspor','İstanbul Yerel Derbisi',1,'İstanbul’un orta sınıf kulüplerinin çekişmesi.'],
 ['orduspor52','orduspor1967','Ordu Derbisi',1,'Aynı şehrin iki Ordusporu.'],
 ['mun','liv','Kuzeybatı Derbisi',3,'İngiltere’nin en başarılı iki kulübü arasındaki tarihî rekabet.'],
 ['liv','eve','Merseyside Derbisi',3,'Stanley Park’ın iki yakası, aileleri bölen derbi.'],
 ['mun','mci','Manchester Derbisi',3,'Kırmızı ve mavi Manchester.'],
 ['ars','tot','Kuzey Londra Derbisi',3,'Londra’nın kuzeyinde bitmeyen kan davası.'],
 ['ars','che','Londra Derbisi',2,'Başkentin iki devi.'],['che','tot','Londra Derbisi',2,'Stamford Bridge’te sertleşen maçlar.'],
 ['ars','mun','Büyük Rekabet',2,'Ferguson–Wenger döneminin efsanevi çekişmesi.'],['liv','mci','Modern Klasik',2,'Son yılların şampiyonluk rakipleri.'],
 ['new','sun','Tyne–Wear Derbisi',3,'Kuzey-doğu İngiltere’nin ezeli rakipleri.'],['avl','bir','İkinci Şehir Derbisi',3,'Birmingham’ın iki yüzü.'],
 ['whu','mil','Doklar Derbisi',3,'Doğu Londra’nın sert geçmişi.'],['whu','tot','Londra Derbisi',2,'Doğu ve kuzey Londra.'],
 ['wol','wba','Black Country Derbisi',3,'Sanayi bölgesinin gurur maçı.'],['shu','shw','Steel City Derbisi',3,'Sheffield’in iki kulübü.'],
 ['lee','mun','Güller Savaşı',2,'Yorkshire ile Lancashire.'],['nfo','der','East Midlands Derbisi',2,'Brian Clough’un iki kulübü.'],
 ['nor','ips','Doğu Anglia Derbisi',2,'“Old Farm” derbisi.'],['por','sou','South Coast Derbisi',3,'Güney sahilinin ezeli rakipleri.'],
 ['swa','car','Güney Galler Derbisi',3,'Galler’in en ateşli maçı.'],['bri','car','Severnside Derbisi',2,'Severn nehrinin iki yakası.'],
 ['bla','bur','East Lancashire Derbisi',3,'Lancashire’ın en eski rekabetlerinden.'],['pne','bla','Lancashire Derbisi',2,'Komşu kasabaların çekişmesi.'],
 ['cry','bha','M23 Derbisi',2,'Otoyolla bağlanan beklenmedik bir husumet.'],['ful','che','Batı Londra Derbisi',1,'Komşu semtler.'],
 ['rma','fcb','El Clásico',3,'Dünyanın en çok izlenen kulüp maçı.'],['rma','atm','Madrid Derbisi',3,'Başkentin iki rengi.'],
 ['fcb','esp','Barcelona Derbisi',2,'Katalonya’nın iki kulübü.'],['bet','sev','Sevilla Derbisi',3,'Endülüs’ün en ateşli maçı.'],
 ['ath','rso','Bask Derbisi',2,'Bask bölgesinin gurur maçı.'],['val','lev','Valencia Derbisi',2,'Şehrin iki kulübü.'],
 ['cel','dep','Galiçya Derbisi',2,'Kuzeybatının büyük rekabeti.'],['spo','ovi','Asturias Derbisi',2,'Gijón ile Oviedo.'],
 ['lpa','ten','Kanarya Derbisi',2,'Adalar arası rekabet.'],['get','leg','Güney Madrid Derbisi',1,'Banliyö rekabeti.'],['fcb','atm','Büyük Maç',2,'Şampiyonluk yarışının klasik randevusu.'],
 ['inter','milan','Derby della Madonnina',3,'San Siro’yu paylaşan iki dev.'],['roma','lazio','Derby della Capitale',3,'Roma’nın ikiye bölündüğü gün.'],
 ['juve','torino','Derby della Mole',3,'Torino’nun ezeli rekabeti.'],['juve','inter','Derby d’Italia',3,'İtalya’nın en büyük kulüp rekabeti.'],
 ['genoa','sampdor','Derby della Lanterna',3,'Cenova’nın deniz feneri derbisi.'],['napoli','roma','Derby del Sole',2,'Güneyin iki büyüğü.'],
 ['napoli','juve','Kuzey–Güney Rekabeti',2,'İtalya’nın iki yarısı.'],['fiorent','juve','Ezeli Husumet',2,'Floransa’nın Torino’ya kini.'],['milan','juve','Büyük Maç',2,'Scudetto rakipleri.'],
 ['bologna','fiorent','Derby dell’Appennino',1,'Apeninlerin iki yakası.'],['padova','vicenza','Derby Veneto',1,'Veneto bölgesinin çekişmesi.'],['verona','vicenza','Derby Veneto',1,'Komşu şehirler.'],
 ['bvb','schalke','Revierderbi',3,'Ruhr havzasının işçi sınıfı derbisi.'],['bayern','bvb','Der Klassiker',3,'Almanya’nın şampiyonluk rekabeti.'],
 ['hsv','bremen','Nordderby',3,'Kuzey Almanya’nın en eski derbisi.'],['hsv','stpauli','Hamburg Derbisi',3,'Şehrin iki farklı kimliği.'],
 ['koeln','bmg','Rheinderbi',2,'Ren bölgesinin gurur maçı.'],['unionb','hertha','Berlin Derbisi',2,'Doğu ve batı Berlin.'],
 ['frankft','darmst','Hessen Derbisi',2,'Hessen eyaletinin çekişmesi.'],['vfbstu','ksc','Baden–Württemberg Derbisi',2,'Güney Almanya’nın sert maçı.'],
 ['nurnbg','furth','Franken Derbisi',2,'Almanya’nın en çok oynanan derbisi.'],['hannovr','braunsc','Niedersachsen Derbisi',2,'Aşağı Saksonya’nın büyük maçı.'],
 ['levkus','koeln','Ren Komşuları',1,'Komşu şehirler.'],['mainz','fck','Güneybatı Derbisi',1,'Rheinland-Pfalz rekabeti.'],
 ['psg','om','Le Classique',3,'Paris ile Marsilya: Fransa’nın en büyük rekabeti.'],['ol','ase','Derby du Rhône',3,'Rhône vadisinin ezeli rakipleri.'],
 ['rcl','losc','Derby du Nord',3,'Kuzey Fransa’nın maden havzası derbisi.'],['ogcn','asm','Derby de la Côte d’Azur',2,'Azur kıyısının iki kulübü.'],
 ['srfc','nan','Derby de l’Ouest',2,'Batının büyük maçı.'],['om','ol','Olympico',2,'İki Olympique.'],['anl','met','Derby Lorrain',2,'Lorraine bölgesinin rekabeti.'],['srfc','sb29','Breton Derbisi',1,'Bretanya’nın çekişmesi.'],
 ['benfica','sporting','Lizbon Derbisi',3,'Lizbon’un iki devi.'],['benfica','porto','O Clássico',3,'Portekiz’in kuzey–güney rekabeti.'],
 ['porto','sporting','Büyük Maç',2,'Portekiz’in büyük üçlüsünden.'],['braga','vguimar','Minho Derbisi',2,'Minho bölgesinin gurur maçı.'],
 ['ajax','feyenoord','De Klassieker',3,'Amsterdam ile Rotterdam: Hollanda’nın ezeli rekabeti.'],['ajax','psv','Topper',2,'Şampiyonluk rakipleri.'],
 ['feyenoord','psv','Büyük Maç',2,'Rotterdam ile Eindhoven.'],['groning','heerenv','Kuzey Derbisi',2,'Kuzey Hollanda’nın derbisi.'],['feyenoord','spartar','Rotterdam Derbisi',1,'Şehrin iki kulübü.'],
 ['anderl','standard','Le Clasico',3,'Belçika’nın en büyük rekabeti.'],['brugge','anderl','De Topper',2,'Flaman ile Brüksel.'],
 ['brugge','cercle','Brugge Derbisi',2,'Aynı stadı paylaşan iki kulüp.'],['genk','stvv','Limburg Derbisi',1,'Limburg eyaleti rekabeti.'],['charler','standard','Valon Derbisi',1,'Valon bölgesinin çekişmesi.'],
 ['celticfc','rangersfc','Old Firm',3,'Glasgow’u ikiye bölen dünyanın en sert derbilerinden.'],['hearts','hibernian','Edinburgh Derbisi',3,'İskoçya başkentinin rekabeti.'],
 ['dundeefc','dundeeutd','Dundee Derbisi',2,'Stadyumları aynı sokakta.'],['aberdeen','rangersfc','Ezeli Husumet',2,'1980’lerden beri gergin.'],
 ['olympiak','pao','Ezeli Rakipler Derbisi',3,'Yunanistan’ın “derbilerin anası”.'],['paok','aris','Selanik Derbisi',3,'Selanik’in iki kulübü.'],
 ['aek','olympiak','Atina Derbisi',2,'Atina–Pire rekabeti.'],['aek','pao','Atina Derbisi',2,'Başkentin çekişmesi.'],['paok','olympiak','Kuzey–Güney',2,'Yunanistan’ın iki kutbu.'],
 ['rapid','austriaw','Viyana Derbisi',3,'Avusturya’nın en çok oynanan derbisi.'],['sturm','gak','Graz Derbisi',2,'Graz’ın iki kulübü.'],['lask','bwlinz','Linz Derbisi',2,'Linz’in iki rengi.'],
 ['basel','fczurich','Der Klassiker',2,'İsviçre’nin büyük maçı.'],['fczurich','gcz','Zürih Derbisi',2,'Zürih’in iki kulübü.'],['basel','youngboys','Büyük Maç',2,'Şampiyonluk rakipleri.'],['servette','lausanne','Léman Derbisi',1,'Cenevre Gölü kıyısı.'],
 ['kobenhavn','brondby','New Firm',3,'Danimarka’nın en sert rekabeti.'],
 ['alhilal','alnassr','Riyad Derbisi',3,'Suudi Arabistan’ın en büyük maçı.'],['alahli','alittih','Cidde Derbisi',3,'Kızıldeniz kıyısının ezeli rakipleri.'],
 ['alhilal','alittih','Suudi Klasiği',2,'İki büyük şehrin şampiyonluk rekabeti.'],['alnassr','alittih','Büyük Maç',2,'Riyad ile Cidde.'],
 ['flamengo','fluminense','Fla–Flu',3,'Maracanã’nın efsanevi derbisi.'],['flamengo','vasco','Clássico dos Milhões',3,'Milyonların derbisi.'],
 ['corinth','palmeir','Derby Paulista',3,'São Paulo’nun ezeli rekabeti.'],['corinth','saopaulo','Majestoso',2,'São Paulo’nun büyük maçı.'],['palmeir','saopaulo','Choque-Rei',2,'Kralların çarpışması.'],
 ['santos','corinth','San-São',2,'Sahil ile başkent.'],['gremio','intpoa','Gre–Nal',3,'Porto Alegre’nin ikiye bölündüğü derbi.'],['atlmg','cruzeiro','Clássico Mineiro',3,'Minas Gerais’in ezeli rekabeti.'],
 ['bahia','vitoria','Ba–Vi',3,'Bahia’nın büyük derbisi.'],['athletpr','coritiba','Atletiba',3,'Paraná’nın ezeli rakipleri.'],['botafogo','flamengo','Rio Klasiği',2,'Rio’nun büyük maçı.'],['fluminense','vasco','Rio Klasiği',2,'Rio’nun büyük maçı.']];
const DERBY_IX=(()=>{const m={};for(const d of DERBY){m[d[0]+'|'+d[1]]=d;m[d[1]+'|'+d[0]]=d;}return m;})();
function derbyOf(a,b){if(!a||!b)return null;const d=DERBY_IX[a+'|'+b];if(!d||!CLUBS[d[0]]||!CLUBS[d[1]])return null;return {a:d[0],b:d[1],n:d[2],lv:d[3],t:d[4],key:[d[0],d[1]].sort().join('|')};}
const derbyLvN=lv=>lv>=3?'Ezeli rakip':lv===2?'Büyük derbi':'Yerel derbi';
/* geçmiş: G.dh[key]=[[yıl,ev,dep,evGol,depGol],...] */
function dhAdd(h,a,hg,ag){const D=derbyOf(h,a);if(!D||!G)return;G.dh=G.dh||{};const L=G.dh[D.key]=G.dh[D.key]||[];L.unshift([G.s?G.s.year:2026,h,a,hg,ag]);if(L.length>12)L.length=12;}
creditRound=(old=>function(rd,me){const r=old.apply(this,arguments);try{for(const [h,a,hg,ag] of rd)if(DERBY_IX[h+'|'+a])dhAdd(h,a,hg,ag);}catch(e){}return r;})(creditRound);
function dhRec(D,us){const L=(G.dh&&G.dh[D.key])||[];let w=0,d=0,l=0;for(const [,h,a,hg,ag] of L){const mine=h===us?hg:ag,th=h===us?ag:hg;if(mine>th)w++;else if(mine===th)d++;else l++;}return {w,d,l,L};}
/* zihinsel güç: soğukkanlılık, kararlılık, konsantrasyon, cesaret (1-20) */
function mentalOf(p){try{const v=['Soğukkanlılık','Kararlılık','Konsantrasyon','Cesaret'].map(n=>fmA(p,n)).filter(x=>x!=null&&!isNaN(x));if(v.length)return v.reduce((a,b)=>a+b,0)/v.length;}catch(e){}return 11;}
function teamMental(id){const sq=squadOf(id).slice().sort((a,b)=>b.ovr-a.ovr).slice(0,11);if(!sq.length)return 11;return sq.reduce((a,p)=>a+mentalOf(p),0)/sq.length;}
function meMental(){const p=G.p;let m=10+((p.morale||50)-50)/12+Math.min(3,((G.totals&&G.totals.apps)||0)/70)+Math.min(1.5,Math.max(0,(p.age||20)-20)*0.15);
  if(typeof hasPk==='function'){if(hasPk('sogukkanli'))m+=2;if(hasPk('buyuk'))m+=2.5;if(hasPk('lider'))m+=1;if(hasPk('savasci'))m+=1;}return clamp(m,4,20);}
function derbyBadge(D,us){if(!D)return '';const R=us?dhRec(D,us):null;
  return `<div class="derby-band lv${D.lv}"><span class="db-fire">🔥</span><div><b>${esc(D.n)}</b><small>${derbyLvN(D.lv)} · ${esc(D.t)}</small>${R&&R.L.length?`<em>Son ${R.L.length} derbi: ${R.w}G ${R.d}B ${R.l}M</em>`:''}</div></div>`;}
/* bilet kartında derbi ve prim bandı */
ticketHTML=(old=>function(label,side,h,a,status){let html=old.apply(this,arguments);try{if(!h||!a||!G)return html;const D=derbyOf(h.id,a.id),us=[h.id,a.id].includes(G.club)?G.club:null;
    let add='';if(D)add+=derbyBadge(D,us);const P=us?primNow():null;if(P)add+=primBand(P);
    if(add)html=html.replace('<div class="ticket-foot">',add+'<div class="ticket-foot">');}catch(e){console.warn(e);}return html;})(ticketHTML);
/* futbolcu modu: derbide zihinsel güç belirleyici */
buildMatch=(old=>function(us,opp,usHome,role,comp,national){const cfg=old.apply(this,arguments);try{if(national||!us||!opp)return cfg;const D=derbyOf(us.id,opp.id),P=primNow();
    cfg.pkq=Object.assign({},cfg.pkq||{});const mul=(f)=>{for(const k of ['atak','kontra','serbest','korner','penalti','savunma','dkorner']){if(k==='savunma'||k==='dkorner')cfg.pkq[k]=(cfg.pkq[k]||0)+(f-1)*0.5;else cfg.pkq[k]=(cfg.pkq[k]||1)*f;}};
    if(D){const mU=teamMental(us.id),mO=teamMental(opp.id),me=meMental(),k=D.lv/3;cfg.derby=D;cfg.dMent=me;
      cfg.lamUs=Math.max(0.15,cfg.lamUs*(1+(mU-mO)*0.03*k));cfg.lamOpp=Math.max(0.15,cfg.lamOpp*(1+(mO-mU)*0.03*k));
      /* derbiler daha çekişmeli: güç farkı biraz erir */const avg=(cfg.lamUs+cfg.lamOpp)/2;cfg.lamUs=avg+(cfg.lamUs-avg)*(1-0.15*k);cfg.lamOpp=avg+(cfg.lamOpp-avg)*(1-0.15*k);
      mul(1+(me-11)*0.025*(0.6+k*0.6));}
    if(P){cfg.prim=P;cfg.lamUs*=1+0.06*P.mot;cfg.lamOpp*=1-0.03*P.mot;mul(1+0.07*P.mot);}}catch(e){console.warn(e);}return cfg;})(buildMatch);
/* canlı anlarda derbi baskısı: soğukkanlı oyuncu özelliklerini kullanır, gergin olan kaybeder */
startMoment=(old=>function(type,C,title,done){try{if(isPl()&&typeof MR!=='undefined'&&MR&&(MR.derby||MR.prim)&&C&&C.a&&!C.drill){const a=Object.assign({},C.a);let d=0;
      if(MR.derby){d+=Math.round((meMental()-11)*0.9*(0.5+MR.derby.lv/3));}if(MR.prim)d+=Math.round(2*MR.prim.mot);
      if(d){for(const k in a)a[k]=clamp((a[k]||0)+d,1,99);C=Object.assign({},C,{a});}}}catch(e){console.warn(e);}return old.call(this,type,C,title,done);})(startMoment);
/* derbi sonrası: moral, şöhret, taraftar */
finishLeague=(old=>function(res,f,role){let D=null;try{D=derbyOf(f[0],f[1]);}catch(e){}const r=old.apply(this,arguments);
  try{if(D&&isPl()){const usHome=f[0]===G.club,win=res.us>res.opp,draw=res.us===res.opp,p=G.p;
      if(win){p.morale=clamp(p.morale+5*D.lv/2,0,100);p.fame=clamp(p.fame+(res.played?1.5:0.5)*D.lv,0,100);msg('news',`Derbi zaferi: ${D.n}`,`${myClub().name} ${D.n}’nde ${res.us}-${res.opp} kazandı. Taraftarlar sokaklarda kutlama yapıyor${res.played&&res.goals?`; ${res.goals} golünle derbinin kahramanı sensin`:''}.`);}
      else if(!draw){p.morale=clamp(p.morale-4*D.lv/2,0,100);msg('news',`Derbi hezimeti: ${D.n}`,`${myClub().name} ezeli rakibine ${res.us}-${res.opp} kaybetti. Taraftarlar tepkili, hafta boyunca baskı yüksek olacak.`);}}}catch(e){console.warn(e);}return r;})(finishLeague);
/* TD: derbide takımın zihinsel gücü */
mgrMods=(old=>function(opp){const r=old.apply(this,arguments);try{const D=opp&&derbyOf(G.club,opp.id);if(D){const d=(teamMental(G.club)-teamMental(opp.id))*0.025*D.lv/3;r.u*=1+d;r.o*=1-d;}const P=primNow();if(P){r.u*=1+0.04*P.mot;}}catch(e){}return r;})(mgrMods);
fxStart=(old=>function(o){const r=old.apply(this,arguments);try{const S=FX;if(!S||!o||!o.opp)return r;const D=derbyOf(G.club,o.opp.id);S.derby=D;
    if(D){const k=D.lv/3;for(const T of S.T)for(const p of T.P){const sp=pByKey(p.k);const m=sp?mentalOf(sp):11,d=(m-11)*0.012*(0.5+k);for(const q of ['sh','pa','dr','df'])if(p.a[q]!=null)p.a[q]=clamp(p.a[q]*(1+d),10,99);if(p.fa){p.fa['Agresiflik']=clamp((p.fa['Agresiflik']||10)+2*k+(m<10?1.5:0),1,20);}p.dMent=m;}
      fxEv(0,`🔥 ${D.n}! ${derbyLvN(D.lv)}. Tribünler tıklım tıklım, gerginlik had safhada. Soğukkanlı oyuncular bu atmosferde öne çıkacak.`,'bold');try{fxSay(`${D.n} başlıyor! Stat yerinden oynuyor.`,true);}catch(e){}}
    const P=primNow();if(P&&G.mode==='mgr'){for(const p of S.U.P)for(const q of ['sh','pa','dr','df'])if(p.a[q]!=null)p.a[q]=clamp(p.a[q]*(1+0.02*P.mot),10,99);fxEv(0,`Yönetim maç öncesi prim açıkladı; oyuncular hırslı.`,'tac');}}catch(e){console.warn(e);}return r;})(fxStart);
mgrFinish=(old=>function(gu,go,f,scorers){let D=null;try{D=derbyOf(f[0],f[1]);}catch(e){}const P=primNow();const r=old.apply(this,arguments);
  try{const m=G.m;if(D&&m){const win=gu>go,draw=gu===go;m.conf=clamp(m.conf+(win?3:draw?0:-3)*D.lv/2,0,100);if(win)msg('news',`Derbi zaferi: ${D.n}`,`Taraftar ${gu}-${go}’lık galibiyetle bayram ediyor. Yönetim güveni arttı.`);else if(!draw)msg('news',`Derbi yenilgisi: ${D.n}`,`Ezeli rakibe ${gu}-${go} kaybedilen maç sonrası tribünlerden tepki var.`);}
    if(P&&m&&gu>go){const cost=Math.round(P.win*18);m.budget=Math.max(0,m.budget-cost);msg('board','Primler ödendi',`Galibiyet sonrası oyunculara toplam ${money(cost)} prim ödendi.`);}}catch(e){console.warn(e);}return r;})(mgrFinish);

/* ---------- MAÇ PRİMLERİ: başkan bazı maçlara galibiyet / gol primi açıklar ---------- */
const PRES_REAL={galatasaray:'Dursun Özbek',fenerbahce:'Sadettin Saran',besiktas:'Serdal Adalı',trabzonspor:'Ertuğrul Doğan'};
function presName(id){if(PRES_REAL[id])return PRES_REAL[id];if(G&&G.mode==='mgr'&&id===G.club&&G.m&&G.m.el&&G.m.el.pres)return G.m.el.pres;const r=srng(id+'pres');r();return PRES_N[Math.floor(r()*PRES_N.length)];}
function primNow(){if(!G||!G.s||G.phase!=='season')return null;if(!(isPl()||G.mode==='mgr'))return null;const f=ourFixture();if(!f)return null;const P=G.s.prim;return P&&P.w===G.s.week&&P.y===G.s.year?P:null;}
function primRoll(){if(!G||!G.s||G.phase!=='season'||!(isPl()||G.mode==='mgr'))return;const f=ourFixture();if(!f)return;const S=G.s;if(S.primChk===S.year*100+S.week)return;S.primChk=S.year*100+S.week;
  const nm=nextMatchDay(S.day);if(nm==null||nm-S.day>3)return;
  const us=G.club,opp=f[0]===us?f[1]:f[0],D=derbyOf(us,opp),c=CLUBS[us],o=CLUBS[opp];let pr=0.08,why='';
  if(D){pr+=[0,0.3,0.55,0.85][D.lv];why=`${D.n} öncesi`;}
  try{const tb=table(),me=tb.findIndex(r=>r.id===us)+1,ot=tb.findIndex(r=>r.id===opp)+1,n=tb.length,left=NR()-S.week;if(S.results.length>=4){if(me<=3&&ot<=4){pr+=0.3;why=why||'Zirve yarışındaki kritik maç öncesi';}if(left<=6&&(me<=2||me>=n-3)){pr+=0.25;why=why||(me<=2?'Şampiyonluk yolunda':'Küme düşme hattından kurtulmak için');}if(S.results.length>=6){const L=S.results.slice(-3).map(rd=>rd.find(x=>x[0]===us||x[1]===us)).filter(Boolean);const lost=L.filter(([h,a,hg,ag])=>(h===us?hg<ag:ag<hg)).length;if(lost>=2){pr+=0.2;why=why||'Kötü gidişi durdurmak için';}}}}catch(e){}
  if(o&&c&&o.str>=c.str+5){pr+=0.12;why=why||'Güçlü rakip karşısında';}
  if(Math.random()>=pr)return;
  const lvK=D?1+D.lv*0.35:1;let base;if(isPl()){base=Math.max(E2U(1500),(G.contract&&G.contract.wage)||0);}else{const w=typeof wageBill==='function'?wageBill():0;base=Math.max(E2U(4000),w/52/22||E2U(8000));}
  const win=Math.round(base*(0.5+Math.random()*0.7)*lvK/100)*100,goal=isPl()&&Math.random()<0.65?Math.round(base*(0.2+Math.random()*0.3)*lvK/100)*100:0;
  const mot=clamp(0.6+(D?D.lv*0.2:0)+(win>base?0.3:0),0.5,1.5);
  S.prim={y:S.year,w:S.week,win,goal,mot,why:why||'Taraftara armağan için',pres:presName(us),opp};
  const on=o?o.name:'rakip';msg('board',`Başkandan prim müjdesi: ${on} maçı`,`Kulüp başkanı ${S.prim.pres} ${S.prim.why.toLowerCase()} oyunculara ${money(win)} galibiyet primi${goal?` ve gol başına ${money(goal)} prim`:''} açıkladı. “Bu maçı kazanırsak primler maçtan sonra hesabınızda olacak.” Soyunma odası ateşlendi.`);
  if(isPl())G.p.morale=clamp(G.p.morale+3*mot,0,100);}
function primBand(P){return `<div class="prim-band"><span>💰</span><div><b>Başkan primi açıkladı</b><small>Galibiyet ${money(P.win)}${P.goal?` · gol başına ${money(P.goal)}`:''} · ${esc(P.pres)}</small><em>Motivasyon ${'▲'.repeat(Math.round(P.mot*2))}</em></div></div>`;}
nextDay=(old=>function(){const r=old.apply(this,arguments);try{primRoll();}catch(e){console.warn(e);}return r;})(nextDay);
render=(old=>function(){try{primRoll();}catch(e){}return old.apply(this,arguments);})(render);
applyPlayed=(old=>function(res,role,win,draw,notes,tier,league){const r=old.apply(this,arguments);try{const P=league&&isPl()?primNow():null;if(P&&!P.paid){P.paid=1;let tot=0;
      if(win){tot+=P.win;notes.push(`Başkanın galibiyet primi: ${money(P.win)}`);}if(P.goal&&res.goals){tot+=P.goal*res.goals;notes.push(`Gol primi: ${res.goals} × ${money(P.goal)} = ${money(P.goal*res.goals)}`);}
      if(tot){G.p.money+=tot;msg('board','Prim hesabına yattı',`${P.pres}: “Sözümüzü tuttuk.” Toplam ${money(tot)} prim hesabına aktarıldı.`);}else notes.push('Açıklanan prim alınamadı.');}}catch(e){console.warn(e);}return r;})(applyPlayed);
/* oynamadığın ama kadroda olduğun galibiyetlerde takım primi */
finishLeague=(old=>function(res,f,role){const P=isPl()?primNow():null;const r=old.apply(this,arguments);try{if(P&&!P.paid&&!res.played&&role==='squad'&&res.us>res.opp){P.paid=1;const v=Math.round(P.win*0.4);G.p.money+=v;msg('board','Takım primi',`Oynamasan da kadrodaydın: galibiyet priminden ${money(v)} payına düştü.`);}}catch(e){}return r;})(finishLeague);
/* canlı maçta bilgi */
startMatch=(old=>function(cfg){const r=old.apply(this,arguments);try{if(typeof feed==='function'&&cfg){if(cfg.derby)feed(0,`🔥 ${cfg.derby.n}! ${derbyLvN(cfg.derby.lv)}. Zihinsel gücün (${Math.round(cfg.dMent||11)}/20) bu atmosferde belirleyici olacak.`,'bold');if(cfg.prim)feed(0,`💰 Başkan galibiyet için ${money(cfg.prim.win)} prim açıkladı${cfg.prim.goal?`, gol başına ${money(cfg.prim.goal)}`:''}.`,'');}}catch(e){}return r;})(startMatch);

/* ---------- rakip kadrosu: son maç dizilişi (salt okunur) ---------- */
function lxGet(id){const L=G&&G.lx&&G.lx[id];return L||null;}
fxClose=(old=>function(){try{const S=FX;if(S&&S.T){G.lx=G.lx||{};for(const T of S.T){if(!CLUBS[T.id])continue;const st=T.P.filter(p=>!p.onT&&!(p.subbed&&false)).slice(0,11);
      G.lx[T.id]={f:T.form,P:T.P.filter(p=>p.slot!=null&&!p.onT).slice(0,11).map(p=>[p.k,p.slot,p.role,p.duty]),tac:T.tacK,ti:Object.assign({},T.ti),vs:(S.T[1-T.side]||{}).id,sc:T.side===0?[S.score[0],S.score[1]]:[S.score[1],S.score[0]],d:G.s?G.s.day:0,y:G.s?G.s.year:0};}
      const ks=Object.keys(G.lx);if(ks.length>60)delete G.lx[ks[0]];}}catch(e){console.warn(e);}return old.apply(this,arguments);})(fxClose);
function lastResOf(id){if(!G||!G.s)return null;const R=G.s.results||[];for(let i=R.length-1;i>=0;i--){const x=R[i].find(m=>m[0]===id||m[1]===id);if(x)return x;}try{const c=CLUBS[id];if(c&&c.league!==G.s.league){const o=olSync(c.league);const RR=o&&o.res||[];for(let i=RR.length-1;i>=0;i--){const x=RR[i].find(m=>m[0]===id||m[1]===id);if(x)return x;}}}catch(e){}return null;}
function oppLineup(id){const sq=squadOf(id),L=lxGet(id);let f,xi,roles,tac,ti,src;
  if(L&&FMF[L.f]&&L.P.every(x=>sq.some(p=>p.k===x[0]))){f=L.f;xi=Array(11).fill(null);roles=Array(11).fill(null);for(const [k,sl,r,d] of L.P){xi[sl]=sq.find(p=>p.k===k);roles[sl]={r,d};}tac=L.tac;ti=L.ti;src='lx';}
  else{const co=coachOf(id);f=FMF[co.f]?co.f:'4-2-3-1';xi=fxPickXI(sq,f);roles=FMF[f].map(s=>({r:FMR[slotKind(s)][0][0],d:'des'}));const ai=(()=>{try{return fxAI(CLUBS[id],G.club&&CLUBS[G.club]?CLUBS[G.club]:CLUBS[id]);}catch(e){return {tac:'dengeli',ti:{}};}})();tac=ai.tac;ti=ai.ti;src='est';}
  return {f,xi,roles,tac,ti,src,bench:sq.filter(p=>!xi.includes(p)).sort((a,b)=>b.ovr-a.ovr).slice(0,9),L};}
function oppDizHTML(id){const c=CLUBS[id];if(!c)return '';const O=oppLineup(id),S=FMF[O.f],co=coachOf(id);
  const slots=S.map((s,i)=>{const p=O.xi[i];const R=(FMR[slotKind(s)]||[]).find(r=>O.roles[i]&&r[0]===O.roles[i].r);const style=`left:${s[1]*100}%;top:${s[0]==='KL'?91:(1-s[2])*84+4}%`;
    if(!p)return `<span class="fm-slot empty ro" style="${style}"><span class="fm-sh">?</span><b>${KIND_N[slotKind(s)]}</b></span>`;
    return `<button class="fm-slot ro" style="${style}" data-act="pcard" data-id="${id}" data-k="${p.k}"><span class="fm-sh" style="background:${c.c1};color:${c.c2}">${R200(scO(p,c))}</span><b>${esc(ksur(p.name))}</b><small>${R?R[2]:''}${s[0]!=='KL'&&O.roles[i]&&DUTY[O.roles[i].d]?'·'+DUTY[O.roles[i].d][0][0]:''}</small></button>`;}).join('');
  const lr=lastResOf(id);let lastTxt='';if(O.src==='lx'&&O.L){const vs=CLUBS[O.L.vs];lastTxt=`Son maç (bize karşı): ${vs?esc(vs.short):''} · ${O.L.sc[0]}-${O.L.sc[1]}`;}else if(lr){const h=CLUBS[lr[0]],a=CLUBS[lr[1]];lastTxt=`Son maç: ${h?esc(h.short):''} ${lr[2]}-${lr[3]} ${a?esc(a.short):''}`;}
  const tiRows=TI.map(t=>{const v=(O.ti&&O.ti[t.k])||t.d,o=t.o.find(x=>x[0]===v);return o&&v!==t.d?`<div class="ti-row ro"><span>${t.n}</span><b>${o[1]}</b></div>`:'';}).join('');
  return `<section class="panel opp-diz"><p class="sub-h"><span>Diziliş · ${O.f}</span><span>${O.src==='lx'?'son maç kadrosu':'son maç (tahmini)'}</span></p>
   <p class="muted" style="margin:0 0 8px">${lastTxt?lastTxt+' · ':''}Teknik direktör: ${esc(co.n)} · Yaklaşım: ${TAC[O.tac]?TAC[O.tac].n:'Dengeli'}. <b>Sadece görüntüleme</b>, bu dizilişi değiştiremezsin.</p>
   <div class="fm-pitch ro">${slots}</div>
   <p class="sub-h" style="margin:12px 0 6px"><span>Takım talimatları</span></p>${tiRows||'<p class="muted">Standart talimatlar (tümü varsayılan).</p>'}
   <p class="sub-h" style="margin:12px 0 6px"><span>Yedekler</span></p><div class="fm-bench ro">${O.bench.map(q=>`<button class="fm-b" data-act="pcard" data-id="${id}" data-k="${q.k}"><span>${dpTag(q)}</span><b>${esc(ksur(q.name))}</b><em>${scO(q,c)}</em></button>`).join('')}</div></section>`;}
sqTabs=(old=>function(id){let h=old.apply(this,arguments);try{const mine=G&&G.mode==='mgr'&&id===G.club;if(!mine&&CLUBS[id]&&!LEAGUES[CLUBS[id].league].youth)h=h.replace('</div>',`<button data-act="sqTab" data-id="${id}" data-k="diz" class="${SQT==='diz'?'on':''}">Diziliş</button></div>`);}catch(e){}return h;})(sqTabs);
squadHTML=(old=>function(id){const mine=G&&G.mode==='mgr'&&id===G.club;if(SQT!=='diz'||mine)return old.apply(this,arguments);const c=CLUBS[id];if(!c)return '';const L=LEAGUES[c.league];
  return `<div class="club-hd">${crestSVG(c,52)}<div><h3>${esc(c.name)}</h3><span>${L.name}</span></div></div>${sqTabs(id)}${oppDizHTML(id)}`;})(squadHTML);
/* kendi kadromuza geçince sekme sıfırlansın */
showSquad=(old=>function(id){if(SQT==='diz'&&G&&G.mode==='mgr'&&id===G.club)SQT='oyn';return old.apply(this,arguments);})(showSquad);
/* ---------- taktik sahası: kondisyon rozeti yerine forma çevresinde halka ---------- */
pDecorate=(old=>function(root){const r=old.apply(this,arguments);try{if(!root||!G||G.mode!=='mgr'||!G.m)return r;const sq=squadOf(G.club),xi=mgrXI();
    root.querySelectorAll('.fm-slot[data-i]').forEach(el=>{el.querySelectorAll('.pis.slot .pi-cd').forEach(x=>x.remove());const pis=el.querySelector('.pis.slot');if(pis&&!pis.children.length)pis.remove();
      const p=sq.find(q=>q.k===xi[+el.dataset.i]);if(!p)return;const c=Math.round(pCond(p)),sh=el.querySelector('.fm-sh');if(!sh)return;
      el.classList.add('cdr');sh.style.setProperty('--cd',c);sh.style.setProperty('--cdc',c>=85?'#35d49a':c>=70?'#ffd166':'#ff6b6b');sh.title=`Kondisyon %${c}`;});}catch(e){console.warn(e);}return r;})(pDecorate);

