/* ================= v183: gol anları — zorla golün doğallaşması (fırsat, kaleci, ışınlanmasız top kazanma) ================= */
/* Futbolcu/gözlemci/hakem modlarında MR'nin golleri motorda "zorla gol" ile canlandırılır (113 abForceTick, V177 defteri).
   Eskiden: golcü 30–34 m'den (oyuncumuz 100 sn sonra 70 m'den) hemen vuruyordu, şut kalecinin bulunduğu köşeye de gidebiliyordu ve kaleci
   topun yoluna kayıp top içinden geçiyordu; 25 sn sonra motor şutu kale 48 m'den zorluyordu; 70 sn'de top rakipteyse golcünün ayağına
   ışınlanıyordu (setOwner). Şimdi:
   - Şut mesafesi zamanla açılır (18 → 22 → 24 → 26 → 28 m; yan açı |y−orta| ≤ 0,75–1,2 × uzaklık) ve şut ancak gerçek fırsatta: kalecinin uzak köşesi açık, yolda savunmacı yok,
     açı çok dar değil (motor: fgOpen, S.forceGap/forceAng). Gol gecikirse koşullar gevşer; 90 sn'den sonra kaleci aralığı aranmaz, açı sınırı kalır.
   - Şut kalecinin uzak köşesine; kaleci yerinde kalır, plonjona çıkar ama yetişemez (motor 000: fgAim, saveY).
   - Top rakipteyken ışınlanma yok: 25 sn'den sonra topu tutan rakip savunmacı kötü bir pas verir (top gerçekten yuvarlanır, araya
     girilir); pas aralığı en az 7 sn.
   - Oyuncumuzun golünde uzaktan (70 m'ye kadar) zorlama yok; 60 sn'den sonra golcü top ayağında ve şut mesafesindeyse motor vurdurur.
   Skor/golcü/asist akışı değişmez: kuyruk (ABM.fq), V177 yeniden planlama ve tamamlama kuralları aynı. */
/* F: [geçen motor sn, şut mesafesi m, kaleci-yol aralığı m, yan açı sınırı (|y−orta| / uzaklık)] · BP: rakip hatası [başlangıç sn, aralık sn] · TK: dış şut zorlaması (sn)
   Görüntüsüz ölçüm (scratchpad/fizik/lab.js, 6 maç × 8 gol): şut mesafesi medyan 39,6 → 19,3 m (25 m+ şut 45 → 8, kale ortasından yan uzaklık medyan 3,1 m), topun kalecinin 1 m yakınından
   (içinden) geçtiği gol 32 → 0, ışınlanma 444 → 0, gole kadar süre medyan 37 → 62 motor sn (~2,4 → ~4 oyun dk). */
const V183={F:[[0,18,2.0,.75],[20,22,1.7,.85],[40,24,1.3,.95],[60,26,.8,1.05],[90,28,0,1.2]],BP:[25,7],TK:60};
function v183Win(el){let r=V183.F[0];for(const f of V183.F)if(el>=f[0])r=f;return r;}
function v183GoalX(sim,tm){return sim.teams[tm].dir>0?105:0;}
function v183ForceTick(S,sim){if(!ABM.fq.length){if(sim.forceGoal!=null&&!ABM.fcur){sim.forceGoal=null;sim.forceGap=0;sim.forceAng=0;}return;}
  const q=ABM.fq[0];if(!ABM.fcur||ABM.fcur!==q){ABM.fcur=q;q.g0=sim.teams[abS2E(q.side)].score;q.t0=sim.t;sim.forceGoal=abS2E(q.side);const me=q.k?abFxPk(q.k):null;sim.forceBy=me&&me.ei!=null?me.ei:null;}
  if(sim.teams[abS2E(q.side)].score>q.g0){ABM.fq.shift();ABM.fcur=null;sim.forceGoal=null;sim.forceBy=null;sim.forceGap=0;sim.forceAng=0;return;}
  const el=sim.t-q.t0,w=v183Win(el);sim.forceDist=w[1];sim.forceGap=w[2];sim.forceAng=w[3];
  /* v177: planlanan golcü sahadan çıktıysa yeni golcü; 45 sn'de bitiremezse kaleye en yakın arkadaş (oyuncumuzun golü hariç) */
  if(sim.forceBy!=null){const fp=sim.players[sim.forceBy],fo=abFxP(sim.forceBy);if(!fp||fp.off||fp.team!==sim.forceGoal||!fo||(q.k&&fo.k!==q.k)){let np=null;try{if(q.k!=='ME'&&typeof v177Replan==='function')np=v177Replan(q);}catch(e){}sim.forceBy=np&&np.ei!=null?np.ei:null;}}
  if(q.k!=='ME'&&sim.t-(q.tr||q.t0)>45){q.tr=sim.t;let np=null;try{if(typeof v177Replan==='function')np=v177Replan(q,true);}catch(e){}if(np&&np.ei!=null)sim.forceBy=np.ei;}
  const gx=v183GoalX(sim,sim.forceGoal);
  /* oyuncumuzun golü: 150 sn'de kaleye en yakın arkadaşı tamamlar (kayıt yine oyuncumuza; eskiden 100 sn'de 70 m'den de vuruyordu) */
  if(q.k==='ME'&&sim.forceBy!=null&&sim.mode==='live'&&!sim.shot){
    if(el>150){const at=sim.players.filter(p=>p.team===sim.forceGoal&&!p.off&&p.role!=='GK'&&p.id!==sim.forceBy).sort((a,b)=>Math.abs(gx-a.x)-Math.abs(gx-b.x))[0];if(at){sim.forceBy=at.id;q.meRel=1;}}}
  /* top rakipte: ışınlanma yerine rakip savunmacının kötü pası (golcüye ya da kaleye en yakın arkadaşa) */
  if(el>V183.BP[0]&&sim.mode==='live'&&!sim.shot&&!sim.pass){const o0=sim.ball.owner;
    if(o0&&o0.team!==sim.forceGoal&&o0.role!=='GK'&&sim.t-(q.lp||-99)>V183.BP[1]){const fp=sim.forceBy!=null?sim.players[sim.forceBy]:null;
      const c=sim.players.filter(p=>p.team===sim.forceGoal&&!p.off&&p.role!=='GK');const near=c.slice().sort((a,b)=>Math.hypot(a.x-o0.x,a.y-o0.y)-Math.hypot(b.x-o0.x,b.y-o0.y))[0];
      const to=fp&&!fp.off&&fp.team===sim.forceGoal&&Math.hypot(fp.x-o0.x,fp.y-o0.y)<30?fp:near;
      if(to&&Math.hypot(to.x-o0.x,to.y-o0.y)<38){q.lp=sim.t;try{sim._lab.doPass(o0,to,Math.hypot(to.x-o0.x,to.y-o0.y)>22,null);}catch(e){}}}}
  /* uzun bekleme (60 sn+): golcü top ayağındayken şut mesafesindeyse motorun karar sırasını beklemeden vurur */
  if(el>V183.TK&&sim.mode==='live'&&!sim.shot){const o=sim.ball.owner;if(o&&o.team===sim.forceGoal&&o.role!=='GK'&&(sim.forceBy==null||o.id===sim.forceBy)&&Math.abs(gx-o.x)<w[1]&&Math.abs(o.y-34)<w[3]*Math.max(1,Math.abs(gx-o.x))&&Math.abs(o.y-34)<22){try{sim._lab.doShot(o,sim.xgAt(o.x,o.y,sim.teams[o.team].dir,3),3,null);}catch(e){}}}}
abForceTick=function(S,sim){if(ABM.hz)return;return v183ForceTick(S,sim);};
