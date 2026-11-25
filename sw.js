const V='zhurnal-to-v10';
const CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const XLSX='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(async c=>{
    await c.addAll(CORE);
    try{await c.add(new Request(XLSX,{mode:'no-cors'}))}catch(_){}
  }).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||!/^https?:/.test(r.url)||r.headers.has('apikey')||r.headers.has('authorization'))return;
  if(new URL(r.url).origin===self.location.origin){
    const nav=r.mode==='navigate';
    e.respondWith(fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(async res=>{
      if(!res.ok)throw new Error('bad');
      const cp=res.clone();caches.open(V).then(c=>c.put(nav?'index.html':r,cp));
      if(res.redirected)return new Response(await res.blob(),{status:200,headers:{'Content-Type':res.headers.get('Content-Type')||'text/html'}});
      return res;
    }).catch(()=>caches.match(nav?'index.html':r,{ignoreSearch:true}).then(h=>h||caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(hit=>{
    const net=fetch(r).then(res=>{
      if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(V).then(c=>c.put(r,cp))}
      return res;
    }).catch(()=>hit||(r.mode==='navigate'?caches.match('index.html'):undefined));
    e.waitUntil(net.catch(()=>{}));
    return hit||net;
  }));
});
