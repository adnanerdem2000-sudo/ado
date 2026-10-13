/* ================= v93: gelen kutusu kaydırma koruması ================= */
/* mesaja basınca liste ve sayfa olduğu yerde kalır */
function keepScroll(fn){const sel=['.ib-list','#view','#main','.inbox','#app','#tabs'];const pos={};for(const s of sel){const e=document.querySelector(s);if(e)pos[s]=e.scrollTop;}
  const wy=window.scrollY,se=document.scrollingElement,sy=se?se.scrollTop:0;fn();
  const restore=()=>{for(const s in pos){const e=document.querySelector(s);if(e)e.scrollTop=pos[s];}if(se)se.scrollTop=sy;window.scrollTo(0,wy);};restore();requestAnimationFrame(restore);}
ACTX.ibSel=(old=>function(el){keepScroll(()=>old(el));const r=$('.ib-read');if(r)r.scrollTop=0;})(ACTX.ibSel);
ACTX.readmsg=el=>{keepScroll(()=>{const m=G.inbox.find(x=>x.id===el.dataset.id);if(m){m.read=true;m.open=!m.open;save();render();}});
  try{const b=document.querySelector(`[data-act=readmsg][data-id="${el.dataset.id}"]`);if(b){const r=b.getBoundingClientRect();if(r.top<0||r.top>innerHeight-80)b.scrollIntoView({block:'nearest'});}}catch(e){}};

