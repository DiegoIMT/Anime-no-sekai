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
function openProductForm(p=null){
 const editing=!!p;
 document.getElementById('adminContent').innerHTML=`<div class="adminFormHead"><button id="backAdmin" class="backBtn" type="button">‹ Volver a productos</button><span class="kicker">${editing?'EDITAR':'NUEVA'} FIGURA</span><h1>${editing?'Editar producto':'Registrar figura'}</h1></div><form id="productForm" class="productForm">
 <div class="formGrid"><label>SKU<input name="sku" maxlength="20" required value="${attr(p?.sku||'')}"></label><label>Nombre<input name="nombre" maxlength="150" required value="${attr(p?.nombre||'')}"></label><label>Personaje<input name="personaje" value="${attr(p?.personaje||'')}"></label><label>Franquicia<input name="franquicia" value="${attr(p?.franquicia||'')}"></label><label>Fabricante<input name="fabricante" value="${attr(p?.fabricante||'')}"></label><label>Estado<select name="estado"><option value="disponible">Disponible</option><option value="apartada">Apartada</option><option value="vendida">Vendida</option><option value="proximamente">Próximamente</option></select></label><label>Precio normal<input name="precio" type="number" min="0" step="0.01" required value="${attr(p?.precio??'')}"></label><label>Precio oferta <small>(opcional)</small><input name="precio_oferta" type="number" min="0" step="0.01" value="${attr(p?.precio_oferta??'')}"></label><label>Stock<input name="stock" type="number" min="0" step="1" required value="${attr(p?.stock??1)}"></label><label>Condición figura<input name="condicion_figura" value="${attr(p?.condicion_figura||'Nueva')}"></label><label>Condición caja<input name="condicion_caja" value="${attr(p?.condicion_caja||'')}"></label><label>Procedencia<input name="procedencia" value="${attr(p?.procedencia||'Japón')}"></label><label class="full">Entrega<input name="entrega" value="${attr(p?.entrega||'A convenir')}"></label><label class="full">Descripción<textarea name="descripcion" rows="5">${escapeHtml(p?.descripcion||'')}</textarea></label></div>
 <div class="formChecks"><label><input name="destacada" type="checkbox" ${p?.destacada?'checked':''}> Figura destacada</label><label><input name="activo" type="checkbox" ${p?.activo===false?'':'checked'}> Visible en catálogo</label></div><div class="formActions"><button class="primary" type="submit">${editing?'Guardar cambios':'Crear figura'}</button></div><p id="productMessage" class="formMessage"></p></form>`;
 document.querySelector('[name="estado"]').value=p?.estado||'disponible';
 document.getElementById('backAdmin').onclick=()=>{renderAdminPanel();loadAdminProducts()};
 document.getElementById('productForm').onsubmit=e=>saveProduct(e,p?.id);
}
async function saveProduct(e,id){
 e.preventDefault();const f=new FormData(e.currentTarget),msg=document.getElementById('productMessage');
 const obj={sku:f.get('sku').trim(),nombre:f.get('nombre').trim(),personaje:emptyNull(f.get('personaje')),franquicia:emptyNull(f.get('franquicia')),fabricante:emptyNull(f.get('fabricante')),descripcion:emptyNull(f.get('descripcion')),precio:Number(f.get('precio')),precio_oferta:f.get('precio_oferta')===''?null:Number(f.get('precio_oferta')),estado:f.get('estado'),stock:Number(f.get('stock')),condicion_figura:emptyNull(f.get('condicion_figura')),condicion_caja:emptyNull(f.get('condicion_caja')),procedencia:emptyNull(f.get('procedencia')),entrega:emptyNull(f.get('entrega')),destacada:f.get('destacada')==='on',activo:f.get('activo')==='on'};
 if(obj.precio_oferta!==null&&obj.precio_oferta>=obj.precio){msg.textContent='El precio de oferta debe ser menor que el precio normal.';msg.className='formMessage error';return}
 msg.textContent='Guardando…'; const q=id?supabaseClient.from('productos').update(obj).eq('id',id):supabaseClient.from('productos').insert(obj); const {error}=await q;
 if(error){msg.textContent=error.code==='23505'?'Ya existe un producto con ese SKU.':error.message;msg.className='formMessage error';return}
 renderAdminPanel();await loadAdminProducts();
}
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
