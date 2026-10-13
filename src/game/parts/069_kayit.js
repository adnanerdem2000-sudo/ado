/* ======== kayıt ======== */
Object.assign(XV,{yrp:()=>viewYrPlan(),scl:()=>viewScLive(),disc:()=>viewDisc(),w50:()=>viewW50(),drt:()=>viewDrTeam()});
XICON.yrp=NI('<path d="M4 20V10M10 20V4M16 20v-7"/><circle cx="19" cy="6" r="2.5"/>');XICON.scl=NI('<circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/>');XICON.disc=NI('<path d="M12 3l2.6 5.6L20 9.3l-4 4 1 5.7-5-2.8-5 2.8 1-5.7-4-4 5.4-.7z"/>');XICON.w50=NI('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/>');XICON.drt=NI('<path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z"/>');
for(const k of ['yrp','scl','disc','w50','drt'])NICON[k]=XICON[k];
const ST_PAGES={yrd:[['yrp','Antrenman ve gelişim']],scout:[['scl','Canlı maç ve ekip'],['disc','Keşiflerim'],['w50','Geleceğin 50 yıldızı']],dr:[['drt','Sağlık ekibi']]};
xtabs=(old=>function(){const L=old.apply(this,arguments);try{if(G&&G.phase!=='tryout'&&isStaff()&&G.s&&G.job&&ST_PAGES[G.staff]&&G.club)L.push(...ST_PAGES[G.staff]);}catch(e){}return L;})(xtabs);
navCats=(old=>function(){const C=old.apply(this,arguments);try{if(isStaff()&&ST_PAGES[G.staff]){const k=C.find(x=>x[0]==='Kulüp'),xs=xtabs().map(x=>x[0]);if(k)for(const [t,l] of ST_PAGES[G.staff])if(xs.includes(t))k[1].push([t,l,{tab:t}]);}}catch(e){}return C;})(navCats);
staffSeasonEnd=(old=>function(){const j=stG();try{if(G.staff==='scout'&&j.disc){let n=0;for(const [k,d] of Object.entries(j.disc)){const p=pByKey(k);if(p&&p.ovr-d.o>=4&&!d.bon){d.bon=1;n++;}}if(n){j.rep=clamp(j.rep+Math.min(8,n*2),0,100);msg('scout','Keşiflerin parlıyor',`Takip ettiğin ${n} oyuncu bu sezon büyük gelişim gösterdi. Sektörde adın duyuluyor.`);}}
  if(G.staff==='yrd')j.int=null;}catch(e){console.warn(e);}return old.apply(this,arguments);})(staffSeasonEnd);

