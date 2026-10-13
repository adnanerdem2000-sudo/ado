/* ================= PAZARLIK ================= */
function negoSheet(id){const o=findOffer(id);if(!o||o.status!=='open'){closeModal();return;}const c=CLUBS[o.club];o.pat=o.pat??clamp(2+Math.round(Math.max(0,o.interest)/4)+(G.p.up.menajer?1:0),2,5);o.done=o.done||{};
  const nr=ROLE_STEPS[ROLE_STEPS.indexOf(o.role)+1],youth=LEAGUES[o.league].youth,B=(k,l,s,dis)=>`<button class="req" data-act="ask" data-id="${o.id}" data-k="${k}" ${dis||o.done[k]||o.pat<=0?'disabled':''}><b>${l}</b><small>${o.done[k]?'Kabul edildi ✓':s}</small></button>`;
  openModal(`<h3>Pazarlık · ${esc(c.name)}</h3>${visLine(c)}
  <dl class="offer-terms" style="margin:10px 0"><div><dt>Rol</dt><dd>${o.role}</dd></div><div><dt>Haftalık</dt><dd>${money(o.wage)}</dd></div><div><dt>Süre</dt><dd>${o.loan?'Sezon sonu':o.years+' yıl'}</dd></div><div><dt>İmza parası</dt><dd>${o.bonus?money(o.bonus):'—'}</dd></div></dl>
  <p class="muted">Kulübün sabrı: <b style="color:var(--led)">${'●'.repeat(Math.max(0,o.pat))}${'○'.repeat(Math.max(0,5-o.pat))}</b> · Reddedilen her talep sabrı azaltır, fazla zorlarsan teklif geri çekilebilir.</p>
  <div class="reqs">${B('wage','Maaşı artır',`+%20 · ${money(Math.round(o.wage*1.2/50)*50)}`,o.loan)}${B('bonus','İmza parası iste',`${money(Math.max(o.bonus*1.6,Math.round(o.wage*6/100)*100))}`,o.loan)}${nr?B('role',`${nr} olmak istiyorum`,'Rol garantisi: forma şansı artar',false):''}${!o.loan&&!youth?B('years','Sözleşme süresi',`${o.years} → ${o.years>=4?2:o.years+1} yıl`,false):''}</div>
  <div class="offer-btns" style="margin-top:12px"><button class="cta sm" data-act="accept" data-id="${o.id}">İmzala</button><button class="btn ghost" data-act="closeModal">Kapat</button></div>`);}
function askTerm(id,k){const o=findOffer(id);if(!o||o.status!=='open')return;if(o.pat<=0)return toast('Kulüp daha fazla pazarlık istemiyor');o.asks=(o.asks||0)+1;
  const c=CLUBS[o.club],v=clubVision(c),bs=leagueClubs(c.league).map(clubBudget),avgB=bs.reduce((a,b)=>a+b,0)/bs.length;
  const p=clamp({wage:0.42,bonus:0.48,role:0.3,years:0.55}[k]+o.interest*0.03+(G.p.up.menajer?0.15:0)+Math.log(clubBudget(c)/avgB)*0.12-(o.asks-1)*0.07+(k==='wage'&&v==='tutumlu'?-0.15:k==='wage'&&v==='sampiyon'?0.08:0)+(k==='role'&&v==='genc'?0.12:k==='role'&&v==='sampiyon'?-0.12:0),0.06,0.9);
  if(Math.random()<p){if(k==='wage')o.wage=Math.round(o.wage*1.2/50)*50;else if(k==='bonus')o.bonus=Math.max(Math.round(o.bonus*1.6/100)*100,Math.round(o.wage*6/100)*100);else if(k==='role')o.role=ROLE_STEPS[ROLE_STEPS.indexOf(o.role)+1]||o.role;else if(k==='years')o.years=o.years>=4?2:o.years+1;
    o.done[k]=true;toast('Kulüp talebini kabul etti!');}
  else{o.pat--;if(Math.random()<0.08*o.asks+(o.pat<=0?0.3:0)){o.status='withdrawn';closeModal();msg('offer',`${c.name} teklifini geri çekti`,`Pazarlıkta fazla zorlayınca ${c.name} yönetimi masadan kalktı.`);save();render();toast('Teklif geri çekildi!');return;}toast('Kulüp bu talebi reddetti');}
  save();render();negoSheet(id);}

