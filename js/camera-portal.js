import {cameraGeometry,clamp} from './camera-geometry.js?v=20260911-restored';
import {createWelcome} from './welcome.js?v=20260914';
const journey=document.querySelector('#cameraJourney');
if(journey){
 const films=[['46','Let Him Cook'],['53','HYROX FEELING'],['17','Il profumo 1968'],['54','Cortometraggio di moda']];
 const rows=[['03','17','53','55','14','70'],['12','17','54','66','56','01'],['60','24','16','13','57','64'],['67','02','46','16','61','72']];
 const stage=journey.querySelector('.cp-stage'),art=journey.querySelector('.cp-art'),photo=journey.querySelector('.cp-photo'),display=journey.querySelector('.cp-display'),space=journey.querySelector('.cp-space'),hero=journey.querySelector('.cp-hero'),film=document.querySelector('#cameraHeroFilm'),wall=journey.querySelector('.cp-wall');
 const jump=journey.querySelector('.cp-jump'),start=journey.querySelector('.cp-start'),back=journey.querySelector('.cp-back'),proceed=journey.querySelector('.cp-continue'),instruction=journey.querySelector('.cp-lcd-instruction');
 const preference=matchMedia('(prefers-reduced-motion:reduce)'),staticMode=()=>!!window.perriMotionOff||preference.matches;
 const welcome=createWelcome(journey.querySelector('.cp-welcome'));
 let frame=0,ready=false,attempting=false,playRequest=0,selected=0,onScreen=false,siteReady=!document.body.classList.contains('is-loading'),switching=false;
 let startY=0,travel=1,size={width:1,height:1},staticEntered=false;
 const pointer={x:0,y:0},inertia={x:0,y:0},buttons=[];
 // Only video thumbnails can move into the hero; photos stay decorative.
 rows.forEach(keys=>{
  const row=document.createElement('div');row.className='cp-wall-row';
  keys.forEach(key=>{const index=films.findIndex(item=>item[0]===key);
   const tile=document.createElement(index<0?'div':'button');tile.className='cp-wall-tile';
   if(index>=0){tile.type='button';tile.disabled=true;tile.tabIndex=-1;tile.dataset.film=index;tile.setAttribute('aria-label','Mostra '+films[index][1]);tile.setAttribute('aria-pressed',String(index===selected));tile.addEventListener('click',()=>selectFilm(index,tile));buttons.push(tile);}
   const img=document.createElement('img');img.dataset.src='media/'+key+'-thumb.webp';img.alt='';img.decoding='async';img.draggable=false;tile.append(img);row.append(tile);
  });wall.append(row);
 });
 // Prepare the wall on approach to the camera, after the opening film.
 const wallLoader=new IntersectionObserver(entries=>{
  if(!entries.some(entry=>entry.isIntersecting))return;
  wall.querySelectorAll('img[data-src]').forEach(img=>{img.src=img.dataset.src;delete img.dataset.src;});
  wallLoader.disconnect();
 },{threshold:.05});wallLoader.observe(stage);
 function measure(){
  size={width:stage.clientWidth,height:stage.clientHeight};startY=window.scrollY+journey.getBoundingClientRect().top;travel=Math.max(1,journey.offsetHeight-stage.offsetHeight);
  space.style.width=size.width+'px';space.style.height=size.height+'px';render();
 }
 // Reduced motion preserves the camera; entering is an explicit, instant action.
 const progress=()=>staticMode()?(staticEntered?1:0):clamp((window.scrollY-startY)/travel);
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
  ready=p>=.72;journey.classList.toggle('is-ready',ready);jump.hidden=ready;
  welcome.update({visible:ready&&onScreen&&siteReady&&!document.hidden,reduced:staticMode()});
  buttons.forEach(b=>{b.disabled=!ready;b.tabIndex=ready?0:-1;});
  back.tabIndex=proceed.tabIndex=ready?0:-1;
  const motion=ready&&onScreen&&siteReady&&!document.hidden&&!document.querySelector('dialog[open]')&&!staticMode();
  journey.classList.toggle('is-running',onScreen&&siteReady&&!document.hidden&&!document.querySelector('dialog[open]')&&!staticMode()&&p>.30);
  inertia.x+=((motion?pointer.x:0)-inertia.x)*.085;inertia.y+=((motion?pointer.y:0)-inertia.y)*.085;
  hero.style.transform='translate(-50%,-50%) perspective(1200px) rotateX('+(-inertia.y*2)+'deg) rotateY('+inertia.x*3+'deg)';
  wall.style.transform='translate3d('+(-inertia.x*14)+'px,'+(-inertia.y*10)+'px,0)';
  document.body.classList.toggle('camera-paper',onScreen&&p<.30);document.body.classList.toggle('camera-cinema',onScreen&&p>=.30&&p<.72&&!staticMode());
  if(Math.abs(inertia.x-(motion?pointer.x:0))+Math.abs(inertia.y-(motion?pointer.y:0))>.001)schedule();
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(render);}
 function sync(){
  render();
  if(!siteReady||!onScreen||document.hidden||document.querySelector('dialog[open]')||progress()<.30){film.pause();start.hidden=true;return;}
  if(staticMode()||navigator.connection?.saveData){film.pause();start.textContent='Avvia video';start.hidden=false;return;}
  if([...document.querySelectorAll('video')].some(v=>v!==film&&!v.paused&&!v.ended&&!v.muted)){film.pause();return;}
  if(!film.paused||attempting)return;attempting=true;film.muted=true;const request=++playRequest;
  film.play().then(()=>{if(request!==playRequest)return;attempting=false;start.hidden=true;if(!onScreen||document.hidden||document.querySelector('dialog[open]')||staticMode())film.pause();}).catch(()=>{if(request!==playRequest)return;attempting=false;start.textContent='Avvia video';start.hidden=false;});
 }
 function selectFilm(index,tile){
  if(switching||index===selected||!ready)return;
  selected=(index+films.length)%films.length;
  const [key,title]=films[selected];
  const change=()=>{
   ++playRequest;film.pause();attempting=false;film.poster='media/'+key+'-thumb.webp';film.src='media/'+key+'.mp4';
   hero.setAttribute('aria-label','Anteprima: '+title);buttons.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.film)===selected)));sync();
  };
  if(staticMode()||!window.gsap){change();return;}
  switching=true;
  const r=tile?.getBoundingClientRect(),h=hero.getBoundingClientRect();
  window.gsap.to(film,{opacity:0,scale:.96,duration:.18,onComplete:()=>{
   change();window.gsap.fromTo(film,{opacity:0,scale:.92,x:r?(r.left+r.width/2-h.left-h.width/2)*.1:0,y:r?(r.top+r.height/2-h.top-h.height/2)*.1:15},{opacity:1,scale:1,x:0,y:0,duration:.65,ease:'power3.out',onComplete:()=>switching=false});
  }});
 }
 // Finite native-scroll scene: no wheel handlers and no scroll locking.
 function moveTo(y){if(window.lenis)window.lenis.scrollTo(y,{duration:1.35,immediate:staticMode()});else window.scrollTo({top:y,behavior:staticMode()?'instant':'smooth'});}
 jump.addEventListener('click',()=>{if(staticMode()){staticEntered=true;sync();}else moveTo(startY+travel);});back.addEventListener('click',()=>{if(staticMode()){staticEntered=false;sync();}else moveTo(startY);});proceed.addEventListener('click',()=>film.pause());
 start.addEventListener('click',()=>{film.muted=true;film.play().then(()=>{start.hidden=true;}).catch(()=>{start.textContent='Riprova il video';});});
 stage.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=stage.getBoundingClientRect();pointer.x=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1));pointer.y=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));schedule();});
 stage.addEventListener('pointerleave',()=>{pointer.x=pointer.y=0;schedule();});
 film.addEventListener('error',()=>{start.textContent='Riprova il video';start.hidden=false;});
 new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting&&entries[0].intersectionRatio>.2;sync();},{threshold:[0,.2,.5]}).observe(stage);
 new ResizeObserver(measure).observe(stage);window.addEventListener('resize',measure);art.addEventListener('load',measure);window.addEventListener('scroll',()=>{if(!onScreen)return;schedule();if(film.paused&&progress()>.30)sync();},{passive:true});
 window.addEventListener('perri:ready',()=>{siteReady=true;measure();sync();});
 function motionChange(){journey.classList.toggle('is-static',staticMode());instruction.textContent=staticMode()?'Entra nel portfolio':'SCORRI PER ENTRARE ↓';measure();sync();window.ScrollTrigger?.refresh();window.lenis?.resize();}
 preference.addEventListener('change',motionChange);window.addEventListener('perri:motion',motionChange);
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;journey.classList.remove('is-running');welcome.stop();film.pause();});window.addEventListener('pageshow',sync);
 document.fonts.ready.then(measure);motionChange();
}
