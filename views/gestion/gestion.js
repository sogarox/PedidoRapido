const PROD_KEY  = 'rapipedidos_productos';
const PER_PAGE  = 6;
let currentPage = 1;

const defaultProductos = [
  { id:1, nombre:'Café Premium Blend',  desc:'Tostado medio 500g',        precio:24.50, stock:45, img:'' },
  { id:2, nombre:'Termo Inox Pro',       desc:'Capacidad 1L Acero',        precio:32.00, stock:8,  img:'' },
  { id:3, nombre:'Caf Gourmet',          desc:'Origen único 250g',         precio:18.00, stock:52, img:'' },
  { id:4, nombre:'Prensa Francesa',      desc:'Vidrio Borosilicato',       precio:45.50, stock:3,  img:'' },
  { id:5, nombre:'Molino Manual',        desc:'Muelas de Cerámica',        precio:29.90, stock:15, img:'' },
  { id:6, nombre:'Taza Cerámica',        desc:'Mate Negro 350ml',          precio:12.00, stock:5,  img:'' },
  { id:7, nombre:'Filtros de Papel',     desc:'Pack x100 unidades',        precio:6.50,  stock:80, img:'' },
  { id:8, nombre:'Hervidor Eléctrico',   desc:'Control de temperatura',    precio:55.00, stock:12, img:'' },
];

function getProductos() {
  const raw = localStorage.getItem(PROD_KEY);
  return raw ? JSON.parse(raw) : defaultProductos;
}
function saveProductos(data) { localStorage.setItem(PROD_KEY, JSON.stringify(data)); }
function nextId() { const p = getProductos(); return p.length ? Math.max(...p.map(x=>x.id))+1 : 1; }

function showToast(msg) {
  const t = document.getElementById('toast');
  t.innerHTML = `<i class="ti ti-circle-check"></i> ${msg}`;
  t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 2200);
}

// IMG PREVIEW
function previewImg(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const prev = document.getElementById('imgPreview');
    prev.src = e.target.result;
    prev.style.display = 'block';
    document.querySelector('#uploadBox i').style.display = 'none';
    document.querySelector('#uploadBox span').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearForm() {
  document.getElementById('fNombre').value  = '';
  document.getElementById('fDesc').value    = '';
  document.getElementById('fPrecio').value  = '';
  document.getElementById('fStock').value   = '';
  document.getElementById('editingId').value = '';
  document.getElementById('imgPreview').style.display = 'none';
  document.getElementById('imgPreview').src = '';
  document.querySelector('#uploadBox i').style.display = '';
  document.querySelector('#uploadBox span').style.display = '';
  document.getElementById('imgInput').value = '';
  document.getElementById('formTitle').textContent = 'Nuevo Producto';
  document.getElementById('btnLabel').textContent   = 'Guardar Producto';
}

function guardarProducto() {
  const nombre = document.getElementById('fNombre').value.trim();
  const desc   = document.getElementById('fDesc').value.trim();
  const precio = parseFloat(document.getElementById('fPrecio').value);
  const stock  = parseInt(document.getElementById('fStock').value);
  const editId = document.getElementById('editingId').value;
  const imgSrc = document.getElementById('imgPreview').src || '';

  if (!nombre || isNaN(precio) || isNaN(stock)) { alert('Completá nombre, precio y stock.'); return; }

  let productos = getProductos();
  if (editId) {
    productos = productos.map(p => p.id === parseInt(editId) ? {...p, nombre, desc, precio, stock, img: imgSrc || p.img} : p);
    showToast('Producto actualizado');
  } else {
    productos.unshift({ id: nextId(), nombre, desc, precio, stock, img: imgSrc });
    showToast('Producto guardado');
  }
  saveProductos(productos);
  clearForm();
  currentPage = 1;
  render();
}

function editarProducto(id) {
  const p = getProductos().find(x => x.id === id);
  if (!p) return;
  document.getElementById('fNombre').value   = p.nombre;
  document.getElementById('fDesc').value     = p.desc;
  document.getElementById('fPrecio').value   = p.precio;
  document.getElementById('fStock').value    = p.stock;
  document.getElementById('editingId').value = p.id;
  document.getElementById('formTitle').textContent = 'Editar Producto';
  document.getElementById('btnLabel').textContent   = 'Actualizar Producto';
  if (p.img) {
    const prev = document.getElementById('imgPreview');
    prev.src = p.img;
    prev.style.display = 'block';
    document.querySelector('#uploadBox i').style.display = 'none';
    document.querySelector('#uploadBox span').style.display = 'none';
  }
  window.scrollTo({top:0, behavior:'smooth'});
}

function eliminarProducto(id) {
  if (!confirm('¿Eliminar este producto?')) return;
  saveProductos(getProductos().filter(p => p.id !== id));
  render();
  showToast('Producto eliminado');
}

function stockClass(s) {
  if (s > 20) return 'stock-high';
  if (s > 5)  return 'stock-mid';
  return 'stock-low';
}

function getFiltered() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  return getProductos().filter(p => p.nombre.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
}

function render() {
  const data  = getFiltered();
  const total = data.length;
  const pages = Math.ceil(total / PER_PAGE) || 1;
  if (currentPage > pages) currentPage = 1;
  const slice = data.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  document.getElementById('itemsBadge').textContent = `${total} item${total!==1?'s':''}`;

  const tbody = document.getElementById('tableBody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty"><i class="ti ti-package-off" style="font-size:26px;display:block;margin-bottom:8px;"></i>Sin productos</td></tr>`;
  } else {
    tbody.innerHTML = slice.map(p => `
      <tr>
        <td>
          <div class="prod-thumb">
            ${p.img ? `<img src="${p.img}" alt="${p.nombre}">` : '📦'}
          </div>
        </td>
        <td class="name">${p.nombre}</td>
        <td class="desc">${p.desc}</td>
        <td class="price">$${parseFloat(p.precio).toFixed(2)}</td>
        <td><span class="stock-badge ${stockClass(p.stock)}">${p.stock} units</span></td>
        <td>
          <div class="actions-cell">
            <button class="btn-edit" onclick="editarProducto(${p.id})"><i class="ti ti-pencil"></i></button>
            <button class="btn-del"  onclick="eliminarProducto(${p.id})"><i class="ti ti-trash"></i></button>
          </div>
        </td>
      </tr>`).join('');
  }

  // Paginación
  const pag = document.getElementById('pagination');
  let html = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i class="ti ti-chevron-left"></i></button>`;
  html += `<span class="pag-label">Página ${currentPage} de ${pages}</span>`;
  html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===pages?'disabled':''}><i class="ti ti-chevron-right"></i></button>`;
  pag.innerHTML = html;
}

function goPage(n) {
  const pages = Math.ceil(getFiltered().length / PER_PAGE) || 1;
  if (n < 1 || n > pages) return;
  currentPage = n;
  render();
}

document.querySelector('.btn-exit').addEventListener('click', () => {
  localStorage.removeItem('rapipedidos_pedidos');
  location.href = '../../index.html';
});

if (!localStorage.getItem(PROD_KEY)) saveProductos(defaultProductos);
render();