import { database } from '../services/api.js';

export async function initUsers(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <h2>Gestión de Usuarios</h2>
            <button id="btn-new-user" style="width: auto;">+ Nuevo Usuario</button>
        </div>
        <div id="alert-box" class="alert"></div>

        <div class="card" id="form-container" style="display: none;">
            <h3 id="form-title">Crear Usuario</h3>
            <form id="user-form">
                <label>Número de Identificación</label>
                <input type="text" id="user-id" pattern="\\d+" title="Debe contener solo números" required>
                
                <label>Nombre Completo</label>
                <input type="text" id="user-name" required>
                
                <label>Cargo</label>
                <select id="user-role" required>
                    <option value="">Seleccione un cargo...</option>
                    <option value="admin">Administrador</option>
                    <option value="operario">Operario</option>
                </select>

                <label>Contraseña</label>
                <input type="password" id="user-pass" minlength="9" required>
                
                <div class="flex gap-1">
                    <button type="submit">Guardar</button>
                    <button type="button" class="btn-danger" id="btn-cancel">Cancelar</button>
                </div>
            </form>
        </div>

        <div class="card">
            <table>
                <thead>
                    <tr>
                        <th>Identificación</th>
                        <th>Nombre</th>
                        <th>Cargo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="users-tbody">

                </tbody>
            </table>
        </div>
    `;

    const alertBox = document.getElementById('alert-box');
    const formContainer = document.getElementById('form-container');
    const userForm = document.getElementById('user-form');
    const tbody = document.getElementById('users-tbody');
    let isEditing = false;

    function showAlert(msg, type = 'error') {
        alertBox.textContent = msg;
        alertBox.className = `alert alert-${type} show`;
        setTimeout(() => { alertBox.className = 'alert'; }, 4000);
    }

    async function loadUsers() {
        try {
            const data = await database.read('users');
            tbody.innerHTML = '';
            if (data) {
                Object.values(data).forEach(user => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${user.id}</td>
                        <td>${user.name}</td>
                        <td>${user.role}</td>
                        <td>
                            <button class="btn-edit" data-id="${user.id}" style="width: auto; margin-right: 0.5rem;">Editar</button>
                            <button class="btn-delete btn-danger" data-id="${user.id}" style="width: auto;">Eliminar</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });


                document.querySelectorAll('.btn-edit').forEach(btn => {
                    btn.addEventListener('click', (e) => editUser(e.target.dataset.id));
                });
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', (e) => deleteUser(e.target.dataset.id));
                });
            }
        } catch (error) {
            showAlert('Error al cargar usuarios: ' + error.message);
        }
    }

    document.getElementById('btn-new-user').addEventListener('click', () => {
        isEditing = false;
        userForm.reset();
        document.getElementById('user-id').disabled = false;
        document.getElementById('form-title').textContent = 'Crear Usuario';
        formContainer.style.display = 'block';
    });

    document.getElementById('btn-cancel').addEventListener('click', () => {
        formContainer.style.display = 'none';
        userForm.reset();
    });

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('user-id').value.trim();
        const name = document.getElementById('user-name').value.trim();
        const role = document.getElementById('user-role').value;
        const pass = document.getElementById('user-pass').value.trim();

        if (!id || !name || !role || !pass) {
            return showAlert('Todos los campos son obligatorios');
        }

        if (!/^\d+$/.test(id)) {
            return showAlert('La identificación debe ser numérica');
        }

        if (pass.length <= 8) {
            return showAlert('La contraseña debe tener más de 8 caracteres');
        }

        try {
            const userData = { id, name, role, password: pass };
            
            if (isEditing) {
                await database.update('users', id, userData);
                showAlert('Usuario actualizado', 'success');
            } else {
                const existing = await database.readOne('users', id);
                if (existing) return showAlert('El usuario ya existe');
                await database.create('users', id, userData);
                showAlert('Usuario creado', 'success');
            }
            
            formContainer.style.display = 'none';
            loadUsers();
        } catch (error) {
            showAlert('Error al guardar: ' + error.message);
        }
    });

    async function editUser(id) {
        try {
            const user = await database.readOne('users', id);
            if (user) {
                document.getElementById('user-id').value = user.id;
                document.getElementById('user-id').disabled = true;
                document.getElementById('user-name').value = user.name;
                document.getElementById('user-role').value = user.role;
                document.getElementById('user-pass').value = user.password;
                
                isEditing = true;
                document.getElementById('form-title').textContent = 'Editar Usuario';
                formContainer.style.display = 'block';
            }
        } catch (error) {
            showAlert('Error al obtener usuario: ' + error.message);
        }
    }

    async function deleteUser(id) {
        if (confirm(`¿Está seguro de eliminar el usuario ${id}?`)) {
            try {
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                if (currentUser && currentUser.id === id) {
                    return showAlert('No puedes eliminar tu propio usuario activo');
                }
                await database.remove('users', id);
                showAlert('Usuario eliminado', 'success');
                loadUsers();
            } catch (error) {
                showAlert('Error al eliminar: ' + error.message);
            }
        }
    }


    loadUsers();
}
