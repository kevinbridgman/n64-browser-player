import {applyBps} from './bps.js';
const select=document.querySelector('#patch-select'), note=document.querySelector('#patch-note');
let releases=[];
export const catalogReady=(async()=>{
 try {
  const response=await fetch('./patches/catalog.json',{cache:'no-store'});
  if(!response.ok) throw Error('Catalog unavailable');
  const catalog=await response.json();
  if(catalog.schemaVersion!==1||!Array.isArray(catalog.patches)) throw Error('Invalid catalog');
  releases=catalog.patches.filter(p=>p.id&&p.name&&p.file&&/^[a-f0-9]{64}$/i.test(p.sha256)&&/^[a-f0-9]{64}$/i.test(p.baseSha256));
  for(const p of releases) {const option=document.createElement('option');option.value=p.id;option.textContent=p.name+' · v'+p.version+(p.warning?' · known issue':'');select.append(option);}
  note.textContent=releases.length?'Choose an optional mod. Original and modified games have separate saves.':'No compiled mods published yet. You can load a local BPS patch.';
 } catch {note.textContent='Published mods could not load. Original games and local BPS files are still available.';}
})();
select.addEventListener('change',()=>{
 document.querySelector('#local-patch').hidden=select.value!=='local';
 const release=releases.find(p=>p.id===select.value);
 note.textContent=release?[release.description,release.warning].filter(Boolean).join(' '):'Patches apply locally. Use the exact original ROM required by the patch.';
});
async function digest(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');}
export async function patchRom(bytes) {
 await catalogReady;
 const id=select.value;
 if(id==='none') return bytes;
 let patch;
 if(id==='local') {
  const file=document.querySelector('#bps-file').files[0];
  if(!file) throw Error('Choose a local BPS patch.');
  if(file.size>128*1024*1024) throw Error('Patch file is too large.');
  patch=new Uint8Array(await file.arrayBuffer());
 } else {
  const release=releases.find(p=>p.id===id);
  if(!release) throw Error('Selected mod is unavailable.');
  if(await digest(bytes)!==release.baseSha256.toLowerCase()) throw Error('This mod requires a different original ROM revision.');
  const url=new URL(release.file,location.href);
  if(url.origin!==location.origin) throw Error('Invalid patch URL.');
  const response=await fetch(url,{cache:'no-store'});
  if(!response.ok) throw Error('Patch download failed.');
  patch=new Uint8Array(await response.arrayBuffer());
  if(await digest(patch)!==release.sha256.toLowerCase()) throw Error('Patch download checksum mismatch.');
 }
 return applyBps(bytes,patch);
}
