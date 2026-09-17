import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { mkdtempSync,writeFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join,resolve } from 'node:path';

// Editorial reframing of the supplied recording, not a resize of the phone.
// Bands retain their original width and proportions; only empty space/chrome
// and redundant UI are removed. The final uniform scale preserves typography.
const scenes=[
 {name:'Choose coffee',start:0,duration:4.2,bands:[[180,1550,110]]},
 {name:'Scan label',start:8.3,duration:3.2,bands:[[180,260,110],[860,1130,470]]},
 {name:'Review recipe',start:18.15,duration:1.2,hold:1.6,bands:[[180,170,110],[600,680,310],[1340,590,990],[2260,220,1595]]},
 {name:'Brew',start:24.4,duration:8,bands:[[180,170,110],[860,880,450],[2260,220,1540]]},
];
const temp=mkdtempSync(join(tmpdir(),'duo-edit-'));
function run(args){const p=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(p.status!==0)throw new Error('FFmpeg edit failed');}
try{
 for(const [i,scene] of scenes.entries()){
  const split=scene.bands.map((_,n)=>`[b${n}]`).join('');
  const filters=[`[0:v]fps=30,setpts=PTS-STARTPTS,format=rgb24,split=${scene.bands.length}${split}`];
  scene.bands.forEach(([y,height,targetY],n)=>{
   if(n===0)filters.push(`[b0]crop=1290:${height}:0:${y},pad=1290:1836:0:${targetY}:color=0xf2efe6[s0]`);
   else{filters.push(`[b${n}]crop=1290:${height}:0:${y}[c${n}]`);filters.push(`[s${n-1}][c${n}]overlay=0:${targetY}:shortest=1:format=rgb[s${n}]`);}
  });
  filters.push(`[s${scene.bands.length-1}]scale=1290:1836:out_color_matrix=bt709:out_range=tv,setsar=1,format=yuv420p${scene.hold?`,tpad=stop_mode=clone:stop_duration=${scene.hold}`:''}[out]`);
  run(['-ss',String(scene.start),'-t',String(scene.duration),'-i',resolve('public/coffee-demo.mp4'),'-filter_complex',filters.join(';'),'-map','[out]','-an','-c:v','libx264','-preset','medium','-crf','18','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709',join(temp,`${i}.mp4`)]);
  console.log(`Edited: ${scene.name}`);
 }
 writeFileSync(join(temp,'concat.txt'),scenes.map((_,i)=>`file '${i}.mp4'`).join('\n'));
 run(['-f','concat','-safe','0','-i',join(temp,'concat.txt'),'-c','copy','-movflags','+faststart',resolve('public/coffee-duo-edit.mp4')]);
 console.log('Saved public/coffee-duo-edit.mp4 (18.2 seconds, 1290 × 1836).');
}finally{rmSync(temp,{recursive:true,force:true});}
