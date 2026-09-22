// Keep the approved PNG masters. High-quality WebP copies are for delivery only.
const fs=require('node:fs'),path=require('node:path');
const sharp=require('sharp');
(async()=>{for(const id of ['moonshadow','wetland','snowfield','ashcanyon']){const src=path.join(__dirname,'maps',id+'.png'),out=path.join(__dirname,'../dist/maps',id+'.webp');fs.mkdirSync(path.dirname(out),{recursive:true});await sharp(src).webp({quality:98,effort:6,smartSubsample:true}).toFile(out);console.log(id,fs.statSync(out).size)}})().catch(e=>{console.error(e);process.exit(1)});
