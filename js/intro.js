(() => {
 const intro=document.getElementById('studioIntro');
 if(!intro)return;
 const track=intro.querySelector('.intro-track');
 const group=track.firstElementChild;
 // Three equal groups cover the viewport even on wide screens, without a jump.
 for(let i=0;i<2;i++)track.append(group.cloneNode(true));
 const videos=[...intro.querySelectorAll('video')];
 const visibleVideos=new Set();
 const preference=matchMedia('(prefers-reduced-motion:reduce)');
 const control=intro.querySelector('.intro-motion');
 let onScreen=false,userPaused=false,pageActive=true;
 const canMove=()=>onScreen&&pageActive&&!document.hidden&&!userPaused&&!preference.matches&&!window.perriMotionOff&&!navigator.connection?.saveData;
 function sync(){
  const moving=canMove();
  intro.classList.toggle('is-moving',moving);
  control.hidden=preference.matches||!!window.perriMotionOff||!!navigator.connection?.saveData;
  control.setAttribute('aria-pressed',String(!moving));
  control.setAttribute('aria-label',moving?'Metti in pausa le immagini':'Riprendi le immagini');
  for(const video of videos){
   if(!moving||!visibleVideos.has(video)){video.pause();continue;}
   if(!video.getAttribute('src')){video.src=video.dataset.src;video.load();}
   if(video.paused&&!video.dataset.pending){
    video.dataset.pending='true';
    video.play().then(()=>{
     if(!canMove()||!visibleVideos.has(video))video.pause();
     else video.classList.add('is-playing');
    }).catch(()=>{}).finally(()=>{delete video.dataset.pending;});
   }
  }
 }
 const videoObserver=new IntersectionObserver(entries=>{
  for(const entry of entries){
   if(entry.isIntersecting)visibleVideos.add(entry.target);else visibleVideos.delete(entry.target);
  }
  sync();
 },{threshold:0});
 videos.forEach(video=>{
  video.muted=true;video.defaultMuted=true;
  video.addEventListener('error',()=>video.classList.remove('is-playing'));
  videoObserver.observe(video);
 });
 new IntersectionObserver(entries=>{onScreen=entries[0].isIntersecting;sync();},{threshold:0}).observe(intro);
 // Navigation returns as soon as the next section reaches the top of the page.
 const nav=document.getElementById('nav');
 new IntersectionObserver(entries=>{
  const atIntro=entries[0].isIntersecting;
  document.body.classList.toggle('intro-visible',atIntro);
  if(nav)nav.inert=atIntro;
 },{threshold:0}).observe(intro);
 control.addEventListener('click',()=>{userPaused=!userPaused;sync();});
 document.addEventListener('visibilitychange',sync);
 preference.addEventListener('change',sync);
 addEventListener('perri:motion',sync);
 addEventListener('pagehide',()=>{pageActive=false;sync();});
 addEventListener('pageshow',()=>{pageActive=true;sync();});
})();
