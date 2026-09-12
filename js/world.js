/* Preserve the biography's text reveal; photographs sit freely on the page. */
const panel=document.querySelector('.about-visual');
const gsap=window.gsap;
if(panel&&gsap){
 const photos=[...panel.querySelectorAll('.about-print')];
 const lens=document.querySelector('.lens-section'),stage=lens.querySelector('.lens-stage');
 const reduce=matchMedia('(prefers-reduced-motion:reduce)');
 let stopped=!!window.perriMotionOff||reduce.matches,textEntered=false,wordsIn=null,raf=0,pageHidden=false;
 function splitWords(element,masked){
  element.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
  const text=element.textContent.trim().replace(/\s+/g,' ');element.textContent='';const words=[];
  text.split(' ').forEach((word,i)=>{
   if(masked&&i===3)element.append(document.createElement('br'));else if(i)element.append(document.createTextNode(' '));
   const span=document.createElement('span');span.className=masked?'about-word':'about-body-word';span.textContent=word;
   if(masked){const clip=document.createElement('span');clip.className='about-word-clip';clip.append(span);element.append(clip);}else element.append(span);
   words.push(span);
  });return words;
 }
 const titleWords=splitWords(document.querySelector('.about-story .lens-about-lead'),true);
 const bodyWords=splitWords(document.querySelector('.about-story .lens-about-text'),false);
 if(!stopped){gsap.set(titleWords,{yPercent:105,opacity:0});gsap.set(bodyWords,{opacity:.25,y:5});}
 function sync(){
  raf=0;
  const rect=lens.getBoundingClientRect(),progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,lens.offsetHeight-stage.offsetHeight)));
  const panelRect=panel.getBoundingClientRect();
  const visible=panelRect.bottom>0&&panelRect.top<innerHeight&&(stopped||progress>.63);
  if(visible&&!textEntered){
   textEntered=true;
   if(!stopped)wordsIn=gsap.timeline().to(titleWords,{yPercent:0,opacity:1,duration:.9,stagger:.026,ease:'power3.out'},.05).to(bodyWords,{opacity:1,y:0,duration:.85,stagger:.006,ease:'power2.out'},.42);
  }
  wordsIn?.paused(!visible||document.hidden||pageHidden);
  if(stopped){gsap.set([...titleWords,...bodyWords],{opacity:1,y:0,yPercent:0});photos.forEach(photo=>photo.style.removeProperty('transform'));return;}
  if(!visible||document.hidden||pageHidden)return;
  const drift=Math.max(-1,Math.min(1,(innerHeight*.52-(panelRect.top+panelRect.height/2))/innerHeight));
  photos.forEach((photo,i)=>{photo.style.transform=`translate3d(0,${(drift*[18,-22,16][i]).toFixed(2)}px,0)`;});
 }
 function queue(){if(!raf)raf=requestAnimationFrame(sync);}
 addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue,{passive:true});
 new IntersectionObserver(queue,{threshold:0}).observe(panel);
 reduce.addEventListener('change',()=>{stopped=!!window.perriMotionOff||reduce.matches;queue();});
 addEventListener('perri:motion',event=>{stopped=event.detail||reduce.matches;queue();});
 document.addEventListener('visibilitychange',queue);
 addEventListener('pagehide',()=>{pageHidden=true;queue();});addEventListener('pageshow',()=>{pageHidden=false;queue();});
 sync();
}
