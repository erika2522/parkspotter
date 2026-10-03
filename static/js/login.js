// ============================================
//  CONFIGURACIÓN DEL BACKEND
// ============================================
const API_BASE = "http://localhost:8080/api/v1";

// --- Alternar entre login y registro ---
const viewLogin = document.getElementById('view-login');
const viewRegister = document.getElementById('view-register');
const goToRegister = document.getElementById('go-to-register');
const goToLogin = document.getElementById('go-to-login');

goToRegister.addEventListener('click', (e) => {
    e.preventDefault();
    viewLogin.hidden = true;
    viewRegister.hidden = false;
});

goToLogin.addEventListener('click', (e) => {
    e.preventDefault();
    viewRegister.hidden = true;
    viewLogin.hidden = false;
});

// --- Selector de rol ---
const roleOptions = document.querySelectorAll('.role-option');
const regRoleInput = document.getElementById('reg-role');
const btnRegisterSubmit = document.getElementById('btn-register-submit');

roleOptions.forEach(option => {
    option.addEventListener('click', () => {
        roleOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        const role = option.dataset.role;
        regRoleInput.value = role;
        btnRegisterSubmit.textContent = role === 'propietario'
            ? 'Registrarme como propietario'
            : 'Registrarme como conductor';
    });
});

// --- Mostrar/ocultar contraseña ---
document.querySelectorAll('.auth-field__toggle').forEach(icon => {
    icon.addEventListener('click', () => {
        const targetId = icon.dataset.target;
        const input = document.getElementById(targetId);
        if (input.type === 'password') {
            input.type = 'text';
            icon.setAttribute('name', 'eye-off-outline');
        } else {
            input.type = 'password';
            icon.setAttribute('name', 'eye-outline');
        }
    });
});

// --- Mensaje ---
const authMsg = document.getElementById('auth-msg');
function showMessage(text, type) {
    authMsg.textContent = text;
    authMsg.className = 'auth-msg auth-msg--' + type;
    authMsg.hidden = false;
}

// ============================================
//  PERFIL LOCAL (nombre, teléfono, ciudad, rol)
//  Temporal mientras el backend no los soporta
// ============================================
function guardarPerfilLocal(email, datos) {
    const perfiles = JSON.parse(localStorage.getItem('parkspotter_perfiles') || '{}');
    perfiles[email] = datos;
    localStorage.setItem('parkspotter_perfiles', JSON.stringify(perfiles));
}

function obtenerPerfilLocal(email) {
    const perfiles = JSON.parse(localStorage.getItem('parkspotter_perfiles') || '{}');
    return perfiles[email] || null;
}

// --- Guardar sesión (tokens del backend) ---
function guardarSesion(data) {
    localStorage.setItem('parkspotter_accessToken', data.accessToken);
    localStorage.setItem('parkspotter_refreshToken', data.refreshToken);
    localStorage.setItem('parkspotter_userId', data.userId);
    localStorage.setItem('parkspotter_email', data.email);
}

// ============================================
//  LOGIN
// ============================================
document.getElementById('form-login').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            guardarSesion(data);
            showMessage('¡Inicio de sesión exitoso!', 'success');

            const perfil = obtenerPerfilLocal(email);
            const destino = (perfil && perfil.rol === 'propietario') ? '/mis-garajes' : '/menu';

            setTimeout(() => {
                window.location.href = destino;
            }, 800);
        } else {
            showMessage(data.message || 'Correo o contraseña incorrectos', 'error');
        }
    } catch (err) {
        showMessage('No se pudo conectar con el servidor', 'error');
        console.error(err);
    }
});

// ============================================
//  REGISTRO
// ============================================
document.getElementById('form-register').addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const passwordConfirm = document.getElementById('reg-password-confirm').value;

    if (password !== passwordConfirm) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    if (password.length < 12) {
        showMessage('La contraseña debe tener al menos 12 caracteres', 'error');
        return;
    }

    // Datos extra que el backend aún no soporta (se guardan localmente)
    const perfilLocal = {
        nombre: document.getElementById('reg-name').value,
        telefono: document.getElementById('reg-phone').value,
        ciudad: document.getElementById('reg-city').value,
        rol: document.getElementById('reg-role').value
    };

    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (res.ok) {
            // Guardamos el perfil local asociado a este email
            guardarPerfilLocal(email, perfilLocal);
            guardarSesion(data);

            showMessage('¡Cuenta creada exitosamente!', 'success');

            const destino = perfilLocal.rol === 'propietario' ? '/mis-garajes' : '/menu';

            setTimeout(() => {
                window.location.href = destino;
            }, 1000);
        } else {
            showMessage(data.message || 'No se pudo completar el registro', 'error');
        }
    } catch (err) {
        showMessage('No se pudo conectar con el servidor', 'error');
        console.error(err);
    }

    // Función global para consultar el rol del usuario actual (usable desde otras páginas)
    window.obtenerRolActual = function() {
        const email = localStorage.getItem('parkspotter_email');
        if (!email) return null;
        const perfiles = JSON.parse(localStorage.getItem('parkspotter_perfiles') || '{}');
        return perfiles[email]?.rol || 'conductor';
    };

});