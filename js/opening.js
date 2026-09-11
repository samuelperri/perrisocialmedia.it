// Muted inline playback, with a real play control when the browser refuses autoplay.
const opening=document.querySelector('.opening-film');
const openingVideo=document.querySelector('#openingFilm');
if(opening&&openingVideo){
 const control=opening.querySelector('.opening-play');
 const preference=matchMedia('(prefers-reduced-motion:reduce)');
 let visible=false,ready=!document.body.classList.contains('is-loading'),attempting=false,manual=false,userPaused=false;
 const reduce=()=>!!window.perriMotionOff||preference.matches||!!navigator.connection?.saveData;
 const canShow=()=>visible&&ready&&!document.hidden&&!document.querySelector('dialog[open]');
 openingVideo.defaultMuted=true;openingVideo.muted=true;openingVideo.playsInline=true;
 function updateControl(){
  const paused=openingVideo.paused;
  control.hidden=!ready;
  control.textContent=paused?'Riproduci video':'Pausa video';
  control.setAttribute('aria-label',paused?'Riproduci il video di apertura':'Metti in pausa il video di apertura');
  control.classList.toggle('is-paused',paused);
 }
 function play(){
  if(attempting||!openingVideo.paused)return;
  attempting=true;
  openingVideo.play().then(()=>{
   if(!canShow()||userPaused||(reduce()&&!manual))openingVideo.pause();
  }).catch(()=>{updateControl();}).finally(()=>{attempting=false;updateControl();});
 }
 function syncOpening(){
  document.body.classList.toggle('opening-visible',visible);
  if(!canShow()||userPaused||(reduce()&&!manual)){openingVideo.pause();updateControl();return;}
  play();
 }
 control.addEventListener('click',()=>{
  if(openingVideo.paused){manual=true;userPaused=false;openingVideo.muted=true;if(openingVideo.error)openingVideo.load();play();}
  else{userPaused=true;openingVideo.pause();}
  updateControl();
 });
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.2;syncOpening();},{threshold:[0,.2,.5]}).observe(opening);
 window.addEventListener('perri:ready',()=>{ready=true;syncOpening();});
 openingVideo.addEventListener('playing',updateControl);
 openingVideo.addEventListener('pause',updateControl);
 openingVideo.addEventListener('canplay',syncOpening);
 openingVideo.addEventListener('error',()=>{control.hidden=false;control.textContent='Riprova il video';});
 window.addEventListener('perri:motion',syncOpening);preference.addEventListener('change',syncOpening);
 document.querySelectorAll('dialog').forEach(d=>new MutationObserver(syncOpening).observe(d,{attributes:true,attributeFilter:['open']}));
 document.addEventListener('visibilitychange',syncOpening);
 window.addEventListener('pagehide',()=>openingVideo.pause());
 window.addEventListener('pageshow',syncOpening);
}
