import {GLTFLoader} from '../vendor/GLTFLoader.js';
import * as THREE from '../vendor/three.module.js';
import {RoundedBoxGeometry} from '../vendor/RoundedBoxGeometry.js';
const opening=document.querySelector('.opening'),mount=document.querySelector('#cameraCanvas');
const reduced=window.perriMotionOff||matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer,frame=0,visible=true,ready=false,failed=false;
try{
 renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
 mount.append(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.1,50),body=new THREE.Group();scene.add(body);
 const matte=new THREE.MeshStandardMaterial({color:0x151417,roughness:.67,metalness:.4});
 const grip=new THREE.MeshStandardMaterial({color:0x0a090c,roughness:.96,metalness:.1});
 const metal=new THREE.MeshStandardMaterial({color:0x4d4954,roughness:.3,metalness:.9});
 const purple=new THREE.MeshStandardMaterial({color:0x8b3dff,roughness:.28,metalness:.65,emissive:0x32104c,emissiveIntensity:.5});
 const glass=new THREE.MeshPhysicalMaterial({color:0x291142,metalness:.7,roughness:.12,clearcoat:1,clearcoatRoughness:.05});
 const black=new THREE.MeshStandardMaterial({color:0x08070a,roughness:.4,metalness:.6});
 function box(w,h,d,x,y,z,mat=matte,r=.08){const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,r),mat);m.position.set(x,y,z);body.add(m);return m;}
 function cylinder(radius,length,x,y,z,mat,segments=64){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,length,segments),mat);m.rotation.x=Math.PI/2;m.position.set(x,y,z);body.add(m);return m;}
 // An original studio-camera model, assembled from solid geometry.
 box(3.5,2.05,1.12,0,0,0,matte,.15);box(.8,2.13,1.43,-1.39,-.04,.16,grip,.16);
 box(1.32,.46,.9,-.1,1.12,-.08,matte,.1);box(.56,.19,.52,-.1,1.42,-.06,metal,.025);
 box(.85,.12,.45,-1.02,1.1,.05,metal,.03);
 const shutter=cylinder(.19,.13,-1.37,1.08,.28,purple,32);shutter.rotation.x=0;
 const dial=cylinder(.34,.18,1.15,1.07,-.08,black,48);dial.rotation.x=0;
 for(let i=0;i<24;i++){const t=i/24*Math.PI*2;box(.035,.16,.035,1.15+Math.cos(t)*.34,1.07,-.08+Math.sin(t)*.34,metal,.005);}
 const lens=new THREE.Group();body.add(lens);
 const rings=[];
 function lensPart(r,d,z,mat){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,d,80),mat);m.rotation.x=Math.PI/2;m.position.set(.28,0,z);lens.add(m);return m;}
 lensPart(.97,.2,.64,metal);lensPart(.89,.9,1.1,black);lensPart(.93,.19,1.47,grip);lensPart(.88,.48,1.8,matte);lensPart(.91,.12,2.08,metal);
 for(let i=0;i<50;i++){const t=i/50*Math.PI*2;const m=new THREE.Mesh(new THREE.BoxGeometry(.026,.027,.46),grip);m.position.set(.28+Math.cos(t)*.91,Math.sin(t)*.91,1.15);m.rotation.z=t;lens.add(m);}
 for(let i=0;i<6;i++){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.82-i*.085,.017,8,80),i===1?purple:metal);ring.position.set(.28,0,2.15+i*.013);lens.add(ring);rings.push(ring);
 }
 const front=new THREE.Mesh(new THREE.CircleGeometry(.73,80),glass);front.position.set(.28,0,2.14);lens.add(front);
 const iris=new THREE.Mesh(new THREE.CircleGeometry(.27,6),black);iris.position.set(.28,0,2.235);lens.add(iris);
 const shine=new THREE.Mesh(new THREE.CircleGeometry(.13,32),new THREE.MeshBasicMaterial({color:0xc7a5ff,transparent:true,opacity:.65}));shine.position.set(.04,.29,2.245);shine.scale.set(1,.42,1);lens.add(shine);
 const screen=new THREE.Mesh(new THREE.PlaneGeometry(2.25,1.45),glass);screen.rotation.y=Math.PI;screen.position.set(.13,-.06,-.576);body.add(screen);
 const led=new THREE.Mesh(new THREE.SphereGeometry(.055,12,8),new THREE.MeshBasicMaterial({color:0x8b3dff}));led.position.set(1.32,.6,.584);body.add(led);
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,512,128);ctx.fillStyle='#e7e2ee';ctx.font='bold 66px Arial';ctx.fillText('PERRI',16,88);ctx.font='18px Arial';ctx.fillText('VISUAL SYSTEM',280,83);
 const labelTex=new THREE.CanvasTexture(canvas);labelTex.colorSpace=THREE.SRGBColorSpace;
 const label=new THREE.Mesh(new THREE.PlaneGeometry(1.22,.305),new THREE.MeshBasicMaterial({map:labelTex,transparent:true}));label.position.set(.15,.8,.569);body.add(label);
 new GLTFLoader().load('models/sony-a7iv.glb',gltf=>{
   const model=gltf.scene;
   const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
   const scale=4.7/Math.max(size.x,size.y,size.z);
   model.position.sub(center);const normalized=new THREE.Group();normalized.add(model);normalized.scale.setScalar(scale);normalized.rotation.y=Math.PI;
   body.clear();body.add(normalized);render(performance.now());
   document.querySelector('.camera-caption').lastChild.textContent=' SONY α7 IV / VISUAL PRODUCTION';
 },undefined,()=>console.warn('Sony non disponibile: fotocamera di riserva attiva.'));
 scene.add(new THREE.AmbientLight(0xd7cbe4,2));
 const key=new THREE.DirectionalLight(0xffffff,5);key.position.set(-3,5,6);scene.add(key);
 const rim=new THREE.DirectionalLight(0x9f55ff,8);rim.position.set(4,1,-2);scene.add(rim);
 const fill=new THREE.DirectionalLight(0xbbb9f9,3);fill.position.set(-5,-2,2);scene.add(fill);
 let mx=0,my=0,rx=0,ry=0,last=0;
 function render(t){if(failed)return;
  const mobile=mount.clientWidth<700;rx+=(mx-rx)*.04;ry+=(my-ry)*.04;
  const progress=reduced?0:Math.max(0,Math.min(1,-opening.getBoundingClientRect().top/opening.offsetHeight));
  camera.position.set(0,0,mobile?12:10.9);camera.lookAt(0,0,0);
  body.rotation.set(-.16+(reduced?0:Math.sin(t*.00035)*.035)+ry*.08,-.52+rx*.16+progress*.65,-.22+progress*.18);
  body.position.set(mobile?.1:.3,(mobile?-.15:.12)+(reduced?0:Math.sin(t*.00065)*.1)-progress*.6,0);
  lens.position.z=progress*.35;
  renderer.render(scene,camera);
 }
 function tick(t){frame=0;if(!visible||document.hidden||!ready||reduced||failed)return;if(t-last>30){render(t);last=t;}frame=requestAnimationFrame(tick);}
 function start(){if(!frame&&visible&&ready&&!reduced&&!failed)frame=requestAnimationFrame(tick);}
 function resize(){renderer.setSize(mount.clientWidth,mount.clientHeight,false);camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();render(performance.now());}
 new ResizeObserver(resize).observe(mount);
 opening.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||reduced)return;mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5;});
 opening.addEventListener('pointerleave',()=>{mx=my=0;});
 new IntersectionObserver(e=>{visible=e[0].isIntersecting;if(!visible){cancelAnimationFrame(frame);frame=0;}else start();}).observe(opening);
 window.addEventListener('perri:ready',()=>{ready=true;start();},{once:true});
 // Visibility of the existing intro is independent from initial model preparation.
 ready=reduced||!document.body.classList.contains('is-loading');
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;}else start();});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();failed=true;opening.classList.remove('camera-ready');cancelAnimationFrame(frame);});
 resize();opening.classList.add('camera-ready');start();
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});labelTex.dispose();renderer.dispose();},{once:true});
}catch(e){opening.classList.remove('camera-ready');console.warn('Anteprima fotografica attiva: modello 3D non disponibile.');}
