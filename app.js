const SUPABASE_URL = 'https://uobqjdvaovqbqthnmvpm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5L3IfGy74SfEDB0YNnH9Fw_n3HjwND7';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let products = [];
let catalogProducts = [];
let publicCatalogTotal = 0;
let publicCatalogRequestId = 0;
let additionalProducts = [];
let siteConfig = null;
let siteLogoFile = null;
let franchiseLogoFiles = new Map();
let siteFranchises = [];
let siteHeroFile = null;
let siteHeroMobileFile = null;
let publicFranchiseFilter = 'Todas';
let publicSearchQuery = '';
let publicQuickFilter = 'todas';
let publicCatalogFilters = {busqueda:'', franquicia:'', personaje:'', fabricante:'', orden:'recientes'};
let publicCatalogPage = 1;
const PUBLIC_CATALOG_PAGE_SIZE = 24;
const PUBLIC_ADDITIONAL_PAGE_SIZE = 24;
let publicAdditionalPage = 1;
let publicAdditionalTotal = 0;
let publicAdditionalRequestId = 0;
let publicAdditionalFilters = {busqueda:'', tipo:''};
let publicAdditionalTypes = []; 
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
const whatsappIcon = () => '<span class="whatsappIcon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path class="waBubble" d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.6l1.3-4.7A8.5 8.5 0 1 1 20.5 11.8Z"/><path class="waPhone" d="M8.1 7.5c.2-.5.4-.5.8-.5h.4c.2 0 .4.1.5.4l.9 2c.1.3.1.5-.1.7l-.7.8c-.2.2-.1.4 0 .6.5 1 1.2 1.8 2.1 2.4.8.6 1.5.8 1.8.9.3.1.5 0 .7-.2l.9-1.1c.2-.3.5-.3.8-.2l1.9.9c.3.1.5.2.5.4.1.2.1 1-.2 1.9-.3.8-1.6 1.5-2.2 1.6-.6.1-1.4.2-3.9-.8-3.2-1.3-5.2-4.6-5.4-4.9-.2-.3-1.3-1.8-1.3-3.4 0-1.6.8-2.4 1.1-2.8.3-.3.7-.4 1-.4"/></svg></span>';
const icon = (name) => name==='chat' ? whatsappIcon() : ({search:'⌕',menu:'☰',arrow:'›',fire:'🔥',truck:'✈',shield:'✓',sparkle:'✦'})[name] || '';
const statusLabel = s => ({disponible:'Disponible',apartada:'Apartada',vendida:'Vendida',proximamente:'Próximamente'})[s] || s || '';
const currentSiteUrl = (hash='') => `${window.location.origin}/${hash}`;
const publicProductUrl = (sku,kind='figura') => `${window.location.origin}/${kind==='adicional'?'producto':'figura'}/${encodeURIComponent(sku)}`;
function skuFromPublicPath(kind='figura'){const prefix=kind==='adicional'?'/producto/':'/figura/';return location.pathname.startsWith(prefix)?decodeURIComponent(location.pathname.slice(prefix.length).split('/')[0]||''):null}

// Analítica comercial propia. Nunca bloquea la experiencia pública si falla el registro.
async function registerAnalyticsEvent(tipo_evento,{producto_id=null,sku=null,contexto={}}={}){
  try{const {error}=await supabaseClient.from('eventos_analytics').insert({tipo_evento,producto_id,sku,contexto});if(error)console.warn('Analytics:',error.message)}catch(error){console.warn('Analytics:',error)}
}
function trackWhatsapp(p,origen){registerAnalyticsEvent('clic_whatsapp',{producto_id:p.id,sku:p.sku,contexto:{estado:p.status,origen}})}

function mapProduct(row){
  const images=(row.producto_imagenes||[]).slice().sort((a,b)=>(a.orden??0)-(b.orden??0));
  const principal=images.find(x=>x.principal)||images[0];
  return {
    id:row.id, sku:row.sku, name:row.nombre, series:row.franquicia||'Sin franquicia', character:row.personaje||'No especificado',
    manufacturer:row.fabricante||'No especificado', description:row.descripcion||'Consulta disponibilidad y detalles directamente por WhatsApp.',
    price:Number(row.precio), sale:row.precio_oferta==null?null:Number(row.precio_oferta), status:row.estado,
    stock:row.stock, figureCondition:row.condicion_figura||'No especificada', boxCondition:row.condicion_caja||'No especificada',
    origin:row.procedencia||'No especificada', delivery:row.entrega||'A convenir', featured:!!row.destacada,
    images, img:principal?.url||null
  };
}

function mapAdditionalProduct(row){
  const images=(row.producto_adicional_imagenes||[]).slice().sort((a,b)=>(a.orden??0)-(b.orden??0));
  const principal=images.find(x=>x.principal)||images[0];
  return {
    id:row.id, sku:row.sku, name:row.nombre, type:row.tipos_producto?.nombre||'Otros', typeId:row.tipo_producto_id||'',
    series:row.franquicias?.nombre||'', character:row.personajes?.nombre||'',
    description:row.descripcion||'Consulta disponibilidad y detalles directamente por WhatsApp.',
    price:Number(row.precio), sale:row.precio_oferta==null?null:Number(row.precio_oferta), status:row.estado,
    stock:row.stock, handmade:!!row.hecho_mano, madeToOrder:!!row.sobre_pedido,
    leadTime:row.tiempo_elaboracion||'', featured:!!row.destacado, images, img:principal?.url||null
  };
}
function additionalProductAction(p){
  const url=publicProductUrl(p.sku,'adicional'), base=`${p.name} (${p.sku})`;
  if(p.status==='apartada') return {text:'Consultar disponibilidad',cls:'disabled',msg:`Hola, vi ${base} como apartado en Anime no Sekai. ¿Podrías avisarme si vuelve a estar disponible? ${url}`};
  if(p.status==='proximamente') return {text:'Avísame cuando esté disponible',cls:'notify',msg:`Hola, me interesa ${base}. ¿Podrías avisarme cuando esté disponible en Anime no Sekai? ${url}`};
  if(p.status==='vendida') return {text:'¿Puedes hacer/conseguir otro?',cls:'sold',msg:`Hola, vi ${base} en Anime no Sekai. ¿Podrías hacer o conseguir otro? ${url}`};
  return {text:'Apartar por WhatsApp',cls:'',msg:`Hola, me interesa ${base} que vi en Anime no Sekai. ¿Sigue disponible? ${url}`};
}
function additionalProductCard(p){
  const pct=p.sale?Math.round((1-p.sale/p.price)*100):null, action=additionalProductAction(p);
  const wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
  const tags=[p.handmade?'Hecho a mano':'',p.madeToOrder?'Acepta pedidos':''].filter(Boolean);
  return `<article class="card publicAdditionalCard" data-additional-product="${attr(p.sku)}" tabindex="0" role="link" aria-label="Ver ${attr(p.name)}"><div class="photo">${photoMarkup(p)}${pct?`<span class="discount">-${pct}%</span>`:''}<span class="status state-${attr(p.status)}">${statusLabel(p.status)}</span></div><div class="cardBody"><p class="series">${escapeHtml(p.type)}</p><h3>${escapeHtml(p.name)}</h3>${p.series?`<p class="cardCharacter">${escapeHtml(p.series)}${p.character?` · ${escapeHtml(p.character)}`:''}</p>`:''}${tags.length?`<div class="additionalTags">${tags.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div>`:''}<div class="prices">${p.sale?`<span class="old">${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><button class="interestToggle ${isInInterestList(p.sku,'adicional')?'active':''}" data-interest-toggle="${attr(p.sku)}" data-interest-kind="adicional" type="button" aria-pressed="${isInInterestList(p.sku,'adicional')}"><span class="interestStateIcon">${isInInterestList(p.sku,'adicional')?'✓':'＋'}</span> <span class="interestLabel">${isInInterestList(p.sku,'adicional')?'En mi lista':'Agregar a mi lista'}</span></button><button class="details additionalDetails" data-additional="${attr(p.sku)}" type="button">Ver producto <span>${icon('arrow')}</span></button><a class="whatsapp ${action.cls}" data-analytics-whatsapp="${attr(p.sku)}" data-analytics-kind="adicional" href="${attr(wa)}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a></div></article>`;
}

function productAction(p){
  const url=publicProductUrl(p.sku,'figura');
  const base=`${p.name} (${p.sku})`;
  if(p.status==='apartada') return {text:'Consultar disponibilidad',cls:'disabled',msg:`Hola, vi ${base} como apartada en Anime no Sekai. ¿Podrías avisarme si vuelve a estar disponible? ${url}`};
  if(p.status==='proximamente') return {text:'Avísame cuando llegue',cls:'notify',msg:`Hola, me interesa ${base}. ¿Podrías avisarme cuando llegue a Anime no Sekai? ${url}`};
  if(p.status==='vendida') return {text:'¿Puedes conseguirme una?',cls:'sold',msg:`Hola, vi ${base} en Anime no Sekai. ¿Podrías conseguirme una? ${url}`};
  return {text:'Apartar por WhatsApp',cls:'',msg:`Hola, me interesa ${base} que vi en Anime no Sekai. ¿Sigue disponible? ${url}`};
}
function photoMarkup(p){
  return p.img ? `<img src="${attr(p.img)}" alt="${attr(p.name)}" loading="lazy">` : `<div class="photoPlaceholder"><span>界</span><small>Fotografía próximamente</small></div>`;
}
function productCard(p){
  const pct=p.sale?Math.round((1-p.sale/p.price)*100):null, action=productAction(p);
  const wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
  return `<article class="card publicProductCard" data-card-product="${attr(p.sku)}" tabindex="0" role="link" aria-label="Ver ${attr(p.name)}"><div class="photo">${photoMarkup(p)}${pct?`<span class="discount">-${pct}%</span>`:''}<span class="status state-${attr(p.status)}">${statusLabel(p.status)}</span></div><div class="cardBody"><p class="series">${escapeHtml(p.series)}</p><h3>${escapeHtml(p.name)}</h3><p class="cardCharacter">${escapeHtml(p.character)}</p><div class="prices">${p.sale?`<span class="old">${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><button class="interestToggle ${isInInterestList(p.sku,'figura')?'active':''}" data-interest-toggle="${attr(p.sku)}" data-interest-kind="figura" type="button" aria-pressed="${isInInterestList(p.sku,'figura')}"><span class="interestStateIcon">${isInInterestList(p.sku,'figura')?'✓':'＋'}</span> <span class="interestLabel">${isInInterestList(p.sku,'figura')?'En mi lista':'Agregar a mi lista'}</span></button><button class="details" data-product="${attr(p.sku)}" type="button">Ver figura <span>${icon('arrow')}</span></button><a class="whatsapp ${action.cls}" data-analytics-whatsapp="${attr(p.sku)}" data-analytics-kind="figura" href="${attr(wa)}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a></div></article>`;
}

const INTEREST_LIST_KEY='animeNoSekaiInterestList';
function getInterestList(){try{return JSON.parse(sessionStorage.getItem(INTEREST_LIST_KEY)||'[]')}catch{return []}}
function saveInterestList(items){sessionStorage.setItem(INTEREST_LIST_KEY,JSON.stringify(items));updateInterestListUI();document.querySelectorAll('[data-interest-count]').forEach(x=>{x.classList.remove('pulse');void x.offsetWidth;x.classList.add('pulse')})}
function interestItem(p,kind='figura'){return {kind,sku:p.sku,name:p.name,price:p.price,sale:p.sale,status:p.status,img:p.img||'',url:publicProductUrl(p.sku,kind)}}
function isInInterestList(sku,kind='figura'){return getInterestList().some(x=>x.sku===sku&&x.kind===kind)}
function toggleInterest(p,kind='figura'){const items=getInterestList(),i=items.findIndex(x=>x.sku===p.sku&&x.kind===kind);if(i>=0)items.splice(i,1);else items.push(interestItem(p,kind));saveInterestList(items);return i<0}
function updateInterestListUI(){const items=getInterestList();document.querySelectorAll('[data-interest-count]').forEach(x=>{x.textContent=items.length;x.hidden=!items.length});document.querySelectorAll('[data-interest-toggle]').forEach(b=>{const active=isInInterestList(b.dataset.interestToggle,b.dataset.interestKind||'figura');b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));const icon=b.querySelector('.interestStateIcon');if(icon)icon.textContent=active?'✓':'＋';const label=b.querySelector('.interestLabel');if(label)label.textContent=active?'En mi lista':'Agregar a mi lista'});const panel=document.getElementById('interestListPanel');if(panel)renderInterestListPanel(panel)}
function productShareData(p,kind='figura'){const adicional=kind==='adicional',label=adicional?'producto':'figura',articulo=adicional?'este':'esta',url=publicProductUrl(p.sku,kind);return {title:`${p.name} | Anime no Sekai`,text:`Mira ${articulo} ${label} que encontré en Anime no Sekai 💜\n${p.name} · ${money(p.sale||p.price)}`,url}}
async function copyText(text){try{await navigator.clipboard.writeText(text);showPublicToast('Enlace copiado.')}catch{const t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();showPublicToast('Enlace copiado.')}}
function showPublicToast(message){let t=document.getElementById('publicToast');if(!t){t=document.createElement('div');t.id='publicToast';t.className='publicToast';document.body.appendChild(t)}t.textContent=message;t.classList.add('show');clearTimeout(showPublicToast.timer);showPublicToast.timer=setTimeout(()=>t.classList.remove('show'),2200)}
function openShareMenu(data){document.getElementById('shareMenu')?.remove();const wrap=document.createElement('div');wrap.id='shareMenu';wrap.className='shareMenuBackdrop';const full=`${data.text}\n${data.url}`;wrap.innerHTML=`<div class="shareMenu" role="dialog" aria-modal="true" aria-label="Compartir"><div class="shareMenuHead"><div><b>Compartir</b><small>${escapeHtml(data.title)}</small></div><button type="button" data-share-close aria-label="Cerrar">×</button></div><div class="shareMenuActions"><button type="button" data-native-share>↗ Compartir…</button><a href="https://wa.me/?text=${encodeURIComponent(full)}" target="_blank" rel="noopener">${whatsappIcon()} WhatsApp</a><button type="button" data-copy-share>⧉ Copiar enlace</button></div><p>En celular, “Compartir…” abre las aplicaciones disponibles. Si WhatsApp ofrece <b>Mi estado</b>, puedes publicarlo desde ahí.</p></div>`;document.body.appendChild(wrap);const close=()=>wrap.remove();wrap.addEventListener('click',e=>{if(e.target===wrap||e.target.closest('[data-share-close]'))close()});wrap.querySelector('[data-copy-share]').addEventListener('click',()=>{copyText(data.url);close()});wrap.querySelector('[data-native-share]').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share(data);close()}catch(e){if(e.name!=='AbortError')showPublicToast('No se pudo abrir el menú para compartir.')}}else{copyText(full);close()}})}
function openInterestList(){document.getElementById('interestListView')?.remove();const view=document.createElement('div');view.id='interestListView';view.className='interestListView';view.innerHTML=`<section class="interestListPanel" id="interestListPanel" role="dialog" aria-modal="true" aria-label="Mi lista"><div class="interestListHead"><div><span class="kicker">SELECCIÓN PERSONAL</span><h2>Mi lista</h2><p>Reúne varias piezas y consulta todo en un solo mensaje.</p></div><button type="button" data-interest-close aria-label="Cerrar">×</button></div><div class="interestListContent"></div></section>`;document.body.appendChild(view);renderInterestListPanel(view.querySelector('#interestListPanel'));const close=()=>view.remove();view.addEventListener('click',e=>{if(e.target===view||e.target.closest('[data-interest-close]'))close()})}
function renderInterestListPanel(panel){const box=panel.querySelector('.interestListContent');if(!box)return;const items=getInterestList();if(!items.length){box.innerHTML='<div class="interestEmpty"><b>Tu lista está vacía.</b><span>Agrega figuras o productos mientras exploras la tienda.</span><button type="button" data-interest-close>Seguir explorando</button></div>';return}const rows=items.map(x=>`<article class="interestRow"><div class="interestThumb">${x.img?`<img src="${attr(x.img)}" alt="">`:'<span>界</span>'}</div><div><small>${escapeHtml(x.sku)}</small><b>${escapeHtml(x.name)}</b><strong>${money(x.sale||x.price)}</strong></div><button type="button" data-interest-remove="${attr(x.sku)}" data-interest-kind="${attr(x.kind)}" aria-label="Quitar ${attr(x.name)}">×</button></article>`).join('');const lines=items.map(x=>`• ${x.sku} — ${x.name} — ${money(x.sale||x.price)}\n  ${x.url}`).join('\n');const consult=`Hola, estoy interesado en estas piezas de Anime no Sekai:\n\n${lines}\n\n¿Me puedes confirmar disponibilidad?`;const share=`Mira estas piezas que seleccioné en Anime no Sekai 💜\n\n${lines}`;box.innerHTML=`<div class="interestRows">${rows}</div><div class="interestListActions"><a class="whatsapp" href="https://wa.me/529994739090?text=${encodeURIComponent(consult)}" target="_blank" rel="noopener">${whatsappIcon()} Consultar lista por WhatsApp</a><a class="interestShare" href="https://wa.me/?text=${encodeURIComponent(share)}" target="_blank" rel="noopener">${whatsappIcon()} Compartir lista por WhatsApp</a><button type="button" data-interest-clear>Vaciar lista</button></div>`}
function storeShareData(){return {title:'Anime no Sekai | Figuras & Coleccionables',text:'💜 Descubre Anime no Sekai\nFiguras de anime y coleccionables en Mérida, Yucatán. Entrega local disponible.',url:`${window.location.origin}/`}}
function findPublicProduct(sku,kind){return kind==='adicional'?additionalProducts.find(x=>x.sku===sku):(products.find(x=>x.sku===sku)||catalogProducts.find(x=>x.sku===sku))}

function openHelpView(push=true,embedded=false){
 document.getElementById('helpView')?.remove();
 const view=document.createElement('section');view.id='helpView';view.className='helpView';
 view.innerHTML=`<div class="helpTop"><button class="backBtn" type="button" data-help-close>‹ Volver a la tienda</button><button class="detailClose" type="button" data-help-close aria-label="Cerrar">×</button></div><div class="helpShell"><div class="helpHero"><span class="kicker">CENTRO DE AYUDA</span><h1>¿Cómo podemos ayudarte?</h1><p>Conoce cómo explorar Anime no Sekai, consultar productos y apartar tus piezas favoritas en Mérida, Yucatán.</p></div><div class="helpQuick"><a href="#help-buy">Cómo comprar</a><a href="#help-list">Mi lista</a><a href="#help-status">Estados</a><a href="#help-extra">Más para tu colección</a></div><div class="helpFaq">
 <details id="help-buy" open><summary><span>01</span><b>¿Cómo comprar o apartar un producto?</b></summary><div><p>Explora el catálogo, abre el producto que te interesa y revisa su estado, precio y detalles. Después utiliza su botón de WhatsApp para consultar o apartarlo. La disponibilidad y la entrega se confirman directamente por WhatsApp.</p><p><strong>Anime no Sekai opera en Mérida, Yucatán</strong>, con entrega local coordinada directamente contigo.</p></div></details>
 <details id="help-list"><summary><span>02</span><b>¿Qué es Mi lista?</b></summary><div><p>Mi lista te permite reunir varias figuras o productos antes de escribirnos. Agrega todo lo que te interese y después usa <strong>Consultar lista por WhatsApp</strong> para enviar una sola consulta con todas las piezas seleccionadas.</p><p>La lista es temporal en tu navegador; no es un carrito de compra ni requiere crear una cuenta.</p></div></details>
 <details id="help-status"><summary><span>03</span><b>¿Qué significan los estados?</b></summary><div class="helpStatusGrid"><p><strong>Disponible</strong><small>La pieza está disponible para consulta o apartado.</small></p><p><strong>Apartada</strong><small>La pieza se encuentra apartada; puedes consultar su disponibilidad.</small></p><p><strong>Vendida</strong><small>Ya fue vendida, pero puedes preguntarnos si podemos conseguir otra.</small></p><p><strong>Próximamente</strong><small>La pieza viene en camino. Puedes escribirnos para mostrar tu interés.</small></p></div></details>
 <details><summary><span>04</span><b>¿Cómo funcionan las ofertas?</b></summary><div><p>Cuando un producto tiene oferta verás su precio anterior tachado y el precio especial destacado. También puedes entrar a la sección <strong>Ofertas</strong> para consultar las promociones disponibles.</p></div></details>
 <details id="help-extra"><summary><span>05</span><b>¿Qué es “Más para tu colección”?</b></summary><div><p>Es el espacio para productos complementarios como amigurumis, peluches, llaveros, tazas y otros artículos. Algunos pueden ser hechos a mano o estar disponibles sobre pedido; revisa la información indicada en cada producto.</p></div></details>
 <details><summary><span>06</span><b>¿Cómo uso la búsqueda y los filtros?</b></summary><div><p>Puedes buscar por nombre, SKU, personaje, anime o fabricante. En el catálogo también puedes filtrar por franquicia, personaje y fabricante, además de ordenar los resultados.</p></div></details>
 <details><summary><span>07</span><b>¿Qué hago si no encuentro una figura?</b></summary><div><p>En la sección <strong>Próximamente</strong> encontrarás la opción “¿Buscas otra figura?”. Escríbenos por WhatsApp y revisaremos si podemos conseguir la pieza que buscas.</p></div></details>
 <details><summary><span>08</span><b>¿Dónde realizan entregas?</b></summary><div><p>Actualmente ofrecemos <strong>entrega local en Mérida, Yucatán</strong>. El punto, horario y detalles de la entrega se coordinan directamente por WhatsApp al confirmar tu producto.</p></div></details>
 <details><summary><span>09</span><b>¿Puedo compartir una figura o producto?</b></summary><div><p>Sí. Desde el detalle puedes usar <strong>Compartir</strong> para enviarlo por WhatsApp u otras aplicaciones compatibles. También puedes compartir Anime no Sekai desde el pie de la tienda.</p></div></details>
 </div><div class="helpContact"><span class="kicker">¿TODAVÍA TIENES DUDAS?</span><h2>Estamos para ayudarte</h2><p>Escríbenos directamente y resolveremos tu consulta.</p><a class="whatsapp" href="https://wa.me/529994739090?text=${encodeURIComponent('Hola, necesito ayuda con Anime no Sekai.')}" target="_blank" rel="noopener">${whatsappIcon()} Preguntar por WhatsApp</a></div></div>`;
 (embedded&&document.getElementById('helpRouteMount')?document.getElementById('helpRouteMount'):document.body).appendChild(view);if(!embedded)document.body.classList.add('detail-open');
 const close=()=>{view.remove();document.body.classList.remove('detail-open');if(location.hash==='#ayuda')history.replaceState({},'',location.pathname+location.search)};
 view.querySelectorAll('[data-help-close]').forEach(b=>b.addEventListener('click',close));
 view.querySelectorAll('.helpQuick a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();view.querySelector(a.getAttribute('href'))?.scrollIntoView({behavior:'smooth',block:'center'})}));
 if(push)navigatePublic('/ayuda');
}

function renderStoreShell(){
 document.getElementById('app').innerHTML=`
<header><a class="brand" href="/" data-route-link><span class="brandIcon"><span class="mark brandMark">界</span><img class="brandLogo" id="homeLogo" alt="Logo Anime no Sekai" hidden></span><span class="brandText">ANIME NO <b>SEKAI</b><small>FIGURAS & COLECCIONABLES</small></span></a><nav><a href="/" data-route-link>Inicio</a><a href="/figuras" data-route-link>Figuras</a><a href="/ofertas" data-route-link>Ofertas</a><a href="/ami-no-sekai" data-route-link>Ami no Sekai</a><a href="/proximamente" data-route-link>Próximamente</a><a href="/ayuda" data-route-link>Ayuda</a></nav><div class="headActions"><button id="interestListButton" class="interestListButton" type="button" aria-label="Abrir mi lista"><span class="interestListIcon" aria-hidden="true"><span class="interestClipboard"><i></i><i></i><i></i></span></span><span class="interestListText">Mi lista</span><span class="interestCount" data-interest-count hidden>0</span></button><button id="searchToggle" class="headerSearchTrigger" aria-label="Buscar" aria-expanded="false"><span class="headerSearchTriggerIcon">${icon('search')}</span><span class="headerSearchTriggerText">Buscar</span></button><button class="menu" id="mobileMenuButton" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button></div><div class="headerSearch" id="headerSearch" aria-hidden="true"><span class="searchIcon">${icon('search')}</span><input id="publicSearchInput" type="search" autocomplete="off" placeholder="Buscar figura, personaje, anime, SKU o fabricante…" aria-label="Buscar en el catálogo"><button id="searchClose" type="button" aria-label="Cerrar búsqueda">×</button></div><div class="mobileNav" id="mobileNav" aria-hidden="true"><a href="/" data-route-link>Inicio</a><a href="/figuras" data-route-link>Figuras</a><a href="/ofertas" data-route-link>Ofertas</a><a href="/ami-no-sekai" data-route-link>Ami no Sekai</a><a href="/proximamente" data-route-link>Próximamente</a><a href="/ayuda" data-route-link>Ayuda</a></div></header>
<main><section class="hero heroEntering"><div class="heroContent"><span class="eyebrow">${icon('sparkle')} <span id="homePortadaEtiqueta">DIRECTO DESDE JAPÓN</span></span><h1 id="homePortadaTitulo">Tu mundo de<br><em>figuras y coleccionables.</em></h1><p id="homePortadaDescripcion">Encuentra esa pieza que falta en tu colección. Figuras seleccionadas, disponibilidad real y atención directa por WhatsApp.</p><div class="heroBtns"><a href="/figuras" data-route-link class="primary">Explorar figuras ${icon('arrow')}</a><a href="/ofertas" data-route-link class="secondary">${icon('fire')} Ver ofertas</a></div></div><div class="japan">日本<br><span>の世界</span></div></section>
<section class="benefits"><div><span class="featureIcon featureIconJapan" aria-hidden="true"><span class="japanFlag"></span></span><span><b id="homeBeneficio1Titulo">Importadas de Japón</b><small id="homeBeneficio1Descripcion">Piezas seleccionadas</small></span></div><div><span class="featureIcon featureIconLocation" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M12 21s7-6.1 7-13a7 7 0 1 0-14 0c0 6.9 7 13 7 13Z"/><circle cx="12" cy="8" r="2.5"/></svg></span><span><b id="homeBeneficio2Titulo">Estamos en Mérida</b><small id="homeBeneficio2Descripcion">Entrega local disponible</small></span></div><div><span class="featureIcon featureIconWhatsapp" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M20.5 11.8a8.5 8.5 0 0 1-12.6 7.5L3 20.6l1.3-4.7A8.5 8.5 0 1 1 20.5 11.8Z"/><path d="M8.1 7.5c.2-.5.4-.5.8-.5h.4c.2 0 .4.1.5.4l.9 2c.1.3.1.5-.1.7l-.7.8c-.2.2-.1.4 0 .6.5 1 1.2 1.8 2.1 2.4.8.6 1.5.8 1.8.9.3.1.5 0 .7-.2l.9-1.1c.2-.3.5-.3.8-.2l1.9.9c.3.1.5.2.5.4.1.2.1 1-.2 1.9-.3.8-1.6 1.5-2.2 1.6-.6.1-1.4.2-3.9-.8-3.2-1.3-5.2-4.6-5.4-4.9-.2-.3-1.3-1.8-1.3-3.4 0-1.6.8-2.4 1.1-2.8.3-.3.7-.4 1-.4"/></svg></span><span><b id="homeBeneficio3Titulo">Apártala por WhatsApp</b><small id="homeBeneficio3Descripcion">Rápido y sencillo</small></span></div></section>
<section id="universos" class="section universeSection" hidden><div class="sectionHead"><div><span class="kicker">EXPLORA POR UNIVERSO</span><h2>Encuentra tu franquicia favorita</h2><p class="catalogIntro">Ve directo a las figuras del anime que estás buscando.</p></div></div><div id="featuredFranchises" class="universeGrid"></div></section>
<section id="ofertas" class="section"><div class="sectionHead"><div><span class="kicker">🔥 PRECIOS ESPECIALES</span><h2 id="homeTituloOfertas">Ofertas del Sekai</h2></div><a href="/ofertas" data-route-link class="sectionLinkButton">Ver todas ${icon('arrow')}</a></div><div id="offersGrid" class="grid"><p class="catalogMessage">Cargando ofertas…</p></div></section>
<section id="destacados" class="section"><div class="sectionHead"><div><span class="kicker">COLECCIÓN DESTACADA</span><h2 id="homeTituloFiguras">Figuras destacadas</h2></div><a href="/figuras" data-route-link class="sectionLinkButton">Ver todas ${icon('arrow')}</a></div><div id="featuredGrid" class="grid"><p class="catalogMessage">Cargando figuras destacadas…</p></div></section>
<section id="catalogo" class="section catalogSection"><div class="sectionHead catalogHeading"><div><span class="kicker">CATÁLOGO</span><h2>Explora nuestras figuras</h2><p class="catalogIntro">Encuentra personajes de tus animes favoritos y descubre nuevas piezas para tu colección.</p></div><span id="catalogCount" class="catalogCount"></span></div><div id="catalogQuickFilters" class="chips quickFilters"><button class="active" data-quick="todas">Todas</button><button data-quick="ofertas">🔥 Ofertas</button><button data-quick="proximamente">Próximamente</button></div><button id="mobileCatalogFilterToggle" class="mobileCatalogFilterToggle" type="button" aria-expanded="false">⚙ Filtros <span id="mobileCatalogFilterCount" hidden>0</span></button><div class="catalogToolbar" id="catalogToolbar"><label class="catalogSearchField"><span>Buscar</span><input id="catalogSearch" type="search" autocomplete="off" placeholder="Nombre, SKU, personaje, anime…"></label><label><span>Franquicia</span><input id="filterFranchise" list="franchiseOptions" type="search" autocomplete="off" placeholder="Todas las franquicias"><datalist id="franchiseOptions"></datalist></label><label><span>Personaje</span><input id="filterCharacter" list="characterOptions" type="search" autocomplete="off" placeholder="Todos los personajes"><datalist id="characterOptions"></datalist></label><label><span>Fabricante</span><input id="filterManufacturer" list="manufacturerOptions" type="search" autocomplete="off" placeholder="Todos los fabricantes"><datalist id="manufacturerOptions"></datalist></label><label class="sortField"><span>Ordenar por</span><select id="catalogSort"><option value="recientes">Más recientes</option><option value="precio-asc">Precio: menor a mayor</option><option value="precio-desc">Precio: mayor a menor</option><option value="nombre">Nombre A–Z</option></select></label><button id="clearCatalogFilters" class="clearCatalogFilters" type="button">Limpiar filtros</button><button id="applyMobileCatalogFilters" class="applyMobileCatalogFilters" type="button">Ver resultados</button></div><div id="catalogChips" class="chips legacyChips" hidden></div><div id="catalogGrid" class="grid"><p class="catalogMessage">Cargando catálogo…</p></div><nav id="catalogPagination" class="catalogPagination" aria-label="Paginación del catálogo"></nav></section>
<section id="mas-coleccion" class="section additionalSection amiHomeSection"><div class="amiHomeIdentity"><img src="/assets/ami-no-sekai-logo.webp" alt="Ami no Sekai"><div><span class="kicker">UNA SUBMARCA DE ANIME NO SEKAI</span><h2>Ami no Sekai</h2><p class="catalogIntro">Tejiendo pequeños mundos. Amigurumis y creaciones artesanales con una identidad propia.</p></div><a href="/ami-no-sekai" data-route-link class="sectionLinkButton">Descubrir Ami no Sekai ${icon('arrow')}</a></div><div id="additionalGrid" class="grid"><p class="catalogMessage">Cargando productos…</p></div></section>
<section id="proximamente" class="section upcomingSection"><div class="sectionHead"><div><span class="kicker">PRÓXIMAMENTE 🇯🇵</span><h2 id="homeTituloProximamente">Próximamente</h2><p class="catalogIntro">Descubre las figuras que vienen en camino antes de que lleguen.</p></div></div><div id="upcomingGrid" class="grid"><p class="catalogMessage">Cargando próximas figuras…</p></div><div class="arrival upcomingCta"><div><span class="kicker">¿BUSCAS OTRA FIGURA?</span><h2>Pregunta por tu próxima pieza</h2><p>Si buscas alguna figura que todavía no tenemos publicada, pregúntanos y revisamos disponibilidad.</p></div><a id="generalWhatsapp" class="primary" href="#" target="_blank" rel="noopener">${whatsappIcon()} Preguntar por WhatsApp</a></div></section>
<div id="routeParking" hidden></div><section id="routePage" class="routePage" hidden></section></main>
<footer><div class="brand"><span class="brandIcon"><span class="mark brandMark">界</span><img class="brandLogo footerLogo" id="footerLogo" alt="Logo Anime no Sekai" hidden></span><span class="brandText">ANIME NO <b>SEKAI</b></span></div><p>Tu mundo de figuras y coleccionables.</p><button class="footerHelp" type="button" data-open-help>? Centro de ayuda</button><button id="shareStoreButton" class="footerShare" type="button">↗ Compartir Anime no Sekai</button><small>© 2026 Anime no Sekai</small></footer>`;
}

async function loadSiteConfig(){
 const {data,error}=await supabaseClient.from('configuracion_sitio').select('*').eq('id',1).single();
 if(error){console.error('No fue posible cargar la configuración del sitio:',error);return}
 siteConfig=data;
 applySiteConfig(data);
}
function applySiteConfig(c){
 if(!c)return;
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value||''};
 set('homePortadaEtiqueta',c.portada_etiqueta);
 const title=document.getElementById('homePortadaTitulo');
 if(title) title.textContent=c.portada_titulo||'';
 set('homePortadaDescripcion',c.portada_descripcion);
 set('homeBeneficio1Titulo',c.beneficio_1_titulo); set('homeBeneficio1Descripcion',c.beneficio_1_descripcion);
 set('homeBeneficio2Titulo',c.beneficio_2_titulo); set('homeBeneficio2Descripcion',c.beneficio_2_descripcion);
 set('homeBeneficio3Titulo',c.beneficio_3_titulo); set('homeBeneficio3Descripcion',c.beneficio_3_descripcion);
 set('homeTituloOfertas',c.titulo_ofertas); set('homeTituloFiguras',c.titulo_figuras); set('homeTituloProximamente',c.titulo_proximamente);
 applySiteVisuals(c);
}
function applySiteVisuals(c){
 const logo=c?.logo_url||'';
 document.querySelectorAll('.brandLogo').forEach(img=>{img.src=logo;img.hidden=!logo});
 document.querySelectorAll('.brandMark').forEach(el=>el.hidden=!!logo);
 const showText=c?.mostrar_texto_logo !== false;
 document.querySelectorAll('.brand').forEach(el=>el.classList.toggle('logoOnly',!!logo&&!showText));
 document.querySelectorAll('.brandText').forEach(el=>el.hidden=!!logo&&!showText);
 const hero=document.querySelector('.hero');
 if(!hero)return;
 const revealHero=()=>requestAnimationFrame(()=>requestAnimationFrame(()=>hero.classList.add('heroReady')));
 if(!c?.portada_url){
   hero.style.removeProperty('--hero-image');hero.style.removeProperty('--hero-mobile-image');hero.style.removeProperty('--hero-x');hero.style.removeProperty('--hero-y');hero.style.removeProperty('--hero-mobile-x');hero.style.removeProperty('--hero-mobile-y');hero.classList.remove('hasHeroImage');revealHero();return;
 }
 const applyHero=()=>{
   hero.style.setProperty('--hero-image',`url('${String(c.portada_url).replace(/[\']/g,'')}')`);
   hero.style.setProperty('--hero-x',`${Number.isFinite(Number(c.portada_posicion_x))?Number(c.portada_posicion_x):50}%`);
   hero.style.setProperty('--hero-y',`${Number.isFinite(Number(c.portada_posicion_y))?Number(c.portada_posicion_y):50}%`);
   if(c?.portada_movil_url)hero.style.setProperty('--hero-mobile-image',`url('${String(c.portada_movil_url).replace(/[\']/g,'')}')`);else hero.style.removeProperty('--hero-mobile-image');
   hero.style.setProperty('--hero-mobile-x',`${Number.isFinite(Number(c.portada_movil_posicion_x))?Number(c.portada_movil_posicion_x):50}%`);
   hero.style.setProperty('--hero-mobile-y',`${Number.isFinite(Number(c.portada_movil_posicion_y))?Number(c.portada_movil_posicion_y):50}%`);
   hero.classList.add('hasHeroImage');revealHero();
 };
 const currentHeroUrl=(window.matchMedia?.('(max-width:560px)').matches&&c?.portada_movil_url)?c.portada_movil_url:c.portada_url;
 const preload=new Image();preload.onload=applyHero;preload.onerror=applyHero;preload.src=currentHeroUrl;
 if(preload.complete)applyHero();
}

async function loadFeaturedFranchises(){
 const section=document.getElementById('universos'),box=document.getElementById('featuredFranchises');if(!section||!box)return;
 const {data,error}=await supabaseClient.from('franquicias').select('id,nombre,logo_url').eq('activo',true).eq('destacada',true).order('nombre').limit(8);
 if(error){console.error(error);section.hidden=true;return}
 const rows=data||[];section.hidden=!rows.length;if(!rows.length)return;
 box.innerHTML=rows.map(x=>`<button class="universeCard" type="button" data-universe="${attr(x.nombre)}"><span class="universeLogo">${x.logo_url?`<img src="${attr(x.logo_url)}" alt="Logo de ${attr(x.nombre)}">`:'<span class="universeMark">界</span>'}</span><b>${escapeHtml(x.nombre)}</b></button>`).join('');
 syncUniverseActiveState();
 box.querySelectorAll('[data-universe]').forEach(b=>b.onclick=()=>{const name=b.dataset.universe;publicCatalogPage=1;publicQuickFilter='todas';publicCatalogFilters.franquicia=name;publicCatalogFilters.personaje='';const f=document.getElementById('filterFranchise'),c=document.getElementById('filterCharacter');if(f)f.value=name;if(c)c.value='';syncUniverseActiveState();document.querySelectorAll('#catalogQuickFilters button').forEach(x=>x.classList.toggle('active',x.dataset.quick==='todas'));updateCharacterOptions();updateMobileCatalogFilterState();loadCatalogPage();document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'});});
}

function animateRenderedCards(container){
 if(!container)return;
 const cards=[...container.querySelectorAll(':scope > .card')];
 if(!cards.length||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 cards.forEach((card,index)=>{
   card.getAnimations?.().forEach(animation=>animation.cancel());
   card.animate([
     {opacity:0,transform:'translateY(28px) scale(.97)'},
     {opacity:1,transform:'translateY(0) scale(1)'}
   ],{duration:760,delay:Math.min(index,7)*95,easing:'cubic-bezier(.16,.84,.24,1)',fill:'both'}).finished
     .then(()=>{card.getAnimations?.().forEach(animation=>animation.cancel())})
     .catch(()=>{});
 });
}
function prepareDetailMainImage(detail){
 const img=detail?.querySelector('#detailMainImage');if(!img)return;
 const reveal=()=>requestAnimationFrame(()=>img.classList.add('detailImageReady'));
 img.classList.add('detailImageEnter');
 if(img.complete&&img.naturalWidth)reveal();else img.addEventListener('load',reveal,{once:true});
}
function swapDetailMainImage(img,src){
 if(!img)return;
 img.classList.add('detailImageEnter');img.classList.remove('detailImageReady','galleryImageChanging');
 const reveal=()=>requestAnimationFrame(()=>img.classList.add('detailImageReady'));
 img.addEventListener('load',reveal,{once:true});
 img.src=src;
 if(img.complete&&img.naturalWidth)reveal();
}
async function loadPublicCatalog(){
 const [offersRes,featuredRes,upcomingRes]=await Promise.all([
   supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).not('precio_oferta','is',null).order('fecha_creacion',{ascending:false}).limit(4),
   supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).eq('destacada',true).order('fecha_creacion',{ascending:false}).limit(4),
   supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).eq('estado','proximamente').order('fecha_creacion',{ascending:false}).limit(4)
 ]);
 if(offersRes.error||featuredRes.error||upcomingRes.error){console.error(offersRes.error||featuredRes.error||upcomingRes.error)}
 const byId=new Map();[...(offersRes.data||[]),...(featuredRes.data||[]),...(upcomingRes.data||[])].forEach(r=>byId.set(r.id,mapProduct(r)));products=[...byId.values()];
 const offers=(offersRes.data||[]).map(mapProduct),featured=(featuredRes.data||[]).map(mapProduct),upcoming=(upcomingRes.data||[]).map(mapProduct);
 const offersSection=document.getElementById('ofertas'),featuredSection=document.getElementById('destacados');
 if(offersSection)offersSection.hidden=!offers.length;if(featuredSection)featuredSection.hidden=!featured.length;
 const offersGrid=document.getElementById('offersGrid'),featuredGrid=document.getElementById('featuredGrid'),upcomingGrid=document.getElementById('upcomingGrid');
 if(offersGrid)offersGrid.innerHTML=offers.length?offers.map(productCard).join(''):'<div class="catalogEmpty"><b>Aún no hay ofertas.</b></div>';
 if(featuredGrid)featuredGrid.innerHTML=featured.length?featured.map(productCard).join(''):'<div class="catalogEmpty"><b>Aún no hay figuras destacadas.</b></div>';
 if(upcomingGrid)upcomingGrid.innerHTML=upcoming.length?upcoming.map(productCard).join(''):'<div class="catalogEmpty"><b>Aún no hay próximas figuras publicadas.</b><span>Cuando marques una figura como Próximamente aparecerá aquí.</span></div>';
 animateRenderedCards(offersGrid);animateRenderedCards(featuredGrid);animateRenderedCards(upcomingGrid);
 await Promise.all([loadPublicFilterOptions(),loadCatalogPage()]);
 const skuFromHash=location.hash.startsWith('#figura=')?decodeURIComponent(location.hash.slice(8)):null;
 const skuFromRoute=skuFromPublicPath('figura');
 if(skuFromRoute||skuFromHash) await openDetail(skuFromRoute||skuFromHash,false);
}
async function loadPublicFilterOptions(){
 const [fRes,pRes,mRes]=await Promise.all([
   supabaseClient.from('franquicias').select('nombre').eq('activo',true).order('nombre'),
   supabaseClient.from('personajes').select('nombre, franquicias(nombre)').eq('activo',true).order('nombre'),
   supabaseClient.from('fabricantes').select('nombre').eq('activo',true).order('nombre')
 ]);
 const franchise=document.getElementById('franchiseOptions'),character=document.getElementById('characterOptions'),manufacturer=document.getElementById('manufacturerOptions');
 if(franchise&&!fRes.error)franchise.innerHTML=(fRes.data||[]).map(x=>`<option value="${attr(x.nombre)}"></option>`).join('');
 if(manufacturer&&!mRes.error)manufacturer.innerHTML=(mRes.data||[]).map(x=>`<option value="${attr(x.nombre)}"></option>`).join('');
 window.__publicCharacters=(pRes.data||[]).map(x=>({nombre:x.nombre,franquicia:x.franquicias?.nombre||''}));updateCharacterOptions();
}
function updateCharacterOptions(){
 const character=document.getElementById('characterOptions');if(!character)return;const f=normalizeSearch(publicCatalogFilters.franquicia);
 const rows=(window.__publicCharacters||[]).filter(x=>!f||normalizeSearch(x.franquicia)===f);character.innerHTML=rows.map(x=>`<option value="${attr(x.nombre)}"></option>`).join('');
}
function safeIlikeTerm(value){return String(value||'').trim().replace(/[,%()]/g,' ').replace(/\s+/g,' ')}
async function trackCatalogSearch(value){
 const texto=safeIlikeTerm(value);if(!texto)return;const pattern=`%${texto}%`;const {count,error}=await supabaseClient.from('productos').select('id',{count:'exact',head:true}).eq('activo',true).or(`nombre.ilike.${pattern},sku.ilike.${pattern},personaje.ilike.${pattern},franquicia.ilike.${pattern},fabricante.ilike.${pattern}`);if(!error)registerAnalyticsEvent('busqueda',{contexto:{texto,resultados:count||0}})
}
async function loadCatalogPage(){
 const requestId=++publicCatalogRequestId,grid=document.getElementById('catalogGrid');if(grid)grid.innerHTML='<p class="catalogMessage">Cargando figuras…</p>';
 let q=supabaseClient.from('productos').select('*, producto_imagenes(*)',{count:'exact'}).eq('activo',true);
 const search=safeIlikeTerm(publicCatalogFilters.busqueda||publicSearchQuery);if(search){const pattern=`%${search}%`;q=q.or(`nombre.ilike.${pattern},sku.ilike.${pattern},personaje.ilike.${pattern},franquicia.ilike.${pattern},fabricante.ilike.${pattern}`)}
 if(publicQuickFilter==='ofertas')q=q.not('precio_oferta','is',null);else if(publicQuickFilter==='proximamente')q=q.eq('estado','proximamente');
 if(publicCatalogFilters.franquicia)q=q.ilike('franquicia',`%${safeIlikeTerm(publicCatalogFilters.franquicia)}%`);
 if(publicCatalogFilters.personaje)q=q.ilike('personaje',`%${safeIlikeTerm(publicCatalogFilters.personaje)}%`);
 if(publicCatalogFilters.fabricante)q=q.ilike('fabricante',`%${safeIlikeTerm(publicCatalogFilters.fabricante)}%`);
 if(publicCatalogFilters.orden==='precio-asc')q=q.order('precio',{ascending:true});else if(publicCatalogFilters.orden==='precio-desc')q=q.order('precio',{ascending:false});else if(publicCatalogFilters.orden==='nombre')q=q.order('nombre',{ascending:true});else q=q.order('fecha_creacion',{ascending:false});
 const from=(publicCatalogPage-1)*PUBLIC_CATALOG_PAGE_SIZE,to=from+PUBLIC_CATALOG_PAGE_SIZE-1;const {data,error,count}=await q.range(from,to);if(requestId!==publicCatalogRequestId)return;
 if(error){console.error(error);if(grid)grid.innerHTML='<p class="catalogMessage error">No fue posible cargar el catálogo en este momento.</p>';return}
 catalogProducts=(data||[]).map(mapProduct);publicCatalogTotal=count||0;const totalPages=Math.max(1,Math.ceil(publicCatalogTotal/PUBLIC_CATALOG_PAGE_SIZE));
 if(publicCatalogPage>totalPages){publicCatalogPage=totalPages;return loadCatalogPage()}
 renderPublicProducts();
}
async function loadPublicAdditionalCatalog(){
 const {data,error}=await supabaseClient.from('productos_adicionales').select('*, tipos_producto(nombre), franquicias(nombre), personajes(nombre), producto_adicional_imagenes(*)').eq('activo',true).order('destacado',{ascending:false}).order('fecha_creacion',{ascending:false}).limit(4);
 const grid=document.getElementById('additionalGrid'), section=document.getElementById('mas-coleccion');
 if(error){if(grid)grid.innerHTML='<p class="catalogMessage error">No fue posible cargar Más para tu colección.</p>';console.error(error);return}
 additionalProducts=(data||[]).map(mapAdditionalProduct);
 if(section)section.hidden=!additionalProducts.length;
 if(grid)grid.innerHTML=additionalProducts.length?additionalProducts.map(additionalProductCard).join(''):'<p class="catalogMessage">Próximamente tendremos más productos para tu colección.</p>';
 animateRenderedCards(grid);
 const skuFromHash=location.hash.startsWith('#producto=')?decodeURIComponent(location.hash.slice(10)):null;
 const skuFromRoute=skuFromPublicPath('adicional');
 if(skuFromRoute||skuFromHash)openAdditionalDetail(skuFromRoute||skuFromHash,false);
}
async function loadAdditionalTypes(){
 if(publicAdditionalTypes.length)return publicAdditionalTypes;
 const {data,error}=await supabaseClient.from('tipos_producto').select('id,nombre').eq('activo',true).order('nombre');
 if(!error)publicAdditionalTypes=data||[];return publicAdditionalTypes;
}
async function loadAdditionalCatalogPage(){
 const view=document.getElementById('additionalCatalogView');if(!view)return;
 const requestId=++publicAdditionalRequestId,grid=view.querySelector('#additionalCatalogGrid');if(grid)grid.innerHTML='<p class="catalogMessage">Cargando productos…</p>';
 let q=supabaseClient.from('productos_adicionales').select('*, tipos_producto(nombre), franquicias(nombre), personajes(nombre), producto_adicional_imagenes(*)',{count:'exact'}).eq('activo',true);
 const search=safeIlikeTerm(publicAdditionalFilters.busqueda);if(search){const pattern=`%${search}%`;q=q.or(`nombre.ilike.${pattern},sku.ilike.${pattern},descripcion.ilike.${pattern}`)}
 if(publicAdditionalFilters.tipo)q=q.eq('tipo_producto_id',publicAdditionalFilters.tipo);
 q=q.order('destacado',{ascending:false}).order('fecha_creacion',{ascending:false});
 const from=(publicAdditionalPage-1)*PUBLIC_ADDITIONAL_PAGE_SIZE,to=from+PUBLIC_ADDITIONAL_PAGE_SIZE-1;const {data,error,count}=await q.range(from,to);if(requestId!==publicAdditionalRequestId||!document.getElementById('additionalCatalogView'))return;
 if(error){grid.innerHTML='<p class="catalogMessage error">No fue posible cargar los productos.</p>';console.error(error);return}
 const pageProducts=(data||[]).map(mapAdditionalProduct);publicAdditionalTotal=count||0;additionalProducts=[...additionalProducts.filter(x=>!pageProducts.some(y=>y.id===x.id)),...pageProducts];
 const totalPages=Math.max(1,Math.ceil(publicAdditionalTotal/PUBLIC_ADDITIONAL_PAGE_SIZE));if(publicAdditionalPage>totalPages){publicAdditionalPage=totalPages;return loadAdditionalCatalogPage()}
 view.querySelector('#additionalCatalogCount').textContent=`${publicAdditionalTotal} ${publicAdditionalTotal===1?'producto':'productos'}`;
 grid.innerHTML=pageProducts.length?pageProducts.map(additionalProductCard).join(''):'<div class="catalogEmpty"><b>No encontramos productos.</b><span>Prueba con otra búsqueda o tipo.</span></div>';
 animateRenderedCards(grid);
 renderAdditionalPagination(totalPages);
}
function renderAdditionalPagination(totalPages){
 const nav=document.querySelector('#additionalCatalogView #additionalCatalogPagination');if(!nav)return;if(totalPages<=1){nav.innerHTML='';return}
 const current=publicAdditionalPage,pages=[];const add=n=>{if(n>=1&&n<=totalPages&&!pages.includes(n))pages.push(n)};add(1);for(let n=current-2;n<=current+2;n++)add(n);add(totalPages);pages.sort((a,b)=>a-b);
 let last=0,html=`<button type="button" data-additional-page="${current-1}" ${current===1?'disabled':''}>‹</button>`;for(const n of pages){if(last&&n-last>1)html+='<span>…</span>';html+=`<button type="button" data-additional-page="${n}" class="${n===current?'active':''}">${n}</button>`;last=n}html+=`<button type="button" data-additional-page="${current+1}" ${current===totalPages?'disabled':''}>›</button>`;nav.innerHTML=html;
}
async function openAdditionalCatalog(){
 document.getElementById('additionalCatalogView')?.remove();publicAdditionalPage=1;publicAdditionalFilters={busqueda:'',tipo:''};const types=await loadAdditionalTypes();
 const view=document.createElement('section');view.className='detailView additionalCatalogView';view.id='additionalCatalogView';
 view.innerHTML=`<div class="detailTop"><button class="backBtn" type="button">‹ Volver a la tienda</button><button class="detailClose" type="button" aria-label="Cerrar">×</button></div><div class="additionalCatalogShell"><span class="kicker">MÁS PARA TU COLECCIÓN</span><h1>Más para tu colección</h1><p>Explora amigurumis, peluches, llaveros, tazas y otros complementos.</p><div class="additionalCatalogTools"><input id="additionalPublicSearch" type="search" autocomplete="off" placeholder="Buscar producto, SKU o descripción…"><select id="additionalTypeFilter"><option value="">Todos los tipos</option>${types.map(x=>`<option value="${attr(x.id)}">${escapeHtml(x.nombre)}</option>`).join('')}</select></div><div id="additionalCatalogCount" class="catalogCount"></div><div id="additionalCatalogGrid" class="grid"></div><nav id="additionalCatalogPagination" class="catalogPagination" aria-label="Paginación de Más para tu colección"></nav></div>`;
 document.body.appendChild(view);document.body.classList.add('detail-open');
 let timer;view.querySelector('#additionalPublicSearch').addEventListener('input',e=>{publicAdditionalPage=1;publicAdditionalFilters.busqueda=e.target.value;clearTimeout(timer);timer=setTimeout(loadAdditionalCatalogPage,220)});view.querySelector('#additionalTypeFilter').addEventListener('change',e=>{publicAdditionalPage=1;publicAdditionalFilters.tipo=e.target.value;loadAdditionalCatalogPage()});view.querySelector('#additionalCatalogPagination').addEventListener('click',e=>{const b=e.target.closest('[data-additional-page]');if(!b||b.disabled)return;publicAdditionalPage=Number(b.dataset.additionalPage);loadAdditionalCatalogPage();view.querySelector('.additionalCatalogShell')?.scrollIntoView({behavior:'smooth',block:'start'})});
 const close=()=>{view.remove();document.body.classList.remove('detail-open');if(location.hash==='#mas-para-tu-coleccion')history.replaceState({},'',location.pathname+location.search+'#mas-coleccion')};view.querySelectorAll('.backBtn,.detailClose').forEach(b=>b.addEventListener('click',close));history.pushState({additionalCatalog:true},'','#mas-para-tu-coleccion');loadAdditionalCatalogPage();
}
function openGalleryLightbox(gallery,startIndex,altText,onChange){
 if(!gallery?.length)return;
 let index=(startIndex+gallery.length)%gallery.length,touchStartX=null;
 const viewer=document.createElement('div');viewer.className='imageLightbox';viewer.setAttribute('role','dialog');viewer.setAttribute('aria-modal','true');viewer.setAttribute('aria-label',`Galería de ${altText}`);
 viewer.innerHTML=`<button class="imageLightboxClose" type="button" aria-label="Cerrar imagen">×</button><button class="imageLightboxArrow imageLightboxPrev" type="button" aria-label="Imagen anterior">‹</button><div class="imageLightboxStage"><img src="${attr(gallery[index])}" alt="${attr(altText)}"><span class="imageLightboxCounter">${index+1} / ${gallery.length}</span></div><button class="imageLightboxArrow imageLightboxNext" type="button" aria-label="Imagen siguiente">›</button>`;
 document.body.appendChild(viewer);
 const img=viewer.querySelector('img'),counter=viewer.querySelector('.imageLightboxCounter');
 const show=next=>{index=(next+gallery.length)%gallery.length;img.classList.remove('is-changing');void img.offsetWidth;img.src=gallery[index];img.classList.add('is-changing');counter.textContent=`${index+1} / ${gallery.length}`;onChange?.(index)};
 const close=()=>{document.removeEventListener('keydown',onKey);viewer.remove()};
 const onKey=e=>{if(e.key==='Escape')close();else if(e.key==='ArrowLeft'&&gallery.length>1)show(index-1);else if(e.key==='ArrowRight'&&gallery.length>1)show(index+1)};
 viewer.querySelector('.imageLightboxClose').addEventListener('click',close);
 viewer.querySelector('.imageLightboxPrev').addEventListener('click',()=>show(index-1));
 viewer.querySelector('.imageLightboxNext').addEventListener('click',()=>show(index+1));
 if(gallery.length<2)viewer.querySelectorAll('.imageLightboxArrow').forEach(x=>x.hidden=true);
 viewer.addEventListener('click',e=>{if(e.target===viewer)close()});
 viewer.addEventListener('touchstart',e=>{touchStartX=e.changedTouches[0]?.clientX??null},{passive:true});
 viewer.addEventListener('touchend',e=>{if(touchStartX==null||gallery.length<2)return;const dx=(e.changedTouches[0]?.clientX??touchStartX)-touchStartX;touchStartX=null;if(Math.abs(dx)>45)show(index+(dx<0?1:-1))},{passive:true});
 document.addEventListener('keydown',onKey);viewer.querySelector('.imageLightboxClose').focus();
}
function animateGalleryImage(img){if(!img)return;img.classList.remove('galleryImageChanging');void img.offsetWidth;img.classList.add('galleryImageChanging')}
async function openAdditionalDetail(sku,push=true){
 let p=additionalProducts.find(x=>x.sku===sku);if(!p){const {data,error}=await supabaseClient.from('productos_adicionales').select('*, tipos_producto(nombre), franquicias(nombre), personajes(nombre), producto_adicional_imagenes(*)').eq('activo',true).eq('sku',sku).maybeSingle();if(error||!data)return;p=mapAdditionalProduct(data);additionalProducts.push(p)}
 registerAnalyticsEvent('vista_adicional',{producto_id:p.id,sku:p.sku,contexto:{estado:p.status}});
 document.getElementById('detailView')?.remove();
 const pct=p.sale?Math.round((1-p.sale/p.price)*100):null,action=additionalProductAction(p),wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
 const gallery=p.images.length?p.images.map(x=>x.url):(p.img?[p.img]:[]),principal=p.images.find(x=>x.principal)?.url||p.img||gallery[0]||'';let currentIndex=Math.max(0,gallery.indexOf(principal)),main=gallery[currentIndex]||'';
 const meta=[['Tipo de producto',p.type],['Franquicia',p.series],['Personaje',p.character],['Stock',p.stock],['Hecho a mano',p.handmade?'Sí':'No'],['Acepta pedidos',p.madeToOrder?'Sí':'No'],['Tiempo de elaboración',p.leadTime]].filter(x=>x[1]!==''&&x[1]!=null);
 const detail=document.createElement('section');detail.className='detailView';detail.id='detailView';
 detail.innerHTML=`<div class="detailTop"><button class="backBtn" type="button">‹ Volver a Más para tu colección</button><button class="detailClose" type="button" aria-label="Cerrar">×</button></div><div class="detailShell"><div class="detailGallery"><div class="detailMainPhoto">${main?`<img id="detailMainImage" src="${attr(main)}" alt="${attr(p.name)}"><button class="galleryFullscreen" type="button">⛶ <span>Ver imagen completa</span></button>${gallery.length>1?`<button class="galleryArrow galleryPrev" type="button">‹</button><button class="galleryArrow galleryNext" type="button">›</button>`:''}<span class="galleryCounter" id="galleryCounter">${currentIndex+1} / ${gallery.length}</span>`:`<div class="photoPlaceholder large"><span>界</span><small>Fotografía próximamente</small></div>`}</div>${gallery.length?`<div class="detailThumbs">${gallery.map((img,i)=>`<button class="detailThumb ${i===currentIndex?'active':''}" type="button" data-index="${i}"><img src="${attr(img)}" alt="Vista ${i+1} de ${attr(p.name)}"></button>`).join('')}</div>`:''}</div><div class="detailInfo"><p class="series">${escapeHtml(p.type)}</p><h1>${escapeHtml(p.name)}</h1><p class="detailSku">${escapeHtml(p.sku)}</p><div class="detailBadges">${pct?`<span class="detailBadge sale">-${pct}%</span>`:''}<span class="detailBadge ${p.status==='apartada'?'hold':''}">${statusLabel(p.status)}</span>${p.handmade?'<span class="detailBadge craft">Hecho a mano</span>':''}</div><div class="detailPrice">${p.sale?`<span class="old">Antes ${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><p>${escapeHtml(p.description)}</p><div class="detailMeta additionalMeta">${meta.map(([k,v])=>`<div><small>${escapeHtml(k)}</small><b>${escapeHtml(v)}</b></div>`).join('')}</div><div class="detailActions"><a class="whatsapp ${action.cls}" data-analytics-whatsapp="${attr(p.sku)}" data-analytics-kind="adicional" href="${attr(wa)}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a><div class="detailUtilityActions"><button class="interestToggle ${isInInterestList(p.sku,'adicional')?'active':''}" data-interest-toggle="${attr(p.sku)}" data-interest-kind="adicional" type="button" aria-pressed="${isInInterestList(p.sku,'adicional')}"><span class="interestStateIcon">${isInInterestList(p.sku,'adicional')?'✓':'＋'}</span> <span class="interestLabel">${isInInterestList(p.sku,'adicional')?'En mi lista':'Agregar a mi lista'}</span></button><button class="shareProductButton" data-share-product="${attr(p.sku)}" data-share-kind="adicional" type="button">↗ Compartir</button></div><p class="detailNote">Entrega local en Mérida, Yucatán. La compra y los detalles de entrega se acuerdan directamente por WhatsApp.</p></div></div></div>`;
 document.body.appendChild(detail);document.body.classList.add('detail-open');updateInterestListUI();prepareDetailMainImage(detail);
 const close=()=>{detail.remove();document.body.classList.remove('detail-open');if(location.pathname.startsWith('/producto/')||location.hash.startsWith('#producto='))history.replaceState({},'','/#mas-coleccion')};detail.querySelectorAll('.backBtn,.detailClose').forEach(b=>b.addEventListener('click',close));
 const show=i=>{currentIndex=(i+gallery.length)%gallery.length;const m=detail.querySelector('#detailMainImage');if(m)swapDetailMainImage(m,gallery[currentIndex]);detail.querySelectorAll('.detailThumb').forEach((x,j)=>x.classList.toggle('active',j===currentIndex));detail.querySelector('#galleryCounter').textContent=`${currentIndex+1} / ${gallery.length}`};detail.querySelectorAll('.detailThumb').forEach(t=>t.onclick=()=>show(Number(t.dataset.index)));detail.querySelector('.galleryPrev')?.addEventListener('click',()=>show(currentIndex-1));detail.querySelector('.galleryNext')?.addEventListener('click',()=>show(currentIndex+1));detail.querySelector('.galleryFullscreen')?.addEventListener('click',()=>openGalleryLightbox(gallery,currentIndex,p.name,show));
 if(push)history.pushState({additional:sku},'',`/producto/${encodeURIComponent(sku)}`);
}
function normalizeSearch(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function productMatchesSearch(p,query){
 if(!query)return true;
 const haystack=[p.name,p.sku,p.character,p.series,p.manufacturer].map(normalizeSearch).join(' ');
 return query.split(/\s+/).every(term=>haystack.includes(term));
}
function uniqueSorted(values){return [...new Set(values.filter(v=>v&&v!=='No especificado'&&v!=='Sin franquicia'))].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}))}
function effectivePrice(p){return p.sale??p.price}
function populatePublicFilterOptions(){updateCharacterOptions()}
function renderPublicProducts(){
 document.querySelectorAll('#catalogQuickFilters [data-quick]').forEach(b=>b.classList.toggle('active',b.dataset.quick===publicQuickFilter));
 const total=publicCatalogTotal,totalPages=Math.max(1,Math.ceil(total/PUBLIC_CATALOG_PAGE_SIZE));
 const count=document.getElementById('catalogCount');if(count)count.textContent=`${total} ${total===1?'figura':'figuras'}`;
 const grid=document.getElementById('catalogGrid');
 if(grid)grid.innerHTML=catalogProducts.length?catalogProducts.map(productCard).join(''):'<div class="catalogEmpty"><b>No encontramos figuras con esos filtros.</b><span>Prueba con otra búsqueda o limpia los filtros.</span><button type="button" data-clear-public-filters>Limpiar filtros</button></div>';
 animateRenderedCards(grid);
 renderCatalogPagination(totalPages);
}
function renderCatalogPagination(totalPages){
 const nav=document.getElementById('catalogPagination'); if(!nav)return; if(totalPages<=1){nav.innerHTML='';return}
 const current=publicCatalogPage, pages=[];
 const add=n=>{if(n>=1&&n<=totalPages&&!pages.includes(n))pages.push(n)}; add(1); for(let n=current-2;n<=current+2;n++)add(n); add(totalPages); pages.sort((a,b)=>a-b);
 let last=0, html=`<button type="button" data-page="${current-1}" ${current===1?'disabled':''}>‹ Anterior</button>`;
 for(const n of pages){if(last&&n-last>1)html+='<span>…</span>'; html+=`<button type="button" data-page="${n}" class="${n===current?'active':''}" ${n===current?'aria-current="page"':''}>${n}</button>`;last=n}
 html+=`<button type="button" data-page="${current+1}" ${current===totalPages?'disabled':''}>Siguiente ›</button>`; nav.innerHTML=html;
}
function syncUniverseActiveState(){
 const active=(publicCatalogFilters.franquicia||'').trim().toLowerCase();
 document.querySelectorAll('#featuredFranchises [data-universe]').forEach(b=>{const selected=!!active&&(b.dataset.universe||'').trim().toLowerCase()===active;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))});
}
function updateMobileCatalogFilterState(){
 const count=[publicCatalogFilters.franquicia,publicCatalogFilters.personaje,publicCatalogFilters.fabricante].filter(Boolean).length+(publicCatalogFilters.orden!=='recientes'?1:0)+(publicQuickFilter!=='todas'?1:0);
 const badge=document.getElementById('mobileCatalogFilterCount');if(badge){badge.textContent=count;badge.hidden=count===0}
}
function setMobileCatalogFiltersOpen(open){
 const toolbar=document.getElementById('catalogToolbar'),toggle=document.getElementById('mobileCatalogFilterToggle');if(!toolbar||!toggle)return;toolbar.classList.toggle('mobile-open',open);toggle.setAttribute('aria-expanded',String(open));toggle.classList.toggle('active',open);
}
function initPublicCatalogFilters(){
 let timer;const refresh=()=>{clearTimeout(timer);timer=setTimeout(loadCatalogPage,220)};
 const bind=(id,key)=>document.getElementById(id)?.addEventListener('input',e=>{publicCatalogPage=1;publicCatalogFilters[key]=e.target.value;clearTimeout(e.target.__analyticsTimer);e.target.__analyticsTimer=setTimeout(()=>{const valor=e.target.value.trim();if(valor){if(key==='busqueda')trackCatalogSearch(valor);else registerAnalyticsEvent('filtro',{contexto:{tipo:key,valor}})}},650);if(key==='franquicia'){publicCatalogFilters.personaje='';const c=document.getElementById('filterCharacter');if(c)c.value='';updateCharacterOptions();syncUniverseActiveState()}updateMobileCatalogFilterState();refresh()});
 bind('catalogSearch','busqueda');bind('filterFranchise','franquicia');bind('filterCharacter','personaje');bind('filterManufacturer','fabricante');
 document.getElementById('catalogSort')?.addEventListener('change',e=>{publicCatalogPage=1;publicCatalogFilters.orden=e.target.value;updateMobileCatalogFilterState();loadCatalogPage()});
 document.querySelectorAll('#catalogQuickFilters [data-quick]').forEach(b=>b.addEventListener('click',()=>{publicCatalogPage=1;publicQuickFilter=b.dataset.quick;if(publicQuickFilter!=='todas')registerAnalyticsEvent('filtro',{contexto:{tipo:'rapido',valor:publicQuickFilter}});updateMobileCatalogFilterState();loadCatalogPage()}));
 document.getElementById('clearCatalogFilters')?.addEventListener('click',clearPublicCatalogFilters);
 document.getElementById('mobileCatalogFilterToggle')?.addEventListener('click',()=>{const toolbar=document.getElementById('catalogToolbar');setMobileCatalogFiltersOpen(!toolbar?.classList.contains('mobile-open'))});
 document.getElementById('applyMobileCatalogFilters')?.addEventListener('click',()=>setMobileCatalogFiltersOpen(false));
 updateMobileCatalogFilterState();

 document.getElementById('catalogPagination')?.addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(!b||b.disabled)return;publicCatalogPage=Number(b.dataset.page);loadCatalogPage();document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'})});
}
function clearPublicCatalogFilters(){
 publicQuickFilter='todas';publicSearchQuery='';publicCatalogPage=1;publicCatalogFilters={busqueda:'',franquicia:'',personaje:'',fabricante:'',orden:'recientes'};
 [['catalogSearch',''],['filterFranchise',''],['filterCharacter',''],['filterManufacturer',''],['catalogSort','recientes'],['publicSearchInput','']].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.value=v});updateCharacterOptions();syncUniverseActiveState();updateMobileCatalogFilterState();setMobileCatalogFiltersOpen(false);loadCatalogPage();
}

async function openFigureCollection(kind){
 document.getElementById('figureCollectionView')?.remove();const isOffers=kind==='ofertas';
 const view=document.createElement('section');view.className='detailView figureCollectionView';view.id='figureCollectionView';
 const title=isOffers?'Todas las ofertas':'Figuras destacadas',kicker=isOffers?'🔥 PRECIOS ESPECIALES':'COLECCIÓN DESTACADA';
 view.innerHTML=`<div class="detailTop"><button class="backBtn" type="button">‹ Volver a la tienda</button><button class="detailClose" type="button" aria-label="Cerrar">×</button></div><div class="additionalCatalogShell"><span class="kicker">${kicker}</span><h1>${title}</h1><p>${isOffers?'Explora todas las figuras que actualmente tienen precio especial.':'Explora todas las figuras seleccionadas como destacadas.'}</p><div class="additionalCatalogTools single"><input class="figureCollectionSearch" type="search" placeholder="Buscar nombre, SKU, personaje, anime o fabricante…"></div><div class="figureCollectionCount catalogCount"></div><div class="figureCollectionGrid grid"><p class="catalogMessage">Cargando figuras…</p></div></div>`;
 document.body.appendChild(view);document.body.classList.add('detail-open');
 let q=supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).order('fecha_creacion',{ascending:false});q=isOffers?q.not('precio_oferta','is',null):q.eq('destacada',true);const {data,error}=await q;
 const source=error?[]:(data||[]).map(mapProduct);if(error)console.error(error);source.forEach(p=>{if(!products.some(x=>x.id===p.id))products.push(p)});
 const render=()=>{const qv=normalizeSearch(view.querySelector('.figureCollectionSearch').value);const list=source.filter(p=>!qv||productMatchesSearch(p,qv));view.querySelector('.figureCollectionCount').textContent=`${list.length} ${list.length===1?'figura':'figuras'}`;const collectionGrid=view.querySelector('.figureCollectionGrid');collectionGrid.innerHTML=list.length?list.map(productCard).join(''):'<div class="catalogEmpty"><b>No encontramos figuras.</b><span>Prueba con otra búsqueda.</span></div>';animateRenderedCards(collectionGrid)};
 view.querySelector('.figureCollectionSearch').addEventListener('input',render);render();const close=()=>{view.remove();document.body.classList.remove('detail-open')};view.querySelectorAll('.backBtn,.detailClose').forEach(b=>b.addEventListener('click',close));
}
async function ensureProductLoaded(sku){let p=products.find(x=>x.sku===sku)||catalogProducts.find(x=>x.sku===sku);if(p)return p;const {data,error}=await supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).eq('sku',sku).maybeSingle();if(error||!data){if(error)console.error(error);return null}p=mapProduct(data);products.push(p);return p}
async function openDetail(sku,push=true){
 const p=await ensureProductLoaded(sku); if(!p)return;
 registerAnalyticsEvent('vista_producto',{producto_id:p.id,sku:p.sku,contexto:{estado:p.status}});
 document.getElementById('detailView')?.remove();
 const pct=p.sale?Math.round((1-p.sale/p.price)*100):null, action=productAction(p), wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
 const gallery=p.images.length?p.images.map(x=>x.url):(p.img?[p.img]:[]);
 const principalUrl=p.images.find(x=>x.principal)?.url||p.img||gallery[0]||'';
 let currentIndex=Math.max(0,gallery.indexOf(principalUrl));
 const main=gallery[currentIndex]||'';
 const detail=document.createElement('section'); detail.className='detailView'; detail.id='detailView';
 detail.innerHTML=`<div class="detailTop"><button class="backBtn" type="button">‹ Volver al catálogo</button><button class="detailClose" type="button" aria-label="Cerrar">×</button></div><div class="detailShell"><div class="detailGallery"><div class="detailMainPhoto">${main?`<img id="detailMainImage" src="${attr(main)}" alt="${attr(p.name)}"><button class="galleryFullscreen" type="button" aria-label="Ver figura completa">⛶ <span>Ver figura completa</span></button>${gallery.length>1?`<button class="galleryArrow galleryPrev" type="button" aria-label="Fotografía anterior">‹</button><button class="galleryArrow galleryNext" type="button" aria-label="Fotografía siguiente">›</button>`:''}<span class="galleryCounter" id="galleryCounter">${currentIndex+1} / ${gallery.length}</span>`:`<div class="photoPlaceholder large"><span>界</span><small>Fotografía próximamente</small></div>`}</div>${gallery.length?`<div class="detailThumbs">${gallery.map((img,i)=>`<button class="detailThumb ${i===currentIndex?'active':''}" type="button" data-index="${i}" data-img="${attr(img)}"><img src="${attr(img)}" alt="Vista ${i+1} de ${attr(p.name)}"></button>`).join('')}</div>`:''}</div><div class="detailInfo"><p class="series">${escapeHtml(p.series)}</p><h1>${escapeHtml(p.name)}</h1><p class="detailSku">${escapeHtml(p.sku)}</p><div class="detailBadges">${pct?`<span class="detailBadge sale">-${pct}%</span>`:''}<span class="detailBadge ${p.status==='apartada'?'hold':''}">${statusLabel(p.status)}</span></div><div class="detailPrice">${p.sale?`<span class="old">Antes ${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><p>${escapeHtml(p.description)}</p><div class="detailMeta"><div><small>Personaje</small><b>${escapeHtml(p.character)}</b></div><div><small>Franquicia</small><b>${escapeHtml(p.series)}</b></div><div><small>Fabricante</small><b>${escapeHtml(p.manufacturer)}</b></div><div><small>Condición figura</small><b>${escapeHtml(p.figureCondition)}</b></div><div><small>Condición caja</small><b>${escapeHtml(p.boxCondition)}</b></div><div><small>Procedencia</small><b>${escapeHtml(p.origin)}</b></div><div><small>Stock</small><b>${p.stock}</b></div><div><small>Entrega</small><b>${escapeHtml(p.delivery)}</b></div></div><div class="detailActions"><a class="whatsapp ${action.cls}" data-analytics-whatsapp="${attr(p.sku)}" data-analytics-kind="figura" href="${attr(wa)}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a><div class="detailUtilityActions"><button class="interestToggle ${isInInterestList(p.sku,'figura')?'active':''}" data-interest-toggle="${attr(p.sku)}" data-interest-kind="figura" type="button" aria-pressed="${isInInterestList(p.sku,'figura')}"><span class="interestStateIcon">${isInInterestList(p.sku,'figura')?'✓':'＋'}</span> <span class="interestLabel">${isInInterestList(p.sku,'figura')?'En mi lista':'Agregar a mi lista'}</span></button><button class="shareProductButton" data-share-product="${attr(p.sku)}" data-share-kind="figura" type="button">↗ Compartir</button></div><p class="detailNote">Entrega local en Mérida, Yucatán. La compra y los detalles de entrega se acuerdan directamente por WhatsApp.</p></div></div></div>`;
 document.body.appendChild(detail);document.body.classList.add('detail-open');updateInterestListUI();prepareDetailMainImage(detail);
 detail.querySelectorAll('.backBtn,.detailClose').forEach(b=>b.addEventListener('click',closeDetail));
 const showImage=index=>{if(!gallery.length)return;currentIndex=(index+gallery.length)%gallery.length;const m=detail.querySelector('#detailMainImage');if(m)swapDetailMainImage(m,gallery[currentIndex]);detail.querySelectorAll('.detailThumb').forEach((x,i)=>x.classList.toggle('active',i===currentIndex));const c=detail.querySelector('#galleryCounter');if(c)c.textContent=`${currentIndex+1} / ${gallery.length}`};
 detail.querySelectorAll('.detailThumb').forEach(t=>t.addEventListener('click',()=>showImage(Number(t.dataset.index))));
 detail.querySelector('.galleryPrev')?.addEventListener('click',()=>showImage(currentIndex-1));
 detail.querySelector('.galleryNext')?.addEventListener('click',()=>showImage(currentIndex+1));
 detail.querySelector('.galleryFullscreen')?.addEventListener('click',()=>openGalleryLightbox(gallery,currentIndex,p.name,showImage));
 if(push) history.pushState({detail:sku},'',`/figura/${encodeURIComponent(sku)}`);
}
function closeDetail(){document.getElementById('detailView')?.remove();document.getElementById('helpView')?.remove();document.body.classList.remove('detail-open');if(location.pathname.startsWith('/figura/')||location.hash.startsWith('#figura='))history.replaceState({},'','/#catalogo')}
document.addEventListener('click',e=>{const routeLink=e.target.closest('[data-route-link]');if(routeLink){e.preventDefault();closeMobileMenu?.();navigatePublic(new URL(routeLink.href,location.origin).pathname);return}const help=e.target.closest('[data-open-help]');if(help){e.preventDefault();closeMobileMenu?.();openHelpView();return}const listToggle=e.target.closest('[data-interest-toggle]');if(listToggle){const p=findPublicProduct(listToggle.dataset.interestToggle,listToggle.dataset.interestKind||'figura');if(p){toggleInterest(p,listToggle.dataset.interestKind||'figura');showPublicToast(isInInterestList(p.sku,listToggle.dataset.interestKind||'figura')?'Agregado a Mi lista.':'Quitado de Mi lista.')}return}const share=e.target.closest('[data-share-product]');if(share){const p=findPublicProduct(share.dataset.shareProduct,share.dataset.shareKind||'figura');if(p)openShareMenu(productShareData(p,share.dataset.shareKind||'figura'));return}const remove=e.target.closest('[data-interest-remove]');if(remove){const items=getInterestList().filter(x=>!(x.sku===remove.dataset.interestRemove&&x.kind===remove.dataset.interestKind));saveInterestList(items);return}if(e.target.closest('[data-interest-clear]')){saveInterestList([]);return}const wa=e.target.closest('[data-analytics-whatsapp]');if(wa){const kind=wa.dataset.analyticsKind,sku=wa.dataset.analyticsWhatsapp,p=kind==='adicional'?additionalProducts.find(x=>x.sku===sku):(products.find(x=>x.sku===sku)||catalogProducts.find(x=>x.sku===sku));if(p)trackWhatsapp(p,kind);return}const clear=e.target.closest('[data-clear-public-filters]');if(clear){clearPublicCatalogFilters();return}const abtn=e.target.closest('.additionalDetails[data-additional]');if(abtn){openAdditionalDetail(abtn.dataset.additional);return}const acard=e.target.closest('.publicAdditionalCard[data-additional-product]');if(acard&&!e.target.closest('a,button,input,select')){openAdditionalDetail(acard.dataset.additionalProduct);return}const btn=e.target.closest('.details[data-product]');if(btn){openDetail(btn.dataset.product);return}const card=e.target.closest('.publicProductCard[data-card-product]');if(card&&!e.target.closest('a,button,input,select'))openDetail(card.dataset.cardProduct)});
document.addEventListener('keydown',e=>{const acard=e.target.closest?.('.publicAdditionalCard[data-additional-product]');if(acard&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openAdditionalDetail(acard.dataset.additionalProduct);return}const card=e.target.closest?.('.publicProductCard[data-card-product]');if(card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();openDetail(card.dataset.cardProduct)}});
window.addEventListener('popstate',()=>{if(PUBLIC_ROUTES.has(location.pathname)){navigatePublic(location.pathname,false);return}if(!location.pathname.startsWith('/figura/')&&!location.pathname.startsWith('/producto/')&&!location.hash.startsWith('#figura=')&&!location.hash.startsWith('#producto=')){document.getElementById('detailView')?.remove();document.body.classList.remove('detail-open')}});

const PUBLIC_ROUTES=new Set(['/','/figuras','/ofertas','/proximamente','/ami-no-sekai','/ayuda']);
function routeName(path=location.pathname){if(path==='/figuras')return'figuras';if(path==='/ofertas')return'ofertas';if(path==='/proximamente')return'proximamente';if(path==='/ami-no-sekai')return'ami';if(path==='/ayuda')return'ayuda';return'home'}
function setRouteVisibility(name){
 document.body.dataset.route=name;const page=document.getElementById('routePage');
 document.querySelectorAll('main>section:not(#routePage)').forEach(el=>el.hidden=name!=='home');
 if(page)page.hidden=name==='home';
 document.querySelectorAll('[data-route-link]').forEach(a=>{try{a.classList.toggle('activeRoute',new URL(a.href,location.origin).pathname===location.pathname)}catch{}});
}
async function renderRoutePage(name){
 const page=document.getElementById('routePage');if(!page||name==='home')return;const catalog=document.getElementById('catalogo');if(catalog&&catalog.parentElement===page)document.getElementById('routeParking')?.appendChild(catalog);
 page.className=`routePage route-${name}`;
 if(name==='figuras'){
  page.innerHTML=`<div class="routeHero"><span class="kicker">CATÁLOGO</span><h1>Figuras</h1><p>Explora todas nuestras figuras disponibles, filtra por franquicia, personaje o fabricante y encuentra tu próxima pieza.</p></div><div id="routeFiguresMount"></div>`;
  const catalog=document.getElementById('catalogo');if(catalog){catalog.hidden=false;page.querySelector('#routeFiguresMount').appendChild(catalog)}
  await loadCatalogPage();return;
 }
 if(name==='ami'){
  const types=await loadAdditionalTypes();page.innerHTML=`<div class="amiRouteHero"><div class="amiLogoWrap"><img src="/assets/ami-no-sekai-logo.webp" alt="Ami no Sekai · Tejiendo pequeños mundos · By Ingrid Acosta"></div><div class="amiHeroCopy"><span class="kicker">UNA SUBMARCA DE ANIME NO SEKAI</span><h1>Ami no Sekai</h1><p>Tejiendo pequeños mundos. Creaciones artesanales con personalidad propia, hechas para acompañar tu colección.</p><span class="amiByline">Dentro de Anime no Sekai</span></div></div><div class="amiCatalog"><div class="sectionHead"><div><span class="kicker">COLECCIÓN ARTESANAL</span><h2>Descubre Ami no Sekai</h2></div><span id="amiCatalogCount" class="catalogCount"></span></div><div class="additionalCatalogTools"><input id="amiSearch" type="search" autocomplete="off" placeholder="Buscar producto, SKU o descripción…"><select id="amiType"><option value="">Todos los tipos</option>${types.map(x=>`<option value="${attr(x.id)}">${escapeHtml(x.nombre)}</option>`).join('')}</select></div><div id="amiGrid" class="grid"><p class="catalogMessage">Cargando productos…</p></div></div>`;
  await loadAmiRoute();return;
 }
 if(name==='ayuda'){page.innerHTML='<div class="routeHero"><span class="kicker">CENTRO DE AYUDA</span><h1>¿Cómo podemos ayudarte?</h1><p>Compra, entregas, estados de producto y funcionamiento de Anime no Sekai.</p></div><div id="helpRouteMount"></div>';openHelpView(false,true);return}
 const isOffers=name==='ofertas';page.innerHTML=`<div class="routeHero"><span class="kicker">${isOffers?'🔥 PRECIOS ESPECIALES':'PRÓXIMAMENTE'}</span><h1>${isOffers?'Ofertas del Sekai':'Próximamente'}</h1><p>${isOffers?'Todas las figuras que actualmente tienen un precio especial.':'Figuras que vienen en camino para que puedas descubrirlas antes de su llegada.'}</p></div><div class="routeSearch"><input id="routeFigureSearch" type="search" placeholder="Buscar nombre, SKU, personaje, anime o fabricante…"><span id="routeFigureCount" class="catalogCount"></span></div><div id="routeFigureGrid" class="grid"><p class="catalogMessage">Cargando figuras…</p></div>${name==='proximamente'?`<div class="arrival upcomingCta"><div><span class="kicker">¿BUSCAS OTRA FIGURA?</span><h2>Pregunta por tu próxima pieza</h2><p>Si buscas una figura que todavía no tenemos publicada, pregúntanos por WhatsApp.</p></div><a class="primary" href="https://wa.me/529994739090" target="_blank" rel="noopener">${whatsappIcon()} Preguntar por WhatsApp</a></div>`:''}`;
 await loadRouteFigures(name);
}
async function loadRouteFigures(name){const grid=document.getElementById('routeFigureGrid');if(!grid)return;let q=supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).order('fecha_creacion',{ascending:false});q=name==='ofertas'?q.not('precio_oferta','is',null):q.eq('estado','proximamente');const {data,error}=await q;const source=error?[]:(data||[]).map(mapProduct);source.forEach(p=>{if(!products.some(x=>x.id===p.id))products.push(p)});const input=document.getElementById('routeFigureSearch');const render=()=>{const term=normalizeSearch(input?.value||'');const list=source.filter(p=>!term||productMatchesSearch(p,term));document.getElementById('routeFigureCount').textContent=`${list.length} ${list.length===1?'figura':'figuras'}`;grid.innerHTML=list.length?list.map(productCard).join(''):'<div class="catalogEmpty"><b>No encontramos figuras.</b><span>Prueba con otra búsqueda.</span></div>';animateRenderedCards(grid)};input?.addEventListener('input',render);render()}
async function loadAmiRoute(){const grid=document.getElementById('amiGrid');if(!grid)return;const {data,error}=await supabaseClient.from('productos_adicionales').select('*, tipos_producto(nombre), franquicias(nombre), personajes(nombre), producto_adicional_imagenes(*)').eq('activo',true).order('destacado',{ascending:false}).order('fecha_creacion',{ascending:false});const source=error?[]:(data||[]).map(mapAdditionalProduct);additionalProducts=[...additionalProducts.filter(x=>!source.some(y=>y.id===x.id)),...source];const search=document.getElementById('amiSearch'),type=document.getElementById('amiType');const render=()=>{const term=normalizeSearch(search?.value||'');const typeId=type?.value||'';const list=source.filter(p=>(!term||normalizeSearch(`${p.name} ${p.sku} ${p.description}`).includes(term))&&(!typeId||String(p.typeId||p.tipo_producto_id||'')===String(typeId)));document.getElementById('amiCatalogCount').textContent=`${list.length} ${list.length===1?'producto':'productos'}`;grid.innerHTML=list.length?list.map(additionalProductCard).join(''):'<div class="catalogEmpty"><b>No encontramos productos.</b><span>Prueba con otra búsqueda o tipo.</span></div>';animateRenderedCards(grid)};search?.addEventListener('input',render);type?.addEventListener('change',render);render()}
async function navigatePublic(path,push=true){if(!PUBLIC_ROUTES.has(path))return;const titles={'/':'Anime no Sekai | Figuras & Coleccionables','/figuras':'Figuras | Anime no Sekai','/ofertas':'Ofertas | Anime no Sekai','/proximamente':'Próximamente | Anime no Sekai','/ami-no-sekai':'Ami no Sekai | Tejiendo pequeños mundos','/ayuda':'Centro de ayuda | Anime no Sekai'};document.title=titles[path]||titles['/'];if(push)history.pushState({route:path},'',path);document.getElementById('helpView')?.remove();document.getElementById('detailView')?.remove();document.body.classList.remove('detail-open');const name=routeName(path);setRouteVisibility(name);await renderRoutePage(name);window.scrollTo({top:0,behavior:push?'smooth':'auto'})}
renderStoreShell();
if(PUBLIC_ROUTES.has(location.pathname))setTimeout(()=>navigatePublic(location.pathname,false),0);
updateInterestListUI();
document.getElementById('interestListButton')?.addEventListener('click',openInterestList);
document.getElementById('shareStoreButton')?.addEventListener('click',()=>openShareMenu(storeShareData()));
const generalWhatsapp=document.getElementById('generalWhatsapp');
if(generalWhatsapp){const msg=`Hola, me gustaría consultar las próximas figuras de Anime no Sekai. ${currentSiteUrl('#proximamente')}`;generalWhatsapp.href=`https://wa.me/529994739090?text=${encodeURIComponent(msg)}`;}
const mobileMenuButton=document.getElementById('mobileMenuButton');
const mobileNav=document.getElementById('mobileNav');
function closeMobileMenu(){if(!mobileMenuButton||!mobileNav)return;mobileNav.classList.remove('open');mobileMenuButton.setAttribute('aria-expanded','false');mobileMenuButton.setAttribute('aria-label','Abrir menú');mobileNav.setAttribute('aria-hidden','true')}
mobileMenuButton?.addEventListener('click',()=>{const open=!mobileNav.classList.contains('open');mobileNav.classList.toggle('open',open);mobileMenuButton.setAttribute('aria-expanded',String(open));mobileMenuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');mobileNav.setAttribute('aria-hidden',String(!open))});
mobileNav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMobileMenu));
const searchToggle=document.getElementById('searchToggle');
const headerSearch=document.getElementById('headerSearch');
const publicSearchInput=document.getElementById('publicSearchInput');
const searchClose=document.getElementById('searchClose');
function openPublicSearch(){
 closeMobileMenu();headerSearch?.classList.add('open');headerSearch?.setAttribute('aria-hidden','false');searchToggle?.setAttribute('aria-expanded','true');setTimeout(()=>publicSearchInput?.focus(),0);
}
function closePublicSearch(clear=true){
 headerSearch?.classList.remove('open');headerSearch?.setAttribute('aria-hidden','true');searchToggle?.setAttribute('aria-expanded','false');
 if(clear){publicSearchQuery='';publicCatalogFilters.busqueda='';publicCatalogPage=1;if(publicSearchInput)publicSearchInput.value='';const cs=document.getElementById('catalogSearch');if(cs)cs.value='';loadCatalogPage();}
}
searchToggle?.addEventListener('click',()=>headerSearch?.classList.contains('open')?closePublicSearch(false):openPublicSearch());
searchClose?.addEventListener('click',()=>closePublicSearch(true));
publicSearchInput?.addEventListener('input',e=>{if(location.pathname!='/figuras')navigatePublic('/figuras');publicSearchQuery=e.target.value;publicCatalogPage=1;const cs=document.getElementById('catalogSearch');if(cs)cs.value=e.target.value;publicCatalogFilters.busqueda=e.target.value;clearTimeout(window.__headerSearchTimer);window.__headerSearchTimer=setTimeout(()=>{loadCatalogPage();const valor=e.target.value.trim();if(valor)trackCatalogSearch(valor)},650);document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'});});
publicSearchInput?.addEventListener('keydown',e=>{if(e.key==='Escape')closePublicSearch(true)});

loadSiteConfig();
initPublicCatalogFilters();
loadFeaturedFranchises();
loadPublicCatalog();
loadPublicAdditionalCatalog();
document.getElementById('viewAllAdditional')?.addEventListener('click',openAdditionalCatalog);

// =========================================================
// V4 — Panel administrativo conectado a Supabase
// =========================================================
function adminMarkup(){
 return `<section class="adminView" id="adminView">
  <div class="adminTop"><a class="brand adminBrand" href="#"><span class="brandIcon"><span class="mark brandMark">界</span><img class="brandLogo" id="adminLogo" alt="Logo Anime no Sekai" hidden></span><span class="brandText">ANIME NO <b>SEKAI</b><small>ADMINISTRACIÓN</small></span><span class="adminBadge">ADMIN</span></a><div class="adminTopActions"><button id="adminLogoutTop" class="adminTopLogout" type="button" hidden>Cerrar sesión</button><button id="adminExit" class="adminSiteButton" type="button">↗ Ver tienda</button></div></div>
  <div class="adminShell"><div id="adminContent"><div class="adminLogin"><span class="kicker">ACCESO PRIVADO</span><h1>Panel administrativo</h1><p>Inicia sesión para administrar el catálogo de Anime no Sekai.</p><form id="loginForm"><label>Correo<input id="loginEmail" type="email" autocomplete="username" required></label><label>Contraseña<input id="loginPassword" type="password" autocomplete="current-password" required></label><button class="primary adminPrimary" type="submit">Iniciar sesión</button><p id="loginMessage" class="formMessage"></p></form></div></div></div>
 </section>`;
}
async function openAdmin(){
 if(document.getElementById('adminView')) return;
 document.body.insertAdjacentHTML('beforeend',adminMarkup());
 document.body.classList.add('detail-open');
 if(siteConfig) applySiteVisuals(siteConfig);
 document.getElementById('adminExit').addEventListener('click',closeAdmin);
 document.getElementById('adminLogoutTop').addEventListener('click',async()=>{await supabaseClient.auth.signOut();closeAdmin()});
 document.getElementById('loginForm').addEventListener('submit',loginAdmin);
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(session) await verifyAdminAndRender();
}
function closeAdmin(){if(!confirmLeaveProductForm())return;adminProductFormDirty=false;cleanupNewImagePreviews();document.getElementById('adminView')?.remove();document.body.classList.remove('detail-open');if(location.hash==='#admin')history.replaceState({},'',location.pathname+location.search+'#catalogo')}
async function loginAdmin(e){
 e.preventDefault(); const msg=document.getElementById('loginMessage'); msg.textContent='Validando…';
 const email=document.getElementById('loginEmail').value.trim(), password=document.getElementById('loginPassword').value;
 const {error}=await supabaseClient.auth.signInWithPassword({email,password});
 if(error){msg.textContent='Correo o contraseña incorrectos.';msg.className='formMessage error';return}
 await verifyAdminAndRender();
}
async function verifyAdminAndRender(){
 const {data,isError,error}=await (async()=>{const r=await supabaseClient.rpc('es_administrador');return {data:r.data,isError:!!r.error,error:r.error}})();
 if(isError||data!==true){await supabaseClient.auth.signOut(); const m=document.getElementById('loginMessage');if(m){m.textContent='Esta cuenta no tiene permisos de administrador.';m.className='formMessage error'}return}
 const topLogout=document.getElementById('adminLogoutTop');if(topLogout)topLogout.hidden=false;
 renderAdminPanel();
}
function renderAdminPanel(){
 document.getElementById('adminContent').innerHTML=`<div class="adminNav"><button class="active" id="adminProductsTab" type="button">Productos</button><button id="adminCatalogsTab" type="button">Catálogos</button><button id="adminContentTab" type="button">Contenido del sitio</button><button id="adminAnalyticsTab" type="button">Estadísticas</button></div><div id="adminPanelBody"></div>`;
 document.getElementById('adminProductsTab').onclick=()=>showAdminProductsSection();
 document.getElementById('adminCatalogsTab').onclick=()=>showAdminCatalogsSection();
 document.getElementById('adminContentTab').onclick=()=>showSiteContentForm();
 document.getElementById('adminAnalyticsTab').onclick=()=>showAdminAnalytics();
 showAdminProductsSection();
}
function setAdminTab(activeId){
 document.querySelectorAll('.adminNav button').forEach(b=>b.classList.toggle('active',b.id===activeId));
}
function showAdminProductsSection(section='figuras'){
 setAdminTab('adminProductsTab');
 document.getElementById('adminPanelBody').innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Productos</h1><p>Las figuras son el catálogo principal. Administra por separado los artículos de “Más para tu colección”.</p></div><div class="adminHeaderActions"><button id="logoutAdmin" class="secondary" type="button">Cerrar sesión</button></div></div><div class="adminProductKinds"><button type="button" data-admin-kind="figuras" class="${section==='figuras'?'active':''}">Figuras</button><button type="button" data-admin-kind="adicionales" class="${section==='adicionales'?'active':''}">Más para tu colección</button></div><div id="adminProductKindBody"></div>`;
 document.getElementById('logoutAdmin').onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin()};
 document.querySelectorAll('[data-admin-kind]').forEach(b=>b.onclick=()=>showAdminProductsSection(b.dataset.adminKind));
 const body=document.getElementById('adminProductKindBody');
 if(section==='adicionales'){
   body.innerHTML=`<div class="adminSubHeader"><div><h2>Más para tu colección</h2><p>Amigurumis, peluches, llaveros, tazas y otros complementos.</p></div><button id="newAdditionalProduct" class="primary" type="button">+ Nuevo producto</button></div><div class="adminToolbar"><input id="adminAdditionalSearch" type="search" placeholder="Buscar por nombre, SKU o tipo…"></div><div id="adminAdditionalProducts" class="adminProducts"><p class="adminLoading">Cargando productos…</p></div>`;
   document.getElementById('newAdditionalProduct').onclick=()=>openAdditionalProductForm();
   document.getElementById('adminAdditionalSearch').addEventListener('input',e=>filterAdminAdditionalProducts(e.target.value));
   loadAdminAdditionalProducts();
 }else{
   body.innerHTML=`<div class="adminSubHeader"><div><h2>Figuras</h2><p>Catálogo principal de figuras coleccionables.</p></div><button id="newProduct" class="primary" type="button">+ Nueva figura</button></div><div class="adminToolbar"><input id="adminSearch" type="search" placeholder="Buscar por nombre, SKU o franquicia…"></div><div id="adminProducts" class="adminProducts"><p class="adminLoading">Cargando figuras…</p></div>`;
   document.getElementById('newProduct').onclick=()=>openProductForm();
   document.getElementById('adminSearch').addEventListener('input',e=>filterAdminProducts(e.target.value));
   loadAdminProducts();
 }
}

let adminCatalogKind='franquicias';
let adminCatalogCache=[];
function normalizeCatalogName(v){return (v||'').trim().toLocaleLowerCase('es-MX').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function catalogKindMeta(kind){
 if(kind==='personajes')return {title:'Personajes',singular:'personaje',description:'Edita nombres y la franquicia a la que pertenece cada personaje.'};
 if(kind==='fabricantes')return {title:'Fabricantes',singular:'fabricante',description:'Administra los fabricantes utilizados por las figuras.'};
 return {title:'Franquicias',singular:'franquicia',description:'Edita nombres, logos, visibilidad y franquicias destacadas.'};
}
async function showAdminCatalogsSection(kind='franquicias'){
 adminCatalogKind=kind;setAdminTab('adminCatalogsTab');const meta=catalogKindMeta(kind),body=document.getElementById('adminPanelBody');
 body.innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Catálogos</h1><p>Corrige y administra los datos maestros sin entrar a Supabase.</p></div><div class="adminHeaderActions"><button id="logoutAdmin" class="secondary" type="button">Cerrar sesión</button></div></div><div class="adminProductKinds"><button type="button" data-catalog-kind="franquicias" class="${kind==='franquicias'?'active':''}">Franquicias</button><button type="button" data-catalog-kind="personajes" class="${kind==='personajes'?'active':''}">Personajes</button><button type="button" data-catalog-kind="fabricantes" class="${kind==='fabricantes'?'active':''}">Fabricantes</button></div><div class="adminSubHeader catalogSubHeader"><div><h2>${meta.title}</h2><p>${meta.description}</p></div><button id="newAdminCatalog" class="primary catalogNewButton" type="button">+ ${kind==='franquicias'?'Nueva franquicia':kind==='personajes'?'Nuevo personaje':'Nuevo fabricante'}</button></div><div class="adminToolbar"><input id="adminCatalogSearch" type="search" placeholder="Buscar ${meta.title.toLowerCase()}…"></div><div id="adminCatalogList" class="adminProducts"><p class="adminLoading">Cargando ${meta.title.toLowerCase()}…</p></div>`;
 document.getElementById('logoutAdmin').onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin()};
 document.querySelectorAll('[data-catalog-kind]').forEach(b=>b.onclick=()=>showAdminCatalogsSection(b.dataset.catalogKind));
 document.getElementById('adminCatalogSearch').oninput=e=>renderAdminCatalogs(e.target.value);document.getElementById('newAdminCatalog').onclick=openAdminCatalogCreate;await loadAdminCatalogs();
}
async function loadAdminCatalogs(){
 const kind=adminCatalogKind;let select=kind==='personajes'?'id,nombre,activo,franquicia_id,franquicias(nombre)':kind==='franquicias'?'id,nombre,activo,destacada,logo_url':'id,nombre,activo';
 const {data,error}=await supabaseClient.from(kind).select(select).order('nombre');const box=document.getElementById('adminCatalogList');if(error){box.innerHTML=`<p class="formMessage error">No fue posible cargar el catálogo: ${escapeHtml(error.message)}</p>`;return}
 adminCatalogCache=data||[];await loadAdminCatalogUsage();renderAdminCatalogs(document.getElementById('adminCatalogSearch')?.value||'');
}
async function loadAdminCatalogUsage(){
 const kind=adminCatalogKind,ids=adminCatalogCache.map(x=>x.id);if(!ids.length)return;const usage=new Map(ids.map(id=>[String(id),0]));
 const field=kind==='franquicias'?'franquicia_id':kind==='personajes'?'personaje_id':'fabricante_id';
 const queries=[supabaseClient.from('productos').select(field).in(field,ids)];if(kind!=='fabricantes')queries.push(supabaseClient.from('productos_adicionales').select(field).in(field,ids));
 const results=await Promise.all(queries);results.forEach(r=>{if(r.error)return;(r.data||[]).forEach(x=>{const id=x[field];if(id!=null)usage.set(String(id),(usage.get(String(id))||0)+1)})});adminCatalogCache.forEach(x=>x.__usage=usage.get(String(x.id))||0);
}
function renderAdminCatalogs(search=''){
 const box=document.getElementById('adminCatalogList');if(!box)return;const q=normalizeCatalogName(search),items=adminCatalogCache.filter(x=>!q||normalizeCatalogName(x.nombre).includes(q)||normalizeCatalogName(x.franquicias?.nombre).includes(q));
 if(!items.length){box.innerHTML='<div class="adminEmpty"><b>Sin resultados</b><span>No encontramos registros con esa búsqueda.</span></div>';return}
 box.innerHTML=items.map(x=>`<article class="adminProduct catalogAdminRow"><div class="catalogAdminIdentity">${adminCatalogKind==='franquicias'?`<div class="catalogAdminLogo">${x.logo_url?`<img src="${attr(x.logo_url)}" alt="Logo de ${attr(x.nombre)}">`:'<span>界</span>'}</div>`:''}<div><h3>${escapeHtml(x.nombre)}</h3><p>${adminCatalogKind==='personajes'?escapeHtml(x.franquicias?.nombre||'Sin franquicia'):`${x.__usage||0} ${(x.__usage||0)===1?'producto relacionado':'productos relacionados'}`}</p></div></div><div class="adminBadges">${adminCatalogKind==='franquicias'&&x.destacada?'<span class="adminVisibility is-featured">Destacada</span>':''}<span class="adminVisibility ${x.activo===false?'is-hidden':'is-visible'}">${x.activo===false?'Inactivo':'Activo'}</span></div><div class="adminRowActions"><button type="button" data-catalog-edit="${attr(x.id)}">Editar</button><button type="button" data-catalog-toggle="${attr(x.id)}">${x.activo===false?'Activar':'Desactivar'}</button></div></article>`).join('');
 box.querySelectorAll('[data-catalog-edit]').forEach(b=>b.onclick=()=>openAdminCatalogEdit(b.dataset.catalogEdit));box.querySelectorAll('[data-catalog-toggle]').forEach(b=>b.onclick=()=>toggleAdminCatalog(b.dataset.catalogToggle));
}
async function openAdminCatalogCreate(){
 document.getElementById('catalogEditBackdrop')?.remove();let franchises=[];
 if(adminCatalogKind==='personajes'){const r=await supabaseClient.from('franquicias').select('id,nombre,activo').order('nombre');if(r.error){alert('No fue posible cargar franquicias: '+r.error.message);return}franchises=r.data||[]}
 const logo=adminCatalogKind==='franquicias',meta=catalogKindMeta(adminCatalogKind),wrap=document.createElement('div');wrap.id='catalogEditBackdrop';wrap.className='catalogModalBackdrop';
 wrap.innerHTML=`<div class="catalogModal catalogEditModal" role="dialog" aria-modal="true"><div class="catalogModalHead"><h3>${adminCatalogKind==='franquicias'?'Nueva franquicia':adminCatalogKind==='personajes'?'Nuevo personaje':'Nuevo fabricante'}</h3><button class="catalogModalClose" type="button">×</button></div><form id="catalogCreateForm"><label>Nombre <span class="required">*</span><input name="nombre" maxlength="150" required autocomplete="off"></label>${adminCatalogKind==='personajes'?`<label>Franquicia <span class="required">*</span><select name="franquicia_id" required><option value="">Selecciona una franquicia</option>${franchises.map(f=>`<option value="${attr(f.id)}">${escapeHtml(f.nombre)}${f.activo===false?' (inactiva)':''}</option>`).join('')}</select></label>`:''}${logo?`<div class="catalogEditLogo"><b>Logo <small>(opcional)</small></b><div id="catalogCreateLogoPreview" class="franchiseLogoPreview large"><span>Sin logo</span></div><input id="catalogCreateLogoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="catalogCreateLogoChoose" class="secondary" type="button">Agregar logo</button><button id="catalogCreateLogoRemove" class="visualRemove" type="button" hidden>Quitar</button></div></div><label class="catalogSwitchRow"><span>Mostrar en “Explora por universo”</span><span class="adminSwitch"><input name="destacada" type="checkbox"><span class="adminSwitchTrack"></span></span></label>`:''}<label class="catalogSwitchRow"><span>Activo</span><span class="adminSwitch"><input name="activo" type="checkbox" checked><span class="adminSwitchTrack"></span></span></label><p id="catalogCreateMessage" class="catalogModalMessage"></p><div class="catalogModalActions"><button class="secondary" id="cancelCatalogCreate" type="button">Cancelar</button><button class="primary" id="saveCatalogCreate" type="submit">Crear ${escapeHtml(meta.singular)}</button></div></form></div>`;
 document.body.appendChild(wrap);let logoFile=null,logoPreview=null;const close=()=>{if(logoPreview)URL.revokeObjectURL(logoPreview);wrap.remove()};wrap.querySelector('.catalogModalClose').onclick=close;document.getElementById('cancelCatalogCreate').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 if(logo){const input=document.getElementById('catalogCreateLogoInput'),preview=document.getElementById('catalogCreateLogoPreview'),remove=document.getElementById('catalogCreateLogoRemove');document.getElementById('catalogCreateLogoChoose').onclick=()=>input.click();input.onchange=()=>{const file=input.files?.[0];if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Selecciona una imagen JPG, PNG o WebP.');return}if(logoPreview)URL.revokeObjectURL(logoPreview);logoFile=file;logoPreview=URL.createObjectURL(file);preview.innerHTML=`<img src="${attr(logoPreview)}" alt="Vista previa">`;remove.hidden=false};remove.onclick=()=>{if(logoPreview)URL.revokeObjectURL(logoPreview);logoPreview=null;logoFile=null;input.value='';preview.innerHTML='<span>Sin logo</span>';remove.hidden=true}}
 document.getElementById('catalogCreateForm').onsubmit=e=>saveAdminCatalogCreate(e,logoFile,close);
}
async function saveAdminCatalogCreate(e,logoFile,close){
 e.preventDefault();const form=e.currentTarget,msg=document.getElementById('catalogCreateMessage'),button=document.getElementById('saveCatalogCreate'),name=form.nombre.value.trim();if(!name)return;
 if(adminCatalogCache.some(x=>normalizeCatalogName(x.nombre)===normalizeCatalogName(name))){msg.textContent='Ya existe un registro con ese nombre.';msg.className='catalogModalMessage error';return}
 button.disabled=true;msg.textContent='Guardando…';msg.className='catalogModalMessage';let uploadedPath=null;
 try{
  const payload={nombre:name,activo:form.activo.checked};
  if(adminCatalogKind==='personajes')payload.franquicia_id=form.franquicia_id.value;
  if(adminCatalogKind==='franquicias'){payload.destacada=form.destacada.checked;if(payload.destacada){const {count,error:countError}=await supabaseClient.from('franquicias').select('id',{count:'exact',head:true}).eq('destacada',true);if(countError)throw countError;if((count||0)>=8)throw new Error('Ya hay 8 franquicias en “Explora por universo”. Desactiva una antes de agregar otra.')}if(logoFile){const up=await uploadSiteAsset('franchise-logo',logoFile);payload.logo_url=up.url;uploadedPath=up.path}}
  const {error}=await supabaseClient.from(adminCatalogKind).insert(payload);if(error)throw error;
  if(adminCatalogKind==='franquicias')await loadFeaturedFranchises();await loadPublicFilterOptions();close();await loadAdminCatalogs();
 }catch(error){if(uploadedPath)await supabaseClient.storage.from('sitio').remove([uploadedPath]);msg.textContent='No se pudo crear: '+(error?.message||'Error inesperado.');msg.className='catalogModalMessage error'}finally{button.disabled=false}
}
async function toggleAdminCatalog(id){
 const item=adminCatalogCache.find(x=>String(x.id)===String(id));if(!item)return;const next=item.activo===false;if(!next&&item.__usage&&!confirm(`${item.nombre} está relacionado con ${item.__usage} producto(s). Se desactivará del catálogo maestro, pero las relaciones existentes se conservarán. ¿Continuar?`))return;
 const {error}=await supabaseClient.from(adminCatalogKind).update({activo:next}).eq('id',id);if(error){alert('No se pudo cambiar el estado: '+error.message);return}await loadAdminCatalogs();if(adminCatalogKind==='franquicias')await loadFeaturedFranchises();
}
async function openAdminCatalogEdit(id){
 const item=adminCatalogCache.find(x=>String(x.id)===String(id));if(!item)return;document.getElementById('catalogEditBackdrop')?.remove();let franchises=[];
 if(adminCatalogKind==='personajes'){const r=await supabaseClient.from('franquicias').select('id,nombre,activo').order('nombre');if(r.error){alert('No fue posible cargar franquicias: '+r.error.message);return}franchises=r.data||[]}
 const wrap=document.createElement('div');wrap.id='catalogEditBackdrop';wrap.className='catalogModalBackdrop';const logo=adminCatalogKind==='franquicias';
 wrap.innerHTML=`<div class="catalogModal catalogEditModal" role="dialog" aria-modal="true"><div class="catalogModalHead"><h3>Editar ${escapeHtml(catalogKindMeta(adminCatalogKind).singular)}</h3><button class="catalogModalClose" type="button">×</button></div><form id="catalogEditForm"><label>Nombre <span class="required">*</span><input name="nombre" maxlength="150" required value="${attr(item.nombre)}"></label>${adminCatalogKind==='personajes'?`<label>Franquicia <span class="required">*</span><select name="franquicia_id" required>${franchises.map(f=>`<option value="${attr(f.id)}" ${String(f.id)===String(item.franquicia_id)?'selected':''}>${escapeHtml(f.nombre)}${f.activo===false?' (inactiva)':''}</option>`).join('')}</select></label>`:''}${logo?`<div class="catalogEditLogo"><b>Logo</b><div id="catalogEditLogoPreview" class="franchiseLogoPreview large">${item.logo_url?`<img src="${attr(item.logo_url)}" alt="Logo actual">`:'<span>Sin logo</span>'}</div><input id="catalogEditLogoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="catalogEditLogoChoose" class="secondary" type="button">${item.logo_url?'Cambiar logo':'Agregar logo'}</button>${item.logo_url?'<button id="catalogEditLogoRemove" class="visualRemove" type="button">Quitar</button>':''}</div><label class="catalogSwitchRow"><span>Mostrar en “Explora por universo”</span><span class="adminSwitch"><input name="destacada" type="checkbox" ${item.destacada?'checked':''}><span class="adminSwitchTrack"></span></span></label></div>`:''}<p id="catalogEditMessage" class="catalogModalMessage"></p><div class="catalogModalActions"><button class="secondary" id="cancelCatalogEdit" type="button">Cancelar</button><button class="primary" id="saveCatalogEdit" type="submit">Guardar cambios</button></div></form></div>`;
 document.body.appendChild(wrap);let logoChange=null;const close=()=>{if(logoChange?.preview)URL.revokeObjectURL(logoChange.preview);wrap.remove()};wrap.querySelector('.catalogModalClose').onclick=close;document.getElementById('cancelCatalogEdit').onclick=close;wrap.onclick=e=>{if(e.target===wrap)close()};
 if(logo){const input=document.getElementById('catalogEditLogoInput'),preview=document.getElementById('catalogEditLogoPreview');document.getElementById('catalogEditLogoChoose').onclick=()=>input.click();input.onchange=()=>{const file=input.files?.[0];if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Selecciona una imagen JPG, PNG o WebP.');return}if(logoChange?.preview)URL.revokeObjectURL(logoChange.preview);const url=URL.createObjectURL(file);logoChange={file,preview:url,remove:false};preview.innerHTML=`<img src="${attr(url)}" alt="Vista previa">`};const rm=document.getElementById('catalogEditLogoRemove');if(rm)rm.onclick=()=>{if(logoChange?.preview)URL.revokeObjectURL(logoChange.preview);logoChange={file:null,preview:null,remove:true};preview.innerHTML='<span>Sin logo</span>'}}
 document.getElementById('catalogEditForm').onsubmit=e=>saveAdminCatalogEdit(e,item,logoChange,close);
}
async function saveAdminCatalogEdit(e,item,logoChange,close){
 e.preventDefault();const form=e.currentTarget,msg=document.getElementById('catalogEditMessage'),button=document.getElementById('saveCatalogEdit'),name=form.nombre.value.trim();if(!name)return;const duplicate=adminCatalogCache.some(x=>String(x.id)!==String(item.id)&&normalizeCatalogName(x.nombre)===normalizeCatalogName(name));if(duplicate){msg.textContent='Ya existe otro registro con ese nombre.';msg.className='catalogModalMessage error';return}
 button.disabled=true;msg.textContent='Guardando…';msg.className='catalogModalMessage';let uploadedPath=null;
 try{
  const newFranchiseId=adminCatalogKind==='personajes'?form.franquicia_id.value:null;
  const {error:syncError}=await supabaseClient.rpc('actualizar_catalogo_admin',{p_tipo:adminCatalogKind,p_id:item.id,p_nombre:name,p_franquicia_id:newFranchiseId||null});if(syncError)throw syncError;
  if(adminCatalogKind==='franquicias'){
   const visualChanges={destacada:form.destacada.checked};if(logoChange){if(logoChange.file){const up=await uploadSiteAsset('franchise-logo',logoChange.file);visualChanges.logo_url=up.url;uploadedPath=up.path}else if(logoChange.remove)visualChanges.logo_url=null}
   const {error:visualError}=await supabaseClient.from('franquicias').update(visualChanges).eq('id',item.id);if(visualError)throw visualError;
   if(Object.prototype.hasOwnProperty.call(visualChanges,'logo_url')&&item.logo_url&&item.logo_url!==visualChanges.logo_url){const old=siteStoragePathFromPublicUrl(item.logo_url);if(old)await supabaseClient.storage.from('sitio').remove([old])}
   await loadFeaturedFranchises();
  }
  await loadPublicFilterOptions();
  close();await loadAdminCatalogs();
 }catch(error){if(uploadedPath)await supabaseClient.storage.from('sitio').remove([uploadedPath]);msg.textContent='No se pudo guardar: '+(error?.message||'Error inesperado.');msg.className='catalogModalMessage error'}finally{button.disabled=false}
}

async function showSiteContentForm(){
 setAdminTab('adminContentTab');
 const body=document.getElementById('adminPanelBody');
 body.innerHTML='<p class="adminLoading">Cargando contenido del sitio…</p>';
 const [{data,error},franchiseResult]=await Promise.all([supabaseClient.from('configuracion_sitio').select('*').eq('id',1).single(),supabaseClient.from('franquicias').select('id,nombre,destacada,logo_url').eq('activo',true).order('nombre')]);
 if(error){body.innerHTML=`<p class="formMessage error">No fue posible cargar la configuración: ${escapeHtml(error.message)}</p>`;return}
 siteFranchises=franchiseResult.error?[]:(franchiseResult.data||[]);
 body.innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Contenido del sitio</h1><p>Edita únicamente los textos comerciales principales del catálogo.</p></div><div class="adminHeaderActions"><button id="logoutAdmin" class="secondary" type="button">Cerrar sesión</button></div></div>
 <form id="siteContentForm" class="productForm siteContentForm">
 <section class="formSection"><div class="formSectionTitle"><span>01</span><div><h2>Portada</h2><p>Mensaje principal que recibe el visitante.</p></div></div><div class="formGrid"><label>Etiqueta<input name="portada_etiqueta" maxlength="100" required value="${attr(data.portada_etiqueta)}"></label><label class="full">Título<input name="portada_titulo" maxlength="200" required value="${attr(data.portada_titulo)}"></label><label class="full">Descripción<textarea name="portada_descripcion" maxlength="500" rows="4" required>${escapeHtml(data.portada_descripcion)}</textarea></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>02</span><div><h2>Beneficios</h2><p>Los tres mensajes breves debajo de la portada.</p></div></div><div class="formGrid"><label>Beneficio 1<input name="beneficio_1_titulo" maxlength="100" required value="${attr(data.beneficio_1_titulo)}"></label><label>Descripción 1<input name="beneficio_1_descripcion" maxlength="150" required value="${attr(data.beneficio_1_descripcion)}"></label><label>Beneficio 2<input name="beneficio_2_titulo" maxlength="100" required value="${attr(data.beneficio_2_titulo)}"></label><label>Descripción 2<input name="beneficio_2_descripcion" maxlength="150" required value="${attr(data.beneficio_2_descripcion)}"></label><label>Beneficio 3<input name="beneficio_3_titulo" maxlength="100" required value="${attr(data.beneficio_3_titulo)}"></label><label>Descripción 3<input name="beneficio_3_descripcion" maxlength="150" required value="${attr(data.beneficio_3_descripcion)}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>03</span><div><h2>Secciones</h2><p>Títulos principales del catálogo.</p></div></div><div class="formGrid"><label>Título de ofertas<input name="titulo_ofertas" maxlength="100" required value="${attr(data.titulo_ofertas)}"></label><label>Título de figuras<input name="titulo_figuras" maxlength="100" required value="${attr(data.titulo_figuras)}"></label><label>Título de próximamente<input name="titulo_proximamente" maxlength="100" required value="${attr(data.titulo_proximamente)}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>04</span><div><h2>Identidad visual</h2><p>Logo y fotografía de portada. El sitio aplica automáticamente el tratamiento negro y violeta.</p></div></div><div class="siteVisualGrid">
 <div class="siteVisualField"><div class="siteVisualLabel"><b>Logo</b><small>PNG, JPG o WebP · recomendado con fondo transparente</small></div><div class="siteVisualPreview logoPreview" id="siteLogoPreview">${data.logo_url?`<img src="${attr(data.logo_url)}" alt="Logo actual">`:`<div class="visualFallback"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b></span></div>`}</div><input id="siteLogoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="chooseSiteLogo" class="secondary" type="button">${data.logo_url?'Cambiar logo':'Agregar logo'}</button>${data.logo_url?'<button id="removeSiteLogo" class="visualRemove" type="button">Quitar</button>':''}</div></div>
 <label class="siteLogoMode"><span><b>Mostrar nombre junto al logo</b><small>Actívalo para isotipos. Desactívalo si tu logo ya incluye el nombre de la tienda.</small></span><input id="mostrarTextoLogo" name="mostrar_texto_logo" type="checkbox" ${data.mostrar_texto_logo!==false?'checked':''}></label>
 <div class="siteVisualField heroVisualField"><div class="siteVisualLabel"><b>Imagen de portada</b><small>La vista previa usa el mismo recorte <code>cover</code> que la página pública.</small></div><div class="siteVisualPreview heroPreview realHeroPreview" id="siteHeroPreview" style="--preview-hero:${data.portada_url?`url(\'${attr(data.portada_url)}\')`:'none'};--preview-x:${Number(data.portada_posicion_x??50)}%;--preview-y:${Number(data.portada_posicion_y??50)}%">${data.portada_url?'<div class="heroPreviewShade"><span>Vista real del encuadre</span></div>':'<div class="heroFallbackPreview"><span>Fondo negro + halo violeta</span></div>'}</div><div class="heroPositionControls"><label><span>Posición horizontal <b id="heroXValue">${Number(data.portada_posicion_x??50)}%</b></span><input id="heroPositionX" name="portada_posicion_x" type="range" min="0" max="100" step="1" value="${Number(data.portada_posicion_x??50)}"></label><label><span>Posición vertical <b id="heroYValue">${Number(data.portada_posicion_y??50)}%</b></span><input id="heroPositionY" name="portada_posicion_y" type="range" min="0" max="100" step="1" value="${Number(data.portada_posicion_y??50)}"></label><button id="resetHeroPosition" class="visualRemove" type="button">Centrar imagen</button></div><input id="siteHeroInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="chooseSiteHero" class="secondary" type="button">${data.portada_url?'Cambiar portada':'Agregar portada'}</button>${data.portada_url?'<button id="removeSiteHero" class="visualRemove" type="button">Quitar</button>':''}</div></div>
 <div class="siteVisualField heroVisualField mobileHeroField"><div class="siteVisualLabel"><b>Imagen de portada móvil <span class="optionalTag">opcional</span></b><small>Recomendada en formato vertical. Si no cargas una, se utilizará la portada de escritorio.</small></div><div class="siteVisualPreview heroPreview realHeroPreview mobileHeroPreview" id="siteHeroMobilePreview" style="--preview-hero:${data.portada_movil_url?`url(\'${attr(data.portada_movil_url)}\')`:data.portada_url?`url(\'${attr(data.portada_url)}\')`:'none'};--preview-x:${Number(data.portada_movil_posicion_x??50)}%;--preview-y:${Number(data.portada_movil_posicion_y??50)}%">${(data.portada_movil_url||data.portada_url)?'<div class="heroPreviewShade"><span>Vista previa móvil</span></div>':'<div class="heroFallbackPreview"><span>Sin portada</span></div>'}</div><div class="heroPositionControls"><label><span>Posición horizontal <b id="heroMobileXValue">${Number(data.portada_movil_posicion_x??50)}%</b></span><input id="heroMobilePositionX" name="portada_movil_posicion_x" type="range" min="0" max="100" step="1" value="${Number(data.portada_movil_posicion_x??50)}"></label><label><span>Posición vertical <b id="heroMobileYValue">${Number(data.portada_movil_posicion_y??50)}%</b></span><input id="heroMobilePositionY" name="portada_movil_posicion_y" type="range" min="0" max="100" step="1" value="${Number(data.portada_movil_posicion_y??50)}"></label><button id="resetHeroMobilePosition" class="visualRemove" type="button">Centrar imagen</button></div><input id="siteHeroMobileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="chooseSiteHeroMobile" class="secondary" type="button">${data.portada_movil_url?'Cambiar portada móvil':'Agregar portada móvil'}</button>${data.portada_movil_url?'<button id="removeSiteHeroMobile" class="visualRemove" type="button">Quitar</button>':''}</div></div>
 </div></section>
 <section class="formSection"><div class="formSectionTitle"><span>05</span><div><h2>Franquicias destacadas</h2><p>Selecciona los universos que aparecerán en la portada y carga el logo de cada anime. Máximo 8.</p></div></div><div class="featuredFranchiseAdmin" id="featuredFranchiseAdmin">${siteFranchises.length?siteFranchises.map(x=>`<div class="featuredFranchiseOption" data-franchise-row="${attr(x.id)}"><label class="featuredFranchiseCheck"><span class="adminSwitch"><input type="checkbox" name="franquicias_destacadas" value="${attr(x.id)}" ${x.destacada?'checked':''}><span class="adminSwitchTrack"></span></span><span>${escapeHtml(x.nombre)}</span></label><div class="franchiseLogoPreview" id="franchiseLogoPreview-${attr(x.id)}">${x.logo_url?`<img src="${attr(x.logo_url)}" alt="Logo de ${attr(x.nombre)}">`:'<span>Sin logo</span>'}</div><input class="franchiseLogoInput" data-franchise-logo-input="${attr(x.id)}" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="franchiseLogoActions"><button class="visualRemove" data-franchise-logo-choose="${attr(x.id)}" type="button">${x.logo_url?'Cambiar logo':'Agregar logo'}</button>${x.logo_url?`<button class="visualRemove" data-franchise-logo-remove="${attr(x.id)}" type="button">Quitar</button>`:''}</div></div>`).join(''):'<p class="fieldHint">No hay franquicias disponibles.</p>'}</div><small class="fieldHint">El logo se utiliza en “Explora por universo”. Recomendado: PNG o WebP con fondo transparente.</small></section>
 <div class="formActions"><button id="saveSiteContent" class="primary" type="submit">Guardar contenido</button></div><p id="siteContentMessage" class="formMessage"></p></form>`;
 document.getElementById('logoutAdmin').onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin()};
 document.getElementById('siteContentForm').onsubmit=saveSiteContent;
 document.querySelectorAll('input[name="franquicias_destacadas"]').forEach(ch=>ch.addEventListener('change',e=>{const checked=[...document.querySelectorAll('input[name="franquicias_destacadas"]:checked')];if(checked.length>8){e.target.checked=false;alert('Puedes destacar un máximo de 8 franquicias.')}}));
 document.querySelectorAll('[data-franchise-logo-choose]').forEach(btn=>btn.addEventListener('click',()=>document.querySelector(`[data-franchise-logo-input="${btn.dataset.franchiseLogoChoose}"]`)?.click()));
 document.querySelectorAll('[data-franchise-logo-input]').forEach(input=>input.addEventListener('change',()=>previewFranchiseLogo(input.dataset.franchiseLogoInput,input.files?.[0])));
 document.querySelectorAll('[data-franchise-logo-remove]').forEach(btn=>btn.addEventListener('click',()=>markFranchiseLogoRemoved(btn.dataset.franchiseLogoRemove)));
 siteLogoFile=null;siteHeroFile=null;siteHeroMobileFile=null;franchiseLogoFiles=new Map();
 const logoInput=document.getElementById('siteLogoInput'),heroInput=document.getElementById('siteHeroInput'),heroMobileInput=document.getElementById('siteHeroMobileInput');
 document.getElementById('chooseSiteLogo').onclick=()=>logoInput.click();
 document.getElementById('chooseSiteHero').onclick=()=>heroInput.click();
 document.getElementById('chooseSiteHeroMobile').onclick=()=>heroMobileInput.click();
 logoInput.onchange=()=>previewSiteAsset('logo',logoInput.files?.[0]);
 heroInput.onchange=()=>previewSiteAsset('hero',heroInput.files?.[0]);
 heroMobileInput.onchange=()=>previewSiteAsset('hero-mobile',heroMobileInput.files?.[0]);
 document.getElementById('removeSiteLogo')?.addEventListener('click',()=>markSiteAssetRemoved('logo'));
 document.getElementById('removeSiteHero')?.addEventListener('click',()=>markSiteAssetRemoved('hero'));
 document.getElementById('removeSiteHeroMobile')?.addEventListener('click',()=>markSiteAssetRemoved('hero-mobile'));
 const mode=document.getElementById('mostrarTextoLogo');
 const syncLogoModePreview=()=>document.getElementById('siteLogoPreview')?.classList.toggle('logoOnlyPreview',!mode.checked);
 mode?.addEventListener('change',syncLogoModePreview);syncLogoModePreview();
 const posX=document.getElementById('heroPositionX'),posY=document.getElementById('heroPositionY');
 const syncHeroPosition=()=>{const preview=document.getElementById('siteHeroPreview');if(!preview)return;preview.style.setProperty('--preview-x',`${posX.value}%`);preview.style.setProperty('--preview-y',`${posY.value}%`);document.getElementById('heroXValue').textContent=`${posX.value}%`;document.getElementById('heroYValue').textContent=`${posY.value}%`};
 posX?.addEventListener('input',syncHeroPosition);posY?.addEventListener('input',syncHeroPosition);
 document.getElementById('resetHeroPosition')?.addEventListener('click',()=>{posX.value=50;posY.value=50;syncHeroPosition()});syncHeroPosition();
 const mobilePosX=document.getElementById('heroMobilePositionX'),mobilePosY=document.getElementById('heroMobilePositionY');
 const syncHeroMobilePosition=()=>{const preview=document.getElementById('siteHeroMobilePreview');if(!preview)return;preview.style.setProperty('--preview-x',`${mobilePosX.value}%`);preview.style.setProperty('--preview-y',`${mobilePosY.value}%`);document.getElementById('heroMobileXValue').textContent=`${mobilePosX.value}%`;document.getElementById('heroMobileYValue').textContent=`${mobilePosY.value}%`};
 mobilePosX?.addEventListener('input',syncHeroMobilePosition);mobilePosY?.addEventListener('input',syncHeroMobilePosition);document.getElementById('resetHeroMobilePosition')?.addEventListener('click',()=>{mobilePosX.value=50;mobilePosY.value=50;syncHeroMobilePosition()});syncHeroMobilePosition();
}
function previewFranchiseLogo(id,file){
 if(!file)return;if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Selecciona una imagen JPG, PNG o WebP.');return}
 const previous=franchiseLogoFiles.get(id);if(previous?.preview)URL.revokeObjectURL(previous.preview);const preview=URL.createObjectURL(file);franchiseLogoFiles.set(id,{file,preview,remove:false});
 const box=document.getElementById(`franchiseLogoPreview-${id}`);if(box)box.innerHTML=`<img src="${attr(preview)}" alt="Vista previa del logo">`;
}
function markFranchiseLogoRemoved(id){
 const previous=franchiseLogoFiles.get(id);if(previous?.preview)URL.revokeObjectURL(previous.preview);franchiseLogoFiles.set(id,{file:null,preview:null,remove:true});const box=document.getElementById(`franchiseLogoPreview-${id}`);if(box)box.innerHTML='<span>Sin logo</span>';
}
function previewSiteAsset(kind,file){
 if(!file)return;
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Selecciona una imagen JPG, PNG o WebP.');return}
 const url=URL.createObjectURL(file),isLogo=kind==='logo',isMobile=kind==='hero-mobile';
 if(isLogo)siteLogoFile={file,preview:url,remove:false};else if(isMobile)siteHeroMobileFile={file,preview:url,remove:false};else siteHeroFile={file,preview:url,remove:false};
 if(isLogo){document.getElementById('siteLogoPreview').innerHTML=`<img src="${attr(url)}" alt="Vista previa">`}else{const preview=document.getElementById(isMobile?'siteHeroMobilePreview':'siteHeroPreview');preview.style.setProperty('--preview-hero',`url('${url}')`);preview.innerHTML=`<div class="heroPreviewShade"><span>${isMobile?'Vista previa móvil':'Vista real del encuadre'}</span></div>`;}
}
function markSiteAssetRemoved(kind){
 const isLogo=kind==='logo',isMobile=kind==='hero-mobile',current=isLogo?siteLogoFile:isMobile?siteHeroMobileFile:siteHeroFile;if(current?.preview)URL.revokeObjectURL(current.preview);
 const marker={file:null,preview:null,remove:true};if(isLogo)siteLogoFile=marker;else if(isMobile)siteHeroMobileFile=marker;else siteHeroFile=marker;
 const preview=document.getElementById(isLogo?'siteLogoPreview':isMobile?'siteHeroMobilePreview':'siteHeroPreview');
 if(isLogo)preview.innerHTML='<div class="visualFallback"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b></span></div>';else{const fallbackUrl=isMobile&&!siteHeroFile?.remove?(siteHeroFile?.preview||siteConfig?.portada_url):null;if(fallbackUrl){preview.style.setProperty('--preview-hero',`url('${fallbackUrl}')`);preview.innerHTML='<div class="heroPreviewShade"><span>Usando portada de escritorio</span></div>'}else{preview.innerHTML='<div class="heroFallbackPreview"><span>Sin portada</span></div>';preview.style.setProperty('--preview-hero','none')}}
}
async function compressSiteImage(file,kind){
 const bitmap=await createImageBitmap(file),isLogo=kind==='logo'||kind==='franchise-logo',max=isLogo?1200:2200,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const ctx=canvas.getContext('2d',{alpha:isLogo});if(!isLogo){ctx.fillStyle='#090a0d';ctx.fillRect(0,0,canvas.width,canvas.height)}ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
 return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No fue posible optimizar la imagen.')),'image/webp',isLogo?0.9:0.84));
}
function siteStoragePathFromPublicUrl(url){const marker='/storage/v1/object/public/sitio/';const i=(url||'').indexOf(marker);return i>=0?decodeURIComponent(url.slice(i+marker.length)):null}
async function uploadSiteAsset(kind,file){
 const blob=await compressSiteImage(file,kind),path=`${kind==='logo'?'logo':kind==='franchise-logo'?'franquicias/logo':kind==='hero-mobile'?'portada-movil':'portada'}-${crypto.randomUUID()}.webp`;
 const {error}=await supabaseClient.storage.from('sitio').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'3600'});if(error)throw error;
 const {data}=supabaseClient.storage.from('sitio').getPublicUrl(path);return {url:data.publicUrl,path};
}
async function saveSiteContent(e){
 e.preventDefault();const f=new FormData(e.currentTarget),button=document.getElementById('saveSiteContent'),msg=document.getElementById('siteContentMessage');
 const obj={portada_etiqueta:f.get('portada_etiqueta').trim(),portada_titulo:f.get('portada_titulo').trim(),portada_descripcion:f.get('portada_descripcion').trim(),beneficio_1_titulo:f.get('beneficio_1_titulo').trim(),beneficio_1_descripcion:f.get('beneficio_1_descripcion').trim(),beneficio_2_titulo:f.get('beneficio_2_titulo').trim(),beneficio_2_descripcion:f.get('beneficio_2_descripcion').trim(),beneficio_3_titulo:f.get('beneficio_3_titulo').trim(),beneficio_3_descripcion:f.get('beneficio_3_descripcion').trim(),titulo_ofertas:f.get('titulo_ofertas').trim(),titulo_figuras:f.get('titulo_figuras').trim(),titulo_proximamente:f.get('titulo_proximamente').trim(),mostrar_texto_logo:f.get('mostrar_texto_logo')==='on',portada_posicion_x:Number(f.get('portada_posicion_x')||50),portada_posicion_y:Number(f.get('portada_posicion_y')||50),portada_movil_posicion_x:Number(f.get('portada_movil_posicion_x')||50),portada_movil_posicion_y:Number(f.get('portada_movil_posicion_y')||50),fecha_actualizacion:new Date().toISOString()};
 button.disabled=true;msg.textContent='Guardando…';msg.className='formMessage';const oldLogo=siteConfig?.logo_url||null,oldHero=siteConfig?.portada_url||null,oldHeroMobile=siteConfig?.portada_movil_url||null;let uploaded=[];
 try{
  const featuredIds=[...document.querySelectorAll('input[name="franquicias_destacadas"]:checked')].map(x=>x.value);
  const {error:clearFeaturedError}=await supabaseClient.from('franquicias').update({destacada:false}).eq('destacada',true);if(clearFeaturedError)throw clearFeaturedError;
  if(featuredIds.length){const {error:featuredError}=await supabaseClient.from('franquicias').update({destacada:true}).in('id',featuredIds);if(featuredError)throw featuredError;}
  for(const [franchiseId,change] of franchiseLogoFiles){
   const original=siteFranchises.find(x=>String(x.id)===String(franchiseId));let logoUrl=original?.logo_url||null;
   if(change?.file){msg.textContent=`Procesando logo de ${original?.nombre||'franquicia'}…`;const x=await uploadSiteAsset('franchise-logo',change.file);uploaded.push(x.path);logoUrl=x.url}else if(change?.remove)logoUrl=null;else continue;
   const {error:franchiseLogoError}=await supabaseClient.from('franquicias').update({logo_url:logoUrl}).eq('id',franchiseId);if(franchiseLogoError)throw franchiseLogoError;
   if(original?.logo_url&&original.logo_url!==logoUrl){const oldPath=siteStoragePathFromPublicUrl(original.logo_url);if(oldPath)await supabaseClient.storage.from('sitio').remove([oldPath]);}
  }
  if(siteLogoFile?.file){msg.textContent='Procesando logo…';const x=await uploadSiteAsset('logo',siteLogoFile.file);uploaded.push(x.path);obj.logo_url=x.url}else if(siteLogoFile?.remove)obj.logo_url=null;
  if(siteHeroFile?.file){msg.textContent='Procesando portada…';const x=await uploadSiteAsset('hero',siteHeroFile.file);uploaded.push(x.path);obj.portada_url=x.url}else if(siteHeroFile?.remove)obj.portada_url=null;
  if(siteHeroMobileFile?.file){msg.textContent='Procesando portada móvil…';const x=await uploadSiteAsset('hero-mobile',siteHeroMobileFile.file);uploaded.push(x.path);obj.portada_movil_url=x.url}else if(siteHeroMobileFile?.remove)obj.portada_movil_url=null;
  const {data,error}=await supabaseClient.from('configuracion_sitio').update(obj).eq('id',1).select().single();if(error)throw error;
  const obsolete=[];if(Object.prototype.hasOwnProperty.call(obj,'logo_url')&&oldLogo&&oldLogo!==data.logo_url){const x=siteStoragePathFromPublicUrl(oldLogo);if(x)obsolete.push(x)}if(Object.prototype.hasOwnProperty.call(obj,'portada_url')&&oldHero&&oldHero!==data.portada_url){const x=siteStoragePathFromPublicUrl(oldHero);if(x)obsolete.push(x)}if(Object.prototype.hasOwnProperty.call(obj,'portada_movil_url')&&oldHeroMobile&&oldHeroMobile!==data.portada_movil_url){const x=siteStoragePathFromPublicUrl(oldHeroMobile);if(x)obsolete.push(x)}if(obsolete.length)await supabaseClient.storage.from('sitio').remove(obsolete);
  if(siteLogoFile?.preview)URL.revokeObjectURL(siteLogoFile.preview);if(siteHeroFile?.preview)URL.revokeObjectURL(siteHeroFile.preview);if(siteHeroMobileFile?.preview)URL.revokeObjectURL(siteHeroMobileFile.preview);franchiseLogoFiles.forEach(x=>{if(x?.preview)URL.revokeObjectURL(x.preview)});siteLogoFile=null;siteHeroFile=null;siteHeroMobileFile=null;franchiseLogoFiles=new Map();siteConfig=data;applySiteConfig(data);await loadFeaturedFranchises();msg.textContent='Contenido e identidad visual actualizados correctamente.';msg.className='formMessage success';setTimeout(()=>showSiteContentForm(),700);
 }catch(error){if(uploaded.length)await supabaseClient.storage.from('sitio').remove(uploaded);msg.textContent='No se pudo guardar: '+(error?.message||'Error inesperado.');msg.className='formMessage error'}finally{button.disabled=false}
}

async function showAdminAnalytics(period='30'){
 setAdminTab('adminAnalyticsTab');const body=document.getElementById('adminPanelBody');body.innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Estadísticas</h1><p>Interés comercial registrado dentro de la tienda. Cloudflare continúa midiendo tráfico y rendimiento general.</p></div></div><div class="analyticsPeriods"><button data-analytics-period="today">Hoy</button><button data-analytics-period="7">7 días</button><button data-analytics-period="30" class="active">30 días</button><button data-analytics-period="all">Todo</button><button type="button" class="analyticsRefresh" id="analyticsRefresh" aria-label="Actualizar estadísticas">↻ Actualizar</button><span class="analyticsUpdated" id="analyticsUpdated"></span></div><div id="analyticsDashboard"><p class="adminLoading">Cargando estadísticas…</p></div>`;
 body.querySelectorAll('[data-analytics-period]').forEach(b=>{b.classList.toggle('active',b.dataset.analyticsPeriod===period);b.onclick=()=>showAdminAnalytics(b.dataset.analyticsPeriod)});document.getElementById('analyticsRefresh').onclick=()=>refreshAdminAnalytics(period);
 await refreshAdminAnalytics(period);
}
async function refreshAdminAnalytics(period){
 const dash=document.getElementById('analyticsDashboard'),btn=document.getElementById('analyticsRefresh'),updated=document.getElementById('analyticsUpdated');if(!dash)return;if(btn){btn.disabled=true;btn.textContent='↻ Actualizando…'};
 let q=supabaseClient.from('eventos_analytics').select('tipo_evento,producto_id,sku,contexto,fecha_creacion').order('fecha_creacion',{ascending:false});const now=new Date();let from=null;if(period==='today'){from=new Date(now);from.setHours(0,0,0,0)}else if(period!=='all'){from=new Date(now.getTime()-Number(period)*86400000)}if(from)q=q.gte('fecha_creacion',from.toISOString());const {data,error}=await q;if(error){dash.innerHTML=`<p class="formMessage error">No fue posible cargar las estadísticas: ${escapeHtml(error.message)}</p>`}else{await renderAnalyticsDashboard(data||[]);if(updated)updated.textContent=`Actualizado: ${new Date().toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'})}`};if(btn){btn.disabled=false;btn.textContent='↻ Actualizar'};
}
async function renderAnalyticsDashboard(events){
 const dash=document.getElementById('analyticsDashboard');if(!dash)return;const views=events.filter(x=>x.tipo_evento==='vista_producto'||x.tipo_evento==='vista_adicional'),wa=events.filter(x=>x.tipo_evento==='clic_whatsapp'),searches=events.filter(x=>x.tipo_evento==='busqueda'),filters=events.filter(x=>x.tipo_evento==='filtro'),interest=views.length?(wa.length/views.length*100):0;
 const skus=[...new Set(events.map(x=>x.sku).filter(Boolean))];let names={};if(skus.length){const [fig,add]=await Promise.all([supabaseClient.from('productos').select('sku,nombre').in('sku',skus),supabaseClient.from('productos_adicionales').select('sku,nombre').in('sku',skus)]);[...(fig.data||[]),...(add.data||[])].forEach(x=>names[x.sku]=x.nombre)}
 const rank=list=>{const map={};list.forEach(x=>{if(x.sku)map[x.sku]=(map[x.sku]||0)+1});return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5)};const rows=(list,empty)=>list.length?list.map(([sku,count],i)=>`<div class="analyticsRankRow"><span class="analyticsRankNo">${i+1}</span><div><b>${escapeHtml(names[sku]||sku)}</b><small>${escapeHtml(sku)}</small></div><strong>${count}</strong></div>`).join(''):`<p class="analyticsEmpty">${empty}</p>`;
 const searchRank=(onlyEmpty=false)=>{const map={};searches.forEach(x=>{const texto=String(x.contexto?.texto||'').trim();if(!texto)return;const hasResults=Number(x.contexto?.resultados||0)>0;if(onlyEmpty&&!('resultados' in (x.contexto||{})))return;if(onlyEmpty&&hasResults)return;const key=texto.toLowerCase();if(!map[key])map[key]={texto,count:0,resultados:x.contexto?.resultados};map[key].count++});return Object.values(map).sort((a,b)=>b.count-a.count).slice(0,5)};
 const searchRows=(list,empty,showResults=false)=>list.length?list.map((x,i)=>`<div class="analyticsRankRow"><span class="analyticsRankNo">${i+1}</span><div><b>${escapeHtml(x.texto)}</b>${showResults?`<small>${Number(x.resultados||0)} resultados encontrados</small>`:''}</div><strong>${x.count}</strong></div>`).join(''):`<p class="analyticsEmpty">${empty}</p>`;
 dash.innerHTML=`<div class="analyticsCards"><article><small>Productos vistos</small><strong>${views.length}</strong></article><article><small>Clics WhatsApp</small><strong>${wa.length}</strong></article><article><small>Búsquedas</small><strong>${searches.length}</strong></article><article><small>Interés</small><strong>${interest.toFixed(1)}%</strong><span>Clics WhatsApp / vistas</span></article></div><div class="analyticsPanels"><section><h2>Productos más vistos</h2>${rows(rank(views),'Todavía no hay vistas registradas.')}</section><section><h2>Más contactados</h2>${rows(rank(wa),'Todavía no hay clics de WhatsApp.')}</section><section><h2>Búsquedas más frecuentes</h2>${searchRows(searchRank(false),'Todavía no hay búsquedas registradas.')}</section><section><h2>Búsquedas sin resultados</h2>${searchRows(searchRank(true),'Todavía no hay búsquedas sin resultados.',true)}</section></div><div class="analyticsFoot"><span>${events.length} eventos registrados</span><span>${filters.length} usos de filtros</span></div>`;
}

let adminProductsCache=[];
async function loadAdminProducts(){
 const box=document.getElementById('adminProducts');
 const {data,error}=await supabaseClient.from('productos').select('*').order('fecha_creacion',{ascending:false});
 if(error){box.innerHTML=`<p class="formMessage error">No fue posible cargar los productos: ${escapeHtml(error.message)}</p>`;return}
 adminProductsCache=data||[];
 const ids=adminProductsCache.map(p=>p.id);
 if(ids.length){
  const {data:images}=await supabaseClient.from('producto_imagenes').select('producto_id,url,principal,orden').in('producto_id',ids).order('orden');
  const byProduct={};(images||[]).forEach(img=>(byProduct[img.producto_id]??=[]).push(img));
  adminProductsCache.forEach(p=>{const list=byProduct[p.id]||[];p.__adminImage=(list.find(x=>x.principal)||list[0])?.url||''});
 }
 renderAdminProducts(adminProductsCache);
}
function filterAdminProducts(q){q=q.toLowerCase().trim();renderAdminProducts(adminProductsCache.filter(p=>[p.nombre,p.sku,p.franquicia].some(v=>(v||'').toLowerCase().includes(q))))}
function initAdminStatusSelect(select){
 if(!select)return;
 const sync=()=>{select.dataset.status=select.value||'disponible'};
 sync();select.addEventListener('change',sync);
}
function renderAdminProducts(items){
 const box=document.getElementById('adminProducts');
 if(!items.length){box.innerHTML='<div class="adminEmpty"><b>Aún no hay figuras registradas.</b><span>Usa “Nueva figura” para crear el primer producto real.</span></div>';return}
 box.innerHTML=items.map(p=>`<article class="adminProduct"><div class="adminProductIdentity"><div class="adminProductThumb">${p.__adminImage?`<img src="${attr(p.__adminImage)}" alt="">`:'<span>界</span>'}</div><div class="adminProductCopy"><span class="adminSku">${escapeHtml(p.sku)}</span><h3>${escapeHtml(p.nombre)}</h3><p>${escapeHtml(p.franquicia||'Sin franquicia')}</p><div class="adminMobilePrice"><strong>${money(Number(p.precio_oferta??p.precio))}</strong>${p.precio_oferta!=null?`<small>${money(Number(p.precio))}</small>`:''}</div></div></div><div class="adminProductPrice"><strong>${money(Number(p.precio_oferta??p.precio))}</strong>${p.precio_oferta!=null?`<small>${money(Number(p.precio))}</small>`:''}</div><div class="adminBadges"><span class="adminState state-${p.estado}"><i></i>${escapeHtml(p.estado)}</span><span class="adminVisibility ${p.activo===false?'is-hidden':'is-visible'}"><i>${p.activo===false?'○':'◉'}</i>${p.activo===false?'Oculto':'Visible'}</span></div><div class="adminRowActions"><button type="button" class="adminActionEdit" data-edit="${p.id}">Editar</button><button type="button" class="adminActionDuplicate" data-duplicate="${p.id}">Duplicar</button><button type="button" class="${p.activo===false?'adminActionShow':'adminActionHide'}" data-toggle-visible="${p.id}">${p.activo===false?'Mostrar':'Ocultar'}</button><button type="button" class="danger adminActionDelete" data-delete="${p.id}">Eliminar</button></div></article>`).join('');
 box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openProductForm(adminProductsCache.find(p=>p.id===b.dataset.edit)));
 box.querySelectorAll('[data-duplicate]').forEach(b=>b.onclick=()=>openProductForm(adminProductsCache.find(p=>p.id===b.dataset.duplicate),true));
 box.querySelectorAll('[data-toggle-visible]').forEach(b=>b.onclick=()=>toggleProductVisibility(b.dataset.toggleVisible));
 box.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
}
async function toggleProductVisibility(id){
 const p=adminProductsCache.find(x=>x.id===id);if(!p)return;const next=p.activo===false;
 if(!next&&!confirm(`¿Ocultar ${p.nombre}? Dejará de mostrarse en el catálogo público.`))return;
 const {error}=await supabaseClient.from('productos').update({activo:next}).eq('id',id);if(error){alert('No se pudo cambiar la visibilidad: '+error.message);return}await loadAdminProducts();
}
let productFormImages=[];
let existingProductImages=[];
let adminProductFormDirty=false;
function setAdminProductFormDirty(value=true){adminProductFormDirty=value}
function confirmLeaveProductForm(){return !adminProductFormDirty||confirm('Tienes cambios sin guardar. ¿Quieres salir sin guardarlos?')}
function bindProductFormDirtyTracking(form){
 adminProductFormDirty=false;if(!form)return;
 form.addEventListener('input',()=>setAdminProductFormDirty(true));
 form.addEventListener('change',()=>setAdminProductFormDirty(true));
 form.addEventListener('input',e=>{const el=e.target;if(el?.classList?.contains('fieldInvalid')){el.classList.remove('fieldInvalid');el.closest('label,.catalogField')?.querySelector('.fieldErrorText')?.remove()}if(['precio','precio_oferta','stock','nombre'].includes(el?.name))validateProductFieldLive(form,el.name)});
 form.addEventListener('change',e=>{const el=e.target;if(['precio','precio_oferta','stock','activo','estado'].includes(el?.name))validateProductFieldLive(form,el.name)});
}
function activePhotoCount(){return existingProductImages.filter(x=>!x.removed).length+productFormImages.length}
function productFormSnapshot(form){
 const f=new FormData(form);return {nombre:String(f.get('nombre')||'').trim(),precio:Number(f.get('precio')),precio_oferta:f.get('precio_oferta')===''?null:Number(f.get('precio_oferta')),estado:String(f.get('estado')||''),stock:Number(f.get('stock')),activo:f.get('activo')==='on'};
}
function clearSingleFieldError(form,field){
 let el=field==='photos'?form?.querySelector('.photoUploader'):form?.querySelector(`[name="${field}"]`);if(!el)return;if(el.classList.contains('catalogNativeSelect'))el=el.closest('.searchableSelect')||el;el.classList.remove('fieldInvalid');const host=el.closest('label,.catalogField,.photoUploader')||el.parentElement;host?.querySelectorAll('.fieldErrorText').forEach(x=>x.remove());
}
function validateProductFieldLive(form,field){
 if(!form)return;const obj=productFormSnapshot(form),errors=validateProductCommon(obj,obj.activo).filter(x=>x.field===field||(field==='precio'&&x.field==='precio_oferta'));
 clearSingleFieldError(form,field);if(field==='precio')clearSingleFieldError(form,'precio_oferta');errors.forEach(x=>markProductFieldError(form,x.field,x.message));
}
function initPreventiveProductValidation(form){
 if(!form)return;['precio','precio_oferta','stock','nombre'].forEach(name=>{const el=form.querySelector(`[name="${name}"]`);el?.addEventListener('blur',()=>validateProductFieldLive(form,name))});
 const normal=form.querySelector('[name="precio"]'),offer=form.querySelector('[name="precio_oferta"]');if(normal)normal.max='99999999.99';if(offer)offer.max='99999999.99';
}
function validateProductCommon(obj,visible){
 const errors=[];
 if(!obj.nombre?.trim())errors.push({field:'nombre',message:'Escribe el nombre del producto.'});
 if(!Number.isFinite(obj.precio)||obj.precio<=0)errors.push({field:'precio',message:'El precio normal debe ser mayor que $0.'});
 else if(obj.precio>99999999.99)errors.push({field:'precio',message:'El precio normal excede el máximo permitido.'});
 if(obj.precio_oferta!==null&&(!Number.isFinite(obj.precio_oferta)||obj.precio_oferta<=0))errors.push({field:'precio_oferta',message:'El precio de oferta debe ser mayor que $0.'});
 else if(obj.precio_oferta!==null&&obj.precio_oferta>99999999.99)errors.push({field:'precio_oferta',message:'El precio de oferta excede el máximo permitido.'});
 else if(obj.precio_oferta!==null&&obj.precio_oferta>=obj.precio)errors.push({field:'precio_oferta',message:'El precio de oferta debe ser menor que el precio normal.'});
 if(!Number.isInteger(obj.stock)||obj.stock<0)errors.push({field:'stock',message:'El stock debe ser un número entero igual o mayor que 0.'});
 if(obj.estado==='disponible'&&obj.stock<1)errors.push({field:'stock',message:'Un producto disponible debe tener al menos 1 unidad en stock. Cambia el stock o selecciona otro estado.'});
 if(visible&&activePhotoCount()===0)errors.push({field:'photos',message:'Agrega al menos una fotografía antes de publicar el producto. Si aún lo estás preparando, puedes guardarlo como oculto.'});
 return errors;
}
function clearProductValidation(form){
 form?.querySelectorAll('.fieldInvalid').forEach(x=>x.classList.remove('fieldInvalid'));
 form?.querySelectorAll('.fieldErrorText').forEach(x=>x.remove());
}
function markProductFieldError(form,field,message){
 let el=field==='photos'?form?.querySelector('.photoUploader'):form?.querySelector(`[name="${field}"]`);
 if(!el)return;
 if(el.classList.contains('catalogNativeSelect'))el=el.closest('.searchableSelect')||el;
 el.classList.add('fieldInvalid');
 const host=el.closest('label,.catalogField,.photoUploader')||el.parentElement;if(!host)return;
 const note=document.createElement('small');note.className='fieldErrorText';note.textContent=message;host.appendChild(note);
}
function showValidationErrors(form,errors){
 clearProductValidation(form);errors.forEach(x=>markProductFieldError(form,x.field,x.message));
 showProductMessage(errors.map(x=>x.message),true);
 const first=form?.querySelector('.fieldInvalid');if(first){first.scrollIntoView({behavior:'smooth',block:'center'});setTimeout(()=>{const focus=first.matches('input,select,textarea,button')?first:first.querySelector('input,select,textarea,button');focus?.focus({preventScroll:true})},350)}
}
function commercialStateWarning(obj){return '';}
function syncCommercialStateStock(form,initial=false){
 if(!form)return;const state=form.querySelector('[name="estado"]'),stock=form.querySelector('[name="stock"]');if(!state||!stock)return;
 const locked=state.value==='vendida'||state.value==='proximamente';
 if(locked){if(stock.value!=='0')stock.value='0';stock.disabled=true;stock.setAttribute('aria-disabled','true');}
 else{stock.disabled=false;stock.removeAttribute('aria-disabled');}
 const label=stock.closest('label');let hint=label?.querySelector('.stockStateHint');
 if(locked){if(!hint&&label){hint=document.createElement('small');hint.className='fieldHint stockStateHint';label.appendChild(hint)}if(hint)hint.textContent=state.value==='vendida'?'El stock se establece en 0 mientras el producto esté vendido.':'El stock se establece en 0 hasta que el producto deje de estar en Próximamente.';}
 else hint?.remove();
 clearSingleFieldError(form,'stock');if(!initial&&state.value==='disponible')validateProductFieldLive(form,'stock');
}
function initCommercialStateStock(form){
 if(!form)return;const state=form.querySelector('[name="estado"]');if(!state)return;syncCommercialStateStock(form,true);state.addEventListener('change',()=>syncCommercialStateStock(form,false));
}

function openProductForm(p=null,duplicating=false){
 const editing=!!p&&!duplicating;
 productFormImages=[];
 existingProductImages=[];
 document.getElementById('adminContent').innerHTML=`<div class="adminFormHead"><button id="backAdmin" class="backBtn" type="button">‹ Volver a productos</button><span class="kicker">${editing?'EDITAR':duplicating?'DUPLICAR':'NUEVA'} FIGURA</span><h1>${editing?'Editar producto':duplicating?'Duplicar producto':'Registrar figura'}</h1>${duplicating?'<p class="duplicateNotice">Se copiarán los datos del producto. El SKU será nuevo y las fotografías deberán agregarse a la copia.</p>':''}</div><form id="productForm" class="productForm" novalidate>
 <section class="formSection"><div class="formSectionTitle"><span>01</span><div><h2>Información</h2><p>Datos principales de la figura.</p></div></div><div class="formGrid">
 <label>SKU<div class="readonlyField">${editing?escapeHtml(p.sku):'Se generará automáticamente'}</div><small class="fieldHint">${editing?'Identificador interno del producto.':duplicating?'La copia recibirá un SKU nuevo al guardarse.':'Supabase asignará el siguiente código ANS-XXXXX al guardar.'}</small></label>
 <label>Estado<select name="estado" class="adminStatusSelect"><option value="disponible">Disponible</option><option value="apartada">Apartada</option><option value="vendida">Vendida</option><option value="proximamente">Próximamente</option></select></label>
 <label><span class="fieldLabel">Nombre <span class="required">*</span></span><input name="nombre" maxlength="150" required value="${attr(p?.nombre||'')}"><small class="fieldHint charCount" data-count-for="nombre">0 / 150</small></label><div class="catalogField"><span>Franquicia</span><div class="catalogPicker"><div class="searchableSelect" id="franquiciaCombo"><input class="searchableSelectInput" id="franquiciaSearch" type="text" autocomplete="off" placeholder="Buscar franquicia…"><button class="searchableSelectArrow" type="button" tabindex="-1" aria-label="Mostrar franquicias">⌄</button><div class="searchableSelectMenu"></div><select name="franquicia_id" id="franquiciaSelect" class="catalogNativeSelect"><option value="">Cargando franquicias…</option></select></div><button class="catalogAdd" id="addFranquicia" type="button">＋ Nueva</button></div><small class="fieldHint">Escribe para buscar una franquicia existente o créala sin salir del producto.</small></div>
 <div class="catalogField"><span>Personaje</span><div class="catalogPicker"><div class="searchableSelect" id="personajeCombo"><input class="searchableSelectInput" id="personajeSearch" type="text" autocomplete="off" placeholder="Selecciona primero una franquicia…" disabled><button class="searchableSelectArrow" type="button" tabindex="-1" aria-label="Mostrar personajes">⌄</button><div class="searchableSelectMenu"></div><select name="personaje_id" id="personajeSelect" class="catalogNativeSelect" disabled><option value="">Selecciona primero una franquicia…</option></select></div><button class="catalogAdd" id="addPersonaje" type="button" disabled>＋ Nuevo</button></div><small class="fieldHint">Escribe para buscar. Los personajes dependen de la franquicia seleccionada.</small></div>
 <div class="catalogField"><span>Fabricante</span><div class="catalogPicker"><div class="searchableSelect" id="fabricanteCombo"><input class="searchableSelectInput" id="fabricanteSearch" type="text" autocomplete="off" placeholder="Buscar fabricante…"><button class="searchableSelectArrow" type="button" tabindex="-1" aria-label="Mostrar fabricantes">⌄</button><div class="searchableSelectMenu"></div><select name="fabricante_id" id="fabricanteSelect" class="catalogNativeSelect"><option value="">Cargando fabricantes…</option></select></div><button class="catalogAdd" id="addFabricante" type="button">＋ Nuevo</button></div><small class="fieldHint">Escribe para buscar un fabricante existente.</small></div>
 </div></section>
 <section class="formSection"><div class="formSectionTitle"><span>02</span><div><h2>Precio e inventario</h2><p>Precio de venta y disponibilidad.</p></div></div><div class="formGrid"><label><span class="fieldLabel">Precio normal <span class="required">*</span></span><div class="moneyInput"><span>$</span><input name="precio" type="number" min="0.01" step="0.01" required value="${attr(p?.precio??'')}"></div></label><label><span class="fieldLabel">Precio oferta <span class="fieldOptional">(opcional)</span></span><div class="moneyInput"><span>$</span><input name="precio_oferta" type="number" min="0.01" step="0.01" value="${attr(p?.precio_oferta??'')}"></div></label><label>Stock<input name="stock" type="number" min="0" step="1" required value="${attr(p?.stock??1)}"></label><label>Procedencia<input name="procedencia" maxlength="100" value="${attr(p?.procedencia||'Japón')}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>03</span><div><h2>Estado físico</h2><p>Condición de la pieza y su empaque.</p></div></div><div class="formGrid"><label>Condición figura<select name="condicion_figura"><option>Nueva</option><option>Usada - Excelente</option><option>Usada - Buena</option><option>Usada - Con detalles</option></select></label><label>Condición caja<select name="condicion_caja"><option value="">Seleccionar…</option><option>Excelente</option><option>Buena</option><option>Con detalles</option><option>Sin caja</option></select></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>04</span><div><h2>Publicación</h2><p>Información que verá el cliente.</p></div></div><div class="formGrid"><label class="full">Entrega<input name="entrega" maxlength="150" value="${attr(p?.entrega||'A convenir')}"><small class="fieldHint charCount" data-count-for="entrega">0 / 150</small></label><label class="full">Descripción<textarea name="descripcion" maxlength="2000" rows="5" placeholder="Describe la figura, edición, detalles relevantes, contenido incluido…">${escapeHtml(p?.descripcion||'')}</textarea><small class="fieldHint charCount" data-count-for="descripcion">0 / 2000</small></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>05</span><div><h2>Fotografías</h2><p>Agrega varias imágenes y elige la principal.</p></div></div><div class="photoUploader"><input id="productPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><button id="selectPhotos" class="uploadButton" type="button"><span>＋</span><b>Agregar fotografías</b><small>JPG, PNG o WebP · se optimizan antes de subir</small></button><div id="photoPreview" class="photoPreview"></div></div></section>
 <div class="formChecks"><label><input name="destacada" type="checkbox" ${p?.destacada?'checked':''}> Figura destacada</label><label><input name="activo" type="checkbox" ${p?.activo===false?'':'checked'}> Visible en catálogo</label></div><div class="formActions"><button id="saveProductButton" class="primary" type="submit">${editing?'Guardar cambios':duplicating?'Crear copia':'Crear figura'}</button></div><p id="productMessage" class="formMessage"></p></form>`;
 document.querySelector('[name="estado"]').value=p?.estado||'disponible'; initAdminStatusSelect(document.querySelector('[name="estado"]'));
 document.querySelector('[name="condicion_figura"]').value=p?.condicion_figura||'Nueva';
 if(p?.condicion_caja && [...document.querySelector('[name="condicion_caja"]').options].some(o=>o.value===p.condicion_caja)) document.querySelector('[name="condicion_caja"]').value=p.condicion_caja;
 document.getElementById('backAdmin').onclick=()=>{if(!confirmLeaveProductForm())return;adminProductFormDirty=false;cleanupNewImagePreviews();renderAdminPanel();loadAdminProducts()};
 document.getElementById('selectPhotos').onclick=()=>document.getElementById('productPhotos').click();
 document.getElementById('productPhotos').onchange=handlePhotoSelection;
 document.getElementById('productForm').onsubmit=e=>saveProduct(e,editing?p?.id:null,editing?p?.sku:null);bindProductFormDirtyTracking(document.getElementById('productForm'));initDescriptionCounter(document.getElementById('productForm'));initPreventiveProductValidation(document.getElementById('productForm'));initCommercialStateStock(document.getElementById('productForm'));
 document.getElementById('addFranquicia').onclick=()=>openCatalogModal('franquicias','franquiciaSelect','Nueva franquicia',null,async()=>{await loadCharactersForFranchise(null);});
 document.getElementById('addFabricante').onclick=()=>openCatalogModal('fabricantes','fabricanteSelect','Nuevo fabricante');
 document.getElementById('addPersonaje').onclick=()=>{const franquiciaId=document.getElementById('franquiciaSelect')?.value;if(franquiciaId)openCatalogModal('personajes','personajeSelect','Nuevo personaje',{franquicia_id:franquiciaId});};
 document.getElementById('franquiciaSelect').onchange=()=>{clearCharacterSelectionForFranchiseChange('personajeSelect','addPersonaje');loadCharactersForFranchise(null);};
 initCatalogCombobox('franquiciaSelect','franquiciaSearch');
 initCatalogCombobox('personajeSelect','personajeSearch');
 initCatalogCombobox('fabricanteSelect','fabricanteSearch');
 loadProductCatalogs(p);
 if(editing) loadExistingProductImages(p.id);
}

async function loadProductCatalogs(product=null){
 const [fr,fa]=await Promise.all([
   supabaseClient.from('franquicias').select('id,nombre').order('nombre',{ascending:true}),
   supabaseClient.from('fabricantes').select('id,nombre').order('nombre',{ascending:true})
 ]);
 if(fr.error){showProductMessage('No fue posible cargar las franquicias: '+fr.error.message,true);return}
 if(fa.error){showProductMessage('No fue posible cargar los fabricantes: '+fa.error.message,true);return}
 fillCatalogSelect('franquiciaSelect',fr.data||[],product?.franquicia_id,product?.franquicia,'Sin franquicia');
 fillCatalogSelect('fabricanteSelect',fa.data||[],product?.fabricante_id,product?.fabricante,'Sin fabricante');
 await loadCharactersForFranchise(product);
}
function clearCharacterSelectionForFranchiseChange(selectId,addButtonId){
 const select=document.getElementById(selectId),add=document.getElementById(addButtonId);if(!select)return;
 select.value='';select.innerHTML='<option value="">Cargando personajes…</option>';select.disabled=true;if(add)add.disabled=true;syncCatalogCombobox(selectId);
}
async function loadCharactersForFranchise(product=null){
 const franquiciaId=document.getElementById('franquiciaSelect')?.value||'';
 const select=document.getElementById('personajeSelect'),add=document.getElementById('addPersonaje');if(!select||!add)return;
 if(!franquiciaId){select.innerHTML='<option value="">Selecciona primero una franquicia…</option>';select.disabled=true;add.disabled=true;syncCatalogCombobox('personajeSelect');return}
 select.disabled=true;add.disabled=true;select.innerHTML='<option value="">Cargando personajes…</option>';
 const {data,error}=await supabaseClient.from('personajes').select('id,nombre').eq('franquicia_id',franquiciaId).order('nombre',{ascending:true});
 if(error){select.innerHTML='<option value="">No fue posible cargar personajes</option>';showProductMessage('No fue posible cargar los personajes: '+error.message,true);return}
 fillCatalogSelect('personajeSelect',data||[],product?.personaje_id,product?.personaje,'Sin personaje');select.disabled=false;add.disabled=false;syncCatalogCombobox('personajeSelect');
}
function fillCatalogSelect(id,items,selectedId,legacyName,emptyLabel){
 const select=document.getElementById(id);if(!select)return;
 select.innerHTML=`<option value="">${escapeHtml(emptyLabel)}</option>`+items.map(x=>`<option value="${attr(x.id)}" data-name="${attr(x.nombre)}">${escapeHtml(x.nombre)}</option>`).join('');
 let value=selectedId||'';
 if(!value&&legacyName){const match=items.find(x=>x.nombre.trim().toLowerCase()===legacyName.trim().toLowerCase());if(match)value=match.id}
 select.value=value; syncCatalogCombobox(id);
}
function normalizeCatalogText(v){return (v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function syncCatalogCombobox(selectId){
 const select=document.getElementById(selectId);if(!select)return;const input=select.closest('.searchableSelect')?.querySelector('.searchableSelectInput');if(!input)return;
 const option=select.selectedOptions?.[0];input.value=select.value?(option?.dataset?.name||option?.textContent||''):'';input.disabled=select.disabled;
}
function initCatalogCombobox(selectId,inputId){
 const select=document.getElementById(selectId),input=document.getElementById(inputId);if(!select||!input)return;const root=input.closest('.searchableSelect'),menu=root.querySelector('.searchableSelectMenu'),arrow=root.querySelector('.searchableSelectArrow');
 const close=()=>{root.classList.remove('open');menu.innerHTML=''};
 const render=()=>{if(input.disabled)return;const q=normalizeCatalogText(input.value);const options=[...select.options].filter(o=>o.value&&(!q||normalizeCatalogText(o.dataset.name||o.textContent).includes(q)));menu.innerHTML=options.length?options.map(o=>`<button type="button" data-value="${attr(o.value)}">${escapeHtml(o.dataset.name||o.textContent)}</button>`).join(''):'<div class="searchableSelectEmpty">Sin coincidencias</div>';root.classList.add('open');menu.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{select.value=b.dataset.value;syncCatalogCombobox(selectId);close();select.dispatchEvent(new Event('change',{bubbles:true}));});};
 input.addEventListener('focus',()=>{input.select();render()});input.addEventListener('input',render);input.addEventListener('keydown',e=>{if(e.key==='Escape'){syncCatalogCombobox(selectId);close();input.blur()}else if(e.key==='Enter'){const first=menu.querySelector('[data-value]');if(first){e.preventDefault();first.click()}}});
 arrow.onclick=()=>{if(input.disabled)return;if(root.classList.contains('open'))close();else{input.focus();render()}};
 input.addEventListener('blur',()=>setTimeout(()=>{if(!root.contains(document.activeElement)){syncCatalogCombobox(selectId);close()}},120));
}
function openCatalogModal(table,selectId,title,extraData=null,onCreated=null){
 document.getElementById('catalogModalBackdrop')?.remove();
 const wrap=document.createElement('div');wrap.id='catalogModalBackdrop';wrap.className='catalogModalBackdrop';
 wrap.innerHTML=`<div class="catalogModal" role="dialog" aria-modal="true" aria-labelledby="catalogModalTitle"><div class="catalogModalHead"><h3 id="catalogModalTitle">${escapeHtml(title)}</h3><button class="catalogModalClose" type="button" aria-label="Cerrar">×</button></div><form id="catalogModalForm"><label>Nombre <span class="required">*</span><input id="catalogModalName" maxlength="150" autocomplete="off" required placeholder="Escribe el nombre…"></label><p id="catalogModalMessage" class="catalogModalMessage"></p><div class="catalogModalActions"><button class="secondary" id="cancelCatalogModal" type="button">Cancelar</button><button class="primary" id="saveCatalogModal" type="submit">Crear</button></div></form></div>`;
 document.body.appendChild(wrap);
 const close=()=>wrap.remove();
 wrap.querySelector('.catalogModalClose').onclick=close;document.getElementById('cancelCatalogModal').onclick=close;
 wrap.onclick=e=>{if(e.target===wrap)close()};
 document.getElementById('catalogModalForm').onsubmit=e=>createCatalogItem(e,table,selectId,wrap,extraData,onCreated);
 setTimeout(()=>document.getElementById('catalogModalName')?.focus(),0);
}
async function createCatalogItem(e,table,selectId,modal,extraData=null,onCreated=null){
 e.preventDefault();const input=document.getElementById('catalogModalName'),msg=document.getElementById('catalogModalMessage'),button=document.getElementById('saveCatalogModal');
 const nombre=input.value.trim();if(!nombre)return;button.disabled=true;msg.textContent='Creando…';msg.className='catalogModalMessage';
 const {data,error}=await supabaseClient.from(table).insert({nombre,...(extraData||{})}).select('id,nombre').single();
 if(error){msg.textContent=error.code==='23505'?'Ese nombre ya existe en el catálogo.':'No se pudo crear: '+error.message;msg.className='catalogModalMessage error';button.disabled=false;return}
 const select=document.getElementById(selectId);if(select){const option=document.createElement('option');option.value=data.id;option.dataset.name=data.nombre;option.textContent=data.nombre;select.appendChild(option);select.value=data.id;syncCatalogCombobox(selectId);select.dispatchEvent(new Event('change',{bubbles:true}))}
 modal.remove();if(onCreated)await onCreated(data);
}


async function loadExistingProductImages(productId){
 const {data,error}=await supabaseClient.from('producto_imagenes').select('*').eq('producto_id',productId).order('orden',{ascending:true});
 if(error){showProductMessage('No fue posible cargar las fotografías existentes: '+error.message,true);return}
 existingProductImages=(data||[]).map(x=>({...x,removed:false})); renderPhotoPreview();
}

function handlePhotoSelection(e){
 const files=[...e.target.files];
 const allowed=['image/jpeg','image/png','image/webp'];
 let rejectedSize=false;
 for(const file of files){
   if(!allowed.includes(file.type)) continue;
   if(file.size>10*1024*1024){rejectedSize=true;continue}
   if(productFormImages.length+existingProductImages.filter(x=>!x.removed).length>=8) break;
   productFormImages.push({id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),principal:false});setAdminProductFormDirty(true);
 }
 if(rejectedSize)showProductMessage('Una o más imágenes superaban 10 MB y no se agregaron.',true);
 if(!hasPrincipalPhoto()) setFirstPhotoPrincipal();
 e.target.value=''; renderPhotoPreview();
}
function hasPrincipalPhoto(){return existingProductImages.some(x=>!x.removed&&x.principal)||productFormImages.some(x=>x.principal)}
function setFirstPhotoPrincipal(){
 const old=existingProductImages.find(x=>!x.removed); if(old){old.principal=true;return}
 const fresh=productFormImages[0]; if(fresh) fresh.principal=true;
}
function renderPhotoPreview(){
 const box=document.getElementById('photoPreview'); if(!box)return;
 const old=existingProductImages.filter(x=>!x.removed).map(x=>({kind:'old',id:x.id,src:x.url,principal:x.principal}));
 const fresh=productFormImages.map(x=>({kind:'new',id:x.id,src:x.preview,principal:x.principal}));
 const all=[...old,...fresh];
 if(!all.length){box.innerHTML='<p class="photoEmpty">Todavía no has agregado fotografías.</p>';return}
 box.innerHTML=all.map((x,i)=>`<article class="photoItem ${x.principal?'principal':''}"><img src="${attr(x.src)}" alt="Fotografía ${i+1}"><button type="button" class="photoMain" data-main-kind="${x.kind}" data-main-id="${x.id}">${x.principal?'★ Principal':'☆ Hacer principal'}</button><button type="button" class="photoRemove" data-remove-kind="${x.kind}" data-remove-id="${x.id}" aria-label="Quitar fotografía">×</button></article>`).join('');
 box.querySelectorAll('[data-main-id]').forEach(b=>b.onclick=()=>setPrincipalPhoto(b.dataset.mainKind,b.dataset.mainId));
 box.querySelectorAll('[data-remove-id]').forEach(b=>b.onclick=()=>removePhoto(b.dataset.removeKind,b.dataset.removeId));
}
function setPrincipalPhoto(kind,id){
 existingProductImages.forEach(x=>x.principal=false); productFormImages.forEach(x=>x.principal=false);
 const list=kind==='old'?existingProductImages:productFormImages; const item=list.find(x=>x.id===id); if(item)item.principal=true;setAdminProductFormDirty(true); renderPhotoPreview();
}
function removePhoto(kind,id){
 if(kind==='old'){const x=existingProductImages.find(x=>x.id===id);if(x)x.removed=true}
 else {const i=productFormImages.findIndex(x=>x.id===id);if(i>=0){URL.revokeObjectURL(productFormImages[i].preview);productFormImages.splice(i,1)}}
 if(!hasPrincipalPhoto())setFirstPhotoPrincipal();setAdminProductFormDirty(true); renderPhotoPreview();
}
function cleanupNewImagePreviews(){productFormImages.forEach(x=>URL.revokeObjectURL(x.preview));productFormImages=[]}

async function compressImage(file){
 const bitmap=await createImageBitmap(file); const max=1600; const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close?.();
 return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No fue posible optimizar la imagen.')),'image/webp',0.82));
}
function storagePathFromPublicUrl(url){
 const marker='/storage/v1/object/public/productos/'; const i=url.indexOf(marker); return i>=0?decodeURIComponent(url.slice(i+marker.length)):null;
}
async function syncProductImages(product){
 const removed=existingProductImages.filter(x=>x.removed);
 for(const img of removed){const path=storagePathFromPublicUrl(img.url);if(path)await supabaseClient.storage.from('productos').remove([path]);await supabaseClient.from('producto_imagenes').delete().eq('id',img.id)}
 const kept=existingProductImages.filter(x=>!x.removed);
 for(let i=0;i<kept.length;i++){await supabaseClient.from('producto_imagenes').update({orden:i,principal:kept[i].principal}).eq('id',kept[i].id)}
 let order=kept.length;
 for(const img of productFormImages){
   const blob=await compressImage(img.file); const path=`${product.sku}/${String(order+1).padStart(2,'0')}-${crypto.randomUUID()}.webp`;
   const {error:uploadError}=await supabaseClient.storage.from('productos').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'3600'}); if(uploadError)throw uploadError;
   const {data:publicData}=supabaseClient.storage.from('productos').getPublicUrl(path);
   const {error:dbError}=await supabaseClient.from('producto_imagenes').insert({producto_id:product.id,url:publicData.publicUrl,orden:order,principal:img.principal});
   if(dbError){await supabaseClient.storage.from('productos').remove([path]);throw dbError} order++;
 }
}

async function saveProduct(e,id,currentSku){
 e.preventDefault();const f=new FormData(e.currentTarget),msg=document.getElementById('productMessage'),button=document.getElementById('saveProductButton');
 const franquiciaSelect=document.getElementById('franquiciaSelect'),personajeSelect=document.getElementById('personajeSelect'),fabricanteSelect=document.getElementById('fabricanteSelect');
 const franquiciaId=emptyNull(f.get('franquicia_id')),personajeId=emptyNull(f.get('personaje_id')),fabricanteId=emptyNull(f.get('fabricante_id'));
 const franquiciaNombre=franquiciaId?emptyNull(franquiciaSelect?.selectedOptions?.[0]?.dataset?.name):null;
 const personajeNombre=personajeId?emptyNull(personajeSelect?.selectedOptions?.[0]?.dataset?.name):null;
 const fabricanteNombre=fabricanteId?emptyNull(fabricanteSelect?.selectedOptions?.[0]?.dataset?.name):null;
 const obj={nombre:f.get('nombre').trim(),personaje_id:personajeId,personaje:personajeNombre,franquicia_id:franquiciaId,franquicia:franquiciaNombre,fabricante_id:fabricanteId,fabricante:fabricanteNombre,descripcion:emptyNull(f.get('descripcion')),precio:Number(f.get('precio')),precio_oferta:f.get('precio_oferta')===''?null:Number(f.get('precio_oferta')),estado:f.get('estado'),stock:Number(f.get('stock')),condicion_figura:emptyNull(f.get('condicion_figura')),condicion_caja:emptyNull(f.get('condicion_caja')),procedencia:emptyNull(f.get('procedencia')),entrega:emptyNull(f.get('entrega')),destacada:f.get('destacada')==='on',activo:f.get('activo')==='on'};
 const validationErrors=validateProductCommon(obj,obj.activo);if(validationErrors.length){showValidationErrors(e.currentTarget,validationErrors);return}
 button.disabled=true;button.dataset.originalText=button.textContent;button.textContent=id?'Guardando…':'Creando…';msg.textContent=id?'Guardando cambios…':'Creando figura…';msg.className='formMessage';
 try{
   let product;
   if(id){const {data,error}=await supabaseClient.from('productos').update(obj).eq('id',id).select().single();if(error)throw error;product=data||{id,sku:currentSku}}
   else {const {data,error}=await supabaseClient.from('productos').insert(obj).select().single();if(error)throw error;product=data}
   msg.textContent=productFormImages.length||existingProductImages.some(x=>x.removed)?'Procesando fotografías…':'Guardado correctamente…';
   await syncProductImages(product);adminProductFormDirty=false;cleanupNewImagePreviews(); renderAdminPanel();await loadAdminProducts();
 }catch(error){showProductMessage('No se pudo guardar: '+(error?.message||'Error inesperado.'),true);button.disabled=false;button.textContent=button.dataset.originalText||button.textContent}
}
function initDescriptionCounter(form){if(!form)return;form.querySelectorAll('[data-count-for]').forEach(counter=>{const name=counter.dataset.countFor,field=form.querySelector(`[name="${name}"]`);if(!field||!field.maxLength||field.maxLength<1)return;const sync=()=>{counter.textContent=`${field.value.length} / ${field.maxLength}`;counter.classList.toggle('nearLimit',field.value.length>=Math.ceil(field.maxLength*.85))};field.addEventListener('input',sync);sync()})}
function showProductMessage(text,error=false){
 const m=document.getElementById('productMessage');if(!m)return;
 const items=Array.isArray(text)?text:[text];
 if(error){m.className='formMessage error adminAlert';m.innerHTML=`<strong>Revisa la información antes de continuar</strong>${items.length>1?`<ul>${items.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`:`<span>${escapeHtml(items[0]||'')}</span>`}`}
 else{m.className='formMessage';m.textContent=items[0]||''}
}
async function deleteProduct(id){
 const p=adminProductsCache.find(x=>x.id===id); if(!confirm(`¿Eliminar ${p?.nombre||'este producto'}? Esta acción no se puede deshacer.`))return;
 const {data:imgs,error:imgReadError}=await supabaseClient.from('producto_imagenes').select('url').eq('producto_id',id);
 if(imgReadError){alert('No se pudieron consultar las fotografías: '+imgReadError.message);return}
 const paths=(imgs||[]).map(x=>storagePathFromPublicUrl(x.url)).filter(Boolean);
 if(paths.length){const {error:storageError}=await supabaseClient.storage.from('productos').remove(paths);if(storageError){alert('No se pudieron eliminar las fotografías de Storage: '+storageError.message);return}}
 const {error}=await supabaseClient.from('productos').delete().eq('id',id); if(error){alert('No se pudo eliminar: '+error.message);return} await loadAdminProducts();
}

// =========================================================
// V7.6.0 — Administración de “Más para tu colección”
// =========================================================
let adminAdditionalProductsCache=[];
async function loadAdminAdditionalProducts(){
 const box=document.getElementById('adminAdditionalProducts');if(!box)return;
 const {data,error}=await supabaseClient.from('productos_adicionales').select('*, tipos_producto(nombre), franquicias(nombre), personajes(nombre)').order('fecha_creacion',{ascending:false});
 if(error){box.innerHTML=`<p class="formMessage error">No fue posible cargar los productos adicionales: ${escapeHtml(error.message)}</p>`;return}
 adminAdditionalProductsCache=data||[];
 const ids=adminAdditionalProductsCache.map(p=>p.id);
 if(ids.length){
  const {data:images}=await supabaseClient.from('producto_adicional_imagenes').select('producto_id,url,principal,orden').in('producto_id',ids).order('orden');
  const byProduct={};(images||[]).forEach(img=>(byProduct[img.producto_id]??=[]).push(img));
  adminAdditionalProductsCache.forEach(p=>{const list=byProduct[p.id]||[];p.__adminImage=(list.find(x=>x.principal)||list[0])?.url||''});
 }
 renderAdminAdditionalProducts(adminAdditionalProductsCache);
}
function filterAdminAdditionalProducts(q){q=(q||'').toLowerCase().trim();renderAdminAdditionalProducts(adminAdditionalProductsCache.filter(p=>[p.nombre,p.sku,p.tipos_producto?.nombre,p.franquicias?.nombre,p.personajes?.nombre].some(v=>(v||'').toLowerCase().includes(q))))}
function renderAdminAdditionalProducts(items){
 const box=document.getElementById('adminAdditionalProducts');if(!box)return;
 if(!items.length){box.innerHTML='<div class="adminEmpty"><b>Aún no hay productos adicionales.</b><span>Usa “Nuevo producto” para registrar el primero de “Más para tu colección”.</span></div>';return}
 box.innerHTML=items.map(p=>`<article class="adminProduct"><div class="adminProductIdentity"><div class="adminProductThumb">${p.__adminImage?`<img src="${attr(p.__adminImage)}" alt="">`:'<span>界</span>'}</div><div class="adminProductCopy"><span class="adminSku">${escapeHtml(p.sku)}</span><h3>${escapeHtml(p.nombre)}</h3><p>${escapeHtml(p.tipos_producto?.nombre||'Sin tipo')} · ${escapeHtml(p.franquicias?.nombre||'Sin franquicia')}</p><div class="adminMobilePrice"><strong>${money(Number(p.precio_oferta??p.precio))}</strong>${p.precio_oferta!=null?`<small>${money(Number(p.precio))}</small>`:''}</div></div></div><div class="adminProductPrice"><strong>${money(Number(p.precio_oferta??p.precio))}</strong>${p.precio_oferta!=null?`<small>${money(Number(p.precio))}</small>`:''}</div><div class="adminBadges"><span class="adminState state-${p.estado}"><i></i>${escapeHtml(p.estado.replace('_',' '))}</span><span class="adminVisibility ${p.activo===false?'is-hidden':'is-visible'}"><i>${p.activo===false?'○':'◉'}</i>${p.activo===false?'Oculto':'Visible'}</span></div><div class="adminRowActions"><button type="button" class="adminActionEdit" data-additional-edit="${p.id}">Editar</button><button type="button" class="adminActionDuplicate" data-additional-duplicate="${p.id}">Duplicar</button><button type="button" class="${p.activo===false?'adminActionShow':'adminActionHide'}" data-additional-toggle-visible="${p.id}">${p.activo===false?'Mostrar':'Ocultar'}</button><button type="button" class="danger adminActionDelete" data-additional-delete="${p.id}">Eliminar</button></div></article>`).join('');
 box.querySelectorAll('[data-additional-edit]').forEach(b=>b.onclick=()=>openAdditionalProductForm(adminAdditionalProductsCache.find(p=>p.id===b.dataset.additionalEdit)));
 box.querySelectorAll('[data-additional-duplicate]').forEach(b=>b.onclick=()=>openAdditionalProductForm(adminAdditionalProductsCache.find(p=>p.id===b.dataset.additionalDuplicate),true));
 box.querySelectorAll('[data-additional-toggle-visible]').forEach(b=>b.onclick=()=>toggleAdditionalProductVisibility(b.dataset.additionalToggleVisible));
 box.querySelectorAll('[data-additional-delete]').forEach(b=>b.onclick=()=>deleteAdditionalProduct(b.dataset.additionalDelete));
}
async function toggleAdditionalProductVisibility(id){
 const p=adminAdditionalProductsCache.find(x=>x.id===id);if(!p)return;const next=p.activo===false;
 if(!next&&!confirm(`¿Ocultar ${p.nombre}? Dejará de mostrarse en “Más para tu colección”.`))return;
 const {error}=await supabaseClient.from('productos_adicionales').update({activo:next}).eq('id',id);if(error){alert('No se pudo cambiar la visibilidad: '+error.message);return}await loadAdminAdditionalProducts();
}
function openAdditionalProductForm(p=null,duplicating=false){
 const editing=!!p&&!duplicating;productFormImages=[];existingProductImages=[];
 document.getElementById('adminContent').innerHTML=`<div class="adminFormHead"><button id="backAdmin" class="backBtn" type="button">‹ Volver a Más para tu colección</button><span class="kicker">${editing?'EDITAR':duplicating?'DUPLICAR':'NUEVO'} PRODUCTO</span><h1>${editing?'Editar producto':duplicating?'Duplicar producto':'Registrar producto'}</h1>${duplicating?'<p class="duplicateNotice">Se copiarán los datos. El SKU será nuevo y las fotografías deberán agregarse nuevamente.</p>':''}</div><form id="additionalProductForm" class="productForm" novalidate>
 <section class="formSection"><div class="formSectionTitle"><span>01</span><div><h2>Información</h2><p>Datos principales del producto adicional.</p></div></div><div class="formGrid">
 <label>SKU<div class="readonlyField">${editing?escapeHtml(p.sku):'Se generará automáticamente'}</div><small class="fieldHint">${editing?'Identificador interno del producto.':'Supabase asignará el siguiente código ANX-XXXXX al guardar.'}</small></label>
 <div class="catalogField"><span>Tipo de producto <span class="required">*</span></span><div class="catalogPicker"><div class="searchableSelect" id="tipoProductoCombo"><input class="searchableSelectInput" id="tipoProductoSearch" type="text" autocomplete="off" placeholder="Buscar tipo…"><button class="searchableSelectArrow" type="button" tabindex="-1">⌄</button><div class="searchableSelectMenu"></div><select name="tipo_producto_id" id="tipoProductoSelect" class="catalogNativeSelect" required><option value="">Cargando tipos…</option></select></div><button class="catalogAdd" id="addTipoProducto" type="button">＋ Nuevo</button></div><small class="fieldHint">Amigurumi, peluche, llavero, taza u otro tipo administrable.</small></div>
 <label class="full"><span class="fieldLabel">Nombre <span class="required">*</span></span><input name="nombre" maxlength="150" required value="${attr(p?.nombre||'')}"><small class="fieldHint charCount" data-count-for="nombre">0 / 150</small></label>
 <div class="catalogField"><span>Franquicia</span><div class="catalogPicker"><div class="searchableSelect" id="additionalFranquiciaCombo"><input class="searchableSelectInput" id="additionalFranquiciaSearch" type="text" autocomplete="off" placeholder="Buscar franquicia…"><button class="searchableSelectArrow" type="button" tabindex="-1">⌄</button><div class="searchableSelectMenu"></div><select name="franquicia_id" id="additionalFranquiciaSelect" class="catalogNativeSelect"><option value="">Cargando franquicias…</option></select></div><button class="catalogAdd" id="addAdditionalFranquicia" type="button">＋ Nueva</button></div><small class="fieldHint">Opcional.</small></div>
 <div class="catalogField"><span>Personaje</span><div class="catalogPicker"><div class="searchableSelect" id="additionalPersonajeCombo"><input class="searchableSelectInput" id="additionalPersonajeSearch" type="text" autocomplete="off" placeholder="Selecciona primero una franquicia…" disabled><button class="searchableSelectArrow" type="button" tabindex="-1">⌄</button><div class="searchableSelectMenu"></div><select name="personaje_id" id="additionalPersonajeSelect" class="catalogNativeSelect" disabled><option value="">Selecciona primero una franquicia…</option></select></div><button class="catalogAdd" id="addAdditionalPersonaje" type="button" disabled>＋ Nuevo</button></div><small class="fieldHint">Opcional y dependiente de la franquicia.</small></div>
 <label class="full">Descripción<textarea name="descripcion" maxlength="2000" rows="5">${escapeHtml(p?.descripcion||'')}</textarea><small class="fieldHint charCount" data-count-for="descripcion">0 / 2000</small></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>02</span><div><h2>Precio y disponibilidad</h2><p>Precio, existencia y estado comercial.</p></div></div><div class="formGrid"><label><span class="fieldLabel">Precio <span class="required">*</span></span><div class="moneyInput"><span>$</span><input name="precio" type="number" min="0.01" step="0.01" required value="${attr(p?.precio??'')}"></div></label><label>Precio de oferta<div class="moneyInput"><span>$</span><input name="precio_oferta" type="number" min="0.01" step="0.01" value="${attr(p?.precio_oferta??'')}"></div></label><label>Estado<select name="estado" class="adminStatusSelect"><option value="disponible">Disponible</option><option value="apartada">Apartada</option><option value="vendida">Vendida</option><option value="proximamente">Próximamente</option><option value="sobre_pedido">Sobre pedido</option></select></label><label>Stock<input name="stock" type="number" min="0" step="1" required value="${attr(p?.stock??1)}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>03</span><div><h2>Elaboración</h2><p>Opciones útiles especialmente para productos artesanales.</p></div></div><div class="formGrid"><label class="full">Tiempo de elaboración<input name="tiempo_elaboracion" maxlength="100" placeholder="Ej. 3 a 5 días" value="${attr(p?.tiempo_elaboracion||'')}"><small class="fieldHint charCount" data-count-for="tiempo_elaboracion">0 / 100</small><small class="fieldHint">Déjalo vacío cuando no aplique.</small></label></div><div class="inlineChecks"><label><input name="hecho_mano" type="checkbox" ${p?.hecho_mano?'checked':''}> Hecho a mano</label><label><input name="sobre_pedido" type="checkbox" ${p?.sobre_pedido?'checked':''}> Acepta pedidos</label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>04</span><div><h2>Fotografías</h2><p>Agrega varias imágenes y elige la principal.</p></div></div><div class="photoUploader"><input id="additionalProductPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><button id="selectAdditionalPhotos" class="uploadButton" type="button"><span>＋</span><b>Agregar fotografías</b><small>JPG, PNG o WebP · se optimizan antes de subir</small></button><div id="photoPreview" class="photoPreview"></div></div></section>
 <div class="formChecks"><label><input name="destacado" type="checkbox" ${p?.destacado?'checked':''}> Producto destacado</label><label><input name="activo" type="checkbox" ${p?.activo===false?'':'checked'}> Visible en la tienda</label></div><div class="formActions"><button id="saveAdditionalProductButton" class="primary" type="submit">${editing?'Guardar cambios':duplicating?'Crear copia':'Crear producto'}</button></div><p id="productMessage" class="formMessage"></p></form>`;
 document.querySelector('[name="estado"]').value=p?.estado||'disponible'; initAdminStatusSelect(document.querySelector('[name="estado"]'));
 document.getElementById('backAdmin').onclick=()=>{if(!confirmLeaveProductForm())return;adminProductFormDirty=false;cleanupNewImagePreviews();renderAdminPanel();showAdminProductsSection('adicionales')};
 document.getElementById('selectAdditionalPhotos').onclick=()=>document.getElementById('additionalProductPhotos').click();document.getElementById('additionalProductPhotos').onchange=handlePhotoSelection;
 document.getElementById('additionalProductForm').onsubmit=e=>saveAdditionalProduct(e,editing?p?.id:null,editing?p?.sku:null);bindProductFormDirtyTracking(document.getElementById('additionalProductForm'));initDescriptionCounter(document.getElementById('additionalProductForm'));initPreventiveProductValidation(document.getElementById('additionalProductForm'));initCommercialStateStock(document.getElementById('additionalProductForm'));
 document.getElementById('addTipoProducto').onclick=()=>openCatalogModal('tipos_producto','tipoProductoSelect','Nuevo tipo de producto');
 document.getElementById('addAdditionalFranquicia').onclick=()=>openCatalogModal('franquicias','additionalFranquiciaSelect','Nueva franquicia',null,async()=>loadAdditionalCharacters(null));
 document.getElementById('addAdditionalPersonaje').onclick=()=>{const id=document.getElementById('additionalFranquiciaSelect')?.value;if(id)openCatalogModal('personajes','additionalPersonajeSelect','Nuevo personaje',{franquicia_id:id})};
 document.getElementById('additionalFranquiciaSelect').onchange=()=>{clearCharacterSelectionForFranchiseChange('additionalPersonajeSelect','addAdditionalPersonaje');loadAdditionalCharacters(null);};
 initCatalogCombobox('tipoProductoSelect','tipoProductoSearch');initCatalogCombobox('additionalFranquiciaSelect','additionalFranquiciaSearch');initCatalogCombobox('additionalPersonajeSelect','additionalPersonajeSearch');
 loadAdditionalProductCatalogs(p);if(editing)loadExistingAdditionalProductImages(p.id);
}
async function loadAdditionalProductCatalogs(product=null){
 const [tp,fr]=await Promise.all([supabaseClient.from('tipos_producto').select('id,nombre').eq('activo',true).order('nombre'),supabaseClient.from('franquicias').select('id,nombre').order('nombre')]);
 if(tp.error){showProductMessage('No fue posible cargar los tipos: '+tp.error.message,true);return}if(fr.error){showProductMessage('No fue posible cargar las franquicias: '+fr.error.message,true);return}
 fillCatalogSelect('tipoProductoSelect',tp.data||[],product?.tipo_producto_id,null,'Selecciona un tipo');fillCatalogSelect('additionalFranquiciaSelect',fr.data||[],product?.franquicia_id,product?.franquicias?.nombre,'Sin franquicia');await loadAdditionalCharacters(product);
}
async function loadAdditionalCharacters(product=null){
 const franchiseId=document.getElementById('additionalFranquiciaSelect')?.value||'',select=document.getElementById('additionalPersonajeSelect'),add=document.getElementById('addAdditionalPersonaje');if(!select||!add)return;
 if(!franchiseId){select.innerHTML='<option value="">Selecciona primero una franquicia…</option>';select.disabled=true;add.disabled=true;syncCatalogCombobox('additionalPersonajeSelect');return}
 select.disabled=true;add.disabled=true;select.innerHTML='<option value="">Cargando personajes…</option>';
 const {data,error}=await supabaseClient.from('personajes').select('id,nombre').eq('franquicia_id',franchiseId).order('nombre');if(error){showProductMessage('No fue posible cargar los personajes: '+error.message,true);return}
 fillCatalogSelect('additionalPersonajeSelect',data||[],product?.personaje_id,product?.personajes?.nombre,'Sin personaje');select.disabled=false;add.disabled=false;syncCatalogCombobox('additionalPersonajeSelect');
}
async function loadExistingAdditionalProductImages(productId){
 const {data,error}=await supabaseClient.from('producto_adicional_imagenes').select('*').eq('producto_id',productId).order('orden');if(error){showProductMessage('No fue posible cargar las fotografías existentes: '+error.message,true);return}existingProductImages=(data||[]).map(x=>({...x,removed:false}));renderPhotoPreview();
}
async function syncAdditionalProductImages(product){
 const removed=existingProductImages.filter(x=>x.removed);for(const img of removed){const path=storagePathFromPublicUrl(img.url);if(path)await supabaseClient.storage.from('productos').remove([path]);await supabaseClient.from('producto_adicional_imagenes').delete().eq('id',img.id)}
 const kept=existingProductImages.filter(x=>!x.removed);for(let i=0;i<kept.length;i++)await supabaseClient.from('producto_adicional_imagenes').update({orden:i,principal:kept[i].principal}).eq('id',kept[i].id);
 let order=kept.length;for(const img of productFormImages){const blob=await compressImage(img.file),path=`adicionales/${product.sku}/${String(order+1).padStart(2,'0')}-${crypto.randomUUID()}.webp`;const {error:uploadError}=await supabaseClient.storage.from('productos').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'3600'});if(uploadError)throw uploadError;const {data:publicData}=supabaseClient.storage.from('productos').getPublicUrl(path);const {error:dbError}=await supabaseClient.from('producto_adicional_imagenes').insert({producto_id:product.id,url:publicData.publicUrl,orden:order,principal:img.principal});if(dbError){await supabaseClient.storage.from('productos').remove([path]);throw dbError}order++}
}
async function saveAdditionalProduct(e,id,currentSku){
 e.preventDefault();const f=new FormData(e.currentTarget),msg=document.getElementById('productMessage'),button=document.getElementById('saveAdditionalProductButton');const obj={tipo_producto_id:emptyNull(f.get('tipo_producto_id')),nombre:f.get('nombre').trim(),franquicia_id:emptyNull(f.get('franquicia_id')),personaje_id:emptyNull(f.get('personaje_id')),descripcion:emptyNull(f.get('descripcion')),precio:Number(f.get('precio')),precio_oferta:f.get('precio_oferta')===''?null:Number(f.get('precio_oferta')),estado:f.get('estado'),stock:Number(f.get('stock')),hecho_mano:f.get('hecho_mano')==='on',sobre_pedido:f.get('sobre_pedido')==='on',tiempo_elaboracion:emptyNull(f.get('tiempo_elaboracion')),destacado:f.get('destacado')==='on',activo:f.get('activo')==='on'};
 const validationErrors=validateProductCommon(obj,obj.activo);if(!obj.tipo_producto_id)validationErrors.unshift({field:'tipo_producto_id',message:'Selecciona un tipo de producto.'});if(validationErrors.length){showValidationErrors(e.currentTarget,validationErrors);return}
 button.disabled=true;button.dataset.originalText=button.textContent;button.textContent=id?'Guardando…':'Creando…';msg.textContent=id?'Guardando cambios…':'Creando producto…';msg.className='formMessage';try{let product;if(id){const {data,error}=await supabaseClient.from('productos_adicionales').update(obj).eq('id',id).select().single();if(error)throw error;product=data||{id,sku:currentSku}}else{const {data,error}=await supabaseClient.from('productos_adicionales').insert(obj).select().single();if(error)throw error;product=data}msg.textContent='Procesando fotografías…';await syncAdditionalProductImages(product);adminProductFormDirty=false;cleanupNewImagePreviews();renderAdminPanel();showAdminProductsSection('adicionales')}catch(error){showProductMessage('No se pudo guardar: '+(error?.message||'Error inesperado.'),true);button.disabled=false;button.textContent=button.dataset.originalText||button.textContent}
}
async function deleteAdditionalProduct(id){
 const p=adminAdditionalProductsCache.find(x=>x.id===id);if(!confirm(`¿Eliminar ${p?.nombre||'este producto'}? Esta acción no se puede deshacer.`))return;const {data:imgs,error:readError}=await supabaseClient.from('producto_adicional_imagenes').select('url').eq('producto_id',id);if(readError){alert('No se pudieron consultar las fotografías: '+readError.message);return}const paths=(imgs||[]).map(x=>storagePathFromPublicUrl(x.url)).filter(Boolean);if(paths.length){const {error}=await supabaseClient.storage.from('productos').remove(paths);if(error){alert('No se pudieron eliminar las fotografías de Storage: '+error.message);return}}const {error}=await supabaseClient.from('productos_adicionales').delete().eq('id',id);if(error){alert('No se pudo eliminar: '+error.message);return}await loadAdminAdditionalProducts();
}

function emptyNull(v){v=(v??'').toString().trim();return v===''?null:v}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function attr(v){return escapeHtml(v)}

// Acceso discreto: /#admin. No es una medida de seguridad; RLS protege los datos.
if(location.hash==='#admin') setTimeout(openAdmin,0);
window.addEventListener('hashchange',()=>{if(location.hash==='#admin')openAdmin()});
