/* ================= v181: genel ses ayarı (%0–100) — oyundaki tüm sesler (maç sesi, tören, anlar, Adoball/3B) tek bir ana ses düzeyinden geçer; locadan izlerken görüşü kapatan direkler kaldırıldı (201) ================= */
function sesYuzde(){const v=setsGet().vol;return v==null||isNaN(+v)?100:clamp(Math.round(+v),0,100);}
const SESV={gain:[],media:[]};
function sesCarpan(){return Math.pow(sesYuzde()/100,1.6);}/* kulağa doğrusal gelsin diye hafif eğri */
/* bir pencerenin ses API'lerini ana ses düzeyine bağla: AudioContext.destination ana kazanç düğümüne, medya öğelerinin volume'u çarpana */
function adoSesYama(win){try{if(!win||win.__adoSes)return;win.__adoSes=1;
    const B=win.BaseAudioContext||win.AudioContext||win.webkitAudioContext;const P=B&&B.prototype;const d=P&&(Object.getOwnPropertyDescriptor(P,'destination')||(win.AudioContext&&Object.getOwnPropertyDescriptor(win.AudioContext.prototype,'destination')));
    if(d&&d.get){const og=d.get;Object.defineProperty(P,'destination',{configurable:true,enumerable:true,get(){if(this.__adoMg)return this.__adoMg;const real=og.call(this);try{const g=this.createGain();g.gain.value=sesCarpan();g.connect(real);
          /* createGain().connect(destination) gibi zincirlerde ana düğüm de AudioDestinationNode gibi davranır */
          try{Object.defineProperty(g,'maxChannelCount',{get(){return real.maxChannelCount;}});}catch(e){}
          this.__adoMg=g;SESV.gain.push(new WeakRef(g));return g;}catch(e){return real;}}});}
    const M=win.HTMLMediaElement&&win.HTMLMediaElement.prototype,vd=M&&Object.getOwnPropertyDescriptor(M,'volume');
    if(vd&&vd.set){Object.defineProperty(M,'volume',{configurable:true,enumerable:true,get(){return this.__adoBv!=null?this.__adoBv:vd.get.call(this);},
        set(v){this.__adoBv=+v;try{vd.set.call(this,clamp(+v*sesCarpan(),0,1));}catch(e){}}});
      const op=M.play;M.play=function(){try{if(!this.__adoKayit){this.__adoKayit=1;this.__adoVs=vd.set;SESV.media.push(new WeakRef(this));}const b=this.__adoBv!=null?this.__adoBv:vd.get.call(this);this.__adoBv=b;vd.set.call(this,clamp(b*sesCarpan(),0,1));}catch(e){}return op.apply(this,arguments);};
    }}catch(e){console.warn('ses ayarı',e);}}
function sesUygula(){const k=sesCarpan();
  SESV.gain=SESV.gain.filter(r=>{const g=r.deref();if(!g)return false;try{g.gain.setTargetAtTime(k,g.context.currentTime,0.03);}catch(e){try{g.gain.value=k;}catch(x){}}return true;});
  SESV.media=SESV.media.filter(r=>{const m=r.deref();if(!m)return false;try{const b=m.__adoBv!=null?m.__adoBv:1;m.__adoVs.call(m,clamp(b*k,0,1));}catch(e){}return true;});}
adoSesYama(window);
/* Ayarlar: Ses bölümü (Görünüm'den önce) */
function sesAyarHTML(){const v=sesYuzde();return `<p class="sub-h v181-h"><span>Ses</span><span id="sesYz">${v===0?'Kapalı':'%'+v}</span></p>
  <div class="ses-set"><span class="ses-ic" aria-hidden="true">${v===0?'🔇':v<40?'🔈':v<75?'🔉':'🔊'}</span><input type="range" id="sesVol" min="0" max="100" step="5" value="${v}" aria-label="Genel ses düzeyi"><div class="ses-hz">${[0,25,50,75,100].map(x=>`<button type="button" class="chip" data-act="sesHz" data-v="${x}" aria-pressed="${v===x}">${x?'%'+x:'Kapalı'}</button>`).join('')}</div></div>`;}
openSettings=(old=>function(){const r=old.apply(this,arguments);try{const mc=$('#modalCard');if(!mc||mc.querySelector('.ses-set'))return r;
    const gh=[...mc.querySelectorAll(':scope > p.sub-h')].find(p=>/Görünüm/i.test(p.textContent));const h=sesAyarHTML();
    if(gh)gh.insertAdjacentHTML('beforebegin',h);else{const ob=mc.querySelector(':scope > .offer-btns');if(ob)ob.insertAdjacentHTML('beforebegin',h);else mc.insertAdjacentHTML('beforeend',h);}}catch(e){console.warn('ses ayar',e);}return r;})(openSettings);
function sesKaydet(v){const s=setsGet();s.vol=clamp(Math.round(+v||0),0,100);setsPut(s);sesUygula();const y=$('#sesYz');if(y)y.textContent=s.vol===0?'Kapalı':'%'+s.vol;
  const ic=document.querySelector('.ses-set .ses-ic');if(ic)ic.textContent=s.vol===0?'🔇':s.vol<40?'🔈':s.vol<75?'🔉':'🔊';
  document.querySelectorAll('.ses-set [data-act=sesHz]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.v===s.vol)));const rg=$('#sesVol');if(rg&&+rg.value!==s.vol)rg.value=s.vol;}
document.addEventListener('input',e=>{if(e.target&&e.target.id==='sesVol')sesKaydet(e.target.value);});
ACTX.sesHz=el=>sesKaydet(el.dataset.v);
