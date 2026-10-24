// Anonymous, read-only public US response verification. No account data.
require('node:child_process').execFileSync(process.execPath,[require('node:path').join(__dirname,'test.cjs'),'--live'],{stdio:'inherit'});
