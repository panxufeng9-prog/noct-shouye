// Pack user-approved standing/turn poses into equal 64px cells.
// Run with CODEX_PRIMARY_RUNTIME_NODE_MODULES pointing to the supplied runtime modules.
const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require(path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'@napi-rs/canvas'));
const root=path.resolve(__dirname,'..');
(async()=>{const img=await loadImage(path.join(__dirname,'noct-character-reference.png'));const src=createCanvas(img.width,img.height),g=src.getContext('2d');g.drawImage(img,0,0);const px=g.getImageData(0,0,src.width,src.height);
const cells=[...[0,1,2,3].map(c=>[c,1529,1767,false]),[0,12,232,false],[1,12,232,false],[2,12,232,true],[3,907,1137,true],...[0,1,2,3].map(c=>[c,1144,1318,false])];
const frames=[];
for(const [col,top,bottom,flip] of cells){const left=Math.round(col*img.width/4)+9,right=Math.round((col+1)*img.width/4)-9,w=right-left,h=bottom-top,seen=new Uint8Array(w*h),queue=[];
const paper=(x,y)=>{const i=(y*src.width+x)*4,r=px.data[i],v=px.data[i+1],b=px.data[i+2];return px.data[i+3]<192||(r>145&&v>140&&b>115&&Math.max(r,v,b)-Math.min(r,v,b)<75)};
const visit=(x,y)=>{if(x<left||x>=right||y<top||y>=bottom)return;const j=(y-top)*w+x-left;if(seen[j]||!paper(x,y))return;seen[j]=1;queue.push([x,y])};
for(let x=left;x<right;x++){visit(x,top);visit(x,bottom-1)}for(let y=top;y<bottom;y++){visit(left,y);visit(right-1,y)}for(let k=0;k<queue.length;k++){const [x,y]=queue[k];px.data[(y*src.width+x)*4+3]=0;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1)}
let x0=right,y0=bottom,x1=left,y1=top;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(px.data[(y*src.width+x)*4+3]>=192){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
let total=0,n=0;for(let y=y0+Math.floor((y1-y0)*.2);y<y0+Math.floor((y1-y0)*.45);y++){let lo=right,hi=left;for(let x=x0;x<=x1;x++)if(px.data[(y*src.width+x)*4+3]>=192){lo=Math.min(lo,x);hi=Math.max(hi,x)}if(hi>=lo){total+=(lo+hi)/2;n++}}
frames.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1,pivot:total/n,flip});}
g.putImageData(px,0,0);const atlas=createCanvas(256,192),a=atlas.getContext('2d');a.imageSmoothingEnabled=false;const scale=46/178;
frames.forEach((f,i)=>{const width=Math.round(f.w*scale),height=Math.round(f.h*scale);a.save();a.translate(i%4*64+32,Math.floor(i/4)*64+56);if(f.flip)a.scale(-1,1);a.drawImage(src,f.x,f.y,f.w,f.h,-Math.round((f.pivot-f.x)*scale),-height,width,height);a.restore()});
fs.writeFileSync(path.join(root,'dist/noct-stand.png'),atlas.toBuffer('image/png'));console.log(frames.map((f,i)=>({i,w:f.w,h:f.h})));})();
