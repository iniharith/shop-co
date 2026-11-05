'use strict';
const fs=require('node:fs/promises'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
function cleanEnvironment(env=process.env){return Object.fromEntries(Object.entries(env).filter(([key])=>!/SECRET|TOKEN|PASSWORD|API_KEY|MONGO_URI/i.test(key)));}
async function runWindows(args,{cwd,onApproval,signal,spawnImpl=spawn}){
 if(args.operation==='pc_info')return JSON.stringify({computer:os.hostname(),user:os.userInfo().username,platform:os.platform(),workingDirectory:cwd});
 const folder=args.path||cwd;
 if(typeof folder!=='string'||!path.isAbsolute(folder)||folder.startsWith('\\\\')||folder.length>300||!(await fs.stat(folder)).isDirectory())throw Error('Use an existing local absolute Windows directory');
 if(args.operation==='list_files'){
  const files=await fs.readdir(folder,{withFileTypes:true});return JSON.stringify({folder,count:files.length,entries:files.slice(0,200).map(f=>({name:f.name,directory:f.isDirectory()})),truncated:files.length>200});
 }
 if(args.operation!=='run_command'||typeof args.command!=='string'||!args.command.trim()||args.command.length>2500)throw Error('Unsupported Windows operation or command too long');
 const command=args.command;
 const approved=await onApproval({method:'Windows command (runs as your Windows account outside the Codex sandbox)',command,cwd:folder});
 if(!approved||signal?.aborted)throw Error('Windows command was declined or cancelled');
 return new Promise((resolve,reject)=>{
  const proc=spawnImpl('powershell.exe',['-NoProfile','-NonInteractive','-Command',command],{cwd:folder,windowsHide:true,env:cleanEnvironment(),stdio:['ignore','pipe','pipe']});
  let output='',finished=false;
  const append=chunk=>{if(output.length<16000)output+=chunk.toString().slice(0,16000-output.length);};proc.stdout.on('data',append);proc.stderr.on('data',append);
  const stop=()=>{if(proc.pid)spawn('taskkill.exe',['/PID',String(proc.pid),'/T','/F'],{windowsHide:true,stdio:'ignore'});else proc.kill();};
  const timer=setTimeout(stop,120000);signal?.addEventListener('abort',stop,{once:true});
  const done=error=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',stop);error?reject(error):resolve(output);};
  proc.on('error',()=>done(Error('Could not start approved Windows command')));
  proc.on('close',code=>done(signal?.aborted?Error('Command cancelled; check for partial side effects'):code===0?null:Error('Windows command failed with exit code '+code+'. '+output)));
 });
}
module.exports={runWindows,cleanEnvironment};
