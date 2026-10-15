/* ================= v174: üst çubukta takvim — tarih kutusuna dokununca önümüzdeki 14 gün ve yaklaşan olaylar ================= */
const V174_AY=['Oca','Şub','Mar','Nis','May','Haz','Tem','Ağu','Eyl','Eki','Kas','Ara'];
function v174Gun(d){try{const t=dayType(d);return (DT[t]&&DT[t].s)||'';}catch(e){return '';}}
function v174TakvimHTML(){const td=v165Today();let E={};try{E=v165Events(td,td+13);}catch(e){}
  const gun=[];for(let i=0;i<14;i++){const d=td+i,dt=dateOf(d),ev=(E[d]||[]).filter(e=>e.k!=='bay'&&e.k!=='yas'),wd=wdOf(dt);
    const chip=ev.length?v165Chip(ev[0]):`<span class="v174-dl">${esc(v174Gun(d))}</span>`;
    gun.push(`<button class="v174-g${i===0?' bugun':''}${ev.some(e=>/^(mac|kupa|avr|nat|fifa)$/.test(e.k))?' mac':''}" data-act="v165Day" data-d="${d}"><span class="v174-dn">${TR_DAYS[wd]}</span><b>${dt.getUTCDate()}</b><small>${i===0?'bugün':V174_AY[dt.getUTCMonth()]}</small>${chip}</button>`);}
  return `<h3><svg class="v174-ic v174-ic-b" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>Önümüz</h3><p class="muted">${esc(fmtLong(dateOf(td)))} · önümüzdeki iki hafta. Bir güne dokunursan ayrıntısı açılır.</p>
    <div class="v174-serit">${gun.join('')}</div>${v165AgendaHTML()}
    <div class="offer-btns"><button class="btn" data-act="v174Tam">Tam takvim</button><button class="cta" data-act="closeModal">Kapat</button></div>`;}
ACTX.v174Takvim=()=>{if(!G||!G.s||G.phase==='tryout')return;try{openModal(v174TakvimHTML());$('#modalCard').classList.add('v174-m');}catch(e){console.warn('v174 takvim',e);}};
ACTX.v174Tam=()=>{closeModal();TAB='cal';render();window.scrollTo(0,0);};
/* üst çubuktaki tarih kutusu dokunulabilir; yanında takvim simgesi */
renderTop=(old=>function(){old.apply(this,arguments);try{if(!G||!G.s||G.phase==='tryout')return;const led=$('#top .led');if(!led)return;const box=led.parentElement;if(!box||box.dataset.act)return;
    box.dataset.act='v174Takvim';box.classList.add('v174-tarih');box.setAttribute('role','button');box.setAttribute('tabindex','0');box.title='Takvim: önümüzdeki günler';
    led.insertAdjacentHTML('afterbegin','<svg class="v174-ic" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>');}catch(e){}})(renderTop);
document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target&&e.target.classList&&e.target.classList.contains('v174-tarih')){e.preventDefault();e.stopPropagation();ACTX.v174Takvim();}},true);
