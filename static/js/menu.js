// ============================================
//  INICIALIZAR MAPA CON OPENSTREETMAP (sin API key)
// ============================================
const map = L.map('map').setView([4.6684, -74.0558], 15); // Bogotá, zona norte de referencia

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// ============================================
//  ICONOS PERSONALIZADOS PARA LOS MARCADORES
// ============================================
function crearIcono(color) {
    return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background:${color};
            width:28px;
            height:28px;
            border-radius:50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28]
    });
}

const iconoDisponible = crearIcono('#00C896');
const iconoOcupado = crearIcono('#e74c3c');

// ============================================
//  GARAJES DE PRUEBA (mock) — mientras se conecta al backend real
// ============================================
function getGarajesMock() {
    // Reutilizamos los que ya guardaste en "Mis garajes" si existen
    const data = localStorage.getItem('parkspotter_garajes_mock');
    if (data) {
        const garajes = JSON.parse(data);
        // Les damos coordenadas de ejemplo cerca del centro del mapa
        return garajes.map((g, i) => ({
            ...g,
            lat: 4.6684 + (i * 0.002),
            lng: -74.0558 + (i * 0.0015)
        }));
    }
    return [];
}

// ============================================
//  RENDERIZAR MARCADORES EN EL MAPA
// ============================================
const garajes = getGarajesMock();
const sheet = document.getElementById('garaje-sheet');
const sheetContent = document.getElementById('sheet-content');
const closeSheetBtn = document.getElementById('close-sheet');

garajes.forEach(garaje => {
    const marker = L.marker([garaje.lat, garaje.lng], {
        icon: garaje.disponible ? iconoDisponible : iconoOcupado
    }).addTo(map);

    marker.bindPopup(`
        <div class="garaje-popup">
            <h4>${garaje.titulo}</h4>
            <p>${garaje.direccion}</p>
            <span class="precio">$${garaje.precioHora.toLocaleString()}/hora</span>
        </div>
    `);

    marker.on('click', () => mostrarDetalle(garaje));
});

function mostrarDetalle(garaje) {
    sheetContent.innerHTML = `
        <h3 style="margin:0 0 6px; color:#0B2D5B;">${garaje.titulo}</h3>
        <p style="margin:0 0 12px; color:#8a94a6; font-size:0.85rem;">
            <ion-icon name="location-outline"></ion-icon> ${garaje.direccion}
        </p>
        <p style="margin:0 0 16px; font-size:0.85rem; color:#555;">${garaje.descripcion || ''}</p>

        ${garaje.disponible ? `
        <div class="reserva-modo">
            <button type="button" class="reserva-modo__btn active" data-modo="hora">Por hora</button>
            <button type="button" class="reserva-modo__btn" data-modo="dia">Por día</button>
        </div>

        <div class="reserva-cantidad">
            <span>Cantidad</span>
            <div class="reserva-cantidad__control">
                <button type="button" id="btn-menos">−</button>
                <span id="cantidad-valor">1</span>
                <button type="button" id="btn-mas">+</button>
            </div>
        </div>

        <div class="reserva-total">
            <span>Total a pagar</span>
            <strong id="total-valor">$${garaje.precioHora.toLocaleString()}</strong>
        </div>
        ` : ''}

        <button id="btn-reservar" style="
            width:100%;
            padding:12px;
            border:none;
            border-radius:10px;
            background:${garaje.disponible ? '#00C896' : '#b0b8c4'};
            color:#fff;
            font-family:'Montserrat', sans-serif;
            font-weight:600;
            font-size:0.85rem;
            cursor:${garaje.disponible ? 'pointer' : 'not-allowed'};
        " ${garaje.disponible ? '' : 'disabled'}>
            ${garaje.disponible ? 'Reservar ahora' : 'No disponible'}
        </button>
    `;
    sheet.hidden = false;

    if (!garaje.disponible) return;

    // --- Lógica del selector de modalidad y cantidad ---
    let modo = 'hora';
    let cantidad = 1;

    const modoBtns = sheetContent.querySelectorAll('.reserva-modo__btn');
    const cantidadValor = document.getElementById('cantidad-valor');
    const totalValor = document.getElementById('total-valor');
    const btnMenos = document.getElementById('btn-menos');
    const btnMas = document.getElementById('btn-mas');

    function actualizarTotal() {
        const precioUnitario = modo === 'hora' ? garaje.precioHora : garaje.precioDia;
        const total = precioUnitario * cantidad;
        totalValor.textContent = `$${total.toLocaleString()}`;
        cantidadValor.textContent = cantidad;
    }

    modoBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modoBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            modo = btn.dataset.modo;
            cantidad = 1;
            actualizarTotal();
        });
    });

    btnMenos.addEventListener('click', () => {
        if (cantidad > 1) {
            cantidad--;
            actualizarTotal();
        }
    });

    btnMas.addEventListener('click', () => {
        const maxCantidad = modo === 'hora' ? 12 : 30;
        if (cantidad < maxCantidad) {
            cantidad++;
            actualizarTotal();
        }
    });

    const btnReservar = document.getElementById('btn-reservar');
    btnReservar.addEventListener('click', () => {
        const precioUnitario = modo === 'hora' ? garaje.precioHora : garaje.precioDia;
        const total = precioUnitario * cantidad;
        confirmarReserva(garaje, modo, cantidad, total);
    });
}
// ============================================
//  RESERVA SIMULADA
// ============================================
function confirmarReserva(garaje, modo, cantidad, total) {
    const email = localStorage.getItem('parkspotter_email') || 'invitado';

    const reserva = {
        id: Date.now(),
        garajeId: garaje.id,
        titulo: garaje.titulo,
        direccion: garaje.direccion,
        modo: modo,
        cantidad: cantidad,
        total: total,
        fecha: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }),
        estado: 'confirmada',
        email: email
    };

    const key = 'parkspotter_reservas';
    const reservas = JSON.parse(localStorage.getItem(key) || '[]');
    reservas.push(reserva);
    localStorage.setItem(key, JSON.stringify(reservas));

    const unidad = modo === 'hora' ? (cantidad === 1 ? 'hora' : 'horas') : (cantidad === 1 ? 'día' : 'días');

    sheetContent.innerHTML = `
        <div style="text-align:center; padding: 10px 0;">
            <ion-icon name="checkmark-circle" style="font-size:3rem; color:#00C896;"></ion-icon>
            <h3 style="margin:12px 0 6px; color:#0B2D5B;">¡Reserva confirmada!</h3>
            <p style="margin:0 0 8px; color:#8a94a6; font-size:0.9rem;">
                ${cantidad} ${unidad} en <strong>${garaje.titulo}</strong>
            </p>
            <p style="margin:0 0 20px; color:#0B2D5B; font-size:1.1rem; font-weight:700;">
                Total: $${total.toLocaleString()}
            </p>
            <button id="btn-ver-arriendos" style="
                width:100%;
                padding:14px;
                border:none;
                border-radius:12px;
                background:#0B2D5B;
                color:#fff;
                font-family:'Montserrat', sans-serif;
                font-weight:600;
                font-size:0.9rem;
                cursor:pointer;
                margin-bottom:10px;
            ">Ver mis arriendos</button>
            <button id="btn-cerrar-confirmacion" style="
                width:100%;
                padding:14px;
                border:1px solid #e2e6ec;
                border-radius:12px;
                background:#fff;
                color:#0B2D5B;
                font-family:'Montserrat', sans-serif;
                font-weight:600;
                font-size:0.9rem;
                cursor:pointer;
            ">Seguir buscando</button>
        </div>
    `;

    document.getElementById('btn-ver-arriendos').addEventListener('click', () => {
        window.location.href = '/mis-arriendos';
    });

    document.getElementById('btn-cerrar-confirmacion').addEventListener('click', () => {
        sheet.hidden = true;
    });
}
// ============================================
//  BUSCADOR SIMPLE POR DIRECCIÓN/ZONA
// ============================================
document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = e.target.value.toLowerCase();
        const encontrado = garajes.find(g =>
            g.titulo.toLowerCase().includes(query) ||
            g.direccion.toLowerCase().includes(query)
        );

        if (encontrado) {
            map.setView([encontrado.lat, encontrado.lng], 17);
            mostrarDetalle(encontrado);
        }
    }
    
});

// --- Botón "Buscar" enfoca la barra de búsqueda ---
document.getElementById('btn-buscar').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('search-input').focus();
    document.getElementById('search-input').scrollIntoView({ behavior: 'smooth' });
});