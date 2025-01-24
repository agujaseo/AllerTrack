class AlergiTrackApp {
    constructor() {
        const reaccionesRaw = localStorage.getItem('reacciones');
        const insensibilizacionesRaw = localStorage.getItem('insensibilizaciones');
        
        this.reacciones = reaccionesRaw ? JSON.parse(reaccionesRaw).map(r => {
            r.fecha = new Date(r.fecha);
            return r;
        }) : [];
        
        this.insensibilizaciones = insensibilizacionesRaw ? JSON.parse(insensibilizacionesRaw).map(i => {
            i.fecha = new Date(i.fecha);
            return i;
        }) : [];
        
        this.fechaActual = new Date();
        this.init();
    }

    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.setupTabs();
        this.renderCalendario();
    }

    cacheElements() {
        this.formReaccion = document.getElementById('form-reaccion');
        this.formInsensibilizacion = document.getElementById('form-insensibilizacion');
        this.calendarioElement = document.getElementById('calendario');
        this.mesActualElement = document.getElementById('mes-actual');
        this.mesAnteriorBtn = document.getElementById('mes-anterior');
        this.mesSiguienteBtn = document.getElementById('mes-siguiente');
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');
    }

    setupTabs() {
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remover clase active de todos los botones y contenidos
                this.tabButtons.forEach(btn => btn.classList.remove('active'));
                this.tabContents.forEach(content => content.classList.remove('active'));
                
                // Activar el botón y contenido seleccionado
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                document.querySelector(`.tab-content[data-tab="${tabId}"]`).classList.add('active');
            });
        });
    }

    setupEventListeners() {
        this.formReaccion.addEventListener('submit', this.registrarReaccion.bind(this));
        this.formInsensibilizacion.addEventListener('submit', this.registrarInsensibilizacion.bind(this));
        this.mesAnteriorBtn.addEventListener('click', () => this.cambiarMes(-1));
        this.mesSiguienteBtn.addEventListener('click', () => this.cambiarMes(1));
    }

    registrarReaccion(event) {
        event.preventDefault();
        
        // Limpiar errores previos
        Array.from(this.formReaccion.elements).forEach(element => {
            element.classList.remove('campo-invalido');
        });

        // Validar campos requeridos
        const camposRequeridos = [
            { 
                campo: 'alergeno', 
                mensaje: 'Por favor, especifique el alérgeno',
                validacion: value => value.trim().length >= 2
            },
            { 
                campo: 'hora-toma', 
                mensaje: 'Por favor, ingrese una hora válida',
                validacion: value => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            { 
                campo: 'hora-reaccion', 
                mensaje: 'Por favor, ingrese una hora válida',
                validacion: value => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            { 
                campo: 'gravedad', 
                mensaje: 'Por favor, seleccione la gravedad',
                validacion: value => ['leve', 'moderada', 'grave'].includes(value)
            }
        ];

        let errores = [];
        camposRequeridos.forEach(({ campo, mensaje, validacion }) => {
            const valor = this.formReaccion[campo].value;
            if (!valor || !validacion(valor)) {
                errores.push(mensaje);
                this.formReaccion[campo].classList.add('campo-invalido');
            }
        });

        if (errores.length > 0) {
            this.mostrarNotificacion(errores.join('\n'));
            return;
        }

        // Validar que la hora de reacción sea posterior a la hora de toma
        const horaToma = this.formReaccion['hora-toma'].value;
        const horaReaccion = this.formReaccion['hora-reaccion'].value;
        
        if (horaReaccion <= horaToma) {
            this.mostrarNotificacion('La hora de reacción debe ser posterior a la hora de toma');
            this.formReaccion['hora-toma'].classList.add('campo-invalido');
            this.formReaccion['hora-reaccion'].classList.add('campo-invalido');
            return;
        } else {
            this.formReaccion['hora-toma'].classList.remove('campo-invalido');
            this.formReaccion['hora-reaccion'].classList.remove('campo-invalido');
        }

        const nuevaReaccion = {
            id: Date.now(),
            fecha: new Date().toISOString(),
            alergeno: this.formReaccion.alergeno.value.trim(),
            horaToma: this.formReaccion['hora-toma'].value,
            horaReaccion: this.formReaccion['hora-reaccion'].value,
            gravedad: this.formReaccion.gravedad.value,
            alimento: this.formReaccion.alimento.value.trim(),
            notas: this.formReaccion.notas.value.trim()
        };

        this.reacciones.push(nuevaReaccion);
        this.guardarDatos();
        // Forzar actualización del calendario
        this.fechaActual = new Date();
        this.renderCalendario();
        this.mostrarNotificacion('Reacción registrada correctamente');
        this.formReaccion.reset();
    }

    registrarInsensibilizacion(event) {
        event.preventDefault();
        
        const camposRequeridos = [
            { 
                campo: 'fecha-insensibilizacion', 
                mensaje: 'Por favor, seleccione una fecha válida',
                validacion: value => !!value
            },
            { 
                campo: 'hora-insensibilizacion', 
                mensaje: 'Por favor, ingrese una hora válida',
                validacion: value => /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)
            },
            { 
                campo: 'dosis', 
                mensaje: 'Por favor, ingrese una dosis válida',
                validacion: value => !isNaN(value) && value > 0
            }
        ];

        let errores = [];
        camposRequeridos.forEach(({ campo, mensaje, validacion }) => {
            const valor = this.formInsensibilizacion[campo].value;
            if (!valor || !validacion(valor)) {
                errores.push(mensaje);
                this.formInsensibilizacion[campo].classList.add('campo-invalido');
            } else {
                this.formInsensibilizacion[campo].classList.remove('campo-invalido');
            }
        });

        if (errores.length > 0) {
            this.mostrarNotificacion(errores.join('\n'));
            return;
        }

        const nuevaInsensibilizacion = {
            id: Date.now(),
            fecha: this.formInsensibilizacion['fecha-insensibilizacion'].value,
            hora: this.formInsensibilizacion['hora-insensibilizacion'].value,
            dosis: parseFloat(this.formInsensibilizacion.dosis.value),
            observaciones: this.formInsensibilizacion['observaciones-insensibilizacion'].value.trim()
        };

        this.insensibilizaciones.push(nuevaInsensibilizacion);
        this.guardarDatos();
        // Forzar actualización del calendario
        this.fechaActual = new Date();
        this.renderCalendario();
        this.mostrarNotificacion('Insensibilización registrada correctamente');
        this.formInsensibilizacion.reset();
    }

    guardarDatos() {
        // Validar y formatear fechas antes de guardar
        this.reacciones = this.reacciones.map(r => {
            r.fecha = new Date(r.fecha).toISOString();
            return r;
        });
        
        this.insensibilizaciones = this.insensibilizaciones.map(i => {
            i.fecha = new Date(i.fecha).toISOString();
            return i;
        });

        localStorage.setItem('reacciones', JSON.stringify(this.reacciones));
        localStorage.setItem('insensibilizaciones', JSON.stringify(this.insensibilizaciones));
    }

    cambiarMes(delta) {
        this.fechaActual.setMonth(this.fechaActual.getMonth() + delta);
        this.renderCalendario();
    }

    renderCalendario() {
        this.calendarioElement.innerHTML = '';
        this.mesActualElement.textContent = this.fechaActual.toLocaleString('es-ES', {
            month: 'long',
            year: 'numeric'
        });

        const primerDiaMes = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), 1);
        const ultimoDiaMes = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth() + 1, 0);
        const diasMes = ultimoDiaMes.getDate();
        
        // Obtener el día de la semana del primer día (0=Domingo, 1=Lunes, ..., 6=Sábado)
        let primerDiaSemana = primerDiaMes.getDay();
        
        // Ajustar para que la semana empiece en Lunes (1)
        if (primerDiaSemana === 0) {
            primerDiaSemana = 6; // Domingo se convierte en 6 espacios vacíos
        } else {
            primerDiaSemana--;   // Restar 1 para que Lunes sea 0 espacios vacíos
        }

        // Rellenar días vacíos al inicio
        for (let i = 0; i < primerDiaSemana; i++) {
            this.calendarioElement.appendChild(this.crearDiaVacio());
        }

        // Crear días del mes
        for (let dia = 1; dia <= diasMes; dia++) {
            const fecha = new Date(this.fechaActual.getFullYear(), this.fechaActual.getMonth(), dia);
            const tieneReacciones = this.reacciones.some(r => {
                const fechaReaccion = new Date(r.fecha);
                return fechaReaccion.getFullYear() === fecha.getFullYear() &&
                       fechaReaccion.getMonth() === fecha.getMonth() &&
                       fechaReaccion.getDate() === fecha.getDate();
            });

            const tieneInsensibilizaciones = this.insensibilizaciones.some(i => {
                const fechaInsensibilizacion = new Date(i.fecha);
                return fechaInsensibilizacion.getFullYear() === fecha.getFullYear() &&
                       fechaInsensibilizacion.getMonth() === fecha.getMonth() &&
                       fechaInsensibilizacion.getDate() === fecha.getDate();
            });

            const diaElement = document.createElement('div');
            diaElement.className = 'dia-calendario' + 
                (tieneReacciones ? ' dia-con-reaccion' : '') +
                (tieneInsensibilizaciones ? ' dia-con-insensibilizacion' : '');
            diaElement.textContent = dia;
            
            // Cambiar color de fondo según el tipo de registro
            if (tieneReacciones) {
                diaElement.style.backgroundColor = '#ffebee'; // Rojo claro
            }
            if (tieneInsensibilizaciones) {
                diaElement.style.backgroundColor = '#e8f5e9'; // Verde claro
            }
            
            diaElement.addEventListener('click', () => this.mostrarDetallesDia(fecha));
            
            this.calendarioElement.appendChild(diaElement);
        }
    }

    crearDiaVacio() {
        const div = document.createElement('div');
        div.className = 'dia-calendario otro-mes';
        return div;
    }

    mostrarDetallesDia(fecha) {
        const reaccionesDia = this.reacciones.filter(r => {
            const fechaReaccion = new Date(r.fecha);
            return fechaReaccion.toDateString() === fecha.toDateString();
        });

        const insensibilizacionesDia = this.insensibilizaciones.filter(i => {
            const fechaInsensibilizacion = new Date(i.fecha);
            return fechaInsensibilizacion.toDateString() === fecha.toDateString();
        });

        // Crear modal
        const modal = document.createElement('div');
        modal.className = 'modal-detalles';
        modal.innerHTML = `
            <div class="modal-contenido">
                <button class="cerrar-modal">&times;</button>
                <h3>Registros del ${fecha.toLocaleDateString('es-ES')}</h3>
                
                ${reaccionesDia.length > 0 ? `
                    <h4>Reacciones</h4>
                    ${reaccionesDia.map(r => `
                        <div class="detalle-reaccion" data-id="${r.id}">
                            <div class="detalle-contenido">
                                <p><strong>Alérgeno:</strong> ${r.alergeno}</p>
                                <p><strong>Gravedad:</strong> ${r.gravedad}</p>
                                <p><strong>Hora toma:</strong> ${r.horaToma}</p>
                                <p><strong>Hora reacción:</strong> ${r.horaReaccion}</p>
                                ${r.alimento ? `<p><strong>Alimento:</strong> ${r.alimento}</p>` : ''}
                                ${r.notas ? `<p><strong>Notas:</strong> ${r.notas}</p>` : ''}
                            </div>
                            <div class="controles-reaccion">
                                <button class="editar-reaccion">✏️ Editar</button>
                                <button class="eliminar-reaccion">🗑️ Eliminar</button>
                            </div>
                        </div>
                    `).join('')}
                ` : '<p>No hay reacciones registradas para este día</p>'}
                
                ${insensibilizacionesDia.length > 0 ? `
                    <h4>Insensibilizaciones</h4>
                    ${insensibilizacionesDia.map(i => `
                        <div class="detalle-insensibilizacion" data-id="${i.id}">
                            <div class="detalle-contenido">
                                <p><strong>Hora:</strong> ${i.hora}</p>
                                <p><strong>Dosis:</strong> ${i.dosis} mg</p>
                                ${i.observaciones ? `<p><strong>Observaciones:</strong> ${i.observaciones}</p>` : ''}
                            </div>
                            <div class="controles-insensibilizacion">
                                <button class="editar-insensibilizacion">✏️ Editar</button>
                                <button class="eliminar-insensibilizacion">🗑️ Eliminar</button>
                            </div>
                        </div>
                    `).join('')}
                ` : '<p>No hay insensibilizaciones registradas para este día</p>'}
            </div>
        `;

        // Evento para cerrar modal
        modal.querySelector('.cerrar-modal').addEventListener('click', () => {
            modal.remove();
        });

        // Cerrar al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        // Agregar listeners para botones de eliminar
        modal.querySelectorAll('.eliminar-reaccion').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm('¿Estás seguro de que deseas eliminar esta reacción?')) {
                    const id = parseInt(e.target.closest('.detalle-reaccion').dataset.id);
                    this.eliminarReaccion(id);
                    modal.remove();
                }
            });
        });

        modal.querySelectorAll('.eliminar-insensibilizacion').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm('¿Estás seguro de que deseas eliminar esta insensibilización?')) {
                    const id = parseInt(e.target.closest('.detalle-insensibilizacion').dataset.id);
                    this.eliminarInsensibilizacion(id);
                    modal.remove();
                }
            });
        });

        // Agregar listeners para botones de editar
        modal.querySelectorAll('.editar-reaccion').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.detalle-reaccion').dataset.id);
                const reaccion = this.reacciones.find(r => r.id === id);
                this.mostrarFormularioEdicionReaccion(reaccion, modal);
            });
        });

        modal.querySelectorAll('.editar-insensibilizacion').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.detalle-insensibilizacion').dataset.id);
                const insensibilizacion = this.insensibilizaciones.find(i => i.id === id);
                this.mostrarFormularioEdicionInsensibilizacion(insensibilizacion, modal);
            });
        });

        document.body.appendChild(modal);
    }

    mostrarFormularioEdicionReaccion(reaccion, modal) {
        const form = document.createElement('form');
        form.className = 'form-edicion';
        form.innerHTML = `
            <h4>Editar Reacción</h4>
            <label>Alérgeno:</label>
            <input type="text" name="alergeno" value="${reaccion.alergeno}" required>
            
            <label>Gravedad:</label>
            <select name="gravedad" required>
                <option value="leve" ${reaccion.gravedad === 'leve' ? 'selected' : ''}>Leve</option>
                <option value="moderada" ${reaccion.gravedad === 'moderada' ? 'selected' : ''}>Moderada</option>
                <option value="grave" ${reaccion.gravedad === 'grave' ? 'selected' : ''}>Grave</option>
            </select>
            
            <label>Hora toma:</label>
            <input type="time" name="horaToma" value="${reaccion.horaToma}" required>
            
            <label>Hora reacción:</label>
            <input type="time" name="horaReaccion" value="${reaccion.horaReaccion}" required>
            
            <label>Alimento:</label>
            <input type="text" name="alimento" value="${reaccion.alimento || ''}">
            
            <label>Notas:</label>
            <textarea name="notas">${reaccion.notas || ''}</textarea>
            
            <button type="submit">Guardar cambios</button>
            <button type="button" class="cancelar-edicion">Cancelar</button>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevosDatos = {
                alergeno: form.alergeno.value.trim(),
                gravedad: form.gravedad.value,
                horaToma: form.horaToma.value,
                horaReaccion: form.horaReaccion.value,
                alimento: form.alimento.value.trim(),
                notas: form.notas.value.trim()
            };
            this.editarReaccion(reaccion.id, nuevosDatos);
            modal.remove();
        });

        form.querySelector('.cancelar-edicion').addEventListener('click', () => {
            form.remove();
        });

        modal.querySelector('.modal-contenido').appendChild(form);
    }

    mostrarFormularioEdicionInsensibilizacion(insensibilizacion, modal) {
        const form = document.createElement('form');
        form.className = 'form-edicion';
        form.innerHTML = `
            <h4>Editar Insensibilización</h4>
            <label>Fecha:</label>
            <input type="date" name="fecha" value="${new Date(insensibilizacion.fecha).toISOString().split('T')[0]}" required>
            
            <label>Hora:</label>
            <input type="time" name="hora" value="${insensibilizacion.hora}" required>
            
            <label>Dosis (mg):</label>
            <input type="number" step="0.1" name="dosis" value="${insensibilizacion.dosis}" required>
            
            <label>Observaciones:</label>
            <textarea name="observaciones">${insensibilizacion.observaciones || ''}</textarea>
            
            <button type="submit">Guardar cambios</button>
            <button type="button" class="cancelar-edicion">Cancelar</button>
        `;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const nuevosDatos = {
                fecha: form.fecha.value,
                hora: form.hora.value,
                dosis: parseFloat(form.dosis.value),
                observaciones: form.observaciones.value.trim()
            };
            this.editarInsensibilizacion(insensibilizacion.id, nuevosDatos);
            modal.remove();
        });

        form.querySelector('.cancelar-edicion').addEventListener('click', () => {
            form.remove();
        });

        modal.querySelector('.modal-contenido').appendChild(form);
    }

    eliminarReaccion(id) {
        this.reacciones = this.reacciones.filter(r => r.id !== id);
        this.guardarDatos();
        this.renderCalendario();
        this.mostrarNotificacion('Reacción eliminada correctamente');
    }

    editarReaccion(id, nuevosDatos) {
        const index = this.reacciones.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reacciones[index] = { ...this.reacciones[index], ...nuevosDatos };
            this.guardarDatos();
            this.renderCalendario();
            this.mostrarNotificacion('Reacción actualizada correctamente');
        }
    }

    editarInsensibilizacion(id, nuevosDatos) {
        const index = this.insensibilizaciones.findIndex(i => i.id === id);
        if (index !== -1) {
            this.insensibilizaciones[index] = { ...this.insensibilizaciones[index], ...nuevosDatos };
            this.guardarDatos();
            this.renderCalendario();
            this.mostrarNotificacion('Insensibilización actualizada correctamente');
        }
    }

    eliminarInsensibilizacion(id) {
        this.insensibilizaciones = this.insensibilizaciones.filter(i => i.id !== id);
        this.guardarDatos();
        this.renderCalendario();
        this.mostrarNotificacion('Insensibilización eliminada correctamente');
    }

    mostrarNotificacion(mensaje) {
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion';
        notificacion.textContent = mensaje;
        document.body.appendChild(notificacion);

        setTimeout(() => {
            notificacion.remove();
        }, 3000);
    }

    eliminarReaccion(id) {
        this.reacciones = this.reacciones.filter(r => r.id !== id);
        this.guardarDatos();
        this.renderCalendario();
        this.mostrarNotificacion('Reacción eliminada correctamente');
    }

    editarReaccion(id, nuevosDatos) {
        const index = this.reacciones.findIndex(r => r.id === id);
        if (index !== -1) {
            this.reacciones[index] = { ...this.reacciones[index], ...nuevosDatos };
            this.guardarDatos();
            this.renderCalendario();
            this.mostrarNotificacion('Reacción actualizada correctamente');
        }
    }

    eliminarInsensibilizacion(id) {
        this.insensibilizaciones = this.insensibilizaciones.filter(i => i.id !== id);
        this.guardarDatos();
        this.renderCalendario();
        this.mostrarNotificacion('Insensibilización eliminada correctamente');
    }

    editarInsensibilizacion(id, nuevosDatos) {
        const index = this.insensibilizaciones.findIndex(i => i.id === id);
        if (index !== -1) {
            this.insensibilizaciones[index] = { ...this.insensibilizaciones[index], ...nuevosDatos };
            this.guardarDatos();
            this.renderCalendario();
            this.mostrarNotificacion('Insensibilización actualizada correctamente');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AlergiTrackApp();
});
