const toggle=document.getElementById('motionToggle');
let off=window.perriMotionOff;
if(off){
 document.body.classList.add('motion-off');document.body.classList.remove('is-loading');
 toggle.textContent='Movimento: ridotto';toggle.setAttribute('aria-pressed','true');
 document.querySelectorAll('.faq-q').forEach(button=>button.addEventListener('click',()=>{
  const item=button.closest('.faq-item');item.classList.toggle('open');
  item.querySelector('.faq-a').style.maxHeight=item.classList.contains('open')?item.querySelector('.faq-a').scrollHeight+'px':'0';
 }));
}
toggle.addEventListener('click',()=>{
 try{sessionStorage.setItem('perri-motion',off?'on':'off');}catch{}
 const url=new URL(location.href);url.searchParams.set('motion',off?'on':'off');location.replace(url.href);
});
document.querySelectorAll('.faq-q').forEach((button,i)=>{
 const answer=button.nextElementSibling;answer.id=`faq-answer-${i}`;button.setAttribute('aria-controls',answer.id);button.setAttribute('aria-expanded','false');
 button.addEventListener('click',()=>queueMicrotask(()=>document.querySelectorAll('.faq-q').forEach(b=>b.setAttribute('aria-expanded',String(b.closest('.faq-item').classList.contains('open'))))));
});
const videos=[...document.querySelectorAll('video')];
const videoObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{
 if(!isIntersecting||document.hidden||off)target.pause();
 else if(target.closest('.is-active'))target.play().catch(()=>{});
}),{threshold:.05});
videos.forEach(video=>videoObserver.observe(video));
document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause());});
