'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');const {createCheckpoint}=require('../update-checkpoint');
test('telegram checkpoint survives restarts and rejects malformed state',async()=>{
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'kc-checkpoint-')),filename=path.join(dir,'state','offset.json');
  try{const one=createCheckpoint(filename);assert.equal(await one.read(),0);await one.write(42);assert.equal(await createCheckpoint(filename).read(),42);await fs.writeFile(filename,'{"offset":-1}');await assert.rejects(()=>one.read(),/Invalid/)}finally{await fs.rm(dir,{recursive:true,force:true})}
});
