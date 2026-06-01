// ...existing code...
const STORAGE_KEY = 'pedidoRapidoForm';

function slugify(text) {
    return String(text)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

function getKeyForInput(el, idx) {
    if (el.dataset.storeKey) return el.dataset.storeKey;
    const field = el.closest('.field');
    let base = el.name || el.id || '';
    if (!base && field) {
        const lbl = field.querySelector('label');
        if (lbl) base = lbl.textContent || '';
    }
    if (!base) base = `input-${idx}`;
    const key = slugify(base);
    el.dataset.storeKey = key;
    return key;
}

function dataGetter() {
    const elems = Array.from(document.querySelectorAll('.main input, .main textarea, .main select'));
    const data = {};

    elems.forEach((el, idx) => {
        if (el.disabled) return;
        const type = el.type;
        if (['button', 'submit', 'reset', 'file'].includes(type)) return;

        const key = getKeyForInput(el, idx);

        if (type === 'checkbox') {
            data[key] = el.checked;
        } else if (type === 'radio') {
            if (el.checked) data[key] = el.value;
        } else {
            data[key] = el.value;
        }
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
}

function restoreData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    let data = {};
    try {
        data = JSON.parse(raw);
    } catch (e) {
        console.error('No se pudo parsear localStorage', e);
        return;
    }

    const elems = Array.from(document.querySelectorAll('.main input, .main textarea, .main select'));
    elems.forEach((el, idx) => {
        if (el.disabled) return;
        const type = el.type;
        if (['button', 'submit', 'reset', 'file'].includes(type)) return;

        const key = getKeyForInput(el, idx);
        if (!(key in data)) return;

        if (type === 'checkbox') {
            el.checked = !!data[key];
        } else if (type === 'radio') {
            el.checked = (el.value === data[key]);
        } else {
            el.value = data[key];
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // restaurar valores al cargar
    restoreData();

    // guardar automáticamente en input/change
    document.querySelectorAll('.main input, .main textarea, .main select').forEach(el => {
        el.addEventListener('input', () => dataGetter());
        el.addEventListener('change', () => dataGetter());
    });

    // botón de registrar: evitar navegación y guardar
    const submitBtn = document.querySelector('.btn-submit');
    const form = document.querySelector('.main'); // el <form class="main">
    if (submitBtn && form) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // valida todos los campos requeridos del form
            if (!form.checkValidity()) {
                // muestra los mensajes de validación nativos del navegador
                form.reportValidity();
                return; // no continuar si hay campos inválidos
            }

            // todo válido -> guardar y navegar
            dataGetter();
            console.log('Datos guardados en localStorage:', localStorage.getItem(STORAGE_KEY));
            location.href = "views/dashboard/dash.html";
        });
    }
});
// ...existing code...