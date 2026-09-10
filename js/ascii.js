(() => {
 const canvas=document.getElementById('asciiField');if(!canvas)return;
 const ctx=canvas.getContext('2d'),section=canvas.parentElement;
 const reduced=window.perriMotionOff||matchMedia('(prefers-reduced-motion: reduce)').matches;
 let width=0,height=0,cols=0,rows=0,frame=0,visible=false,last=0,mx=0,my=0;
 const glyphs=' .:-=+*#%@';
 function resize(){width=section.clientWidth;height=section.clientHeight;canvas.width=width;canvas.height=height;cols=Math.ceil(width/13);rows=Math.ceil(height/17);draw(0);}
 function draw(time){
  const t=reduced?1.2:time*.00022;
  ctx.clearRect(0,0,width,height);ctx.font='12px monospace';ctx.textAlign='center';
  const buffer=new Float32Array(cols*rows).fill(-100),light=new Float32Array(cols*rows);
  const A=.8+Math.sin(t*.6)*.26+my*.08,B=t*.34+mx*.08;
  const ca=Math.cos(A),sa=Math.sin(A),cb=Math.cos(B),sb=Math.sin(B);
  const scale=Math.min(width*.34,height*.61);
  for(let u=0;u<Math.PI*2;u+=.052)for(let v=0;v<Math.PI*2;v+=.12){
   const cu=Math.cos(u),su=Math.sin(u),cv=Math.cos(v),sv=Math.sin(v);
   const R=1.45+.12*Math.sin(u*3+t),r=.39;
   let x=(R+r*cv)*cu,y=(R+r*cv)*su,z=r*sv;
   const yy=y*ca-z*sa,zz=y*sa+z*ca,xx=x*cb+zz*sb,depth=-x*sb+zz*cb;
   const perspective=2.8/(3.5-depth*.35);
   const col=Math.floor((width/2+xx*scale*perspective)/13),row=Math.floor((height/2+yy*scale*perspective)/17);
   if(col<0||row<0||col>=cols||row>=rows)continue;
   const i=row*cols+col;
   if(depth>buffer[i]){buffer[i]=depth;light[i]=Math.max(.07,(cv*.55+sv*.25+cu*.2+1)/2);}
  }
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const i=row*cols+col,x=col*13,y=row*17;
   if(buffer[i]>-99){const l=light[i];ctx.fillStyle=`rgba(185,160,220,${.09+l*.25})`;ctx.fillText(glyphs[Math.min(9,Math.floor(l*9))],x,y);}
   else if((row*7+col*11)%9===0){ctx.fillStyle='rgba(190,180,205,.055)';ctx.fillText((row+col)%3?'·':'+',x,y);}
  }
 }
 function tick(now){frame=0;if(!visible||document.hidden||reduced)return;if(now-last>65){draw(now);last=now;}frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&visible&&!reduced&&!document.hidden)frame=requestAnimationFrame(tick);}
 new ResizeObserver(resize).observe(section);
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(visible)start();else{cancelAnimationFrame(frame);frame=0;}}).observe(section);
 section.addEventListener('pointermove',e=>{const r=section.getBoundingClientRect();mx=(e.clientX-r.left)/r.width-.5;my=(e.clientY-r.top)/r.height-.5;},{passive:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
 window.addEventListener('pagehide',()=>cancelAnimationFrame(frame),{once:true});resize();
})();
