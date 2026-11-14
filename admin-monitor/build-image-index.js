'use strict';
const path=require('node:path'); const fs=require('node:fs/promises'); const {MongoClient}=require('mongodb');const {buildIndex}=require('./image-index');
async function main(){
  const uri=process.env.ADMIN_REPORT_MONGO_URI,filename=process.env.IMAGE_INDEX_PATH;
  if(!uri||!filename)throw new Error('Set ADMIN_REPORT_MONGO_URI and IMAGE_INDEX_PATH. The database account needs read access to fileuploads.');
  await fs.mkdir(path.dirname(path.resolve(filename)),{recursive:true});
  const client=new MongoClient(uri,{serverSelectionTimeoutMS:10000});
  try{await client.connect();let result=await buildIndex({collection:client.db(process.env.ADMIN_REPORT_DB||'shop-co').collection('fileuploads'),filename,limit:Number(process.env.IMAGE_INDEX_LIMIT||0),afterId:process.env.IMAGE_INDEX_AFTER||'',onProgress:x=>console.log(JSON.stringify(x))});console.log(JSON.stringify(result));}finally{await client.close();}
}
main().catch(error=>{console.error('Image index failed:',error.message);process.exitCode=1});
