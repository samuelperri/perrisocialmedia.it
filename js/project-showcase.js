// The image ribbon opens the complete approved photo collections.
(() => {
 const root=document.querySelector('#work.brand-ribbon-section');if(!root)return;
 const projects=JSON.parse(document.querySelector('#showcaseData').textContent);
 const dialog=document.querySelector('#projectDialog');
 const image=dialog.querySelector('#caseImage'),thumbs=dialog.querySelector('.sc-case-thumbs');
 const reduced=()=>!!window.perriMotionOff||matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pad=n=>String(n).padStart(2,'0');
 let caseIndex=0,photoIndex=0,lastTrigger;
 const frames=[...root.querySelectorAll('.brand-frame')];
 root.querySelector('.brand-ribbon').addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  const current=frames.indexOf(event.target);if(current<0)return;
  event.preventDefault();
  const next=event.key==='Home'?0:event.key==='End'?frames.length-1:(current+(event.key==='ArrowRight'?1:-1)+frames.length)%frames.length;
  frames[next].focus({preventScroll:true});
 });
 function showPhoto(index){
  const photos=projects[caseIndex].photos;photoIndex=(index+photos.length)%photos.length;
  const photo=photos[photoIndex];image.src=photo.src;image.alt=photo.alt;
  dialog.querySelector('#projectDialogDescription').textContent=`${pad(photoIndex+1)} / ${pad(photos.length)}`;
  [...thumbs.children].forEach((button,i)=>button.setAttribute('aria-pressed',String(i===photoIndex)));
  const selected=thumbs.children[photoIndex];
  const left=selected.getBoundingClientRect().left-thumbs.getBoundingClientRect().left+thumbs.scrollLeft-thumbs.clientWidth/2+selected.offsetWidth/2;
  thumbs.scrollTo({left,behavior:reduced()?'instant':'smooth'});
 }
 function openCase(index,trigger){
  caseIndex=index;lastTrigger=trigger;const project=projects[index];
  dialog.querySelector('#projectDialogTitle').textContent=project.title;
  dialog.querySelector('#caseCategory').textContent=project.category;
  dialog.querySelector('#caseDescription').textContent=project.detail;thumbs.replaceChildren();
  project.photos.forEach((photo,i)=>{
   const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Mostra fotografia ${i+1}`);
   const thumb=document.createElement('img');thumb.src=photo.thumb;thumb.alt='';thumb.loading='lazy';thumb.decoding='async';b.append(thumb);
   b.addEventListener('click',()=>showPhoto(i));thumbs.append(b);
  });
  dialog.showModal();dialog.scrollTop=0;showPhoto(0);
 }
 root.querySelectorAll('[data-case]').forEach(b=>b.addEventListener('click',()=>openCase(Number(b.dataset.case),b)));
 dialog.querySelector('.sc-close').addEventListener('click',()=>dialog.close());
 dialog.querySelector('[data-photo-prev]').addEventListener('click',()=>showPhoto(photoIndex-1));
 dialog.querySelector('[data-photo-next]').addEventListener('click',()=>showPhoto(photoIndex+1));
 dialog.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();showPhoto(photoIndex+(e.key==='ArrowRight'?1:-1));}});
 dialog.addEventListener('click',e=>{
  if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
 });
 dialog.addEventListener('close',()=>{lastTrigger?.focus({preventScroll:true});});
})();
