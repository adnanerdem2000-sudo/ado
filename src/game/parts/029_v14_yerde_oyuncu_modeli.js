/* ================= v14: yerde oyuncu modeli ================= */
function drawDown(c,e,H){const k=e.kit,lw=Math.max(1.6,H*0.1),sl=e.slide>0,skin=e.skin,boot=e.boot||'#14161a',a=Math.atan2(e.fy*0.55,e.fx||0.001);
  c.fillStyle='rgba(0,0,0,.22)';c.beginPath();c.ellipse(0,0,H*0.42,H*0.1,0,0,7);c.fill();
  c.rotate(a);if(Math.cos(a)<0)c.scale(1,-1);
  const hip=[0,sl?-H*0.04:-H*0.02],sh=sl?[-H*0.27,-H*0.17]:[-H*0.3,-H*0.03],hd=sl?[-H*0.37,-H*0.25]:[-H*0.42,-H*0.05],sockTop=k.trim===k.socks?shade(k.socks,-0.28):k.trim;
  const leg=(kx,ky,fx,fy)=>{limb(c,hip[0],hip[1],kx,ky,lw*1.15,lw*0.85,skin);limb(c,kx,ky,fx,fy,lw*0.95,lw*0.68,k.socks);c.strokeStyle=sockTop;c.lineWidth=lw*0.35;c.beginPath();const t=0.18;c.moveTo(kx+(fx-kx)*t-lw*0.3,ky+(fy-ky)*t);c.lineTo(kx+(fx-kx)*t+lw*0.3,ky+(fy-ky)*t);c.stroke();
    c.fillStyle=boot;c.beginPath();c.ellipse(fx+lw*0.25,fy,lw*0.75,lw*0.42,Math.atan2(fy-ky,fx-kx),0,7);c.fill();};
  const arm=(x,y)=>{limb(c,sh[0],sh[1],(sh[0]+x)/2,(sh[1]+y)/2,lw*0.85,lw*0.75,k.shirt);limb(c,(sh[0]+x)/2,(sh[1]+y)/2,x,y,lw*0.7,lw*0.55,skin);};
  if(sl){leg(H*0.12,H*0.08,-H*0.02,H*0.12);arm(-H*0.36,H*0.07);}else{leg(H*0.2,H*0.06,H*0.42,H*0.08);arm(-H*0.22,H*0.16);}
  limb(c,hip[0]-H*0.03,hip[1],hip[0]+H*0.07,hip[1],lw*2.2,lw*2,k.shorts);
  limb(c,hip[0]-H*0.04,hip[1],sh[0],sh[1],lw*2.3,lw*2.6,k.shirt);
  if(H>18){c.strokeStyle='rgba(0,0,0,.15)';c.lineWidth=Math.max(1,lw*0.25);c.beginPath();c.moveTo((hip[0]+sh[0])/2,(hip[1]+sh[1])/2-lw*0.9);c.lineTo((hip[0]+sh[0])/2+lw*0.4,(hip[1]+sh[1])/2+lw*0.6);c.stroke();}
  if(sl){leg(H*0.22,-H*0.02,H*0.46,-H*0.07);arm(-H*0.16,-H*0.33);}else{leg(H*0.21,-H*0.08,H*0.43,-H*0.1);arm(-H*0.36,-H*0.16);}
  const r=H*0.085;drawHairBack(c,e,hd[0],hd[1],r);c.fillStyle=skin;c.beginPath();c.arc(hd[0],hd[1],r,0,7);c.fill();drawHair(c,e,hd[0],hd[1],r,false);}

