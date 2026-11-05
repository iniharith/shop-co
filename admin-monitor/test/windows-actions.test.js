const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{EventEmitter}=require('node:events'),{PassThrough}=require('node:stream');
const {runWindows,cleanEnvironment}=require('../windows-actions');
test('read-only PC tools list metadata without opening file contents',async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kc-win-'));try{fs.writeFileSync(path.join(dir,'private.env'),'do not read');
 const result=JSON.parse(await runWindows({operation:'list_files'},{cwd:dir}));assert.equal(result.entries[0].name,'private.env');assert.equal(JSON.stringify(result).includes('do not read'),false);
 assert.equal(JSON.parse(await runWindows({operation:'pc_info'},{cwd:dir})).computer,os.hostname());
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('Windows commands cannot spawn before owner approval',async()=>{
 const dir=os.tmpdir();let spawned=false;
 await assert.rejects(runWindows({operation:'run_command',command:'Write-Output example'},{cwd:dir,onApproval:async request=>{assert.equal(request.command,'Write-Output example');assert.equal(spawned,false);return false;},spawnImpl:()=>{spawned=true;}}),/declined/);
 assert.equal(spawned,false);
});
test('approved Windows command receives no bridge secret environment',async()=>{
 const result=await runWindows({operation:'run_command',command:'Write-Output example'},{cwd:os.tmpdir(),onApproval:async()=>true,spawnImpl:(exe,args,opts)=>{
 assert.equal(exe,'powershell.exe');assert.equal(args.at(-1),'Write-Output example');assert.equal(opts.shell,undefined);
 assert.equal(Object.keys(opts.env).some(k=>/SECRET|TOKEN|PASSWORD|API_KEY|MONGO_URI/i.test(k)),false);
 const p=new EventEmitter();p.stdout=new PassThrough();p.stderr=new PassThrough();setImmediate(()=>{p.stdout.write('example');p.emit('close',0)});return p;
 }});assert.equal(result,'example');
 assert.deepEqual(cleanEnvironment({PATH:'path',MODEL_BRIDGE_SECRET:'secret',SHOPCO_BOT_PASSWORD:'secret'}),{PATH:'path'});
});
