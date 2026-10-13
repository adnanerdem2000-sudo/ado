/* ================= kayıt yuvaları ================= */
const SLOT_IDX='kariyer-yuvalar-v1',SLOT_PRE='kariyer-yuva-',SLOT_LAST='kariyer-son';
function slotsList(){try{const a=JSON.parse(localStorage.getItem(SLOT_IDX)||'[]');return Array.isArray(a)?a:[];}catch(e){return [];}}
function slotsWrite(a){try{localStorage.setItem(SLOT_IDX,JSON.stringify(a));}catch(e){}}
const PROF={oyuncu:{n:'Futbolcu',d:'12 yaşında seçmelerle başla, altyapıdan dünya yıldızlığına yüksel.',ic:'⚽'},
  td:{n:'Teknik direktör',d:'UEFA C lisansıyla amatör bir kulüpte başla, lisansını yükselt, büyük takımları çalıştır.',ic:'📋'},
  yrd:{n:'Yardımcı antrenör',d:'Altyapı antrenörü olarak başla, idman hazırla, rakip analiz et; as hocalığa ve teknik direktörlüğe yüksel.',ic:'🧢'},
  scout:{n:'Gözlemci',d:'Kulübün için yetenek avla: ülke ülke gez, raporla, keşfettiğin oyuncular yıldız olsun.',ic:'🔭'},
  dr:{n:'Takım doktoru',d:'Fizyoterapistlikten sağlık şefliğine: teşhis koy, tedavi seç, oyuncuları sahaya döndür.',ic:'🩺'}};
function slotMeta(){const c=CLUBS[G.club];return {id:G.sid,name:meN(),prof:G.prof||(G.mode==='mgr'?'td':'oyuncu'),mode:G.mode||'player',club:G.club,year:G.s?G.s.year:2026,age:G.p.age,apps:G.totals?G.totals.apps:0,t:Date.now(),phase:G.phase,title:staffTitle()};}
function staffTitle(){if(!G)return '';if(G.mode==='mgr')return 'Teknik direktör';if(G.mode==='staff'&&G.job)return G.job.title;return G.phase==='retired'?'Emekli futbolcu':'Futbolcu';}
function slotSave(){if(!G||!G.p)return;if(!G.sid)G.sid='s'+Date.now().toString(36)+rint(10,99);try{localStorage.setItem(SLOT_PRE+G.sid,JSON.stringify(G));localStorage.setItem(SLOT_LAST,G.sid);}catch(e){try{toast('Kayıt alanı doldu: eski bir kariyeri silmelisin');}catch(_){}return;}
  const a=slotsList().filter(x=>x.id!==G.sid);a.unshift(slotMeta());slotsWrite(a);}
function slotLoad(id){try{const s=localStorage.getItem(SLOT_PRE+id);const g=s?JSON.parse(s):null;return g&&g.v===4?g:null;}catch(e){return null;}}
function slotDel(id){try{localStorage.removeItem(SLOT_PRE+id);}catch(e){}slotsWrite(slotsList().filter(x=>x.id!==id));}
function slotMigrate(){try{if(slotsList().length)return;const s=localStorage.getItem(SAVE_KEY);if(!s)return;const g=JSON.parse(s);if(!g||g.v!==4||!g.p)return;const g0=G;G=g;G.sid='s1old';slotSave();G=g0;}catch(e){}}
save=function(){try{msSync();}catch(e){}slotSave();};
load=function(){const id=(()=>{try{return localStorage.getItem(SLOT_LAST);}catch(e){return null;}})();return id?slotLoad(id):null;};

