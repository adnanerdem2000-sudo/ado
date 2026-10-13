/* ================= v12: kimlik, kayıt yuvaları, ayarlar, yaşam ================= */
const DEF_LOOK={sk:'#a8704a',hc:'#140d09',hs:'curly',bd:null,fw:19,ey:'#1a120c',cenk:true};
const PL=()=>(G&&G.p&&G.p.look)||DEF_LOOK;
const PN=()=>(G&&G.p&&G.p.name)||'Oyuncu';
const PF=()=>PN().split(' ')[0];
const trUp=s=>String(s).toLocaleUpperCase('tr-TR');
const isPl=()=>!!G&&(!G.mode||G.mode==='player');
function sfx(w,t){const lw=w.toLocaleLowerCase('tr-TR'),vs=lw.match(/[aeıioöuü]/g)||['e'],v=vs[vs.length-1],ev=/[aeıioöuü]$/.test(lw),back='aıou'.includes(v),hard=/[fstkçşhp]$/.test(lw);
  const four={a:'ı',ı:'ı',o:'u',u:'u',e:'i',i:'i',ö:'ü',ü:'ü'}[v];
  if(t==='gen')return (ev?'n':'')+four+'n';if(t==='acc')return (ev?'y':'')+four;if(t==='dat')return (ev?'y':'')+(back?'a':'e');
  if(t==='abl')return (hard?'t':'d')+(back?'an':'en');if(t==='loc')return (hard?'t':'d')+(back?'a':'e');return '';}
const SFX_T={in:'gen',nin:'gen',nun:'gen',ın:'gen',un:'gen',ün:'gen',i:'acc',yu:'acc',yi:'acc',ı:'acc',u:'acc',dan:'abl',den:'abl',e:'dat',a:'dat',ye:'dat',ya:'dat',de:'loc',da:'loc'};
function nmOn(){return !!(G&&G.p&&G.p.name);}
function NM(s){if(typeof s!=='string'||!nmOn()||(s.indexOf('Cenk')<0&&s.indexOf('CENK')<0))return s;const full=PN(),first=PF(),parts=full.split(' '),last=parts[parts.length-1];
  return s.replace(/Cenk Özkacar/g,'\u0001').replace(/Cenk Kuşku’([a-zçğıöşü]+)/g,(m,x)=>full+'’'+(SFX_T[x]?sfx(last,SFX_T[x]):x)).replace(/Cenk’([a-zçğıöşü]+)/g,(m,x)=>first+'’'+(SFX_T[x]?sfx(first,SFX_T[x]):x)).replace(/Cenk Kuşku/g,full).replace(/Cenk/g,first).replace(/CENK/g,trUp(first)).replace(/\u0001/g,'Cenk Özkacar');}
{const _m=msg;msg=function(t,a,b,x){return _m(t,NM(a),NM(b),x);};const _o=openModal;openModal=function(h){return _o(NM(h));};const _t=toast;toast=function(s){return _t(NM(s));};const _f=feed;feed=function(m,t,c){return _f(m,NM(t),c);};}
function nmDom(){const tt=$('#mgTut');if(tt){if(!tt.dataset.o)tt.dataset.o=tt.innerHTML;tt.innerHTML=NM(tt.dataset.o);}}
/* oyuncu görünüşü */
function lookNow(age){const L=Object.assign({},PL());if(age!=null&&age<18)L.bd=null;return L;}
{const _a=avatarSVG;avatarSVG=function(c1,c2,num,age){const L=G&&G.p&&G.p.look;if(!L||L.cenk)return _a(c1,c2,num,age);return faceSVG(lookNow(age),{c1,c2,num});};}

