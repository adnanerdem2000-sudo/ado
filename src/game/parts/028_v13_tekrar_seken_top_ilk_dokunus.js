/* ================= v13: tekrar, seken top, ilk dokunuş ================= */
function recFrame(){const S=MG.S;if(!S||S.phase!=='play')return;S.rcN=(S.rcN||0)+1;if(S.rcN%2)return;
  const f={b:[S.ball.x,S.ball.y,S.ball.z,S.ball.rot||0],e:S.all.map(e=>[e.x,e.y,e.z||0,e.vx,e.vy,e.fx,e.fy,e.ph,e.kickT||0,e.slide||0,e.down||0,e.diving?1:0,e.dive?e.dive.t:0,e.dive?e.dive.tx:0,e.dive?e.dive.x0:0,e.stag||0])};
  (S.rec=S.rec||[]).push(f);if(S.rec.length>240)S.rec.shift();}
function rpApply(f){const S=MG.S,b=S.ball;b.x=f.b[0];b.y=f.b[1];b.z=f.b[2];b.rot=f.b[3];b.owner=null;b.held=null;
  f.e.forEach((a,i)=>{const e=S.all[i];if(!e)return;e.x=a[0];e.y=a[1];e.z=a[2];e.vx=a[3];e.vy=a[4];e.fx=a[5];e.fy=a[6];e.ph=a[7];e.kickT=a[8];e.slide=a[9];e.down=a[10];e.diving=!!a[11];if(a[11]){e.dive=e.dive||{};e.dive.t=a[12];e.dive.tx=a[13];e.dive.x0=a[14];}e.stag=a[15];e.cel=0;e.jumpT=null;});}
const rpWant=S=>!S.rpDone&&S.res&&['goal','tmGoal','assist'].includes(S.res.code)&&S.rec&&S.rec.length>40&&setsGet().rp!==false&&!(S.C&&S.C.drill)&&!String(S.type).startsWith('tr_');
function rpStart(){const S=MG.S,n=S.rec.length;S.rp={f:S.rec.slice(Math.max(0,n-170)),k:0};S.phase='replay';$('#joyZone').style.visibility='hidden';S.net=null;S.inNet=false;S.parts=[];IN.q.length=0;$('#mgFlash').className='mg-flash';}
function rpStep(dt){const S=MG.S,r=S.rp;r.k+=dt*60*0.45;const i=Math.floor(r.k);if(i>=r.f.length||IN.q.length){IN.q.length=0;S.rpDone=true;S.phase='end';S.endT=0.01;$('#joyZone').style.visibility='';return;}rpApply(r.f[i]);camStep(dt);}
function rpOverlay(c){const W=MG.W,H=MG.H,y=Math.max(150,H*0.15);c.fillStyle='rgba(0,0,0,.5)';c.fillRect(0,H*0.9,W,H*0.1);
  c.font='900 italic 20px "Saira Extra Condensed",sans-serif';const tw=c.measureText('TEKRAR · AĞIR ÇEKİM').width;c.fillStyle='rgba(8,10,14,.72)';rr(c,12,y-17,tw+52,34,17);c.fill();c.fillStyle=Math.floor(performance.now()/450)%2?'#ef3b36':'#ffffff';c.beginPath();c.arc(32,y,6,0,7);c.fill();
  c.font='900 italic 20px "Saira Extra Condensed",sans-serif';c.textAlign='left';c.textBaseline='middle';c.fillStyle='#ffffff';c.fillText('TEKRAR · AĞIR ÇEKİM',46,y+1);
  c.font='700 13px "Barlow Semi Condensed",sans-serif';c.textAlign='center';c.fillStyle='rgba(255,255,255,.85)';c.fillText('Geçmek için ekrana dokun',W/2,H*0.95);}

