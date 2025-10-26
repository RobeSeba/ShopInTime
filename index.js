/* ===================== Estado & utilidades ===================== */
    const $ = sel => document.querySelector(sel);
    const $$ = sel => Array.from(document.querySelectorAll(sel));

    const KEYS = {
      STORES: 'sit_stores',
      CART: 'sit_cart',
      SESSION: 'sit_session',
    };

    const money = n => new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN'}).format(+n||0);

    const uid = (prefix='C') => {
      const rand = Math.random().toString(36).slice(2,7).toUpperCase();
      const ts = Date.now().toString().slice(-5);
      return `${prefix}-${ts}${rand}`; // A-12345X8YZ
    };

    /* ===================== Datos de ejemplo (si no hay registros) ===================== */
    const defaultStores = [
      {
        id:'s-1', name:'TecnoPlus',
        img:'https://images.unsplash.com/photo-1518444028785-36397a1ccb30?q=80&w=1200',
        products:[
          {id:'p-1', name:'Auriculares Pro', price:129.9, img:'https://images.unsplash.com/photo-1518444028785-36397a1ccb30?q=80&w=800'},
          {id:'p-2', name:'Parlante Bluetooth', price:199.0, img:'https://images.unsplash.com/photo-1546443046-ed1ce6ffd1dc?q=80&w=800'},
          {id:'p-3', name:'Reloj Inteligente', price:149.5, img:'https://images.unsplash.com/photo-1511732351157-1865efcb7b7b?q=80&w=800'}
        ]
      },
      {
        id:'s-2', name:'Casa & Deco',
        img:'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200',
        products:[
          {id:'p-4', name:'Lámpara de mesa', price:79.9, img:'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=800'},
          {id:'p-5', name:'Alfombra Boho', price:249.0, img:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800'},
          {id:'p-6', name:'Espejo Pared', price:189.0, img:'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800'}
        ]
      },
      {
        id:'s-3', name:'Sports One',
        img:'https://images.unsplash.com/photo-1521417531039-56b7e3b72c8f?q=80&w=1200',
        products:[
          {id:'p-7', name:'Zapatillas Running', price:299.0, img:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800'},
          {id:'p-8', name:'Polera Training', price:119.0, img:'https://images.unsplash.com/photo-1521417531039-56b7e3b72c8f?q=80&w=800'},
          {id:'p-9', name:'Botella Térmica', price:69.0, img:'https://images.unsplash.com/photo-1512295767273-ac109ac3acfa?q=80&w=800'}
        ]
      }
    ];

    const loadJSON = (k, fallback) => { try{ return JSON.parse(localStorage.getItem(k) || JSON.stringify(fallback)) }catch(e){ return fallback } };
    const saveJSON = (k, v) => localStorage.setItem(k, JSON.stringify(v));

    function ensureSeed(){
      const stores = loadJSON(KEYS.STORES, null);
      if(!stores || !Array.isArray(stores) || stores.length===0){
        saveJSON(KEYS.STORES, defaultStores);
      }
    }

    /* ===================== Tabs ===================== */
    function switchTab(id){
      $$('.panel').forEach(p=>p.classList.remove('active'));
      $(`#${id}`).classList.add('active');
      $$('.tab').forEach(t=>t.removeAttribute('aria-current'));
      const tabBtn = $(`.tab[aria-controls="${id}"]`);
      if(tabBtn) tabBtn.setAttribute('aria-current','page');
    }

    $('#tab-home').addEventListener('click', ()=>switchTab('panel-home'));
    $('#tab-cart').addEventListener('click', ()=>switchTab('panel-cart'));
    $('#tab-login').addEventListener('click', ()=>switchTab('panel-login'));

    /* ===================== Carousel ===================== */
    const track = $('#carouselTrack');
    let slideIndex = 0;
    function goSlide(i){
      const total = track.children.length; slideIndex = (i+total)%total;
      track.style.transform = `translateX(-${slideIndex*100}%)`;
    }
    $('.carousel .prev').addEventListener('click', ()=>goSlide(slideIndex-1));
    $('.carousel .next').addEventListener('click', ()=>goSlide(slideIndex+1));
    setInterval(()=>goSlide(slideIndex+1), 6000);

    /* ===================== Listado de tiendas ===================== */
    function renderStores(){
      const stores = loadJSON(KEYS.STORES, []);
      $('#storesCount').textContent = `${stores.length} tiendas`;
      const grid = $('#storesGrid'); grid.innerHTML='';
      stores.forEach(s=>{
        const el = document.createElement('div'); el.className='store-card';
        el.innerHTML = `
          <img src="${s.img}" alt="${s.name}">
          <div class="pinfo">
            <div class="title">${s.name}</div>
            <div style="margin-top:8px; display:flex; gap:8px">
              <button class="btn small" data-open-store="${s.id}">Ver más</button>
            </div>
          </div>`;
        grid.appendChild(el);
      });
      // modal listado
      const modalGrid = $('#modalStores'); modalGrid.innerHTML='';
      stores.forEach(s=>{
        const el = document.createElement('div'); el.className='store-card';
        el.innerHTML = `
          <img src="${s.img}" alt="${s.name}">
          <div class="pinfo">
            <div class="title">${s.name}</div>
            <button class="btn small" data-open-store="${s.id}">Abrir</button>
          </div>`;
        modalGrid.appendChild(el);
      });
      // bind
      $$('[data-open-store]').forEach(btn=>btn.addEventListener('click', (e)=>{
        const id = e.currentTarget.getAttribute('data-open-store');
        openStore(id);
      }));
    }

    function openStore(storeId){
      const stores = loadJSON(KEYS.STORES, []);
      const s = stores.find(x=>x.id===storeId); if(!s) return;
      $('#storesView').classList.add('hidden');
      $('#storeCatalog').classList.remove('hidden');
      $('#storeTitle').textContent = s.name;
      const grid = $('#productsGrid'); grid.innerHTML='';
      (s.products||[]).forEach(p=>{
        const card = document.createElement('div'); card.className='product';
        card.innerHTML = `
          <img src="${p.img}" alt="${p.name}">
          <div class="pinfo">
            <div style="font-weight:700">${p.name}</div>
            <div style="margin-top:6px" class="row">
              <span class="chip">${money(p.price)}</span>
              <button class="btn small" data-add='${JSON.stringify({sid:s.id, pid:p.id})}'>Añadir</button>
            </div>
          </div>`;
        grid.appendChild(card);
      });
      $$('[data-add]').forEach(b=>b.addEventListener('click', e=>{
        const {sid,pid} = JSON.parse(e.currentTarget.getAttribute('data-add'));
        addToCart(sid,pid);
      }));
      updateCartCount();
      switchTab('panel-home');
    }

    $('#btnBackStores').addEventListener('click', ()=>{
      $('#storeCatalog').classList.add('hidden');
      $('#storesView').classList.remove('hidden');
    });

    /* ===================== Buscar productos ===================== */
    $('#btnSearch').addEventListener('click', ()=>{
      const q = ($('#searchInput').value||'').toLowerCase().trim();
      const stores = loadJSON(KEYS.STORES, []);
      const results = [];
      stores.forEach(s=> (s.products||[]).forEach(p=>{ if(p.name.toLowerCase().includes(q)) results.push({s,p}); }));
      // Mostrar en el catálogo como resultados agregados
      $('#storeTitle').textContent = q?`Resultados para "${q}"`:'Resultados';
      const grid = $('#productsGrid'); grid.innerHTML='';
      results.forEach(({s,p})=>{
        const card = document.createElement('div'); card.className='product';
        card.innerHTML = `
          <img src="${p.img}" alt="${p.name}">
          <div class="pinfo">
            <div style="font-weight:700">${p.name}</div>
            <div class="label">${s.name}</div>
            <div style="margin-top:6px" class="row">
              <span class="chip">${money(p.price)}</span>
              <button class="btn small" data-add='${JSON.stringify({sid:s.id, pid:p.id})}'>Añadir</button>
            </div>
          </div>`;
        grid.appendChild(card);
      });
      $('#storesView').classList.add('hidden');
      $('#storeCatalog').classList.remove('hidden');
      $$('[data-add]').forEach(b=>b.addEventListener('click', e=>{
        const {sid,pid} = JSON.parse(e.currentTarget.getAttribute('data-add'));
        addToCart(sid,pid);
      }));
      updateCartCount();
    });

    $('#btnClear').addEventListener('click', ()=>{ $('#searchInput').value=''; $('#btnBackStores').click(); });

    /* ===================== Modal tiendas ===================== */
    $('#btnTiendas').addEventListener('click', ()=>{ $('#modalTiendas').classList.add('open'); });
    $('#btnCloseModal').addEventListener('click', ()=>{ $('#modalTiendas').classList.remove('open'); });

    /* ===================== Carrito ===================== */
    function getCart(){ return loadJSON(KEYS.CART, []); }
    function setCart(c){ saveJSON(KEYS.CART, c); renderCartPanel(); updateCartCount(); }

    function addToCart(storeId, productId){
      const stores = loadJSON(KEYS.STORES, []);
      const s = stores.find(x=>x.id===storeId); if(!s) return;
      const p = (s.products||[]).find(x=>x.id===productId); if(!p) return;
      const cart = getCart();
      const key = `${storeId}:${productId}`;
      const found = cart.find(i=>i.key===key);
      if(found) found.qty += 1; else cart.push({ key, storeId, productId, name:p.name, price:p.price, img:p.img, qty:1 });
      setCart(cart);
    }

    function updateCartCount(){
      const count = getCart().reduce((a,b)=>a+b.qty,0);
      $('#cartCount').textContent = count;
    }

    function renderCartPanel(){
      const wrap = $('#cartItems'); wrap.innerHTML='';
      const cart = getCart();
      if(cart.length===0){ wrap.innerHTML = '<div class="label">Tu carrito está vacío</div>'; $('#cartTotal').textContent = 'S/ 0.00'; return; }
      cart.forEach(i=>{
        const row = document.createElement('div'); row.className='row'; row.style.margin='8px 0';
        row.innerHTML = `
          <div style="display:flex; gap:10px; align-items:center">
            <img src="${i.img}" style="width:64px;height:48px;border-radius:8px;object-fit:cover"/>
            <div>
              <div style="font-weight:700">${i.name}</div>
              <div class="label">${money(i.price)}</div>
            </div>
          </div>
          <div style="display:flex; gap:6px; align-items:center">
            <button class="btn small" data-dec="${i.key}">-</button>
            <span class="chip">${i.qty}</span>
            <button class="btn small" data-inc="${i.key}">+</button>
            <button class="btn small" data-del="${i.key}">✕</button>
          </div>`;
        wrap.appendChild(row);
      });
      const total = cart.reduce((a,b)=>a+b.price*b.qty,0);
      $('#cartTotal').textContent = money(total);

      $$('[data-inc]').forEach(b=>b.addEventListener('click', e=>modQty(e.currentTarget.getAttribute('data-inc'), +1)));
      $$('[data-dec]').forEach(b=>b.addEventListener('click', e=>modQty(e.currentTarget.getAttribute('data-dec'), -1)));
      $$('[data-del]').forEach(b=>b.addEventListener('click', e=>delItem(e.currentTarget.getAttribute('data-del'))));
    }

    function modQty(key, delta){
      const cart = getCart();
      const it = cart.find(i=>i.key===key); if(!it) return;
      it.qty = Math.max(0, it.qty + delta);
      const next = it.qty===0? cart.filter(i=>i.key!==key) : cart;
      setCart(next);
    }
    function delItem(key){ setCart(getCart().filter(i=>i.key!==key)); }

    $('#btnVaciar').addEventListener('click', ()=> setCart([]));
    $('#btnOpenCart').addEventListener('click', ()=> switchTab('panel-cart'));
    $('#btnGoLogin').addEventListener('click', ()=> switchTab('panel-login'));

    /* ===================== Sesión + IDs (A/E/C) ===================== */
    function loadSession(){ return loadJSON(KEYS.SESSION, {}); }
    function saveSession(s){ saveJSON(KEYS.SESSION, s); renderSession(); }

    function renderSession(){
      const s = loadSession();
      if(s.userId){ $('#sessionInfo').textContent = `Sesión: ${s.email} — ID: ${s.userId}`; }
      else { $('#sessionInfo').textContent = 'No has iniciado sesión'; }
    }

    $('#btnLogin').addEventListener('click', ()=>{
      const email = $('#loginEmail').value.trim();
      const pass = $('#loginPass').value.trim();
      const role = $('#loginRole').value; // 'A' | 'E' | 'C'
      if(!email || !pass){ alert('Completa tu correo y contraseña'); return }
      const id = uid(role); // genera ID con prefijo
      saveSession({ email, role, userId:id });
      alert(`Bienvenido: ${email}\nTu ID es: ${id}`);
    });

    $('#btnLogout').addEventListener('click', ()=>{ saveSession({}); });

    /* ===================== Init ===================== */
    ensureSeed();
    renderStores();
    renderCartPanel();
    renderSession();

    (function(){
  const tabLogin = document.getElementById('tab-login');
  const accountPanel = document.getElementById('accountPanel');
  const accountTitle = document.getElementById('account-title');
  const headerUser = document.getElementById('header-user');

  function renderLoggedOut(){
    // header
    headerUser.innerHTML = '';
    // nav
    tabLogin.textContent = 'Iniciar sesión';
    // panel
    accountTitle.textContent = 'Iniciar sesión';
    accountPanel.innerHTML = '<div class="chip" id="sessionInfo">No has iniciado sesión</div>';
  }

  function renderClientAccount(name, email){
    // header: muestra nombre pequeño
    headerUser.innerHTML = '<div><div style="font-weight:700">'+escapeHtml(name)+'</div><div class="small">'+escapeHtml(email)+'</div></div>';
    // nav
    tabLogin.textContent = 'Mi cuenta';
    // panel: mostrar datos y botones
    accountTitle.textContent = 'Mi cuenta';
    accountPanel.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:10px">
        <div><strong>Nombre:</strong> ${escapeHtml(name)}</div>
        <div><strong>Correo:</strong> ${escapeHtml(email)}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button id="btnLogout" class="btn account-btn">Cerrar sesión</button>
          <button id="btnDelete" class="btn account-btn" style="background:#b30000;color:#fff;border:none">Eliminar cuenta</button>
        </div>
      </div>
    `;
    // añadir listeners
    document.getElementById('btnLogout').addEventListener('click', () => {
      sessionStorage.clear();
      renderLoggedOut();
      // opcional: redirigir al login si quieres
      // location.href = 'login.html';
    });
    document.getElementById('btnDelete').addEventListener('click', () => {
      if(!confirm('¿Eliminar cuenta? Esta acción cerrará sesión y borrará los datos de la sesión.')) return;
      // En demo sólo borramos sessionStorage. En backend real habría petición.
      sessionStorage.clear();
      renderLoggedOut();
      alert('Cuenta eliminada (demo).');
    });
  }

  function escapeHtml(str){
    if(!str) return '';
    return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
  }

  // Cuando el usuario pulsa el nav "Mi cuenta"/"Iniciar sesión" queremos mostrar el panel correspondiente.
  tabLogin.addEventListener('click', (e) => {
    // activa el panel-login (mantén tu lógica de tabs si ya tienes una)
    // Aquí forzamos la visualización del panel-login
    document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
    document.getElementById('panel-login').classList.add('active');
  });

  // Inicializar vista según sessionStorage
  (function initAuthUI(){
    const role = sessionStorage.getItem('userRole');
    const name = sessionStorage.getItem('userName');
    const email = sessionStorage.getItem('userEmail');

    if(role === 'cliente'){
      renderClientAccount(name || 'Cliente', email || '');
      return;
    }
    // si está empresa o admin podemos mostrar diferente (no modificado aquí)
    renderLoggedOut();
  })();
})();