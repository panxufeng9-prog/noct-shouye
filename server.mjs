// Executed only behind Sites dispatch. Identity comes from its authenticated headers.
const json=(data,status=200,extra={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...extra}});
function validateSave(v){
 if(!v||typeof v!=='object'||v.version!==1)return null;
 const out={version:1};
 for(const k of ['night','wood','stone','star','radish','bell','house','workshop','garden','harvested','expeditions']){const n=v[k];if(!Number.isInteger(n)||n<0||n>1000000)return null;out[k]=n}
 if(out.night<1||out.house>1||out.workshop>1||out.garden>1||typeof v.blessing!=='boolean')return null;
 out.blessing=v.blessing;
 if(!Array.isArray(v.plots)||![2,4].includes(v.plots.length))return null;
 out.plots=[];for(const p of v.plots){if(p===null){out.plots.push(null);continue}if(!p||!['radish','bell'].includes(p.type)||!Number.isInteger(p.growth)||p.growth<0||p.growth>(p.type==='radish'?2:3))return null;out.plots.push({type:p.type,growth:p.growth})}
 return out;
}
export async function homeAPI(request,env){
 const user=request.headers.get('oai-authenticated-user-id');
 if(!user)return json({error:'请使用当前账号打开家园'},401);
 if(!env.BUCKET)return json({error:'存档暂时无法连接'},503);
 const key='noct-home/v1/'+encodeURIComponent(user)+'.json';
 if(request.method==='GET'){const obj=await env.BUCKET.get(key);return obj?new Response(obj.body,{headers:{'Content-Type':'application/json','Cache-Control':'no-store','ETag':obj.httpEtag}}):json(null);}
 if(request.method!=='PUT')return json({error:'Method not allowed'},405,{Allow:'GET, PUT'});
 if(request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Forbidden'},403);
 const origin=request.headers.get('Origin');if(origin&&origin!==new URL(request.url).origin)return json({error:'Forbidden'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Invalid content type'},415);
 const body=await request.text();if(body.length>6000)return json({error:'Save too large'},413);
 let data;try{data=validateSave(JSON.parse(body))}catch{}if(!data)return json({error:'Invalid save'},400);
 const ifMatch=request.headers.get('If-Match'),ifNone=request.headers.get('If-None-Match');
 if(!ifMatch&&ifNone!=='*')return json({error:'Missing save revision'},428);
 const conditional=new Headers();conditional.set(ifMatch?'If-Match':'If-None-Match',ifMatch||'*');
 const written=await env.BUCKET.put(key,JSON.stringify(data),{onlyIf:conditional,httpMetadata:{contentType:'application/json'}});
 if(!written){const current=await env.BUCKET.get(key);if(current&&await current.text()===JSON.stringify(data))return json({ok:true},200,{ETag:current.httpEtag});return json({error:'存档在另一个页面发生了变化'},409);}
 return json({ok:true},200,{ETag:written.httpEtag});
}
export default {async fetch(request,env){try{const url=new URL(request.url);if(url.pathname==='/api/home')return await homeAPI(request,env);if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});const key=url.pathname==='/'?'/index.html':url.pathname;const asset=SITE_ASSETS[key];if(!asset)return new Response('Not found',{status:404});const binary=Uint8Array.from(atob(asset.data),c=>c.charCodeAt(0));return new Response(request.method==='HEAD'?null:binary,{headers:{'Content-Type':asset.type,'Cache-Control':asset.type.startsWith('image/')?'private, max-age=86400':'no-cache','X-Content-Type-Options':'nosniff'}});}catch(error){console.error('Noct request failed',error?.message);return json({error:'家园暂时连接不上，请重试'},503);}}};
