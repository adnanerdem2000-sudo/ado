/* ================= UTIL ================= */
const $=(s,r=document)=>r.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a);
const rint=(a,b)=>Math.floor(rnd(a,b+1));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const wpick=items=>{let t=0;for(const i of items)t+=i[1];let r=Math.random()*t;for(const [v,w] of items){if((r-=w)<=0)return v;}return items[items.length-1][0];};
const gauss=()=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const poisson=l=>{const L=Math.exp(-l);let k=0,p=1;do{k++;p*=Math.random();}while(p>L);return k-1;};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const dec=(n,d=1)=>Number(n).toFixed(d).replace('.',',');
const money=n=>{let v=Math.round(n/EUR_TL);const sg=v<0?'−':'';v=Math.abs(v);return sg+(v>=1e9?dec(v/1e9,2).replace(/,?0+$/,'')+' mr €':v>=1e6?dec(v/1e6,2).replace(/,?0+$/,'')+' mn €':v>=1e4?Math.round(v/1e3)+' bin €':v>=1e3?dec(v/1e3,1).replace(',0','')+' bin €':v+' €');};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let UID=Date.now()%1000000; const uid=()=>'i'+(UID++).toString(36);
const hash=s=>{let h=7;for(const ch of s)h=(h*31+ch.charCodeAt(0))|0;return Math.abs(h);};
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

