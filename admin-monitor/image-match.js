'use strict';
const sharp=require('sharp');

// Difference hashes provide a cheap first-pass match for visually related
// copies; they do not constitute semantic recognition or OCR.
async function fingerprint(bytes) {
  if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>20*1024*1024) throw new Error('Image size must be 1 byte to 20 MB');
  const image=sharp(bytes,{limitInputPixels:40000000,failOn:'error'}).rotate().flatten({background:'#ffffff'}).greyscale().resize(17,16,{fit:'fill'});
  const {data,info}=await image.raw().toBuffer({resolveWithObject:true});
  if(info.width!==17||info.height!==16||info.channels!==1)throw new Error('Image preprocessing failed');
  const bits=Buffer.alloc(32);
  for(let y=0;y<16;y++)for(let x=0;x<16;x++){const bit=y*16+x;if(data[y*17+x]>data[y*17+x+1])bits[bit>>3]|=1<<(bit%8);}
  return bits.toString('hex');
}
function similarity(a,b){
  if(!/^[a-f\d]{64}$/i.test(a)||!/^[a-f\d]{64}$/i.test(b))throw new Error('Invalid fingerprint');
  const x=Buffer.from(a,'hex'),y=Buffer.from(b,'hex');let different=0;
  for(let i=0;i<x.length;i++){let v=x[i]^y[i];while(v){v&=v-1;different++}}
  return 1-different/256;
}
function rankMatches(query,index,{limit=10,minScore=0.78}={}) {
  if(!Array.isArray(index)||!Number.isInteger(limit)||limit<1||limit>100||minScore<0||minScore>1)throw new Error('Invalid search options');
  return index.map(item=>({...item,score:similarity(query,item.hash)})).filter(item=>item.score>=minScore).sort((a,b)=>b.score-a.score).slice(0,limit);
}
function extractSearchCandidates(vision){
  const text=typeof vision?.text==='string'?vision.text:'';const terms=Array.isArray(vision?.searchTerms)?vision.searchTerms:[];
  const numbers=[...text.matchAll(/\b\d{8,24}\b/g)].map(x=>x[0]);
  const handles=[...text.matchAll(/@([a-zA-Z0-9_.]{3,50})/g)].map(x=>x[1]);
  return [...new Set([...numbers,...handles,...terms].map(x=>typeof x==='string'?x.trim():'').filter(x=>x.length>=2&&x.length<=100))].slice(0,5);
}
module.exports={fingerprint,similarity,rankMatches,extractSearchCandidates};
