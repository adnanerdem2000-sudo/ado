/* ================= v20: alt sekmeler ================= */
const STB={};let SQT='oyn';
function stab(id,tabs){tabs=tabs.filter(Boolean);const cur=tabs.some(t=>t[0]===STB[id])?STB[id]:tabs[0][0],T=tabs.find(t=>t[0]===cur);
  return `<div class="stabs">${tabs.map(([k,l])=>`<button data-act="stab" data-id="${id}" data-k="${k}" class="${cur===k?'on':''}">${l}</button>`).join('')}</div><div class="stab-body">${T[2]()}</div>`;}
function sqTabs(id){return `<div class="stabs">${[['oyn','Oyuncular'],['ekip','Teknik ekip']].map(([k,l])=>`<button data-act="sqTab" data-id="${id}" data-k="${k}" class="${SQT===k?'on':''}">${l}</button>`).join('')}</div>`;}

