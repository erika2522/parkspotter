// Cargar datos del perfil desde localStorage
const email = localStorage.getItem('parkspotter_email');

function cargarPerfil() {
    if (!email) {
        window.location.href = '/login';
        return;
    }

    const perfiles = JSON.parse(localStorage.getItem('parkspotter_perfiles') || '{}');
    const perfil = perfiles[email];

    document.getElementById('cuenta-email').textContent = email;

    if (perfil) {
        document.getElementById('cuenta-nombre').textContent = perfil.nombre || 'Usuario ParkSpotter';
        document.getElementById('cuenta-rol').textContent = perfil.rol === 'propietario' ? 'Propietario' : 'Conductor';
        document.getElementById('cuenta-telefono').textContent = perfil.telefono || 'No registrado';
        document.getElementById('cuenta-ciudad').textContent = perfil.ciudad || 'No registrada';
        document.getElementById('cuenta-avatar').textContent = (perfil.nombre || 'U').charAt(0).toUpperCase();

        // Generar bottom nav según el rol
        renderBottomNav(perfil.rol);
    } else {
        document.getElementById('cuenta-nombre').textContent = 'Usuario ParkSpotter';
        document.getElementById('cuenta-rol').textContent = 'Conductor';
        renderBottomNav('conductor');
    }
}

function renderBottomNav(rol) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    if (rol === 'propietario') {
        nav.innerHTML = `
            <a href="/mis-garajes" class="bottom-nav__item">
                <ion-icon name="business-outline"></ion-icon>
                <p>Mis garajes</p>
            </a>
            <a href="/publicar-garaje" class="bottom-nav__item">
                <ion-icon name="add-circle-outline"></ion-icon>
                <p>Publicar</p>
            </a>
            <a href="/ingresos" class="bottom-nav__item">
                <ion-icon name="cash-outline"></ion-icon>
                <p>Ingresos</p>
            </a>
            <a href="/micuenta" class="bottom-nav__item bottom-nav__item--active">
                <ion-icon name="person-outline"></ion-icon>
                <p>Mi cuenta</p>
            </a>
        `;
    } else {
        nav.innerHTML = `
            <a href="/menu" class="bottom-nav__item">
                <ion-icon name="home-outline"></ion-icon>
                <p>Inicio</p>
            </a>
            <a href="#" class="bottom-nav__item">
                <ion-icon name="list-outline"></ion-icon>
                <p>Mis arriendos</p>
            </a>
            <a href="/menu" class="bottom-nav__item">
                <ion-icon name="location-outline"></ion-icon>
                <p>Buscar</p>
            </a>
            <a href="/micuenta" class="bottom-nav__item bottom-nav__item--active">
                <ion-icon name="person-outline"></ion-icon>
                <p>Mi cuenta</p>
            </a>
        `;
    }
}

// Cerrar sesión
document.getElementById('btn-logout').addEventListener('click', () => {
    if (!confirm('¿Seguro que quieres cerrar sesión?')) return;

    localStorage.removeItem('parkspotter_accessToken');
    localStorage.removeItem('parkspotter_refreshToken');
    localStorage.removeItem('parkspotter_userId');
    localStorage.removeItem('parkspotter_email');

    window.location.href = '/';
});

document.getElementById('btn-editar').addEventListener('click', () => {
    alert('La edición de perfil estará disponible próximamente.');
});

cargarPerfil();