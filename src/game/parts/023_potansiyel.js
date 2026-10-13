/* ================= potansiyel ================= */
function potOf(p){const r=srng(p.k+'pt');let o=p.ovr0;for(let a=p.age0;a<28;a++)o+=a<21?2.2:a<24?1.2:0.3;const cur=ageP(p).ovr;return Math.max(cur,Math.round(clamp(o+r()*6-2,30,97)));}
function potRange(pt,age,seed,known){if(age>=30)return [pt,pt];const r=srng(seed+'pr'),w=known?1:age<=19?4:age<=23?3:2,off=Math.floor(r()*(w+1));return [pt-off,pt-off+w];}
function potTxt(lo,hi){return lo===hi?`${lo}`:`${lo}-${hi}`;}
function pPot(p){if(isStaff()&&G.staff==='scout')return scKnowRange(p);const known=!!(G&&G.m&&G.m.sc&&G.m.sc[p.k]);return potRange(potOf(p),p.age,p.k,known);}
function myPot(){const pt=Math.max(OVR(),OVR(G.p.pot));return potRange(pt,G.p.age,(G.cid||'c')+G.p.age,false);}

