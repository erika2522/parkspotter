// Garajes publicados por este propietario
const garajes = JSON.parse(localStorage.getItem('parkspotter_garajes_mock') || '[]');
const idsGarajesPropios = garajes.map(g => g.id);

// Todas las reservas del sistema (de todos los conductores)
const todasLasReservas = JSON.parse(localStorage.getItem('parkspotter_reservas') || '[]');

// Filtramos solo las reservas que corresponden a garajes de este propietario
const reservasRecibidas = todasLasReservas
    .filter(r => idsGarajesPropios.includes(r.garajeId))
    .reverse();

const listEl = document.getElementById('ingresos-list');
const emptyEl = document.getElementById('ingresos-empty');
const totalGanadoEl = document.getElementById('total-ganado');
const totalReservasEl = document.getElementById('total-reservas');

const totalGanado = reservasRecibidas.reduce((sum, r) => sum + (r.total || 0), 0);
totalGanadoEl.textContent = `$${totalGanado.toLocaleString()}`;
totalReservasEl.textContent = reservasRecibidas.length;

if (reservasRecibidas.length === 0) {
    emptyEl.hidden = false;
} else {
    listEl.innerHTML = reservasRecibidas.map(r => {
        const unidad = r.modo === 'hora'
            ? (r.cantidad === 1 ? 'hora' : 'horas')
            : (r.cantidad === 1 ? 'día' : 'días');

        return `
        <div class="garaje-card" style="margin-bottom: 16px;">
            <div class="garaje-card__body">
                <h3 class="garaje-card__title">${r.titulo}</h3>
                <p class="garaje-card__address">
                    <ion-icon name="calendar-outline"></ion-icon> ${r.fecha}
                </p>
                <div class="garaje-card__prices">
                    <div class="garaje-card__price">
                        Duración <strong>${r.cantidad} ${unidad}</strong>
                    </div>
                    <div class="garaje-card__price">
                        Ganancia <strong style="color: var(--verde-esmeralda);">$${r.total.toLocaleString()}</strong>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}