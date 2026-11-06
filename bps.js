export function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc ^ 0xffffffff) >>> 0;
}
export function applyBps(source, patch) {
  let pos=4, sourceOffset=0, targetOffset=0, written=0;
  const end=patch.length-12;
  const fail=()=>{throw Error('Invalid or incompatible BPS patch.');};
  if(patch.length<19 || String.fromCharCode(...patch.subarray(0,4))!=='BPS1') fail();
  const view=new DataView(patch.buffer,patch.byteOffset,patch.byteLength);
  if(crc32(patch.subarray(0,-4))!==view.getUint32(patch.length-4,true)) fail();
  function number() {
    let value=0, shift=1;
    for(let n=0;n<8;n++) {
      if(pos>=end) fail();
      const byte=patch[pos++]; value+=(byte&127)*shift;
      if(!Number.isSafeInteger(value)) fail();
      if(byte&128) return value;
      shift*=128; value+=shift;
    }
    fail();
  }
  const inputSize=number(), size=number(), metadata=number();
  if(inputSize!==source.length || size<4096 || size>64*1024*1024 || metadata>end-pos) fail();
  if(crc32(source)!==view.getUint32(patch.length-12,true)) fail();
  pos+=metadata;
  const out=new Uint8Array(size);
  while(pos<end && written<size) {
    const action=number(), mode=action%4, length=Math.floor(action/4)+1;
    if(length>size-written) fail();
    if(mode===0) {
      if(written+length>source.length) fail();
      out.set(source.subarray(written,written+length),written); written+=length;
    } else if(mode===1) {
      if(length>end-pos) fail();
      out.set(patch.subarray(pos,pos+length),written);pos+=length;written+=length;
    } else {
      const offset=number(), delta=Math.floor(offset/2)*(offset%2?-1:1);
      if(mode===2) {
        sourceOffset+=delta;
        if(sourceOffset<0||sourceOffset+length>source.length) fail();
        out.set(source.subarray(sourceOffset,sourceOffset+length),written);sourceOffset+=length;written+=length;
      } else {
        targetOffset+=delta;
        if(targetOffset<0||targetOffset>=written) fail();
        for(let n=0;n<length;n++) out[written++]=out[targetOffset++];
      }
    }
  }
  if(pos!==end || written!==size || crc32(out)!==view.getUint32(patch.length-8,true)) fail();
  return out;
}
