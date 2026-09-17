import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { bendPoint, coverUV, PREVIEW_END, OPEN_THRESHOLD } from './mapping.js';
import { DUO, UNIT, innerPortraitUV } from './device.js';
import { INTRO_DURATION, cinematicPose } from './cinematic.js';
import './style.css';

const icons = {
 play: '<path d="m9 5 11 7-11 7z"/>', pause:'<path d="M9 5v14M16 5v14"/>',
 upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 reset:'<path d="M4 10a8 8 0 1 1 1 8M4 4v6h6"/>',
 expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
 phone:'<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4"/>',
 duo:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M12 4v16"/>',
 sound:'<path d="m11 4-6 5H2v6h3l6 5zM16 8l6 8m0-8-6 8"/>',
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
document.querySelector('#app').innerHTML = `
 <header><a class="wordmark" href="./" aria-label="Pourpour home">pourpour<span class="brand-dot">®</span></a><div class="studio-label"><span></span> DUO STUDIO</div><button id="upload" class="upload">${icon('upload')}<span>Use your video</span></button><input id="file" type="file" accept="video/*" hidden></header>
 <main><section class="intro"><div class="eyebrow">A LITTLE COFFEE. A WHOLE NEW CANVAS.</div><h1>Your daily ritual.<br><em>Unfolded.</em></h1><p>One coffee experience. Two ways to enjoy it.<br>Meet pourpour on a screen that opens up.</p></section>
 <div id="stage" role="img" aria-label="Interactive 3D foldable phone. Drag to rotate, pinch or scroll to zoom."></div>
 <aside class="finish"><span>FINISH</span><button class="swatch active" data-color="#d5d4d0" data-name="Star White" aria-label="Star White" aria-pressed="true" style="--swatch:#e3e2dd"></button><button class="swatch" data-color="#292d36" data-name="Night Sky" aria-label="Night Sky" aria-pressed="false" style="--swatch:#292d36"></button></aside>
 <div id="loading" class="loading"><span class="spinner"></span><span id="load-text">Preparing your coffee experience</span><button id="retry" hidden>Try again</button></div>
 <div class="stage-tools"><button id="reset" title="Reset view" aria-label="Reset view">${icon('reset')}</button><button id="fullscreen" title="Fullscreen" aria-label="Fullscreen">${icon('expand')}</button></div>
 <section class="control-panel" aria-label="Experience controls"><div class="fold-top"><div><span class="small-label">MAKE ROOM FOR MORE</span><h2>Unfold the experience</h2></div><output id="angle">0<span>°</span></output></div><div class="fold-slider"><span>${icon('phone')}</span><input id="fold" type="range" min="0" max="180" value="0" step="0.1" aria-label="Fold angle in degrees"><span>${icon('duo')}</span></div><div class="presets"><button data-angle="0" class="selected">Closed</button><button data-angle="90">Halfway</button><button data-angle="180">Fully open</button></div><div class="playback"><button id="play" aria-label="Pause video">${icon('pause')}</button><div class="clip-info"><strong id="clip-name">The coffee ritual</strong><span id="play-state">Cover display · 3.8s preview</span></div><span id="time">0:00</span><button id="sound" aria-label="Unmute video" title="Unmute video">${icon('sound')}</button></div></section>
 </main><footer><span>CRAFTED FOR YOUR EVERYDAY.</span><span>A pourpour concept experience <span class="footer-star">✳</span></span></footer>
 <video id="video" src="/coffee-duo-full.mp4" muted playsinline preload="auto" hidden></video>`;

const $ = id => document.getElementById(id);
const video = $('video');
$('clip-name').textContent='Full recording · Tap guide';
const film={active:new URLSearchParams(location.search).get('mode')!=='manual',intro:0,paused:false,started:false};
document.querySelector('.presets').insertAdjacentHTML('afterend','<div class="film-actions"><button id="replay-film">↻ Replay animation</button><button id="explore">Explore freely</button></div>');
let manualRollOffset=0;
let currentAngle = 0, targetAngle = 0, opened = false, previewHeld = false, userPaused = false, objectURL;
let sourceAspect = 9 / 19.5, ready = false;
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
$('stage').appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
camera.position.set(0, 0.3, 14.2);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 9; controls.maxDistance = 20;
controls.target.set(0, 0, 0);
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.04).texture;
room.dispose(); pmrem.dispose();
scene.add(new THREE.HemisphereLight(0xffffff, 0x8d7963, 1.4));
const key = new THREE.DirectionalLight(0xfff8ea, 3); key.position.set(-3, 5, 6); scene.add(key);
const rim = new THREE.DirectionalLight(0xffffff, 3); rim.position.set(5, 1, -2); scene.add(rim);
const phone = new THREE.Group(); scene.add(phone);
phone.rotation.set(-0.07, -0.15, -0.035);
const w = DUO.openWidth*UNIT/2, h = DUO.height*UNIT;
const depth=DUO.leafDepth*UNIT, screenZ=depth/2+0.005;
const b=(DUO.closedDepth*UNIT-2*depth-0.01)*Math.PI/4;
const left = new THREE.Group(), right = new THREE.Group(); phone.add(left, right);
const metal = new THREE.MeshStandardMaterial({ color: '#d5d4d0', metalness: 0.92, roughness: 0.26 });
const backMat = new THREE.MeshPhysicalMaterial({ color: '#e3e2dd', metalness: 0.2, roughness: 0.3, clearcoat: 0.6 });
const black = new THREE.MeshStandardMaterial({ color: '#08090a', roughness: 0.23, metalness: 0.4 });
function box(group, width, height, depth, radius, material, x, y, z, hingeSide=0) {
 let geometry;
 {
  const shape=new THREE.Shape(),a=-width/2,c=-height/2,r=Math.min(radius,width/2,height/2);
  const rl=hingeSide===-1?0.012:r,rr=hingeSide===1?0.012:r;
  shape.moveTo(a+rl,c);shape.lineTo(a+width-rr,c);shape.quadraticCurveTo(a+width,c,a+width,c+rr);
  shape.lineTo(a+width,c+height-rr);shape.quadraticCurveTo(a+width,c+height,a+width-rr,c+height);
  shape.lineTo(a+rl,c+height);shape.quadraticCurveTo(a,c+height,a,c+height-rl);
  shape.lineTo(a,c+rl);shape.quadraticCurveTo(a,c,a+rl,c);
  geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:16});geometry.translate(0,0,-depth/2);
 }
 const mesh = new THREE.Mesh(geometry, material);
 mesh.position.set(x,y,z); group.add(mesh); return mesh;
}
for (const [group, sign] of [[left,-1],[right,1]]) {
 const x = sign * (w-b)/2;
 box(group,w-b,h,depth,0.27,metal,x,0,0,-sign);
 box(group,w-b-0.035,h-0.035,0.009,0.25,backMat,x,0,-depth/2+0.003,-sign);
 box(group,w-b-0.035,h-0.035,0.008,0.25,black,x,0,depth/2-0.003,-sign);
 // Narrow antenna inlays, inset into the metal rails.
 for (const y of [-1.7,1.6]) box(group,0.008,0.03,depth-0.02,0.003,backMat,x+sign*(w-b)/2,y,0);
}
box(left,w-b-0.035,h-0.035,0.004,0.25,black,-(w-b)/2,0,-depth/2-0.002,1);
// The full recording already includes its Dynamic Island; do not duplicate it.
box(right,0.035,0.43,0.1,0.015,metal,w-b+0.015,0.7,0);
box(right,0.035,0.24,0.1,0.015,metal,w-b+0.015,0.1,0);
// Rear camera island on the right-hand leaf.
box(right,2.72,0.77,0.13,0.32,backMat,(w-b)/2,1.75,-depth/2-0.05);
for (const x of [0.65,1.39]) {
 const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.285,0.285,0.065,64),metal);
 ring.rotation.x=Math.PI/2; ring.position.set(x,1.75,-depth/2-0.14); right.add(ring);
 const lens = new THREE.Mesh(new THREE.SphereGeometry(0.23,48,24),new THREE.MeshPhysicalMaterial({color:0x09101b,metalness:0.8,roughness:0.12,clearcoat:1}));
 lens.scale.z=0.12; lens.position.set(x,1.75,-depth/2-0.18); right.add(lens);
}
const flash=new THREE.Mesh(new THREE.CircleGeometry(0.075,32),new THREE.MeshBasicMaterial({color:0xece8da}));flash.rotation.y=Math.PI;flash.position.set(2.43,1.75,-depth/2-0.12);right.add(flash);
// Inlaid vector mark on the rear glass; two shapes retain the separate leaf.
const applePaths=new SVGLoader().parse('<svg xmlns="http://www.w3.org/2000/svg"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.15 3.85 7.33 9.39 7.05c1.35.07 2.29.76 3.08.82 1.18-.24 2.31-.94 3.57-.85 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.88 4.34z M12.03 7c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>').paths;
const appleLogo=new THREE.Group();appleLogo.name='Apple rear logo';
const logoMaterial=new THREE.MeshStandardMaterial({color:0x777a7d,metalness:0.95,roughness:0.2,side:THREE.DoubleSide});
for(const path of applePaths)for(const shape of SVGLoader.createShapes(path)){
 const geometry=new THREE.ShapeGeometry(shape,32);geometry.translate(-12,-12,0);geometry.scale(0.048,-0.048,1);
 appleLogo.add(new THREE.Mesh(geometry,logoMaterial));
}
appleLogo.rotation.y=Math.PI;appleLogo.position.set((w-b)/2,-0.18,-depth/2-0.004);right.add(appleLogo);
// Hinge spine, USB-C recess and speaker perforations remain part of the hardware.
const spine=box(phone,0.14,h-0.5,0.1,0.05,metal,0,0,-0.06);
box(right,0.39,0.009,0.07,0.03,black,(w-b)/2,-h/2-0.001,0);
for(let i=0;i<6;i++)for(const side of [-1,1])box(right,0.025,0.009,0.035,0.008,black,(w-b)/2+side*(0.38+i*0.075),-h/2-0.001,0);
const texture = new THREE.VideoTexture(video);
texture.colorSpace = THREE.SRGBColorSpace;
texture.minFilter=THREE.LinearFilter; texture.magFilter=THREE.LinearFilter;
texture.generateMipmaps=false;
const offMaterial = new THREE.MeshBasicMaterial({color:0x050607});
// Independent transparent copies of the video material so the cover and inner
// screens can cross-fade like the real Duo (each screen needs its own opacity).
// They share the one video texture; per-screen UVs live on the geometry.
const overlayMat=()=>new THREE.MeshBasicMaterial({map:texture,toneMapped:false,side:THREE.FrontSide,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
const outerVideoMat=overlayMat(), innerVideoMat=overlayMat();

// A rounded, tessellated surface: there are no video fragments outside its boundary.
function screenGeometry(width,height,radius,nx=100,ny=120) {
 const positions=[],uvs=[],indices=[],rest=[];
 for(let j=0;j<=ny;j++) {
  const y=(j/ny-0.5)*height;
  const dy=Math.max(0,Math.abs(y)-(height/2-radius));
  const edge=width/2-radius+Math.sqrt(Math.max(0,radius*radius-dy*dy));
  for(let i=0;i<=nx;i++) {
   const x=(i/nx*2-1)*edge;
   positions.push(x,y,0);rest.push(x,y);uvs.push(x/width+0.5,y/height+0.5);
   if(i<nx&&j<ny){const a=j*(nx+1)+i;indices.push(a,a+1,a+nx+1,a+1,a+nx+2,a+nx+1);}
  }
 }
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);g.computeVertexNormals();
 g.userData={rest,width,height}; return g;
}
const outerG=screenGeometry(DUO.outerWidth*UNIT,DUO.outerHeight*UNIT,0.23,64,120);
const outer=new THREE.Mesh(outerG,offMaterial);
outer.rotation.y=Math.PI; outer.position.set(-(w-b)/2,0,-depth/2-0.005);left.add(outer);
const outerVid=new THREE.Mesh(outerG,outerVideoMat);
outerVid.rotation.copy(outer.rotation); outerVid.position.copy(outer.position); left.add(outerVid);
const innerG=screenGeometry(DUO.innerWidth*UNIT,DUO.innerHeight*UNIT,0.23,240,140);
const inner=new THREE.Mesh(innerG,offMaterial);inner.frustumCulled=false;phone.add(inner);
const innerVid=new THREE.Mesh(innerG,innerVideoMat);innerVid.frustumCulled=false;phone.add(innerVid);
function mapUV(g) {
 const {rest,width,height}=g.userData; const uv=g.attributes.uv;
 for(let i=0;i<uv.count;i++) {
  const u=rest[i*2]/width+0.5,v=rest[i*2+1]/height+0.5;
  uv.setXY(i,...(g===innerG?innerPortraitUV(u,v,sourceAspect):coverUV(u,v,sourceAspect,width/height)));
 }
 uv.needsUpdate=true;
}
function updateFold(angle) {
 const theta=Math.PI-angle*Math.PI/180;
 const [x,z]=bendPoint(-b,theta,b);
 left.position.set(x,0,z+screenZ); left.rotation.y=theta; left.position.z-=Math.cos(theta)*screenZ;left.position.x-=Math.sin(theta)*screenZ;
 right.position.set(b,0,0);
 const p=innerG.attributes.position,rest=innerG.userData.rest;
 for(let i=0;i<p.count;i++) {const [px,pz]=bendPoint(rest[i*2],theta,b);p.setXYZ(i,px,rest[i*2+1],pz+screenZ);}
 p.needsUpdate=true;
 phone.position.x=-w/2*(1-angle/180);
 // Rotate a rigid Duo into portrait. Never change hardware dimensions to fit media.
 const portrait=THREE.MathUtils.smoothstep(angle,65,180);
 if(!film.active)phone.rotation.z=-0.035-portrait*Math.PI/2+manualRollOffset;
 spine.position.set(-0.002,0,-0.06);
 spine.visible=angle<165;
 const isOpen=angle>OPEN_THRESHOLD;
 // Cross-fade the cover screen out and the inner screen in as the Duo opens.
 const fade=THREE.MathUtils.smoothstep(angle,OPEN_THRESHOLD,OPEN_THRESHOLD+22);
 outerVideoMat.opacity=1-fade;
 innerVideoMat.opacity=fade;
 if(isOpen!==opened){opened=isOpen;if(opened&&previewHeld){previewHeld=false;if(!userPaused)playVideo();}updatePlayback();}
 $('angle').innerHTML=`${Math.round(angle)}<span>°</span>`;
 $('fold').value=angle;
 $('fold').style.setProperty('--progress',`${angle/180*100}%`);
 document.querySelectorAll('[data-angle]').forEach(el=>el.classList.toggle('selected',Math.abs(Number(el.dataset.angle)-targetAngle)<1));
}
function updatePlayback(){
 if(film.active){
  const paused=film.paused||video.ended;
  $('play').innerHTML=icon(paused?'play':'pause');$('play').setAttribute('aria-label',paused?'Play animation':'Pause animation');
  $('play-state').textContent=video.ended?'Film complete · Replay animation':film.paused?'Animation paused':film.intro<INTRO_DURATION?'Slow reveal · Opening Duo':'Full recording · Cinematic opening';
  return;
 }
 $('play').innerHTML=icon(video.paused?'play':'pause');$('play').setAttribute('aria-label',video.paused?'Play video':'Pause video');
 $('play-state').textContent=video.ended?'Film complete · Play to replay':previewHeld?'Preview held · Unfold to continue':opened?'Inner display · Portrait playback':'Cover display · 3.8s preview';
}
async function playVideo(){try{await video.play();}catch{userPaused=true;if(film.active)film.paused=true;updatePlayback();}}
function trackVideo(){
 if(!film.active&&!opened&&!previewHeld&&video.currentTime>=PREVIEW_END){video.pause();previewHeld=true;updatePlayback();}
 $('time').textContent=`${Math.floor(video.currentTime/60)}:${String(Math.floor(video.currentTime%60)).padStart(2,'0')}`;
}
if('requestVideoFrameCallback' in video){const frame=()=>{trackVideo();video.requestVideoFrameCallback(frame);};video.requestVideoFrameCallback(frame);}
video.addEventListener('timeupdate',trackVideo);
video.addEventListener('loadedmetadata',()=>{sourceAspect=video.videoWidth/video.videoHeight;mapUV(outerG);mapUV(innerG);});
video.addEventListener('loadeddata',()=>{ready=true;$('loading').classList.add('hidden');if(film.active){video.pause();updatePlayback();}else playVideo();});
video.addEventListener('playing',updatePlayback);video.addEventListener('pause',updatePlayback);
video.addEventListener('ended',()=>{userPaused=true;$('play-state').textContent='Film complete · Play to replay';updatePlayback();});
video.addEventListener('error',()=>{$('loading').classList.remove('hidden');$('load-text').textContent='This video could not be played. Try an MP4 (H.264).';$('retry').hidden=false;});
$('retry').onclick=()=>{video.load();};
function explore(){
 if(!film.active)return;
 manualRollOffset=phone.rotation.z-(-0.035-THREE.MathUtils.smoothstep(currentAngle,65,180)*Math.PI/2);
 film.active=false;targetAngle=currentAngle;updatePlayback();
 if(!film.paused&&!video.ended)playVideo();
}
function replayFilm(){
 film.active=true;film.intro=0;film.paused=false;film.started=false;
 userPaused=false;previewHeld=false;video.pause();video.currentTime=0;
 camera.position.set(0,0.3,14.2);controls.target.set(0,0,0);controls.update();updatePlayback();
}
$('replay-film').onclick=replayFilm;$('explore').onclick=explore;
controls.addEventListener('start',explore);
$('fold').addEventListener('input',e=>{explore();targetAngle=Number(e.target.value);});
document.querySelectorAll('[data-angle]').forEach(el=>el.onclick=()=>{explore();targetAngle=Number(el.dataset.angle);});
$('play').onclick=()=>{
 if(film.active){if(video.ended){replayFilm();return;}film.paused=!film.paused;userPaused=film.paused;if(film.paused)video.pause();else if(film.started)playVideo();updatePlayback();return;}
 if(video.paused){userPaused=false;if(video.ended||previewHeld){video.currentTime=0;previewHeld=false;}playVideo();}else{userPaused=true;video.pause();}
};
$('sound').onclick=()=>{video.muted=!video.muted;$('sound').style.opacity=video.muted?0.5:1;$('sound').setAttribute('aria-label',video.muted?'Unmute video':'Mute video');$('sound').title=video.muted?'Unmute video':'Mute video';};
$('upload').onclick=()=>$('file').click();
$('file').onchange=e=>{const file=e.target.files[0];if(!file)return;if(objectURL)URL.revokeObjectURL(objectURL);objectURL=URL.createObjectURL(file);ready=false;previewHeld=false;userPaused=false;film.intro=0;film.started=false;film.paused=false;$('clip-name').textContent=file.name.replace(/\.[^.]+$/,'');$('loading').classList.remove('hidden');$('load-text').textContent='Preparing your video';$('retry').hidden=true;video.src=objectURL;video.load();};
$('reset').onclick=()=>{camera.position.set(0,0.3,14.2);controls.target.set(0,0,0);controls.update();};
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('fullscreen').title='Fullscreen is not available in this browser';}};
document.querySelectorAll('.swatch').forEach(el=>el.onclick=()=>{metal.color.set(el.dataset.color);backMat.color.set(el.dataset.color);document.querySelectorAll('.swatch').forEach(s=>{s.classList.toggle('active',s===el);s.setAttribute('aria-pressed',String(s===el));});});
function resize(){const rect=$('stage').getBoundingClientRect();renderer.setSize(rect.width,rect.height);camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('stage'));
mapUV(outerG);mapUV(innerG);updateFold(0);resize();
let previous=performance.now();
renderer.setAnimationLoop(now=>{
 const dt=Math.min((now-previous)/1000,0.05);previous=now;
 if(film.active){
  if(ready&&!film.paused&&!document.hidden){
   film.intro=Math.min(INTRO_DURATION,film.intro+dt);
   if(film.intro===INTRO_DURATION&&!film.started){film.started=true;playVideo();updatePlayback();}
  }
  const pose=cinematicPose(film.intro,video.currentTime,video.duration||40);
  currentAngle=targetAngle=pose.angle;updateFold(currentAngle);
  phone.rotation.set(pose.pitch,pose.yaw,pose.roll);
  const center=new THREE.Vector3(w/2*(1-currentAngle/180),0,0).applyEuler(phone.rotation);
  phone.position.copy(center.negate());
 }else if(Math.abs(targetAngle-currentAngle)>0.01){
  currentAngle=THREE.MathUtils.damp(currentAngle,targetAngle,5.25,dt);
  if(Math.abs(currentAngle-targetAngle)<0.05)currentAngle=targetAngle;
  updateFold(currentAngle);
 }
 controls.update();renderer.render(scene,camera);
});
// Read-only diagnostics for geometry and playback verification.
window.duoDiagnostics=()=>({angle:currentAngle,opened,previewHeld,ready,film:{...film},videoDuration:video.duration,videoCount:document.querySelectorAll('video').length,currentTime:video.currentTime,sourceAspect,hardware:DUO,portraitRotation:phone.rotation.z,outerAspect:outerG.userData.width/outerG.userData.height,innerAspect:innerG.userData.width/innerG.userData.height,sharedTexture:outerVideoMat.map===texture&&innerVideoMat.map===texture,coverFade:outerVideoMat.opacity,innerFade:innerVideoMat.opacity});
