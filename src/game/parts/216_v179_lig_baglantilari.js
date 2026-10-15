/* ================= v179: lig adları kulüp ve oyuncu adları gibi tıklanabilir — metinde geçen lig adı o ligin puan durumunu açar ================= */
let LGX={key:'',map:null,re:null};
/* ad → lig: tam adlar her zaman; kısa adlar yalnız tek bir lige aitse (ör. "2. Lig" birden çok grupta: o zaman yalnız kendi ligin) */
function lgxIndex(){if(!G||!G.s)return null;const key=Object.keys(LEAGUES).length+'|'+G.s.league;if(LGX.key===key)return LGX;
  const map=new Map(),say=new Map(),own=G.s.league,ok=id=>{try{return leagueClubs(id).length>0;}catch(e){return false;}};
  const ids=Object.keys(LEAGUES).filter(id=>ok(id)&&id!=='trx');
  for(const id of ids){const s=LEAGUES[id].short;if(s)say.set(s,(say.get(s)||0)+1);}
  for(const id of ids){const n=LEAGUES[id].name;if(n&&n.length>=4&&!map.has(n))map.set(n,id);}
  for(const id of ids){const s=LEAGUES[id].short;if(!s||map.has(s)||s.length<3||/^(Amatör|Lig dışı)$/i.test(s))continue;
    if(say.get(s)===1)map.set(s,id);else if(LEAGUES[own]&&LEAGUES[own].short===s)map.set(s,own);}
  const alt=[...map.keys()].sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  LGX={key,map,re:alt?clxRe(alt):null};return LGX;}
const LGX_SKIP=CLX_SKIP+',.lglink,#match';
function lgLinkify(root){const I=lgxIndex();if(!I||!I.re||!root||(root.closest&&root.closest('#match')))return;
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const v=n.nodeValue,pe=n.parentElement;if(!pe||!v||v.length<3)return NodeFilter.FILTER_REJECT;
    I.re.lastIndex=0;if(!I.re.test(v))return NodeFilter.FILTER_REJECT;if(pe.closest(LGX_SKIP))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});
  const ns=[];let n;while((n=w.nextNode()))ns.push(n);
  for(const t of ns){const s=t.nodeValue,frag=document.createDocumentFragment();let last=0,mm;I.re.lastIndex=0;
    while((mm=I.re.exec(s))){const id=I.map.get(mm[1]);if(!id)continue;if(!CLX_LB&&mm.index>0&&/[\p{L}\p{N}]/u.test(s[mm.index-1]))continue;
      frag.append(s.slice(last,mm.index));const sp=document.createElement('span');sp.className='lglink';sp.dataset.act='lig';sp.dataset.id=id;sp.title=LEAGUES[id].name;sp.textContent=mm[1];frag.append(sp);last=mm.index+mm[1].length;}
    if(last){frag.append(s.slice(last));t.replaceWith(frag);}}}
/* kulüp bağlantıları nerede kuruluyorsa (ana görünüm, pencereler, maç sonu) lig bağlantıları da önce kurulur */
clubLinkify=(old=>function(root){try{if(G&&G.phase!=='tryout')lgLinkify(root);}catch(e){console.warn('lig bağlantı',e);}return old.apply(this,arguments);})(clubLinkify);
/* üst çubuktaki lig adı */
renderTop=(old=>function(){old.apply(this,arguments);try{if(!G||!G.s||G.phase==='tryout')return;const sp=$('#top .top-txt span');if(sp&&!sp.dataset.act&&LEAGUES[G.s.league]){sp.dataset.act='lig';sp.dataset.id=G.s.league;sp.classList.add('lglink','lg-top');sp.title=LEAGUES[G.s.league].name+' · puan durumu';}}catch(e){}})(renderTop);
/* tıklayınca: o ligin puan durumu (kendi ligin ise Lig ekranı) */
ACTX.lig=el=>{const id=el&&el.dataset&&el.dataset.id;if(!G||!G.s||!LEAGUES[id])return;try{if(!$('#modal').hidden)closeModal();}catch(e){}
  try{const m=$('#match');if(m&&!m.hidden)return;}catch(e){}
  VLG=id===G.s.league?null:id;LTAB='tbl';TAB='league';render();window.scrollTo(0,0);};
