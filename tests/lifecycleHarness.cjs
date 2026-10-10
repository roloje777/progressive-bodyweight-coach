/** Execute actual ProgressContext callback bodies with isolated state setters. */
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const root=path.resolve(__dirname,'..');
function transpile(source){return ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;}
function loadModule(file,mocks={}){
 const module={exports:{}};
 vm.runInNewContext(transpile(fs.readFileSync(path.join(root,file),'utf8')),{module,exports:module.exports,require:id=>{if(Object.hasOwn(mocks,id))return mocks[id];throw Error('Unmocked import '+id+' in '+file)},Date,Math,console},{filename:file});
 return module.exports;
}
const deload=loadModule('engine/DeloadEngine.ts');
const ctxSource=fs.readFileSync(path.join(root,'context/ProgressContext.tsx'),'utf8');
const parsed=ts.createSourceFile('ProgressContext.tsx',ctxSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function findCallback(name){let match;
 function walk(node){if(ts.isVariableDeclaration(node)&&node.name.getText(parsed)===name&&node.initializer&&ts.isArrowFunction(node.initializer))match=node.initializer;ts.forEachChild(node,walk)}
 walk(parsed);if(!match)throw Error('Missing production callback '+name);return match.getText(parsed);
}
function scenario({program={id:'level1',days:[{},{}],weeks:4},week=0,day=0,activeDeload=null,pendingGraduation=null,programs=[{id:'level1'},{id:'level2'}],activeMaintenance=null}={}){
 const state={program,week,day,activeDeload,pendingGraduation,programIndex:0,activeMaintenance,activeRepeatWeek:null};
 const events=[];const changes=[];
 const setters={};for(const key of ['week','day','activeDeload','pendingGraduation','programIndex','activeMaintenance','activeRepeatWeek']){
  const setter='set'+key[0].toUpperCase()+key.slice(1);
  setters[setter]=(value)=>{state[key]=typeof value==='function'?value(state[key]):value;changes.push({key,value:state[key]});};
 }
 const env={...setters,program,week,day,activeDeload,pendingGraduation,activeMaintenance,programs,
  createActiveDeload:deload.createActiveDeload,moveDeloadToVerification:deload.moveDeloadToVerification,
  recordLifecycleEventSafely:event=>events.push(event),
  suspendGraduationEligibility:()=>setters.setPendingGraduation(current=>!current||current.programId!==program.id?current:{...current,eligible:false}),
  console,Date,Math};
 function invoke(name,...args){// Transpile the production arrow function as a self-contained assignment.
  const script=transpile('const callback = '+findCallback(name)+'; callback;');
  const callback=vm.runInNewContext(script,env,{filename:'ProgressContext.'+name});return callback(...args);
 }
 return {state,events,changes,invoke};
}
module.exports={scenario,loadModule};
