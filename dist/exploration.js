'use strict';
// Authored in a 640×400 reference space; world coordinates are 2048×1280.
// Ambient effects NEVER sample the scene framebuffer: actors and UI cannot warp.
const MAP_SCALE=3.2,WORLD_W=2048,WORLD_H=1280,NAV=32,NAV_COLS=64,NAV_ROWS=40;
const polygon=(...points)=>({points});
const oval=(x,y,rx,ry)=>({x,y,rx,ry});
const patch=(kind,x,y,w,h,period=7,amplitude=1)=>({kind,x,y,w,h,period,amplitude});
const mapSpecs={
 moonshadow:{name:'月影森林',description:'月门、古树与萤火 · 开阔草地',file:'moonshadow',color:'#b6dce3',
  solids:[oval(34,47,27,23),oval(119,33,26,28),oval(544,34,49,24),oval(48,346,47,37),oval(594,357,37,29),polygon([638,0],[625,27],[616,61],[597,85],[590,111],[619,114],[638,95]),polygon([607,141],[621,146],[621,180],[638,191],[640,248],[621,224],[608,195],[610,166])],
  patches:[patch('crown',4,2,45,43),patch('crown',90,0,49,44,8),patch('crown',7,278,91,59,8),patch('crown',500,1,89,29,9),patch('grass',154,79,21,15,6),patch('grass',325,219,20,15,7),patch('grass',450,131,18,12,8),patch('grass',174,310,20,16,7),patch('water',601,56,27,51,10),patch('water',615,148,25,94,12)],
  glows:[[550,28,24,'#aaafff',7],[589,338,29,'#83beff',8],[47,338,13,'#7dd9ff',9],[70,27,17,'#acdfff',10]],particles:'firefly',count:14},
 wetland:{name:'荧光湿地',description:'荧光浅水与栈桥 · 连贯湿草地',file:'wetland',color:'#a9ded7',
  solids:[oval(32,42,25,29),oval(122,30,25,29),oval(556,30,40,24),polygon([0,271],[26,275],[40,302],[70,318],[132,353],[126,400],[0,400]),polygon([640,271],[617,278],[610,303],[575,313],[573,361],[600,389],[640,400]),polygon([631,0],[640,0],[640,89],[615,101],[616,61]),polygon([612,115],[640,102],[640,186],[623,179],[610,146])],
  patches:[patch('crown',6,3,43,39),patch('crown',91,0,49,45,8),patch('reed',1,71,20,27,8),patch('reed',484,26,18,28,8),patch('reed',607,123,18,31,9),patch('reed',81,359,20,29,8),patch('reed',576,366,17,26,9),patch('grass',226,225,18,13),patch('grass',425,205,20,14),patch('water',0,287,36,45,11),patch('water',13,346,102,52,12),patch('water',621,129,18,47,10),patch('water',610,331,30,69,13),patch('lily',14,328,12,8,10,1),patch('lily',78,352,14,9,12,1)],
  glows:[[553,29,27,'#a6a8ff',8],[42,331,17,'#5cdddb',9],[590,351,20,'#76c5ec',11],[72,28,17,'#a1dfff',10]],particles:'firefly',count:16},
 snowfield:{name:'星落雪原',description:'冰湖、星晶与雪丘 · 少量绕行地形',file:'snowfield',color:'#cbd8ff',
  solids:[oval(26,51,24,21),oval(87,41,19,22),oval(566,50,65,27),polygon([0,122],[34,128],[56,155],[70,173],[51,209],[61,231],[28,246],[0,247]),polygon([640,199],[616,202],[595,216],[595,241],[623,260],[640,258]),oval(238,97,29,12),oval(449,191,23,13),oval(260,300,29,12),oval(27,354,21,18),oval(600,362,23,16)],
  patches:[patch('ice',0,139,39,90,16,1),patch('ice',605,214,35,33,18,1),patch('ice',123,251,46,20,17,1),patch('ice',403,91,42,17,18,1),patch('ice',433,325,57,17,19,1),patch('reed',249,85,11,19,14,1),patch('reed',298,298,12,15,15,1)],
  glows:[[574,39,33,'#b5b9ff',12],[612,355,21,'#a4ddff',14],[25,351,18,'#a4dfff',13],[66,26,20,'#b7dfff',14]],particles:'snow',count:20},
 ashcanyon:{name:'灰烬峡谷',description:'熔岩边界与赤晶 · 岩柱和短裂谷',file:'ashcanyon',color:'#e7b3c1',
  solids:[oval(25,45,25,24),oval(121,36,28,27),polygon([540,0],[640,0],[640,102],[614,93],[593,77],[557,66],[524,36]),polygon([0,273],[21,280],[55,304],[46,317],[22,299],[0,290]),polygon([0,341],[30,340],[65,356],[102,374],[170,400],[0,400]),oval(605,355,30,28),oval(201,116,17,10),oval(230,129,15,8),polygon([420,174],[431,171],[452,182],[489,195],[486,210],[468,210],[445,198],[421,190]),oval(227,278,22,12)],
  patches:[patch('lava',546,5,94,68,12,1),patch('lava',0,281,47,27,14,1),patch('lava',32,348,91,51,13,1),patch('lava',433,180,49,25,15,1),patch('heat',549,6,80,61,14,1),patch('heat',32,351,77,41,15,1),patch('flame',592,317,12,21,5,1)],
  glows:[[591,38,50,'#ff8955',9],[69,379,35,'#ff7850',10],[226,264,22,'#ee737d',8],[465,196,16,'#df795e',11],[601,332,19,'#ffab65',7],[70,25,17,'#a4d6ff',10]],particles:'ash',count:14}
};
let selectedMap='moonshadow',mapLoading=false,ambientEnabled=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const mapCache=new Map();
const ambientQuery=window.matchMedia?.('(prefers-reduced-motion: reduce)');
ambientQuery?.addEventListener?.('change',e=>{ambientEnabled=!e.matches;syncAmbientControl()});
function insidePolygon(x,y,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside}return inside}
function inShape(x,y,s){return s.points?insidePolygon(x,y,s.points):((x-s.x)/s.rx)**2+((y-s.y)/s.ry)**2<1}
function blockedForMap(id,x,y,r=7){if(x-r<12||x+r>WORLD_W-12||y-r<14||y+r>WORLD_H-12)return true;return mapSpecs[id].solids.some(s=>[[0,0],[r,0],[-r,0],[0,r],[0,-r]].some(([dx,dy])=>inShape((x+dx)/MAP_SCALE,(y+dy)/MAP_SCALE,s)))}
function explorationBlocked(x,y,r=7){return blockedForMap(state.mapId,x,y,r)}
function moveExplorer(p,dx,dy,r=7,foot=0){const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/4));for(let i=0;i<steps;i++){if(!explorationBlocked(p.x+dx/steps,p.y+foot,r))p.x+=dx/steps;if(!explorationBlocked(p.x,p.y+dy/steps+foot,r))p.y+=dy/steps}}
function makeSurface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');g.imageSmoothingEnabled=false;return {c,g}}
function prepareAmbientPatch(base,spec,index){const x=Math.round(spec.x*MAP_SCALE),y=Math.round(spec.y*MAP_SCALE),w=Math.round(spec.w*MAP_SCALE),h=Math.round(spec.h*MAP_SCALE);const source=makeSurface(w,h),mask=makeSurface(w,h),work=makeSurface(w,h);source.g.drawImage(base,x,y,w,h,0,0,w,h);
 const pixels=source.g.getImageData(0,0,w,h),alpha=mask.g.createImageData(w,h);
 for(let py=0;py<h;py++)for(let px=0;px<w;px++){const i=(py*w+px)*4,r=pixels.data[i],g=pixels.data[i+1],b=pixels.data[i+2];let allowed=true;
  if(spec.kind==='water')allowed=b-r>55&&g-r>22&&b>115;
  if(spec.kind==='ice')allowed=b-r>45&&b>135;
  if(['lava','heat','flame'].includes(spec.kind))allowed=r>125&&r>g*1.35&&r>b*1.45;
  // Feather keeps the fixed shoreline/roots and hides the edge of each patch.
  const nx=(px-w/2)/(w/2),ny=(py-h/2)/(h/2),edge=Math.min(px,py,w-1-px,h-1-py);
  const fade=Math.max(0,Math.min(1,(1-nx*nx-ny*ny)*5,edge/6));
  alpha.data[i]=alpha.data[i+1]=alpha.data[i+2]=255;alpha.data[i+3]=allowed?Math.round(255*fade):0;
 }
 mask.g.putImageData(alpha,0,0);return {...spec,x,y,w,h,phase:index*1.83,source:source.c,mask:mask.c,work};
}
async function loadExplorationMap(id){if(mapCache.has(id))return mapCache.get(id);const spec=mapSpecs[id],im=new Image();im.src=`maps/${spec.file}.webp`;await im.decode();const base=makeSurface(WORLD_W,WORLD_H);base.g.drawImage(im,0,0,WORLD_W,WORLD_H);const patches=spec.patches.map((p,i)=>prepareAmbientPatch(base.c,p,i));
 const nav=new Uint8Array(NAV_COLS*NAV_ROWS);for(let y=0;y<NAV_ROWS;y++)for(let x=0;x<NAV_COLS;x++)nav[y*NAV_COLS+x]=blockedForMap(id,x*NAV+NAV/2,y*NAV+NAV/2,15)?0:1;
 const loaded={base:base.c,patches,nav};mapCache.set(id,loaded);return loaded;
}
function cameraFor(p=state.p){return {x:Math.round(Math.max(0,Math.min(WORLD_W-W,p.x-W/2))),y:Math.round(Math.max(0,Math.min(WORLD_H-H,p.y-H/2)))}}
function worldVisible(x,y,r=20){const c=state.camera;return x+r>=c.x&&x-r<=c.x+W&&y+r>=c.y&&y-r<=c.y+H}
function seeded(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}}
function safeGroundPoint(random,radius=18){for(let i=0;i<300;i++){const p={x:64+random()*(WORLD_W-128),y:72+random()*(WORLD_H-144)};if(!explorationBlocked(p.x,p.y,radius)&&state.flow[cellIndex(p.x,p.y)]>=0)return p}return {x:state.p.x,y:state.p.y}}
function cellIndex(x,y){return Math.max(0,Math.min(NAV_ROWS-1,Math.floor(y/NAV)))*NAV_COLS+Math.max(0,Math.min(NAV_COLS-1,Math.floor(x/NAV)))}
function updateExplorationFlow(dt,force=false){state.flowDelay=(state.flowDelay||0)-dt;const goal=cellIndex(state.p.x,state.p.y+12);if(!force&&state.flowDelay>0&&goal===state.flowGoal)return;state.flowDelay=.3;state.flowGoal=goal;const nav=mapCache.get(state.mapId).nav,flow=state.flow||new Int16Array(nav.length);flow.fill(-1);const q=new Int32Array(nav.length);let head=0,tail=0;q[tail++]=goal;flow[goal]=0;
 while(head<tail){const n=q[head++],x=n%NAV_COLS,y=Math.floor(n/NAV_COLS);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,j=ny*NAV_COLS+nx;if(nx>=0&&nx<NAV_COLS&&ny>=0&&ny<NAV_ROWS&&nav[j]&&flow[j]<0){flow[j]=flow[n]+1;q[tail++]=j}}}state.flow=flow;
}
function clearMapLine(a,b,r=12){const d=dist(a,b),n=Math.ceil(d/14);for(let i=1;i<=n;i++)if(explorationBlocked(a.x+(b.x-a.x)*i/n,a.y+(b.y-a.y)*i/n,r))return false;return true}
function moveExplorationEnemy(e,dt){e.navDelay=(e.navDelay||0)-dt;let target=e.navTarget;if(!target||e.navDelay<=0){e.navDelay=.35;target=state.p;if(!clearMapLine(e,state.p,e.r)){const n=cellIndex(e.x,e.y),x=n%NAV_COLS,y=Math.floor(n/NAV_COLS);let best=Infinity;target=null;for(const [dx,dy]of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy,j=ny*NAV_COLS+nx;if(nx<0||nx>=NAV_COLS||ny<0||ny>=NAV_ROWS||state.flow[j]<0)continue;const v={x:nx*NAV+16,y:ny*NAV+16},score=state.flow[j]+dist(e,v)/100;if(score<best&&clearMapLine(e,v,e.r)){best=score;target=v}}}e.navTarget=target;}
 if(target){const d=dist(e,target)||1,step=Math.min(d,e.speed*dt);moveExplorer(e,(target.x-e.x)/d*step,(target.y-e.y)/d*step,e.r,0)}
}
function pickExplorationSpawn(){const c=cameraFor();for(let i=0;i<50;i++){const edge=Math.floor(Math.random()*4),p={x:edge===0?c.x-34:edge===1?c.x+W+34:c.x+Math.random()*W,y:edge===2?c.y-34:edge===3?c.y+H+34:c.y+Math.random()*H};if(!explorationBlocked(p.x,p.y,16)&&state.flow[cellIndex(p.x,p.y)]>=0&&dist(p,state.p)>180)return p}return null}
const startWithHome=start;
start=function(){if(!homeReady)return;if(!mapCache.has(selectedMap)){void launchExploration(selectedMap);return}startWithHome();state.mapId=selectedMap;state.p.x=1024;state.p.y=656;state.camera=cameraFor();state.ambientTime=0;state.ambientFrame=-1;state.extractionOffered=false;state.flow=null;updateExplorationFlow(0,true);const random=seeded(Object.keys(mapSpecs).indexOf(selectedMap)*97+home.night*19+84);
 state.nodes=Array.from({length:34},(_,i)=>({...safeGroundPoint(random),type:i%3===0?'stone':'wood',active:true}));
 // A few close resources make the first seconds readable without filling the field.
 for(let i=0;i<4;i++){const a=i*Math.PI/2;state.nodes[i]={x:state.p.x+Math.cos(a)*120,y:state.p.y+Math.sin(a)*90,type:i%2?'wood':'stone',active:true}}
 state.ambientParticles=Array.from({length:mapSpecs[selectedMap].count*8},()=>({x:random()*WORLD_W,y:random()*WORLD_H,phase:random()*Math.PI*2,speed:2+random()*5,size:random()>.82?2:1}));updateHUD();
};
async function launchExploration(id){if(mapLoading||!mapSpecs[id])return;selectedMap=id;mapLoading=true;mode='map-loading';keys.clear();release();modal(`<div class="eyebrow">NOCT · 准备出发</div><h2>${mapSpecs[id].name}</h2><p>正在准备地图与轻微环境动态…</p>`);try{await loadExplorationMap(id);mapLoading=false;start();}catch(error){mapLoading=false;mode='home-dialog';modal('<h2>地图暂时没能打开</h2><p>家园与食物加成没有改变，请重试。</p><button class="primary" id="retry-map">重试</button><button id="cancel-map">回到院子</button>');$('#retry-map').onclick=()=>launchExploration(id);$('#cancel-map').onclick=enterHome;console.error('Map loading failed',error)}}
openGate=function(){if(mapLoading)return;homeDialog('今晚去哪里？',`<p>3 分钟时选择回家，或继续探索至 4 分钟。<br>材料带回家，作物在有效归来后成长。</p><div class="map-grid">${Object.entries(mapSpecs).map(([id,m])=>`<button class="map-card" data-map="${id}"><img src="maps/${m.file}.webp" alt="${m.name}全图" loading="lazy"><strong>${m.name}</strong><small>${m.description}</small></button>`).join('')}</div><p class="note">${home.blessing?'已备好暖汤 · 生命 +1。':'可以先去花园喝一碗暖汤。'}<br>途中随时可提前回家；本轮不增加滑冰或灼伤惩罚。</p>`);document.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>launchExploration(b.dataset.map));};
function offerExtraction(){mode='extraction';keys.clear();release();modal(`<div class="eyebrow">NOCT · 三分钟的约定</div><h2>带着星光回家吗？</h2><p>现在撤离，保留全部材料并获得归来奖励。<br>也可以再探索 1 分钟，完成后额外获得<br><span class="cost">木材 +4 · 石材 +2 · 星光 +3</span>。<br>黑影会继续增强，但不会突然爆发。</p><div class="dialog-actions"><button class="primary" id="extract-now">现在回家</button><button id="explore-more">再探索 1 分钟</button></div>`);$('#extract-now').onclick=()=>end(true,true);$('#explore-more').onclick=()=>{mode='play';$('#overlay').classList.add('hidden');keys.clear();release();updateHUD()};updateHUD();}
function tickExploration(dt){state.ambientTime+=dt;if(state.time>=240){end(true);return true}if(state.time>=180&&!state.extractionOffered){state.extractionOffered=true;offerExtraction();return true}return false}
const settleWithHome=end;
end=function(win,early=false){if(!state.settled&&win&&state.mapId&&state.time>=240){state.loot.wood+=4;state.loot.stone+=2;state.loot.star+=3}settleWithHome(win,early)};
const hudWithHome=updateHUD;
updateHUD=function(){hudWithHome();if(!state.mapId||state.zone==='home')return;const spec=mapSpecs[state.mapId];$('.chapter').textContent=spec.name+' · 第 '+home.night+' 夜';$('#area-label').textContent=spec.name;$('#clock').textContent=String(Math.floor(state.time/60)).padStart(2,'0')+':'+String(Math.floor(state.time%60)).padStart(2,'0')+(state.time>=180?' / 04:00':' / 03:00');$('#controls').textContent='WASD 移动 · 自动攻击 · E 提前回家 · 空格查看属性';$('#journal').disabled=!['play','pause'].includes(mode);};
const statsBeforeAmbient=forestStatsHTML;
forestStatsHTML=function(){return statsBeforeAmbient().replace('<button class="primary" id="resume">',`<p class="note">${state.mapId?mapSpecs[state.mapId].name+' · 世界 2048 × 1280 · ':''}3 分钟撤离选择，最长 4 分钟</p><button id="ambient-toggle" class="ambient-toggle" aria-pressed="${ambientEnabled}">环境微动态：${ambientEnabled?'开启':'关闭'}</button><button class="primary" id="resume">`)};
const pauseBeforeAmbient=pause;
pause=function(){if(mode==='extraction'||mode==='map-loading')return;pauseBeforeAmbient();if(mode==='pause'&&state.mapId){$('#ambient-toggle').onclick=()=>{ambientEnabled=!ambientEnabled;syncAmbientControl()}}};
function syncAmbientControl(){const b=$('#ambient-toggle');if(b){b.textContent='环境微动态：'+(ambientEnabled?'开启':'关闭');b.setAttribute?.('aria-pressed',String(ambientEnabled))}}
$('#pause').onclick=pause;
const updatePromptBeforeMaps=updateHomePrompt;
updateHomePrompt=function(){updatePromptBeforeMaps();if(nearby?.id==='gate')$('#objective').textContent='选四片夜色之一，三分钟时决定是否回家。'};
function drawAmbientPatch(p,time){const g=p.work.g,w=p.w,h=p.h,phase=time*Math.PI*2/p.period+p.phase;g.clearRect(0,0,w,h);
 if(p.kind==='lily'){g.drawImage(p.source,0,Math.round(Math.sin(phase)*p.amplitude));}
 else{for(let y=0;y<h;y+=3){let motion;
  if(['crown','reed','grass'].includes(p.kind))motion=Math.sin(phase+y/h*.8)*p.amplitude*(1-y/h);
  else if(p.kind==='ice')motion=0;
  else motion=Math.sin(phase+y/19)*p.amplitude;
  g.drawImage(p.source,0,y,w,Math.min(3,h-y),Math.round(motion),y,w,Math.min(3,h-y));
 }}
 if(['water','lava','ice','flame'].includes(p.kind)){g.globalCompositeOperation='screen';g.globalAlpha=p.kind==='ice'?.025+.025*(.5+.5*Math.sin(phase)):.02+.03*(.5+.5*Math.sin(phase));g.fillStyle=p.kind==='lava'||p.kind==='flame'?'#fa9b52':'#b4e0f4';g.fillRect(0,0,w,h);
  if(p.kind==='water'||p.kind==='lava'){g.globalAlpha=p.kind==='water'?.085:.06;const cycle=p.kind==='water'?42:58,offset=(time*(p.kind==='water'?2:1))%cycle;for(let y=offset;y<h;y+=cycle){g.fillRect(4+((y*17)%Math.max(1,w-24)),Math.floor(y),Math.min(13,w-8),1)}}g.globalAlpha=1;
 }
 g.globalCompositeOperation='destination-in';g.drawImage(p.mask,0,0);g.globalCompositeOperation='source-over';
}
function drawExplorationGround(){const cache=mapCache.get(state.mapId);state.camera=cameraFor();const c=state.camera;ctx.translate(-c.x,-c.y);ctx.drawImage(cache.base,c.x,c.y,W,H,c.x,c.y,W,H);
 if(!ambientEnabled)return;const time=state.ambientTime,frame=Math.floor(time*15);for(const p of cache.patches){if(!worldVisible(p.x+p.w/2,p.y+p.h/2,Math.max(p.w,p.h)/2))continue;if(p.lastFrame!==frame){drawAmbientPatch(p,frame/15);p.lastFrame=frame}ctx.drawImage(p.work.c,p.x,p.y)}
 const spec=mapSpecs[state.mapId];for(const [x,y,r,color,period]of spec.glows){const wx=x*MAP_SCALE,wy=y*MAP_SCALE;if(worldVisible(wx,wy,r*MAP_SCALE))glow(wx,wy,r*MAP_SCALE,color,.035+.03*(.5+.5*Math.sin(time*Math.PI*2/period+x)))}
 // Environmental particles are rendered BEFORE enemies, loot and the fox.
 let count=0;for(const p of state.ambientParticles){let x=p.x,y=p.y;if(spec.particles==='snow'){x=(x+time*p.speed*.35)%WORLD_W;y=(y+time*p.speed)%WORLD_H}else if(spec.particles==='ash'){x=(x+time*p.speed*.3)%WORLD_W;y=(y-time*p.speed*.55%WORLD_H+WORLD_H)%WORLD_H}else{x+=Math.sin(time*.3+p.phase)*10;y+=Math.cos(time*.23+p.phase)*7}if(!worldVisible(x,y,2)||dist({x,y},state.p)<52)continue;if(++count>spec.count)break;ctx.globalAlpha=spec.particles==='snow'?.2:spec.particles==='ash'?.15:.15+.16*(.5+.5*Math.sin(time*.7+p.phase));rect(x,y,p.size,1,spec.particles==='snow'?'#eef2ff':spec.particles==='ash'?(p.size===2?'#efb27d':'#a5a0b8'):'#b5e8dc')}ctx.globalAlpha=1;
}
function drawExplorationOverlay(){// Compass-scale overview for finding peripheral landmarks.
 const c=state.camera,x=W-104,y=H-73,w=94,h=59,cache=mapCache.get(state.mapId);ctx.save();ctx.globalAlpha=.78;ctx.drawImage(cache.base,x,y,w,h);ctx.globalAlpha=1;ctx.strokeStyle='#c4d4e880';ctx.strokeRect(x,y,w,h);ctx.strokeStyle='#d5e3f3';ctx.strokeRect(x+c.x/WORLD_W*w,y+c.y/WORLD_H*h,W/WORLD_W*w,H/WORLD_H*h);rect(x+state.p.x/WORLD_W*w-1,y+state.p.y/WORLD_H*h-1,3,3,'#e4ffff');ctx.restore();}
