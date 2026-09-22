'use strict';
const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const $=s=>document.querySelector(s),W=640,H=400,keys=new Set();let mode='title',last=0,state,joy=null,audio;
const forestArt=new Image(),foxArt=new Image(),standArt=new Image();
let foxAtlas=null,standAtlas=null,idleLayers=[];
foxArt.onload=()=>{foxAtlas=foxArt};
standArt.onload=()=>{standAtlas=standArt;prepareIdleLayers()};
function prepareIdleLayers(){idleLayers=[];for(let frame=0;frame<4;frame++){
 const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');g.drawImage(standAtlas,frame*64,0,64,64,0,0,64,64);
 const src=g.getImageData(0,0,64,64),body=g.createImageData(64,64),tail=g.createImageData(64,64),ears=g.createImageData(64,64),eyes=[];
 for(let y=0;y<64;y++)for(let x=0;x<64;x++){let i=(y*64+x)*4;if(!src.data[i+3])continue;const isTail=x>=41&&y>=35,isEar=y<22&&(x<27||x>36),target=isTail?tail:isEar?ears:body;target.data.set(src.data.subarray(i,i+4),i);if(y>=22&&y<=34&&src.data[i]<105&&src.data[i+1]>115&&src.data[i+2]>145)eyes.push({x,y})}
 const layer=data=>{const a=document.createElement('canvas');a.width=a.height=64;a.getContext('2d').putImageData(data,0,0);return a};idleLayers.push({body:layer(body),tail:layer(tail),ears:layer(ears),eyes});
}}
// Posed inhale, short crest, slower exhale and rest. Timing is intentionally non-uniform.
const breathSequence=[{d:.48,f:0,b:0},{d:.16,f:0,b:0},{d:.22,f:1,b:0},{d:.22,f:2,b:1},{d:.30,f:3,b:1},{d:.18,f:3,b:1},{d:.24,f:2,b:1},{d:.24,f:1,b:0},{d:.46,f:0,b:0}];
const breathDuration=breathSequence.reduce((n,v)=>n+v.d,0);
function idlePose(p){const age=p.idleTime||0;let t=age%breathDuration,step=breathSequence[0];for(const v of breathSequence){step=v;if(t<v.d)break;t-=v.d}
 const tailTime=age%3.8,tail=age>.55?(tailTime>1.1&&tailTime<1.5?1:tailTime>=1.5&&tailTime<1.85?2:tailTime>=1.85&&tailTime<2.2?1:0):0;
 const blinkTime=age%5.7,blink=age>1&&(blinkTime>3.65&&blinkTime<3.78||age%11.4>9.5&&age%11.4<9.62);
 return {frame:step.f,breath:step.b,tail,ear:age%7.1>5.8&&age%7.1<5.98?1:0,blink,pulse:.65+.28*(.5+.5*Math.sin(age*Math.PI*2/breathDuration-.5))};
}
const idleSurface=document.createElement('canvas');idleSurface.width=idleSurface.height=64;const idleCtx=idleSurface.getContext('2d');idleCtx.imageSmoothingEnabled=false;
function drawIdleFox(p,settle=false){const v=settle?{frame:0,breath:-1,tail:0,ear:0,blink:false,pulse:.65}:idlePose(p),layer=idleLayers[v.frame];if(!layer)return;const g=idleCtx;g.clearRect(0,0,64,64);
 g.drawImage(layer.tail,-Math.min(1,v.tail),v.tail===2?-1:0);g.drawImage(layer.body,0,0);g.drawImage(layer.ears,0,0,64,22,0,v.ear,64,22-v.ear);
 if(v.blink&&layer.eyes.length){g.fillStyle='#315b86';for(const e of layer.eyes)g.fillRect(e.x,e.y,1,1);g.fillStyle='#102039';for(const group of [layer.eyes.filter(e=>e.x<32),layer.eyes.filter(e=>e.x>=32)]){if(!group.length)continue;const x=Math.round(group.reduce((n,e)=>n+e.x,0)/group.length),y=Math.round(group.reduce((n,e)=>n+e.y,0)/group.length);g.fillRect(x-1,y,3,1)}}
 // Keep identical neutral boots for every idle pose, unaffected by breathing or tail motion.
 g.clearRect(0,50,64,14);g.drawImage(standAtlas,0,50,64,14,0,50,64,14);
 ctx.drawImage(idleSurface,0,0,64,50,-32,-56-v.breath,64,50+v.breath);ctx.drawImage(idleSurface,0,50,64,14,-32,-6,64,14);
}
function updateNoctMotion(p,dt,traveled,dx,dy){const wasMoving=p.moving;p.moving=traveled>.001;
 if(p.moving){if(!wasMoving){p.walk=0;p.startAge=0}p.startAge+=dt;const horizontal=Math.abs(dx),vertical=Math.abs(dy);if(horizontal>vertical+.12||(Math.abs(horizontal-vertical)<=.12&&p.direction===2)){p.direction=2;p.facing=dx<0?-1:1}else p.direction=dy<0?1:0;
 p.walk+=traveled/78;p.idleTime=0;p.stopAge=0;p.motion='walk';return;}
 if(wasMoving){p.stopDirection=p.direction;p.stopFacing=p.facing;p.stopFrame=Math.floor(p.walk*8)%4;p.stopAge=0;p.motion='stopping'}
 if(p.motion==='stopping'){p.stopAge+=dt;const duration=p.stopDirection===1?.44:p.stopDirection===2?.34:.22;if(p.stopAge>=duration){p.motion='idle';p.direction=0;p.facing=1;p.walk=0;p.idleTime=0}}else{p.motion='idle';p.direction=0;p.facing=1;p.idleTime+=dt}
}
function selectNoctPose(p){if(p.moving)return p.startAge<.055?{kind:'stand',index:p.direction===0?0:p.direction===1?5:6,flip:p.direction===2?p.facing:1}:{kind:'walk',frame:Math.floor(p.walk*8)%4,direction:p.direction,flip:p.direction===2?p.facing:1};
 if(p.motion==='stopping'){
  const t=p.stopAge,dir=p.stopDirection,flip=dir===2?p.stopFacing:1;
  if(t<.075)return {kind:'walk',frame:p.stopFrame,direction:dir,flip};
  if(dir===0)return {kind:'settle'};
  if(t<.18)return {kind:'stand',index:dir===1?5:6,flip};
  if(dir===1&&t<.29)return {kind:'stand',index:6,flip:p.stopFacing||1};
  return {kind:'settle'};
 }
 return {kind:'idle'};
}
forestArt.src='forest-cute.png';foxArt.src='noct-walk-4dir.png';standArt.src='noct-stand.png';
const rnd=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fox=['.bb......bb.','.bcb....bcb.','.bcbbbbbbcb.','..bccccccb..','..bccwwccb..','..bwkwwkwb..','...bwwwwb...','....bbbb....','ww.bcccbb...','wccbcccb.y..','.ccbbbb..yy.','...b..b.....'];
const colors={b:'#102036',c:'#519de3',w:'#d2f2f4',k:'#102036',y:'#ffd17f'};
const deco=Array.from({length:120},()=>({x:rnd(12,628),y:rnd(20,390),type:Math.random()}));
const trees=Array.from({length:44},(_,i)=>({x:i<22?i*31-10:(i%2?12:623)+rnd(-12,12),y:i<11?rnd(-15,8):i<22?rnd(380,409):rnd(20,390),size:rnd(17,28)}));
function reset(){state={p:{x:320,y:210,hp:5,max:5,speed:78,inv:0,facing:1,direction:0,moving:false,walk:0,idleTime:0,animTime:0,motion:"idle",startAge:0,stopAge:0,stopDirection:0,stopFacing:1,stopFrame:0},time:0,kills:0,lv:1,xp:0,need:6,damage:1,rate:.8,shot:0,spawn:0,enemies:[],bullets:[],gems:[],particles:[],magnet:28,flames:0,builds:{damage:0,haste:0,speed:0,magnet:0,vitality:0,flames:0}};updateHUD()}
function sound(f,d=.06){try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(f,audio.currentTime);g.gain.setValueAtTime(.035,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
function modal(html){$('#panel').innerHTML=html;$('#overlay').classList.remove('hidden')}
function start(){reset();mode='play';$('#overlay').classList.add('hidden');sound(440);updateHUD()}
function title(){modal('<div class="eyebrow">NOCT · THE FIRST NIGHT</div><h1>守 夜</h1><p>让胸前的星光，照亮这片森林。<br>躲开黑影，拾取星光，生存 3 分钟。<br>方向键 / WASD 移动，吊坠自动攻击。</p><button class="primary" id="start">走进森林</button>');$('#start').onclick=start}
function pause(){if(mode==='play'){mode='pause';modal('<h2>星光还亮着</h2><p>休息一下，森林会等你。</p><button class="primary" id="resume">继续守夜</button>');$('#resume').onclick=pause}else if(mode==='pause'){mode='play';$('#overlay').classList.add('hidden')}}
function end(win){mode='end';modal('<div class="eyebrow">'+(win?'DAWN IS HERE':'THE LIGHT RESTS')+'</div><h2>'+(win?'天亮了':'星光暂时黯淡')+'</h2><p>生存 '+Math.floor(state.time)+' 秒 · 击退 '+state.kills+' 个黑影<br>到达等级 '+state.lv+'</p><button class="primary" id="again">再守一夜</button>');$('#again').onclick=start}
const upgrades=[{key:'damage',name:'闪耀吊坠',desc:'星光伤害 +1',apply:()=>state.damage++},{key:'haste',name:'急促星光',desc:'自动攻击间隔缩短 18%',apply:()=>state.rate=Math.max(.12,state.rate*.82)},{key:'speed',name:'轻盈脚步',desc:'移动速度提高 12%',apply:()=>state.p.speed*=1.12},{key:'magnet',name:'星光引力',desc:'拾取范围 +24',apply:()=>state.magnet+=24},{key:'vitality',name:'温暖余烬',desc:'生命上限 +1，并恢复 2 点生命',apply:()=>{state.p.max++;state.p.hp=Math.min(state.p.max,state.p.hp+2)}},{key:'flames',name:'环绕鬼火',desc:'增加一团环绕火焰，接触黑影造成伤害',apply:()=>state.flames++}];
function levelUp(){state.xp-=state.need;state.lv++;state.need=Math.ceil(state.need*1.3);mode='upgrade';const opts=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);modal('<div class="eyebrow">LEVEL '+state.lv+'</div><h2>让星光再亮一点</h2><p>选择一份森林的馈赠</p>'+opts.map((u,i)=>'<button class="choice" data-up="'+i+'">'+u.name+'<small>'+u.desc+'</small></button>').join(''));document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{const u=opts[+b.dataset.up];u.apply();state.builds[u.key]++;mode='play';$('#overlay').classList.add('hidden');updateHUD();sound(700);if(state.xp>=state.need)levelUp()});updateHUD()}
function updateHUD(){$('#health').textContent='♥'.repeat(state.p.hp)+'♡'.repeat(state.p.max-state.p.hp);$('#clock').textContent=String(Math.floor(state.time/60)).padStart(2,'0')+':'+String(Math.floor(state.time%60)).padStart(2,'0');$('#level').textContent='LV. '+state.lv;$('#kills').textContent='击退 '+state.kills;$('#xp').style.width=Math.min(100,state.xp/state.need*100)+'%';$('#pause').disabled=!['play','pause'].includes(mode)}
function burst(x,y,c,n=7){for(let i=0;i<n;i++)state.particles.push({x,y,vx:rnd(-35,35),vy:rnd(-35,35),life:.4,c})}
function hit(e,d){if(e.hp<=0)return;e.hp-=d;e.flash=.1;if(e.hp<=0){state.kills++;state.gems.push({x:e.x,y:e.y});burst(e.x,e.y,'#75d4db');sound(180,.025)}}
function tick(dt){if(state.zone==='home'){tickHome(dt);return}let s=state,p=s.p;s.time+=dt;p.animTime+=dt;p.inv-=dt;let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0),dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);if(joy){dx=joy.dx;dy=joy.dy}let norm=Math.hypot(dx,dy);if(norm>1){dx/=norm;dy/=norm}const beforeX=p.x,beforeY=p.y;
if(s.mapId)moveExplorer(p,dx*p.speed*dt,dy*p.speed*dt,7,12);else{p.x=Math.max(22,Math.min(W-22,p.x+dx*p.speed*dt));p.y=Math.max(35,Math.min(H-25,p.y+dy*p.speed*dt));}
const traveled=Math.hypot(p.x-beforeX,p.y-beforeY);updateNoctMotion(p,dt,traveled,dx,dy);
if(typeof tickForestGather==='function')tickForestGather(dt);s.spawn-=dt;
if(s.spawn<=0&&s.enemies.length<160){s.spawn=Math.max(.3,.9-Math.min(s.time,180)/360);let edge=Math.floor(rnd(0,4)),t=s.time>30&&Math.random()<.24?1:0;const spot=s.mapId?pickExplorationSpawn():{x:edge===0?-10:edge===1?650:rnd(0,W),y:edge===2?-10:edge===3?410:rnd(0,H)};if(spot)s.enemies.push({...spot,hp:t?4+Math.floor(s.time/65):2+Math.floor(s.time/70),speed:t?19+s.time*.07:27+s.time*.09,r:t?12:8,type:t,flash:0,flameCd:0})}
s.shot-=dt;let target=null,min=240;for(const e of s.enemies){const d=dist(e,p);if(e.hp>0&&d<min){target=e;min=d}}if(target&&s.shot<=0){s.shot=s.rate;const a=Math.atan2(target.y-p.y,target.x-p.x);s.bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*230,vy:Math.sin(a)*230,life:1.5});sound(620,.035)}
if(s.mapId)updateExplorationFlow(dt);
for(const e of s.enemies){if(e.hp<=0)continue;e.flash-=dt;e.flameCd-=dt;const d=dist(e,p)||1;if(s.mapId)moveExplorationEnemy(e,dt);else{e.x+=(p.x-e.x)/d*e.speed*dt;e.y+=(p.y-e.y)/d*e.speed*dt;}if(dist(e,p)<e.r+6&&p.inv<=0){p.hp--;p.inv=1.2;burst(p.x,p.y,'#ef8797');sound(90,.13);if(p.hp<=0){end(false);updateHUD();return}}for(let i=0;i<s.flames;i++){let a=s.time*2+i*Math.PI*2/s.flames,f={x:p.x+Math.cos(a)*32,y:p.y+Math.sin(a)*32};if(dist(e,f)<e.r+5&&e.flameCd<=0){hit(e,s.damage);e.flameCd=.45}}}
for(const b of s.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;if(s.mapId&&explorationBlocked(b.x,b.y,1)){b.life=0;continue}for(const e of s.enemies)if(e.hp>0&&dist(e,b)<e.r+3){hit(e,s.damage);b.life=0;break}}
s.enemies=s.enemies.filter(e=>e.hp>0);s.bullets=s.bullets.filter(b=>b.life>0);s.gems=s.gems.filter(g=>{let d=dist(g,p);if(d<s.magnet){const mx=(p.x-g.x)*Math.min(1,dt*9),my=(p.y-g.y)*Math.min(1,dt*9);if(s.mapId)moveExplorer(g,mx,my,1,0);else{g.x+=mx;g.y+=my}}if(d<9){s.xp++;if(s.loot&&++s.collected%4===0)s.loot.star++;return false}return true});for(const a of s.particles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.life-=dt}s.particles=s.particles.filter(a=>a.life>0);if(s.mapId){if(tickExploration(dt)){updateHUD();return}}else if(s.time>=180)end(true);if(mode==='play'&&s.xp>=s.need)levelUp();updateHUD()}
function rect(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
function tree(t){let {x,y,size:r}=t;rect(x-2,y,4,r,'#102231');for(let i=0;i<4;i++){let w=(i+1)*r/3;rect(x-w,y-r+i*r/3,w*2,r/2,'#071b2b');rect(x-w+2,y-r+i*r/3,w*.6,3,'#0a2535')}}
function glow(x,y,r,color,strength=1){ctx.save();ctx.globalAlpha=strength;const grad=ctx.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=grad;ctx.fillRect(x-r,y-r,r*2,r*2);ctx.restore()}
function drawFox(p,s){const pose=selectNoctPose(p);
 ctx.fillStyle='#03132066';ctx.beginPath();ctx.ellipse(p.x,p.y+12,12,3,0,0,Math.PI*2);ctx.fill();
 if(p.inv>0&&Math.floor(p.inv*12)%2!==0)return;
 ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y+14));
 if(pose.kind==='walk'&&foxAtlas){ctx.scale(pose.flip,1);ctx.drawImage(foxAtlas,pose.frame*64,pose.direction*64,64,64,-32,-56,64,64)}
 else if(pose.kind==='stand'&&standAtlas){ctx.scale(pose.flip,1);ctx.drawImage(standAtlas,(pose.index%4)*64,Math.floor(pose.index/4)*64,64,64,-32,-56,64,64)}
 else if(idleLayers.length)drawIdleFox(p,pose.kind==='settle');
 else if(foxAtlas)ctx.drawImage(foxAtlas,0,0,64,64,-32,-56,64,64);
 ctx.restore();
}
function draw(){if(state.zone==='home'&&typeof drawHome==='function'){drawHome();return}ctx.save();if(state.mapId)drawExplorationGround();else{ctx.fillStyle='#344963';ctx.fillRect(0,0,W,H);const hasForest=forestArt.complete&&forestArt.naturalWidth;if(hasForest)ctx.drawImage(forestArt,0,0,W,H);else{for(const d of deco){if(d.type<.75){rect(d.x,d.y,1,3,'#1b4050');rect(d.x+3,d.y-2,1,4,'#1b4050')}else{rect(d.x,d.y,5,3,'#294450');rect(d.x+1,d.y-1,3,1,'#3b5260')}}trees.forEach(tree)}}
let s=state,p=s.p;glow(p.x,p.y,48,'rgba(80,205,236,.13)',idlePose(p).pulse);glow(p.x,p.y,16,'rgba(114,234,255,.16)');
if(!s.mapId)for(let i=0;i<13;i++){let x=35+(i*149)%570+Math.sin(s.time*.4+i)*9,y=45+(i*73)%310+Math.cos(s.time*.6+i)*6,a=.25+(Math.sin(s.time*1.7+i*2)+1)*.22;glow(x,y,8,'rgba(91,220,207,.13)',a);ctx.globalAlpha=a;rect(x,y,1,1,'#9ef3cc');ctx.globalAlpha=1}
for(const g of s.gems){rect(g.x-1,g.y-3,3,7,'#73e5eb');rect(g.x-3,g.y-1,7,3,'#52bace');rect(g.x,g.y-1,1,2,'#d0ffff')}
for(const e of s.enemies){let r=e.r,y=e.y+Math.sin(s.time*5+e.x)*1.2,c=e.flash>0?'#e0fffa':e.type?'#5d537f':'#343955';
rect(e.x-r+3,y-r,2*r-6,2*r,c);rect(e.x-r,y-r+4,2*r,2*r-8,c);rect(e.x-r+2,y+r-4,5,4,c);rect(e.x+r-6,y+r-3,4,3,c);
rect(e.x-r+4,y-r+2,2*r-9,2,e.flash>0?'#ffffff':e.type?'#8172a2':'#4d5375');
rect(e.x-5,y-3,3,4,'#ffecd4');rect(e.x+3,y-3,3,4,'#ffecd4');rect(e.x-4,y-2,1,2,'#242a43');rect(e.x+4,y-2,1,2,'#242a43');rect(e.x-1,y+3,3,1,'#b592b9');rect(e.x-7,y+2,2,1,'#cc87a9');rect(e.x+6,y+2,2,1,'#cc87a9')}

if(typeof drawForestGather==='function')drawForestGather();drawFox(p,s);
for(let i=0;i<s.flames;i++){let a=s.time*2+i*Math.PI*2/s.flames,x=p.x+Math.cos(a)*32,y=p.y+Math.sin(a)*32;rect(x-2,y-3,5,7,'#4bd4e6');rect(x,y-5,2,7,'#c3ffff')}
for(const b of s.bullets){rect(b.x-2,b.y-2,4,4,'#d3ffff');rect(b.x-b.vx*.02,b.y-b.vy*.02,2,2,'#6bd8ee')}for(const a of s.particles)rect(a.x,a.y,2,2,a.c);ctx.restore();if(s.mapId)drawExplorationOverlay();}
function frame(t){const dt=Math.min(.04,(t-last)/1000||0);last=t;if(mode==='play')tick(dt);else if(mode==='title'){state.p.animTime+=dt;state.p.idleTime+=dt}draw();requestAnimationFrame(frame)}
window.addEventListener('keydown',e=>{if(e.target?.tagName==='BUTTON'&&(e.code==='Space'||e.code==='Enter'))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();keys.add(e.key.toLowerCase());if((e.code==='Space'||e.code==='Escape')&&!e.repeat)pause()});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();joy=null;$('#touch').style.display='none';if(mode==='play')pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='play')pause()});$('#pause').onclick=pause;
canvas.addEventListener('pointerdown',e=>{if(mode!=='play')return;canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();joy={id:e.pointerId,x:e.clientX,y:e.clientY,dx:0,dy:0};$('#touch').style.cssText='display:block;left:'+(e.clientX-r.left-40)+'px;top:'+(e.clientY-r.top-40)+'px'});canvas.addEventListener('pointermove',e=>{if(!joy||joy.id!==e.pointerId)return;joy.dx=(e.clientX-joy.x)/35;joy.dy=(e.clientY-joy.y)/35;let n=Math.max(1,Math.hypot(joy.dx,joy.dy));joy.dx/=n;joy.dy/=n;$('#touch i').style.transform='translate('+joy.dx*24+'px,'+joy.dy*24+'px)'});function release(){joy=null;$('#touch').style.display='none'}canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);reset();requestAnimationFrame(frame);
try{if(document.modelContext?.registerTool){document.modelContext.registerTool({name:'read_game_status',description:'Read current Noct game status.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({scene:state.zone||'forest',home:typeof homeReady!=='undefined'&&homeReady?{night:home.night,wood:home.wood,stone:home.stone,star:home.star,plots:home.plots,house:home.house,workshop:home.workshop,garden:home.garden}:null,mode,seconds:Math.floor(state.time),level:state.lv,health:state.p.hp,kills:state.kills})})}}catch{}
