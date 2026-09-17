const SUPABASE_URL = 'https://uobqjdvaovqbqthnmvpm.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_5L3IfGy74SfEDB0YNnH9Fw_n3HjwND7';
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const products = [
  {id:'gojo-satoru',name:'Gojo Satoru',series:'Jujutsu Kaisen',character:'Gojo Satoru',manufacturer:'Banpresto',condition:'Nueva / caja original',origin:'Japón',description:'Figura de colección seleccionada para Anime no Sekai. Fotografías e información de demostración mientras conectamos el catálogo real.',price:1000,sale:700,status:'Disponible',img:'https://images.unsplash.com/photo-1608889825205-eebdb9fc5806?auto=format&fit=crop&w=900&q=80'},
  {id:'luffy',name:'Monkey D. Luffy',series:'One Piece',character:'Monkey D. Luffy',manufacturer:'Bandai Spirits',condition:'Nueva / caja original',origin:'Japón',description:'Figura de colección de One Piece. Esta ficha sirve como demostración de la vista de detalle antes de cargar tus productos reales.',price:1450,status:'Disponible',img:'https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?auto=format&fit=crop&w=900&q=80'},
  {id:'tanjiro',name:'Tanjiro Kamado',series:'Demon Slayer',character:'Tanjiro Kamado',manufacturer:'SEGA',condition:'Nueva / caja original',origin:'Japón',description:'Figura de colección de Demon Slayer importada desde Japón. Datos de demostración para validar el diseño del catálogo.',price:1200,sale:990,status:'Disponible',img:'https://images.unsplash.com/photo-1560972550-aba3456b5564?auto=format&fit=crop&w=900&q=80'},
  {id:'goku',name:'Goku',series:'Dragon Ball',character:'Son Goku',manufacturer:'Banpresto',condition:'Nueva / caja original',origin:'Japón',description:'Figura de colección de Dragon Ball. Actualmente aparece como apartada para mostrar cómo cambia la acción comercial según disponibilidad.',price:1650,status:'Apartada',img:'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=80'}
];
const money = n => new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',maximumFractionDigits:0}).format(n);
const icon = (name) => ({search:'⌕',menu:'☰',arrow:'›',fire:'🔥',truck:'✈',shield:'✓',chat:'◉',sparkle:'✦'})[name] || '';
function productCard(p){
 const pct=p.sale?Math.round((1-p.sale/p.price)*100):null;
 const action = p.status==='Apartada' ? {text:'Consultar disponibilidad', cls:'disabled', msg:`Hola, vi la figura ${p.name} de ${p.series} como apartada en Anime no Sekai. ¿Podrías avisarme si vuelve a estar disponible?`} : p.status==='Próximamente' ? {text:'Avísame cuando llegue', cls:'notify', msg:`Hola, me interesa la figura ${p.name} de ${p.series}. ¿Podrías avisarme cuando llegue a Anime no Sekai?`} : p.status==='Vendida' ? {text:'¿Puedes conseguirme una?', cls:'sold', msg:`Hola, vi la figura ${p.name} de ${p.series} en Anime no Sekai. ¿Podrías conseguirme una?`} : {text:'Apartar por WhatsApp', cls:'', msg:`Hola, me interesa la figura ${p.name} de ${p.series} que vi en Anime no Sekai. ¿Sigue disponible?`};
 const wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
 return `<article class="card"><div class="photo"><img src="${p.img}" alt="${p.name}">${pct?`<span class="discount">-${pct}%</span>`:''}<span class="status ${p.status==='Apartada'?'hold':''}">${p.status}</span></div><div class="cardBody"><p class="series">${p.series}</p><h3>${p.name}</h3><div class="prices">${p.sale?`<span class="old">${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><button class="details" data-product="${p.id}" type="button">Ver detalles <span>${icon('arrow')}</span></button><a class="whatsapp ${action.cls}" href="${wa}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a></div></article>`;
}
document.getElementById('app').innerHTML=`
<header><a class="brand" href="#"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b><small>FIGURAS & COLECCIONABLES</small></span></a><nav><a href="#catalogo">Figuras</a><a href="#ofertas">Ofertas</a><a href="#proximamente">Próximamente</a></nav><div class="headActions"><button aria-label="Buscar">${icon('search')}</button><button class="menu" aria-label="Menú">${icon('menu')}</button></div></header>
<main><section class="hero"><div class="heroContent"><span class="eyebrow">${icon('sparkle')} DIRECTO DESDE JAPÓN</span><h1>Tu mundo de<br><em>figuras y coleccionables.</em></h1><p>Encuentra esa pieza que falta en tu colección. Figuras seleccionadas, disponibilidad real y atención directa por WhatsApp.</p><div class="heroBtns"><a href="#catalogo" class="primary">Explorar figuras ${icon('arrow')}</a><a href="#ofertas" class="secondary">${icon('fire')} Ver ofertas</a></div></div><div class="japan">日本<br><span>の世界</span></div></section>
<section class="benefits"><div><span class="featureIcon">${icon('truck')}</span><span><b>Importadas de Japón</b><small>Piezas seleccionadas</small></span></div><div><span class="featureIcon">${icon('shield')}</span><span><b>Compra con confianza</b><small>Atención directa</small></span></div><div><span class="featureIcon">${icon('chat')}</span><span><b>Apártala por WhatsApp</b><small>Rápido y sencillo</small></span></div></section>
<section id="ofertas" class="section"><div class="sectionHead"><div><span class="kicker">🔥 PRECIOS ESPECIALES</span><h2>Ofertas del Sekai</h2></div><a href="#catalogo">Ver todas ${icon('arrow')}</a></div><div class="grid">${products.filter(x=>x.sale).map(productCard).join('')}</div></section>
<section id="catalogo" class="section"><div class="sectionHead"><div><span class="kicker">COLECCIÓN</span><h2>Figuras destacadas</h2></div></div><div class="chips"><button class="active">Todas</button><button>One Piece</button><button>Dragon Ball</button><button>Jujutsu Kaisen</button><button>Demon Slayer</button></div><div class="grid">${products.map(productCard).join('')}</div></section>
<section id="proximamente" class="arrival"><div><span class="kicker">PRÓXIMAMENTE 🇯🇵</span><h2>Nuevas piezas vienen en camino.</h2><p>Descubre próximas importaciones y pregunta por disponibilidad antes de que lleguen.</p></div><a class="primary" href="https://wa.me/529994739090" target="_blank" rel="noopener">Preguntar por WhatsApp</a></section></main>
<footer><div class="brand"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b></span></div><p>Tu mundo de figuras y coleccionables.</p><small>© 2026 Anime no Sekai</small></footer>`;


function productAction(p){
  return p.status==='Apartada' ? {text:'Consultar disponibilidad', cls:'disabled', msg:`Hola, vi la figura ${p.name} de ${p.series} como apartada en Anime no Sekai. ¿Podrías avisarme si vuelve a estar disponible?`} : p.status==='Próximamente' ? {text:'Avísame cuando llegue', cls:'notify', msg:`Hola, me interesa la figura ${p.name} de ${p.series}. ¿Podrías avisarme cuando llegue a Anime no Sekai?`} : p.status==='Vendida' ? {text:'¿Puedes conseguirme una?', cls:'sold', msg:`Hola, vi la figura ${p.name} de ${p.series} en Anime no Sekai. ¿Podrías conseguirme una?`} : {text:'Apartar por WhatsApp', cls:'', msg:`Hola, me interesa la figura ${p.name} de ${p.series} que vi en Anime no Sekai. ¿Sigue disponible?`};
}
function openDetail(id){
  const p=products.find(x=>x.id===id); if(!p)return;
  const pct=p.sale?Math.round((1-p.sale/p.price)*100):null;
  const action=productAction(p);
  const wa=`https://wa.me/529994739090?text=${encodeURIComponent(action.msg)}`;
  const gallery=[p.img,p.img,p.img,p.img];
  const detail=document.createElement('section');
  detail.className='detailView'; detail.id='detailView';
  detail.innerHTML=`<div class="detailTop"><button class="backBtn" type="button">‹ Volver al catálogo</button><button class="detailClose" type="button" aria-label="Cerrar">×</button></div><div class="detailShell"><div class="detailGallery"><div class="detailMainPhoto"><img id="detailMainImage" src="${p.img}" alt="${p.name}"></div><div class="detailThumbs">${gallery.map((img,i)=>`<button class="detailThumb ${i===0?'active':''}" type="button" data-img="${img}"><img src="${img}" alt="Vista ${i+1} de ${p.name}"></button>`).join('')}</div></div><div class="detailInfo"><p class="series">${p.series}</p><h1>${p.name}</h1><div class="detailBadges">${pct?`<span class="detailBadge sale">-${pct}%</span>`:''}<span class="detailBadge ${p.status==='Apartada'?'hold':''}">${p.status}</span></div><div class="detailPrice">${p.sale?`<span class="old">Antes ${money(p.price)}</span>`:''}<strong>${money(p.sale||p.price)}</strong></div><p>${p.description}</p><div class="detailMeta"><div><small>Personaje</small><b>${p.character}</b></div><div><small>Franquicia</small><b>${p.series}</b></div><div><small>Fabricante</small><b>${p.manufacturer}</b></div><div><small>Condición</small><b>${p.condition}</b></div><div><small>Procedencia</small><b>${p.origin}</b></div><div><small>Entrega</small><b>A convenir</b></div></div><div class="detailActions"><a class="whatsapp ${action.cls}" href="${wa}" target="_blank" rel="noopener">${icon('chat')} ${action.text}</a><p class="detailNote">La compra y entrega se acuerdan directamente por WhatsApp.</p></div></div></div>`;
  document.body.appendChild(detail); document.body.classList.add('detail-open');
  detail.querySelectorAll('.backBtn,.detailClose').forEach(b=>b.addEventListener('click',closeDetail));
  detail.querySelectorAll('.detailThumb').forEach(t=>t.addEventListener('click',()=>{detail.querySelector('#detailMainImage').src=t.dataset.img;detail.querySelectorAll('.detailThumb').forEach(x=>x.classList.remove('active'));t.classList.add('active')}));
  history.pushState({detail:id},'',`#figura=${id}`);
}
function closeDetail(){const d=document.getElementById('detailView');if(d)d.remove();document.body.classList.remove('detail-open');if(location.hash.startsWith('#figura='))history.replaceState({},'',location.pathname+location.search+'#catalogo')}
document.addEventListener('click',e=>{const btn=e.target.closest('.details[data-product]');if(btn)openDetail(btn.dataset.product)});
window.addEventListener('popstate',()=>{if(!location.hash.startsWith('#figura=')){const d=document.getElementById('detailView');if(d){d.remove();document.body.classList.remove('detail-open')}}});
if(location.hash.startsWith('#figura=')){setTimeout(()=>openDetail(location.hash.split('=')[1]),0)}


// =========================================================
// V4 — Panel administrativo conectado a Supabase
// =========================================================
function adminMarkup(){
 return `<section class="adminView" id="adminView">
  <div class="adminTop"><a class="brand" href="#"><span class="mark">界</span><span>ANIME NO <b>SEKAI</b><small>ADMINISTRACIÓN</small></span></a><button id="adminExit" class="detailClose" type="button">×</button></div>
  <div class="adminShell"><div id="adminContent"><div class="adminLogin"><span class="kicker">ACCESO PRIVADO</span><h1>Panel administrativo</h1><p>Inicia sesión para administrar el catálogo de Anime no Sekai.</p><form id="loginForm"><label>Correo<input id="loginEmail" type="email" autocomplete="username" required></label><label>Contraseña<input id="loginPassword" type="password" autocomplete="current-password" required></label><button class="primary adminPrimary" type="submit">Iniciar sesión</button><p id="loginMessage" class="formMessage"></p></form></div></div></div>
 </section>`;
}
async function openAdmin(){
 if(document.getElementById('adminView')) return;
 document.body.insertAdjacentHTML('beforeend',adminMarkup());
 document.body.classList.add('detail-open');
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
 renderAdminPanel(); await loadAdminProducts();
}
function renderAdminPanel(){
 document.getElementById('adminContent').innerHTML=`<div class="adminHeader"><div><span class="kicker">ANIME NO SEKAI</span><h1>Productos</h1><p>Administra las figuras publicadas en tu catálogo.</p></div><div class="adminHeaderActions"><button id="newProduct" class="primary" type="button">+ Nueva figura</button><button id="logoutAdmin" class="secondary" type="button">Cerrar sesión</button></div></div><div class="adminToolbar"><input id="adminSearch" type="search" placeholder="Buscar por nombre, SKU o franquicia…"></div><div id="adminProducts" class="adminProducts"><p class="adminLoading">Cargando productos…</p></div>`;
 document.getElementById('logoutAdmin').onclick=async()=>{await supabaseClient.auth.signOut();closeAdmin()};
 document.getElementById('newProduct').onclick=()=>openProductForm();
 document.getElementById('adminSearch').addEventListener('input',e=>filterAdminProducts(e.target.value));
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
 box.innerHTML=items.map(p=>`<article class="adminProduct"><div><span class="adminSku">${escapeHtml(p.sku)}</span><h3>${escapeHtml(p.nombre)}</h3><p>${escapeHtml(p.franquicia||'Sin franquicia')}</p></div><div class="adminProductPrice"><strong>${money(Number(p.precio_oferta??p.precio))}</strong>${p.precio_oferta!=null?`<small>${money(Number(p.precio))}</small>`:''}</div><span class="adminState state-${p.estado}">${escapeHtml(p.estado)}</span><div class="adminRowActions"><button type="button" data-edit="${p.id}">Editar</button><button type="button" class="danger" data-delete="${p.id}">Eliminar</button></div></article>`).join('');
 box.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openProductForm(adminProductsCache.find(p=>p.id===b.dataset.edit)));
 box.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>deleteProduct(b.dataset.delete));
}
let productFormImages=[];
let existingProductImages=[];

function openProductForm(p=null){
 const editing=!!p;
 productFormImages=[];
 existingProductImages=[];
 document.getElementById('adminContent').innerHTML=`<div class="adminFormHead"><button id="backAdmin" class="backBtn" type="button">‹ Volver a productos</button><span class="kicker">${editing?'EDITAR':'NUEVA'} FIGURA</span><h1>${editing?'Editar producto':'Registrar figura'}</h1></div><form id="productForm" class="productForm">
 <section class="formSection"><div class="formSectionTitle"><span>01</span><div><h2>Información</h2><p>Datos principales de la figura.</p></div></div><div class="formGrid">
 <label>SKU<div class="readonlyField">${editing?escapeHtml(p.sku):'Se generará automáticamente'}</div><small class="fieldHint">${editing?'Identificador interno del producto.':'Supabase asignará el siguiente código ANS-XXXXX al guardar.'}</small></label>
 <label>Estado<select name="estado"><option value="disponible">Disponible</option><option value="apartada">Apartada</option><option value="vendida">Vendida</option><option value="proximamente">Próximamente</option></select></label>
 <label>Nombre<input name="nombre" maxlength="150" required value="${attr(p?.nombre||'')}"></label><label>Personaje<input name="personaje" maxlength="150" value="${attr(p?.personaje||'')}"></label>
 <label>Franquicia<input name="franquicia" maxlength="150" value="${attr(p?.franquicia||'')}"></label><label>Fabricante<input name="fabricante" maxlength="150" value="${attr(p?.fabricante||'')}"></label>
 </div></section>
 <section class="formSection"><div class="formSectionTitle"><span>02</span><div><h2>Precio e inventario</h2><p>Precio de venta y disponibilidad.</p></div></div><div class="formGrid"><label>Precio normal <span class="required">*</span><div class="moneyInput"><span>$</span><input name="precio" type="number" min="0" step="0.01" required value="${attr(p?.precio??'')}"></div></label><label>Precio oferta <small>(opcional)</small><div class="moneyInput"><span>$</span><input name="precio_oferta" type="number" min="0" step="0.01" value="${attr(p?.precio_oferta??'')}"></div></label><label>Stock<input name="stock" type="number" min="0" step="1" required value="${attr(p?.stock??1)}"></label><label>Procedencia<input name="procedencia" value="${attr(p?.procedencia||'Japón')}"></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>03</span><div><h2>Estado físico</h2><p>Condición de la pieza y su empaque.</p></div></div><div class="formGrid"><label>Condición figura<select name="condicion_figura"><option>Nueva</option><option>Usada - Excelente</option><option>Usada - Buena</option><option>Usada - Con detalles</option></select></label><label>Condición caja<select name="condicion_caja"><option value="">Seleccionar…</option><option>Excelente</option><option>Buena</option><option>Con detalles</option><option>Sin caja</option></select></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>04</span><div><h2>Publicación</h2><p>Información que verá el cliente.</p></div></div><div class="formGrid"><label class="full">Entrega<input name="entrega" value="${attr(p?.entrega||'A convenir')}"></label><label class="full">Descripción<textarea name="descripcion" rows="5" placeholder="Describe la figura, edición, detalles relevantes, contenido incluido…">${escapeHtml(p?.descripcion||'')}</textarea></label></div></section>
 <section class="formSection"><div class="formSectionTitle"><span>05</span><div><h2>Fotografías</h2><p>Agrega varias imágenes y elige la principal.</p></div></div><div class="photoUploader"><input id="productPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple hidden><button id="selectPhotos" class="uploadButton" type="button"><span>＋</span><b>Agregar fotografías</b><small>JPG, PNG o WebP · se optimizan antes de subir</small></button><div id="photoPreview" class="photoPreview"></div></div></section>
 <div class="formChecks"><label><input name="destacada" type="checkbox" ${p?.destacada?'checked':''}> Figura destacada</label><label><input name="activo" type="checkbox" ${p?.activo===false?'':'checked'}> Visible en catálogo</label></div><div class="formActions"><button id="saveProductButton" class="primary" type="submit">${editing?'Guardar cambios':'Crear figura'}</button></div><p id="productMessage" class="formMessage"></p></form>`;
 document.querySelector('[name="estado"]').value=p?.estado||'disponible';
 document.querySelector('[name="condicion_figura"]').value=p?.condicion_figura||'Nueva';
 if(p?.condicion_caja && [...document.querySelector('[name="condicion_caja"]').options].some(o=>o.value===p.condicion_caja)) document.querySelector('[name="condicion_caja"]').value=p.condicion_caja;
 document.getElementById('backAdmin').onclick=()=>{cleanupNewImagePreviews();renderAdminPanel();loadAdminProducts()};
 document.getElementById('selectPhotos').onclick=()=>document.getElementById('productPhotos').click();
 document.getElementById('productPhotos').onchange=handlePhotoSelection;
 document.getElementById('productForm').onsubmit=e=>saveProduct(e,p?.id,p?.sku);
 if(editing) loadExistingProductImages(p.id);
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
 const obj={nombre:f.get('nombre').trim(),personaje:emptyNull(f.get('personaje')),franquicia:emptyNull(f.get('franquicia')),fabricante:emptyNull(f.get('fabricante')),descripcion:emptyNull(f.get('descripcion')),precio:Number(f.get('precio')),precio_oferta:f.get('precio_oferta')===''?null:Number(f.get('precio_oferta')),estado:f.get('estado'),stock:Number(f.get('stock')),condicion_figura:emptyNull(f.get('condicion_figura')),condicion_caja:emptyNull(f.get('condicion_caja')),procedencia:emptyNull(f.get('procedencia')),entrega:emptyNull(f.get('entrega')),destacada:f.get('destacada')==='on',activo:f.get('activo')==='on'};
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
 const {error}=await supabaseClient.from('productos').delete().eq('id',id); if(error){alert('No se pudo eliminar: '+error.message);return} await loadAdminProducts();
}
function emptyNull(v){v=(v??'').toString().trim();return v===''?null:v}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function attr(v){return escapeHtml(v)}

// Acceso discreto: /#admin. No es una medida de seguridad; RLS protege los datos.
if(location.hash==='#admin') setTimeout(openAdmin,0);
window.addEventListener('hashchange',()=>{if(location.hash==='#admin')openAdmin()});
