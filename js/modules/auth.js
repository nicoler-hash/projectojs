import { database } from '../services/api.js';

export function checkAuth() {
    return localStorage.getItem('currentUser') !== null;
}

export function initAuth(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 400px; margin: 4rem auto;">
            <h2 class="text-center" id="auth-title">Iniciar Sesión</h2>
            <div id="alert-box" class="alert"></div>
            
            <form id="login-form">
                <label>Número de Identificación</label>
                <input type="text" id="login-id" pattern="\\d+" title="Debe contener solo números" required>
                
                <label>Contraseña</label>
                <input type="password" id="login-pass" minlength="9" required>
                
                <button type="submit" class="mt-1">Ingresar</button>
                <p class="text-center mt-1"><a href="#" id="go-register">¿No tienes cuenta? Regístrate</a></p>
            </form>

            <form id="register-form" style="display: none;">
                <label>Número de Identificación</label>
                <input type="text" id="reg-id" pattern="\\d+" title="Debe contener solo números" required>
                
                <label>Nombre Completo</label>
                <input type="text" id="reg-name" required>
                
                <label>Cargo</label>
                <select id="reg-role" required>
                    <option value="">Seleccione un cargo...</option>
                    <option value="admin">Administrador</option>
                    <option value="operario">Operario</option>
                </select>

                <label>Contraseña</label>
                <input type="password" id="reg-pass" minlength="9" required>
                
                <label>Confirmar Contraseña</label>
                <input type="password" id="reg-pass-confirm" minlength="9" required>
                
                <button type="submit" class="mt-1">Registrarse</button>
                <p class="text-center mt-1"><a href="#" id="go-login">¿Ya tienes cuenta? Inicia sesión</a></p>
            </form>
        </div>
    `;

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const authTitle = document.getElementById('auth-title');
    const alertBox = document.getElementById('alert-box');

    function showAlert(msg, type = 'error') {
        alertBox.textContent = msg;
        alertBox.className = `alert alert-${type} show`;
        setTimeout(() => { alertBox.className = 'alert'; }, 4000);
    }

    document.getElementById('go-register').addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        authTitle.textContent = 'Registrarse';
    });

    document.getElementById('go-login').addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
        authTitle.textContent = 'Iniciar Sesión';
    });


    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-id').value.trim();
        const pass = document.getElementById('login-pass').value.trim();

        if (!id || !pass) {
            return showAlert('Todos los campos son obligatorios');
        }

        if (!/^\d+$/.test(id)) {
            return showAlert('La identificación debe ser numérica');
        }

        try {
            const user = await database.readOne('users', id);
            if (!user || user.password !== pass) {
                return showAlert('Credenciales inválidas');
            }
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            window.dispatchEvent(new CustomEvent('route-change', { detail: { route: 'inventory' } }));
        } catch (error) {
            showAlert('Error al iniciar sesión: ' + error.message);
        }
    });


    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('reg-id').value.trim();
        const name = document.getElementById('reg-name').value.trim();
        const role = document.getElementById('reg-role').value;
        const pass = document.getElementById('reg-pass').value.trim();
        const passConfirm = document.getElementById('reg-pass-confirm').value.trim();

        if (!id || !name || !role || !pass || !passConfirm) {
            return showAlert('Todos los campos son obligatorios');
        }

        if (!/^\d+$/.test(id)) {
            return showAlert('La identificación debe ser numérica');
        }

        if (pass.length <= 8) {
            return showAlert('La contraseña debe tener más de 8 caracteres');
        }

        if (pass !== passConfirm) {
            return showAlert('Las contraseñas no coinciden (doble validación fallida)');
        }

        try {
            const existingUser = await database.readOne('users', id);
            if (existingUser) {
                return showAlert('El número de identificación ya está registrado');
            }

            const newUser = { id, name, role, password: pass };
            await database.create('users', id, newUser);
            
            showAlert('Usuario registrado exitosamente. Puede iniciar sesión.', 'success');
            registerForm.reset();
            document.getElementById('go-login').click();
        } catch (error) {
            showAlert('Error al registrar: ' + error.message);
        }
    });
}
