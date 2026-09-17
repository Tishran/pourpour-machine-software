import ffmpeg from 'ffmpeg-static';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

// Uniform 2/3 scaling preserves the complete source frame and its proportions.
const layout={width:1440,height:2048,sourceWidth:1290,sourceHeight:2796,scale:2/3,x:290,y:92};
// Annotations inferred from visible UI transitions, not recorded touch logs.
const taps=[
 {label:'Take a photo',time:4.42,x:645,y:555},
 {label:'Shutter',time:5.78,x:645,y:2340},
 {label:'Use Photo',time:6.96,x:1150,y:2590},
 {label:'Start brewing',time:23.12,x:645,y:2370},
];
const filters=[`[0:v]fps=30,setpts=PTS-STARTPTS,scale=860:1864:flags=lanczos,format=rgb24,pad=${layout.width}:${layout.height}:${layout.x}:${layout.y}:color=0xf2efe6[base]`];
let previous='base';
for(const [i,tap] of taps.entries()){
 const duration=0.4;
 const distance='hypot(X-64,Y-64)',radius='(14+85*T)';
 const alpha=`if(lt(abs(${distance}-${radius}),4),230*(1-T/${duration}),if(lt(abs(${distance}-${radius}),6),200*(1-T/${duration}),if(lt(${distance},12),145*(1-T/${duration}),0)))`;
 const green=`if(lt(abs(${distance}-${radius}),4),110,255)`;
 const blue=`if(lt(abs(${distance}-${radius}),4),55,255)`;
 filters.push(`color=c=black@0:s=128x128:r=30:d=${duration},format=rgba,geq=r=255:g='${green}':b='${blue}':a='${alpha}',setpts=PTS-STARTPTS+${tap.time}/TB[tap${i}]`);
 const x=Math.round(layout.x+tap.x*layout.scale-64),y=Math.round(layout.y+tap.y*layout.scale-64);
 filters.push(`[${previous}][tap${i}]overlay=${x}:${y}:eof_action=pass:repeatlast=0:format=rgb[marked${i}]`);
 previous=`marked${i}`;
}
filters.push(`[${previous}]scale=iw:ih:out_color_matrix=bt709:out_range=tv,setsar=1,format=yuv420p[out]`);
const result=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',resolve('public/coffee-demo.mp4'),'-filter_complex',filters.join(';'),'-map','[out]','-map','0:a?','-c:v','libx264','-preset','fast','-crf','18','-c:a','copy','-color_range','tv','-colorspace','bt709','-color_primaries','bt709','-color_trc','bt709','-movflags','+faststart',resolve('public/coffee-duo-full.mp4')],{stdio:'inherit'});
if(result.status!==0)throw new Error('FFmpeg render failed');
writeFileSync('public/coffee-duo-full.json',JSON.stringify({layout,taps,preservesFullTimeline:true,preservesFullFrame:true},null,2));
console.log('Saved full recording with tap annotations: public/coffee-duo-full.mp4');
