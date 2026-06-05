const STORAGE_KEY   = 'rapipedidos_pedidos';
const PRODUCTS_KEY  = 'rapipedidos_productos';
const PROD_PER_PAGE = 4;
let prodPage = 1;
let carrito  = []; // [{producto, cantidad}]

// ── Productos de ejemplo (se usan si no hay nada en LS) ──
const defaultProductos = [
  { id: 1, nombre: 'Herramienta Industrial A',  precio: 120.00, descripcion: 'Alto rendimiento profesional',     stock: 15, emoji: '🔧' },
  { id: 2, nombre: 'Componente Electrónico B',  precio: 45.50,  descripcion: 'Sensor de precisión avanzado',     stock: 42, emoji: '🔌' },
  { id: 3, nombre: 'Material Construcción C',   precio: 15.00,  descripcion: 'Mezcla reforzada estructural',     stock: 100, emoji: '🧱' },
  { id: 4, nombre: 'Lubricante Sintético D',    precio: 32.00,  descripcion: 'Especializado maquinaria pesada',  stock: 24, emoji: '🛢️' },
  { id: 5, nombre: 'Válvula Hidráulica E',      precio: 89.00,  descripcion: 'Alta presión certificada',         stock: 8,  emoji: '⚙️' },
  { id: 6, nombre: 'Cable Estructural F',       precio: 22.00,  descripcion: 'Acero galvanizado 6mm',            stock: 200, emoji: '🪝' },
];

function getProductos() {
  const raw = localStorage.getItem(PRODUCTS_KEY);
  return raw ? JSON.parse(raw) : defaultProductos;
}

function getPedidos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function savePedidos(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId() {
  const pedidos = getPedidos();
  return pedidos.length ? Math.max(...pedidos.map(p => p.id)) + 1 : 10000;
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = `<i class="ti ti-circle-check"></i> ${msg}`;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── PRODUCTOS ──
function getFiltered() {
  const q = document.getElementById('productSearch').value.toLowerCase();
  return getProductos().filter(p => p.nombre.toLowerCase().includes(q) || p.descripcion.toLowerCase().includes(q));
}

function renderProductos() {
  const filtered = getFiltered();
  const pages = Math.ceil(filtered.length / PROD_PER_PAGE) || 1;
  if (prodPage > pages) prodPage = 1;
  const slice = filtered.slice((prodPage-1)*PROD_PER_PAGE, prodPage*PROD_PER_PAGE);

  const tbody = document.getElementById('prodTableBody');
  tbody.innerHTML = slice.map(p => {
    const enCarrito = carrito.find(c => c.producto.id === p.id);
    const disabled  = p.stock === 0 || enCarrito ? 'disabled' : '';
    return `
      <tr>
        <td><div class="prod-img">📦</div></td>
        <td class="prod-name">${p.nombre}</td>
        <td class="prod-price">$${p.precio.toFixed(2)}</td>
        <td class="prod-desc">${p.descripcion}</td>
        <td class="prod-stock">${p.stock}</td>
        <td><button class="btn-add" onclick="agregarProducto(${p.id})" ${disabled}>${enCarrito ? 'Añadido' : 'Añadir'}</button></td>
      </tr>`;
  }).join('');

  // Paginación
  const pag = document.getElementById('prodPagination');
  let html = `<button class="pag-btn" onclick="prodGoPage(${prodPage-1})" ${prodPage===1?'disabled':''}><i class="ti ti-chevron-left"></i></button>`;
  for (let i=1;i<=pages;i++) html += `<button class="pag-btn${i===prodPage?' active':''}" onclick="prodGoPage(${i})">${i}</button>`;
  html += `<button class="pag-btn" onclick="prodGoPage(${prodPage+1})" ${prodPage===pages?'disabled':''}><i class="ti ti-chevron-right"></i></button>`;
  pag.innerHTML = html;
}

function prodGoPage(n) {
  const pages = Math.ceil(getFiltered().length / PROD_PER_PAGE) || 1;
  if (n < 1 || n > pages) return;
  prodPage = n;
  renderProductos();
}

// ── CARRITO ──
function agregarProducto(id) {
  const prod = getProductos().find(p => p.id === id);
  if (!prod || carrito.find(c => c.producto.id === id)) return;
  carrito.push({ producto: prod, cantidad: 1 });
  renderProductos();
  renderCarrito();
  showToast(`"${prod.nombre}" añadido`);
}

function quitarProducto(id) {
if (!confirm('¿Eliminar este producto?')) return;
  carrito = carrito.filter(c => c.producto.id !== id);
  renderProductos();
  renderCarrito();
}

function renderCarrito() {
  const tbody = document.getElementById('addedTableBody');
  if (!carrito.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-added"><i class="ti ti-shopping-cart-off" style="font-size:24px;display:block;margin-bottom:6px;"></i>Sin productos añadidos</td></tr>`;
    return;
  }
  tbody.innerHTML = carrito.map(c => `
    <tr>
      <td><div class="prod-img">${c.producto.emoji}</div></td>
      <td class="prod-name">${c.producto.nombre}</td>
      <td class="prod-price">$${c.producto.precio.toFixed(2)}</td>
      <td><input class="qty-input" type="number" min="1" max="${c.producto.stock}" value="${c.cantidad}" onchange="updateCantidad(${c.producto.id}, this.value)"></td>
      <td><button class="btn-remove" onclick="quitarProducto(${c.producto.id})"><i class="ti ti-trash"></i> Eliminar</button></td>
    </tr>`).join('');
}

function updateCantidad(id, val) {
  const item = carrito.find(c => c.producto.id === id);
  if (!item) return;
  const n = Math.max(1, Math.min(parseInt(val) || 1, item.producto.stock));
  item.cantidad = n;
}

// ── CONFIRMAR ──
function confirmarPedido() {
  const nombre    = document.getElementById('clienteNombre').value.trim();
  const correo    = document.getElementById('clienteCorreo').value.trim();
  const telefono  = document.getElementById('clienteTelefono').value.trim();
  const direccion = document.getElementById('clienteDireccion').value.trim();

  if (!nombre || !direccion) {
    alert('El nombre del cliente y la dirección son obligatorios.');
    return;
  }
  if (!carrito.length) {
    alert('Añadí al menos un producto al pedido.');
    return;
  }

  const total = carrito.reduce((sum, c) => sum + c.producto.precio * c.cantidad, 0);
  const cant  = carrito.reduce((sum, c) => sum + c.cantidad, 0);

  const pedidos = getPedidos();
  pedidos.unshift({
    id: nextId(),
    cliente: nombre,
    correo,
    telefono,
    direccion,
    cant,
    total,
    fecha: new Date().toISOString().slice(0, 16),
    estado: 'Pendiente',
    productos: carrito.map(c => ({ id: c.producto.id, nombre: c.producto.nombre, precio: c.producto.precio, cantidad: c.cantidad, emoji: c.producto.emoji }))
  });
  savePedidos(pedidos);

  showToast('Pedido confirmado correctamente');
  setTimeout(() => location.href = '../dashboard/dash.html', 1800);
}

// ── Cerrar sesión ──
document.querySelector('.btn-exit').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  location.href = '../../index.html';
});

// ── Init ──
renderProductos();
renderCarrito();