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