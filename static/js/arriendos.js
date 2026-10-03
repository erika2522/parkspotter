const email = localStorage.getItem('parkspotter_email') || 'invitado';
const reservas = JSON.parse(localStorage.getItem('parkspotter_reservas') || '[]')
    .filter(r => r.email === email)
    .reverse();

const listEl = document.getElementById('reservas-list');
const emptyEl = document.getElementById('reservas-empty');

if (reservas.length === 0) {
    emptyEl.hidden = false;
} else {
    listEl.innerHTML = reservas.map(r => {
        const unidad = r.modo === 'hora'
            ? (r.cantidad === 1 ? 'hora' : 'horas')
            : (r.cantidad === 1 ? 'día' : 'días');

        return `
        <div class="garaje-card" style="margin-bottom: 16px;">
            <div class="garaje-card__body">
                <span class="garaje-card__badge garaje-card__badge--on" style="position:static; display:inline-block; margin-bottom:10px;">
                    Confirmada
                </span>
                <h3 class="garaje-card__title">${r.titulo}</h3>
                <p class="garaje-card__address">
                    <ion-icon name="location-outline"></ion-icon> ${r.direccion}
                </p>
                <p style="font-size:0.8rem; color:#8a94a6; margin-bottom:14px;">
                    <ion-icon name="calendar-outline"></ion-icon> Reservado el ${r.fecha}
                </p>
                <div class="garaje-card__prices">
                    <div class="garaje-card__price">
                        Duración <strong>${r.cantidad} ${unidad}</strong>
                    </div>
                    <div class="garaje-card__price">
                        Total <strong>$${r.total.toLocaleString()}</strong>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
}