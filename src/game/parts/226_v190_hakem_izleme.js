/* ================= v190: hakem — maç izleme modu öne alındı ("Maçı izle ve yönet" ana düğme, Devam da onu açar; 107'de) ve maç 3B yayın görünümüyle açılır ================= */
ACTX.ref3=(old=>function(){const r=old.apply(this,arguments);try{let n=0;const t=setInterval(()=>{n++;try{const S=typeof FX!=='undefined'?FX:null,W=ABM&&ABM.win;
      if(!S||!S.ref3||n>40){clearInterval(t);return;}
      if(W&&W.ado2d&&W.ado2d.view&&W.ado2d.sim&&W.ado2d.sim()){clearInterval(t);if(W.ado2d.view.supported())W.ado2d.view.set('bcast');}}catch(e){clearInterval(t);}},250);}catch(e){}return r;})(ACTX.ref3);
