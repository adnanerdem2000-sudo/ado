/* ================= v130: klavye kısayolları — Space: gün atla (Devam) · Esc: açık ekranı kapat / geri dön =================
   - Space, az önce tıklanan bir düğmede odak kalsa da Devam'a basar (düğmeyi ikinci kez tetiklemez). Yazı alanlarında çalışmaz.
   - Esc sırasıyla: açık pencere → tam ekran katmanın kapat düğmesi → kariyer sihirbazında bir önceki adım → bir önceki sekme.
   - Maç, kumarhane, muayene odası gibi kendi tuşları olan ekranlar kendi davranışlarını korur. */
function kbTyping(e){const t=e.target;return !!(t&&(/INPUT|TEXTAREA|SELECT/.test(t.tagName)||t.isContentEditable));}
function kbBusy(){try{if(FX&&$('#fx')&&!$('#fx').hidden)return true;}catch(e){}try{const c=document.getElementById('cz');if(c&&!c.hidden)return true;}catch(e){}try{if(typeof DRO!=='undefined'&&DRO.on)return true;}catch(e){}try{if(MG&&MG.S&&!$('#mvStage').hidden)return true;}catch(e){}return false;}
const kbVis=el=>!!(el&&el.offsetParent!==null&&getComputedStyle(el).visibility!=='hidden');
function kbOverlayClose(){/* modal dışındaki tam ekran katmanlar: görünür "Kapat" düğmesi */
  const c=[...document.querySelectorAll('body > div, body > section')].filter(d=>d.id!=='modal'&&d.id!=='app'&&d.id!=='start'&&d.id!=='toast'&&kbVis(d)&&getComputedStyle(d).position==='fixed');
  for(const d of c.reverse()){const b=d.querySelector('[aria-label="Kapat"],[data-act="closeModal"],.x-close,.close,[data-x="close"]');if(b&&kbVis(b)){b.click();return true;}}
  return false;}
document.addEventListener('keydown',e=>{
  if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||kbTyping(e))return;
  if(e.key===' '||e.code==='Space'){
    if(!G||kbBusy()||!$('#modal').hidden||!$('#start').hidden)return;
    e.preventDefault();e.stopPropagation();if(e.repeat)return;try{if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();}catch(_){}
    try{fmCont();}catch(err){console.warn(err);}return;}
  if(e.key==='Escape'){
    if(kbBusy())return;
    if(!$('#modal').hidden)return; /* modal: eski dinleyici kapatıyor */
    if(kbOverlayClose()){e.preventDefault();return;}
    if(!$('#start').hidden&&typeof W!=='undefined'){const back={kim:'prof',prof:'list'}[W.step];if(back){W.step=back;W.del=null;showStart();e.preventDefault();}return;}
    if(G&&typeof NAVH!=='undefined'&&NAVH.back.length){ACTX.navBack();e.preventDefault();return;}
    if(G&&TAB!=='hub'){TAB='hub';render();window.scrollTo(0,0);e.preventDefault();}}
},true);
