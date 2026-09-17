import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
try{
 const page=await browser.newPage({viewport:{width:1200,height:1800},deviceScaleFactor:1});
 await page.goto('http://127.0.0.1:5173');
 const result=await page.evaluate(async()=>{
  const video=document.querySelector('video');video.pause();
  await new Promise(r=>{video.addEventListener('loadedmetadata',r,{once:true});video.src='/coffee-demo.mp4';video.load();});
  const info={width:video.videoWidth,height:video.videoHeight,duration:video.duration};
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1800;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ddd';ctx.fillRect(0,0,1200,1800);
  for(let i=0;i<24;i++){
   const t=Math.min(video.duration-0.2,i*video.duration/24);
   await new Promise(r=>{video.addEventListener('seeked',r,{once:true});video.currentTime=t+0.001;});
   const x=(i%6)*200,y=Math.floor(i/6)*450;
   ctx.drawImage(video,x,y+25,194,420);ctx.fillStyle='#111';ctx.font='16px sans-serif';ctx.fillText(t.toFixed(1)+' s',x+5,y+19);
  }
  document.body.replaceChildren(canvas);document.body.style.margin='0';return info;
 });
 console.log(result);await page.screenshot({path:'/tmp/coffee-contact.png'});
}finally{await browser.close();}
