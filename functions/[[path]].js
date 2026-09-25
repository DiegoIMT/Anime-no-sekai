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

async function siteShareImage() {
  const rows = await rest('configuracion_sitio', { select:'portada_url', id:'eq.1', limit:'1' });
  return rows[0]?.portada_url || null;
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
  // Cloudflare Pages ASSETS expects the pretty route for HTML assets.
  // Requesting /index.html can be redirected to /; fetch the root asset directly.
  const u = new URL(request.url);
  u.pathname = '/';
  u.search = '';
  u.hash = '';
  const assetRequest = new Request(u.toString(), { method: 'GET', headers: request.headers });
  const r = await env.ASSETS.fetch(assetRequest);
  if (!r.ok) throw new Error(`No se pudo cargar la portada base (${r.status})`);
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
  let m = path.match(/^\/social\/(figura|producto)\/([^/]+)\.jpg$/i);
  if (m) {
    const kind=m[1].toLowerCase(), sku=decodeURIComponent(m[2]);
    const p=await productData(kind,sku); if(!p?.image)return new Response('Imagen no disponible',{status:404});
    return proxyImage(p.image);
  }
  if (path === '/' || path === '') {
    const heroImage = await siteShareImage();
    if (heroImage) {
      const html = injectMeta(await indexHtml(request,env), {
        title:'Anime no Sekai | Figuras & Coleccionables',
        description:'Figuras de anime y coleccionables en Mérida, Yucatán. Entrega local y atención directa por WhatsApp.',
        url:`${url.origin}/`,
        image:heroImage
      });
      return new Response(html,{headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'public, max-age=300'}});
    }
    return env.ASSETS.fetch(request);
  }
  const publicPages = {
    '/figuras': {title:'Figuras | Anime no Sekai', description:'Explora el catálogo de figuras de anime disponibles en Anime no Sekai, Mérida, Yucatán.'},
    '/ofertas': {title:'Ofertas | Anime no Sekai', description:'Consulta las figuras con precio especial disponibles en Anime no Sekai.'},
    '/proximamente': {title:'Próximamente | Anime no Sekai', description:'Descubre las figuras que vienen en camino a Anime no Sekai.'},
    '/ami-no-sekai': {title:'Ami no Sekai | Tejiendo pequeños mundos', description:'Ami no Sekai: amigurumis y creaciones artesanales hechas con cariño.'},
    '/ayuda': {title:'Centro de ayuda | Anime no Sekai', description:'Conoce cómo comprar, apartar y coordinar entregas locales con Anime no Sekai en Mérida, Yucatán.'}
  };
  if (publicPages[path.replace(/\/$/,'')]) {
    const key=path.replace(/\/$/,''); const info=publicPages[key]; const heroImage=await siteShareImage();
    const image=key==='/ami-no-sekai'?`${url.origin}/assets/ami-no-sekai-og.jpg`:(heroImage||`${url.origin}/assets/ami-no-sekai-og.jpg`);
    const html=injectMeta(await indexHtml(request,env),{...info,url:`${url.origin}${key}`,image});
    return new Response(html,{headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'public, max-age=300'}});
  }
  m = path.match(/^\/(figura|producto)\/([^/]+)\/?$/i);
  if (m) {
    const kind=m[1].toLowerCase(), sku=decodeURIComponent(m[2]);
    const p=await productData(kind,sku);
    if(!p){
      const fallback = new URL(url);
      fallback.pathname = '/'; fallback.search = ''; fallback.hash = '';
      return env.ASSETS.fetch(new Request(fallback.toString(), { method:'GET', headers:request.headers }));
    }
    const canonical=`${url.origin}/${kind}/${encodeURIComponent(p.sku)}`;
    const image=`${url.origin}/social/${kind}/${encodeURIComponent(p.sku)}.jpg`;
    const price=money(p.precio_oferta ?? p.precio);
    const description=`${status(p.estado)} · ${price} · ${String(p.descripcion||'Disponible en Anime no Sekai.').slice(0,150)}`;
    const html=injectMeta(await indexHtml(request,env),{title:`${p.nombre} | Anime no Sekai`,description,url:canonical,image});
    return new Response(html,{headers:{'Content-Type':'text/html; charset=UTF-8','Cache-Control':'public, max-age=300'}});
  }
  return env.ASSETS.fetch(request);
}
