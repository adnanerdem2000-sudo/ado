/* ================= v138: sade oyuncu karşılaştırma — işlev ve pratiklik önce =================
   Tek satırlık künyeler, tek cümle özet, kısa temel tablo, mevki için kritik özellikler ve en büyük farklar; tüm özellikler kapalı bölümde.
   Çubuk grafik yok; üstün değer yalnız rengiyle, fark küçük bir etiketle gösterilir. */
cpxBody=function(a,ca,b,cb){const A=fmAttrs(a),B=fmAttrs(b),ua=cpxUnknown(a,ca),ub=cpxUnknown(b,cb),C1=CLUBS[ca],C2=CLUBS[cb],Ma=pMetaX(a),Mb=pMetaX(b),Sa=cpxStats(a,ca),Sb=cpxStats(b,cb),pa=pPot(a),pb=pPot(b);
  const pot=p=>p[0]===p[1]?ab200(p[0]):ab200(p[0])+'–'+ab200(p[1]);
  const id=(q,c,cls)=>`<div class="cx-id ${cls}"><b class="plink" data-act="pcard" data-id="${c?c.id:''}" data-k="${q.k}">${esc(q.name)}</b><small>${c?crestSVG(c,12)+' '+esc(c.short||c.name)+' · ':''}${esc(dpTag?dpTag(q):q.pos)} · ${q.age}</small></div>`;
  const W=(x,y,lo)=>x==null||y==null||x===y?[0,0]:(lo?x<y:x>y)?[1,0]:[0,1];
  const tr=(l,va,vb,x,y,lo)=>{const w=W(x,y,lo);return `<tr><td class="${w[0]?'w':''}">${va}</td><th>${l}</th><td class="${w[1]?'w':''}">${vb}</td></tr>`;};
  const ra=Sa.ap?Sa.rt/Sa.ap:0,rb=Sb.ap?Sb.rt/Sb.ap:0,ap=(Sa.ap||0)+(Sb.ap||0)>0;
  const gen=[tr('Yetenek',R200(a.ovr),R200(b.ovr),a.ovr,b.ovr),tr('Potansiyel',pot(pa),pot(pb),(pa[0]+pa[1])/2,(pb[0]+pb[1])/2),tr('Yaş',a.age,b.age,a.age,b.age,true),
    tr('Değer',eur(pValue(a)),eur(pValue(b)),pValue(a),pValue(b)),tr('Maaş/hafta',eur(pWage(a,ca)),eur(pWage(b,cb)),pWage(a,ca),pWage(b,cb),true),
    tr('Boy · ayak',`${Ma.h} · ${esc(Ma.ft)}`,`${Mb.h} · ${esc(Mb.ft)}`,null,null),
    ap?tr('Sezon (M/G/A)',`${Sa.ap||0}/${Sa.g||0}/${Sa.a||0}`,`${Sb.ap||0}/${Sb.g||0}/${Sb.a||0}`,(Sa.g||0)+(Sa.a||0),(Sb.g||0)+(Sb.a||0)):'',ap&&(ra||rb)?tr('Ort. puan',ra?ra.toFixed(2):'–',rb?rb.toFixed(2):'–',ra||null,rb||null):''].join('');
  const val=(X,n)=>{for(const g of ['T','M','P','G']){const f=(X[g]||[]).find(x=>x[0]===n);if(f)return f[1];}return null;};
  const line=(n,x,y)=>{const d=ua||ub?null:x-y,w=W(ua?null:x,ub?null:y);return `<div class="cx-r"${ATTR_DESC[n]?` data-tip="${esc(n+': '+ATTR_DESC[n])}" tabindex="0"`:''}><b class="${w[0]?'w':''}">${ua?'?':x}</b><span>${esc(n)}</span><b class="${w[1]?'w':''}">${ub?'?':y}</b><em class="${d>0?'p':d<0?'n':''}">${d==null||d===0?'=':(d>0?'+':'')+d}</em></div>`;};
  const key=(CMP_KEY[a.pos]||CMP_KEY.OS).map(n=>[n,val(A,n),val(B,n)]).filter(r=>r[1]!=null&&r[2]!=null);
  const both=A.gk&&B.gk,grp=both?[['G','Kalecilik'],['M','Zihinsel'],['P','Fiziksel']]:[['T','Teknik'],['M','Zihinsel'],['P','Fiziksel']];
  const all=[];for(const [g] of grp)for(const [n,x] of A[g]||[]){const y=val(B,n);if(y!=null&&!all.some(r=>r[0]===n))all.push([n,x,y]);}
  const keyN=new Set(key.map(r=>r[0])),big=ua||ub?[]:all.filter(r=>!keyN.has(r[0])&&Math.abs(r[1]-r[2])>=3).sort((p,q)=>Math.abs(q[1]-q[2])-Math.abs(p[1]-p[2])).slice(0,6);
  const groups=grp.map(([g,n])=>{const L=(A[g]||[]).filter(r=>val(B,r[0])!=null);return L.length?`<p class="cx-h">${n}</p>${L.map(r=>line(r[0],r[1],val(B,r[0]))).join('')}`:'';}).join('');
  const d=a.ovr-b.ovr,pd=(pa[0]+pa[1])/2-(pb[0]+pb[1])/2;
  const verdict=ua||ub?'Bir oyuncunun özellikleri tam bilinmiyor; gözlemle netleşir.':`${esc(ksur(a.name))} ${Math.abs(d)<=1?'güçte denk':d>0?'şu an daha güçlü':'şu an daha zayıf'}${Math.abs(pd)>=3?`, potansiyeli ${pd>0?'yüksek':'düşük'}`:''}${a.age!==b.age?`, ${Math.abs(a.age-b.age)} yaş ${a.age<b.age?'genç':'büyük'}`:''}.`;
  return `<div class="cx">
    <div class="cx-hd">${id(a,C1,'l')}<i>vs</i>${id(b,C2,'r')}</div>
    <p class="cx-v">${verdict}</p>
    <table class="cx-t"><tbody>${gen}</tbody></table>
    ${key.length?`<p class="cx-h">Mevki için kritik · ${esc(POS_TR[a.pos]||'')}</p>${key.map(r=>line(...r)).join('')}`:''}
    ${big.length?`<p class="cx-h">En büyük farklar</p>${big.map(r=>line(...r)).join('')}`:''}
    <details class="cx-all"><summary>Tüm özellikler</summary>${groups}</details></div>`;};
/* seçici: arama + aynı mevkideki kendi oyuncularımız (diğerleri kapalı) */
cpxPicker=function(p,cid){const mine=G&&G.club?squadOf(G.club).filter(q=>q.k!==p.k):[];const same=mine.filter(q=>q.pos===p.pos).sort((a,b)=>b.ovr-a.ovr),rest=mine.filter(q=>q.pos!==p.pos).sort((a,b)=>b.ovr-a.ovr);
  const chip=q=>`<button type="button" class="cx-c${CPX.t===q.k?' on':''}" data-act="cpxPick" data-k="${q.k}" data-id="${G.club}">${esc(ksur(q.name))} <small>${R200(q.ovr)}</small></button>`;
  return `<div class="cx-pick"><input id="cpxQ" type="search" autocomplete="off" placeholder="Oyuncu ara…" value="${esc(CPX.q||'')}"><div id="cpxRes" class="cpx-res"></div>
    ${same.length?`<div class="cx-cs">${same.map(chip).join('')}${rest.length?`<details class="cx-more"><summary>+${rest.length}</summary>${rest.map(chip).join('')}</details>`:''}</div>`:''}</div>`;};
