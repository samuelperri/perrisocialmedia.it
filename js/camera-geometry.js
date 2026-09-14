// Both supplied camera images stay rigid; only their opacity and uniform zoom change.
export const clamp=n=>Math.max(0,Math.min(1,n));
export const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
export const mix=(a,b,t)=>a+(b-a)*t;
export const LCD={x:334/1536,y:446/1024,width:568/1536,height:373/1024};
const photoLCD={x:308/1536,y:447/1024,width:617/1536,height:378/1024};
export function cameraGeometry(w,h,unused,p){
 const blend=ease((p-.04)/.16),zoom=ease((p-.24)/.53);
 function pose(lcd,body){
  const width=Math.min(w*.92/body.width,h*.83*1.5/body.height),height=width/1.5;
  const x=w/2-(body.x+body.width/2)*width,y=h*.54-(body.y+body.height/2)*height;
  const cx=x+(lcd.x+lcd.width/2)*width,cy=y+(lcd.y+lcd.height/2)*height;
  const scale=Math.exp(Math.log(Math.max(w/(width*lcd.width),h/(height*lcd.height))*1.004)*zoom);
  const centerX=mix(cx,w/2,zoom),centerY=mix(cy,h/2,zoom);
  return {camera:{width,height,scale,x:centerX-(lcd.x+lcd.width/2)*width*scale,y:centerY-(lcd.y+lcd.height/2)*height*scale},
   screen:{x:centerX-width*lcd.width*scale/2,y:centerY-height*lcd.height*scale/2,width:width*lcd.width*scale,height:height*lcd.height*scale}};
 }
 // Register the supplied transparent drawing against the real camera controls.
 const a=pose(LCD,{x:151/1536,y:118/1024,width:1205/1536,height:754/1024});
 const b=pose(photoLCD,{x:100/1536,y:70/1024,width:1336/1536,height:836/1024});
 const screen={};for(const k of ['x','y','width','height'])screen[k]=mix(a.screen[k],b.screen[k],blend);
 const settle=ease((p-.78)/.10);for(const [k,v]of Object.entries({x:0,y:0,width:w,height:h}))screen[k]=mix(screen[k],v,settle);
 return {outline:a.camera,photo:b.camera,screen,blend,cameraVisible:p<.78,reveal:ease((p-.30)/.32)};
}
