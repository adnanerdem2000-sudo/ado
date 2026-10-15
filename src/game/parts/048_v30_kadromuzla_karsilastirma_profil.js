/* ================= v30: kadromuzla karşılaştırma (profil + gözlemci raporu) ================= */
const CMP_KEY={FW:['Bitiricilik','Topsuz Alan','Soğukkanlılık','Kafa Vuruşu','Hız','Dripling'],KN:['Dripling','Hız','Hızlanma','Orta Yapma','Teknik','Bitiricilik'],OS:['Pas','Vizyon','Karar Alma','Teknik','Çalışkanlık','Dayanıklılık'],DF:['Markaj','Top Kapma','Pozisyon Alma','Kafa Vuruşu','Güç','Hız'],KL:['Refleks','Bire Bir','Hava Hakimiyeti','Elle Oyun','Ayakla Oyun','İletişim']};
fmProfHTML=(old=>function(p,c,opt){let h=old(p,c,opt);if(!G||!G.club||c.id===G.club||(opt&&opt.acad))return h;const cp=fmCompareHTML(p,c);if(!cp)return h;
  h=h.replace('<button data-act="fmpTab" data-k="po">Pozisyonlar</button>','<button data-act="fmpTab" data-k="po">Pozisyonlar</button><button data-act="fmpTab" data-k="cp">Karşılaştır</button>');
  const i=h.indexOf('<p class="fmp-sec">');return i<0?h+cp:h.slice(0,i)+cp+h.slice(i);})(fmProfHTML);
srModal=(old=>function(){old();const F=SRF,p=F&&pByKey(F.k),mc=$('#modalCard');if(!p||!mc)return;const cid=scCid(p),c=CLUBS[cid];const cp=fmCompareHTML(p,c);if(!cp)return;const btn=mc.querySelector('[data-act=srGo]');if(btn)btn.insertAdjacentHTML('beforebegin',cp.replace('fmp-cpx','fmp-cpx sr-cp'));})(srModal);

