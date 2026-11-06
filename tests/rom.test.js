import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRom, romKey} from '../rom.js';
function fixture(title='SMASH BROTHERS') {
  const bytes = new Uint8Array(4096);
  bytes.set([0x80,0x37,0x12,0x40]);
  bytes.set(new TextEncoder().encode(title),0x20);
  return bytes;
}
test('all byte orders normalize to identical ROMs and save keys', async () => {
  const original = fixture();
  for (const width of [1,2,4]) {
    const input = original.slice();
    for(let i=0;i<input.length;i+=width) input.set(input.slice(i,i+width).reverse(),i);
    const result=normalizeRom(input.buffer,'smash');
    assert.deepEqual(result.bytes,original);
    assert.equal(await romKey(result.bytes),await romKey(original));
  }
});
test('identifies Zelda and rejects mismatched selection',()=>{
  const bytes=fixture('THE LEGEND OF ZELDA');
  assert.equal(normalizeRom(bytes.buffer,'zelda').game,'zelda');
  assert.throws(()=>normalizeRom(bytes.buffer,'smash'),/does not match/);
  assert.equal(normalizeRom(fixture('ZELDA OCARINA TIME').buffer,'zelda').game,'zelda');
});
test('rejects archives, invalid headers and truncated ROMs',()=>{
  assert.throws(()=>normalizeRom(new ArrayBuffer(20)),/uncompressed/);
  assert.throws(()=>normalizeRom(new ArrayBuffer(4096)),/header/);
});
test('different ROM revisions have separate saves',async()=>{
  const a=fixture(),b=fixture();b[300]=1;
  assert.notEqual(await romKey(a),await romKey(b));
});
