// Reference-to-atlas preparation used for noct-walk-4dir.png. Run in a Canvas-enabled authoring environment.
const forestArt=new Image(),foxArt=new Image();
let foxFrames=[],foxAtlas=null;
foxArt.onload=()=>{const source=document.createElement('canvas');source.width=foxArt.width;source.height=foxArt.height;const g=source.getContext('2d');g.drawImage(foxArt,0,0);const pixels=g.getImageData(0,0,source.width,source.height);
// Select the existing front/back/side walking rows in the approved reference.
// Flood only the cream paper connected to each cell border, preserving enclosed white fur.
const frames=[];const bands=[[240,460],[464,683],[688,901]];
for(let row=0;row<3;row++)for(let col=0;col<4;col++){
const left=Math.round(col*source.width/4)+9,right=Math.round((col+1)*source.width/4)-9,top=bands[row][0],bottom=bands[row][1];
const w=right-left,h=bottom-top,seen=new Uint8Array(w*h),queue=[];
function paper(x,y){const i=(y*source.width+x)*4,r=pixels.data[i],v=pixels.data[i+1],b=pixels.data[i+2];return pixels.data[i+3]<192||(r>145&&v>140&&b>115&&Math.max(r,v,b)-Math.min(r,v,b)<75)}
function visit(x,y){if(x<left||x>=right||y<top||y>=bottom)return;const j=(y-top)*w+x-left;if(seen[j]||!paper(x,y))return;seen[j]=1;queue.push([x,y])}
for(let x=left;x<right;x++){visit(x,top);visit(x,bottom-1)}for(let y=top;y<bottom;y++){visit(left,y);visit(right-1,y)}
for(let i=0;i<queue.length;i++){const [x,y]=queue[i];pixels.data[(y*source.width+x)*4+3]=0;visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1)}
let x0=right,y0=bottom,x1=left,y1=top;for(let y=top;y<bottom;y++)for(let x=left;x<right;x++)if(pixels.data[(y*source.width+x)*4+3]>=192){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
let centerTotal=0,centerRows=0;for(let y=y0+Math.floor((y1-y0)*.2);y<y0+Math.floor((y1-y0)*.45);y++){let lo=right,hi=left;for(let x=x0;x<=x1;x++)if(pixels.data[(y*source.width+x)*4+3]>=192){lo=Math.min(lo,x);hi=Math.max(hi,x)}if(hi>=lo){centerTotal+=(lo+hi)/2;centerRows++}}frames.push({x:x0,y:y0,w:Math.max(1,x1-x0+1),h:Math.max(1,y1-y0+1),pivot:centerRows?centerTotal/centerRows:(x0+x1)/2});
}g.putImageData(pixels,0,0);
foxAtlas=document.createElement('canvas');foxAtlas.width=64*4;foxAtlas.height=64*3;const a=foxAtlas.getContext('2d');a.imageSmoothingEnabled=false;const scale=46/Math.max(...frames.map(f=>f.h));frames.forEach((f,i)=>{const width=Math.round(f.w*scale),height=Math.round(f.h*scale);a.drawImage(source,f.x,f.y,f.w,f.h,(i%4)*64+32-Math.round((f.pivot-f.x)*scale),Math.floor(i/4)*64+56-height,width,height)});foxFrames=frames;
};forestArt.src='forest-cute.png';foxArt.src='noct-directions.png';
