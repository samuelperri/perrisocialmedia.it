// A passive ribbon: rotate one photograph at a time only while it is in view.
(() => {
 const root=document.querySelector('.brand-ribbon');if(!root)return;
 const projects=JSON.parse(document.querySelector('#ribbonData').textContent);
 const frames=[...root.querySelectorAll('.brand-frame')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const positions=frames.map((frame,i)=>projects[i].photos.findIndex(photo=>frame.firstElementChild.getAttribute('src')===photo.src));
 let visible=false,timer,frameIndex=0,busy=false;
 const active=()=>visible&&!document.hidden&&!reduced.matches&&!window.perriMotionOff;
 function schedule(){clearTimeout(timer);if(active()&&!busy)timer=setTimeout(advance,4000);}
 async function advance(){
  if(!active())return;busy=true;
  const i=frameIndex++%frames.length,frame=frames[i],photos=projects[i].photos;
  const nextPosition=(positions[i]+1)%photos.length,photo=photos[nextPosition];
  const image=new Image();image.className='brand-next';image.alt=photo.alt;image.decoding='async';image.draggable=false;image.src=photo.src;
  try{
   await image.decode();
   if(!active())return;
   const previous=frame.firstElementChild;frame.append(image);
   await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
   image.classList.add('is-visible');
   await new Promise(resolve=>setTimeout(resolve,850));
   previous.remove();image.className='';positions[i]=nextPosition;
  }catch{/* Keep the current photo when a connection cannot load the next one. */}
  finally{busy=false;schedule();}
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.15}).observe(root);
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 window.addEventListener('perri:motion',schedule);window.addEventListener('pagehide',()=>clearTimeout(timer));window.addEventListener('pageshow',schedule);
})();
