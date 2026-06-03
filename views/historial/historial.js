const STORAGE_KEY = 'rapipedidos_pedidos';
const PER_PAGE = 4;
let currentPage = 1;

// Datos de ejemplo para cuando el LS esté vacío
const defaultData = [
  { id: 4592, cliente: 'Roberto Jiménez',  correo: 'roberto.j@email.com',    telefono: '+54 11 4567-8901', productos: [{nombre:'Monitor 4K',cantidad:1},{nombre:'Teclado Mecánico',cantidad:1}], direccion: 'Av. Libertador 4500, CABA, Argentina', fecha: '2024-05-24T14:35', total: 450.00, estado: 'Entregado' },
  { id: 4593, cliente: 'Elena Martínez',   correo: 'elena_m@provider.net',   telefono: '+54 11 2345-6789', productos: [{nombre:'Mouse Pad XL',cantidad:2},{nombre:'Silla Ergonómica',cantidad:1}],  direccion: 'Calle Falsa 123, Córdoba, ARG',       fecha: '2024-05-23T09:12', total: 215.50, estado: 'Pendiente' },
  { id: 4594, cliente: 'Carlos Thompson',  correo: 'c.thompson@gmail.com',   telefono: '+54 11 9876-5432', productos: [{nombre:'Auriculares Pro',cantidad:1}],                                      direccion: 'Pasaje de la Paz 88, Rosario',        fecha: '2024-05-22T18:20', total: 89.00,  estado: 'Entregado' },
  { id: 4595, cliente: 'Sonia Peralta',    correo: 's.peralta@biz.com',      telefono: '+54 11 3333-2222', productos: [{nombre:'Cable HDMI 2.1',cantidad:5},{nombre:'Adaptador USB-C',cantidad:2}], direccion: 'Independencia 1200, Mendoza',         fecha: '2024-05-21T11:05', total: 120.00, estado: 'Cancelado' },
  { id: 4596, cliente: 'Miguel Ángel Ruiz',correo: 'm.ruiz@correo.com',      telefono: '+54 11 7777-4444', productos: [{nombre:'Laptop Gamer',cantidad:1}],                                         direccion: 'San Martín 300, Tucumán',             fecha: '2024-05-20T10:00', total: 1200.00,estado: 'Entregado' },
  { id: 4597, cliente: 'Laura Gómez',      correo: 'laura.g@email.com',      telefono: '+54 11 5555-6666', productos: [{nombre:'Impresora Láser',cantidad:1},{nombre:'Tóner',cantidad:3}],          direccion: 'Belgrano 900, Salta',                fecha: '2024-05-19T16:30', total: 340.00, estado: 'En proceso'},
];

function getPedidos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : [];
  return data.length ? data : defaultData;
}

function formatFecha(iso) {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2,'0');
  const mm = (d.getMonth()+1).toString().padStart(2,'0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function formatHora(iso) {
  const d = new Date(iso);
  const h = d.getHours().toString().padStart(2,'0');
  const m = d.getMinutes().toString().padStart(2,'0');
  return `${h}:${m}`;
}

function formatProductos(p) {
  if (p.productos && p.productos.length) return p.productos;
  return [{nombre: `${p.cant} producto${p.cant!==1?'s':''}`, cantidad: ''}];
}

function getFiltered() {
  const q     = document.getElementById('searchInput').value.toLowerCase();
  const fecha = document.getElementById('fechaFiltro').value;
  return getPedidos().filter(p => {
    const matchQ = !q || p.cliente.toLowerCase().includes(q) || (p.correo||'').toLowerCase().includes(q);
    const matchF = !fecha || p.fecha.startsWith(fecha);
    return matchQ && matchF;
  });
}

function render() {
  const data  = getFiltered();
  const total = data.length;
  const pages = Math.ceil(total / PER_PAGE) || 1;
  if (currentPage > pages) currentPage = 1;
  const slice = data.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);

  const tbody = document.getElementById('tableBody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty"><i class="ti ti-users-group" style="font-size:26px;display:block;margin-bottom:8px;"></i>Sin registros encontrados</td></tr>`;
  } else {
    tbody.innerHTML = slice.map(p => {
      const prods = formatProductos(p);
      const badgeClass = `badge badge-${p.estado}`;
      return `
        <tr>
          <td>
            <div class="client-name">${p.cliente}</div>
            <div class="client-contact">
              ${p.correo ? p.correo + '<br>' : ''}
              ${p.telefono || ''}
            </div>
          </td>
          <td>
            <ul class="prod-list">
              ${prods.map(pr => `<li>${pr.nombre}${pr.cantidad ? ` (${pr.cantidad})` : ''}</li>`).join('')}
            </ul>
          </td>
          <td class="address">${p.direccion || '—'}</td>
          <td class="datetime">
            <div class="dt-date">${formatFecha(p.fecha)}</div>
            <div class="dt-time">${formatHora(p.fecha)}</div>
          </td>
          <td class="total">$${parseFloat(p.total).toFixed(2)}</td>
          <td><span class="${badgeClass}">${p.estado.toUpperCase()}</span></td>
        </tr>`;
    }).join('');
  }

  // Paginación
  const start = (currentPage-1)*PER_PAGE + 1;
  const end   = Math.min(currentPage*PER_PAGE, total);
  document.getElementById('pagInfo').textContent = total ? `Mostrando ${start}-${end} de ${total} registros` : 'Sin registros';

  const btns = document.getElementById('pagBtns');
  let html = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i class="ti ti-chevron-left"></i></button>`;
  for (let i=1;i<=pages;i++) html += `<button class="page-btn${i===currentPage?' active':''}" onclick="goPage(${i})">${i}</button>`;
  html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===pages?'disabled':''}><i class="ti ti-chevron-right"></i></button>`;
  btns.innerHTML = html;
}

function goPage(n) {
  const pages = Math.ceil(getFiltered().length / PER_PAGE) || 1;
  if (n < 1 || n > pages) return;
  currentPage = n;
  render();
}

document.querySelector('.btn-exit').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  location.href = '../../index.html';
});

render();