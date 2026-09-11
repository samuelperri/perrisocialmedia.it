(() => {
 const root=document.querySelector('#sectorGallery');if(!root)return;
 const projects=JSON.parse(document.querySelector('#showcaseData').textContent);
 const tabs=[...root.querySelectorAll('[role=tab]')],panel=root.querySelector('.sector-panel'),grid=root.querySelector('.sector-photo-grid'),more=root.querySelector('.sector-more'),count=root.querySelector('.sector-gallery-count');
 let active=2,shown=8;
 function render(animate=false){
  const project=projects[active];
  tabs.forEach(tab=>{const selected=Number(tab.dataset.sector)===active;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;if(selected)panel.setAttribute('aria-labelledby',tab.id);});
  grid.replaceChildren();
  project.photos.slice(0,shown).forEach((photo,index)=>{
   const button=document.createElement('button');button.className='sector-photo';button.type='button';button.dataset.case=active;button.dataset.photo=index;
   button.setAttribute('aria-label',`Apri ${project.selector}: fotografia ${index+1}`);button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-controls','projectDialog');
   const image=document.createElement('img');image.src=photo.src;image.alt=photo.alt;image.loading='lazy';image.decoding='async';image.width=640;image.height=800;
   button.append(image);grid.append(button);
  });
  count.textContent=`${String(project.photos.length).padStart(2,'0')} fotografie`;
  more.hidden=shown>=project.photos.length;
  panel.classList.remove('is-changing');
  if(animate&&!window.perriMotionOff&&!matchMedia('(prefers-reduced-motion:reduce)').matches){void panel.offsetWidth;panel.classList.add('is-changing');}
  window.lenis?.resize();window.ScrollTrigger?.refresh();
 }
 function select(tab){active=Number(tab.dataset.sector);shown=8;render(true);}
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>select(tab));
  tab.addEventListener('keydown',event=>{
   if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
   event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
   tabs[next].focus({preventScroll:true});select(tabs[next]);
  });
 });
 more.addEventListener('click',()=>{const firstNew=shown;shown+=8;render();grid.children[firstNew]?.focus({preventScroll:true});});
 render();
})();
