import { registerUser, loginUser } from '../../lib/auth.js';
import { dispatch, AppEvents } from '../../lib/events.js';

class LoginView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.shadowRoot.getElementById('form-login')?.addEventListener('submit', (e) => this.onLogin(e));
    this.shadowRoot.getElementById('form-register')?.addEventListener('submit', (e) => this.onRegister(e));
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
    const payload = e?.currentTarget?.__payload || this._readFormData();

    try {
      await registerUser(payload);

      dispatch(AppEvents.toast, { type: 'success', title: 'Usuario creado', message: 'Ahora inicia sesión.' });
      this.toggleForms('login');
      this._clearForm();

    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }

  async onLogin(e) {
    e.preventDefault();
    const payload = e?.currentTarget?.__payload || this._readFormData();

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

    // Make sure inputs are usable in plain form submissions.
    this._wireInputs(this.shadowRoot.getElementById('form-login'));
    this._wireInputs(this.shadowRoot.getElementById('form-register'));
  }

  _clearForm() {
    this.shadowRoot.querySelectorAll('acme-input').forEach((cmp) => {
      const name = cmp.getAttribute('name');
      if (!name) return;
      cmp.setAttribute('value', '');
    });
  }


  _wireInputs(formEl) {
    // acme-input renders its own internal input element; we need it to participate in FormData.
    // We set the name attribute and keep it in the shadow tree; browsers don't include shadow inputs in FormData.
    // Therefore we intercept submit and read values directly from components.
    if (!formEl) return;

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = this._readFormData(formEl);
      if (formEl.id === 'form-login') {
        this.onLogin({ preventDefault(){}, currentTarget: { ...formEl, __payload: payload } });
      }
      if (formEl.id === 'form-register') {
        this.onRegister({ preventDefault(){}, currentTarget: { ...formEl, __payload: payload } });
      }
    }, { once: true });
  }

  _readFormData() {
    const payload = {};
    const inputs = this.shadowRoot.querySelectorAll('acme-input');

    inputs.forEach((cmp) => {
      const nm = cmp.getAttribute('name');
      if (!nm) return;

      // Leer directamente el <input> interno del shadow de acme-input
      const inner = cmp.shadowRoot?.querySelector('input');
      payload[nm] = inner?.value ?? cmp.value ?? '';
    });

    return payload;
  }
}

function commonUiCss(){
  return `
    :host{display:block}
    /* base */

    .center{
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px 0;
    }
    .container{
      width:min(1120px, calc(100% - 24px));
      margin:0 auto;
    }
    .card{
      background: linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01));
      border:1px solid rgba(148,163,184,.25);
      border-radius:14px;
      box-shadow: 0 10px 30px rgba(0,0,0,.35);
      padding:18px;
      color:var(--text);
    }
    .row{display:flex; gap:12px; align-items:center;}
    .col{display:flex; flex-direction:column; gap:10px;}
    .grid-2{display:grid; grid-template-columns: 1fr 1fr; gap:12px;}
    @media (max-width: 860px){.grid-2{grid-template-columns:1fr;}}
    .label{font-size:13px; color: var(--muted); font-weight:700; margin-bottom:6px;}
    .btn{
      appearance:none;
      border:1px solid rgba(148,163,184,.25);
      border-radius:12px;
      background: rgba(255,255,255,.03);
      color:var(--text);
      padding:10px 12px;
      font-weight:600;
      cursor:pointer;
      transition: transform .05s ease, background .2s ease, border-color .2s ease;
    }
    .btn:focus{outline:none; box-shadow: var(--focus)}
    .btn-primary{background: rgba(59,130,246,.18); border-color: rgba(59,130,246,.45)}
    .btn-danger{background: rgba(251,113,133,.12); border-color: rgba(251,113,133,.45)}
    .btn-success{background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.45)}
  `;
}

function loginCss(){
  return `
    .login-layout{width:min(980px, calc(100% - 24px));}
    .login-header{font-weight:1000; font-size:20px; margin-bottom:6px;}
    .login-subtitle{color:var(--muted); margin-bottom:14px;}
  `;
}


customElements.define('acme-login-view', LoginView);


