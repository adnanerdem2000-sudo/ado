/* ================= v119: yardımcı hakemler daha az isabetli — maç başına %40–62 doğruluk (5 karardan 2–3'ü doğru) ================= */
let ARACC={key:null,v:.5};
function arRate(){const k=(FX&&FX.id)||(ABM&&ABM.sim&&ABM.sim.seed)||(G&&G.s?G.s.day:0);if(ARACC.key!==k){ARACC.key=k;ARACC.v=.4+Math.random()*.22;}return ARACC.v;}
abrAccuracy=(old=>function(A,who){const a=old.apply(this,arguments);if(who==='var')return a;try{const adj=A&&A.kind==='out'?.06:A&&A.kind==='offs'&&A.mo!=null&&Math.abs(A.mo)<.25?-.06:0;return clamp(arRate()+adj+(typeof refComms==='function'&&refComms()?.05:0),.3,.68);}catch(e){return a;}})(abrAccuracy);

