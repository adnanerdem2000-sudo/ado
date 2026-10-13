(function(){let n=0;for(const [id,L] of Object.entries(SQ_ADD)){const S=SQ_REAL[id];if(!S||!CLUBS[id])continue;const have=new Set(S.map(r=>r[0]));for(const r of L){if(have.has(r[0]))continue;S.push(r.slice(0,5));(S.nums=S.nums||{})[S.length-1]=r[5]||0;have.add(r[0]);n++;}}
  try{for(const k in SQC)delete SQC[k];}catch(e){}try{for(const k in SLC)delete SLC[k];}catch(e){}SQ_ADD.n=n;})();
/* forma numaraları: gerçek numara boştaysa onu, değilse boş bir numara */
baseSquad=(old=>function(id){const had=!!SQC[id];const r=old.apply(this,arguments);if(!had&&r&&r.length>16){const raw=SQ_REAL[id],used=new Set(r.slice(0,16).map(p=>p.num));
  const free=[];for(let i=16;i<r.length;i++){const want=raw&&raw.nums&&raw.nums[i];if(want&&!used.has(want)){r[i].num=want;used.add(want);}else free.push(i);}
  for(const i of free){let n=13;while(used.has(n))n++;if(n>99)n=i+20;r[i].num=n;used.add(n);}}return r;})(baseSquad);

