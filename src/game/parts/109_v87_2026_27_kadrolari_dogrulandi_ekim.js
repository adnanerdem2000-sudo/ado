(function(){if(typeof SQ_FIX==='undefined')return;/* v151: SQ_FIX derlemeden çıktı; gerçek numaralar SQ_RL'de (178_v151 .shirt dizisini kurar) */for(const [id,L] of Object.entries(SQ_FIX)){if(!CLUBS[id]||!L||!L.length)continue;SQ_REAL[id]=L.map(r=>r.slice(0,5));SQ_REAL[id].shirt=L.map(r=>r[5]||0);}
  try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}})();
/* forma numaraları: kaynaktaki gerçek numara (çakışmasız), yoksa boş numara */
baseSquad=(old=>function(id){const had=!!SQC[id];const r=old.apply(this,arguments);try{const raw=SQ_REAL[id];if(!had&&r&&raw&&raw.shirt){const used=new Set(),free=[];
  for(let i=0;i<r.length;i++){const w=raw.shirt[i];if(w&&!used.has(w)){r[i].num=w;used.add(w);}else free.push(i);}
  for(const i of free){let n=r[i].num;if(!n||used.has(n)){n=13;while(used.has(n))n++;if(n>99)n=i+20;}r[i].num=n;used.add(n);}}}catch(e){}return r;})(baseSquad);

