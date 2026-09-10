/* Three photographic planes replace the orbit. Existing zoom and biography stay intact. */
const panel=document.querySelector('.about-visual');
const mount=document.querySelector('#worldCanvas');
const gsap=window.gsap;
if(panel&&mount&&gsap) initEditorialAbout();

function initEditorialAbout(){
 const photos=[
  {key:'70',label:'Luce e spazio.'},
  {key:'01',label:'Dentro l’azione.'},
  {key:'14',label:'Il gusto, da vicino.'},
  {key:'55',label:'Persone. Competenze.'},
  {key:'63',label:'Storie da incontrare.'},
  {key:'03',label:'L’istante giusto.'}
 ];
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const lens=document.querySelector('.lens-section'),stage=lens.querySelector('.lens-stage');
 let stopped=!!window.perriMotionOff||reduce.matches,visible=false,hovered=false,pageHidden=false;
 let entered=false,textEntered=false,current=0,hold=null,transition=null,entrance=null,wordsIn=null,raf=0,loaded=false;
 const states=[
  {xPercent:-115,yPercent:-60,z:-260,rotationY:24,rotationZ:-18,scale:.76,opacity:.30},
  {xPercent:-88,yPercent:-43,z:-95,rotationY:15,rotationZ:-13,scale:.9,opacity:.58},
  {xPercent:-50,yPercent:-50,z:38,rotationY:-7,rotationZ:-4,scale:1,opacity:1},
  {xPercent:-11,yPercent:-52,z:-150,rotationY:-15,rotationZ:11,scale:.9,opacity:.65},
  {xPercent:16,yPercent:-32,z:-290,rotationY:-25,rotationZ:18,scale:.76,opacity:.32}
 ];
 const header=document.createElement('div');header.className='deck-header';header.innerHTML='<span><i></i>IL MIO SGUARDO</span><span>FOTO / VIDEO</span>';
 const space=document.createElement('div');space.className='deck-space';
 const rig=document.createElement('div');rig.className='deck-rig';space.append(rig);
 let slots=Array.from({length:5},()=>{const frame=document.createElement('figure');frame.className='deck-frame';const img=document.createElement('img');img.alt='';img.decoding='async';frame.append(img);rig.append(frame);return frame;});
 const footer=document.createElement('div');footer.className='deck-footer';footer.innerHTML='<span class="deck-caption"></span><span class="deck-index"></span><div class="deck-track"><span></span></div>';
 mount.replaceChildren(header,space,footer);
 const label=footer.querySelector('.deck-caption'),index=footer.querySelector('.deck-index'),bar=footer.querySelector('.deck-track span');
 const updateLabel=()=>{label.textContent=photos[current].label;index.textContent=String(current+1).padStart(2,'0')+' / '+String(photos.length).padStart(2,'0');};
 function setPhoto(frame,i){frame.querySelector('img').src=`media/${photos[(i+photos.length)%photos.length].key}.webp`;}
 slots.forEach((frame,i)=>setPhoto(frame,i-2));updateLabel();
 slots.forEach((frame,i)=>gsap.set(frame,states[i]));
 // Decode first, retaining the original static fallback if any photograph fails.
 Promise.all(photos.map(photo=>{const image=new Image();image.src=`media/${photo.key}.webp`;return image.decode();})).then(()=>{loaded=true;panel.classList.add('is-editorial');sync();}).catch(()=>{mount.hidden=true;sync();});
 const lead=document.querySelector('.about-story .lens-about-lead');
 const body=document.querySelector('.about-story .lens-about-text');
 function splitWords(element,masked){
  element.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));
  const text=element.textContent.trim().replace(/\s+/g,' ');element.textContent='';const words=[];
  text.split(' ').forEach((word,i)=>{if(masked&&i===3)element.append(document.createElement('br'));else if(i)element.append(document.createTextNode(' '));const span=document.createElement('span');span.className=masked?'about-word':'about-body-word';span.textContent=word;
   if(masked){const clip=document.createElement('span');clip.className='about-word-clip';clip.append(span);element.append(clip);}else element.append(span);words.push(span);
  });return words;
 }
 const titleWords=splitWords(lead,true),bodyWords=splitWords(body,false);
 if(!stopped){gsap.set(titleWords,{yPercent:105,opacity:0});gsap.set(bodyWords,{opacity:.25,y:5});}
 function canMove(){return visible&&loaded&&!stopped&&!hovered&&!document.hidden&&!pageHidden;}
 function scheduleNext(){
  hold?.kill();gsap.set(bar,{scaleX:stopped?1:0});
  if(stopped)return;
  hold=gsap.to(bar,{scaleX:1,duration:2.6,ease:'none',paused:!canMove(),onComplete:advance});
 }
 function advance(){
  const retiring=slots[0];
  transition=gsap.timeline({paused:!canMove(),onComplete:()=>{
   slots=[...slots.slice(1),retiring];current=(current+1)%photos.length;updateLabel();transition=null;scheduleNext();
  }});
  slots.slice(1).forEach((frame,i)=>transition.to(frame,{...states[i],duration:1.05,ease:'power3.inOut'},0));
  transition.to(retiring,{z:-380,opacity:0,duration:.35,ease:'power2.in'},0)
   .call(()=>{setPhoto(retiring,current+3);gsap.set(retiring,{...states[4],xPercent:35,z:-380,opacity:0});},[],.36)
   .to(retiring,{...states[4],duration:.69,ease:'power3.out'},.36);
 }
 function enter(){
  entered=true;
  if(stopped){gsap.set(bar,{scaleX:1});return;}
  entrance=gsap.timeline({onComplete:scheduleNext});
  slots.forEach((frame,i)=>entrance.fromTo(frame,{xPercent:-50,yPercent:-30,z:-220,rotationY:0,rotationZ:0,scale:.82,opacity:0},{...states[i],duration:1.65,ease:'power3.out'},i*.1));
 }
 function sync(){
  raf=0;const rect=lens.getBoundingClientRect();const progress=Math.max(0,Math.min(1,-rect.top/Math.max(1,lens.offsetHeight-stage.offsetHeight)));
  const panelRect=panel.getBoundingClientRect();visible=panelRect.bottom>0&&panelRect.top<innerHeight&&(stopped||progress>.63);
  // Biography visibility never depends on a successful photograph download.
  if(visible&&!textEntered){textEntered=true;if(!stopped)wordsIn=gsap.timeline().to(titleWords,{yPercent:0,opacity:1,duration:.9,stagger:.026,ease:'power3.out'},.05).to(bodyWords,{opacity:1,y:0,duration:.85,stagger:.006,ease:'power2.out'},.42);}
  if(visible&&!entered&&loaded)enter();
  const active=canMove();hold?.paused(!active);transition?.paused(!active);
  const visibleMotion=visible&&!stopped&&!document.hidden&&!pageHidden;entrance?.paused(!visibleMotion);wordsIn?.paused(!visibleMotion);
  if(stopped){gsap.set([...titleWords,...bodyWords],{opacity:1,y:0,yPercent:0});gsap.set(rig,{rotationX:0,rotationY:0});}
 }
 function onScroll(){if(!raf)raf=requestAnimationFrame(sync);}
 addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onScroll);
 new IntersectionObserver(onScroll,{threshold:0}).observe(panel);
 panel.addEventListener('pointerenter',()=>{if(!fine.matches)return;hovered=true;sync();});
 panel.addEventListener('pointermove',event=>{if(stopped||!visible||!fine.matches)return;const rect=panel.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width-.5,y=(event.clientY-rect.top)/rect.height-.5;gsap.to(rig,{rotationY:x*10,rotationX:-y*8,duration:.85,ease:'power2.out',overwrite:true});});
 panel.addEventListener('pointerleave',()=>{hovered=false;gsap.to(rig,{rotationY:0,rotationX:0,duration:1,ease:'power2.out',overwrite:true});sync();});
 reduce.addEventListener('change',()=>{stopped=!!window.perriMotionOff||reduce.matches;sync();});
 addEventListener('perri:motion',event=>{stopped=event.detail||reduce.matches;sync();});
 document.addEventListener('visibilitychange',sync);addEventListener('pagehide',()=>{pageHidden=true;sync();});addEventListener('pageshow',()=>{pageHidden=false;sync();});sync();
}
