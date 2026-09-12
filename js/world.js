/* Logo belts keep their own visibility and motion controls. */
const profile=document.querySelector('.profile-section');
if(profile){
 const partners=profile.querySelector('.partners');
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const entered=[...profile.querySelectorAll('.profile-enter')];
 const motionOff=()=>reduced.matches||!!window.perriMotionOff;
 const pause=partners.querySelector('.partners-pause');
 let inView=true,userPaused=false;
 partners.querySelectorAll('.partner-group').forEach(group=>{
  const duplicate=group.cloneNode(true);
  duplicate.classList.add('partner-copy');duplicate.setAttribute('aria-hidden','true');duplicate.inert=true;
  group.after(duplicate);
 });
 partners.classList.add('is-ready');
 pause.addEventListener('click',()=>{
  userPaused=!userPaused;pause.setAttribute('aria-pressed',String(userPaused));
  pause.setAttribute('aria-label',userPaused?'Riprendi lo scorrimento dei loghi':'Metti in pausa lo scorrimento dei loghi');sync();
 });
 function sync(){
  partners.querySelectorAll('.partner-window').forEach(row=>row.tabIndex=motionOff()?0:-1);
  partners.classList.toggle('is-paused',!inView||document.hidden||motionOff()||userPaused);
  if(motionOff()){
   profile.classList.remove('has-motion');
   entered.forEach(item=>item.classList.add('is-visible'));
  }
 }
 if('IntersectionObserver' in window){
  const reveal=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}});
  },{rootMargin:'0px 0px 70px 0px',threshold:0});
  entered.forEach(item=>reveal.observe(item));
  if(!motionOff()&&!profile.querySelector('.profile-lens'))profile.classList.add('has-motion');
  new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;sync();},{rootMargin:'100px',threshold:0}).observe(partners);
 }
 document.addEventListener('visibilitychange',sync);
 addEventListener('pageshow',sync);addEventListener('perri:ready',sync);addEventListener('perri:motion',sync);
 reduced.addEventListener('change',sync);
 sync();
}
