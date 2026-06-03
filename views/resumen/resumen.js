const STORAGE_KEY = 'rapipedidos_pedidos';
const PER_PAGE = 10;
let currentPage = 1;
 
function getPedidos() {
  const raw = localStorage.getItem(STORAGE_KEY);
  console.log(raw)
  return raw ? JSON.parse(raw) : [];
}
 
function formatFecha(isoStr) {
  const d = new Date(isoStr);
  const dd = d.getDate().toString().padStart(2,'0');
  const mm = (d.getMonth()+1).toString().padStart(2,'0');
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}
 
function formatHora(isoStr) {
  const d = new Date(isoStr);
  const h = d.getHours() % 12 || 12;
  const m = d.getMinutes().toString().padStart(2,'0');
  const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
  return `${h.toString().padStart(2,'0')}:${m} ${ampm}`;
}
 
function formatProductos(p) {
  if (p.productos && p.productos.length) {
    return p.productos.map(pr => `${pr.cantidad}x ${pr.nombre}`).join(', ');
  }
  return `${p.cant} producto${p.cant !== 1 ? 's' : ''}`;
}
 
function getEntregados() {
  const fecha = document.getElementById('fechaFiltro').value;
  return getPedidos().filter(p => {
    const esEntregado = p.estado === 'Entregado';
    const matchFecha  = !fecha || p.fecha.startsWith(fecha);
    return esEntregado && matchFecha;
  });
}
 
function render() {
  const data  = getEntregados();
  const total = data.length;
  const pages = Math.ceil(total / PER_PAGE) || 1;
  if (currentPage > pages) currentPage = 1;
  const slice = data.slice((currentPage-1)*PER_PAGE, currentPage*PER_PAGE);
 
  // Stats
  const ganancias = data.reduce((s, p) => s + parseFloat(p.total), 0);
  const productos = data.reduce((s, p) => s + parseInt(p.cant), 0);
  document.getElementById('statGanancias').textContent = `$${ganancias.toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
  document.getElementById('statProductos').textContent = productos.toLocaleString('es-MX');
  document.getElementById('tableInfo').textContent = `Mostrando ${total} de ${total}`;
 
  // Tabla
  const tbody = document.getElementById('resumenBody');
  if (!slice.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#9ca3af;font-size:13px;">Sin pedidos entregados para esta fecha</td></tr>`;
  } else {
    tbody.innerHTML = slice.map(p => `
      <tr>
        <td class="id">#${p.id}</td>
        <td class="client">${p.cliente}</td>
        <td class="products">${formatProductos(p)}</td>
        <td class="address">${p.direccion || '—'}</td>
        <td class="date">${formatFecha(p.fecha)}</td>
        <td class="time">${formatHora(p.fecha)}</td>
        <td class="total">$${parseFloat(p.total).toFixed(2)}</td>
        <td><span class="badge-entregado">ENTREGADO</span></td>
      </tr>`).join('');
  }
 
  // Paginación
  document.getElementById('pagInfo').textContent = `Mostrando página ${currentPage} de ${pages}`;
  const btns = document.getElementById('pagBtns');
  let html = `<button class="page-btn" onclick="goPage(${currentPage-1})" ${currentPage===1?'disabled':''}><i class="ti ti-chevron-left"></i></button>`;
  for (let i=1;i<=pages;i++) html += `<button class="page-btn${i===currentPage?' active':''}" onclick="goPage(${i})">${i}</button>`;
  html += `<button class="page-btn" onclick="goPage(${currentPage+1})" ${currentPage===pages?'disabled':''}><i class="ti ti-chevron-right"></i></button>`;
  btns.innerHTML = html;
}
 
function goPage(n) {
  const pages = Math.ceil(getEntregados().length / PER_PAGE) || 1;
  if (n < 1 || n > pages) return;
  currentPage = n;
  render();
}
 
// Exportar
function exportar(tipo) {
  const data = getEntregados();
  if (!data.length) { alert('No hay datos para exportar.'); return; }
 
  let contenido = '';
  const fecha = document.getElementById('fechaFiltro').value || 'todos';
 
  if (tipo === 'csv') {
    contenido = 'ID,Cliente,Productos,Dirección,Fecha,Hora,Total,Estado\n';
    contenido += data.map(p =>
      `#${p.id},"${p.cliente}","${formatProductos(p)}","${p.direccion||''}",${formatFecha(p.fecha)},${formatHora(p.fecha)},$${parseFloat(p.total).toFixed(2)},Entregado`
    ).join('\n');
  } else {
    contenido = `RESUMEN DIARIO RAPIPEDIDOS — ${fecha}\n${'='.repeat(50)}\n\n`;
    data.forEach(p => {
      contenido += `Pedido #${p.id}\nCliente: ${p.cliente}\nProductos: ${formatProductos(p)}\nDirección: ${p.direccion||'—'}\nFecha: ${formatFecha(p.fecha)}  Hora: ${formatHora(p.fecha)}\nTotal: $${parseFloat(p.total).toFixed(2)}\n${'-'.repeat(40)}\n`;
    });
    const g = data.reduce((s,p)=>s+parseFloat(p.total),0);
    contenido += `\nTOTAL GANANCIAS: $${g.toFixed(2)}\n`;
  }
 
  const blob = new Blob([contenido], { type: tipo === 'csv' ? 'text/csv' : 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `rapipedidos-resumen-${fecha}.${tipo}`;
  a.click();
}
 
document.getElementById('fechaFiltro').addEventListener('change', () => { currentPage = 1; render(); });
 
document.querySelector('.btn-exit').addEventListener('click', () => {
  localStorage.removeItem(STORAGE_KEY);
  location.href = '../../index.html';
});
 
// Fecha por defecto = hoy
const hoy = new Date().toISOString().slice(0,10);
document.getElementById('fechaFiltro').value = hoy;
 
render();