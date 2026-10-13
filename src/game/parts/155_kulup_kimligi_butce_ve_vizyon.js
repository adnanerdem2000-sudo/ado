/* ================= KULÜP KİMLİĞİ: bütçe ve vizyon ================= */
const VISIONS={
  genc:{n:'Gençlere şans',d:'Genç oyunculara süre verir. Rolün bir basamak iyi olur, iyi oynadıkça hocanın güveni hızlı artar.'},
  sampiyon:{n:'Şampiyonluk hedefi',d:'Sonuç odaklı ve sabırsız. Maaşlar yüksek ama forma rekabeti sert, kötü maçlar hemen cezalandırılır.'},
  altyapi:{n:'Gelişim fabrikası',d:'Antrenman kalitesi yüksek. Takım idmanlarından %20 daha fazla gelişirsin.'},
  vitrin:{n:'Vitrin kulübü',d:'Oyuncularını büyük kulüplere satar. Gözlemciler maçlarını daha çok izler, üst lige geçiş kolaylaşır.'},
  hucum:{n:'Hücum futbolu',d:'Topa sahip olur, sürekli atak yapar. Forvet ve kanatlara maçta daha çok pozisyon düşer.'},
  savunma:{n:'Savunma disiplini',d:'Kompakt ve disiplinli. Defans ve orta saha oyuncuları maçta daha çok sorumluluk alır.'},
  tutumlu:{n:'Tutumlu yönetim',d:'Bütçe kısıtlı, maaşlar düşük. Buna karşılık kadro dar, süre bulmak kolay.'}};
const VIS_FIX={galatasaray:'sampiyon',fenerbahce:'sampiyon',besiktas:'hucum',trabzonspor:'vitrin',rma:'sampiyon',fcb:'hucum',mci:'hucum',bayern:'sampiyon',psg:'sampiyon',inter:'savunma',juve:'sampiyon',atalant:'vitrin',bvb:'vitrin',ajx:'altyapi',levkus:'hucum',bha:'vitrin',lei:'altyapi',ath:'altyapi',rso:'altyapi',lens:'vitrin',ol:'altyapi'};
function clubVision(c){if(!c)return 'genc';if(VIS_FIX[c.id])return VIS_FIX[c.id];const L=LEAGUES[c.league],strs=leagueClubs(c.league).map(x=>x.str),mx=Math.max(...strs),mn=Math.min(...strs),rel=(c.str-mn)/((mx-mn)||1),h=hash(c.id+'v');
  if(L.youth)return ['genc','altyapi','vitrin','altyapi','genc','hucum'][h%6];
  if(rel>0.8)return ['sampiyon','sampiyon','hucum','vitrin'][h%4];
  if(rel<0.25)return ['tutumlu','genc','savunma','tutumlu'][h%4];
  return ['genc','altyapi','vitrin','hucum','savunma','tutumlu','sampiyon'][h%7];}
const TIER_BUD=[0.06,0.3,1.2,0.8,4,15,45,160,900,9000];
function clubBudget(c){const L=LEAGUES[c.league],strs=leagueClubs(c.league).map(x=>x.str),avg=strs.reduce((a,b)=>a+b,0)/strs.length,h=(hash(c.id+'b')%40)/100,v=clubVision(c);
  const b=TIER_BUD[L.tier]*1e6*Math.pow(1.1,c.str-avg)*(0.8+h)*(v==='tutumlu'?0.6:v==='sampiyon'?1.35:1);const r=b>=1e7?1e6:b>=1e6?1e5:1e4;return Math.max(r,Math.round(b/r)*r);}
const ROLE_STEPS=['Gelişim','Rotasyon','İlk 11','Yıldız'];
function visRole(c,role,age){const v=clubVision(c),i=ROLE_STEPS.indexOf(role);if(i<0)return role;if(v==='genc'&&age<=21)return ROLE_STEPS[Math.min(3,i+1)];if(v==='sampiyon')return ROLE_STEPS[Math.max(0,i-1)];if(v==='tutumlu')return ROLE_STEPS[Math.min(3,i+(Math.random()<0.5?1:0))];return role;}
const VIS_WAGE={sampiyon:1.25,tutumlu:0.72,genc:0.9,vitrin:1,altyapi:0.95,hucum:1.05,savunma:1};
function visLine(c){const v=VISIONS[clubVision(c)];return `<div class="vis-line"><span class="pill blue">${v.n}</span><span>Bütçe ${money(clubBudget(c))}</span><p>${v.d}</p></div>`;}
function showClub(id){const c=CLUBS[id];if(!c)return;const L=LEAGUES[c.league],v=VISIONS[clubVision(c)],w=G&&G.watch[id];
  openModal(`<div class="club-hd">${crestSVG(c,56)}<div><h3>${esc(c.name)}</h3><span>${L.name}</span></div></div>
  <dl class="offer-terms"><div><dt>Yıllık bütçe</dt><dd>${money(clubBudget(c))}</dd></div><div><dt>Vizyon</dt><dd>${v.n}</dd></div><div><dt>İlgi</dt><dd>${G&&id===G.club?'Kulübün':w&&w.i>=8?WLABEL[w.lv]:'—'}</dd></div></dl>
  <p class="vis-d">${v.d}</p><button class="cta" data-act="squad" data-id="${id}">Kadroyu ve oyuncu kartlarını gör</button><button class="btn ghost" data-act="closeModal">Kapat</button>`);}

