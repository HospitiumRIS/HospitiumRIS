const parser = require(process.cwd()+'/node_modules/@babel/parser');
const fs=require('fs');
for (const f of process.argv.slice(2)) {
  try { parser.parse(fs.readFileSync(f,'utf8'),{sourceType:'module',plugins:['jsx']}); console.log('OK', f); }
  catch(e){ console.log('ERR', f, e.message); }
}
