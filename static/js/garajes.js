// ============================================
//  DATOS DE PRUEBA (mock) — mientras conectamos el backend real
// ============================================
const STORAGE_KEY = "parkspotter_garajes_mock";

function getGarajes() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
}

function saveGarajes(garajes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(garajes));
}

// ============================================
//  VISTA: PUBLICAR / EDITAR GARAJE
// ============================================
const formGaraje = document.getElementById('form-garaje');

if (formGaraje) {
    // Si viene un ID por la URL (?id=1), cargamos el garaje para editar
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('id');

    // ============================================
    //  SUBIDA DE IMAGEN (convertida a Base64)
    // ============================================
    const uploadZone = document.getElementById('garaje-upload');
    const fileInput = document.getElementById('imagen-file');
    const uploadPreview = document.getElementById('upload-preview');
    const uploadImg = document.getElementById('upload-img');
    const removeImgBtn = document.getElementById('remove-img');
    let imagenBase64 = "";

    uploadZone.addEventListener('click', (e) => {
        if (e.target === removeImgBtn || e.target.closest('#remove-img')) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            alert('La imagen no debe superar los 3MB.');
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            imagenBase64 = e.target.result;
            uploadImg.src = imagenBase64;
            uploadImg.hidden = false;
            uploadPreview.hidden = true;
            removeImgBtn.hidden = false;
        };
        reader.readAsDataURL(file);
    });

    removeImgBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        imagenBase64 = "";
        fileInput.value = "";
        uploadImg.hidden = false;
        uploadPreview.hidden = true;
        removeImgBtn.hidden = true;
    });

    if (editId) {
        const garajes = getGarajes();
        const garaje = garajes.find(g => g.id == editId);
        if (garaje) {
            document.getElementById('garaje-id').value = garaje.id;
            document.getElementById('titulo').value = garaje.titulo;
            document.getElementById('direccion').value = garaje.direccion;
            document.getElementById('descripcion').value = garaje.descripcion;
            document.getElementById('precio-hora').value = garaje.precioHora;
            document.getElementById('precio-dia').value = garaje.precioDia;
            document.getElementById('capacidad').value = garaje.capacidad;
            document.getElementById('disponible').checked = garaje.disponible;

            if (garaje.imagenUrl) {
                imagenBase64 = garaje.imagenUrl;
                uploadImg.src = imagenBase64;
                uploadImg.hidden = false;
                uploadPreview.hidden = true;
                removeImgBtn.hidden = false;
            }

            document.getElementById('form-title').textContent = "Editar garaje";
            document.getElementById('submit-btn').textContent = "Guardar cambios";
        }
    }

    formGaraje.addEventListener('submit', (e) => {
        e.preventDefault();

        const garajes = getGarajes();
        const id = document.getElementById('garaje-id').value;

        const nuevoGaraje = {
            id: id ? parseInt(id) : Date.now(),
            titulo: document.getElementById('titulo').value,
            direccion: document.getElementById('direccion').value,
            descripcion: document.getElementById('descripcion').value,
            precioHora: parseInt(document.getElementById('precio-hora').value),
            precioDia: parseInt(document.getElementById('precio-dia').value),
            capacidad: parseInt(document.getElementById('capacidad').value),
            imagenUrl: imagenBase64,
            disponible: document.getElementById('disponible').checked
        };

        if (id) {
            // Editar existente
            const index = garajes.findIndex(g => g.id == id);
            garajes[index] = nuevoGaraje;
        } else {
            // Crear nuevo
            garajes.push(nuevoGaraje);
        }

        saveGarajes(garajes);

        const msg = document.getElementById('garaje-msg');
        msg.textContent = id ? "¡Garaje actualizado exitosamente!" : "¡Garaje publicado exitosamente!";
        msg.className = "garaje-msg garaje-msg--success";
        msg.hidden = false;

        setTimeout(() => {
            window.location.href = "/mis-garajes";
        }, 1000);
    });
}

// ============================================
//  VISTA: MIS GARAJES (listado)
// ============================================
const garajeGrid = document.getElementById('garaje-grid');

if (garajeGrid) {
    function renderGarajes() {
        const garajes = getGarajes();
        const emptyState = document.getElementById('garaje-empty');

        if (garajes.length === 0) {
            garajeGrid.hidden = true;
            emptyState.hidden = false;
            return;
        }

        garajeGrid.hidden = false;
        emptyState.hidden = true;

        garajeGrid.innerHTML = garajes.map(g => `
            <div class="garaje-card">
                <div class="garaje-card__image" style="background-image: ${g.imagenUrl ? `url('${g.imagenUrl}')` : 'none'}">
                    ${!g.imagenUrl ? '<ion-icon name="car-outline" class="garaje-card__image-placeholder"></ion-icon>' : ''}
                    <span class="garaje-card__badge ${g.disponible ? 'garaje-card__badge--on' : 'garaje-card__badge--off'}">
                        ${g.disponible ? 'Disponible' : 'No disponible'}
                    </span>
                </div>
                <div class="garaje-card__body">
                    <h3 class="garaje-card__title">${g.titulo}</h3>
                    <p class="garaje-card__address">
                        <ion-icon name="location-outline"></ion-icon> ${g.direccion}
                    </p>
                    <div class="garaje-card__prices">
                        <div class="garaje-card__price">
                            Hora <strong>$${g.precioHora.toLocaleString()}</strong>
                        </div>
                        <div class="garaje-card__price">
                            Día <strong>$${g.precioDia.toLocaleString()}</strong>
                        </div>
                    </div>
                    <div class="garaje-card__actions">
                        <button onclick="window.location.href='/publicar-garaje?id=${g.id}'">
                            <ion-icon name="create-outline"></ion-icon> Editar
                        </button>
                        <button class="btn-delete" onclick="eliminarGaraje(${g.id})">
                            <ion-icon name="trash-outline"></ion-icon> Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    window.eliminarGaraje = function(id) {
        if (!confirm("¿Seguro que quieres eliminar este garaje?")) return;
        let garajes = getGarajes();
        garajes = garajes.filter(g => g.id !== id);
        saveGarajes(garajes);
        renderGarajes();
    };

    renderGarajes();
}