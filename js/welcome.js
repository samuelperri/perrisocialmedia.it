// A quiet greeting: one timer while the opened camera scene is in view.
export function createWelcome(element){
 const words=[['benvenuto','it'],['hello','en'],['bonjour','fr'],['hola','es'],['willkommen','de'],['olá','pt']];
 const layers=[...element.children];
 let word=0,front=0,timer=0;
 function stop(){clearInterval(timer);timer=0;}
 function next(){
  word=(word+1)%words.length;
  const incoming=1-front;
  layers[incoming].textContent=words[word][0];layers[incoming].lang=words[word][1];
  layers[front].classList.remove('is-current');layers[incoming].classList.add('is-current');front=incoming;
 }
 return {
  update({visible,reduced}){
   element.classList.toggle('is-visible',visible);
   element.classList.toggle('is-still',reduced);
   if(!visible||reduced){stop();return;}
   if(!timer)timer=setInterval(next,3600);
  },
  stop
 };
}
