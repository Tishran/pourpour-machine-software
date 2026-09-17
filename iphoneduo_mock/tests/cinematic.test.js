import test from 'node:test';
import assert from 'node:assert/strict';
import {cinematicPose,INTRO_DURATION} from '../src/cinematic.js';
test('reveal and video timeline join continuously, and open slowly to 180 degrees',()=>{
 const before=cinematicPose(INTRO_DURATION-1e-5,0,40),after=cinematicPose(INTRO_DURATION,0,40);
 for(const key of Object.keys(before))assert.ok(Math.abs(before[key]-after[key])<1e-6);
 let previous=after;
 for(let time=0.01;time<=40;time+=0.01){const current=cinematicPose(INTRO_DURATION,time,40);assert.ok(current.angle>=previous.angle);assert.ok((current.angle-previous.angle)/0.01<5);previous=current;}
 assert.equal(cinematicPose(INTRO_DURATION,40,40).angle,180);
});
test('intro has smooth bounded motion and shows the rear before the display',()=>{
 const start=cinematicPose(0,0,40);assert.equal(start.angle,0);assert.ok(Math.cos(start.yaw)<0);
 let previous=start;
 for(let t=.01;t<=INTRO_DURATION;t+=.01){const next=cinematicPose(t,0,40);assert.ok(Math.abs(next.yaw-previous.yaw)/.01<0.6);assert.ok((next.angle-previous.angle)/.01<28);previous=next;}
});
