/* ================= v131: profil özellikleri sahaya tutarlı yansır =================
   - Gerçek boyu bilinen oyuncuda Zıplama, Kafa vuruşu, Güç ve Çeviklik boy/kiloyla ilişkilendirilir (uydurma yok: tahmini boyda dokunulmaz).
   - Maç motoruna (Adoball): azami hız 'Hız'dan, kalkış 'Hızlanma' ve 'Çeviklik'ten ayrı gelir; boy hava topu erişimine ve gücüne girer;
     hızlı koşucuya ara pas daha sık atılır; top kapma tavanı yükseltildi, hücumcunun gücü topu korur; yorgunluk azami hızı belirgin düşürür. */
pAttrsX=(old=>function(p){const R=old.apply(this,arguments);try{if(!p||p.k==='ME')return R;const X=pHW(p);if(!X||X.hq||!X.h)return R;
  const dh=X.h-181,bmi=X.wq?null:X.w/((X.h/100)*(X.h/100)),cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const adj={'Zıplama':cl(dh*.9,-10,12),'Kafa vuruşu':cl(dh*.6,-8,9),'Güç':cl(dh*.3+(bmi?(bmi-23)*2.5:0),-8,10),'Çeviklik':cl(-dh*.35,-6,5),'Hava hakimiyeti':cl(dh*.5,-6,7)};
  return R.map(([g,a])=>[g,a.map(([n,v])=>adj[n]!=null?[n,Math.round(cl(v+adj[n],18,99))]:[n,v])]);}catch(e){return R;}})(pAttrsX);
