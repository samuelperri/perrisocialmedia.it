(() => {
 const intro=document.getElementById('studioIntro'),reduce=matchMedia('(prefers-reduced-motion:reduce)');
 if(!intro||!window.gsap||window.perriMotionOff||reduce.matches||location.hash||scrollY>40)return;
 const page=document.getElementById('site'),nav=document.getElementById('nav'),panel=intro.querySelector('.intro-panel');
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 let finished=false,started=false,revealing=false,emitting=false,next=0,order=1,last=null,lastStamp=0;
 let pointerSeen=false,touchOrigin=null,revealTween=null,pointer=null,smoothed=null;
 const timers=[],controller=new AbortController(),options={signal:controller.signal};
 const schedule=(fn,delay)=>{timers.push(setTimeout(fn,delay));};
 const slots=[...intro.querySelectorAll('.intro-card')].map(card=>({
  card,media:card.querySelector('.intro-card-media'),image:card.querySelector('img'),
  bands:Array.from({length:10},()=>({width:0})),video:card.querySelector('video'),
  timeline:null,active:false,generation:0
 }));
 // A single clipped surface keeps photo/video bands synchronized on every browser.
 function drawSplit(slot){
  const points=[];
  slot.bands.forEach((band,i)=>{
   const x=(50+band.width/2).toFixed(2);points.push(x+'% '+i*10+'%',x+'% '+(i+1)*10+'%');
  });
  for(let i=9;i>=0;i--){
   const x=(50-slot.bands[i].width/2).toFixed(2);points.push(x+'% '+(i+1)*10+'%',x+'% '+i*10+'%');
  }
  slot.media.style.clipPath='polygon('+points.join(',')+')';
 }
 function stopSlot(slot){
  slot.active=false;slot.generation++;slot.timeline?.kill();slot.timeline=null;
  slot.video?.pause();slot.video?.classList.remove('is-playing');slot.card.style.visibility='hidden';
 }
 function complete(){
  if(finished)return;finished=true;emitting=false;
  timers.forEach(clearTimeout);controller.abort();revealTween?.kill();gsap.ticker.remove(followPointer);
  slots.forEach(stopSlot);intro.hidden=true;
  document.body.classList.remove('intro-active','intro-revealing');
  if(page)page.inert=false;if(nav)nav.inert=false;
  window.lenis?.start();window.lenis?.resize();window.ScrollTrigger?.refresh();
  dispatchEvent(new Event('perri:intro-end'));
 }
 function reveal(){
  if(finished||revealing)return;revealing=true;emitting=false;
  document.body.classList.add('intro-revealing');
  dispatchEvent(new Event('perri:intro-reveal'));
  // Scroll advances the sequence without cutting off the split or the curtain.
  revealTween=gsap.to(panel,{yPercent:-100,duration:2,ease:'power3.inOut',onComplete:complete});
 }
 function stamp(x,y,from={x,y}){
  if(!emitting||finished||document.hidden)return;
  // Fast cursor movement must not recycle a card before its closing bands finish.
  const slot=Array.from({length:slots.length},(_,i)=>slots[(next+i)%slots.length])
   .find(slot=>!slot.active&&slot.image.complete&&slot.image.naturalWidth>0);
  if(!slot)return;
  next=(slots.indexOf(slot)+1)%slots.length;stopSlot(slot);
  const size=slot.card.offsetWidth,generation=slot.generation;
  gsap.set(slot.card,{x:from.x-size/2,y:from.y-size/2});
  slot.card.style.zIndex=String(order++);slot.card.style.visibility='visible';slot.active=true;
  slot.bands.forEach(band=>{band.width=0;});drawSplit(slot);
  slot.timeline=gsap.timeline({onUpdate:()=>drawSplit(slot),onComplete:()=>stopSlot(slot)})
   .to(slot.card,{x:x-size/2,y:y-size/2,duration:1,ease:'power3.out'},0);
  slot.bands.forEach((band,i)=>{
   slot.timeline.to(band,{width:100,duration:.4,ease:'power2.inOut'},.025+Math.abs(i-4.5)*.045)
    .to(band,{width:0,duration:.8,ease:'power2.inOut'},.85+(4.5-Math.abs(i-4.5))*.035);
  });
  if(slot.video&&!navigator.connection?.saveData){
   const video=slot.video;video.muted=true;video.defaultMuted=true;
   if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
   video.play().then(()=>{
    if(slot.generation!==generation)return;
    if(!slot.active||finished)video.pause();else video.classList.add('is-playing');
   }).catch(()=>{});
  }
 }
 function followPointer(){
  if(!pointer||!smoothed||!emitting)return;
  const blend=1-Math.pow(.9,gsap.ticker.deltaRatio());
  smoothed.x+=(pointer.x-smoothed.x)*blend;smoothed.y+=(pointer.y-smoothed.y)*blend;
 }
 function move(event){
  if(event.pointerType==='touch'||!emitting)return;
  pointerSeen=true;pointer={x:event.clientX,y:event.clientY};
  if(!smoothed)smoothed={...pointer};
  const time=performance.now();
  if(time-lastStamp<70||(last&&Math.hypot(pointer.x-last.x,pointer.y-last.y)<125))return;
  stamp(pointer.x,pointer.y,smoothed);last={...pointer};lastStamp=time;
 }
 function start(){
  if(started||finished)return;started=true;emitting=true;
  window.lenis?.stop();gsap.ticker.add(followPointer);
  const route=[[.2,.3],[.69,.25],[.8,.68],[.32,.76],[.16,.58]];
  route.forEach(([x,y],i)=>schedule(()=>{
   if(!fine.matches||!pointerSeen)stamp(innerWidth*x,innerHeight*y);
  },450+i*430));
  schedule(reveal,2790);
 }
 // Never depend on a network response or pointer gesture to finish.
 schedule(complete,7500);
 try{
  intro.hidden=false;document.body.classList.add('intro-active');
  if(page)page.inert=true;if(nav)nav.inert=true;window.lenis?.stop();
  intro.addEventListener('pointermove',move,options);
  intro.querySelector('.intro-skip').addEventListener('click',reveal,options);
  intro.addEventListener('wheel',event=>{event.preventDefault();reveal();},{...options,passive:false});
  intro.addEventListener('touchstart',event=>{touchOrigin=event.touches[0]?.clientY;},{...options,passive:true});
  intro.addEventListener('touchmove',event=>{
   event.preventDefault();
   if(Math.abs((event.touches[0]?.clientY??0)-(touchOrigin??0))>12)reveal();
  },{...options,passive:false});
  document.addEventListener('keydown',event=>{
   if(event.key==='Escape'){complete();return;}
   if(['ArrowDown','PageDown',' ','End'].includes(event.key)){event.preventDefault();reveal();}
  },options);
  addEventListener('hashchange',complete,options);addEventListener('pagehide',complete,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)complete();},options);
  reduce.addEventListener('change',()=>{if(reduce.matches)complete();},options);
  // Allow the other page modules to initialize before starting the short animation.
  const ready=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!revealing)start();}));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{...options,once:true});else ready();
 }catch{complete();}
})();
