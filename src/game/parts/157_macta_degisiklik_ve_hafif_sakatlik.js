/* ================= MAÇTA: değişiklik ve hafif sakatlık ================= */
function subBtn(){const b=$('#mvSub');if(!b)return;b.hidden=!(MR&&!MR.pendKnock&&onPitch()&&!MR.out&&MR.min>=5&&MR.min<MR.end&&$('#mvStage').hidden&&$('#mvDone').hidden);}
function askSub(){if(!MR||MR.out||!onPitch())return;const c=MR.cond,ok=c<45||MR.knock||MR.min>=75||Math.random()<0.35;
  if(ok){MR.out=true;MR.outMin=MR.min;MR.subbed=true;feed(MR.min,MR.knock?'Cenk ağrıları nedeniyle değişiklik istedi; hoca onu kenara aldı.':'Cenk değişiklik istedi, hoca onu oyundan aldı.','me');if(c>=45&&!MR.knock)G.p.trust=clamp(G.p.trust-2,0,100);}
  else feed(MR.min,'Cenk değişiklik istedi ama hoca kabul etmedi: “Devam et, sana ihtiyacım var!”','me');
  renderBoard();}
function knockHit(m,why){if(!MR||MR.out||MR.knock||MR.pendKnock)return false;MR.pendKnock=true;clearTimeout(MR.timer);$('#mvFast').hidden=true;
  feed(m,`${why} Hafif sakatlık: ağrıyla devam edebilir ama performansı yarıya düşer ve ciddi sakatlık riski artar.<span class="kn-btns"><button class="cta sm" type="button" data-act="knockGo">Devam et</button><button class="btn" type="button" data-act="knockOff">Oyundan çık</button></span>`,'opp me knock');renderBoard();return true;}
function knockChoice(go){if(!MR||!MR.pendKnock)return;MR.pendKnock=false;document.querySelectorAll('.kn-btns').forEach(e=>e.remove());
  if(go){MR.knock=true;feed(MR.min,'Cenk dişini sıktı, topallayarak oyuna devam ediyor.','me');}
  else{MR.out=true;MR.outMin=MR.min;MR.knockOff=true;feed(MR.min,'Cenk kenara geldi, sağlık ekibi buz uyguluyor.','me');}
  $('#mvFast').hidden=false;renderBoard();MR.timer=setTimeout(mrStep,400);}
const halfA=a=>{const o={};for(const k in a)o[k]=a[k]*0.6;return o;};

