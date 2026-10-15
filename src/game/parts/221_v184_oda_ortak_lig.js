/* ================= v184: çevrimiçi oda — lig verilerinde tek kaynak oda kurucusu (sunucu): gol/asist krallığı, diğer liglerin fikstür ve sonuçları; arkadaşın (futbolcu) istatistikleri krallık listelerinde ================= */
/* Kural (v169 sonuç kuralıyla aynı): kendi kulübünün oyuncuları senin, arkadaşının kulübününkiler onun; geri kalan her şey sunucunun dünyasından gelir. */
const V184={sig:'',ol:0};
function v184Ids(lid){return leagueClubs(lid).map(c=>c.id).sort();}
const V184_B='0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
function v184OlKod(lid,o){const ids=v184Ids(lid);if(ids.length>V184_B.length)return null;const ix={};ids.forEach((id,i)=>ix[id]=V184_B[i]);
  try{const f=o.fx.map(rd=>rd.map(([h,a])=>ix[h]+ix[a]).join('')).join('|');const r=o.res.map(rd=>rd.map(m=>V184_B[clamp(m[2],0,61)]+V184_B[clamp(m[3],0,61)]).join('')).join('|');
    if(f.includes('undefined'))return null;return {h:mpH53(ids.join(','),5),f,r};}catch(e){return null;}}
function v184OlCoz(lid,d){const ids=v184Ids(lid);if(mpH53(ids.join(','),5)!==d.h)return null;const id=c=>ids[V184_B.indexOf(c)];
  const fx=d.f.split('|').map(s=>{const rd=[];for(let i=0;i+1<s.length;i+=2)rd.push([id(s[i]),id(s[i+1])]);return rd;});
  const res=(d.r?d.r.split('|'):[]).map((s,w)=>{const rd=[];const F=fx[w]||[];for(let i=0,j=0;i+1<s.length;i+=2,j++){const m=F[j];if(!m)break;rd.push([m[0],m[1],V184_B.indexOf(s[i]),V184_B.indexOf(s[i+1])]);}return rd;});
  if(fx.some(rd=>rd.some(m=>!m[0]||!m[1])))return null;return {fx,res};}
async function v184Sik(str){try{if(typeof CompressionStream==='undefined')throw 0;const cs=new Blob([str]).stream().pipeThrough(new CompressionStream('deflate-raw'));const u8=new Uint8Array(await new Response(cs).arrayBuffer());let b='';for(let i=0;i<u8.length;i+=0x8000)b+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000));return {z:1,d:btoa(b)};}catch(e){return {z:0,d:str};}}
async function v184Ac(o){if(!o.z)return o.d;const bin=atob(o.d),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  if(typeof DecompressionStream!=='undefined'){const ds=new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'));return await new Response(ds).text();}
  const out=await adoAc(u8);return typeof out==='string'?out:new TextDecoder().decode(out);}
/* gönder: sunucu her şeyi, misafir yalnız kendi kulübünün oyuncu istatistiklerini */
async function v184Gonder(force){try{if(!mpOn()||!MP.code||!mpConnected()||!G.s||!mpPartnerExists())return;const S=G.s,host=G.mp.role==='host';
    const ps={};for(const [k,p] of Object.entries(S.ps||{})){if(!host&&p.c!==G.club)continue;if(p.g||p.a)ps[k]=[p.g||0,p.a||0];}
    const ol={};if(host){for(const lid of Object.keys(LEAGUES)){if(lid===S.league||lid==='trx')continue;let n=0;try{n=leagueClubs(lid).length;}catch(e){}if(n<2)continue;
        try{const o=olSync(lid);const d=v184OlKod(lid,o);if(d)ol[lid]=d;}catch(e){}}}
    const body={y:S.year,L:S.league,club:G.club||'',ps,ol};const str=JSON.stringify(body),sig=mpH53(str,9);if(!force&&sig===V184.sig)return;V184.sig=sig;
    const pk=await v184Sik(str);const o=Object.assign({k:'lig',p:mpPid(),r:G.mp.role,ts:Date.now()},pk);
    mqPub(MP.base+'/l/'+o.p,await mpEnc(o),true);}catch(e){console.warn('oda lig gönder',e);}}
mpPubRes=(old=>function(force){const r=old.apply(this,arguments);try{clearTimeout(V184.t);V184.t=setTimeout(()=>v184Gonder(force),force?600:250);}catch(e){}return r;})(mpPubRes);
/* al */
async function v184Al(o){const S=G.s;if(!S)return;const mem=G.mp.mem||[];if(!mem.includes(o.p))return;if(o.ts<(V184.ts||0))return;V184.ts=o.ts;
  const b=JSON.parse(await v184Ac(o));if(b.y!==S.year)return;let ch=0;const host=G.mp.role==='host';
  if(b.L===S.league&&b.ps){for(const [k,p] of Object.entries(S.ps||{})){const al=host?p.c===b.club:p.c!==G.club;if(!al)continue;const v=b.ps[k]||[0,0];if((p.g||0)!==v[0]||(p.a||0)!==v[1]){p.g=v[0];p.a=v[1];ch++;}}}
  if(!host&&b.ol){S.ol=S.ol||{};for(const [lid,d] of Object.entries(b.ol)){if(!LEAGUES[lid]||lid===S.league)continue;try{const c=v184OlCoz(lid,d);if(!c)continue;const cur=S.ol[lid];
        const same=cur&&JSON.stringify(cur.fx)===JSON.stringify(c.fx)&&JSON.stringify(cur.res)===JSON.stringify(c.res);if(same)continue;
        S.ol[lid]={fx:c.fx,res:c.res,cal:(cur&&cur.cal)||buildCal(lid,S.year)};ch++;}catch(e){}}}
  if(ch){try{CSE_C={};}catch(e){}save();try{mpSoftRender();}catch(e){}}}
mpRecv=(old=>async function(topic,pay,retained){try{if(MP.base&&topic.startsWith(MP.base+'/l/')){if(!pay.length||!mpOn())return;const o=await mpDec(pay);if(!o||!o.p||o.p===mpPid()||o.k!=='lig')return;await v184Al(o);return;}}catch(e){console.warn('oda lig al',e);return;}
  return old.apply(this,arguments);})(mpRecv);
/* odada diğer liglerin fikstürü oda kodundan tohumlu kurulur (iki dünyada aynı); sonuçları sunucunun verisi gelince onunkiyle değişir */
olSync=(old=>function(lid){try{const S=G.s;if(mpOn()&&S&&!(S.ol&&S.ol[lid])&&LEAGUES[lid]){S.ol=S.ol||{};S.ol[lid]={fx:makeFixtures(mpTohumKaristir(v184Ids(lid),'oda:'+G.mp.code+':'+lid+':'+S.year)),res:[],cal:buildCal(lid,S.year)};}}catch(e){}return old.apply(this,arguments);})(olSync);
/* ---------- arkadaşın futbolcuysa gol/asist krallığında o da görünür ---------- */
mpSt=(old=>function(){const o=old.apply(this,arguments);try{if(isPl()&&G.s&&G.s.stats){const s=G.s.stats;o.pst={g:s.goals||0,a:s.assists||0,ap:s.apps||0,rs:s.rsum||0,pos:(G.p&&G.p.pos)||'FW'};}}catch(e){}return o;})(mpSt);
function v184Ark(lid){try{const P=MP.peer;if(!mpOn()||!P||!P.pst||!P.club||!G.s)return null;if(P.y!==G.s.year||P.L!==lid)return null;return P;}catch(e){return null;}}
leaders=(old=>function(k){const arr=old.apply(this,arguments);try{const P=v184Ark(G.s.league);if(P){arr.push({n:P.n,c:P.club,v:k==='g'?P.pst.g:P.pst.a,mp:true});arr.sort((x,y)=>y.v-x.v);}}catch(e){}return arr;})(leaders);
lgLeaders=(old=>function(lid,k){const out=old.apply(this,arguments);try{const P=v184Ark(lid);if(P){out.push({mp:true,c:P.club,p:{k:'__mp',name:P.n||'Arkadaşın',pos:P.pst.pos||'FW'},ap:P.pst.ap,g:P.pst.g,a:P.pst.a,rt:P.pst.rs});
      const key=k==='g'?'g':'a',alt=k==='g'?'a':'g';out.sort((x,y)=>y[key]-x[key]||y[alt]-x[alt]||x.ap-y.ap);}}catch(e){}return out;})(lgLeaders);
leadersViewHTML=(old=>function(){const h=old.apply(this,arguments);try{return h.replace(/ data-act="pcard" data-id="[^"]*" data-k="__mp"/g,' title="Çevrimiçi odadaki arkadaşın"');}catch(e){return h;}})(leadersViewHTML);
