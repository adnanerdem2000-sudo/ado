/* ================= v172: doğrulama düzeltmeleri — milli arada kupa maçı yok, seçme ekranında ve küçük yaşta gereksiz bantlar yok ================= */
/* kupa turları FIFA milli arasına (ve iki gün çevresine) yerleşmez */
cupSlots=(old=>function(fr,used){try{if(G&&G.s&&typeof v170NtWins==='function'){const u2=new Set(used);for(const [a,b] of v170NtWins(G.s.year))for(let d=a;d<=b;d++)u2.add(d);
      const out=old.call(this,fr,u2);for(const d of out)if(d!=null)used.add(d);return out;}}catch(e){console.warn('v172 kupa takvimi',e);}return old.apply(this,arguments);})(cupSlots);
/* seçme günü: ana sayfa düzenleme düğmesi ve transfer bandı yok; 16 yaş altı futbolcuya transfer dönemi bandı gösterilmez */
render=(old=>function(){const r=old.apply(this,arguments);try{if(G&&TAB==='hub'){const v=$('#view');if(v){const kucuk=G.phase==='tryout'||(typeof isPl==='function'&&isPl()&&G.p&&G.p.age<16);
      if(G.phase==='tryout')v.querySelectorAll('.hub-cust').forEach(x=>x.remove());
      if(kucuk)v.querySelectorAll('.tw-bar,.tw-pill').forEach(x=>{const bar=x.closest('.tw-bar')||x;bar.remove();});}}}catch(e){}return r;})(render);
