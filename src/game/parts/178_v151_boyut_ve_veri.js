/* ================= v151: dosya boyutu ve veri düzeltmeleri =================
   - Sıkıştırılmış veri: 3B modeller (Meshy gövde, saç, kafa derisi bitmapleri, GLB) derlemede tools/sikistir.js ile paketlenir (manifestte @z).
     Her paket adoZKayit(ad, paket) ile kaydolur; `ad` global değişkeni İLK OKUNDUĞUNDA açılır (açılışta çözülmez). Sayfa yüklendikten
     sonra boşta DecompressionStream ile önceden açılır; yoksa (eski Safari) yedek JS inflate (adoInflate) eşzamanlı çalışır.
   - adoAc(): DecompressionStream yoksa yedek inflate — FotMob kariyer verisi (162) ve stadyum (stadium_loader) de bunu kullanır.
   - Gerçek forma numaraları: SQ_RL satırının 7. alanı (tools/forma_no.js) → kadro ilk kurulurken SQ_REAL[id].shirt (109_v87 sarmalayıcısı numarayı verir).
   - Aksan/ğ/ı farkını yok sayan ad eşleme (adNorm): POSD, FOOT_DB, HW_REAL, LOOKS, CARD ve FotMob kariyer kayıtlarına takma ad.
   - Takvim yılı oynanan liglerde (MLS, Eliteserien, J1, Brasileirão…) sezon etiketi tek yıl: krYL().
   - Gerçek kadrosu olmayan (üretilmiş) kulüplerde "Temsili kadro" notu.
   - Para: EUR_TL (014) iç para birimi ölçeğidir, kur değildir; tek gerçek kur KUR.eur (050) — ₺ karşılığı yalnız tlOf() ile hesaplanır. */

/* ---------- ad normalleştirme: "Hakan Çalhanoğlu" = "Hakan Calhanoglu" ---------- */
function adNorm(s){s=String(s==null?'':s);if(/[^\x00-\x7f]/.test(s))s=s.normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[ıİ]/g,'i').replace(/[øØ]/g,'o').replace(/[đĐðÐ]/g,'d').replace(/[łŁ]/g,'l').replace(/ß/g,'ss').replace(/[æÆ]/g,'ae').replace(/[œŒ]/g,'oe').replace(/[þÞ]/g,'th');
  return s.toLowerCase().replace(/^\d+\.\s*/,'').replace(/[^a-z0-9]+/g,' ').trim();}

/* ---------- yedek inflate (deflate-raw, RFC 1951): DecompressionStream olmayan tarayıcılar için ---------- */
function adoInflate(src,size){
  const LB=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258],LE=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],
    DB=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],DE=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],
    CO=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],n=src.length;
  let pos=0,bb=0,bc=0,op=0,out=new Uint8Array(size>0?size:Math.max(4096,n*4));
  const bits=k=>{if(!k)return 0;while(bc<k){bb|=(pos<n?src[pos++]:0)<<bc;bc+=8;}const v=bb&((1<<k)-1);bb>>>=k;bc-=k;return v;};
  const grow=k=>{if(op+k<=out.length)return;let L=out.length*2;while(L<op+k)L*=2;const o=new Uint8Array(L);o.set(out.subarray(0,op));out=o;};
  /* kanonik Huffman: ≤10 bitlik kodlar tek düzeyli arama tablosunda (sembol<<4 | uzunluk, kod bitleri ters sırada); daha uzun (seyrek) kodlar
     sayım/sembol dizileriyle bit bit çözülür (puff yöntemi) */
  const build=(len,num)=>{let max=1;for(let i=0;i<num;i++)if(len[i]>max)max=len[i];const cnt=new Uint16Array(16),nx=new Uint16Array(16),off=new Uint16Array(17),sym=new Uint16Array(num);
    for(let i=0;i<num;i++)cnt[len[i]]++;cnt[0]=0;for(let b=1;b<16;b++)off[b+1]=off[b]+cnt[b];for(let s=0;s<num;s++)if(len[s])sym[off[len[s]]++]=s;
    let c=0;for(let b=1;b<16;b++){c=(c+cnt[b-1])<<1;nx[b]=c;}const PB=Math.min(max,10),size=1<<PB,T=new Int32Array(size);
    for(let s=0;s<num;s++){const L=len[s];if(!L)continue;let code=nx[L]++;if(L>PB)continue;let r=0;for(let i=0;i<L;i++){r=(r<<1)|(code&1);code>>=1;}for(let k=r;k<size;k+=1<<L)T[k]=(s<<4)|L;}
    return [T,size-1,cnt,sym];};
  const slow=h=>{const cnt=h[2],sym=h[3];let code=0,first=0,index=0;for(let L=1;L<16;L++){code|=(bb>>>(L-1))&1;const k=cnt[L];if(code-k<first){bb>>>=L;bc-=L;return sym[index+(code-first)];}index+=k;first+=k;first<<=1;code<<=1;}
    throw new Error('inflate: geçersiz kod');};
  const dec=h=>{while(bc<15){bb|=(pos<n?src[pos++]:0)<<bc;bc+=8;}const e=h[0][bb&h[1]],L=e&15;if(!L)return slow(h);bb>>>=L;bc-=L;return e>>4;};
  let fin=0,FL=null,FD=null;
  do{fin=bits(1);const t=bits(2);
    if(t===0){const d=bc&7;bb>>>=d;bc-=d;const len=bits(16);bits(16);grow(len);let k=len;while(k>0&&bc>=8){out[op++]=bb&255;bb>>>=8;bc-=8;k--;}
      if(pos+k>n)throw new Error('inflate: kısa veri');out.set(src.subarray(pos,pos+k),op);op+=k;pos+=k;continue;}
    let lt,dt;
    if(t===1){if(!FL){const l=new Uint8Array(288);l.fill(8,0,144);l.fill(9,144,256);l.fill(7,256,280);l.fill(8,280,288);FL=build(l,288);FD=build(new Uint8Array(30).fill(5),30);}lt=FL;dt=FD;}
    else if(t===2){const hl=bits(5)+257,hd=bits(5)+1,hc=bits(4)+4,cl=new Uint8Array(19);for(let i=0;i<hc;i++)cl[CO[i]]=bits(3);
      const ch=build(cl,19),N=hl+hd,L=new Uint8Array(N);
      for(let i=0;i<N;){const s=dec(ch);if(s<16){L[i++]=s;continue;}let r,v=0;
        if(s===16){if(!i)throw new Error('inflate: tekrar');v=L[i-1];r=3+bits(2);}else if(s===17)r=3+bits(3);else r=11+bits(7);
        if(i+r>N)throw new Error('inflate: uzunluk');while(r--)L[i++]=v;}
      lt=build(L.subarray(0,hl),hl);dt=build(L.subarray(hl),hd);}
    else throw new Error('inflate: blok türü');
    /* sıcak döngü: yerel değişkenlerle */
    const lT=lt[0],lM=lt[1];let o=out,cap=o.length;
    for(;;){while(bc<15){bb|=(pos<n?src[pos++]:0)<<bc;bc+=8;}
      const e=lT[bb&lM],L=e&15;let s;if(L){bb>>>=L;bc-=L;s=e>>4;}else s=slow(lt);
      if(s<256){if(op>=cap){grow(1);o=out;cap=o.length;}o[op++]=s;continue;}
      if(s===256)break;
      const i=s-257;if(i>28)throw new Error('inflate: uzunluk kodu');let len=LB[i];const le=LE[i];
      if(le){while(bc<le){bb|=(pos<n?src[pos++]:0)<<bc;bc+=8;}len+=bb&((1<<le)-1);bb>>>=le;bc-=le;}
      const ds=dec(dt);if(ds>29)throw new Error('inflate: uzaklık kodu');
      let dist=DB[ds];const de=DE[ds];if(de){while(bc<de){bb|=(pos<n?src[pos++]:0)<<bc;bc+=8;}dist+=bb&((1<<de)-1);bb>>>=de;bc-=de;}
      if(dist>op)throw new Error('inflate: uzaklık');if(op+len>cap){grow(len);o=out;cap=o.length;}
      let q=op-dist;const end=op+len;while(op<end)o[op++]=o[q++];}
  }while(!fin);
  return out.subarray(0,op);}
function adoB64U8(s){const b=atob(s),n=b.length,u=new Uint8Array(n);for(let i=0;i<n;i++)u[i]=b.charCodeAt(i);return u;}
function adoU8B64(u){let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);}
/* deflate-raw aç → Promise<Uint8Array>: DecompressionStream varsa onunla, yoksa (ya da hata verirse) yedek inflate */
function adoAc(u8){const js=()=>adoInflate(u8);
  if(typeof DecompressionStream!=='undefined'&&typeof Response!=='undefined'&&typeof Blob!=='undefined'){try{return new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer().then(b=>new Uint8Array(b),js);}catch(e){}}
  return new Promise((ok,no)=>setTimeout(()=>{try{ok(js());}catch(e){no(e);}},0));}
function adoUtf8(u){if(typeof TextDecoder!=='undefined')return new TextDecoder().decode(u);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return decodeURIComponent(escape(s));}

/* ---------- sıkıştırılmış veri kaydı (tools/sikistir.js paketi) ---------- */
function adoZ(){return window.__adoZ||(window.__adoZ={ad:{},sira:[],plan:false,n:0,ms:0});}
function adoZKayit(ad,b64){const Z=adoZ();let e=Z.ad[ad];
  if(!e){e=Z.ad[ad]={parca:[],deger:undefined,bitti:false,mesgul:false};
    try{Object.defineProperty(window,ad,{configurable:true,enumerable:true,get:()=>adoZAc(ad),set:v=>{e.deger=v;}});}catch(err){console.warn('adoZ',ad,err);}}
  const p={b:b64,u:null,bitti:false};e.parca.push(p);Z.sira.push(p);adoZPlan();}
/* paketin özgün metnini geri kur: [u32 metin][metin, \x01 = base64 yeri][u32 + ikili]… */
function adoZMetin(u){const dv=new DataView(u.buffer,u.byteOffset,u.byteLength),n=dv.getUint32(0,true),t=adoUtf8(u.subarray(4,4+n)).split('\x01');let o=4+n,s=t[0];
  for(let i=1;i<t.length;i++){const L=dv.getUint32(o,true);o+=4;s+=adoU8B64(u.subarray(o,o+L))+t[i];o+=L;}return s;}
function adoZAc(ad){const Z=adoZ(),e=Z.ad[ad];if(!e)return undefined;if(e.bitti||e.mesgul)return e.deger;e.mesgul=true;const t0=performance.now();
  try{for(const p of e.parca){if(p.bitti)continue;const u=p.u||adoInflate(adoB64U8(p.b));p.b=null;p.u=null;p.bitti=true;adoZCalistir(ad,e,adoZMetin(u));}}
  catch(err){console.warn('Sıkıştırılmış veri açılamadı:',ad,err);}
  finally{e.mesgul=false;}
  e.bitti=true;Z.n++;const ms=performance.now()-t0;Z.ms+=ms;(Z.acilan=Z.acilan||[]).push([ad,Math.round(ms*10)/10,document.readyState]);
  try{Object.defineProperty(window,ad,{configurable:true,enumerable:true,writable:true,value:e.deger});}catch(err){}
  return e.deger;}
/* veri metnini çalıştır: "var|const|let AD = {json};" ve "Object.assign(AD, {json});" JSON.parse ile (hızlı, eval yok); JSON değilse
   değer ifadesi (0,eval) ile hesaplanır (v171: const/let için — dolaylı eval'deki const dışarı sızmaz) */
function adoZBas(s){const t=s.replace(/^\s*\/\*[\s\S]*?\*\/\s*/,''),m=/^\s*(?:(?:var|const|let)\s+([\w$]+)\s*=|Object\.assign\(\s*([\w$]+)\s*,)\s*/.exec(t);
  if(!m)return null;return {ad:m[1]||m[2],atama:!m[1],j:t.slice(m[0].length).replace(m[1]?/;\s*(\/\/[^\n]*)?\s*$/:/\)\s*;\s*(\/\/[^\n]*)?\s*$/,'')};}
function adoZDeger(j){try{return JSON.parse(j);}catch(err){}return (0,eval)('('+j+'\n)');}
function adoZCalistir(ad,e,s){const b=adoZBas(s);
  if(b&&b.ad===ad){const v=adoZDeger(b.j);if(b.atama)Object.assign(e.deger,v);else e.deger=v;return;}
  (0,eval)(s);}
/* v171: @zy — açılışta gereken veri, bildirim yerinde kalır: `const X=adoZYerinde("anahtar")`. Paket derleyicinin koyduğu ön yükleme
   betiğinde (window.__adoZon) durur ve orada tarayıcının yerel açıcısıyla eşzamansız açılmaya başlamıştır; bayt hazırsa yalnız metin +
   JSON.parse, değilse yedek JS inflate eşzamanlı. Argüman paketin kendisi de olabilir (ön yükleme yoksa). */
function adoZYerinde(k){const Z=adoZ(),t0=performance.now(),P=window.__adoZon||{},e=P[k];let b=null,hazir=false;
  try{let u;if(e&&e.u){u=e.u;hazir=true;}else u=adoInflate(adoB64U8(e?e.b:k));if(e){e.bitti=true;e.u=null;e.b=null;}b=adoZBas(adoZMetin(u));}
  catch(err){console.warn('Sıkıştırılmış veri açılamadı',k.length>200?'':k,err);}
  const v=b?adoZDeger(b.j):undefined;const ms=performance.now()-t0;Z.n++;Z.ms+=ms;(Z.yer=Z.yer||[]).push([b&&b.ad,Math.round(ms*10)/10,hazir?'hazır':'js']);return v;}
/* sayfa yüklendikten sonra boşta: paketleri arka planda aç (yalnız inflate; metin ilk kullanımda kurulur) */
function adoZPlan(){const Z=adoZ();if(Z.plan)return;Z.plan=true;
  if(typeof DecompressionStream==='undefined')return;   /* yedek inflate eşzamanlı: ilk kullanımda */
  const run=()=>{const p=Z.sira.find(x=>!x.bitti&&!x.u&&x.b);if(!p)return;let u;try{u=adoB64U8(p.b);}catch(e){return;}
    adoAc(u).then(r=>{if(!p.bitti){p.u=r;p.b=null;}idle(run);},()=>idle(run));};
  const idle=f=>{if(window.requestIdleCallback)requestIdleCallback(f,{timeout:4000});else setTimeout(f,200);};
  const go=()=>setTimeout(()=>idle(run),2500);
  if(document.readyState==='complete')go();else window.addEventListener('load',go,{once:true});}

/* ---------- Y2: gerçek forma numaraları (SQ_RL 7. alan) — kulüp kadrosu ilk kurulurken (baseSquad) okunur ---------- */
function shirtFor(id){const L=SQ_REAL[id],s=typeof SQ_RL!=='undefined'&&SQ_RL[id];if(!Array.isArray(L)||L.shirt||typeof s!=='string'||s.indexOf('|')<0)return 0;
  const rows=s.split(';').map(x=>x.split('|'));if(!rows.some(f=>f[6]))return 0;
  /* 132_v110 kadroyu satır sırasıyla kurar: önce aynı sıradaki ad, tutmazsa aksan farkı yok sayılarak ad */
  let m=null,n=0;L.shirt=L.map((r,i)=>{const f=rows[i];let v=0;if(f&&f[0]===r[0])v=+f[6]||0;else{if(!m){m=new Map();for(const g of rows)if(g[6])m.set(adNorm(g[0]),+g[6]);}v=m.get(adNorm(r[0]))||0;}if(v)n++;return v;});return n;}
baseSquad=(old=>function(id){try{if(!SQC[id])shirtFor(id);}catch(e){}return old.apply(this,arguments);})(baseSquad);
(function(){try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}})();

/* ---------- Y12: aksan farkı yok sayılarak takma ad ----------
   Açılışı yavaşlatmamak için FotMob verisi açıldığında (fmkReady, zaten arka planda) yapılır; FMK yoksa kısa bir gecikmeyle. */
const AD_ALIAS={};
function adAlias(D,names,nm0){if(!D)return 0;let idx=null,n=0;for(const nm of names){if(D[nm]!==undefined)continue;
    if(!idx){idx=new Map();for(const k of Object.keys(D)){const q=nm0(k);if(q&&!idx.has(q))idx.set(q,k);}}
    const k=idx.get(nm0(nm));if(k!==undefined&&k!==nm){D[nm]=D[k];n++;}}return n;}
function adAliasAll(){if(AD_ALIAS.done)return;AD_ALIAS.done=1;const t0=performance.now();
  try{const memo=new Map(),nm0=s=>{let v=memo.get(s);if(v===undefined){v=adNorm(s);memo.set(s,v);}return v;};
    const names=new Set();for(const id in SQ_REAL){const L=SQ_REAL[id];if(Array.isArray(L))for(const r of L)if(r&&r[0])names.add(r[0]);}
    const ns=[...names];
    for(const [k,D] of [['POSD',typeof POSD!=='undefined'?POSD:null],['FOOT_DB',typeof FOOT_DB!=='undefined'?FOOT_DB:null],['HW_REAL',typeof HW_REAL!=='undefined'?HW_REAL:null],
      ['LOOKS',typeof LOOKS!=='undefined'?LOOKS:null],['CARD',typeof CARD!=='undefined'?CARD:null]])AD_ALIAS[k]=adAlias(D,ns,nm0);
    /* FotMob kayıtları kulüp + ad ile: kadrodaki yazımla birebir tutmayan adlara aynı kulüpte takma ad */
    if(typeof FMK!=='undefined'&&FMK.p){let n=0;for(const [cid,C] of Object.entries(FMK.p)){const L=SQ_REAL[cid];if(Array.isArray(L)&&C)n+=adAlias(C,L.map(r=>r[0]),nm0);}AD_ALIAS.FMK=n;}
    try{for(const k in DP_C)delete DP_C[k];}catch(e){}}catch(e){console.warn('ad eşleme',e);}AD_ALIAS.ms=Math.round(performance.now()-t0);}
fmkReady=(old=>function(){adAliasAll();return old.apply(this,arguments);})(fmkReady);
if(typeof FMK_Z==='undefined')setTimeout(adAliasAll,1500);

/* ---------- takvim yılı sezonları: "2023" (FotMob tek yıllık sezon; y = takvim yılı − 1 olarak saklanır) ---------- */
function krYL(x){return x&&x.cal?String(x.y+1):seasonLabel(x.y);}

/* ---------- üretilmiş (gerçek verisi olmayan) kadrolar: "Temsili kadro" ---------- */
function kadroTemsili(id){if(!id||!CLUBS[id])return false;const R=SQ_REAL[id];return !(Array.isArray(R)&&R.length);}
const TEMSILI_NOT='<p class="temsili-not"><b>Temsili kadro</b> · Bu kulübün gerçek kadro verisi yok; oyuncular lige uygun olarak üretildi.</p>';
squadHTML=(old=>function(id){const h=old.apply(this,arguments);try{if(h&&kadroTemsili(id))return TEMSILI_NOT+h;}catch(e){}return h;})(squadHTML);
cpHead=(old=>function(id){const h=old.apply(this,arguments);try{if(h&&kadroTemsili(id))return h.replace('<div class="pf-chs">','<div class="pf-chs"><div class="pf-ch temsili" title="Gerçek kadro verisi yok; oyuncular üretildi"><span>Kadro verisi</span><b>Temsili</b></div>');}catch(e){}return h;})(cpHead);
