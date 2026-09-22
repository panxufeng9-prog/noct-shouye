const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
(async()=>{
 const src=await loadImage(path.join(__dirname,'home-crop-atlas.png'));
 const names=['crop-radish-0','crop-radish-1','crop-radish-2','crop-radish-3','crop-bell-0','crop-bell-1','crop-bell-2','crop-bell-3','home-plot','home-plot-upgraded','home-wood','home-stone'];
 for(let i=0;i<12;i++){
  const c=createCanvas(362,362),g=c.getContext('2d');g.drawImage(src,(i%4)*362,Math.floor(i/4)*362,362,362,0,0,362,362);
  const d=g.getImageData(0,0,362,362);let minX=362,minY=362,maxX=0,maxY=0;
  for(let y=0;y<362;y++)for(let x=0;x<362;x++){const n=(y*362+x)*4,r=d.data[n],v=d.data[n+1],b=d.data[n+2];if(r>160&&b>160&&v<110&&r>v*1.65&&b>v*1.65){d.data[n+3]=0;continue;}d.data[n+3]=255;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
  g.putImageData(d,0,0);let target;
  if(i<8){target=createCanvas(64,64);const t=target.getContext('2d');t.imageSmoothingEnabled=false;const scale=.24,w=Math.round((maxX-minX+1)*scale),h=Math.round((maxY-minY+1)*scale);t.drawImage(c,minX,minY,maxX-minX+1,maxY-minY+1,Math.round(32-w/2),62-h,w,h)}
  else{target=createCanvas(i<10?128:48,i<10?96:48);const t=target.getContext('2d');t.imageSmoothingEnabled=false;t.drawImage(c,minX,minY,maxX-minX+1,maxY-minY+1,0,0,target.width,target.height)}
  fs.writeFileSync(path.join(__dirname,'../dist',names[i]+'.png'),target.toBuffer('image/png'));
 }
})();
