export const INTRO_DURATION = 8;
const clamp=x=>Math.max(0,Math.min(1,x));
export const ease=x=>{const t=clamp(x);return t*t*t*(t*(t*6-15)+10);};
export function cinematicPose(intro, time, duration){
 const open=clamp((intro-2.86)/(INTRO_DURATION-2.86));
 const reveal=ease(open);
 const progress=clamp(time/Math.max(duration,1));
 const drift=Math.sin(Math.PI*progress)**2;
 return {
  angle:180*open,
  yaw:-2.4+2.25*ease(intro/4.57)+0.18*drift,
  pitch:-0.07+0.035*drift,
  roll:-0.035-Math.PI/2*reveal+0.018*drift,
 };
}
