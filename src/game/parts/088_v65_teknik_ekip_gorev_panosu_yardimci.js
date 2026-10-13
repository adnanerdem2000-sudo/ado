/* ================= v65: teknik ekip görev panosu (yardımcı antrenör, gözlemci, doktor) ================= */
function stTasks(){const j=jobInit(),S=G.s,wk=S?S.week:1,T=[];const md=nextMatchDay(S.day),left=md!=null?md-S.day:null,due=left==null?'':left<=0?'bugün':`${left} gün`;
  if(G.staff==='yrd'){const w=(j.wk&&j.wk[wk])||{};const f=ourFixture&&ourFixture(),opp=f?CLUBS[f[0]===G.club?f[1]:f[0]]:null;
    T.push({ic:'📋',t:'İdman planı',d:'Takım raporuna göre haftanın idman odağını seç.',ok:!!w.tr,due,go:{act:'stJump'}});
    T.push({ic:'🔎',t:`Rakip analizi${opp?' · '+opp.short:''}`,d:'Rakibin gol yollarını incele, kapatılacak alanı belirle.',ok:!!w.an,due,go:{act:'stJump'}});
    T.push({ic:'🧢',t:'Maçı kenardan izle',d:'2B maçta hocaya taktik ve değişiklik önerileri yap.',ok:(j.wlog||[]).some(x=>x.w===wk&&x.y===seasonLabel(S.year)),due:left===0?'bugün':'maç günü',go:left===0?{act:'yrWatch'}:null});
    T.push({ic:'📈',t:'Gelişim programı',d:'Oyuncuların haftalık bireysel programını düzenle.',ok:!!(j.yrPrg&&Object.keys(j.yrPrg).length),due:'hafta içi',go:{act:'navGo',tab:'yrp'}});}
  else if(G.staff==='scout'){const t=j.task;
    if(t)T.push({ic:'🎯',t:`Kulüp talebi: ${POS_TR[t.pos]||t.pos} · ≤${t.age} yaş`,d:`Bütçe ${eur(t.bud)}. Uygun oyuncuyu bul ve rapor yaz.`,ok:!!t.done,due:t.due!=null&&S?(t.due-S.day>0?`${t.due-S.day} gün`:'süre doldu'):'',go:{act:'navGo',tab:'club'}});
    const wr=(j.reps||[]).filter(r=>r.y===seasonLabel(S.year)).length;T.push({ic:'📝',t:'Sezon raporları',d:`Bu sezon ${wr} rapor yazdın; kabul edilen öneriler itibarını artırır.`,ok:wr>=6,due:'sezon',go:{act:'navGo',tab:'club'}});
    T.push({ic:'🏟',t:'Canlı maç izle',d:'Bölgendeki bir maça git, oyuncuları sahada gözlemle.',ok:!!j.lvW&&j.lvW===wk,due:'hafta içi',go:{act:'navGo',tab:'scl'}});
    T.push({ic:'💎',t:'Gizli yetenek keşfi',d:'Geleceğin yıldızlarını erkenden listeye al.',ok:(j.disc||[]).length>=3,due:'sezon',go:{act:'navGo',tab:'disc'}});}
  else if(G.staff==='dr'){const pend=(j.cases||[]).filter(c=>!c.step).length,inj=Object.keys(j.inj||{}).length,hi=Object.values(j.load||{}).filter(v=>v>=80).length;
    T.push({ic:'🩺',t:'Teşhis bekleyen vakalar',d:pend?`${pend} oyuncu muayene bekliyor.`:'Bekleyen vaka yok.',ok:!pend,due:pend?'bugün':'',go:{act:'navGo',tab:'club'}});
    T.push({ic:'🩹',t:'Tedavi ve rehabilitasyon',d:inj?`${inj} sakat oyuncunun tedavisi sürüyor.`:'Sakat oyuncu yok.',ok:!inj,due:'',go:{act:'navGo',tab:'club'}});
    T.push({ic:'⚠',t:'Yük takibi',d:hi?`${hi} oyuncu kırmızı bölgede; dinlendirme öner.`:'Tüm oyuncular güvenli yükte.',ok:!hi,due:hi?'maçtan önce':'',go:{act:'navGo',tab:'med'}});
    T.push({ic:'👥',t:'Sağlık ekibi',d:'Fizyoterapist, diyetisyen ve psikolog yatırımlarını yönet.',ok:!!(j.mt&&Object.values(j.mt).some(v=>v>0)),due:'sezon',go:{act:'navGo',tab:'drt'}});}
  return T;}
function stGoals(){const j=jobInit();const L=[];const bd=Math.round(j.bd||50);
  if(G.staff==='yrd'){const n=j.sugN||0,a=j.sugA||0;L.push(['Hoca güveni',Math.round(j.tr||0),75],['Öneri kabul oranı',n?Math.round(a/n*100):0,60],['Yönetim memnuniyeti',bd,65]);}
  else if(G.staff==='scout'){L.push(['İtibar',Math.round(j.rep||0),50],['Gerçekleşen transfer',j.hits||0,3],['Yönetim memnuniyeti',bd,65]);}
  else if(G.staff==='dr'){L.push(['Doğru teşhis',j.correct||0,10],['İtibar',Math.round(j.rep||0),50],['Yönetim memnuniyeti',bd,65]);}
  return L;}
function stBoardHTML(){if(!isStaff()||!G.job||G.phase!=='season'||!['yrd','scout','dr'].includes(G.staff))return '';let T=[],Gl=[];try{T=stTasks();Gl=stGoals();}catch(e){console.warn(e);return '';}
  const done=T.filter(t=>t.ok).length,pct=T.length?Math.round(done/T.length*100):0;
  const btn=t=>{const g=t.go;if(!g)return '';if(g.act==='navGo')return `<button class="btn sm" data-act="navGo" data-tab="${g.tab}">Git</button>`;return `<button class="btn sm" data-act="${g.act}">${g.act==='yrWatch'?'İzle':'Yap'}</button>`;};
  return `<section class="panel st-board"><p class="sub-h"><span>Görev panosu · ${G.s.week}. hafta</span><span>${done}/${T.length} tamamlandı</span></p><div class="st-prog"><i style="width:${pct}%"></i></div>
   <div class="st-tasks">${T.map(t=>`<div class="st-t ${t.ok?'ok':''}"><span class="st-ic">${t.ic}</span><div><b>${esc(t.t)}</b><small>${esc(t.d)}</small></div><em class="st-st">${t.ok?'✓ Tamam':t.due?'⏳ '+esc(t.due):'Bekliyor'}</em>${t.ok?'':btn(t)}</div>`).join('')}</div>
   <p class="sub-h" style="margin:12px 0 6px"><span>Sezon hedefleri</span></p><div class="st-goals">${Gl.map(([n,v,tg])=>{const p=Math.min(100,Math.round(v/tg*100));return `<div class="st-g"><span>${esc(n)}</span><i><em style="width:${p}%" class="${p>=100?'ok':''}"></em></i><b>${v}${typeof tg==='number'&&tg<=100&&n.includes('oran')?'%':''} / ${tg}${n.includes('oran')?'%':''}</b></div>`;}).join('')}</div></section>`;}
viewStaffHub=(old=>function(){const h=old.apply(this,arguments);try{const b=stBoardHTML();if(b){const i=h.indexOf('<div class="stabs">');return i>0?h.slice(0,i)+b+h.slice(i):h+b;}}catch(e){console.warn(e);}return h;})(viewStaffHub);
ACTX.stJump=()=>{const el=document.querySelector('#view .stab-body')||document.querySelector('#view .stabs');if(el)el.scrollIntoView({behavior:'smooth',block:'start'});};
/* haftalık takip işaretleri */
if(typeof ACTX.scLvGo==='function')ACTX.scLvGo=(old=>function(el){const r=old.apply(this,arguments);try{const j=jobInit();j.lvW=G.s.week;}catch(e){}return r;})(ACTX.scLvGo);
/* sade menü: personelin görev sayfaları "Görevim" altında */
if(typeof UIG_ORDER!=='undefined'){UIG_ORDER.splice(1,0,'Görevim');UIG_IC['Görevim']=NI('<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/>');}
uiGroups=(old=>function(){const L=old.apply(this,arguments);try{if(!isStaff())return L;const JOB=new Set(['club','an','yrp','map','scl','disc','w50','med','drt','refs']);const out=[],job=[];
    for(const [g,items] of L){const keep=[];for(const it of items){if(JOB.has(it[0]))job.push(it);else keep.push(it);}if(keep.length)out.push([g,keep]);}
    if(job.length)out.splice(1,0,['Görevim',job]);return out;}catch(e){return L;}})(uiGroups);

