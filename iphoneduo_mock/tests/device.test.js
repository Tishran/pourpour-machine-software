import test from 'node:test';
import assert from 'node:assert/strict';
import { DUO, innerPortraitUV } from '../src/device.js';

test('Duo hardware retains the wide passport dimensions from the reference',()=>{
 assert.equal(DUO.openWidth,164.6);assert.equal(DUO.height,117.8);
 assert.equal(DUO.leafDepth,5.2);assert.equal(DUO.closedWidth,84.1);
 assert.ok(DUO.openWidth/DUO.height>1.39);
 assert.ok(Math.abs(DUO.outerWidth/DUO.outerHeight-1398/2034)<1e-12);
 assert.ok(Math.abs(DUO.innerWidth/DUO.innerHeight-2670/1878)<1e-12);
});
test('inner UVs counter-rotate video into portrait without distortion or overflow',()=>{
 for(const source of [9/19.5,9/16,16/9]){
  const bottomLeft=innerPortraitUV(1,0,source),topRight=innerPortraitUV(0,1,source);
  assert.ok(topRight[0]>bottomLeft[0]&&topRight[1]>bottomLeft[1]);
  assert.ok(bottomLeft.every(v=>v>=0)&&topRight.every(v=>v<=1));
  const displayed=source*(topRight[0]-bottomLeft[0])/(topRight[1]-bottomLeft[1]);
  assert.ok(Math.abs(displayed-DUO.innerHeight/DUO.innerWidth)<1e-12);
 }
});
