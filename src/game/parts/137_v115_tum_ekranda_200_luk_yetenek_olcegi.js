/* ================= v115: tüm ekranda 200'lük yetenek ölçeği =================
   Oyunun iç hesapları 100'lük ölçekte kalır; ekrandaki her güç, potansiyel ve takım gücü Football Manager gibi 200 üzerinden gösterilir (s200.py şablonları R2 ile sarar). */
function R200(v){if(typeof v==='number'&&isFinite(v))return ab200(v);if(typeof v==='string'){const m=/^(\d{1,3})\s*([-–])\s*(\d{1,3})$/.exec(v.trim());if(m)return `${ab200(+m[1])}${m[2]}${ab200(+m[3])}`;if(/^\d{1,3}(\.\d+)?$/.test(v.trim()))return String(ab200(Math.round(+v)));}return v;}
potTxt=(old=>function(lo,hi){return old(ab200(lo),ab200(hi));})(potTxt);
progData=(old=>function(p){const D=old.apply(this,arguments);try{return Object.assign({},D,{pts:D.pts.map(x=>[x[0],ab200(x[1])].concat(x.slice(2))),pot:ab200(D.pot)});}catch(e){return D;}})(progData);
/* potansiyel aralığı mevcut yeteneğin altına inmesin */
pPot=(old=>function(p){const r=old.apply(this,arguments);try{if(Array.isArray(r)&&p&&typeof p.ovr==='number'){const lo=Math.max(r[0],p.ovr),hi=Math.max(r[1],lo);return [lo,hi];}}catch(e){}return r;})(pPot);

