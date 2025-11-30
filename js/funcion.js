const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));

    const storageKey = 'shopintime_stores';
    const sessionKey = 'shopintime_session';

    const state = {
      selectedTemplate: 1,
      themeColor: '#5b82f5',
      fontFamily: 'Inter',
      storeDraft: { products: [] },
      adminFilter: 'all',
      activeStoreId: null,
      cart: [],
    };

    function slugify(str){
      return (str||'').toString().toLowerCase().trim()
        .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
        .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)+/g,'');
    }

    function fmt(n){ return new Intl.NumberFormat('es-PE',{style:'currency', currency:'PEN'}).format(+n||0) }
    function todayISO(){ return new Date().toISOString() }

    function loadStores(){
      try { return JSON.parse(localStorage.getItem(storageKey) || '[]') } catch(e){ return [] }
    }
    function saveStores(stores){ localStorage.setItem(storageKey, JSON.stringify(stores)) }

    function loadSession(){
      try { return JSON.parse(localStorage.getItem(sessionKey) || '{}') } catch(e){ return {} }
    }
    function saveSession(s){ localStorage.setItem(sessionKey, JSON.stringify(s)) }

    function getStoreById(id){ return loadStores().find(s=>s.id===id) }
    function updateStore(updated){
      const stores = loadStores().map(s=> s.id===updated.id? updated : s);
      saveStores(stores);
    }

    function refreshHomeKPIs(){
      const stores = loadStores();
      $('#kpiStores').textContent = stores.length;
      const sales = stores.flatMap(s=>s.sales||[]);
      const sum = sales.reduce((a,b)=>a+(b.total||0),0);
      $('#kpiSales').textContent = sales.length;
      $('#kpiRevenue').textContent = fmt(sum);
      const products = stores.flatMap(s=>s.products||[]);
      $('#kpiProducts').textContent = products.length;
    }

    function switchView(id){
      $$('main').forEach(m=>m.classList.add('hidden'));
      const targetId = id.startsWith('view-') ? id : `view-${id}`;
      const el = document.getElementById(targetId);
      if(el) el.classList.remove('hidden');
      if(targetId==='view-home') refreshHomeKPIs();
      if(targetId==='view-admin') renderAdminList();
      if(targetId==='view-shop') renderShop();
    }
    $$('header .role-switch .btn').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const role = btn.getAttribute('data-role');
        if(role==='home') switchView('view-home');
        if(role==='client') switchView('view-client');
        if(role==='final') switchView('view-shop');
        if(role==='admin') switchView('view-admin');
      })
    })

    const templates = [
      {id:1, name:'Plantilla 1', desc:'Encabezado sólido', class:'tpl-1'},
      {id:2, name:'Plantilla 2', desc:'Título con gradiente', class:'tpl-2'},
      {id:3, name:'Plantilla 3', desc:'Encabezado oscuro', class:'tpl-3'},
    ];

    function renderTplGallery(){
      const g = $('#tplGallery');
      g.innerHTML = '';
      templates.forEach(t=>{
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
          <div class="template-preview ${t.class}"></div>
          <div class="spaced" style="margin-top:8px">
            <div>
              <div style="font-weight:700">${t.name}</div>
              <div class="label">${t.desc}</div>
            </div>
            <button class="btn small ${state.selectedTemplate===t.id?'primary':''}" onclick="selectTemplate(${t.id})">${state.selectedTemplate===t.id?'Seleccionado':'Elegir'}</button>
          </div>`;
        g.appendChild(card);
      })
    }
    function selectTemplate(id){ state.selectedTemplate = id; renderTplGallery() }

    $('#themeColor').addEventListener('input', e=>{ state.themeColor = e.target.value; updateSlugPreview() })
    $('#fontFamily').addEventListener('change', e=>{ state.fontFamily = e.target.value; updateSlugPreview() })
    $('#storeName').addEventListener('input', updateSlugPreview)

    function updateSlugPreview(){
      const name = $('#storeName').value || '[nombre-de-tienda]';
      const slug = slugify(name);
      $('#slugPreview').textContent = `shopintime.${slug||'[nombre-de-tienda]'}`;
    }

    function goNext(nextId){ document.getElementById(nextId).scrollIntoView({behavior:'smooth'}) }

    function clearProductForm(){
      ['prodFoto','prodNombre','prodDesc','prodPrecio','prodStock'].forEach(id=>$('#'+id).value='')
    }

    function addProduct(){
      const foto=$('#prodFoto').value, nombre=$('#prodNombre').value, desc=$('#prodDesc').value;
      const precio=parseFloat($('#prodPrecio').value||'0');
      const stock=parseInt($('#prodStock').value||'0',10);
      if(!nombre){ alert('Ingresa al menos el nombre del producto'); return }
      state.storeDraft.products.push({id:crypto.randomUUID(), foto, nombre, desc, precio, stock});
      renderProductList(); clearProductForm();
    }

    function removeProduct(id){
      state.storeDraft.products = state.storeDraft.products.filter(p=>p.id!==id);
      renderProductList();
    }

    function renderProductList(){
      const wrap = $('#productsList');
      wrap.innerHTML='';
      state.storeDraft.products.forEach(p=>{
        const card=document.createElement('div');
        card.className='product';
        card.innerHTML=`
          <img src="${p.foto||'https://picsum.photos/seed/'+encodeURIComponent(p.nombre)+'/300/200'}" alt="${p.nombre}">
          <div class="pinfo">
            <div style="font-weight:700">${p.nombre}</div>
            <div class="label">${p.desc||''}</div>
            <div class="spaced" style="margin-top:6px">
              <span class="chip">${fmt(p.precio)}</span>
              <span class="tag">Stock: ${p.stock}</span>
            </div>
            <div class="flex" style="margin-top:8px">
              <button class="btn small danger" onclick="removeProduct('${p.id}')">Eliminar</button>
            </div>
          </div>`;
        wrap.appendChild(card);
      })
    }

    function finishStoreSetup(){
      const name=$('#storeName').value.trim();
      if(!name){ alert('Escribe el nombre de la tienda'); return }
      if(!$('#aceptoPlan').checked){ alert('Debes aceptar el plan de pagos'); return }

      const slug = slugify(name);
      const company = {
        ruc: $('#ruc').value.trim(),
        razonSocial: $('#razonSocial').value.trim(),
        rubro: $('#rubro').value.trim(),
        direccionFiscal: $('#direccionFiscal').value.trim(),
        correo: $('#correo').value.trim(),
        representante: $('#representante').value.trim(),
        telefono: $('#telefono').value.trim(),
        whatsapp: $('#whatsapp').value.trim(),
      };
      const brand = {
        historia: $('#historia').value.trim(), slogan: $('#slogan').value.trim(),
        redes:{ facebook:$('#facebook').value.trim(), instagram:$('#instagram').value.trim(), tiktok:$('#tiktok').value.trim() },
        metodos:{ tarjeta:$('#pagoTarjeta').checked, yape:$('#pagoYape').checked, transfer:$('#pagoTransfer').checked, contra:$('#pagoContra').checked }
      };

      const store = {
        id: crypto.randomUUID(),
        name, slug,
        templateId: state.selectedTemplate,
        themeColor: state.themeColor,
        fontFamily: state.fontFamily,
        createdAt: todayISO(),
        company, brand,
        products: state.storeDraft.products.slice(),
        sales: [],
        status: 'active',
        lastActive: todayISO(),
      };
      const stores = loadStores();
      stores.push(store); saveStores(stores);
      state.activeStoreId = store.id; saveSession({role:'client', storeId:store.id});
      alert('¡Tu tienda ha sido creada!');
      updateClientReport(store);
      $('#tiendaLink').textContent = `shopintime.${store.slug}`;
      $('#tiendaLink').onclick = ()=>openStorePublic(store.id);
      switchView('view-shop');
    }

    function updateClientReport(store){
      $('#tiendaVentas').textContent = (store.sales||[]).length;
      const ingresos = (store.sales||[]).reduce((a,s)=>a+s.total,0);
      $('#tiendaIngresos').textContent = fmt(ingresos);
      const inventario = (store.products||[]).reduce((a,p)=>a+(p.precio||0)*(p.stock||0),0);
      $('#tiendaInventario').textContent = fmt(inventario);
      $('#tiendaSocioDesde').textContent = new Date(store.createdAt).toLocaleDateString('es-PE');

      const tbV = $('#tablaVentas tbody'); tbV.innerHTML='';
      store.sales.forEach(s=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${new Date(s.date).toLocaleString('es-PE')}</td><td>${s.customerName||'-'}</td><td>${s.phone||'-'}</td><td>${s.total.toFixed(2)}</td>`;
        tbV.appendChild(tr);
      })

      const tbI = $('#tablaInventario tbody'); tbI.innerHTML='';
      store.products.forEach(p=>{
        const sub=(p.precio||0)*(p.stock||0);
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${p.nombre}</td><td>${fmt(p.precio)}</td><td>${p.stock}</td><td>${fmt(sub)}</td>`;
        tbI.appendChild(tr);
      })
    }

    function openStorePublic(id){ state.activeStoreId=id; saveSession({role:'final', storeId:id}); renderShop(); switchView('view-shop') }

    function applyShopTheme(store){
      const root = $('#shopRoot');
      const tpl = templates.find(t=>t.id===store.templateId)?.class || 'tpl-1';
      root.className = `card ${tpl}`;
      root.style.setProperty('--primary', store.themeColor||'#5b82f5');
      root.style.fontFamily = (store.fontFamily||'Inter')+", sans-serif";
    }

    function renderShop(){
      const sess = loadSession();
      const storeId = state.activeStoreId || sess.storeId || (loadStores()[0]?.id);
      if(!storeId){ $('#shopProducts').innerHTML='<div class="center" style="padding:24px">No hay tiendas. Crea una desde Cliente Empresa.</div>'; return }
      const store = getStoreById(storeId);
      state.activeStoreId = storeId;
      $('#shopTitle').textContent = store.name;
      applyShopTheme(store);
      const grid = $('#shopProducts');
      grid.innerHTML='';
      (store.products||[]).forEach(p=>{
        const card=document.createElement('div'); card.className='product';
        card.innerHTML=`
          <img src="${p.foto||'https://picsum.photos/seed/'+encodeURIComponent(p.nombre)+'/400/300'}" alt="${p.nombre}">
          <div class="pinfo">
            <div style="font-weight:700">${p.nombre}</div>
            <div class="label">${p.desc||''}</div>
            <div class="spaced" style="margin-top:6px">
              <span class="chip">${fmt(p.precio)}</span>
              <button class="btn small" onclick='addToCart(${JSON.stringify({id:p.id, nombre:p.nombre, precio:p.precio, foto:p.foto}).replace(/"/g,"&quot;")})'>Añadir</button>
            </div>
          </div>`; grid.appendChild(card);
      })
      updateCartCount();
    }

    function addToCart(item){
      const existing = state.cart.find(i=>i.id===item.id);
      if(existing) existing.qty += 1; else state.cart.push({...item, qty:1});
      updateCartCount();
    }

    function updateCartCount(){
      const count = state.cart.reduce((a,b)=>a+b.qty,0); $('#cartCount').textContent=count;
    }

    function openCart(){
      $('#modalCart').classList.add('open');
      const sess = loadSession();
      if(sess.customerEmail){ $('#cartLogin').classList.add('hidden'); $('#cartBody').classList.remove('hidden'); renderCart(); }
      else { $('#cartLogin').classList.remove('hidden'); $('#cartBody').classList.add('hidden'); }
    }
    function closeModal(id){ $('#'+id).classList.remove('open') }

    function customerLogin(){
      const nombre=$('#cNombre').value.trim();
      const correo=$('#cCorreo').value.trim();
      const pass=$('#cPass').value.trim();
      if(!nombre||!correo||!pass){ alert('Completa tus datos'); return }
      const sess = loadSession();
      saveSession({...sess, customerEmail:correo, customerName:nombre});
      $('#cartLogin').classList.add('hidden'); $('#cartBody').classList.remove('hidden');
      renderCart();
    }

    function renderCart(){
      const wrap = $('#cartItems'); wrap.innerHTML='';
      if(state.cart.length===0){ wrap.innerHTML='<div class="label">Tu carrito está vacío</div>'; $('#cartTotal').textContent = fmt(0); return }
      state.cart.forEach(i=>{
        const row=document.createElement('div'); row.className='spaced'; row.style.margin='8px 0';
        row.innerHTML=`
          <div class="flex" style="gap:10px">
            <img src="${i.foto||'https://picsum.photos/seed/'+encodeURIComponent(i.nombre)+'/80/60'}" style="width:64px;height:48px;border-radius:8px;object-fit:cover"/>
            <div><div style="font-weight:700">${i.nombre}</div><div class="label">${fmt(i.precio)}</div></div>
          </div>
          <div class="flex" style="gap:6px">
            <button class="btn small" onclick="decQty('${i.id}')">-</button>
            <span class="chip">${i.qty}</span>
            <button class="btn small" onclick="incQty('${i.id}')">+</button>
          </div>`;
        wrap.appendChild(row);
      })
      const total = state.cart.reduce((a,b)=>a+b.precio*b.qty,0);
      $('#cartTotal').textContent = fmt(total);
    }
    function incQty(id){ const it=state.cart.find(i=>i.id===id); it.qty++; renderCart(); updateCartCount() }
    function decQty(id){ const it=state.cart.find(i=>i.id===id); it.qty=Math.max(0,it.qty-1); if(it.qty===0) state.cart=state.cart.filter(x=>x.id!==id); renderCart(); updateCartCount() }

    function openPayment(){
      $('#modalPayment').classList.add('open');
      const store=getStoreById(state.activeStoreId);
      const pm=$('#paymentMethods'); pm.innerHTML='';
      const methods=[];
      if(store.brand?.metodos?.tarjeta) methods.push('Tarjeta');
      if(store.brand?.metodos?.yape) methods.push('Yape/Plin');
      if(store.brand?.metodos?.transfer) methods.push('Transferencia');
      if(store.brand?.metodos?.contra) methods.push('Contraentrega');
      if(methods.length===0) methods.push('(Sin métodos configurados)');
      methods.forEach(m=>{
        const div=document.createElement('div');div.className='kpi';div.textContent=m; pm.appendChild(div);
      })
    }

    function confirmCheckout(){
      const sess=loadSession(); if(!sess.customerEmail){ alert('Debes iniciar sesión'); return }
      const store=getStoreById(state.activeStoreId);
      const total=state.cart.reduce((a,b)=>a+b.precio*b.qty,0);
      if(total<=0){ alert('Carrito vacío'); return }
      const sale={ id:crypto.randomUUID(), date: todayISO(), customerName: sess.customerName||'(Cliente)', phone:'-', items: state.cart.slice(), total };
      store.sales.push(sale); store.lastActive = todayISO(); updateStore(store);
      state.cart=[]; updateCartCount(); closeModal('modalPayment'); closeModal('modalCart');
      alert('¡Pago confirmado! Gracias por tu compra.');
      updateClientReport(store);
    }

    function setAdminFilter(f){ state.adminFilter=f; renderAdminList() }

    function renderAdminList(){
      const q = ($('#adminSearch')?.value||'').toLowerCase();
      const list = $('#adminStores'); list.innerHTML='';
      const stores = loadStores();
      const now = Date.now();
      let filtered = stores;
      if(state.adminFilter==='active') filtered = stores.filter(s=> (now - new Date(s.lastActive).getTime()) < 7*24*3600*1000 );
      if(state.adminFilter==='low') filtered = stores.filter(s=> (s.sales||[]).every(v=> (now - new Date(v.date).getTime()) > 14*24*3600*1000 ) );
      filtered = filtered.filter(s=> s.name.toLowerCase().includes(q) || s.slug.includes(q));
      filtered.forEach(s=>{
        const card=document.createElement('div'); card.className='card';
        const tpl = templates.find(t=>t.id===s.templateId)?.id || '-';
        const products = (s.products||[]).length;
        const ventas = (s.sales||[]).length;
        const since = new Date(s.createdAt).toLocaleDateString('es-PE');
        card.innerHTML=`
          <div class="spaced">
            <div>
              <div style="font-weight:800">${s.name}</div>
              <div class="label">Slug: shopintime.${s.slug}</div>
            </div>
            <button class="btn small" onclick="openStorePublic('${s.id}')">Abrir</button>
          </div>
          <div class="grid grid-2" style="margin-top:10px">
            <div>
              <div class="label">Plantilla</div><div class="chip">${tpl}</div>
            </div>
            <div>
              <div class="label">Color</div><div class="chip" style="background:${s.themeColor}; border-color:transparent">${s.themeColor}</div>
            </div>
            <div>
              <div class="label">Tipografía</div><div class="chip">${s.fontFamily}</div>
            </div>
            <div>
              <div class="label">Productos</div><div class="chip">${products}</div>
            </div>
            <div>
              <div class="label">Ventas</div><div class="chip">${ventas}</div>
            </div>
            <div>
              <div class="label">Registro</div><div class="chip">${since}</div>
            </div>
          </div>`;
        list.appendChild(card);
      })
      buildAdminReport(stores);
    }

    function monthsBetween(startISO){
      const start=new Date(startISO); const now=new Date();
      let months = (now.getFullYear()-start.getFullYear())*12 + (now.getMonth()-start.getMonth());
      if(now.getDate()>=start.getDate()) months += 1;
      return Math.max(months,1);
    }

    function feeForMonthIndex(m){
      if(m===1) return 5; if(m===2) return 10; return 20;
    }

    function calcTotalFee(startISO){
      const n=monthsBetween(startISO); let sum=0; for(let i=1;i<=n;i++) sum+=feeForMonthIndex(i); return sum;
    }

    function buildAdminReport(stores){
      const tbody=$('#adminReportTable tbody'); tbody.innerHTML='';
      stores.forEach(s=>{
        const tr=document.createElement('tr');
        tr.innerHTML=`<td>${s.name}</td><td>${monthsBetween(s.createdAt)}</td><td>${fmt(calcTotalFee(s.createdAt))}</td><td>${new Date(s.createdAt).toLocaleDateString('es-PE')}</td>`;
        tbody.appendChild(tr);
      })
    }

    function showAdminReport(){ document.getElementById('adminReportTable').scrollIntoView({behavior:'smooth'}) }

    renderTplGallery();
    refreshHomeKPIs();
    const sess = loadSession(); if(sess.storeId){ state.activeStoreId = sess.storeId }
    $('#tiendaLink').addEventListener('click', ()=>{ if(state.activeStoreId) { openStorePublic(state.activeStoreId) } });