import {patches} from './camera-registration-data.js?v=20260915';

// Register the supplied drawing locally without editing or redrawing its pixels.
// Every patch shares its edge with its neighbours; the original PNG is loaded once.
export function registerCameraDrawing(image){
 const ns='http://www.w3.org/2000/svg';
 const node=(name,attrs={})=>{
  const el=document.createElementNS(ns,name);
  for(const [key,value] of Object.entries(attrs))el.setAttribute(key,String(value));
  return el;
 };
 const svg=node('svg',{viewBox:'0 0 1536 1024',width:1536,height:1024,
  class:image.className,role:'img','aria-label':image.alt,'data-registered':'true'});
 const defs=node('defs'),source=node('image',{id:'camera-drawing-source',href:image.getAttribute('src'),width:1536,height:1024});
 defs.append(source);svg.append(defs);
 patches.forEach(({points,matrix},index)=>{
  const id='camera-registration-'+index;
  const clip=node('clipPath',{id,clipPathUnits:'userSpaceOnUse'});
  // A subpixel overlap prevents transparent antialiasing seams between patches.
  const cx=points.reduce((sum,p)=>sum+p[0],0)/3,cy=points.reduce((sum,p)=>sum+p[1],0)/3;
  const expanded=points.map(([x,y])=>{
   const distance=Math.hypot(x-cx,y-cy)||1;
   return [x+(x-cx)*.25/distance,y+(y-cy)*.25/distance].join(',');
  }).join(' ');
  clip.append(node('polygon',{points:expanded}));defs.append(clip);
  const group=node('g',{'clip-path':'url(#'+id+')'});
  group.append(node('use',{href:'#camera-drawing-source',transform:'matrix('+matrix.join(' ')+')'}));
  svg.append(group);
 });
 image.replaceWith(svg);return svg;
}
