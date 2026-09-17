const SUPABASE_URL = 'https://uobqjdvaovqbqthnmvpm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5L3IfGy74SfEDB0YNnH9Fw_n3HjwND7';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

let products = [];
let siteConfig = null;
let siteLogoFile = null;
let siteHeroFile = null;
let publicFranchiseFilter = 'Todas';
let publicSearchQuery = ''; 
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
const icon = (name) => ({search:'⌕',menu:'☰',arrow:'›',fire:'🔥',truck:'✈',shield:'✓',chat:'◉',sparkle:'✦'})[name] || '';
const statusLabel = s => ({disponible:'Disponible',apartada:'Apartada',vendida:'Vendida',proximamente:'Próximamente'})[s] || s || '';

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

function productAction(p){
  const url=`${location.origin}${location.pathname}#figura=${encodeURIComponent(p.sku)}`;
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
  return `<article class="card"><div class="photo">${photoMarkup(p)}${pct?`<span class="discount">-${pct}%</span>`:''}<span class="status ${p.status==='apartada'?'hold':''}">${statusLabel(p.status)}</span></div><div class="cardBody"><p class="series">${escapeHtml(p.series)}</p><h3>${escapeHtml(p.name)}</h3><div class="prices">${p.sale?`<span class="old">${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><button class="details" data-product="${attr(p.sku)}" type="button">Ver detalles <span>${icon('arrow')}</span></button><a class="whatsapp ${action.cls}" href="${attr(wa)}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a></div></article>`;
}

function renderStoreShell(){
 document.getElementById('app').innerHTML=`
<header><a class="brand" href="#"><span class="brandIcon"><span class="mark brandMark">界</span><img class="brandLogo" id="homeLogo" alt="Logo Anime no Sekai" hidden></span><span class="brandText">ANIME NO <b>SEKAI</b><small>FIGURAS & COLECCIONABLES</small></span></a><nav><a href="#catalogo">Figuras</a><a href="#ofertas">Ofertas</a><a href="#proximamente">Próximamente</a></nav><div class="headActions"><button id="searchToggle" aria-label="Buscar" aria-expanded="false">${icon('search')}</button><button class="menu" id="mobileMenuButton" aria-label="Abrir menú" aria-expanded="false">${icon('menu')}</button></div><div class="headerSearch" id="headerSearch" aria-hidden="true"><span class="searchIcon">${icon('search')}</span><input id="publicSearchInput" type="search" autocomplete="off" placeholder="Buscar figura, personaje, anime, SKU o fabricante…" aria-label="Buscar en el catálogo"><button id="searchClose" type="button" aria-label="Cerrar búsqueda">×</button></div><div class="mobileNav" id="mobileNav" aria-hidden="true"><a href="#catalogo">Figuras</a><a href="#ofertas">Ofertas</a><a href="#proximamente">Próximamente</a></div></header>
<main><section class="hero"><div class="heroContent"><span class="eyebrow">${icon('sparkle')} <span id="homePortadaEtiqueta">DIRECTO DESDE JAPÓN</span></span><h1 id="homePortadaTitulo">Tu mundo de<br><em>figuras y coleccionables.</em></h1><p id="homePortadaDescripcion">Encuentra esa pieza que falta en tu colección. Figuras seleccionadas, disponibilidad real y atención directa por WhatsApp.</p><div class="heroBtns"><a href="#catalogo" class="primary">Explorar figuras ${icon('arrow')}</a><a href="#ofertas" class="secondary">${icon('fire')} Ver ofertas</a></div></div><div class="japan">日本<br><span>の世界</span></div></section>
<section class="benefits"><div><span class="featureIcon">${icon('truck')}</span><span><b id="homeBeneficio1Titulo">Importadas de Japón</b><small id="homeBeneficio1Descripcion">Piezas seleccionadas</small></span></div><div><span class="featureIcon">${icon('shield')}</span><span><b id="homeBeneficio2Titulo">Compra con confianza</b><small id="homeBeneficio2Descripcion">Atención directa</small></span></div><div><span class="featureIcon">${icon('chat')}</span><span><b id="homeBeneficio3Titulo">Apártala por WhatsApp</b><small id="homeBeneficio3Descripcion">Rápido y sencillo</small></span></div></section>
<section id="ofertas" class="section"><div class="sectionHead"><div><span class="kicker">🔥 PRECIOS ESPECIALES</span><h2 id="homeTituloOfertas">Ofertas del Sekai</h2></div><a href="#catalogo">Ver todas ${icon('arrow')}</a></div><div id="offersGrid" class="grid"><p class="catalogMessage">Cargando ofertas…</p></div></section>
<section id="catalogo" class="section"><div class="sectionHead"><div><span class="kicker">COLECCIÓN</span><h2 id="homeTituloFiguras">Figuras destacadas</h2></div></div><div id="catalogChips" class="chips"></div><div id="catalogGrid" class="grid"><p class="catalogMessage">Cargando catálogo…</p></div></section>
<section id="proximamente" class="arrival"><div><span class="kicker">PRÓXIMAMENTE 🇯🇵</span><h2 id="homeTituloProximamente">Próximamente</h2><p>Descubre próximas importaciones y pregunta por disponibilidad antes de que lleguen.</p></div><a class="primary" href="https://wa.me/529994739090" target="_blank" rel="noopener">Preguntar por WhatsApp</a></section></main>
<footer><div class="brand"><span class="brandIcon"><span class="mark brandMark">界</span><img class="brandLogo footerLogo" id="footerLogo" alt="Logo Anime no Sekai" hidden></span><span class="brandText">ANIME NO <b>SEKAI</b></span></div><p>Tu mundo de figuras y coleccionables.</p><small>© 2026 Anime no Sekai</small></footer>`;
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
 if(hero){
   if(c?.portada_url){hero.style.setProperty('--hero-image',`url('${String(c.portada_url).replace(/[\']/g,'')}')`);hero.style.setProperty('--hero-x',`${Number.isFinite(Number(c.portada_posicion_x))?Number(c.portada_posicion_x):50}%`);hero.style.setProperty('--hero-y',`${Number.isFinite(Number(c.portada_posicion_y))?Number(c.portada_posicion_y):50}%`);hero.classList.add('hasHeroImage')}
   else {hero.style.removeProperty('--hero-image');hero.style.removeProperty('--hero-x');hero.style.removeProperty('--hero-y');hero.classList.remove('hasHeroImage')}
 }
}

async function loadPublicCatalog(){
 const {data,error}=await supabaseClient.from('productos').select('*, producto_imagenes(*)').eq('activo',true).order('destacada',{ascending:false}).order('fecha_creacion',{ascending:false});
 if(error){
   document.getElementById('catalogGrid').innerHTML='<p class="catalogMessage error">No fue posible cargar el catálogo en este momento.</p>';
   document.getElementById('offersGrid').innerHTML='<p class="catalogMessage error">No fue posible cargar las ofertas.</p>';
   console.error(error); return;
 }
 products=(data||[]).map(mapProduct);
 renderPublicProducts();
 const skuFromHash=location.hash.startsWith('#figura=')?decodeURIComponent(location.hash.slice(8)):null;
 if(skuFromHash) openDetail(skuFromHash,false);
}
function normalizeSearch(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim()}
function productMatchesSearch(p,query){
 if(!query)return true;
 const haystack=[p.name,p.sku,p.character,p.series,p.manufacturer].map(normalizeSearch).join(' ');
 return query.split(/\s+/).every(term=>haystack.includes(term));
}
function renderPublicProducts(filter=publicFranchiseFilter){
 publicFranchiseFilter=filter||'Todas';
 const query=normalizeSearch(publicSearchQuery);
 const searched=products.filter(p=>productMatchesSearch(p,query));
 const offers=searched.filter(p=>p.sale!=null);
 document.getElementById('offersGrid').innerHTML=offers.length?offers.map(productCard).join(''):`<p class="catalogMessage">${query?'No encontramos ofertas que coincidan con tu búsqueda.':'Por ahora no hay ofertas publicadas.'}</p>`;
 const franchises=[...new Set(products.map(p=>p.series).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
 if(publicFranchiseFilter!=='Todas'&&!franchises.includes(publicFranchiseFilter))publicFranchiseFilter='Todas';
 const chips=document.getElementById('catalogChips');
 chips.innerHTML=['Todas',...franchises].map(x=>`<button class="${x===publicFranchiseFilter?'active':''}" data-franchise="${attr(x)}">${escapeHtml(x)}</button>`).join('');
 chips.querySelectorAll('[data-franchise]').forEach(b=>b.onclick=()=>renderPublicProducts(b.dataset.franchise));
 const list=publicFranchiseFilter==='Todas'?searched:searched.filter(p=>p.series===publicFranchiseFilter);
 document.getElementById('catalogGrid').innerHTML=list.length?list.map(productCard).join(''):`<p class="catalogMessage">${query?'No encontramos figuras que coincidan con tu búsqueda.':'No hay figuras publicadas en esta categoría.'}</p>`;
}

function openDetail(sku,push=true){
 const p=products.find(x=>x.sku===sku); if(!p)return;
 document.getElementById('detailView')?.remove();
 const pct=p.sale?Math.round((1-p.sale/p.price)*100):null, action=productAction(p), wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
 const gallery=p.images.length?p.images.map(x=>x.url):(p.img?[p.img]:[]);
 const principalUrl=p.images.find(x=>x.principal)?.url||p.img||gallery[0]||'';
 let currentIndex=Math.max(0,gallery.indexOf(principalUrl));
 const main=gallery[currentIndex]||'';
 const detail=document.createElement('section'); detail.className='detailView'; detail.id='detailView';
 detail.innerHTML=`<div class="detailTop"><button class="backBtn" type="button">‹ Volver al catálogo</button><button class="detailClose" type="button" aria-label="Cerrar">×</button></div><div class="detailShell"><div class="detailGallery"><div class="detailMainPhoto">${main?`<img id="detailMainImage" src="${attr(main)}" alt="${attr(p.name)}">${gallery.length>1?`<button class="galleryArrow galleryPrev" type="button" aria-label="Fotografía anterior">‹</button><button class="galleryArrow galleryNext" type="button" aria-label="Fotografía siguiente">›</button>`:''}<span class="galleryCounter" id="galleryCounter">${currentIndex+1} / ${gallery.length}</span>`:`<div class="photoPlaceholder large"><span>界</span><small>Fotografía próximamente</small></div>`}</div>${gallery.length?`<div class="detailThumbs">${gallery.map((img,i)=>`<button class="detailThumb ${i===currentIndex?'active':''}" type="button" data-index="${i}" data-img="${attr(img)}"><img src="${attr(img)}" alt="Vista ${i+1} de ${attr(p.name)}"></button>`).join('')}</div>`:''}</div><div class="detailInfo"><p class="series">${escapeHtml(p.series)}</p><h1>${escapeHtml(p.name)}</h1><p class="detailSku">${escapeHtml(p.sku)}</p><div class="detailBadges">${pct?`<span class="detailBadge sale">-${pct}%</span>`:''}<span class="detailBadge ${p.status==='apartada'?'hold':''}">${statusLabel(p.status)}</span></div><div class="detailPrice">${p.sale?`<span class="old">Antes ${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><p>${escapeHtml(p.description)}</p><div class="detailMeta"><div><small>Personaje</small><b>${escapeHtml(p.character)}</b></div><div><small>Franquicia</small><b>${escapeHtml(p.series)}</b></div><div><small>Fabricante</small><b>${escapeHtml(p.manufacturer)}</b></div><div><small>Condición figura</small><b>${escapeHtml(p.figureCondition)}</b></div><div><small>Condición caja</small><b>${escapeHtml(p.boxCondition)}</b></div><div><small>Procedencia</small><b>${escapeHtml(p.origin)}</b></div><div><small>Stock</small><b>${p.stock}</b></div><div><small>Entrega</small><b>${escapeHtml(p.delivery)}</b></div></div><div class="detailActions"><a class="whatsapp ${action.cls}" href="${attr(wa)}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a><p class="detailNote">La compra y entrega se acuerdan directamente por WhatsApp.</p></div></div></div>`;
 document.body.appendChild(detail);document.body.classList.add('detail-open');
 detail.querySelectorAll('.backBtn,.detailClose').forEach(b=>b.addEventListener('click',closeDetail));
 const showImage=index=>{if(!gallery.length)return;currentIndex=(index+gallery.length)%gallery.length;const m=detail.querySelector('#detailMainImage');if(m)m.src=gallery[currentIndex];detail.querySelectorAll('.detailThumb').forEach((x,i)=>x.classList.toggle('active',i===currentIndex));const c=detail.querySelector('#galleryCounter');if(c)c.textContent=`${currentIndex+1} / ${gallery.length}`};
 detail.querySelectorAll('.detailThumb').forEach(t=>t.addEventListener('click',()=>showImage(Number(t.dataset.index))));
 detail.querySelector('.galleryPrev')?.addEventListener('click',()=>showImage(currentIndex-1));
 detail.querySelector('.galleryNext')?.addEventListener('click',()=>showImage(currentIndex+1));
 if(push) history.pushState({detail:sku},'',`#figura=${encodeURIComponent(sku)}`);
}
function closeDetail(){document.getElementById('detailView')?.remove();document.body.classList.remove('detail-open');if(location.hash.startsWith('#figura='))history.replaceState({},'',location.pathname+location.search+'#catalogo')}
document.addEventListener('click',e=>{const btn=e.target.closest('.details[data-product]');if(btn)openDetail(btn.dataset.product)});
window.addEventListener('popstate',()=>{if(!location.hash.startsWith('#figura=')){document.getElementById('detailView')?.remove();document.body.classList.remove('detail-open')}});

renderStoreShell();
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
 if(clear){publicSearchQuery='';if(publicSearchInput)publicSearchInput.value='';renderPublicProducts();}
}
searchToggle?.addEventListener('click',()=>headerSearch?.classList.contains('open')?closePublicSearch(false):openPublicSearch());
searchClose?.addEventListener('click',()=>closePublicSearch(true));
publicSearchInput?.addEventListener('input',e=>{publicSearchQuery=e.target.value;renderPublicProducts();document.getElementById('catalogo')?.scrollIntoView({behavior:'smooth',block:'start'});});
publicSearchInput?.addEventListener('keydown',e=>{if(e.key==='Escape')closePublicSearch(true)});

loadSiteConfig();
loadPublicCatalog();

// =========================================================
// V4 — Panel administrativo conectado a Supabase
// =========================================================
function adminMarkup(){
 return `<section class="adminView" id="adminView">
  <div class="adminTop"><a class="brand adminBrand" href="#"><span class="brandIcon"><span class="mark brandMark">界</span><img class="brandLogo" id="adminLogo" alt="Logo Anime no Sekai" hidden></span><span class="brandText">ANIME NO <b>SEKAI</b><small>ADMINISTRACIÓN</small></span><span class="adminBadge">ADMIN</span></a><button id="adminExit" class="detailClose" type="button">×</button></div>
  <div class="adminShell"><div id="adminContent"><div class="adminLogin"><span class="kicker">ACCESO PRIVADO</span><h1>Panel administrativo</h1><p>Inicia sesión para administrar el catálogo de Anime no Sekai.</p><form id="loginForm"><label>Correo<input id="loginEmail" type="email" autocomplete="username" required></label><label>Contraseña<input id="loginPassword" type="password" autocomplete="current-password" required></label><button class="primary adminPrimary" type="submit">Iniciar sesión</button><p id="loginMessage" class="formMessage"></p></form></div></div></div>
 </section>`;
}
async function openAdmin(){
 if(document.getElementById('adminView')) return;
 document.body.insertAdjacentHTML('beforeend',adminMarkup());
 document.body.classList.add('detail-open');
 if(siteConfig) applySiteVisuals(siteConfig);
 document.getElementById('adminExit').addEventListener('click',closeAdmin);
 document.getElementById('loginForm').addEventListener('submit',loginAdmin);
 const {data:{session}}=await supabaseClient.auth.getSession();
 if(session) await verifyAdminAndRender();
}
function closeAdmin(){document.getElementById('adminView')?.remove();document.body.classList.remove('detail-open');if(location.hash==='#admin')history.replaceState({},'',location.pathname+location.search+'#catalogo')}
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
 renderAdminPanel();
}
function renderAdminPanel(){
 document.getElementById('adminContent').innerHTML=`<div class="adminNav"><button class="active" id="adminProductsTab" type="button">Productos</button><button id="adminContentTab" type="button">Contenido del sitio</button></div><div id="adminPanelBody"></div>`;
 document.getElementById('adminProductsTab').onclick=()=>showAdminProductsSection();
 document.getElementById('adminContentTab').onclick=()=>showSiteContentForm();
 showAdminProductsSection();
}
function setAdminTab(activeId){
 document.querySelectorAll('.adminNav button').forEach(b=>b.classList.toggle('active',b.id===activeId));
}
function showAdminProductsSection(){
 setAdminTab('adminProductsTab');
 document.getElementById('adminPanelBody').innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Productos</h1><p>Administra las figuras publicadas en tu catálogo.</p></div><div class="adminHeaderActions"><button id="newProduct" class="primary" type="button">+ Nueva figura</button><button id="logoutAdmin" class="secondary" type="button">Cerrar sesión</button></div></div><div class="adminToolbar"><input id="adminSearch" type="search" placeholder="Buscar por nombre, SKU o franquicia…"></div><div id="adminProducts" class="adminProducts"><p class="adminLoading">Cargando productos…</p></div>`;
 document.getElementById('logoutAdmin').onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin()};
 document.getElementById('newProduct').onclick=()=>openProductForm();
 document.getElementById('adminSearch').addEventListener('input',e=>filterAdminProducts(e.target.value));
 loadAdminProducts();
}
async function showSiteContentForm(){
 setAdminTab('adminContentTab');
 const body=document.getElementById('adminPanelBody');
 body.innerHTML='<p class="adminLoading">Cargando contenido del sitio…</p>';
 const {data,error}=await supabaseClient.from('configuracion_sitio').select('*').eq('id',1).single();
 if(error){body.innerHTML=`<p class="formMessage error">No fue posible cargar la configuración: ${escapeHtml(error.message)}</p>`;return}
 body.innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Contenido del sitio</h1><p>Edita únicamente los textos comerciales principales del catálogo.</p></div><div class="adminHeaderActions"><button id="logoutAdmin" class="secondary" type="button">Cerrar sesión</button></div></div>
 <form id="siteContentForm" class="productForm siteContentForm">
 <section class="formSection"><div class="formSectionTitle"><span>01</span><div><h2>Portada</h2><p>Mensaje principal que recibe el visitante.</p></div></div><div class="formGrid"><label>Etiqueta<input name="portada_etiqueta" maxlength="100" required value="${attr(data.portada_etiqueta)}"></label><label class="full">Título<input name="portada_titulo" maxlength="200" required value="${attr(data.portada_titulo)}"></label><label class="full">Descripción<textarea name="portada_descripcion" maxlength="500" rows="4" required>${escapeHtml(data.portada_descripcion)}</textarea></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>02</span><div><h2>Beneficios</h2><p>Los tres mensajes breves debajo de la portada.</p></div></div><div class="formGrid"><label>Beneficio 1<input name="beneficio_1_titulo" maxlength="100" required value="${attr(data.beneficio_1_titulo)}"></label><label>Descripción 1<input name="beneficio_1_descripcion" maxlength="150" required value="${attr(data.beneficio_1_descripcion)}"></label><label>Beneficio 2<input name="beneficio_2_titulo" maxlength="100" required value="${attr(data.beneficio_2_titulo)}"></label><label>Descripción 2<input name="beneficio_2_descripcion" maxlength="150" required value="${attr(data.beneficio_2_descripcion)}"></label><label>Beneficio 3<input name="beneficio_3_titulo" maxlength="100" required value="${attr(data.beneficio_3_titulo)}"></label><label>Descripción 3<input name="beneficio_3_descripcion" maxlength="150" required value="${attr(data.beneficio_3_descripcion)}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>03</span><div><h2>Secciones</h2><p>Títulos principales del catálogo.</p></div></div><div class="formGrid"><label>Título de ofertas<input name="titulo_ofertas" maxlength="100" required value="${attr(data.titulo_ofertas)}"></label><label>Título de figuras<input name="titulo_figuras" maxlength="100" required value="${attr(data.titulo_figuras)}"></label><label>Título de próximamente<input name="titulo_proximamente" maxlength="100" required value="${attr(data.titulo_proximamente)}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>04</span><div><h2>Identidad visual</h2><p>Logo y fotografía de portada. El sitio aplica automáticamente el tratamiento negro y violeta.</p></div></div><div class="siteVisualGrid">
 <div class="siteVisualField"><div class="siteVisualLabel"><b>Logo</b><small>PNG, JPG o WebP · recomendado con fondo transparente</small></div><div class="siteVisualPreview logoPreview" id="siteLogoPreview">${data.logo_url?`<img src="${attr(data.logo_url)}" alt="Logo actual">`:`<div class="visualFallback"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b></span></div>`}</div><input id="siteLogoInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="chooseSiteLogo" class="secondary" type="button">${data.logo_url?'Cambiar logo':'Agregar logo'}</button>${data.logo_url?'<button id="removeSiteLogo" class="visualRemove" type="button">Quitar</button>':''}</div></div>
 <label class="siteLogoMode"><span><b>Mostrar nombre junto al logo</b><small>Actívalo para isotipos. Desactívalo si tu logo ya incluye el nombre de la tienda.</small></span><input id="mostrarTextoLogo" name="mostrar_texto_logo" type="checkbox" ${data.mostrar_texto_logo!==false?'checked':''}></label>
 <div class="siteVisualField heroVisualField"><div class="siteVisualLabel"><b>Imagen de portada</b><small>La vista previa usa el mismo recorte <code>cover</code> que la página pública.</small></div><div class="siteVisualPreview heroPreview realHeroPreview" id="siteHeroPreview" style="--preview-hero:${data.portada_url?`url(\'${attr(data.portada_url)}\')`:'none'};--preview-x:${Number(data.portada_posicion_x??50)}%;--preview-y:${Number(data.portada_posicion_y??50)}%">${data.portada_url?'<div class="heroPreviewShade"><span>Vista real del encuadre</span></div>':'<div class="heroFallbackPreview"><span>Fondo negro + halo violeta</span></div>'}</div><div class="heroPositionControls"><label><span>Posición horizontal <b id="heroXValue">${Number(data.portada_posicion_x??50)}%</b></span><input id="heroPositionX" name="portada_posicion_x" type="range" min="0" max="100" step="1" value="${Number(data.portada_posicion_x??50)}"></label><label><span>Posición vertical <b id="heroYValue">${Number(data.portada_posicion_y??50)}%</b></span><input id="heroPositionY" name="portada_posicion_y" type="range" min="0" max="100" step="1" value="${Number(data.portada_posicion_y??50)}"></label><button id="resetHeroPosition" class="visualRemove" type="button">Centrar imagen</button></div><input id="siteHeroInput" type="file" accept="image/jpeg,image/png,image/webp" hidden><div class="siteVisualActions"><button id="chooseSiteHero" class="secondary" type="button">${data.portada_url?'Cambiar portada':'Agregar portada'}</button>${data.portada_url?'<button id="removeSiteHero" class="visualRemove" type="button">Quitar</button>':''}</div></div>
 </div></section>
 <div class="formActions"><button id="saveSiteContent" class="primary" type="submit">Guardar contenido</button></div><p id="siteContentMessage" class="formMessage"></p></form>`;
 document.getElementById('logoutAdmin').onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin()};
 document.getElementById('siteContentForm').onsubmit=saveSiteContent;
 siteLogoFile=null;siteHeroFile=null;
 const logoInput=document.getElementById('siteLogoInput'),heroInput=document.getElementById('siteHeroInput');
 document.getElementById('chooseSiteLogo').onclick=()=>logoInput.click();
 document.getElementById('chooseSiteHero').onclick=()=>heroInput.click();
 logoInput.onchange=()=>previewSiteAsset('logo',logoInput.files?.[0]);
 heroInput.onchange=()=>previewSiteAsset('hero',heroInput.files?.[0]);
 document.getElementById('removeSiteLogo')?.addEventListener('click',()=>markSiteAssetRemoved('logo'));
 document.getElementById('removeSiteHero')?.addEventListener('click',()=>markSiteAssetRemoved('hero'));
 const mode=document.getElementById('mostrarTextoLogo');
 const syncLogoModePreview=()=>document.getElementById('siteLogoPreview')?.classList.toggle('logoOnlyPreview',!mode.checked);
 mode?.addEventListener('change',syncLogoModePreview);syncLogoModePreview();
 const posX=document.getElementById('heroPositionX'),posY=document.getElementById('heroPositionY');
 const syncHeroPosition=()=>{const preview=document.getElementById('siteHeroPreview');if(!preview)return;preview.style.setProperty('--preview-x',`${posX.value}%`);preview.style.setProperty('--preview-y',`${posY.value}%`);document.getElementById('heroXValue').textContent=`${posX.value}%`;document.getElementById('heroYValue').textContent=`${posY.value}%`};
 posX?.addEventListener('input',syncHeroPosition);posY?.addEventListener('input',syncHeroPosition);
 document.getElementById('resetHeroPosition')?.addEventListener('click',()=>{posX.value=50;posY.value=50;syncHeroPosition()});syncHeroPosition();
}
function previewSiteAsset(kind,file){
 if(!file)return;
 if(!/^image\/(jpeg|png|webp)$/.test(file.type)){alert('Selecciona una imagen JPG, PNG o WebP.');return}
 const url=URL.createObjectURL(file),isLogo=kind==='logo';
 if(isLogo)siteLogoFile={file,preview:url,remove:false};else siteHeroFile={file,preview:url,remove:false};
 if(isLogo){document.getElementById('siteLogoPreview').innerHTML=`<img src="${attr(url)}" alt="Vista previa">`}else{const preview=document.getElementById('siteHeroPreview');preview.style.setProperty('--preview-hero',`url('${url}')`);preview.innerHTML='<div class="heroPreviewShade"><span>Vista real del encuadre</span></div>';}
}
function markSiteAssetRemoved(kind){
 const isLogo=kind==='logo',current=isLogo?siteLogoFile:siteHeroFile;if(current?.preview)URL.revokeObjectURL(current.preview);
 const marker={file:null,preview:null,remove:true};if(isLogo)siteLogoFile=marker;else siteHeroFile=marker;
 const preview=document.getElementById(isLogo?'siteLogoPreview':'siteHeroPreview');preview.innerHTML=isLogo?'<div class="visualFallback"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b></span></div>':'<div class="heroFallbackPreview"><span>Fondo negro + halo violeta</span></div>';if(!isLogo)preview.style.setProperty('--preview-hero','none');
}
async function compressSiteImage(file,kind){
 const bitmap=await createImageBitmap(file),max=kind==='logo'?1000:2200,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 const ctx=canvas.getContext('2d',{alpha:kind==='logo'});if(kind!=='logo'){ctx.fillStyle='#090a0d';ctx.fillRect(0,0,canvas.width,canvas.height)}ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();
 return await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('No fue posible optimizar la imagen.')),'image/webp',kind==='logo'?0.9:0.84));
}
function siteStoragePathFromPublicUrl(url){const marker='/storage/v1/object/public/sitio/';const i=(url||'').indexOf(marker);return i>=0?decodeURIComponent(url.slice(i+marker.length)):null}
async function uploadSiteAsset(kind,file){
 const blob=await compressSiteImage(file,kind),path=`${kind==='logo'?'logo':'portada'}-${crypto.randomUUID()}.webp`;
 const {error}=await supabaseClient.storage.from('sitio').upload(path,blob,{contentType:'image/webp',upsert:false,cacheControl:'3600'});if(error)throw error;
 const {data}=supabaseClient.storage.from('sitio').getPublicUrl(path);return {url:data.publicUrl,path};
}
async function saveSiteContent(e){
 e.preventDefault();const f=new FormData(e.currentTarget),button=document.getElementById('saveSiteContent'),msg=document.getElementById('siteContentMessage');
 const obj={portada_etiqueta:f.get('portada_etiqueta').trim(),portada_titulo:f.get('portada_titulo').trim(),portada_descripcion:f.get('portada_descripcion').trim(),beneficio_1_titulo:f.get('beneficio_1_titulo').trim(),beneficio_1_descripcion:f.get('beneficio_1_descripcion').trim(),beneficio_2_titulo:f.get('beneficio_2_titulo').trim(),beneficio_2_descripcion:f.get('beneficio_2_descripcion').trim(),beneficio_3_titulo:f.get('beneficio_3_titulo').trim(),beneficio_3_descripcion:f.get('beneficio_3_descripcion').trim(),titulo_ofertas:f.get('titulo_ofertas').trim(),titulo_figuras:f.get('titulo_figuras').trim(),titulo_proximamente:f.get('titulo_proximamente').trim(),mostrar_texto_logo:f.get('mostrar_texto_logo')==='on',portada_posicion_x:Number(f.get('portada_posicion_x')||50),portada_posicion_y:Number(f.get('portada_posicion_y')||50),fecha_actualizacion:new Date().toISOString()};
 button.disabled=true;msg.textContent='Guardando…';msg.className='formMessage';const oldLogo=siteConfig?.logo_url||null,oldHero=siteConfig?.portada_url||null;let uploaded=[];
 try{
  if(siteLogoFile?.file){msg.textContent='Procesando logo…';const x=await uploadSiteAsset('logo',siteLogoFile.file);uploaded.push(x.path);obj.logo_url=x.url}else if(siteLogoFile?.remove)obj.logo_url=null;
  if(siteHeroFile?.file){msg.textContent='Procesando portada…';const x=await uploadSiteAsset('hero',siteHeroFile.file);uploaded.push(x.path);obj.portada_url=x.url}else if(siteHeroFile?.remove)obj.portada_url=null;
  const {data,error}=await supabaseClient.from('configuracion_sitio').update(obj).eq('id',1).select().single();if(error)throw error;
  const obsolete=[];if(Object.prototype.hasOwnProperty.call(obj,'logo_url')&&oldLogo&&oldLogo!==data.logo_url){const x=siteStoragePathFromPublicUrl(oldLogo);if(x)obsolete.push(x)}if(Object.prototype.hasOwnProperty.call(obj,'portada_url')&&oldHero&&oldHero!==data.portada_url){const x=siteStoragePathFromPublicUrl(oldHero);if(x)obsolete.push(x)}if(obsolete.length)await supabaseClient.storage.from('sitio').remove(obsolete);
  if(siteLogoFile?.preview)URL.revokeObjectURL(siteLogoFile.preview);if(siteHeroFile?.preview)URL.revokeObjectURL(siteHeroFile.preview);siteLogoFile=null;siteHeroFile=null;siteConfig=data;applySiteConfig(data);msg.textContent='Contenido e identidad visual actualizados correctamente.';msg.className='formMessage success';setTimeout(()=>renderAdminContentPanel(),700);
 }catch(error){if(uploaded.length)await supabaseClient.storage.from('sitio').remove(uploaded);msg.textContent='No se pudo guardar: '+(error?.message||'Error inesperado.');msg.className='formMessage error'}finally{button.disabled=false}
}

let adminProductsCache=[];
async function loadAdminProducts(){
 const box=document.getElementById('adminProducts');
 const {data,error}=await supabaseClient.from('productos').select('*').order('fecha_creacion',{ascending:false});
 if(error){box.innerHTML=`<p class="formMessage error">No fue posible cargar los productos: ${escapeHtml(error.message)}</p>`;return}
 adminProductsCache=data||[]; renderAdminProducts(adminProductsCache);
}
function filterAdminProducts(q){q=q.toLowerCase().trim();renderAdminProducts(adminProductsCache.filter(p=>[p.nombre,p.sku,p.franquicia].some(v=>(v||'').toLowerCase().includes(q))))}
function renderAdminProducts(items){
 const box=document.getElementById('adminProducts');
 if(!items.length){box.innerHTML='<div class="adminEmpty"><b>Aún no hay figuras registradas.</b><span>Usa “Nueva figura” para crear el primer producto real.</span></div>';return}
 box.innerHTML=items.map(p=>`<article class="adminProduct"><div><span class="adminSku">${escapeHtml(p.sku)}</span><h3>${escapeHtml(p.nombre)}</h3><p>${escapeHtml(p.franquicia||'Sin franquicia')}</p></div><div class="adminProductPrice"><strong>${money(Number(p.precio_oferta??p.precio))}</strong>${p.precio_oferta!=null?`<small>${money(Number(p.precio))}</small>`:''}</div><span class="adminState state-${p.estado}">${escapeHtml(p.estado)}</span><div class="adminRowActions"><button type="button" data-edit="${p.id}">Editar</button><button type="button" data-duplicate="${p.id}">Duplicar</button><button type="button" class="danger" data-delete="${p.id}">Eliminar</button></div></article>`).join('');
 box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openProductForm(adminProductsCache.find(p=>p.id===b.dataset.edit)));
 box.querySelectorAll('[data-duplicate]').forEach(b=>b.onclick=()=>openProductForm(adminProductsCache.find(p=>p.id===b.dataset.duplicate),true));
 box.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
}
let productFormImages=[];
let existingProductImages=[];

function openProductForm(p=null,duplicating=false){
 const editing=!!p&&!duplicating;
 productFormImages=[];
 existingProductImages=[];
 document.getElementById('adminContent').innerHTML=`<div class="adminFormHead"><button id="backAdmin" class="backBtn" type="button">‹ Volver a productos</button><span class="kicker">${editing?'EDITAR':duplicating?'DUPLICAR':'NUEVA'} FIGURA</span><h1>${editing?'Editar producto':duplicating?'Duplicar producto':'Registrar figura'}</h1>${duplicating?'<p class="duplicateNotice">Se copiarán los datos del producto. El SKU será nuevo y las fotografías deberán agregarse a la copia.</p>':''}</div><form id="productForm" class="productForm">
 <section class="formSection"><div class="formSectionTitle"><span>01</span><div><h2>Información</h2><p>Datos principales de la figura.</p></div></div><div class="formGrid">
 <label>SKU<div class="readonlyField">${editing?escapeHtml(p.sku):'Se generará automáticamente'}</div><small class="fieldHint">${editing?'Identificador interno del producto.':duplicating?'La copia recibirá un SKU nuevo al guardarse.':'Supabase asignará el siguiente código ANS-XXXXX al guardar.'}</small></label>
 <label>Estado<select name="estado"><option value="disponible">Disponible</option><option value="apartada">Apartada</option><option value="vendida">Vendida</option><option value="proximamente">Próximamente</option></select></label>
 <label>Nombre<input name="nombre" maxlength="150" required value="${attr(p?.nombre||'')}"></label><div class="catalogField"><span>Personaje</span><div class="catalogPicker"><div class="searchableSelect" id="personajeCombo"><input class="searchableSelectInput" id="personajeSearch" type="text" autocomplete="off" placeholder="Selecciona primero una franquicia…" disabled><button class="searchableSelectArrow" type="button" tabindex="-1" aria-label="Mostrar personajes">⌄</button><div class="searchableSelectMenu"></div><select name="personaje_id" id="personajeSelect" class="catalogNativeSelect" disabled><option value="">Selecciona primero una franquicia…</option></select></div><button class="catalogAdd" id="addPersonaje" type="button" disabled>＋ Nuevo</button></div><small class="fieldHint">Escribe para buscar. Los personajes dependen de la franquicia seleccionada.</small></div>
 <div class="catalogField"><span>Franquicia</span><div class="catalogPicker"><div class="searchableSelect" id="franquiciaCombo"><input class="searchableSelectInput" id="franquiciaSearch" type="text" autocomplete="off" placeholder="Buscar franquicia…"><button class="searchableSelectArrow" type="button" tabindex="-1" aria-label="Mostrar franquicias">⌄</button><div class="searchableSelectMenu"></div><select name="franquicia_id" id="franquiciaSelect" class="catalogNativeSelect"><option value="">Cargando franquicias…</option></select></div><button class="catalogAdd" id="addFranquicia" type="button">＋ Nueva</button></div><small class="fieldHint">Escribe para buscar una franquicia existente o créala sin salir del producto.</small></div>
 <div class="catalogField"><span>Fabricante</span><div class="catalogPicker"><div class="searchableSelect" id="fabricanteCombo"><input class="searchableSelectInput" id="fabricanteSearch" type="text" autocomplete="off" placeholder="Buscar fabricante…"><button class="searchableSelectArrow" type="button" tabindex="-1" aria-label="Mostrar fabricantes">⌄</button><div class="searchableSelectMenu"></div><select name="fabricante_id" id="fabricanteSelect" class="catalogNativeSelect"><option value="">Cargando fabricantes…</option></select></div><button class="catalogAdd" id="addFabricante" type="button">＋ Nuevo</button></div><small class="fieldHint">Escribe para buscar un fabricante existente.</small></div>
 </div></section>
 <section class="formSection"><div class="formSectionTitle"><span>02</span><div><h2>Precio e inventario</h2><p>Precio de venta y disponibilidad.</p></div></div><div class="formGrid"><label>Precio normal <span class="required">*</span><div class="moneyInput"><span>$</span><input name="precio" type="number" min="0" step="0.01" required value="${attr(p?.precio??'')}"></div></label><label>Precio oferta <small>(opcional)</small><div class="moneyInput"><span>$</span><input name="precio_oferta" type="number" min="0" step="0.01" value="${attr(p?.precio_oferta??'')}"></div></label><label>Stock<input name="stock" type="number" min="0" step="1" required value="${attr(p?.stock??1)}"></label><label>Procedencia<input name="procedencia" value="${attr(p?.procedencia||'Japón')}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>03</span><div><h2>Estado físico</h2><p>Condición de la pieza y su empaque.</p></div></div><div class="formGrid"><label>Condición figura<select name="condicion_figura"><option>Nueva</option><option>Usada - Excelente</option><option>Usada - Buena</option><option>Usada - Con detalles</option></select></label><label>Condición caja<select name="condicion_caja"><option value="">Seleccionar…</option><option>Excelente</option><option>Buena</option><option>Con detalles</option><option>Sin caja</option></select></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>04</span><div><h2>Publicación</h2><p>Información que verá el cliente.</p></div></div><div class="formGrid"><label class="full">Entrega<input name="entrega" value="${attr(p?.entrega||'A convenir')}"></label><label class="full">Descripción<textarea name="descripcion" rows="5" placeholder="Describe la figura, edición, detalles relevantes, contenido incluido…">${escapeHtml(p?.descripcion||'')}</textarea></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>05</span><div><h2>Fotografías</h2><p>Agrega varias imágenes y elige la principal.</p></div></div><div class="photoUploader"><input id="productPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><button id="selectPhotos" class="uploadButton" type="button"><span>＋</span><b>Agregar fotografías</b><small>JPG, PNG o WebP · se optimizan antes de subir</small></button><div id="photoPreview" class="photoPreview"></div></div></section>
 <div class="formChecks"><label><input name="destacada" type="checkbox" ${p?.destacada?'checked':''}> Figura destacada</label><label><input name="activo" type="checkbox" ${p?.activo===false?'':'checked'}> Visible en catálogo</label></div><div class="formActions"><button id="saveProductButton" class="primary" type="submit">${editing?'Guardar cambios':duplicating?'Crear copia':'Crear figura'}</button></div><p id="productMessage" class="formMessage"></p></form>`;
 document.querySelector('[name="estado"]').value=p?.estado||'disponible';
 document.querySelector('[name="condicion_figura"]').value=p?.condicion_figura||'Nueva';
 if(p?.condicion_caja && [...document.querySelector('[name="condicion_caja"]').options].some(o=>o.value===p.condicion_caja)) document.querySelector('[name="condicion_caja"]').value=p.condicion_caja;
 document.getElementById('backAdmin').onclick=()=>{cleanupNewImagePreviews();renderAdminPanel();loadAdminProducts()};
 document.getElementById('selectPhotos').onclick=()=>document.getElementById('productPhotos').click();
 document.getElementById('productPhotos').onchange=handlePhotoSelection;
 document.getElementById('productForm').onsubmit=e=>saveProduct(e,editing?p?.id:null,editing?p?.sku:null);
 document.getElementById('addFranquicia').onclick=()=>openCatalogModal('franquicias','franquiciaSelect','Nueva franquicia',null,async()=>{await loadCharactersForFranchise(null);});
 document.getElementById('addFabricante').onclick=()=>openCatalogModal('fabricantes','fabricanteSelect','Nuevo fabricante');
 document.getElementById('addPersonaje').onclick=()=>{const franquiciaId=document.getElementById('franquiciaSelect')?.value;if(franquiciaId)openCatalogModal('personajes','personajeSelect','Nuevo personaje',{franquicia_id:franquiciaId});};
 document.getElementById('franquiciaSelect').onchange=()=>loadCharactersForFranchise(null);
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
 for(const file of files){
   if(!allowed.includes(file.type)) continue;
   if(productFormImages.length+existingProductImages.filter(x=>!x.removed).length>=8) break;
   productFormImages.push({id:crypto.randomUUID(),file,preview:URL.createObjectURL(file),principal:false});
 }
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
 const list=kind==='old'?existingProductImages:productFormImages; const item=list.find(x=>x.id===id); if(item)item.principal=true; renderPhotoPreview();
}
function removePhoto(kind,id){
 if(kind==='old'){const x=existingProductImages.find(x=>x.id===id);if(x)x.removed=true}
 else {const i=productFormImages.findIndex(x=>x.id===id);if(i>=0){URL.revokeObjectURL(productFormImages[i].preview);productFormImages.splice(i,1)}}
 if(!hasPrincipalPhoto())setFirstPhotoPrincipal(); renderPhotoPreview();
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
 if(obj.precio_oferta!==null&&obj.precio_oferta>=obj.precio){showProductMessage('El precio de oferta debe ser menor que el precio normal.',true);return}
 button.disabled=true;msg.textContent=id?'Guardando cambios…':'Creando figura…';msg.className='formMessage';
 try{
   let product;
   if(id){const {data,error}=await supabaseClient.from('productos').update(obj).eq('id',id).select().single();if(error)throw error;product=data||{id,sku:currentSku}}
   else {const {data,error}=await supabaseClient.from('productos').insert(obj).select().single();if(error)throw error;product=data}
   msg.textContent=productFormImages.length||existingProductImages.some(x=>x.removed)?'Procesando fotografías…':'Guardado correctamente…';
   await syncProductImages(product); cleanupNewImagePreviews(); renderAdminPanel();await loadAdminProducts();
 }catch(error){showProductMessage('No se pudo guardar: '+(error?.message||'Error inesperado.'),true);button.disabled=false}
}
function showProductMessage(text,error=false){const m=document.getElementById('productMessage');if(!m)return;m.textContent=text;m.className='formMessage'+(error?' error':'')}
async function deleteProduct(id){
 const p=adminProductsCache.find(x=>x.id===id); if(!confirm(`¿Eliminar ${p?.nombre||'este producto'}? Esta acción no se puede deshacer.`))return;
 const {data:imgs,error:imgReadError}=await supabaseClient.from('producto_imagenes').select('url').eq('producto_id',id);
 if(imgReadError){alert('No se pudieron consultar las fotografías: '+imgReadError.message);return}
 const paths=(imgs||[]).map(x=>storagePathFromPublicUrl(x.url)).filter(Boolean);
 if(paths.length){const {error:storageError}=await supabaseClient.storage.from('productos').remove(paths);if(storageError){alert('No se pudieron eliminar las fotografías de Storage: '+storageError.message);return}}
 const {error}=await supabaseClient.from('productos').delete().eq('id',id); if(error){alert('No se pudo eliminar: '+error.message);return} await loadAdminProducts();
}
function emptyNull(v){v=(v??'').toString().trim();return v===''?null:v}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function attr(v){return escapeHtml(v)}

// Acceso discreto: /#admin. No es una medida de seguridad; RLS protege los datos.
if(location.hash==='#admin') setTimeout(openAdmin,0);
window.addEventListener('hashchange',()=>{if(location.hash==='#admin')openAdmin()});
