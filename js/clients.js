// Native scroll keeps the card stack reversible, including after an idle pause.
const section=document.querySelector('#clients');
if(section){
 const rail=section.querySelector('.client-rail'),cards=[...section.querySelectorAll('.client-card')];
 const desktop=matchMedia('(min-width:1024px) and (min-height:650px)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const motionOff=()=>reduced.matches||!!window.perriMotionOff;
 let stacked=false,active=-1,visible=false,frame=0,travel=1,stride=1,timer=0;
 const states=cards.map(card=>{
  const slides=JSON.parse(card.dataset.slides),front=card.querySelector('.client-photo');
  const back=front.cloneNode();back.removeAttribute('src');back.classList.remove('is-on');front.after(back);
  const controls=card.querySelector('.client-story-controls');
  const buttons=slides.map((slide,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Immagine ${i+1} — ${card.querySelector('h3').textContent}`);b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>show(cards.indexOf(card),i));controls.append(b);return b;});
  const pause=card.querySelector('.client-pause');
  const state={card,slides,images:[front,back],buttons,pause,index:0,layer:0,paused:false,request:0};
  pause.addEventListener('click',()=>{state.paused=!state.paused;updatePause(state);schedule();});
  return state;
 });
 function updatePause(s){const paused=s.paused||motionOff();s.pause.setAttribute('aria-label',paused?'Avvia le immagini':'Metti in pausa le immagini');s.pause.setAttribute('aria-pressed',String(paused));s.pause.querySelector('span').textContent=paused?'▶':'Ⅱ';s.pause.hidden=motionOff();}
 function schedule(){clearTimeout(timer);if(active<0||!visible||document.hidden||motionOff()||states[active].paused)return;timer=setTimeout(()=>show(active,(states[active].index+1)%states[active].slides.length),5000);}
 async function show(which,index){
  const s=states[which];if(!s||index===s.index){schedule();return;}
  const ticket=++s.request,next=s.images[1-s.layer],slide=s.slides[index];
  next.src=slide.src;next.alt=slide.alt;next.classList.toggle('is-design',slide.fit==='contain');
  try{await next.decode();}catch{if(ticket===s.request)schedule();return;}
  if(ticket!==s.request)return;
  s.images[s.layer].classList.remove('is-on');next.classList.add('is-on');s.layer=1-s.layer;s.index=index;
  s.buttons.forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));schedule();
 }
 function setActive(index){
  if(index===active)return;active=index;
  cards.forEach((card,i)=>{const selected=i===index;card.classList.toggle('is-active',selected);card.inert=stacked&&!selected;});
  section.style.setProperty('--client-bg',cards[index].dataset.background);section.style.setProperty('--client-ink',cards[index].dataset.ink);
  schedule();
 }
 function draw(){frame=0;if(!cards.length)return;
  if(stacked){const rect=section.getBoundingClientRect();const progress=Math.max(0,Math.min(cards.length-1,-rect.top/travel*(cards.length-1)));
   cards.forEach((card,i)=>{const x=Math.max(0,i-progress)*stride;card.style.transform=`translate3d(${x.toFixed(2)}px,0,0)`;});
   setActive(Math.min(cards.length-1,Math.floor(progress+.55)));
  }else{let index=0,distance=Infinity;const center=rail.getBoundingClientRect().left+rail.clientWidth/2;cards.forEach((card,i)=>{const r=card.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-center);if(d<distance){distance=d;index=i;}});setActive(index);}
 }
 function queue(){if(!frame)frame=requestAnimationFrame(draw);}
 function measure(){
  const wasStacked=stacked;
  stacked=desktop.matches&&!motionOff();section.classList.toggle('is-desktop',stacked);
  travel=Math.max(560,innerHeight*.9)*(cards.length-1);section.style.setProperty('--client-travel',`${travel}px`);
  stride=cards[0].getBoundingClientRect().width+22;
  cards.forEach((card,i)=>{card.style.zIndex=String(i+1);if(!stacked)card.style.removeProperty('transform');card.inert=false;});
  states.forEach(updatePause);active=-1;queue();schedule();
  if(wasStacked!==stacked)requestAnimationFrame(()=>{window.ScrollTrigger?.refresh();window.lenis?.resize();});
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;queue();schedule();},{rootMargin:'100px',threshold:0}).observe(section);
 window.addEventListener('scroll',()=>{if(visible)queue();},{passive:true});rail.addEventListener('scroll',queue,{passive:true});
 window.addEventListener('resize',measure,{passive:true});window.addEventListener('pageshow',measure);window.addEventListener('perri:ready',measure);
 window.addEventListener('load',()=>{measure();window.ScrollTrigger?.refresh();window.lenis?.resize();},{once:true});
 desktop.addEventListener('change',measure);reduced.addEventListener('change',measure);window.addEventListener('perri:motion',measure);
 document.addEventListener('visibilitychange',()=>{queue();schedule();});window.addEventListener('pagehide',()=>clearTimeout(timer));
 rail.addEventListener('keydown',event=>{
  if(event.target!==rail||!['ArrowRight','ArrowLeft'].includes(event.key))return;
  const index=Math.max(0,Math.min(cards.length-1,active+(event.key==='ArrowRight'?1:-1)));event.preventDefault();
  if(stacked){const top=section.getBoundingClientRect().top+scrollY+travel*index/(cards.length-1);if(window.lenis)window.lenis.scrollTo(top);else window.scrollTo({top,behavior:motionOff()?'instant':'smooth'});}
  else rail.scrollTo({left:cards[index].offsetLeft-rail.offsetLeft-(rail.clientWidth-cards[index].offsetWidth)/2,behavior:motionOff()?'instant':'smooth'});
 });
 measure();
}
