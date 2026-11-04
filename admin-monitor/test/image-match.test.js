'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),sharp=require('sharp');
const {fingerprint,similarity,rankMatches,extractSearchCandidates}=require('../image-match');
test('image matching tolerates resizing and ranks the closest copy first',async()=>{
  let raw=Buffer.alloc(80*80*3); for(let y=0;y<80;y++)for(let x=0;x<80;x++){let n=(y*80+x)*3,v=Math.round(127+60*Math.sin(x/8)+50*Math.cos((x+y)/12));raw[n]=v;raw[n+1]=v;raw[n+2]=v;}
  let original=await sharp(raw,{raw:{width:80,height:80,channels:3}}).png().toBuffer();
  let resized=await sharp(original).resize(160,160).jpeg({quality:85}).toBuffer();
  let a=await fingerprint(original),b=await fingerprint(resized);assert.ok(similarity(a,b)>0.9);
  let results=rankMatches(a,[{name:'other',hash:'00'.repeat(32)},{name:'copy',hash:b}],{minScore:0});assert.equal(results[0].name,'copy');
});
test('malformed or oversized data fails closed',async()=>{
  await assert.rejects(()=>fingerprint(Buffer.from('not an image')));
  await assert.rejects(()=>fingerprint(Buffer.alloc(20*1024*1024+1)));
  assert.throws(()=>similarity('bad','00'.repeat(32)));
});
test('OCR search extracts the order number from surrounding text',()=>{
  assert.deepEqual(extractSearchCandidates({text:'ORDER 123456789 @sample',searchTerms:['ORDER 123456789']}),['123456789','sample','ORDER 123456789']);
});
