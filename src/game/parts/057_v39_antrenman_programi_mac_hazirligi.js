/* ================= v39: antrenman programı · maç hazırlığı · basın toplantısı ================= */
const TS={tak:{n:'Taktik',d:'Taktik uyum artar',c:-3,ic:'▦'},fiz:{n:'Fiziksel',d:'Form artar, yorar',c:-7,ic:'⚡'},tek:{n:'Teknik',d:'Gençler gelişir',c:-4,ic:'◎'},dur:{n:'Duran top',d:'Duran top etkinliği',c:-2,ic:'⚑'},
  hfk:{n:'Toparlanma',d:'Kondisyon yeniler',c:6,ic:'≈'},din:{n:'Dinlenme',d:'Tam dinlenme',c:11,ic:'☾'}};
const TS_DEF=['tak','fiz','tek','tak','dur','hfk','din'],WDN=['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar'];
const IT_F={gen:'Genel gelişim',fiz:'Fizik',bit:'Bitiricilik',pas:'Pas ve oyun kurma',sav:'Savunma',kal:'Kalecilik'};
function trInit(){const m=G.m;if(!m)return null;m.trw=m.trw||TS_DEF.slice();m.tcond=m.tcond==null?92:m.tcond;m.sp=m.sp||0;m.itr=m.itr||{};m.dpl=m.dpl||{};m.fans=m.fans==null?62:m.fans;m.media=m.media==null?50:m.media;m.press=m.press||null;m.sett=m.sett||{};return m;}
/* günlük antrenman etkisi (menajer) */
function trDay(){const m=trInit();if(!m||G.phase!=='season')return;const t=dayType(G.s.day);if(t==='mac'||t==='kupa'){m.tcond=clamp(m.tcond-11,30,100);return;}
  const wd=wdOf(today()),wdi=(wd+6)%7,s=TS[m.trw[wdi]]||TS.din,f=fmInit().fm;m.tcond=clamp(m.tcond+s.c+(m.tcond<70?1:0),30,100);
  if(m.trw[wdi]==='tak')f.fam=clamp((f.fam||60)+0.8,0,100);if(m.trw[wdi]==='dur')m.sp=clamp(m.sp+0.35,0,10);else m.sp=clamp(m.sp-0.04,0,10);
  if(m.trw[wdi]==='fiz')m.form=clamp((m.form||0)+0.12,-3,4);
  if(m.trw[wdi]==='tek'){for(const p of squadOf(G.club)){if(p.age>21)continue;const gap=potOf(p)-p.ovr;if(gap>0)m.dev[p.k]=(m.dev[p.k]||0)+0.012*Math.min(1,gap/6);}}
  if(m.tcond<62&&Math.random()<(62-m.tcond)/260){const sq=squadOf(G.club).filter(p=>!m.inj[p.k]);if(sq.length){const p=pick(sq),w=rint(1,3);m.inj[p.k]=w;m.xi=null;msg('squad','Yorgunluk sakatlığı',`${p.name} yorgunluk nedeniyle sakatlandı (${w} hafta). Takım kondisyonu düşük: programa dinlenme ekle.`);}}}
/* bireysel antrenman: haftalık */
function trWeek(){const m=trInit();if(!m)return;const sq=squadOf(G.club);for(const [k,v] of Object.entries(m.itr)){const p=sq.find(x=>x.k===k);if(!p){delete m.itr[k];continue;}
    if(v.startsWith('pos:')){const pos=v.slice(4);m.dpl[k]=m.dpl[k]||{};const cur=(fmPosR0?fmPosR0(p):fmPosR(p))[pos]||1;m.dpl[k][pos]=Math.min(19-cur,(m.dpl[k][pos]||0)+(p.age<=24?0.9:p.age<=29?0.6:0.35));
      const now=fmPosR(p)[pos];if(now>=15&&!(m.dpl[k]['_'+pos])){m.dpl[k]['_'+pos]=1;msg('squad','Yeni mevki öğrenildi',`${p.name} ${FMP_PN[pos]} mevkisinde artık usta seviyede.`);}}
    else{const gap=potOf(p)-p.ovr;if(gap>0||p.age<=30)m.dev[k]=(m.dev[k]||0)+(p.age<=23?0.045:p.age<=28?0.03:0.015)*(gap>0?1:0.4);}}}
/* bireysel mevki eğitimi: öğrenilen mevkiyi puanlara yansıt */
fmPosR=(old=>function(p){const R=old(p);try{const d=G&&G.m&&G.m.dpl&&p&&G.m.dpl[p.k];if(!d)return R;const o=Object.assign({},R);for(const k in d){if(k[0]==='_')continue;o[k]=Math.min(19,(R[k]||1)+d[k]);}return o;}catch(e){return R;}})(fmPosR);
/* takım gücüne etkiler: kondisyon, duran top, kaptan */
let SPQ_C=null;
function spQual(){const m=trInit(),S=m.sett||{},xi=mgrXI(),key=xi.join(',')+JSON.stringify(S)+'|'+(G.s&&G.s.day);if(SPQ_C&&SPQ_C.key===key)return SPQ_C.v;const v=spQual0(m,S,xi);SPQ_C={key,v};return v;}
function spQual0(m,S,xi){const sq=squadOf(G.club);const gv=(k,a)=>{const p=sq.find(x=>x.k===k&&xi.includes(x.k));if(!p)return 10;const A=fmAttrs(p);for(const g of ['T','M','P'])for(const [n,v] of (A[g]||[]))if(n===a)return v;return 10;};
  const auto=a=>{let b=null,bv=-1;for(const k of xi){const v=gv(k,a);if(v>bv){bv=v;b=k;}}return b;};
  const pen=S.pen&&xi.includes(S.pen)?S.pen:auto('Penaltı Kullanma'),fk=S.fk&&xi.includes(S.fk)?S.fk:auto('Serbest Vuruş Kullanma'),ck=S.ck&&xi.includes(S.ck)?S.ck:auto('Korner');
  const q=(gv(pen,'Penaltı Kullanma')+gv(fk,'Serbest Vuruş Kullanma')+gv(ck,'Korner'))/3;return {pen,fk,ck,q};}
function captOf(){const m=trInit(),xi=mgrXI(),sq=squadOf(G.club);if(m.capk&&sq.some(p=>p.k===m.capk))return m.capk;const R=squadRoles(G.club);return Object.keys(R).find(k=>R[k]==='Kaptan')||xi[0];}
xiStr=(old=>function(){const s=old.apply(this,arguments);try{if(G.mode!=='mgr'||!G.m)return s;const m=trInit();let add=clamp((m.tcond-85)/14,-2,0.5);
    const sp=spQual();add+=clamp((sp.q-12)/14,-0.25,0.35)+m.sp*0.04;const cap=captOf();if(cap&&mgrXI().includes(cap)){const p=squadOf(G.club).find(x=>x.k===cap);if(p){const A=fmAttrs(p);const L=(A.M||[]).find(x=>x[0]==='Liderlik');add+=L?clamp((L[1]-10)/25,-0.2,0.4):0;}}else add-=0.2;
    return Math.round((s+add)*10)/10;}catch(e){return s;}})(xiStr);
/* antrenman ekranı */
function viewTrain(){const m=trInit(),sq=squadOf(G.club).sort((a,b)=>DP_ORDER.indexOf(dpMain(a))-DP_ORDER.indexOf(dpMain(b))),f=fmInit().fm,wd=(wdOf(today())+6)%7;
  const bar=(l,v,max,c,sfx)=>`<div class="tr-m"><span>${l}</span><div class="bar"><i style="width:${clamp(v/max*100,0,100)}%;background:${c}"></i></div><b>${Math.round(v)}${sfx||''}</b></div>`;
  const plan=`<div class="tr-week">${WDN.map((d,i)=>`<div class="tr-day${i===wd?' today':''}"><small>${d}</small><select data-chg="trDay" data-i="${i}">${Object.entries(TS).map(([k,v])=>`<option value="${k}" ${m.trw[i]===k?'selected':''}>${v.ic} ${v.n}</option>`).join('')}</select><em>${TS[m.trw[i]].d}</em></div>`).join('')}</div>
    <p class="muted" style="margin:8px 0 0">Maç günlerinde program uygulanmaz; maç kondisyonu düşürür. Toparlanma ve dinlenme kondisyonu yeniler, taktik uyumu ve duran top çalışması maç gücüne yansır.</p>`;
  const opts=p=>{const o=[['','—'],['gen',IT_F.gen],['fiz',IT_F.fiz],[p.pos==='KL'?'kal':'bit',p.pos==='KL'?IT_F.kal:IT_F.bit],['pas',IT_F.pas],['sav',IT_F.sav]];const R=fmPosR(p);const pos=p.pos==='KL'?[]:DP_ORDER.filter(k=>k!=='GK'&&R[k]<15).map(k=>['pos:'+k,'Mevki: '+FMP_PN[k]+' ('+dpLvl(R[k]).toLowerCase()+')']);return o.concat(pos);};
  const ind=`<div class="tbl-wrap"><table class="lgt tr-t"><thead><tr><th class="l">Oyuncu</th><th>Mevki</th><th>Yaş</th><th>Güç</th><th class="l">Bireysel çalışma</th><th class="l">İlerleme</th></tr></thead><tbody>${sq.map(p=>{const v=m.itr[p.k]||'';let prog='';
      if(v.startsWith('pos:')){const pos=v.slice(4),r=fmPosR(p)[pos];prog=`<div class="bar sm"><i style="width:${r/20*100}%"></i></div><small>${DPT[pos]} ${dpLvl(r)} (${Math.round(r)}/20)</small>`;}else if(v){prog=`<small>Gelişim +${dec((m.dev[p.k]||0),2)}</small>`;}
      return `<tr><td class="l"><span class="plink" data-act="pcard" data-id="${G.club}" data-k="${p.k}">${esc(p.name)}</span>${m.inj[p.k]?' <em class="res-l">sakat</em>':''}</td><td>${dpTag(p)}</td><td>${p.age}</td><td>${R200(p.ovr)}</td><td class="l"><select data-chg="trInd" data-k="${p.k}">${opts(p).map(([k,l])=>`<option value="${k}" ${v===k?'selected':''}>${esc(l)}</option>`).join('')}</select></td><td class="l">${prog}</td></tr>`;}).join('')}</tbody></table></div>`;
  return `<h2 class="h">Antrenman</h2><div class="tr-grid"><section class="panel"><p class="sub-h"><span>Takım durumu</span><span>Form ${m.form>=0?'+':''}${dec(m.form||0)}</span></p>
    ${bar('Kondisyon',m.tcond,100,m.tcond>=80?'#35d49a':m.tcond>=65?'#ffd166':'#ff6b6b','%')}${bar('Taktik uyum',f.fam||60,100,'#3fa7ff','%')}${bar('Duran top',m.sp*10,100,'#b9a4ff','%')}
    <p class="muted" style="margin:6px 0 0">Kondisyon %65’in altına düşerse yorgunluk sakatlıkları başlar.</p></section>
    ${tpPanel()}</div>
    <section class="panel"><p class="sub-h"><span>Haftalık program</span><span>${WDN[wd]}: ${TS[m.trw[wd]].n}</span></p>${plan}</section>
    <section class="panel"><p class="sub-h"><span>Bireysel antrenman</span><span>${Object.keys(m.itr).length} oyuncu</span></p><p class="muted" style="margin:0 0 8px">Oyuncuya yeni bir mevki öğret (haftalar içinde usta seviyeye çıkar) ya da bir alana odaklanarak gelişimini hızlandır.</p>${ind}</section>`;}
document.addEventListener('change',e=>{const el=e.target.closest('[data-chg]');if(!el)return;const a=el.dataset.chg;try{
  if(a==='trDay'){const m=trInit();m.trw[+el.dataset.i]=el.value;save();render();}
  else if(a==='trInd'){const m=trInit();if(el.value)m.itr[el.dataset.k]=el.value;else delete m.itr[el.dataset.k];save();render();}
  else if(a==='spSet'){const m=trInit();m.sett[el.dataset.k]=el.value;save();render();}
  else if(a==='captSet'){const m=trInit();m.capk=el.value;save();render();toast('Kaptan belirlendi');}}catch(err){console.warn(err);}});
/* maç hazırlığı */
function nextOppInfo(){try{const cu=cupDayFor(G.s.day);const nd=G.s.cal.find(d=>d>=G.s.day);let f=null;const w=G.s.cal.indexOf(nd);if(w>=0){const fx=G.s.fixtures[w].find(x=>x.includes(G.club));if(fx)f={opp:CLUBS[fx[0]===G.club?fx[1]:fx[0]],home:fx[0]===G.club,day:nd,comp:curLeague().short};}
  return f;}catch(e){return null;}}
function viewPrep(){const m=trInit(),sq=squadOf(G.club),xi=mgrXI(),sp=spQual(),cap=captOf(),nm=k=>{const p=sq.find(x=>x.k===k);return p?p.name:'—';};
  const sel=(k,cur,list)=>`<select data-chg="spSet" data-k="${k}"><option value="">Otomatik (${esc(nm(cur))})</option>${list.map(p=>`<option value="${p.k}" ${m.sett[k]===p.k?'selected':''}>${esc(p.name)} · ${dpTag(p)}</option>`).join('')}</select>`;
  const xs=xi.map(k=>sq.find(p=>p.k===k)).filter(Boolean),n=nextOppInfo();
  const capSel=`<select data-chg="captSet"><option value="">Kulübün kaptanı (${esc(nm(cap))})</option>${xs.concat(sq.filter(p=>!xi.includes(p.k))).map(p=>`<option value="${p.k}" ${m.capk===p.k?'selected':''}>${esc(p.name)}</option>`).join('')}</select>`;
  const opp=n?`<section class="panel"><p class="sub-h"><span>Sıradaki maç</span><span>${fmtDate(dateOf(n.day))} · ${n.home?'İç saha':'Deplasman'}</span></p><div class="prep-opp">${crestSVG(myClub(),40)}<b>${esc(myClub().name)}</b><i>vs</i><b>${esc(n.opp.name)}</b>${crestSVG(n.opp,40)}</div></section>${typeof oppAnalysis==='function'?oppAnalysis():''}`:'';
  return `<h2 class="h">Maç hazırlığı</h2><div class="tr-grid"><div>${opp}</div><div><section class="panel"><p class="sub-h"><span>Kaptan</span></p>${capSel}<p class="muted" style="margin:6px 0 0">Liderliği yüksek bir kaptan sahadaki takım gücünü artırır.</p></section>
    <section class="panel"><p class="sub-h"><span>Duran top görevlileri</span><span>Kalite ${dec(sp.q,1)}/20</span></p>
    <div class="sp-row"><span>Penaltı</span>${sel('pen',sp.pen,xs)}</div><div class="sp-row"><span>Serbest vuruş</span>${sel('fk',sp.fk,xs)}</div><div class="sp-row"><span>Korner</span>${sel('ck',sp.ck,xs)}</div>
    <p class="muted" style="margin:6px 0 0">Otomatik seçimde ilk 11’deki en iyi uygulayıcı seçilir. Antrenmandaki duran top çalışması etkiyi artırır.</p></section></div></div>`;}
/* basın toplantısı */
const PRS_Q={pre:[{q:o=>`${o} maçı öncesi takımın durumu nasıl?`,a:[['Çok hazırız, kazanacağız',{fans:3,promise:1}],['Rakibe saygı duyuyoruz, zor bir maç',{morale:1}],['Sadece kendimize odaklanıyoruz',{}]]},
   {q:()=>`Kadroda değişiklik olacak mı?`,a:[['Hazır olan oynayacak, herkes şansını bekliyor',{morale:1}],['En iyi 11’imizle çıkacağız',{fans:1}],['Bunu sahada göreceksiniz',{media:-2}]]},
   {q:()=>`Taraftarlara bir mesajınız var mı?`,a:[['Bizi sonuna kadar desteklesinler',{fans:2}],['Sabırlı olmalarını istiyorum',{fans:-1,board:1}],['Mesajımızı sahada vereceğiz',{fans:1}]]}],
  win:[{q:()=>`Galibiyetin sırrı neydi?`,a:[['Oyuncularım muhteşemdi',{morale:2}],['Taktik planımız tuttu',{media:2}],['Daha iyisini yapabiliriz',{board:1}]]}],
  draw:[{q:()=>`Beraberlik için ne söylersiniz?`,a:[['Bir puan da değerlidir',{}],['Kazanmamız gereken bir maçtı',{fans:1,morale:-1}],['Hakem kararları bizi etkiledi',{fans:2,board:-2,media:-2}]]}],
  loss:[{q:()=>`Mağlubiyetin sorumlusu kim?`,a:[['Sorumluluk tamamen bende',{board:2,morale:1}],['Oyuncularım beklentinin altındaydı',{morale:-3,board:1}],['Hakem maçı belirledi',{fans:2,board:-3,media:-3}]]}]};
function pressNew(kind,ctx){const m=trInit();if(!m)return;const pool=PRS_Q[kind];const qs=kind==='pre'?pool.slice().sort(()=>Math.random()-0.5).slice(0,2):pool.slice(0,1);
  m.press={kind,ctx,day:G.s.day,qs:qs.map(q=>({q:q.q(ctx.opp||''),a:q.a})),i:0,done:false};
  msg('press',kind==='pre'?`Basın toplantısı: ${ctx.opp} maçı öncesi`:`Maç sonu basın toplantısı`,`Gazeteciler seni bekliyor. Cevapların taraftarı, oyuncuların moralini ve yönetimi etkiler.`,{pr:1});}
function pressApply(eff){const m=trInit();if(eff.fans)m.fans=clamp(m.fans+eff.fans,0,100);if(eff.media)m.media=clamp(m.media+eff.media,0,100);if(eff.board)m.conf=clamp((m.conf||50)+eff.board,0,100);
  if(eff.morale){for(const p of squadOf(G.club))relAdd(p,eff.morale);}if(eff.promise)m.promise={day:G.s.day};}
function pressModal(){const m=trInit(),P=m.press;if(!P||P.done){toast('Bekleyen basın toplantısı yok');return;}const Q=P.qs[P.i];
  openModal(`<div class="press"><p class="pg-crumb">Basın toplantısı · soru ${P.i+1}/${P.qs.length}</p><h3>🎙 “${esc(Q.q)}”</h3><div class="press-a">${Q.a.map(([t],i)=>`<button class="btn" data-act="pressAns" data-i="${i}">${esc(t)}</button>`).join('')}</div><button class="btn ghost" data-act="pressSkip" style="margin-top:8px">Toplantıya katılma</button></div>`);}
ACTX.pressOpen=()=>pressModal();
ACTX.pressAns=el=>{const m=trInit(),P=m.press;if(!P)return;const A=P.qs[P.i].a[+el.dataset.i];pressApply(A[1]);(m.pressLog=m.pressLog||[]).unshift({d:G.s.day,q:P.qs[P.i].q,a:A[0]});if(m.pressLog.length>20)m.pressLog.length=20;
  P.i++;if(P.i>=P.qs.length){P.done=true;closeModal();toast('Basın toplantısı tamamlandı');save();render();}else{save();pressModal();}};
ACTX.pressSkip=()=>{const m=trInit();if(m.press){m.press.done=true;m.media=clamp(m.media-2,0,100);}closeModal();save();render();toast('Basın toplantısına katılmadın (medya ilişkisi −2)');};
msgHTML=(old=>function(m){let h=old(m);try{if(m.pr&&G.m&&G.m.press&&!G.m.press.done&&h.includes('msg-body'))h=h.replace('</p>','</p><button class="cta sm" data-act="pressOpen" style="margin-top:8px">Basın toplantısına katıl</button>');}catch(e){}return h;})(msgHTML);
try{TAGS.press='BAS';}catch(e){}
try{INF_GROUPS.me.push('press');}catch(e){}

