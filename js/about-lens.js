// Original CHI SONO zoom, driven directly by scroll in both directions.
const lens=document.querySelector('.profile-lens');
const gsap=window.gsap;
if(lens&&gsap){
 const stage=lens.querySelector('.profile-lens-stage');
 const intro=lens.querySelector('.profile-intro');
 const copy=lens.querySelector('.lens-copy'),corner=lens.querySelector('.lens-corner');
 const noise=lens.querySelector('.lens-noise'),wipe=lens.querySelector('.profile-lens-wipe');
 const children=[...intro.children],nav=document.querySelector('.nav');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 let timeline=null,frame=0,measureFrame=0,travel=1,lastHeight=0;
 const motionOff=()=>reduced.matches||!!window.perriMotionOff;
 function draw(){
  frame=0;if(!timeline)return;
  const progress=Math.max(0,Math.min(1,-lens.getBoundingClientRect().top/travel));
  timeline.progress(progress);
  intro.inert=timeline.time()<1.18;
 }
 function queue(){if(!frame)frame=requestAnimationFrame(draw);}
 function measure(){
  measureFrame=0;if(!timeline)return;
  lens.style.setProperty('--profile-nav-height',`${nav?.offsetHeight||90}px`);
  // Keep the complete mobile biography in flow, even when taller than the screen.
  const height=stage.offsetHeight;
  const viewport=parseFloat(getComputedStyle(stage).minHeight)||innerHeight;
  travel=Math.max(600,viewport*2.4);
  lens.style.setProperty('--profile-stage-height',`${height}px`);
  lens.style.setProperty('--profile-zoom-travel',`${travel}px`);
  queue();
  if(Math.abs(lens.offsetHeight-lastHeight)>1){
   lastHeight=lens.offsetHeight;
   window.ScrollTrigger?.refresh();window.lenis?.resize();
  }
 }
 function queueMeasure(){if(!measureFrame)measureFrame=requestAnimationFrame(measure);}
 function configure(){
  timeline?.kill();timeline=null;lastHeight=0;
  gsap.set([copy,corner,wipe,noise,intro,...children],{clearProps:'transform,opacity'});
  lens.classList.toggle('is-zoom',!motionOff());intro.inert=false;
  if(motionOff()){
   lens.style.removeProperty('--profile-stage-height');lens.style.removeProperty('--profile-zoom-travel');
   window.ScrollTrigger?.refresh();window.lenis?.resize();return;
  }
  gsap.set(copy,{xPercent:-50,yPercent:-50,scale:.42,opacity:1});
  gsap.set(corner,{opacity:1,y:0});gsap.set(wipe,{opacity:0});gsap.set(noise,{opacity:.5});
  gsap.set(intro,{opacity:0,y:64});gsap.set(children,{opacity:0,y:34});
  timeline=gsap.timeline({paused:true})
   .to(copy,{opacity:1,scale:.42,duration:.18,ease:'power2.out'},.08)
   .to(copy,{scale:1,duration:.18,ease:'power2.out'},.24)
   .to(copy,{scale:17,duration:.48,ease:'power1.inOut'},.42)
   .to(corner,{opacity:0,y:-20,duration:.16,ease:'power2.out'},.46)
   .to(wipe,{opacity:1,duration:.12,ease:'none'},.86)
   .to(copy,{opacity:0,duration:.08,ease:'power2.out'},.92)
   .to(noise,{opacity:0,duration:.14,ease:'none'},.92)
   .to(intro,{opacity:1,y:0,duration:.2,ease:'power3.out'},.98)
   .to(children,{opacity:1,y:0,duration:.24,stagger:.05,ease:'power2.out'},1.03)
   .to({},{duration:.45});
  measure();
 }
 addEventListener('scroll',queue,{passive:true});
 addEventListener('resize',queueMeasure,{passive:true});
 addEventListener('pageshow',queueMeasure);addEventListener('perri:ready',queueMeasure);
 document.addEventListener('visibilitychange',queue);
 reduced.addEventListener('change',configure);addEventListener('perri:motion',configure);
 if('ResizeObserver' in window){
  const observer=new ResizeObserver(queueMeasure);observer.observe(intro);if(nav)observer.observe(nav);
 }
 document.fonts.ready.then(queueMeasure);
 configure();
}
