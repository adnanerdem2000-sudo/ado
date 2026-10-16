/* Futbol Kariyeri — çevrimdışı önbellek (GitHub Pages). Sayfa ve yazı tipleri önbellekten açılır,
   arka planda yeni sürüm indirilir; yeni sürüm bir sonraki açılışta görünür. SURUM yayın sırasında değiştirilir. */
const SURUM='fk-ab2bdbdb030b';
const TEMEL=['./','./index.html','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(SURUM).then(c=>c.addAll(TEMEL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==SURUM&&k.startsWith('fk-')).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  const yazi=/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname),ayni=u.origin===self.location.origin;if(!ayni&&!yazi)return;
  const anahtar=ayni&&(r.mode==='navigate'||u.pathname.endsWith('/'))?'./index.html':r;
  e.respondWith(caches.open(SURUM).then(async c=>{const eski=await c.match(anahtar,{ignoreSearch:true});
    const ag=fetch(r).then(y=>{if(y&&(y.ok||y.type==='opaque'))c.put(anahtar,y.clone());return y;}).catch(()=>null);
    if(eski){e.waitUntil(ag);return eski;}const y=await ag;return y||new Response('Çevrimdışı: oyun henüz önbelleğe alınmadı. Bir kez internete bağlıyken aç.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}));});
