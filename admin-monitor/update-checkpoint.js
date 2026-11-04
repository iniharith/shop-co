'use strict';
const fs=require('node:fs/promises');const path=require('node:path');
function createCheckpoint(filename){
  if(!filename)return null;
  async function read(){try{const x=JSON.parse(await fs.readFile(filename,'utf8'));if(!Number.isSafeInteger(x.offset)||x.offset<0)throw new Error('Invalid Telegram checkpoint');return x.offset}catch(e){if(e.code==='ENOENT')return 0;throw e}}
  async function write(offset){if(!Number.isSafeInteger(offset)||offset<0)throw new Error('Invalid Telegram offset');await fs.mkdir(path.dirname(filename),{recursive:true});const temp=filename+'.tmp';await fs.writeFile(temp,JSON.stringify({offset}),{mode:0o600});await fs.rename(temp,filename);}
  return {read,write};
}
module.exports={createCheckpoint};
