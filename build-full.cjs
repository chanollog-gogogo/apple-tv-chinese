const fs=require('node:fs'),path=require('node:path');
const pieces=['subtitle-adapter.js','full-display.js'].map(x=>fs.readFileSync(path.join(__dirname,x),'utf8'));
fs.writeFileSync(path.join(__dirname,'apple-tv-full.bundle.js'),pieces[1]);
fs.writeFileSync(path.join(__dirname,'apple-tv-full-subtitles.bundle.js'),pieces.join('\n;\n'));
if(process.argv.includes('--package')){
 const files=['full-display.js','subtitle-adapter.js','build-full.cjs','test-core.cjs','apple-tv-full.bundle.js','apple-tv-full-subtitles.bundle.js','AppleTV-Chinese-Full.srmodule','AppleTV-Chinese-Full.snippet','AppleTV-Chinese-Full-SubtitleCompat.srmodule','AppleTV-Chinese-Full-SubtitleCompat.snippet','README-0.3.md','TESTING-0.3.md'];
 const out=path.join(__dirname,'publish-0.3');fs.mkdirSync(out,{recursive:true});
 files.forEach(name=>fs.copyFileSync(path.join(__dirname,name),path.join(out,name)));
 fs.copyFileSync(path.join(__dirname,'README-0.3.md'),path.join(out,'README.md'));
 fs.copyFileSync(path.join(__dirname,'TESTING-0.3.md'),path.join(out,'TESTING.md'));
 console.log('Packaged '+(files.length+2)+' public source/module/document files; no fixtures or traffic.');
}
console.log('Built original-code bundle; third-party subtitle source is not bundled or evaluated.');
