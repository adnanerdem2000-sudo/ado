/* ================= GÜNDEM ve KİŞİSEL OLAYLAR ================= */
const FIRSTN=['Arda','Mert','Emre','Kerem','Barış','Oğuz','Yusuf','Efe','Can','Ozan','Berk','Umut','Furkan','Kaan','Alp','Batuhan','Eren','Doruk','Tuna','Selim','Onur','Ege','Deniz','Burak','Serkan','Halil','İsmail','Volkan'];
const LASTN=['Yıldız','Kaya','Demir','Şahin','Aydın','Çelik','Arslan','Koç','Öztürk','Kılıç','Polat','Erdem','Aksoy','Doğan','Yalçın','Ateş','Taş','Güneş','Kurt','Özkan','Bulut','Karaca','Sezer','Toprak'];
const fakeName=()=>`${pick(FIRSTN)} ${pick(LASTN)}`;
const POSN={FW:'forvet',KN:'kanat oyuncusu',OS:'orta saha oyuncusu',DF:'stoper'};
function newsGen(){const s=G.s,L=curLeague(),R=s.results,cl=myClub(),gens=[];
  if(R.length>=2)gens.push(()=>{const t=table(),a=t[0],b=t[1];return [`${L.short}: zirvede ${CLUBS[a.id].name} var`,`${L.name} ${R.length} hafta geride kaldı. ${CLUBS[a.id].name} ${a.p} puanla lider, ${CLUBS[b.id].name} ${b.p} puanla takipte.${a.id===G.club?' Cenk’in takımı zirvede!':''}`];});
  if(R.length)gens.push(()=>{const rd=R[R.length-1].filter(x=>!x.includes(G.club));if(!rd.length)return null;const x=rd.slice().sort((p,q)=>Math.abs(q[2]-q[3])-Math.abs(p[2]-p[3]))[0];
    if(x[2]===x[3])return [`${CLUBS[x[0]].name} - ${CLUBS[x[1]].name}: ${x[2]}-${x[3]}`,`Haftanın maçında kazanan çıkmadı, iki takım puanları paylaştı.`];
    const w=x[2]>x[3]?x[0]:x[1],l=x[2]>x[3]?x[1]:x[0];return [`${CLUBS[x[0]].name} ${x[2]}-${x[3]} ${CLUBS[x[1]].name}`,`Haftanın en dikkat çeken sonucu: ${CLUBS[w].name}, ${CLUBS[l].name} karşısında güldü.`];});
  if(R.length>=5)gens.push(()=>{const t=table(),last=t[t.length-1];if(s.sacked[last.id]||last.id===G.club)return null;s.sacked[last.id]=1;return [`${CLUBS[last.id].name} cephesinde ayrılık`,`Ligin son sırasındaki ${CLUBS[last.id].name}, teknik direktör ${fakeName()} ile yollarını ayırdı.`];});
  gens.push(()=>{const big=pick(Object.values(CLUBS).filter(c=>LEAGUES[c.league].tier>=Math.min(8,L.tier+1)&&!LEAGUES[c.league].youth));const small=pick(leagueClubs(L.tier>=8?'l1':cl.league).filter(c=>c.id!==big.id&&c.id!==G.club));if(!big||!small)return null;
    return [`${big.name} transfer yaptı`,`${big.name}, ${small.name} forması giyen genç ${pick(Object.values(POSN))} ${fakeName()} ile anlaştı. Bonservis bedeli açıklanmadı.`];});
  gens.push(()=>{const c=pick(leagueClubs(cl.league).filter(x=>x.id!==G.club));return [`${c.name} kulübüne kötü haber`,`${c.name} kaptanı ${fakeName()} antrenmanda sakatlandı. ${pick(['3 hafta','1 ay','sezonun geri kalanında'])} forma giyemeyecek.`];});
  gens.push(()=>{const sl=leagueClubs('sl'),a=pick(sl),b=pick(sl.filter(x=>x.id!==a.id)),x=rint(0,4),y=rint(0,3);return [`Süper Lig: ${a.name} ${x}-${y} ${b.name}`,`${x>y?a.name+' sahadan galip ayrıldı.':x<y?b.name+' deplasmandan 3 puanla döndü.':'Puanlar paylaşıldı.'} ${pick(['Maçta 2 kırmızı kart çıktı.','Tribünler doluydu.','Altyapıdan iki genç forma giydi.','Maçın adamı bir 19 yaşındaydı.'])}`];});
  gens.push(()=>{const eu=pick([...leagueClubs('pl'),...leagueClubs('ll')]);return [`Avrupa’dan: ${eu.name} Türkiye’de gözlemci ağı kuruyor`,`${eu.name} yönetiminin Türkiye’deki genç yetenekleri yakından izlemek için yeni bir scout ekibi kurduğu öğrenildi.`];});
  if(Math.random()<0.2)gens.push(()=>{bump('trust',-2);return [`${cl.name} kadrosunu güçlendirdi`,`${cl.name}, ${POSN[G.p.pos]} mevkisi için ${fakeName()} ile anlaştı. Forma rekabeti kızışıyor; Cenk antrenmanlarda daha çok terlemek zorunda.`];});
  if(R.length>=3)gens.push(()=>{const k=Math.random()<0.6?'g':'a',ls=leaders(k),top=ls[0],i=ls.findIndex(x=>x.me),me=ls[i],w=k==='g'?'gol':'asist';
    return [`${k==='g'?'Gol':'Asist'} krallığı yarışı: zirvede ${top.n}`,`${L.name} ${w} sıralamasında ${top.n} (${CLUBS[top.c].name}) ${top.v} ${w}la önde.${top.me?' Zirvedeki isim Cenk!':` Cenk Kuşku ${me.v} ${w}la ${i+1}. sırada.`}`];});
  const wl=Object.entries(G.watch).filter(([,w])=>w.lv>=1);
  if(wl.length)gens.push(()=>{const [id]=pick(wl),c=CLUBS[id];return [`Kulis: ${c.name} gözünü Cenk Kuşku’dan ayırmıyor`,`${pick(['Bir spor sitesinin haberine göre','Kulüp çevrelerinde konuşulana göre','Yerel basına yansıyan bilgilere göre'])} ${c.name}, Cenk Kuşku’nun gelişimini yakından takip ediyor.`];});
  else if(R.length>=2)gens.push(()=>{const c=pick(scoutPool());if(!c)return null;return [`Kulis: ${c.name} gözlemcisi tribündeydi`,`Son maçta tribünde ${c.name} gözlemcisi vardı. Kimi izlediği bilinmiyor. İyi bir maç her şeyi değiştirebilir.`];});
  const g=pick(gens),r=g&&g();if(r)msg('gundem',r[0],r[1]);}
function gainAttr(k,v){const p=G.p,dt=G.s?dayType(G.s.day):'';const g=v*0.8*(dt==='yaz'||dt==='tatil'?0.5:1)*ageF(p.age)*clamp((p.pot[k]-p.a[k])/25,0.08,1.3);p.a[k]=Math.min(p.pot[k],p.a[k]+g);return g;}
const EVENTS={
  roportaj:{c:()=>true,title:'Röportaj isteği',body:()=>`${pick(['Yerel bir spor sitesi','Bir gazete muhabiri','Kulübün sosyal medya ekibi'])} seninle kısa bir röportaj yapmak istiyor.`,
    o:[['Alçakgönüllü konuş',()=>{bump('trust',2);bump('fame',1);return 'Hocan röportajını beğendi: “Ayakları yere basıyor.”';}],
       ['İddialı konuş',()=>{bump('fame',3);if(Math.random()<0.4){bump('trust',-3);return 'Sözlerin manşet oldu ama hocan pek hoşlanmadı.';}bump('morale',4);return 'Sözlerin manşet oldu, taraftar sevdi.';}],
       ['Teşekkür edip reddet',()=>'Röportajı kibarca reddettin.']]},
  parti:{c:()=>true,title:'Takım arkadaşından davet',body:()=>`${fakeName()} hafta sonu doğum günü kutlaması yapıyor, seni de çağırdı.`,
    o:[['Git, kısa kal',()=>{bump('morale',5);bump('energy',-4);return 'Güzel vakit geçirdin, takımla bağın güçlendi.';}],
       ['Geç saate kadar kal',()=>{bump('morale',8);bump('energy',-15);if(Math.random()<0.35){bump('trust',-4);return 'Ertesi gün antrenmanda halsizdin, hoca fark etti.';}return 'Gece uzun sürdü ama sorun çıkmadı.';}],
       ['Gitme, dinlen',()=>{bump('energy',5);bump('morale',-2);return 'Evde dinlendin.';}]]},
  sinav:{c:()=>G.p.age<18,title:'Okulda sınav haftası',body:()=>'Öğretmenin bu hafta sınavların olduğunu hatırlattı. Ailen derslere de zaman ayırmanı istiyor.',
    o:[['Derslere ağırlık ver',()=>{bump('morale',4);bump('trust',-1);bump('energy',4);return 'Sınavların iyi geçti, ailen mutlu.';}],
       ['Antrenmandan taviz verme',()=>{bump('energy',-8);bump('morale',-3);bump('trust',2);return 'Yorgun bir hafta oldu ama hoca kararlılığını gördü.';}]]},
  sponsor:{c:()=>G.p.fame>=6,title:'Sponsorluk teklifi',data:()=>({amt:Math.round(Math.max(2000,G.contract.wage*rnd(3,6))/100)*100}),body:d=>`Bir spor malzemesi markası ${money(d.amt)} karşılığında krampon sponsorluğu öneriyor. Sosyal medyada paylaşım yapman gerekecek.`,
    o:[['Kabul et',d=>{G.p.money+=d.amt;bump('fame',2);return `${money(d.amt)} hesabına yattı.`;}],['Reddet',()=>'Teklifi reddettin.']]},
  kaptan:{c:()=>!G.p.injury,title:'Kaptandan ekstra çalışma daveti',body:()=>'Takım kaptanı idman sonrası birlikte bitiricilik çalışmayı teklif etti.',
    o:[['Katıl',()=>{const k=pick(['sut','pas','dri']);const g=gainAttr(k,0.2);bump('energy',-8);bump('trust',2);return `${ATTR[k]} +${dec(g,2)}. Kaptanla aran çok iyi.`;}],['Teşekkür et, dinlen',()=>{bump('energy',4);return 'Dinlenmeyi seçtin.';}]]},
  hoca:{c:()=>true,title:'Hocayla birebir görüşme',body:()=>'Hoca seni odasına çağırdı: “Kendini takımda nerede görüyorsun?”',
    o:[['Daha fazla süre istiyorum',()=>{if(G.p.trust>60||formAvg()>7){bump('trust',3);return 'Hoca haklı olduğunu kabul etti, şans verecek.';}bump('trust',-3);return 'Hoca “Önce antrenmanda göster” dedi.';}],
       ['Takım için ne gerekirse',()=>{bump('trust',3);return 'Hoca tavrını beğendi.';}]]},
  taraftar:{c:()=>G.p.fame>=18,title:'İmza günü daveti',body:()=>'Kulüp, hafta sonu küçük taraftarlarla imza günü düzenliyor ve seni de istiyor.',
    o:[['Katıl',()=>{bump('fame',3);bump('morale',3);bump('energy',-5);return 'Çocuklar formanı imzalattı, çok mutlu oldular.';}],['Katılma',()=>{bump('fame',-1);return 'Katılmadın.';}]]},
  menajer:{c:()=>G.p.up.menajer&&Object.keys(G.watch).length>0,title:'Menajerinden mesaj',data:()=>({id:pick(Object.keys(G.watch))}),body:d=>`${CLUBS[d.id].name} yetkilileri durumunu sordu. Görüşmemi ister misin?`,
    o:[['Görüş',d=>{const w=G.watch[d.id];if(!w)return 'Kulüp ilgisini kaybetmiş.';w.i=clamp(w.i+15,0,100);return `${CLUBS[d.id].name} ilgisi arttı.`;}],['Şimdi değil',()=>'Menajerin beklemede kalacak.']]},
  krampon:{c:()=>!G.p.up.krampon&&G.p.money>=1500,title:'Yeni krampon fırsatı',body:()=>'Mahalledeki spor mağazası profesyonel kramponda indirim yapıyor: '+money(1500)+'.',
    o:[['Satın al',()=>{if(G.p.money<1500)return 'Paran yetmedi.';G.p.money-=1500;G.p.up.krampon=true;return 'Profesyonel kramponun hazır. Şut ve pas isabetin artacak.';}],['Vazgeç',()=>'Almadın.']]},
  aile:{c:()=>true,title:'Ailenden mesaj',body:()=>pick(['Annen bir sonraki maçını tribünden izlemek istiyor.','Baban seni deplasmana kendisi götürmek istiyor.','Dedenle ninen maçına gelmek istiyor.']),
    o:[['Gelsinler',()=>{bump('morale',6);return 'Ailen tribünde olacak, moralin yerinde.';}],['Bu sefer gelmesinler',()=>{bump('morale',-1);return 'Bu sefer gelmeyecekler.';}]]},
};
function personalEvent(){if(Math.random()>0.1)return;if(G.inbox.filter(m=>m.ev&&!m.ev.done).length>=2)return;
  const ids=Object.keys(EVENTS).filter(k=>EVENTS[k].c());if(!ids.length)return;const id=pick(ids),E=EVENTS[id],d=E.data?E.data():{};
  msg('event',E.title,E.body(d),{ev:{id,d,done:false,res:''}});}
function resolveEvent(mid,i){const m=G.inbox.find(x=>x.id===mid);if(!m||!m.ev||m.ev.done)return;const E=EVENTS[m.ev.id],r=E.o[i][1](m.ev.d)||'';
  m.ev.done=true;m.ev.choice=E.o[i][0];m.ev.res=r;m.read=true;save();render();toast(r||'Tamam');}

