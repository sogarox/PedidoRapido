const STORAGE_KEY = 'rapipedidos_pedidos';
const PER_PAGE = 10;
let currentPage = 1;

// ── Datos iniciales si LocalStorage está vacío ──
const defaultData = [
    { id: 12345, cliente: 'Alejandro Morales', cant: 5, total: 1240.00, fecha: '2024-05-24T10:30', estado: 'Pendiente' },
    { id: 12346, cliente: 'Beatriz Ramos', cant: 2, total: 450.50, fecha: '2024-05-24T09:15', estado: 'En proceso' },
    { id: 12347, cliente: 'Carlos Pineda', cant: 12, total: 3890.00, fecha: '2024-05-24T08:45', estado: 'Entregado' },
];

function getPedidos() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultData;
}

function savePedidos(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function nextId() {
    const pedidos = getPedidos();
    return pedidos.length ? Math.max(...pedidos.map(p => p.id)) + 1 : 10000;
}

function formatFecha(isoStr) {
    const d = new Date(isoStr);
    const day = d.getDate().toString().padStart(2, '0');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mon = months[d.getMonth()];
    const year = d.getFullYear();
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    const h12 = (d.getHours() % 12 || 12).toString().padStart(2, '0');
    return `${day} ${mon} ${year} · ${h12}:${m} ${ampm}`;
}

function getFiltered() {
    const q = document.getElementById('searchInput').value.toLowerCase();
    const est = document.getElementById('filterEstado').value;
    const fecha = document.getElementById('filterFecha').value;
    return getPedidos().filter(p => {
        const matchQ = !q || p.cliente.toLowerCase().includes(q);
        const matchEst = !est || p.estado === est;
        const matchF = !fecha || p.fecha.startsWith(fecha);
        return matchQ && matchEst && matchF;
    });
}

function renderTable() {
    const filtered = getFiltered();
    const total = filtered.length;
    const pages = Math.ceil(total / PER_PAGE) || 1;
    if (currentPage > pages) currentPage = 1;

    const slice = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const tbody = document.getElementById('tableBody');

    if (!slice.length) {
        tbody.innerHTML = `<tr><td colspan="7" class="empty"><i class="ti ti-inbox" style="font-size:28px;display:block;margin-bottom:8px;"></i>Sin pedidos</td></tr>`;
    } else {
        tbody.innerHTML = slice.map(p => `
        <tr>
          <td class="id">#${p.id}</td>
          <td>${p.cliente}</td>
          <td>${p.cant}</td>
          <td class="total">$${parseFloat(p.total).toFixed(2)}</td>
          <td class="datetime">${formatFecha(p.fecha)}</td>
          <td><span class="badge badge-${p.estado}">${p.estado.toUpperCase()}</span></td>
          <td>
            <div class="actions">
              <select class="status-select" onchange="changeEstado(${p.id}, this.value)">
                ${['Pendiente', 'En proceso', 'Entregado'].map(s => `<option${s === p.estado ? ' selected' : ''}>${s}</option>`).join('')}
              </select>
              <button class="btn-detail" onclick="alert('Pedido #${p.id}\\nCliente: ${p.cliente}\\nProductos: ${p.cant}\\nTotal: $${parseFloat(p.total).toFixed(2)}\\nEstado: ${p.estado}')">Detalles</button>
              <button class="btn-del" onclick="deletePedido(${p.id})"><i class="ti ti-trash"></i></button>
            </div>
          </td>
        </tr>
      `).join('');
    }

    // Info
    document.getElementById('paginationInfo').textContent =
        `Mostrando ${slice.length} de ${total} pedido${total !== 1 ? 's' : ''} del día`;

    // Botones de página
    const btns = document.getElementById('paginationBtns');
    let html = `<button class="page-btn" onclick="goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
      <i class="ti ti-chevron-left"></i></button>`;
    for (let i = 1; i <= pages; i++) {
        html += `<button class="page-btn${i === currentPage ? ' active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" onclick="goPage(${currentPage + 1})" ${currentPage === pages ? 'disabled' : ''}>
      <i class="ti ti-chevron-right"></i></button>`;
    btns.innerHTML = html;
}

function goPage(n) {
    const pages = Math.ceil(getFiltered().length / PER_PAGE) || 1;
    if (n < 1 || n > pages) return;
    currentPage = n;
    renderTable();
}

function changeEstado(id, nuevoEstado) {
    const pedidos = getPedidos().map(p => p.id === id ? { ...p, estado: nuevoEstado } : p);
    savePedidos(pedidos);
    renderTable();
}

function deletePedido(id) {
    if (!confirm('¿Eliminar este pedido?')) return;
    savePedidos(getPedidos().filter(p => p.id !== id));
    renderTable();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterEstado').value = '';
    document.getElementById('filterFecha').value = '';
    currentPage = 1;
    renderTable();
}

// ── Modal ──
function openModal() {
    document.getElementById('modalOverlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.remove('open');
    document.getElementById('mCliente').value = '';
    document.getElementById('mCant').value = '';
    document.getElementById('mTotal').value = '';
    document.getElementById('mEstado').value = 'Pendiente';
}

function savePedido() {
    const cliente = document.getElementById('mCliente').value.trim();
    const cant = parseInt(document.getElementById('mCant').value);
    const total = parseFloat(document.getElementById('mTotal').value);
    const estado = document.getElementById('mEstado').value;

    if (!cliente || isNaN(cant) || isNaN(total)) {
        alert('Por favor complete todos los campos.');
        return;
    }

    const pedidos = getPedidos();
    pedidos.unshift({
        id: nextId(),
        cliente,
        cant,
        total,
        fecha: new Date().toISOString().slice(0, 16),
        estado
    });
    savePedidos(pedidos);
    closeModal();
    currentPage = 1;
    renderTable();
}

// Cerrar modal al clickear fuera
document.getElementById('modalOverlay').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});

const exitBtn = document.querySelector('.btn-exit');
    if (exitBtn) {
        exitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // acción extra: puedes mostrar mensaje o redirigir
            localStorage.removeItem(STORAGE_KEY)
            console.log('Sesión eliminada de localStorage:', localStorage.getItem(STORAGE_KEY));
            location.href = "../../index.html"
        });
    }


    const profileBtn = document.querySelector(".btn-profile");
    if(profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            location.href="../perfil/perfil.html"
        })
    }
// ── Init ──
if (!localStorage.getItem(STORAGE_KEY)) savePedidos(defaultData);
renderTable();