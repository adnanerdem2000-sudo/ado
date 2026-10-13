/* ================= EVENTS ================= */
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-act]');if(!el)return;const a=el.dataset.act;if(ACTX[a]){ACTX[a](el);return;}
  switch(a){
    case 'selpos':SEL.pos=el.dataset.v;showStart();break;
    case 'selfoot':SEL.foot=el.dataset.v;showStart();break;
    case 'selclub':SEL.club=el.dataset.v;showStart();break;
    case 'startGameOld':{const saved=load();if(saved&&saved.p&&!confirmNew){confirmNew=true;showStart();break;}confirmNew=false;if(saved&&saved.p){const g0=G;G=saved;archSave();G=g0;}newGame(SEL.pos,SEL.foot,'ferikoy');applyBoosts();G.phase='tryout';G.inbox=[];G.tryout=null;G.msS=null;G.ms=[];save();TAB='hub';render();window.scrollTo(0,0);break;}
    case 'tryStart':startTraining('secme','try');break;
    case 'trySkip':tryoutEnd(0.45,true);break;
    case 'trySign':signTryout(+el.dataset.i);break;
    case 'trSkip':trSkip();break;
    case 'club':showClub(el.dataset.id);break;
    case 'squad':showSquad(el.dataset.id);break;
    case 'ccard':showCoach(el.dataset.id);break;
    case 'wz':W.step=el.dataset.k;W.del=null;showStart();break;
    case 'wzProf':W.prof=el.dataset.k;if(W.prof==='oyuncu'&&W.fn==='')W.fn='Cenk';showStart();break;
    case 'wzL':{const f=el.dataset.f,v=el.dataset.v;W.look[f]=f==='bd'?(v||null):v;showStart();break;}
    case 'wzGo':wizGo();break;
    case 'startGame':W.prof='oyuncu';wizGo();break;
    case 'slotGo':{const g=slotLoad(el.dataset.id);if(!g)return toast('Kayıt okunamadı');G=g;G.sid=el.dataset.id;applyBoosts();TAB='hub';CTAB='cur';LTAB='tbl';VLG=null;render();window.scrollTo(0,0);break;}
    case 'slotDel':if(W.del===el.dataset.id){slotDel(el.dataset.id);W.del=null;}else W.del=el.dataset.id;showStart();break;
    case 'settings':openSettings();break;
    case 'rpTog':{const st=setsGet();st.rp=st.rp===false;setsPut(st);break;}
    case 'layG':LAYG=el.dataset.k;openSettings();break;
    case 'layReset':{const s=setsGet();if(s.lay)delete s.lay[LAYG];setsPut(s);openSettings();break;}
    case 'planEdit':planEdit();break;
    case 'planMode':G.plan.mode=el.dataset.k;save();planEdit();render();break;
    case 'planFocus':G.plan.focus=el.dataset.k;save();planEdit();render();break;
    case 'planInt':G.plan.int=el.dataset.k;save();planEdit();render();break;
    case 'shopc':SHOPC=el.dataset.k;render();break;
    case 'buy2':buyItem(el.dataset.c,el.dataset.k);break;
    case 'licGo':licEnroll();break;
    case 'tpF':mgrInit().tp.f=el.dataset.k;save();render();break;
    case 'tpI':mgrInit().tp.i=el.dataset.k;save();render();break;
    case 'trf':{const f=el.dataset.f,v=el.dataset.v;TRF[f]=f==='age'?+v:(v||null);if(f==='pos')TRF.pos=v;render();break;}
    case 'ktab':KTAB=el.dataset.k;render();break;
    case 'scLg':mgrInit().scout={lid:el.dataset.k};save();render();toast('Gözlemci yola çıktı; raporlar haftalık gelecek');break;
    case 'stMatch':staffMatch();break;
    case 'stCup':staffCup();break;
    case 'stDay':staffDay();nextDay();save();render();window.scrollTo(0,0);break;
    case 'stAdv':staffAdvance();break;
    case 'stSign':staffSign(el.dataset.id);break;
    case 'stHC':staffHC(el.dataset.id);break;
    case 'stNew':staffNew();break;
    case 'yrTr':yrSet('tr',el.dataset.k);break;
    case 'yrAn':yrSet('an',el.dataset.k);break;
    case 'scGo':scGo(el.dataset.k);break;
    case 'renew':closeModal();renewStart(el.dataset.k);break;
    case 'faGo':faStart(el.dataset.k);break;
    case 'bid':bidAct(el.dataset.id,el.dataset.k);break;
    case 'goBids':TAB='squad';KTAB='transfer';STB.trf='gel';render();window.scrollTo(0,0);break;
    case 'friendly':friendly();break;
    case 'press':pressAns(+el.dataset.k);break;
    case 'rename':renameMe();break;
    case 'stab':STB[el.dataset.id]=el.dataset.k;render();break;
    case 'sqTab':SQT=el.dataset.k;if(!$('#modal').hidden)showSquad(el.dataset.id);else render();break;
    case 'mgrCupW':mgrCup(true);break;
    case 'stfCard':stfCard(el.dataset.id,+el.dataset.i);break;
    case 'stfMkt':stfMktOpen(el.dataset.k);break;
    case 'stfHire':stfHire(+el.dataset.k);break;
    case 'toMenu':if(typeof MR!=='undefined'&&MR)break;save();closeModal();G=null;W.step='list';render();window.scrollTo(0,0);break;
    case 'themeTog':{const st=setsGet();st.theme=st.theme==='klasik'?'pro':'klasik';setsPut(st);applyTheme();break;}
    case 'ngStart':closeModal();negStart(el.dataset.id,el.dataset.k,el.dataset.t);break;
    case 'ngResume':negOpen();break;
    case 'ngA':negStep(el.dataset.f,+el.dataset.d);break;
    case 'ngS':negSet(el.dataset.f,el.dataset.k);break;
    case 'ngClub':negClub();break;
    case 'ngPl':negPlayer();break;
    case 'ngQuit':G.m.neg=null;save();closeModal();toast('Görüşmeden çekildin');break;
    case 'ngClose':G.m.neg=null;save();closeModal();TAB='squad';KTAB='taktik';render();window.scrollTo(0,0);break;
    case 'optUse':optUse(+el.dataset.i);break;
    case 'goTak':TAB='squad';KTAB='taktik';FMS=-1;render();window.scrollTo(0,0);break;
    case 'goRel':TAB='squad';KTAB='iliski';render();window.scrollTo(0,0);break;
    case 'fmForm':fmForm(el.dataset.k);break;
    case 'fmSel':fmSel(+el.dataset.i);break;
    case 'fmPut':fmPut(+el.dataset.i,el.dataset.k);break;
    case 'fmRole':fmRole(+el.dataset.i,el.dataset.k);break;
    case 'fmDuty':fmDuty(+el.dataset.i,el.dataset.k);break;
    case 'fmTi':fmTi(el.dataset.k,el.dataset.v);break;
    case 'fmPre':fmPreset(el.dataset.k);break;
    case 'fmTab':FMT=el.dataset.k;render();break;
    case 'fmAuto':fmAuto();break;
    case 'talk':talkDo(+el.dataset.i,el.dataset.k);break;
    case 'talkOpen':talkOpen(el.dataset.k);break;
    case 'sct':SCT=el.dataset.k;render();break;
    case 'scSearch':scSearch();break;
    case 'scF':scFlt(el.dataset.f,el.dataset.k);break;
    case 'scShort':scShort(el.dataset.k);break;
    case 'scShortM':closeModal();scShort(el.dataset.k);break;
    case 'scRq':scRequest(el.dataset.k);break;
    case 'scRqM':closeModal();scRequest(el.dataset.k);break;
    case 'subHire':subHire();break;
    case 'subLg':subSet(+el.dataset.i,'lg',el.dataset.k);break;
    case 'subPos':subSet(+el.dataset.i,'pos',el.dataset.k);break;
    case 'subDel':subSet(+el.dataset.i,'del');break;
    case 'scVid':scVideo(el.dataset.k);break;
    case 'scRep':scReport(el.dataset.k);break;
    case 'drDx':drDiag(+el.dataset.c,+el.dataset.k);break;
    case 'drTx':drTreat(+el.dataset.c,el.dataset.k);break;
    case 'drProg':jobInit().prog=el.dataset.k;save();render();break;
    case 'cupsView':closeModal();TAB='league';LTAB='cup';VLG=null;render();window.scrollTo(0,0);break;
    case 'mgrCup':mgrCup();break;
    case 'tourPlay':tourPlay(false);break;
    case 'tourSim':tourPlay(true);break;
    case 'tourSimAll':tourSimAll();break;
    case 'ctab':CTAB=el.dataset.k;render();break;
    case 'arcOpen':showArc(el.dataset.id);break;
    case 'mgrRetire':mgrRetire();break;
    case 'pcard':showPCard(el.dataset.id,el.dataset.k);break;
    case 'goPlayer':closeModal();TAB='player';render();window.scrollTo(0,0);break;
    case 'xiTog':xiToggle(el.dataset.k);break;
    case 'sellP':sellPlayer(el.dataset.k);break;
    case 'buyP':buyPlayer(el.dataset.id,el.dataset.k);break;
    case 'beMgr':becomeManager();break;
    case 'mgrSign':mgrSign(el.dataset.id);break;
    case 'mgrAdv':mgrAdvance();break;
    case 'mgrPlay':mgrPlay(false);break;
    case 'mgrSim':mgrPlay(true);break;
    case 'mgrHT':mgrHT(el.dataset.k);break;
    case 'mgrNew':mgrNewSeason();break;
    case 'tac':G.m.tac=el.dataset.k;save();render();break;
    case 'mreq':mgrReq(el.dataset.k);break;
    case 'vcc':{const cc=el.dataset.k;VLG=LEAGUES[G.s.league].cc===cc?null:WORLD.filter(l=>LEAGUES[l].cc===cc).sort((a,b)=>LEAGUES[b].tier-LEAGUES[a].tier)[0];if(!VLG)LTAB='tbl';render();break;}
    case 'nego':negoSheet(el.dataset.id);break;
    case 'ask':askTerm(el.dataset.id,el.dataset.k);break;
    case 'breq':boardReq(el.dataset.k);break;
    case 'vlg':VLG=el.dataset.k===G.s.league?null:el.dataset.k;if(!VLG)LTAB='tbl';render();break;
    case 'askSub':askSub();break;
    case 'knockGo':knockChoice(true);break;
    case 'knockOff':knockChoice(false);break;
    case 'trscene':G.trScene=el.checked;save();setTimeout(render,0);break;
    case 'continue':G=load();applyBoosts();TAB='hub';render();break;
    case 'help':showHelp();break;
    case 'closeModal':closeModal();break;
    case 'tab':TAB=el.dataset.tab;render();window.scrollTo(0,0);break;
    case 'play':onPlay();break;
    case 'simPlay':onPlay(true);break;
    case 'endDay':finishDay();break;
    case 'auto':autoAdvance();break;
    case 'free':{const k=el.dataset.k;if(k==='indiv')indivSheet();else doFree(k);break;}
    case 'int':SEL.int=el.dataset.k;indivSheet();break;
    case 'indiv':doFree('indiv',{k:el.dataset.k,int:SEL.int});break;
    case 'drill':closeModal();runDrill(el.dataset.k);break;
    case 'inf':INF=el.dataset.k;render();break;
    case 'evopt':resolveEvent(el.dataset.id,+el.dataset.i);break;
    case 'readAll':G.inbox.forEach(m=>{m.read=true;});save();render();break;
    case 'hurt':G.p.playHurt=el.checked;save();setTimeout(render,0);break;
    case 'readmsg':{const m=G.inbox.find(x=>x.id===el.dataset.id);if(m){m.read=true;m.open=!m.open;save();render();}break;}
    case 'accept':{const o=findOffer(el.dataset.id);if(!$('#modal').hidden&&$('#modalCard').innerHTML.includes('Pazarlık'))closeModal();if(o&&o.status==='open')acceptOffer(o);break;}
    case 'haggle':{const o=findOffer(el.dataset.id);if(o)haggle(o);break;}
    case 'reject':{const o=findOffer(el.dataset.id);if(o){o.status='rejected';save();render();}break;}
    case 'buy':{const u=UPGRADES.find(x=>x[0]===el.dataset.k);if(u&&G.p.money>=u[3]&&!G.p.up[u[0]]){G.p.money-=u[3];G.p.up[u[0]]=true;if(u[0]==='araba'){G.p.fame=clamp(G.p.fame+8,0,100);G.p.morale=clamp(G.p.morale+10,0,100);}if(u[0]==='yali'){G.p.fame=clamp(G.p.fame+12,0,100);G.p.morale=Math.max(G.p.morale,70);}save();render();toast(`${u[1]} senin!`);}break;}
    case 'goInbox':closeModal();TAB=G.phase==='off'?'hub':'inbox';render();window.scrollTo(0,0);break;
    case 'newSeason':startNewSeason();break;
    case 'retire':retire();break;
    case 'fs':toggleFS();break;
    case 'ltab':LTAB=el.dataset.k;render();break;
    case 'autofs':G.autoFS=el.checked;save();break;
    case 'tutGo':G.tutSeen=true;save();$('#mgTut').hidden=true;if(MG.S)MG.S.paused=false;break;
    case 'newCareer':archSave();G=null;confirmNew=false;W.step='prof';showStart();window.scrollTo(0,0);break;
  }
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#modal').hidden)closeModal();
  if(FX&&$('#fx')&&!$('#fx').hidden&&!/INPUT|TEXTAREA/.test((e.target&&e.target.tagName)||'')){if(e.key===' '){e.preventDefault();fxAct('play');}else if(['1','2','3','4'].includes(e.key))fxAct('spd',[1,2,4,8][+e.key-1]);else if(e.key==='n'||e.key==='N')fxAct('names');else if(e.key==='f'||e.key==='F')fxAct('ff');}});
window.addEventListener('resize',()=>{if(FX&&$('#fx')&&!$('#fx').hidden)fxResize();});
$('#mvFast').addEventListener('click',()=>{if(!MR)return;MR.fast=!MR.fast;$('#mvFast').textContent=MR.fast?'Normal hız':'Hızlandır';});
padInit();
document.documentElement.classList.toggle('nofs',!fsOK());
document.addEventListener('fullscreenchange',()=>{if(MG.S&&!$('#mvStage').hidden)setTimeout(mgSetup,60);});
render();
