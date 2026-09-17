import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coverUV } from '../src/mapping.js';
import { DUO } from '../src/device.js';

test('entire original recording stays inside both Duo displays after UV mapping',()=>{
 const {layout:l,taps}=JSON.parse(readFileSync(new URL('../public/coffee-duo-full.json',import.meta.url)));
 assert.equal(l.sourceWidth*l.scale,860);assert.equal(l.sourceHeight*l.scale,1864);
 const bounds={left:l.x/l.width,right:(l.x+l.sourceWidth*l.scale)/l.width,bottom:1-(l.y+l.sourceHeight*l.scale)/l.height,top:1-l.y/l.height};
 for(const aspect of [DUO.outerWidth/DUO.outerHeight,DUO.innerHeight/DUO.innerWidth]){
  const [u0,v0]=coverUV(0,0,l.width/l.height,aspect),[u1,v1]=coverUV(1,1,l.width/l.height,aspect);
  assert.ok(bounds.left>u0&&bounds.right<u1&&bounds.bottom>v0&&bounds.top<v1);
 }
 assert.equal(taps.length,4);
 for(const tap of taps){assert.ok(tap.x>=0&&tap.x<=l.sourceWidth&&tap.y>=0&&tap.y<=l.sourceHeight);}
});
