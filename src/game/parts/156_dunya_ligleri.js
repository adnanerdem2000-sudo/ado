/* ================= DÜNYA LİGLERİ ================= */
const WORLD=['u14','u16','u19','sal','bal','l3','l2','l1','sl','en3','en2','pl','es3','es2','ll','it3','it2','it1','de3','de2','de1','fr3','fr2','fr1','pt1','nl1','be1','sa1','br1','sc1','gr1','at1','ch1','dk1'];
const CC={TR:'Türkiye',EN:'İngiltere',ES:'İspanya',IT:'İtalya',DE:'Almanya',FR:'Fransa',PT:'Portekiz',NL:'Hollanda',BE:'Belçika',SA:'S. Arabistan',BR:'Brezilya',SC:'İskoçya',GR:'Yunanistan',AT:'Avusturya',CH:'İsviçre',DK:'Danimarka'};
let VLG=null;
function olSync(lid){const S=G.s;S.ol=S.ol||{};let o=S.ol[lid];if(!o){o=S.ol[lid]={fx:makeFixtures(shuffle(leagueClubs(lid).map(c=>c.id))),res:[],cal:buildCal(lid,S.year)};}
  const need=G.phase==='off'?o.fx.length:o.cal.filter(d=>d<S.day).length;
  while(o.res.length<need){o.res.push(o.fx[o.res.length].map(([h,a])=>{const [x,y]=simScore(h,a);return [h,a,x,y];}));}return o;}
function tableOf(lid,results){const T={};leagueClubs(lid).forEach(c=>T[c.id]={id:c.id,o:0,g:0,b:0,m:0,a:0,y:0,p:0});
  results.forEach(rd=>rd.forEach(([h,a,hg,ag])=>{const H=T[h],A=T[a];if(!H||!A)return;H.o++;A.o++;H.a+=hg;H.y+=ag;A.a+=ag;A.y+=hg;if(hg>ag){H.g++;A.m++;H.p+=3;}else if(hg<ag){A.g++;H.m++;A.p+=3;}else{H.b++;A.b++;H.p++;A.p++;}}));
  return Object.values(T).sort((x,y)=>y.p-x.p||(y.a-y.y)-(x.a-x.y)||y.a-x.a);}
function tableHTML(tb){return `<section class="panel"><div class="tbl-wrap"><table><thead><tr><th>#</th><th class="l">Takım</th><th>O</th><th>G</th><th>B</th><th>M</th><th>AV</th><th>P</th></tr></thead><tbody>${tb.map((r,i)=>`<tr class="${r.id===G.club?'me':''} clk" data-act="club" data-id="${r.id}"><td>${i+1}</td><td class="l club">${crestSVG(CLUBS[r.id],16)}<span>${esc(CLUBS[r.id].name)}</span></td><td>${r.o}</td><td>${r.g}</td><td>${r.b}</td><td>${r.m}</td><td>${r.a-r.y>0?'+':''}${r.a-r.y}</td><td class="pts">${r.p}</td></tr>`).join('')}</tbody></table></div></section>`;}
function worldChips(){const own=G.s.league,cur=VLG||own,cc=LEAGUES[cur].cc||'TR';
  return `<div class="filt wl">${Object.entries(CC).map(([k,n])=>`<button class="chip" data-act="vcc" data-k="${k}" aria-pressed="${cc===k}">${n}</button>`).join('')}</div><div class="filt wl">${WORLD.filter(l=>LEAGUES[l].cc===cc).map(l=>`<button class="chip" data-act="vlg" data-k="${l}" aria-pressed="${cur===l}">${l===own?'● ':''}${LEAGUES[l].short}</button>`).join('')}</div>`;}
function viewWorld(lid){const L=LEAGUES[lid],o=olSync(lid),tb=tableOf(lid,o.res),lead=tb[0];
  const clubs=leagueClubs(lid).sort((a,b)=>b.str-a.str);
  return `<h2 class="h">${L.name}</h2>${worldChips()}<p class="muted" style="margin:0 2px 10px">${clubs.length} takım · ${o.res.length}/${o.fx.length} hafta oynandı${lead&&o.res.length?` · Lider: ${esc(CLUBS[lead.id].name)}`:''} · Takıma dokun: güç, bütçe, vizyon</p>${tableHTML(tb)}
  <section class="panel"><p class="sub-h"><span>Kulüpler</span><span>Vizyon</span></p><ul class="watch">${clubs.map(c=>`<li class="clk" data-act="club" data-id="${c.id}">${crestSVG(c,22)}<div><b>${esc(c.name)}</b><small>${VISIONS[clubVision(c)].n} · ${money(clubBudget(c))}</small></div></li>`).join('')}</ul></section>`;}

