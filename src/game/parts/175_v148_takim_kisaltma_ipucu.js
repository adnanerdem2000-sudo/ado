/* ================= v148: takım kısaltmasının üstüne gelince tam adı (ipucu) ================= */
/* Fareyle bir takım kısaltmasının (GS, FB, BJK…) ya da kulüp armasının üstüne gelince title ile kulübün tam adı görünür.
   Kısaltma birden çok kulüpte geçiyorsa önce kendi ligindeki kulüp, yoksa en fazla üç ad " / " ile yazılır. */
const KSA={key:'',map:null};
const KSA_STOP=new Set(['GÜN','MAÇ','KAMP','VS','BAY','KL','OS','DF','FW','KN','TOP','GOL','YAŞ','OVR','POT','SAĞ','SOL','ORT','DEV','HAF','AY','YIL','PAZ','PZT','SAL','ÇAR','PER','CUM','CMT','OK','EV','DEP','TR','AB','PRO','VAR','GK','ST','DC','MC','AMC','DM','ML','MR','DL','DR','SF','STP','MO','OOS','DOS','SĞB','SLB','SĞK','SLK','KAP','EK','PUAN','AV','GA','GY','AG','O','G','B','M']);
function ksaMap(){
  const lg=(G&&CLUBS[G.club]&&CLUBS[G.club].league)||'';
  if(KSA.map&&KSA.key===lg)return KSA.map;
  const all=new Map();
  for(const id in CLUBS){const c=CLUBS[id];if(!c||!c.short||!c.name)continue;const s=String(c.short).trim();if(s.length<2||s.length>6||KSA_STOP.has(s)||(typeof CLX_STOP!=='undefined'&&CLX_STOP.has(s)))continue;
    if(!all.has(s))all.set(s,[]);all.get(s).push(c);}
  const m=new Map();
  for(const [s,L] of all){const own=L.filter(c=>c.league===lg);const use=own.length?own:L;m.set(s,use.slice(0,3).map(c=>c.name).join(' / '));}
  KSA.key=lg;KSA.map=m;return m;
}
document.addEventListener('mouseover',e=>{try{
  const t=e.target;if(!(t instanceof Element))return;
  const cl=t.closest('[data-act="club"][data-id]');
  if(cl){const c=CLUBS[cl.dataset.id];if(c&&!cl.title)cl.title=c.name;return;}
  const sv=t.closest('svg');
  if(sv){if(sv.querySelector('title'))return;const tx=sv.querySelector('text');const k=tx&&(tx.textContent||'').trim();const n=k&&ksaMap().get(k);
    if(n){const ti=document.createElementNS('http://www.w3.org/2000/svg','title');ti.textContent=n;sv.insertBefore(ti,sv.firstChild);}return;}
  if(t.title||t.childElementCount>0||t.closest('button:not([data-act="club"]),input,select,textarea'))return;
  const s=(t.textContent||'').trim();if(s.length<2||s.length>6)return;
  const n=ksaMap().get(s);if(n&&n!==s)t.title=n;
}catch(_){}},true);
