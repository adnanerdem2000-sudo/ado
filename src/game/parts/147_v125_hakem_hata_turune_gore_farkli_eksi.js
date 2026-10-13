/* ================= v125: hakem — hata türüne göre farklı eksi puan; maç sonu raporunda her hatanın puanı =================
   Ağırlıklar (maç notundan düşülen): hatalı gol kararı 1,2 · penaltı 1,0 · kırmızı kart (DOGSO, şiddet, haksız kırmızı) 0,9 · ikinci sarı 0,8 ·
   gol öncesi faul / dirsek 0,7 · elle oynama 0,6 · sarı kart 0,5 · simülasyon 0,35 · serbest vuruş/faul 0,25–0,3 · itiraz/avantaj 0,2 · taç/aut 0,12.
   Küçük hata (doğru tarafa yakın karar) yarı, orta hata %80 sayılır. VAR uyarısına rağmen yanlışta ısrar %15 daha ağır. */
const REF_PEN={gol:1.2,ofs:1.2,pen:1.0,kirmizi:0.9,dogso:0.9,siddet:0.9,ikisari:0.8,oncesi:0.7,dirsek:0.7,el:0.6,sari:0.5,kart:0.5,sim:0.35,serbest:0.3,faul:0.25,itiraz:0.2,avantaj:0.2,zaman:0.2,out:0.12};
const REF_PEN_N={gol:'hatalı gol kararı',ofs:'hatalı ofsayt/gol kararı',pen:'hatalı penaltı kararı',kirmizi:'kırmızı kart hatası',dogso:'gol şansını engelleme (kırmızı) hatası',siddet:'şiddet hareketi kaçtı',ikisari:'ikinci sarı hatası',oncesi:'gol öncesi faul kaçtı',dirsek:'dirsek/hava topu hatası',el:'elle oynama hatası',sari:'sarı kart hatası',kart:'kart hatası',sim:'simülasyon hatası',serbest:'kart/faul hatası',faul:'faul kararı hatası',itiraz:'itiraz yönetimi',avantaj:'avantaj hatası',zaman:'zaman geçirme',out:'taç/aut hatası'};
Object.assign(REF_TN,{gol:'Gol pozisyonu',sim:'Simülasyon şüphesi',faul:'Faul',serbest:'Kart kararı',out:'Taç / aut',kirmizi:'Kırmızı kart pozisyonu',sari:'Sarı kart pozisyonu'});
function refPen(k,lvl){let p=REF_PEN[k]!=null?REF_PEN[k]:0.3;if(lvl==='minor')p*=k==='gol'||k==='ofs'?0.25:0.5;else if(lvl==='mid')p*=0.8;return Math.round(p*100)/100;}
const fmtPen=x=>'−'+(Math.round(Math.abs(x)*100)/100).toLocaleString('tr-TR',{minimumFractionDigits:1,maximumFractionDigits:2});
/* 3B: pozisyon kararları */
abrFinish=(old=>function(A,D,J,viaVar){const R=REF;if(!R||!A||A.kind==='out'||!J||J.lvl==='ok')return old.apply(this,arguments);
  const rt0=R.rt,n0=R.log.length;const r=old.apply(this,arguments);
  try{let k=abrType(A);if(A.kind!=='goal'&&(k==='kart'||k==='faul')){const tc=A.truth.card,dc=D.card;k=(tc==='R'||dc==='R')?'kirmizi':(tc==='Y'||dc==='Y')?'sari':k;}
    const pen=refPen(k,J.lvl)*(viaVar?1.15:1);R.rt=rt0-pen;
    for(let i=n0;i<R.log.length;i++){const e=R.log[i];if(e&&e[2]==='hatalı'){e[3]=-pen;e[4]=REF_PEN_N[k]||'';e[1]=e[1]||k;break;}}
    abToast(`✖ ${REF_PEN_N[k]||'hatalı karar'}: ${fmtPen(pen)} puan`);}catch(e){console.warn('refPen',e);}return r;})(abrFinish);
/* 3B: oyun içi kart (serbest kart) kararları */
abrCardDo=(old=>function(){const R=REF,C=ABR.cs;const rt0=R?R.rt:0,n0=R?R.log.length:0;const r=old.apply(this,arguments);
  try{if(R&&R.log.length>n0){const e=R.log[R.log.length-1];if(e&&e[2]==='hatalı'){const k=C&&C.kind==='R'?'kirmizi':C&&C.kind==='Y'?'sari':'serbest';const lvl=C&&C.kind==='none'?'mid':'big';const pen=refPen(k,lvl);R.rt=rt0-pen;e[3]=-pen;e[4]=C&&C.kind==='none'?'gereken kart verilmedi':REF_PEN_N[k];abToast(`✖ ${e[4]}: ${fmtPen(pen)} puan`);}}}catch(e){}return r;})(abrCardDo);
/* 2B / hızlı hakem modu */
refScore=(old=>function(I,ok,viaVar){const R=REF,rt0=R?R.rt:0,n0=R?R.log.length:0;const r=old.apply(this,arguments);
  try{if(R&&!ok&&R.log.length>n0){const k=I.t==='kart'?'sari':I.t;const pen=refPen(k,'big')*(viaVar?1.15:1);R.rt=rt0-pen;const e=R.log[R.log.length-1];e[3]=-pen;e[4]=REF_PEN_N[k]||'';}}catch(e){}return r;})(refScore);
/* maç sonu raporu: her hatanın eksi puanı ve toplamlar */
refAfter=(old=>function(info){const r=old.apply(this,arguments);try{if(!info||!info.log)return r;const mc=$('#modalCard'),ul=mc&&mc.querySelector('.refm ul.notes');if(!ul)return r;
  let neg=0,pos=0,nb=0;const rows=info.log.map(e=>{const [m,t,res,d,why]=e;const bad=res==='hatalı';let dd=d;if(bad&&dd==null)dd=-(REF_PEN[t]!=null?REF_PEN[t]:0.3);if(bad){neg+=dd;nb++;}else if(/doğru/.test(res)&&!/\//.test(res))pos+=/VAR/.test(res)?-0.1:0.12;
    return `<li class="${bad?'rf-bad':''}">${m}’ ${esc(REF_TN[t]||'Pozisyon')}: <b class="${bad?'neg':'pos'}">${esc(res)}${bad?` <em class="rf-pen">${fmtPen(dd)}</em>`:''}</b>${bad&&why?`<small class="rf-why">${esc(why)}</small>`:''}</li>`;}).join('');
  ul.innerHTML=rows;ul.insertAdjacentHTML('afterend',`<p class="rf-sum">${nb} hata, toplam <b class="neg">${fmtPen(neg)}</b> puan${pos>0?` · doğru kararlar <b class="pos">+${(Math.round(pos*100)/100).toLocaleString('tr-TR')}</b>`:''}. Gol, penaltı ve kırmızı kart hataları en ağır cezayı alır.</p>`);}catch(e){console.warn('refAfter',e);}return r;})(refAfter);

