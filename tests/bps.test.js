import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyBps,crc32} from '../bps.js';
function num(n){const a=[];while(true){const b=n&127;n=Math.floor(n/128);if(!n){a.push(b|128);return a;}a.push(b);n--;}}
function patch(source,target,actions){
 const bytes=[66,80,83,49,...num(source.length),...num(target.length),...num(0),...actions];
 const add=n=>{for(let i=0;i<4;i++)bytes.push((n>>>(8*i))&255);};
 add(crc32(source));add(crc32(target));add(crc32(Uint8Array.from(bytes)));return Uint8Array.from(bytes);
}
test('BPS action modes, overlapping copy, and integrity checks',()=>{
 const source=new Uint8Array(4096).fill(65);
 const target=new Uint8Array(4096).fill(65);target[0]=66;
 // literal B, source-relative copy A, then overlapping target-relative copies.
 const p=patch(source,target,[...num(1),66,...num(2),...num(0),...num(((4094-1)*4)+3),...num(2)]);
 assert.deepEqual(applyBps(source,p),target);
 const bad=p.slice();bad[4]^=1;assert.throws(()=>applyBps(source,bad));
 const wrong=source.slice();wrong[0]=0;assert.throws(()=>applyBps(wrong,p));
 assert.throws(()=>applyBps(source,p.slice(0,-1)));
 assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 const plain=patch(source,source,num((4096-1)*4));
 assert.deepEqual(applyBps(source,plain),source);
});
