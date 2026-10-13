/* ================= v37: düzenli sayfa başlıkları · iki bölmeli gelen kutusu · masaüstü ızgaraları ================= */
let INSEL=null;
function ibSplitHTML(){const F=INF_GROUPS[INF],list=G.inbox.filter(m=>!F||F.includes(m.t));const sel=list.find(m=>m.id===INSEL)||list.find(m=>isOpenMsg(m))||list[0];
  if(sel&&!sel.read){sel.read=true;}
  const left=list.map(m=>`<li class="ib-i t-${m.t} ${m.read?'':'unread'} ${m===sel?'sel':''}"><button data-act="ibSel" data-id="${m.id}"><span class="msg-tag">${TAGS[m.t]||'•'}</span><span class="ib-t"><b>${esc(m.title)}</b><small>${esc(m.when)}${m.offer&&m.offer.status==='open'?' · yanıt bekliyor':m.ev&&!m.ev.done?' · karar bekliyor':''}</small></span></button></li>`).join('');
  const right=sel?`<div class="ib-read">${msgHTML(Object.assign({},sel,{open:true})).replace('<li class="msg','<div class="msg ib-full').replace(/<\/li>$/,'</div>')}</div>`:'<div class="ib-read"><p class="empty">Mesaj seçilmedi.</p></div>';
  return list.length?`<div class="ib-split"><ul class="ib-list">${left}</ul>${right}</div>`:'<p class="empty">Bu başlıkta mesaj yok.</p>';}
viewInbox=(old=>function(){const h=old.apply(this,arguments);if(!navWide())return h;const i=h.search(/<ul class="inbox">|<p class="empty">/);return (i>0?h.slice(0,i):h)+ibSplitHTML();})(viewInbox);
ACTX.ibSel=el=>{INSEL=el.dataset.id;const m=G.inbox.find(x=>x.id===INSEL);if(m)m.read=true;save();render();const r=$('.ib-read');if(r)r.scrollTop=0;};
/* sayfa başlığı: kategori › bölüm (masaüstü) */
render=(old=>function(){const r=old.apply(this,arguments);try{if(!document.documentElement.classList.contains('fm-nav'))return r;const v=$('#view');if(!v)return r;
    const cur=document.querySelector('#tabsIn .nav-i[aria-current="page"]');const h=v.querySelector(':scope > h2.h, :scope > .inbox-head > h2.h');
    const cbx=cur&&(cur.closest('.nav-cat')||cur.closest('.nav-g')),cpe=cbx&&(cbx.querySelector(':scope > p')||cbx.querySelector('.nav-gh span')),lbe=cur&&cur.querySelector('span');if(cur&&h&&cpe&&lbe&&!v.querySelector('.pg-crumb')){const cat=cpe.textContent,lab=lbe.textContent;
      if(TAB==='squad')h.textContent=lab;(h.parentElement.classList.contains('inbox-head')?h.parentElement:h).insertAdjacentHTML('beforebegin',`<p class="pg-crumb">${esc(cat)} <i>›</i> ${esc(lab)}</p>`);}
    v.querySelectorAll(':scope > .filt').forEach(f=>{if(f.querySelector('[data-act=ktab]'))f.classList.add('dup-nav');});}catch(e){console.warn(e);}return r;})(render);

