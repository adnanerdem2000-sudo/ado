/* ================= v189: Haberler sayfası gazete gibi — günlük sayı, manşet, sütunlar, puan durumu ve sonuç kutuları, okur köşesi; önceki/sonraki sayı ================= */
let GZ_OFF=0;   /* 0 = en yeni sayı; arttıkça eski sayılar */
const GZ_AD='KARİYER SPOR';
/* haber metni "Başlık. Gövde" biçiminde: ilk cümle başlık olur */
function gzBol(txt){const s=String(txt||'').trim();const m=/^(.{12,140}?[^0-9 ][.!?])\s+(?=[A-ZÇĞİÖŞÜ"“0-9])(.+)$/su.exec(s);return m?[m[1].replace(/[.]$/,''),m[2]]:[s.length>110?s.slice(0,107)+'…':s,s.length>110?s:''];}
/* sayılar: haber akışındaki günler (yeniden eskiye) */
function gzGunler(){const S=new Map();for(const x of G.feed||[]){const k=(x.y||0)*1000+(x.d||0);if(!S.has(k))S.set(k,{y:x.y,d:x.d,L:[]});S.get(k).L.push(x);}
  return [...S.values()].sort((a,b)=>(b.y*1000+b.d)-(a.y*1000+a.d));}
function gzTarih(y,d){try{return fmtLong(dateOf(d,y));}catch(e){return '';}}
/* o günün ligdeki maçımız (manşet adayı) */
function gzMacimiz(y,d){try{const S=G.s;if(!S||S.year!==y||!G.club||!S.cal)return null;let w=-1;for(const k of [d,d-1,d-2]){w=S.cal.indexOf(k);if(w>=0)break;}if(w<0||!S.results[w])return null;const r=S.results[w].find(m=>m[0]===G.club||m[1]===G.club);return r?{r,w}:null;}catch(e){return null;}}
function gzManset(M){const [h,a,hg,ag]=M.r,us=h===G.club,me=CLUBS[G.club],op=CLUBS[us?a:h],g=us?hg:ag,o=us?ag:hg;
  const baslik=g>o?(g-o>=3?`${me.short} ${op.short} karşısında gol yağdırdı`:`${me.short} 3 puanı kaptı`):g===o?`${me.short} ile ${op.short} yenişemedi`:(us?`${me.short} kendi evinde kayıp: ${op.short} 3 puanla döndü`:`${me.short} deplasmandan puansız döndü`);let sira='';try{sira=`Ligde ${tablePos()}. sırada.`;}catch(e){}
  return `<section class="gz-manset"><div class="gz-skor">${crestSVG(CLUBS[h],64)}<b>${hg}</b><i>–</i><b>${ag}</b>${crestSVG(CLUBS[a],64)}</div>
    <h1>${esc(baslik)}</h1><p class="gz-spot">${esc(CLUBS[h].name)} ${hg}-${ag} ${esc(CLUBS[a].name)} · ${esc(LEAGUES[G.s.league]?LEAGUES[G.s.league].name:'')} ${M.w+1}. hafta. ${esc(sira)}</p></section>`;}
function gzMakale(x,buyuk){const [b,g]=gzBol(x.txt);const et=x.rum?'<span class="gz-et kul">KULİS</span>':x.cat==='tr'?'<span class="gz-et tr">TRANSFER</span>':x.cat==='fan'?'':'<span class="gz-et gn">GÜNDEM</span>';
  return `<article class="gz-mk${buyuk?' b':''}">${et}<h3>${esc(b)}</h3>${g?`<p>${esc(g)}</p>`:''}<small>${esc(x.src||'')}</small></article>`;}
function gzOkur(x){return `<blockquote class="gz-okur"><p>“${esc(x.txt)}”</p><cite>${esc(x.src||'')} ${esc(x.h||'')}</cite></blockquote>`;}
function gzPuan(){try{const S=G.s;if(!S||!S.results||!S.results.length)return '';const tb=table(),i=tb.findIndex(r=>r.id===G.club);const rows=tb.slice(0,6);if(i>=6)rows.push(tb[i]);
    return `<aside class="gz-kutu"><h4>Puan durumu</h4><table>${rows.map(r=>`<tr class="${r.id===G.club?'me':''}"><td>${tb.indexOf(r)+1}</td><td class="l">${esc(CLUBS[r.id].short)}</td><td>${r.o}</td><td><b>${r.p}</b></td></tr>`).join('')}</table></aside>`;}catch(e){return '';}}
function gzSonuclar(){try{const S=G.s,R=S&&S.results;if(!R||!R.length)return '';const rd=R[R.length-1];
    return `<aside class="gz-kutu"><h4>${R.length}. haftanın sonuçları</h4><ul>${rd.map(([h,a,x,y])=>`<li class="${h===G.club||a===G.club?'me':''}"><span>${esc(CLUBS[h].short)}</span><b>${x}-${y}</b><span>${esc(CLUBS[a].short)}</span></li>`).join('')}</ul></aside>`;}catch(e){return '';}}
function gzKrallik(){try{const L=leaders('g').filter(x=>x.v>0).slice(0,5);if(!L.length)return '';
    return `<aside class="gz-kutu"><h4>Gol krallığı</h4><ol>${L.map(x=>`<li><span>${esc(x.n)}</span><small>${esc(CLUBS[x.c]?CLUBS[x.c].short:'')}</small><b>${x.v}</b></li>`).join('')}</ol></aside>`;}catch(e){return '';}}
viewNews=function(){const gunler=gzGunler();GZ_OFF=clamp(GZ_OFF,0,Math.max(0,gunler.length-1));
  const chips=`<div class="filt gz-filt">${[['all','Gazete'],['tr','Transfer ve söylenti'],['gen','Gündem'],['fan','Okur köşesi']].map(([k,l])=>`<button class="chip" data-act="feedF" data-k="${k}" aria-pressed="${FEEDF===k}">${l}</button>`).join('')}</div>`;
  if(!gunler.length)return `<h2 class="h">Haberler</h2>${chips}<div class="gz"><header class="gz-bas"><h2>${GZ_AD}</h2></header><p class="gz-bos">Gazete ilk sayısını maçlar oynanıp transferler başladığında çıkaracak.</p></div>`;
  /* filtreli görünüm: o türün tüm haberleri gazete sütunlarında */
  if(FEEDF!=='all'){const F=(G.feed||[]).filter(x=>x.cat===FEEDF);
    return `<h2 class="h">Haberler</h2>${chips}<div class="gz"><header class="gz-bas"><h2>${GZ_AD}</h2><p>${FEEDF==='tr'?'Transfer eki':FEEDF==='fan'?'Okur köşesi':'Gündem eki'} · ${F.length} haber</p></header>
      <div class="gz-sut">${FEEDF==='fan'?F.map(gzOkur).join(''):F.map(x=>`<div class="gz-tarihli"><time>${esc(twD(x.d))}</time>${gzMakale(x)}</div>`).join('')}</div></div>`;}
  const G0=gunler[GZ_OFF],L=G0.L,haber=L.filter(x=>x.cat!=='fan'),okur=L.filter(x=>x.cat==='fan');
  const M=gzMacimiz(G0.y,G0.d);let ust='',kalan=haber;
  if(M)ust=gzManset(M);else if(haber.length){const [b,g]=gzBol(haber[0].txt);ust=`<section class="gz-manset yazi"><h1>${esc(b)}</h1>${g?`<p class="gz-spot">${esc(g)}</p>`:''}</section>`;kalan=haber.slice(1);}
  const sayi=gunler.length-GZ_OFF;
  const nav=`<nav class="gz-nav"><button class="btn sm" data-act="gzSayi" data-d="1" ${GZ_OFF>=gunler.length-1?'disabled':''}>‹ Önceki sayı</button><span>Sayı ${sayi} / ${gunler.length}</span><button class="btn sm" data-act="gzSayi" data-d="-1" ${GZ_OFF<=0?'disabled':''}>Sonraki sayı ›</button></nav>`;
  return `<h2 class="h">Haberler</h2>${chips}${nav}<div class="gz">
    <header class="gz-bas"><p class="gz-ust"><span>${esc(gzTarih(G0.y,G0.d))}</span><span>Sayı ${sayi}</span><span>Günlük spor gazetesi</span></p><h2>${GZ_AD}</h2></header>
    ${ust}
    <div class="gz-govde"><div class="gz-sut">${kalan.length?kalan.map((x,i)=>gzMakale(x,i===0&&!M)).join(''):'<p class="gz-bos">Bugün başka haber yok.</p>'}</div>
      <div class="gz-yan">${gzPuan()}${gzSonuclar()}${gzKrallik()}</div></div>
    ${okur.length?`<section class="gz-okurlar"><h4>Okur köşesi</h4>${okur.map(gzOkur).join('')}</section>`:''}
  </div>${nav}`;};
ACTX.gzSayi=el=>{GZ_OFF+= +el.dataset.d||0;render();window.scrollTo(0,0);};
ACTX.feedF=el=>{FEEDF=el.dataset.k;GZ_OFF=0;render();};
