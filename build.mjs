import fs from 'node:fs';
const images=['forest-cute.png','noct-walk-4dir.png','noct-stand.png','home-map.png',...['radish','bell'].flatMap(c=>[0,1,2,3].map(s=>`crop-${c}-${s}.png`)),...['plot','plot-upgraded','wood','stone'].map(n=>`home-${n}.png`)];
const maps=['moonshadow','wetland','snowfield','ashcanyon'].map(id=>`maps/${id}.webp`);
const assets={};for(const name of ['index.html','style.css','game.js','home.js','exploration.js',...images,...maps]){assets['/'+name]={type:name.endsWith('.webp')?'image/webp':name.endsWith('.png')?'image/png':name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8',data:fs.readFileSync('dist/'+name).toString('base64')}}
fs.mkdirSync('dist/server',{recursive:true});fs.mkdirSync('dist/.openai',{recursive:true});
fs.writeFileSync('dist/server/index.js','const SITE_ASSETS='+JSON.stringify(assets)+';\n'+fs.readFileSync('server.mjs','utf8'));
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
console.log(`Built Noct Worker with ${Object.keys(assets).length} assets and account saves.`);
