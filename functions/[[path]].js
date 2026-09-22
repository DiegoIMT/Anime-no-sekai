const SUPABASE_URL = 'https://uobqjdvaovqbqthnmvpm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_5L3IfGy74SfEDB0YNnH9Fw_n3HjwND7';

const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const headers = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

async function rest(table, params) {
  const u = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k,v]) => u.searchParams.set(k,v));
  const r = await fetch(u, { headers });
  if (!r.ok) return [];
  return r.json();
}
async function productData(kind, sku) {
  if (kind === 'figura') {
    const rows = await rest('productos', { select:'id,sku,nombre,descripcion,precio,precio_oferta,estado,activo', sku:`eq.${sku}`, activo:'eq.true', limit:'1' });
    const p = rows[0]; if (!p) return null;
    const imgs = await rest('producto_imagenes', { select:'url,principal,orden', producto_id:`eq.${p.id}`, order:'principal.desc,orden.asc', limit:'1' });
    return {...p, image:imgs[0]?.url || null};
  }
  const rows = await rest('productos_adicionales', { select:'id,sku,nombre,descripcion,precio,precio_oferta,estado,activo', sku:`eq.${sku}`, activo:'eq.true', limit:'1' });
  const p = rows[0]; if (!p) return null;
  const imgs = await rest('producto_adicional_imagenes', { select:'url,principal,orden', producto_id:`eq.${p.id}`, order:'principal.desc,orden.asc', limit:'1' });
  return {...p, image:imgs[0]?.url || null};
}
function money(n){return new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(Number(n||0))}
function status(s){return ({disponible:'Disponible',apartada:'Apartada',vendida:'Vendida',proximamente:'Próximamente'})[s]||s||''}
function injectMeta(html, meta) {
  const tags = `
  <title>${esc(meta.title)}</title>
  <meta name="description" content="${esc(meta.description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Anime no Sekai">
  <meta property="og:title" content="${esc(meta.title)}">
  <meta property="og:description" content="${esc(meta.description)}">
  <meta property="og:url" content="${esc(meta.url)}">
  <meta property="og:image" content="${esc(meta.image)}">
  <meta property="og:image:secure_url" content="${esc(meta.image)}">
  <meta property="og:image:type" content="image/jpeg">
  <meta property="og:image:alt" content="${esc(meta.title)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(meta.title)}">
  <meta name="twitter:description" content="${esc(meta.description)}">
  <meta name="twitter:image" content="${esc(meta.image)}">
  <link rel="canonical" href="${esc(meta.url)}">`;
  html = html.replace(/<title>[\s\S]*?<\/title>/i,'')
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]+|twitter:[^"]+)"[^>]*>\s*/gi,'')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi,'');
  return html.replace('</head>', `${tags}\n</head>`);
}
async function indexHtml(request, env) {
  const u = new URL('/index.html', request.url);
  const r = await env.ASSETS.fetch(new Request(u, request));
  return r.text();
}
async function proxyImage(url) {
  const r = await fetch(url, { cf:{cacheTtl:86400,cacheEverything:true} });
  if (!r.ok) return new Response('Imagen no disponible',{status:404});
  const h = new Headers(r.headers); h.set('Cache-Control','public, max-age=86400');
  return new Response(r.body,{status:200,headers:h});
}
export async function onRequest(context) {
  const {request, env} = context, url = new URL(request.url), path = url.pathname;
  if (path === '/social/portada.jpg') {
    const asset = await env.ASSETS.fetch(new Request(new URL('/AnimenoSekai.jpg', url), request));
    if (!asset.ok) return asset;
    const h=new Headers(asset.headers);h.set('Content-Type','image/jpeg');h.set('Cache-Control','public, max-age=86400');
    return new Response(asset.body,{status:200,headers:h});
  }
  let m = path.match(/^\/social\/(figura|producto)\/([^/]+)\.jpg$/i);
  if (m) {
    const kind=m[1].toLowerCase(), sku=decodeURIComponent(m[2]);
    const p=await productData(kind,sku); if(!p?.image)return new Response('Imagen no disponible',{status:404});
    return proxyImage(p.image);
  }
  m = path.match(/^\/(figura|producto)\/([^/]+)\/?$/i);
  if (m) {
    const kind=m[1].toLowerCase(), sku=decodeURIComponent(m[2]);
    const p=await productData(kind,sku); if(!p)return env.ASSETS.fetch(new Request(new URL('/index.html',url),request));
    const canonical=`${url.origin}/${kind}/${encodeURIComponent(p.sku)}`;
    const image=`${url.origin}/social/${kind}/${encodeURIComponent(p.sku)}.jpg`;
    const price=money(p.precio_oferta ?? p.precio);
    const description=`${status(p.estado)} · ${price} · ${String(p.descripcion||'Disponible en Anime no Sekai.').slice(0,150)}`;
    const html=injectMeta(await indexHtml(request,env),{title:`${p.nombre} | Anime no Sekai`,description,url:canonical,image});
    return new Response(html,{headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'public, max-age=300'}});
  }
  return env.ASSETS.fetch(request);
}
