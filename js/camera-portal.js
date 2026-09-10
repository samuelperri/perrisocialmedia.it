import {cameraGeometry,clamp} from './camera-geometry.js';
const journey=document.querySelector('#cameraJourney');
if(journey){
 const films=[['46','Let Him Cook'],['75','M4 Nightlife'],['53','HYROX FEELING'],['17','Il mondo del profumo'],['54','Cortometraggio di moda'],['08','After Dark']];
 const photoTitles={"01":"Dentro la partita","02":"Dentro la partita","03":"Dentro la partita","12":"Il gusto, in un frame","13":"Il gusto, in un frame","14":"Il gusto, in un frame","15":"Il gusto, in un frame","16":"Il gusto, in un frame","23":"Dentro la partita","24":"Dentro la partita","25":"Dentro la partita","26":"Dentro la partita","27":"Dentro la partita","28":"Dentro la partita","29":"Dentro la partita","30":"Dentro la partita","31":"Dentro la partita","32":"Dentro la partita","33":"Dentro la partita","34":"Dentro la partita","35":"Dentro la partita","36":"Dentro la partita","37":"Dentro la partita","38":"Dentro la partita","39":"Dentro la partita","40":"Dentro la partita","41":"Dentro la partita","42":"Dentro la partita","43":"Dentro la partita","44":"Dentro la partita","45":"Dentro la partita","52":"Dentro la partita","55":"La cura, da vicino","56":"La cura, da vicino","57":"La cura, da vicino","58":"La cura, da vicino","59":"Persone e luoghi","60":"Persone e luoghi","61":"Persone e luoghi","62":"Persone e luoghi","63":"Persone e luoghi","64":"Persone e luoghi","65":"Persone e luoghi","66":"Luce e spazio","67":"Luce e spazio","68":"Luce e spazio","69":"Luce e spazio","70":"Luce e spazio","71":"Luce e spazio","72":"Luce e spazio","73":"Luce e spazio"};
 const rows=[['75','03','14','55','53','70'],['12','17','01','66','56','54'],['60','24','08','13','57','64'],['67','02','16','46','61','72']];
 const stage=journey.querySelector('.cp-stage'),art=journey.querySelector('.cp-art'),photo=journey.querySelector('.cp-photo'),display=journey.querySelector('.cp-display'),space=journey.querySelector('.cp-space'),hero=journey.querySelector('.cp-hero'),film=document.querySelector('#cameraHeroFilm'),wall=journey.querySelector('.cp-wall');
 const jump=journey.querySelector('.cp-jump'),start=journey.querySelector('.cp-start'),back=journey.querySelector('.cp-back'),proceed=journey.querySelector('.cp-continue'),instruction=journey.querySelector('.cp-lcd-instruction');
 const controls=journey.querySelector('.cp-film-controls'),previous=controls.querySelector('.cp-previous'),next=controls.querySelector('.cp-next'),count=controls.querySelector('.cp-film-count');
 const dialog=document.querySelector('#cameraFilmDialog'),player=dialog.querySelector('video'),dialogPhoto=dialog.querySelector('.cp-dialog-photo');
 const preference=matchMedia('(prefers-reduced-motion:reduce)'),staticMode=()=>!!window.perriMotionOff||preference.matches||!!navigator.connection?.saveData;
 let priorFocus,frame=0,ready=false,attempting=false,playRequest=0,selected=0,onScreen=false,siteReady=!document.body.classList.contains('is-loading'),switching=false,hoverTimer;
 let startY=0,travel=1,size={width:1,height:1};
 const pointer={x:0,y:0},inertia={x:0,y:0},buttons=[];
 rows.forEach(keys=>{
  const row=document.createElement('div');row.className='cp-wall-row';
  keys.forEach(key=>{
   const index=films.findIndex(f=>f[0]===key),tile=document.createElement('button');
   tile.className='cp-wall-tile';const img=document.createElement('img');img.src='media/'+key+'-thumb.webp';img.alt='';img.draggable=false;tile.append(img);
   const title=index>=0?films[index][1]:photoTitles[key];
   tile.type='button';tile.setAttribute('aria-label','Apri '+title);tile.setAttribute('aria-haspopup','dialog');tile.setAttribute('aria-controls','cameraFilmDialog');buttons.push(tile);
   // A click always opens the exact asset under the pointer, regardless of hover preview.
   tile.addEventListener('click',()=>openMedia(key,title,index>=0,tile));
   if(index>=0){
    tile.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&ready){clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>selectFilm(index,tile),220);}});
    tile.addEventListener('pointerleave',()=>clearTimeout(hoverTimer));
   }row.append(tile);
  });wall.append(row);
 });
 function measure(){
  size={width:stage.clientWidth,height:stage.clientHeight};startY=window.scrollY+journey.getBoundingClientRect().top;travel=Math.max(1,journey.offsetHeight-stage.offsetHeight);
  space.style.width=size.width+'px';space.style.height=size.height+'px';render();
 }
 const progress=()=>staticMode()?1:clamp((window.scrollY-startY)/travel);
 function render(){
  frame=0;const p=progress(),g=cameraGeometry(size.width,size.height,null,p),r=g.screen;
  [[art,g.outline],[photo,g.photo]].forEach(([el,c])=>{el.style.width=c.width+'px';el.style.height=c.height+'px';el.style.transform='translate3d('+c.x+'px,'+c.y+'px,0) scale('+c.scale+')';el.style.visibility=g.cameraVisible?'visible':'hidden';});
  photo.style.opacity=g.blend;art.style.opacity=1-g.blend;
  for(const [property,value] of Object.entries({left:r.x,top:r.y,width:r.width,height:r.height}))display.style[property]=value+'px';
  // Fit the entire same scene inside the LCD; expand its aperture during the push.
  const scale=Math.min(r.width/size.width,r.height/size.height);
  space.style.transform='translate('+((r.width-size.width*scale)/2)+'px,'+((r.height-size.height*scale)/2)+'px) scale('+scale+')';
  space.style.opacity=g.reveal;space.style.clipPath='inset(0 '+(1-g.reveal)*40+'%)';
  instruction.style.opacity=1-clamp(p/.24);instruction.hidden=p>.3;
  display.style.background=p>=.78?'#080808':'#faf9f7';stage.style.background=p>=.78?'#080808':'#faf9f7';stage.classList.toggle('is-dark',p>=.78);
  ready=p>=.72||staticMode();journey.classList.toggle('is-ready',ready);jump.hidden=ready;
  previous.disabled=next.disabled=!ready;hero.disabled=!ready;hero.tabIndex=ready?0:-1;buttons.forEach(b=>{b.disabled=!ready;b.tabIndex=ready?0:-1;});
  back.tabIndex=proceed.tabIndex=ready?0:-1;
  const motion=ready&&onScreen&&siteReady&&!document.hidden&&!dialog.open&&!staticMode();
  journey.classList.toggle('is-running',onScreen&&siteReady&&!document.hidden&&!dialog.open&&!staticMode()&&p>.30);
  inertia.x+=((motion?pointer.x:0)-inertia.x)*.085;inertia.y+=((motion?pointer.y:0)-inertia.y)*.085;
  hero.style.transform='translate(-50%,-50%) perspective(1200px) rotateX('+(-inertia.y*2)+'deg) rotateY('+inertia.x*3+'deg)';
  wall.style.transform='translate3d('+(-inertia.x*14)+'px,'+(-inertia.y*10)+'px,0)';
  document.body.classList.toggle('camera-paper',onScreen&&p<.30&&!staticMode());document.body.classList.toggle('camera-cinema',onScreen&&p>=.30&&p<.72&&!staticMode());
  if(Math.abs(inertia.x-(motion?pointer.x:0))+Math.abs(inertia.y-(motion?pointer.y:0))>.001)schedule();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(render);}
 function sync(){
  render();
  if(!siteReady||!onScreen||document.hidden||dialog.open||staticMode()||progress()<.30){film.pause();return;}
  if([...document.querySelectorAll('video')].some(v=>v!==film&&!v.paused&&!v.ended&&!v.muted)){film.pause();return;}
  if(!film.paused||attempting)return;attempting=true;film.muted=true;const request=++playRequest;
  film.play().then(()=>{if(request!==playRequest)return;attempting=false;start.hidden=true;if(!onScreen||document.hidden||dialog.open||staticMode())film.pause();}).catch(()=>{if(request!==playRequest)return;attempting=false;start.textContent='Avvia video';start.hidden=false;});
 }
 function selectFilm(index,tile){
  if(switching||index===selected||!ready)return;
  selected=(index+films.length)%films.length;
  const [key,title]=films[selected];
  const change=()=>{
   ++playRequest;film.pause();attempting=false;film.poster='media/'+key+'-thumb.webp';film.src='media/'+key+'.mp4';
   hero.setAttribute('aria-label','Guarda '+title);hero.querySelector('.cp-card-label').textContent=title+' ↗';count.textContent=String(selected+1).padStart(2,'0')+' / 06';sync();
  };
  if(staticMode()||!window.gsap){change();return;}
  switching=true;
  const r=tile?.getBoundingClientRect(),h=hero.getBoundingClientRect();
  window.gsap.to(film,{opacity:0,scale:.96,duration:.18,onComplete:()=>{
   change();window.gsap.fromTo(film,{opacity:0,scale:.92,x:r?(r.left+r.width/2-h.left-h.width/2)*.1:0,y:r?(r.top+r.height/2-h.top-h.height/2)*.1:15},{opacity:1,scale:1,x:0,y:0,duration:.65,ease:'power3.out',onComplete:()=>switching=false});
  }});
 }
 function openMedia(key,title,isVideo,trigger){
  if(!ready)return;
  clearTimeout(hoverTimer);priorFocus=trigger;
  document.querySelectorAll('video').forEach(v=>v.pause());
  player.removeAttribute('src');player.load();player.hidden=!isVideo;dialogPhoto.hidden=isVideo;
  dialogPhoto.removeAttribute('src');dialogPhoto.alt='';
  dialog.querySelector('#cameraFilmTitle').textContent=title;dialog.querySelector('.cp-error').hidden=true;
  if(isVideo){player.poster='media/'+key+'-thumb.webp';player.src='media/'+key+'.mp4';player.setAttribute('aria-label',title);}
  else{dialogPhoto.alt=title;dialogPhoto.src='media/'+key+'.webp';}
  dialog.showModal();render();if(isVideo)player.play().catch(()=>{});
 }
 function openFilm(){const [key,title]=films[selected];openMedia(key,title,true,hero);}
 // Finite native-scroll scene: no wheel handlers and no scroll locking.
 function moveTo(y){if(window.lenis)window.lenis.scrollTo(y,{duration:1.35,immediate:staticMode()});else window.scrollTo({top:y,behavior:staticMode()?'instant':'smooth'});}
 jump.addEventListener('click',()=>moveTo(startY+travel));back.addEventListener('click',()=>moveTo(startY));proceed.addEventListener('click',()=>film.pause());hero.addEventListener('click',openFilm);
 start.addEventListener('click',()=>{film.muted=true;film.play().then(()=>{start.hidden=true;}).catch(()=>{start.textContent='Riprova il video';});});
 previous.addEventListener('click',()=>selectFilm((selected+films.length-1)%films.length));next.addEventListener('click',()=>selectFilm((selected+1)%films.length));
 stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();pointer.x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));pointer.y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));schedule();});
 stage.addEventListener('pointerleave',()=>{clearTimeout(hoverTimer);pointer.x=pointer.y=0;schedule();});
 film.addEventListener('error',()=>{start.textContent='Riprova il video';start.hidden=false;});
 dialog.querySelector('.cp-close').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{player.pause();player.removeAttribute('src');player.load();dialogPhoto.removeAttribute('src');dialogPhoto.hidden=true;priorFocus?.focus({preventScroll:true});sync();});
 dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
 dialogPhoto.addEventListener('error',()=>{if(dialog.open&&dialogPhoto.getAttribute('src'))dialog.querySelector('.cp-error').hidden=false;});
 player.addEventListener('error',()=>{if(dialog.open&&player.getAttribute('src'))dialog.querySelector('.cp-error').hidden=false;});
 player.addEventListener('play',()=>document.querySelectorAll('video').forEach(v=>{if(v!==player)v.pause();}));
 new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting&&entries[0].intersectionRatio>.2;sync();},{threshold:[0,.2,.5]}).observe(stage);
 new ResizeObserver(measure).observe(stage);window.addEventListener('resize',measure);art.addEventListener('load',measure);window.addEventListener('scroll',()=>{schedule();if(film.paused&&progress()>.30)sync();},{passive:true});
 window.addEventListener('perri:ready',()=>{siteReady=true;measure();sync();});
 function motionChange(){journey.classList.toggle('is-static',staticMode());measure();sync();window.ScrollTrigger?.refresh();window.lenis?.resize();}
 preference.addEventListener('change',motionChange);window.addEventListener('perri:motion',motionChange);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();sync();});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;journey.classList.remove('is-running');film.pause();player.pause();});window.addEventListener('pageshow',sync);
 document.fonts.ready.then(measure);journey.classList.toggle('is-static',staticMode());measure();
}
