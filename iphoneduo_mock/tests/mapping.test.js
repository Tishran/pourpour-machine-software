import test from 'node:test';
import assert from 'node:assert/strict';
import { coverUV, bendPoint } from '../src/mapping.js';

test('cover mapping remains in bounds and preserves source proportions',()=>{
 for(const source of [9/19.5,9/16,16/9,1])for(const screen of [0.27,0.58,1.2]){
  const [u0,v0]=coverUV(0,0,source,screen),[u1,v1]=coverUV(1,1,source,screen);
  assert.ok(u0>=0&&v0>=0&&u1<=1&&v1<=1);
  assert.ok(Math.abs(source*(u1-u0)/(v1-v0)-screen)<1e-10);
 }
});
test('hinge remains continuous at both boundaries across every fold angle',()=>{
 const epsilon=1e-7;
 for(let degrees=0;degrees<=180;degrees++)for(const x of [-0.045,0.045]){
  const theta=degrees*Math.PI/180;
  const a=bendPoint(x-epsilon,theta),c=bendPoint(x+epsilon,theta);
  assert.ok(Math.hypot(a[0]-c[0],a[1]-c[1])<=epsilon*2.01);
 }
});
test('fully open screen is planar and closed leaves face each other',()=>{
 assert.deepEqual(bendPoint(-1,0),[-1,0]);
 const a=bendPoint(-1,Math.PI),b=bendPoint(-0.5,Math.PI);
 assert.ok(a[0]>b[0]);assert.ok(Math.abs(a[1]-b[1])<1e-10);
});
