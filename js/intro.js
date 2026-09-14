(() => {
 const intro=document.getElementById('studioIntro');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 if(!intro||!window.gsap||window.perriMotionOff||reduce.matches||location.hash||scrollY>40)return;
 const page=document.getElementById('site'),nav=document.getElementById('nav');
 const panel=intro.querySelector('.intro-panel'),trail=intro.querySelector('.intro-trail');
 const cards=[...trail.querySelectorAll('.intro-card')];
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 const svgNS='http://www.w3.org/2000/svg';
 const svg=document.createElementNS(svgNS,'svg');
 svg.classList.add('intro-clips');svg.setAttribute('aria-hidden','true');
 const defs=document.createElementNS(svgNS,'defs');svg.append(defs);intro.append(svg);
 let finished=false,revealing=false,emitting=true,next=0,order=1,last=null,lastStamp=0;
 let pointerSeen=false,touchOrigin=null,revealTween=null;
 const timers=[];
 const schedule=(fn,delay)=>{const timer=setTimeout(fn,delay);timers.push(timer);return timer;};
 const controller=new AbortController(),options={signal:controller.signal};
 const slots=cards.map((card,index)=>{
  const clip=document.createElementNS(svgNS,'clipPath');
  clip.id=`intro-slice-${index}`;clip.setAttribute('clipPathUnits','objectBoundingBox');
  const bands=Array.from({length:10},(_,i)=>{
   const rect=document.createElementNS(svgNS,'rect');
   rect.setAttribute('x','.5');rect.setAttribute('y',String(i/10));
   rect.setAttribute('width','0');rect.setAttribute('height','.101');clip.append(rect);return rect;
  });
  defs.append(clip);card.querySelector('.intro-card-media').style.clipPath=`url(#${clip.id})`;
  return {card,bands,video:card.querySelector('video'),timeline:null,active:false,generation:0};
 });
 function stopSlot(slot){
  slot.active=false;slot.generation++;slot.timeline?.kill();slot.timeline=null;
  slot.video?.pause();slot.card.style.visibility='hidden';
 }
 function complete(){
  if(finished)return;finished=true;emitting=false;
  timers.forEach(clearTimeout);controller.abort();revealTween?.kill();
  slots.forEach(stopSlot);intro.hidden=true;
  document.body.classList.remove('intro-active','intro-revealing');
  if(page)page.inert=false;if(nav)nav.inert=false;
  window.lenis?.start();window.lenis?.resize();window.ScrollTrigger?.refresh();
  dispatchEvent(new Event('perri:intro-end'));
 }
 function reveal(immediate=false){
  if(finished)return;
  if(immediate){complete();return;}
  if(revealing)return;revealing=true;
  document.body.classList.add('intro-revealing');
  dispatchEvent(new Event('perri:intro-reveal'));
  revealTween=gsap.to(panel,{yPercent:-100,duration:1.85,ease:'power3.inOut',onComplete:complete});
 }
 function stamp(x,y){
  if(!emitting||finished||document.hidden)return;
  const slot=slots[next++%slots.length];stopSlot(slot);
  const size=slot.card.offsetWidth;
  slot.card.style.transform=`translate3d(${Math.round(x-size/2)}px,${Math.round(y-size/2)}px,0)`;
  slot.card.style.zIndex=String(order++);slot.card.style.visibility='visible';slot.active=true;
  const generation=slot.generation;
  gsap.set(slot.bands,{attr:{x:.5,width:0}});
  slot.timeline=gsap.timeline({onComplete:()=>stopSlot(slot)})
   .to(slot.bands,{attr:{x:0,width:1},duration:.4,ease:'power2.out',stagger:{each:.025,from:'center'}},0)
   .to(slot.bands,{attr:{x:.5,width:0},duration:.75,ease:'power2.inOut',stagger:{each:.016,from:'edges'}},.85);
  if(slot.video&&!navigator.connection?.saveData){
   const video=slot.video;video.muted=true;video.defaultMuted=true;
   if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
   video.play().then(()=>{
    if(!slot.active||finished||slot.generation!==generation)video.pause();
    else video.classList.add('is-playing');
   }).catch(()=>{});
  }
 }
 function move(event){
  if(event.pointerType==='touch'||!emitting)return;
  pointerSeen=true;
  const time=performance.now(),point={x:event.clientX,y:event.clientY};
  if(time-lastStamp<70)return;
  if(last&&Math.hypot(point.x-last.x,point.y-last.y)<110)return;
  stamp(point.x,point.y);last=point;lastStamp=time;
 }
 // No network response or pointer interaction is required for the intro to finish.
 const fallback=setTimeout(complete,6000);timers.push(fallback);
 try{
  intro.hidden=false;document.body.classList.add('intro-active');
  if(page)page.inert=true;if(nav)nav.inert=true;
  window.lenis?.stop();
  intro.addEventListener('pointermove',move,options);
  intro.querySelector('.intro-skip').addEventListener('click',()=>reveal(true),options);
  intro.addEventListener('wheel',()=>reveal(true),{...options,passive:true});
  intro.addEventListener('touchstart',event=>{touchOrigin=event.touches[0]?.clientY;}, {...options,passive:true});
  intro.addEventListener('touchmove',event=>{if(Math.abs((event.touches[0]?.clientY??0)-(touchOrigin??0))>12)reveal(true);},{...options,passive:true});
  document.addEventListener('keydown',event=>{if(['Escape','ArrowDown','PageDown',' ','End'].includes(event.key))reveal(true);},options);
  addEventListener('hashchange',()=>reveal(true),options);
  addEventListener('pagehide',complete,options);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)complete();},options);
  reduce.addEventListener('change',()=>{if(reduce.matches)complete();},options);
  // Automatic gestures on touch screens; mouse movement takes priority on desktop.
  const route=[[.2,.3],[.69,.25],[.8,.68],[.32,.76],[.16,.58]];
  route.forEach(([x,y],i)=>schedule(()=>{
   if(!fine.matches||!pointerSeen)stamp(innerWidth*x,innerHeight*y);
  },450+i*430));
  schedule(()=>reveal(),2790);
  schedule(()=>{emitting=false;},3000);
 }catch{complete();}
})();
