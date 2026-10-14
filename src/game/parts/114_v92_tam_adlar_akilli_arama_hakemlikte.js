/* ================= v92: tam adlar + akıllı arama · hakemlikte kulüp mesajları gelmez ================= */
/* bazı oyuncular kısa adla kayıtlıydı: tam adları (ayak verisi ve görünüm de taşınır) */
const AB_FULLNAME={'Demir Tıknaz':'Demir Ege Tıknaz'};
(function(){try{for(const id in SQ_REAL){const L=SQ_REAL[id];if(!Array.isArray(L))continue;for(const r of L){const n=AB_FULLNAME[r[0]];if(n)r[0]=n;}}
  for(const [a,b] of Object.entries(AB_FULLNAME)){if(typeof FOOT_DB!=='undefined'&&FOOT_DB[a]&&!FOOT_DB[b])FOOT_DB[b]=FOOT_DB[a];if(typeof LOOKS!=='undefined'&&LOOKS[a]&&!LOOKS[b])LOOKS[b]=LOOKS[a];}
  try{for(const k in SQC)delete SQC[k];}catch(e){}}catch(e){console.warn(e);}})();
/* ---------- arama: Türkçe karakter ve aksan duyarsız, kelime kelime ---------- */
function srchFold(s){return String(s||'').toLocaleLowerCase('tr-TR').replace(/ı/g,'i').replace(/ş/g,'s').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ç/g,'c').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();}
/* tüm sorgu kelimeleri adın bir kelimesinin başında geçmeli; 3+ kelimede biri eksik olabilir (ör. ikinci ad) */
function srchScore(q,name){const qt=srchFold(q).split(' ').filter(Boolean);if(!qt.length)return 0;const f=srchFold(name),nt=f.split(' ');
  if(f.includes(qt.join(' ')))return 100+(f.startsWith(qt[0])?10:0);
  let hit=0;for(const t of qt){if(nt.some(w=>w.startsWith(t))||(t.length>=4&&f.includes(t)))hit++;}
  if(hit===qt.length)return 60+hit;if(qt.length>=3&&hit>=qt.length-1&&nt.some(w=>w.startsWith(qt[qt.length-1])))return 40+hit;return 0;}
qsRun=function(q){const box=$('#qsRes');if(!box)return;q=String(q||'').trim();if(q.length<2){box.hidden=true;return;}const I=qsIndex(),R=[];
  for(const x of I){const s=srchScore(q,x.n+(x.t==='c'?' '+x.s:''));if(s)R.push([s+(x.t==='c'?5:0)+(x.ovr||0)/100,x]);}
  R.sort((a,b)=>b[0]-a[0]);const top=R.slice(0,14).map(r=>r[1]);
  box.innerHTML=top.length?top.map(x=>x.t==='c'?`<button data-act="club" data-id="${x.id}">${crestSVG(CLUBS[x.id],16)}<b>${esc(x.n)}</b><small>Kulüp · ${esc(LEAGUES[CLUBS[x.id].league].short)}</small></button>`:`<button data-act="pcard" data-id="${x.id}" data-k="${x.k}"><span class="tp">${v153PosK(x)}</span><b>${esc(x.n)}</b><small>${x.age} · ${esc(CLUBS[x.id].short)} · ${R200(x.ovr)}</small></button>`).join(''):'<p class="muted" style="padding:8px">Sonuç yok</p>';box.hidden=false;};
/* ---------- hakem: kulüp maç sonuçları gelen kutusuna düşmez ---------- */
function refClubMsg(t,title){try{if(!isRef()||t!=='report')return false;const c=G.club&&CLUBS[G.club];if(!c)return false;const s=String(title||'');return s.indexOf(c.name)>=0&&(/^Maç sonucu:/.test(s)||/·/.test(s));}catch(e){return false;}}
msg=(old=>function(t,title,body,extra){if(refClubMsg(t,title))return;return old.apply(this,arguments);})(msg);
render=(old=>function(){try{if(G&&G.inbox&&isRef()&&!G.refClean){G.refClean=1;G.inbox=G.inbox.filter(m=>!refClubMsg(m.t,m.title));}}catch(e){}return old.apply(this,arguments);})(render);
/* telefonda da arama: üst çubukta büyüteç */
renderTop=(old=>function(){old.apply(this,arguments);try{if(!G||G.phase==='tryout'||navWide())return;const meta=$('#top .top-meta');if(meta&&!$('#qsBtn'))meta.insertAdjacentHTML('afterbegin',`<button id="qsBtn" class="qs-btn" data-act="qsOpen" aria-label="Oyuncu veya kulüp ara">⌕</button>`);}catch(e){}})(renderTop);
ACTX.qsOpen=()=>{openModal(`<h3>Oyuncu veya kulüp ara</h3><div class="qs-w qs-m"><input id="qs" type="search" placeholder="Ör. Demir Ege Tıknaz" autocomplete="off"><div id="qsRes" class="qs-res" hidden></div></div>`);setTimeout(()=>{const i=$('#qs');if(i)i.focus();},50);};

