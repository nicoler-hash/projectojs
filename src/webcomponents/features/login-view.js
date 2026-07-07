import { registerUser, loginUser } from '../../lib/auth.js';
import { commonUiCss } from '../../lib/common-ui-css.js';
import { dispatch, AppEvents } from '../../lib/events.js';

class LoginView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.getElementById('to-register')?.addEventListener('click', () => this.toggleForms('register'));
    this.shadowRoot.getElementById('to-login')?.addEventListener('click', () => this.toggleForms('login'));
  }

  toggleForms(which) {
    const isRegister = which === 'register';
    this.shadowRoot.getElementById('panel-login').style.display = isRegister ? 'none' : 'block';
    this.shadowRoot.getElementById('panel-register').style.display = isRegister ? 'block' : 'none';
  }

  async onRegister(e) {
    e.preventDefault();
    const payload = e?.currentTarget?.__payload || this._readFormData(e?.currentTarget);

    try {
      await registerUser(payload);

      dispatch(AppEvents.toast, { type: 'success', title: 'Usuario creado', message: 'Ahora inicia sesión.' });
      this.toggleForms('login');
      this._clearForm(this.shadowRoot.getElementById('form-register'));

    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }

  async onLogin(e) {
    e.preventDefault();
    const payload = e?.currentTarget?.__payload || this._readFormData(e?.currentTarget);

    try {
      await loginUser(payload);

      dispatch(AppEvents.toast, { type: 'success', title: 'Bienvenido', message: 'Acceso concedido.' });
      location.hash = 'users';
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'No se pudo iniciar', message: err.message || String(err) });
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${commonUiCss()}
        ${loginCss()}
      </style>
      <div class="center">

        <div class="container" style="width:min(980px, calc(100% - 24px));">
          <div class="card">
            <div class="grid-2">
              <div id="panel-login">
                <div style="font-weight:1000; font-size:20px; margin-bottom:6px">Login</div>
                <div style="color:var(--muted); margin-bottom:14px">Autenticación por número de identificación y contraseña.</div>

                <form id="form-login" class="col">
                  <acme-input label="Identificación" name="identificacion" placeholder="Ej: 123456" required></acme-input>
                  <acme-input label="Contraseña" name="password" type="password" placeholder="••••••" required></acme-input>

                  <button class="btn btn-primary" type="submit">Ingresar</button>
                </form>

                <div style="height:10px"></div>
                <button class="btn" id="to-register" type="button">No tengo cuenta - Registrarme</button>
              </div>

              <div id="panel-register" style="display:none">
                <div style="font-weight:1000; font-size:20px; margin-bottom:6px">Registro</div>
                <div style="color:var(--muted); margin-bottom:14px">Doble validación de contraseña para prevenir errores.</div>

                <form id="form-register" class="col">
                  <acme-input label="Identificación" name="identificacion" placeholder="Ej: 123456" required></acme-input>
                  <acme-input label="Nombre completo" name="nombre" placeholder="Ej: Juan Pérez" required></acme-input>
                  <acme-input label="Cargo" name="cargo" placeholder="Ej: Operario" required></acme-input>
                  <acme-input label="Contraseña" name="password" type="password" placeholder="Mínimo 6 caracteres" required></acme-input>
                  <acme-input label="Confirmar contraseña" name="password2" type="password" placeholder="Repetir contraseña" required></acme-input>

                  <button class="btn btn-success" type="submit">Crear cuenta</button>
                </form>

                <div style="height:10px"></div>
                <button class="btn" id="to-login" type="button">Ya tengo cuenta - Ir al login</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._bindForms();
  }

  _bindForms() {
    const loginForm = this.shadowRoot.getElementById('form-login');
    const registerForm = this.shadowRoot.getElementById('form-register');

    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onLogin({ preventDefault() {}, currentTarget: { __payload: this._readFormData(loginForm) } });
    });

    registerForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.onRegister({ preventDefault() {}, currentTarget: { __payload: this._readFormData(registerForm) } });
    });
  }

  _clearForm(formEl) {
    const scope = formEl || this.shadowRoot;
    scope.querySelectorAll('acme-input').forEach((cmp) => {
      const name = cmp.getAttribute('name');
      if (!name) return;
      cmp.setAttribute('value', '');
    });
  }

  _readFormData(formEl) {
    const payload = {};
    if (!formEl) return payload;

    formEl.querySelectorAll('acme-input').forEach((cmp) => {
      const nm = cmp.getAttribute('name');
      if (!nm) return;

      // Leer directamente el <input> interno del shadow de acme-input
      const inner = cmp.shadowRoot?.querySelector('input');
      payload[nm] = inner?.value ?? cmp.value ?? '';
    });

    return payload;
  }
}

function loginCss(){
  return `
    .login-layout{width:min(980px, calc(100% - 24px));}
    .login-header{font-weight:1000; font-size:20px; margin-bottom:6px;}
    .login-subtitle{color:var(--muted); margin-bottom:14px;}
  `;
}


customElements.define('acme-login-view', LoginView);


