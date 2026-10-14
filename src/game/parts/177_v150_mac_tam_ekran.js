/* ================= v150: 3B/2B maç ekranında tam ekran ================= */
/* Maç motoru iç çerçevede (srcdoc) çalışır; oyun da çoğu zaman başka bir sayfanın içinde (yayın çerçevesi) açılır.
   İç çerçevenin tam ekran izni olmayınca düğme işe yaramıyordu. Artık iç çerçeve tam ekranı buraya sorar:
   maç katmanı (#fx) pencerenin tamamını kaplar ve belge gerçek tam ekrana alınmaya çalışılır; izin yoksa katman yine
   pencereyi doldurur. Esc ya da tarayıcıdan çıkılırsa iki taraf birlikte normale döner. */
const ABFS={on:false,real:false};
function abHostFS(on){
  const fx=$('#fx');on=!!on;ABFS.on=on;
  if(fx)fx.classList.toggle('ab-hostfs',on);
  document.body.classList.toggle('ab-hostfs-on',on);
  if(on){
    try{const d=document.documentElement;if(document.fullscreenEnabled&&d.requestFullscreen&&!document.fullscreenElement){ABFS.real=true;d.requestFullscreen({navigationUI:'hide'}).catch(()=>{ABFS.real=false;});}}catch(_){ABFS.real=false;}
  }else{
    try{if(ABFS.real&&document.fullscreenElement)document.exitFullscreen().catch(()=>{});}catch(_){}
    ABFS.real=false;
  }
  setTimeout(()=>{try{window.dispatchEvent(new Event('resize'));const w=$('#abIf')&&$('#abIf').contentWindow;if(w)w.dispatchEvent(new Event('resize'));}catch(_){}} ,80);
}
window.abHostFS=abHostFS;
document.addEventListener('fullscreenchange',()=>{
  if(ABFS.on&&ABFS.real&&!document.fullscreenElement){ /* kullanıcı Esc ile çıktı */
    ABFS.real=false;abHostFS(false);
    try{const w=$('#abIf')&&$('#abIf').contentWindow;if(w&&w.abFsOff)w.abFsOff();}catch(_){}
  }
});
/* maç katmanı kapanınca tam ekran kalmasın */
setInterval(()=>{try{if(ABFS.on){const fx=$('#fx');if(!fx||fx.hidden||!fx.classList.contains('abm'))abHostFS(false);}}catch(_){}} ,1000);
