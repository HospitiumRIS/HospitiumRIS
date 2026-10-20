const parser=require(process.cwd()+'/node_modules/@babel/parser');const traverse=require(process.cwd()+'/node_modules/@babel/traverse').default;const fs=require('fs');
const G=new Set(['window','document','console','fetch','Date','Number','String','Math','Set','Map','Array','JSON','Intl','File','Object','Promise','encodeURIComponent','setTimeout','URL','Error','Boolean','undefined','React','process']);
for(const f of process.argv.slice(2)){const ast=parser.parse(fs.readFileSync(f,'utf8'),{sourceType:'module',plugins:['jsx']});const out=new Set();
traverse(ast,{Program(p){for(const [n] of Object.entries(p.scope.globals)){if(!G.has(n))out.add(n)}}});console.log(f, out.size?[...out]:'no undeclared');}
