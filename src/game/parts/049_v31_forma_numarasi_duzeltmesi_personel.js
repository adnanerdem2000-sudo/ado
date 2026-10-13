/* ================= v31: forma numarası düzeltmesi, personel kadro sekmesi, PC kadro tablosu, gözlemci: Transferlerim, liste temizliği, rapor reddi ================= */
/* ---------- çakışan forma numaraları ---------- */
const NUM_PREF={KL:[1,12,13,23,25,30,31,40,99],DF:[2,3,4,5,6,13,14,15,22,24,26,28,32,33,34,44],OS:[6,8,10,14,16,18,20,21,23,25,27,35],KN:[7,11,17,19,27,29,37,77],FW:[9,19,29,39,99,21,90,18]};
squadOf=(old=>function(id){const sq=old(id);if(!sq.length)return sq;const used=new Set(),fix=[],home=[],other=[];
  for(const p of sq)(p.home===id&&!p.ng?home:other).push(p);other.sort((a,b)=>a.k<b.k?-1:a.k>b.k?1:0);
  for(const p of home){if(!p.num||used.has(p.num))fix.push(p);else used.add(p.num);}for(const p of other){if(!p.num||used.has(p.num))fix.push(p);else used.add(p.num);}
  for(const p of fix){let n=(NUM_PREF[p.pos]||[]).find(x=>!used.has(x));if(n==null){n=2;while(used.has(n)&&n<99)n++;}p.num=n;used.add(n);}return sq;})(squadOf);
/* ---------- personel: kadro & diziliş sekmesi ---------- */
function staffXI(id){const co=coachOf(id),f=FMF[co.f]?co.f:'4-2-3-1',S=FMF[f],sq=squadOf(id).slice(),used=new Set(),xi=[];
  for(const s of S){const want=s[0];let c=sq.filter(p=>!used.has(p.k)&&p.pos===want).sort((a,b)=>b.ovr-a.ovr)[0];if(!c)c=sq.filter(p=>!used.has(p.k)&&p.pos!=='KL').sort((a,b)=>b.ovr-a.ovr)[0];if(c){used.add(c.k);xi.push([s,c]);}else xi.push([s,null]);}
  return {f,S,xi,bench:sq.filter(p=>!used.has(p.k)).sort((a,b)=>b.ovr-a.ovr)};}
function pitchHTML(id,X){const c=CLUBS[id];return `<div class="fm-pitch st-pitch">${X.xi.map(([s,p])=>p?`<button class="fm-slot" style="left:${s[1]*100}%;top:${s[0]==='KL'?91:(1-s[2])*84+4}%" data-act="pcard" data-id="${id}" data-k="${p.k}"><span class="fm-sh" style="background:${c.c1};color:${c.c2}">${R200(p.ovr)}</span><b>${esc(ksur(p.name))}</b><small>${p.num} · ${dpTag(p)}</small></button>`:'').join('')}</div>`;}
let SQS={k:'pos',d:1};
function sqTable(id,opt){opt=opt||{};const c=CLUBS[id],sq=squadOf(id),R=squadRoles(id),xi=opt.xi||[],POSO={KL:0,DF:1,OS:2,KN:3,FW:4};
  const rows=sq.map(p=>{const s=(()=>{try{return seasonStats(p,id)||{};}catch(e){return {};}})(),pp=pPot(p);return {p,s,pot:Math.round((pp[0]+pp[1])/2),v:pValue(p),ct:(()=>{try{return ctEnd(p);}catch(e){return '';}})()};});
  const key={pos:r=>POSO[r.p.pos]*100-r.p.ovr,num:r=>r.p.num,name:r=>r.p.name,age:r=>r.p.age,ovr:r=>-r.p.ovr,pot:r=>-r.pot,val:r=>-r.v,ct:r=>r.ct,ap:r=>-(r.s.ap||0),g:r=>-(r.s.g||0),a:r=>-(r.s.a||0),rt:r=>-((r.s.rt||0)/Math.max(1,r.s.ap||0))}[SQS.k]||(r=>0);
  rows.sort((a,b)=>{const x=key(a),y=key(b);return (x<y?-1:x>y?1:0)*SQS.d;});
  const th=(k,l,cls)=>`<th class="${cls||''}${SQS.k===k?' on':''}" data-act="sqSort" data-k="${k}">${l}${SQS.k===k?(SQS.d>0?' ▾':' ▴'):''}</th>`;
  return `<div class="sqt-wrap"><table class="sqt"><thead><tr>${th('num','#')}${th('name','Oyuncu','l')}${th('pos','Mevki')}${th('age','Yaş')}<th>Uyruk</th>${th('ovr','Güç')}${th('pot','Pot')}${th('val','Değer')}${th('ct','Sözleşme')}${th('ap','Maç')}${th('g','Gol')}${th('a','Asist')}${th('rt','Ort.')}</tr></thead><tbody>
   ${rows.map(({p,s,pot,v,ct})=>`<tr class="${xi.includes(p.k)?'xi':''}" data-act="pcard" data-id="${id}" data-k="${p.k}"><td class="num">${p.num}</td><td class="l"><b>${esc(p.name)}</b>${rshort(R[p.k])}</td><td><span class="pos p-${p.pos}">${dpTag(p)}</span></td><td>${p.age}</td><td>${flagImg(p.nat,'fl-row')}</td><td><b class="ov">${R200(scO(p,c))}</b></td><td>${R200(pot)}</td><td>${eur(v)}</td><td>${ct}</td><td>${s.ap||0}</td><td>${s.g||0}</td><td>${s.a||0}</td><td>${s.ap?(s.rt/s.ap).toFixed(2):'–'}</td></tr>`).join('')}</tbody></table></div>`;}
ACTX.sqSort=el=>{const k=el.dataset.k;if(SQS.k===k)SQS.d*=-1;else SQS={k,d:1};const mc=$('#modal');if(mc&&!mc.hidden&&$('#modalCard .sqt')){const id=$('#modalCard [data-act=pcard]').dataset.id;$('#modalCard').innerHTML=squadHTML(id)+`<button class="btn ghost" data-act="closeModal" style="width:100%;margin-top:8px">Kapat</button>`;}else render();};
squadHTML=(old=>function(id){if(window.innerWidth<1000||SQT==='ekip')return old(id);const c=CLUBS[id];if(!c)return '';const sq=squadOf(id),L=LEAGUES[c.league],mgr=G&&G.mode==='mgr'&&id===G.club,xi=mgr?mgrXI():[],tv=sq.reduce((a,p)=>a+pValue(p),0),aa=sq.reduce((a,p)=>a+p.age,0)/Math.max(1,sq.length);
  return `<div class="club-hd">${crestSVG(c,52)}<div><h3>${esc(c.name)}</h3><span>${L.name}</span></div><dl class="offer-terms sq-terms"><div><dt>Yaş ort.</dt><dd>${dec(aa)}</dd></div><div><dt>Kadro değeri</dt><dd>${eur(tv)}</dd></div><div><dt>Kadro</dt><dd>${sq.length} oyuncu</dd></div></dl></div>
   ${mgr?'<p class="muted" style="margin:8px 0">Vurgulu satırlar ilk 11’in. Başlıklara tıklayıp sıralayabilir, oyuncuya tıklayıp profilini açabilirsin.</p>':''}${sqTabs(id)}${sqTable(id,{xi})}`;})(squadHTML);
function viewStaffSquad(){const id=G.club,c=myClub(),X=staffXI(id),co=coachOf(id);
  return `<h2 class="h">Kadro ve diziliş</h2><div class="ss-grid"><section class="panel"><p class="sub-h"><span>${esc(co.n)} · ${X.f}</span><span>Muhtemel 11</span></p>${pitchHTML(id,X)}
   <p class="sub-h" style="margin-top:8px"><span>Yedekler</span><span>${X.bench.length}</span></p><div class="fm-bench">${X.bench.slice(0,12).map(p=>`<button class="fm-b" data-act="pcard" data-id="${id}" data-k="${p.k}"><span>${dpTag(p)}</span><b>${esc(ksur(p.name))}</b><em>${R200(p.ovr)}</em><i>${p.num}</i></button>`).join('')}</div></section>
   <section class="panel"><p class="sub-h"><span>${esc(c.name)} kadrosu</span><span>${squadOf(id).length} oyuncu</span></p>${sqTable(id,{xi:X.xi.map(x=>x[1]&&x[1].k).filter(Boolean)})}</section></div>`;}
XV.kadro=viewStaffSquad;XICON.kadro='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12h18M12 3v18"/><circle cx="12" cy="12" r="3"/></svg>';
xtabs=(old=>function(){const L=old();if(G&&isStaff())L.unshift(['kadro','Kadro']);return L;})(xtabs);
/* ---------- gözlemci ---------- */
function scClean(){const j=jobInit();if(!j.short)return;j.short=j.short.filter(k=>{const p=pByKey(k);return p&&p.alive!==false&&scCid(p)!==G.club;});}
let SR_LAST=null;
ACTX.srGo=(old=>function(){SR_LAST=SRF?Object.assign({},SRF):null;try{const p=SRF&&pByKey(SRF.k);if(p)SR_LAST.acc=srScore(SRF,p).acc;}catch(e){}return old();})(ACTX.srGo);
scReport=(old=>function(k){const j=jobInit(),t=j.task,p=pByKey(k);if(!t||t.done||!p)return old(k);const S=SR_LAST&&SR_LAST.k===k?SR_LAST:null;SR_LAST=null;
  const acc=S?S.acc:45,ch=clamp(0.25+acc/140+(S&&S.rec==='kesin'?0.05:S&&S.rec==='izle'?-0.1:0)+((j.bd||55)-55)/300,0.12,0.92);
  if(Math.random()>ch){t.rej=(t.rej||0)+1;j.reps.unshift({k,y:seasonLabel(G.s.year),ok:false,ovr:p.ovr,pot:potOf(p),club:scCid(p)});j.repsN=(j.repsN||0)+1;
    msg('board','Raporun reddedildi',`Yönetim ${p.name} raporunu yeterince ikna edici bulmadı (${['oyuncunun kadroya katkısı tartışmalı','teknik heyet farklı bir profil arıyor','raporun bazı değerlendirmeleri gerçeği yansıtmıyor','bonservis-performans dengesi uygun görülmedi'][Math.floor(Math.random()*4)]}). Görev hâlâ açık; başka bir oyuncu önerebilirsin.`);toast('Rapor reddedildi');save();render();return;}
  const r=old(k);scClean();return r;})(scReport);
rqResolve=(old=>function(r){const j=jobInit();if(r.rep&&!r.forceOk){const ch=clamp(0.3+r.rep.acc/120+(r.rep.rec==='kesin'?0.05:r.rep.rec==='izle'?-0.1:0),0.12,0.95);
    if(Math.random()>ch){const p=pByKey(r.k);r.st='red';r.why='teknik heyet raporunu yeterince ikna edici bulmadı';j.rep=clamp(j.rep-1,0,100);msg('board','Transfer talebin reddedildi',`${p?p.name:'Oyuncu'}: ${r.why}.`);return;}}
  const out=old(r);scClean();return out;})(rqResolve);
ACTX.scPush=(old=>function(el){const r=old(el);scClean();save();render();return r;})(ACTX.scPush);
function scTransfersHTML(){const j=jobInit(),seen=new Set(),L=[];
  for(const r of (j.rq||[]))if(r.st==='tamam'&&!seen.has(r.k)){seen.add(r.k);L.push({k:r.k,y:r.y,est:r.est,ovr0:r.real,price:r.price,acc:r.rep&&r.rep.acc});}
  for(const r of (j.reps||[]))if(r.ok&&!seen.has(r.k)){seen.add(r.k);L.push({k:r.k,y:r.y,ovr0:r.ovr,price:null});}
  const rows=L.map(x=>{const p=pByKey(x.k);if(!p)return null;const cid=scCid(p),c=CLUBS[cid];if(!c)return null;const s=(()=>{try{return seasonStats(Object.assign({},p,{ovr:p.ovr}),cid)||{};}catch(e){return {};}})(),avg=s.ap?s.rt/s.ap:0,dv=p.ovr-(x.ovr0||p.ovr);
    const v=pValue(p),verdict=avg>=7.05||dv>=3?['good','Başarılı']:avg&&avg<6.4?['red','Hayal kırıklığı']:['warn','Ortalama'];return {x,p,c,cid,s,avg,dv,v,verdict};}).filter(Boolean);
  const spent=rows.reduce((a,r)=>a+(r.x.price||0),0),val=rows.reduce((a,r)=>a+r.v,0),ga=rows.reduce((a,r)=>a+(r.s.g||0),0),ok=rows.filter(r=>r.verdict[1]==='Başarılı').length;
  return `<section class="panel"><p class="sub-h"><span>Kulübe kazandırdığın oyuncular</span><span>${rows.length}</span></p><div class="strip"><div><b>${rows.length}</b><span>Transfer</span></div><div><b>${eur(spent)}</b><span>Harcanan</span></div><div><b>${eur(val)}</b><span>Bugünkü değer</span></div><div><b>${ga}</b><span>Bu sezon gol</span></div><div><b>${ok}</b><span>Başarılı</span></div></div></section>
   <section class="panel">${rows.length?`<div class="sqt-wrap"><table class="sqt"><thead><tr><th class="l">Oyuncu</th><th>Kulüp</th><th>Sezon</th><th>Geldiğinde</th><th>Şimdi</th><th>Maç</th><th>Gol</th><th>Asist</th><th>Ort.</th><th>Değer</th><th>Rapor</th><th>Durum</th></tr></thead><tbody>
    ${rows.map(r=>`<tr data-act="pcard" data-id="${r.cid}" data-k="${r.p.k}"><td class="l"><b>${esc(r.p.name)}</b><small style="display:block;color:var(--chalk-3)">${r.p.pos} · ${r.p.age} yaş</small></td><td>${crestSVG(r.c,16)} ${esc(r.c.short)}</td><td>${esc(r.x.y)}</td><td>${R200(r.x.ovr0||'–')}</td><td><b class="ov">${R200(r.p.ovr)}</b> <small class="${r.dv>0?'up':r.dv<0?'dn':''}">${r.dv>0?'+'+r.dv:r.dv<0?r.dv:''}</small></td><td>${r.s.ap||0}</td><td>${r.s.g||0}</td><td>${r.s.a||0}</td><td>${r.avg?r.avg.toFixed(2):'–'}</td><td>${eur(r.v)}</td><td>${r.x.acc!=null?'%'+r.x.acc:'–'}</td><td><span class="pill ${r.verdict[0]}">${r.verdict[1]}</span></td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Henüz kulübe kazandırdığın bir oyuncu yok. Gözlem listesinden transfer talebi gönder ya da görevlere uygun oyuncu öner.</p>'}</section>`;}
scHTML=(old=>function(){scClean();if(SCT!=='trf')return old();const h=old(),i=h.indexOf('<div class="filt sc-tabs">');if(i<0)return h+scTransfersHTML();const e=h.indexOf('</div>',i)+6;return h.slice(0,e)+scTransfersHTML();})(scHTML);
/* ---------- PC: merkez ekranı panoya dönüşür ---------- */
render=(old=>function(){old();const v=$('#view');if(v){v.className=v.className.replace(/\bv-\S+/g,'').trim();if(G)v.classList.add('v-'+TAB);}})(render);
openModal=(old=>function(h){old(h);const mc=$('#modalCard');if(mc&&mc.querySelector('.sqt'))mc.classList.add('wide');})(openModal);

/* PC merkez: sağ sütun panoları (mini puan durumu + son mesajlar) */
function hubSideHTML(){if(!G||!G.s||G.phase!=='season')return '';let tb=[];try{tb=table();}catch(e){return '';}const i=tb.findIndex(r=>r.id===G.club),show=tb.slice(0,6).concat(i>=6?[tb[i]]:[]);
  const t=`<section class="panel hub-side"><p class="sub-h"><span>${esc(curLeague().short)} · puan durumu</span><span>${i+1}. sıra</span></p><table class="mini-t">${show.map(r=>{const k=tb.indexOf(r);return `<tr class="${r.id===G.club?'me':''}" data-act="club" data-id="${r.id}"><td>${k+1}</td><td class="l">${crestSVG(CLUBS[r.id],14)} ${esc(CLUBS[r.id].short)}</td><td>${r.o}</td><td>${r.a-r.y>0?'+':''}${r.a-r.y}</td><td><b>${r.p}</b></td></tr>`;}).join('')}</table><button class="btn sm ghost" data-act="tab" data-tab="league" style="width:100%;margin-top:6px">Tüm tablo</button></section>`;
  const ms=(G.inbox||[]).slice(0,4).map(m=>`<li data-act="tab" data-tab="inbox"><span class="msg-tag">${TAGS[m.t]||'•'}</span><b>${esc(m.title)}</b></li>`).join('');
  return t+(ms?`<section class="panel hub-side"><p class="sub-h"><span>Son mesajlar</span><span>${unreadCount()} okunmamış</span></p><ul class="mini-in">${ms}</ul></section>`:'');}
render=(old=>function(){old();try{if(G&&TAB==='hub'&&window.innerWidth>=1000&&G.phase==='season'){const v=$('#view');if(v&&!v.querySelector('.hub-side')){v.insertAdjacentHTML('beforeend',hubSideHTML());linkify(v);}}}catch(e){}})(render);
render=(old=>function(){old();try{const v=$('#view');if(!G||TAB!=='hub'||window.innerWidth<1000||!v||v.querySelector('.hub-top'))return;const L=document.createElement('div'),R=document.createElement('div'),T=document.createElement('div');L.className='hub-l';R.className='hub-r';T.className='hub-top';
  const isL=e=>e.matches('.week,.ticket,.cta,.day-ctas,.talk-alert,.injbar,.meters,.wallet'),isR=e=>e.matches('.staff-card,.st-dev,.offer,.hub-side,p.pill');const kids=[...v.children];let any=false;
  for(const e of kids){if(isL(e)){L.appendChild(e);any=true;}else if(isR(e)){R.appendChild(e);any=true;}}if(!any)return;T.append(L,R);v.prepend(T);}catch(e){}})(render);

