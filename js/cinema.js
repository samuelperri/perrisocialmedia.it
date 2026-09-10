// A single film plays at a time. Scene buttons seek into the same approved film.
const allFilms=[...document.querySelectorAll('video')];
document.querySelectorAll('.cn-project').forEach(row=>{
 const video=row.querySelector('video'),buttons=[...row.querySelectorAll('.cn-frames button')];
 const screen=row.querySelector('.cn-screen');
 let preview=false,request=0,originalMuted=false;
 const fine=matchMedia('(hover:hover) and (pointer:fine)');
 function stopPreview(){
  ++request;
  if(preview){video.pause();video.muted=originalMuted;preview=false;}
 }
 screen.addEventListener('pointerenter',event=>{
  if(event.pointerType==='touch'||!fine.matches||!video.paused||document.hidden)return;
  originalMuted=video.muted;preview=true;video.muted=true;const token=++request;
  video.play().then(()=>{if(token!==request&&preview)stopPreview();}).catch(()=>{if(token===request)stopPreview();});
 });
 screen.addEventListener('pointerleave',stopPreview);
 // A deliberate interaction hands control back to the native player.
 video.addEventListener('pointerdown',()=>{if(preview){preview=false;++request;video.muted=originalMuted;}});
 video.addEventListener('keydown',()=>{if(preview){preview=false;++request;video.muted=originalMuted;}});

 video.addEventListener('play',()=>{allFilms.forEach(other=>{if(other!==video)other.pause();});row.classList.add('is-playing');});
 video.addEventListener('pause',()=>row.classList.remove('is-playing'));
 video.addEventListener('error',()=>row.querySelector('.cn-error').hidden=false);
 let pendingSeek;
 buttons.forEach(button=>button.addEventListener('click',()=>{
  video.pause();row.querySelector('.cn-error').hidden=true;buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  const fraction=Number(button.dataset.time),seek=()=>{if(fraction&&Number.isFinite(video.duration))video.currentTime=video.duration*fraction;else video.currentTime=0;};
  if(pendingSeek){video.removeEventListener('loadedmetadata',pendingSeek);pendingSeek=null;}
  if(video.getAttribute('src')!==button.dataset.src){video.src=button.dataset.src;video.poster=button.dataset.poster;}
  if(video.readyState>=1){seek();}else{pendingSeek=seek;video.addEventListener('loadedmetadata',pendingSeek,{once:true});video.preload='metadata';video.load();}
 }));
 new IntersectionObserver(entries=>{if(!entries[0].isIntersecting){stopPreview();video.pause();}},{threshold:.05}).observe(video);
});
document.querySelector('#selectedFilm')?.addEventListener('play',e=>allFilms.forEach(v=>{if(v!==e.target)v.pause();}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)allFilms.forEach(v=>v.pause());});
