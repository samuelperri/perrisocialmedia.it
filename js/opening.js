// Autoplay only while the opening is visible. The poster remains the fallback.
const opening=document.querySelector('.opening-film');
const openingVideo=document.querySelector('#openingFilm');
if(opening&&openingVideo){
 let visible=false,ready=!document.body.classList.contains('is-loading');
 function syncOpening(){
  document.body.classList.toggle('opening-visible',visible);
  const reduced=window.perriMotionOff||matchMedia('(prefers-reduced-motion:reduce)').matches||navigator.connection?.saveData;
  if(!visible||!ready||document.hidden||reduced){openingVideo.pause();return;}
  if(document.querySelector('dialog[open]'))return;
  openingVideo.muted=true;openingVideo.play().catch(()=>{});
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.2;syncOpening();},{threshold:[0,.2,.5]}).observe(opening);
 window.addEventListener('perri:ready',()=>{ready=true;syncOpening();});
 document.addEventListener('visibilitychange',syncOpening);
 window.addEventListener('pagehide',()=>openingVideo.pause());
 window.addEventListener('pageshow',syncOpening);
}
