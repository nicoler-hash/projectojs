import { onAuth, logoutUser } from '../lib/auth.js';
import { dispatch, AppEvents } from '../lib/events.js';
import '../webcomponents/ui/acme-toast.js';

import './features/login-view.js';
import './features/users-view.js';
import './features/inventory-view.js';
import './features/production-view.js';

const STORAGE_ROUTE = 'acme-route';

class AcmeApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this.state = {
      user: null,
    };

    this._onAuth = () => {
      // routed by view components
    };

    this._onToast = (e) => {
      // Toast component handles it via listener; still dispatch for consistency.
      this._toast = e;
    };
  }

  static get styleText() {
    return ``;
  }


  connectedCallback() {
    this.render();

    this._unsubscribe = onAuth((user) => {
      this.state.user = user;
      this.render();
    });

    window.addEventListener(AppEvents.toast, this._onToast);

    window.addEventListener('hashchange', () => this.syncRoute());
    this.syncRoute();
  }

  disconnectedCallback() {
    this._unsubscribe?.();
    window.removeEventListener(AppEvents.toast, this._onToast);
  }

  syncRoute() {
    const hash = location.hash.replace('#', '');
    const route = hash || this.getRouteFromStorage() || 'login';
    this.setRoute(route);
  }

  getRouteFromStorage() {
    return localStorage.getItem(STORAGE_ROUTE);
  }

  setRoute(route) {
    localStorage.setItem(STORAGE_ROUTE, route);
    this.route = route;
    this.updateNavHighlight();
    this.updateViewVisibility();
  }

  updateNavHighlight() {
    // no-op: kept in sync in template via attributes
  }

  updateViewVisibility() {
    // View components are always present, but we show/hide in template.
    // We re-render to keep simple.
    this.render();
  }

  navigate(route) {
    location.hash = route;
    this.setRoute(route);
  }

  async handleLogout() {
    await logoutUser();
    dispatch(AppEvents.toast, { type: 'success', title: 'Sesión cerrada', message: 'Vuelve pronto.' });
    this.navigate('login');
  }

  render() {
    const route = this.route || this.getRouteFromStorage() || 'login';
    const logged = !!this.state.user;

    this.shadowRoot.innerHTML = `
      <style>
        ${this.styleText ?? ''}
      </style>
      <div class="container">
        ${logged ? this.navTemplate(route) : ''}

        <div style="height:14px"></div>

        ${logged ? this.privateViewsTemplate(route) : `<acme-login-view></acme-login-view>`}

        ${logged ? this.sharedToastsTemplate() : this.sharedToastsTemplate()}
      </div>
    `;

    this.bindChildEvents(route);
  }

  sharedToastsTemplate() {
    return `<acme-toast-wrap></acme-toast-wrap>`;
  }

  navTemplate(route) {
    return `
      <div class="card" style="padding:14px">
        <div class="row" style="justify-content:space-between;">
          <div class="col" style="gap:4px">
            <div style="font-weight:1000; font-size:16px">Acme Producción</div>
            <div style="color:var(--muted); font-size:13px">Gestión de producción – CRUD</div>
          </div>

          <div class="row" style="gap:10px">
            <button class="btn" id="btn-logout" type="button">Cerrar sesión</button>
          </div>
        </div>
        <div style="height:12px"></div>
        <div class="nav" aria-label="Navegación">
          <button class="btn ${route === 'users' ? 'btn-primary' : ''}" data-route="users" type="button">Usuarios</button>
          <button class="btn ${route === 'inventory' ? 'btn-primary' : ''}" data-route="inventory" type="button">Inventario</button>
          <button class="btn ${route === 'production' ? 'btn-primary' : ''}" data-route="production" type="button">Producción</button>
        </div>
      </div>
    `;
  }

  privateViewsTemplate(route) {
    return `
      <div style="display:grid; gap:12px">
        <div style="display:none" id="view-login"> </div>

        <div style="display:${route === 'users' ? 'block' : 'none'}" id="view-users">
          <acme-users-view></acme-users-view>
        </div>

        <div style="display:${route === 'inventory' ? 'block' : 'none'}" id="view-inventory">
          <acme-inventory-view></acme-inventory-view>
        </div>

        <div style="display:${route === 'production' ? 'block' : 'none'}" id="view-production">
          <acme-production-view></acme-production-view>
        </div>
      </div>
    `;
  }

  bindChildEvents() {
    const btnLogout = this.shadowRoot.getElementById('btn-logout');
    btnLogout?.addEventListener('click', () => this.handleLogout());

    this.shadowRoot.querySelectorAll('[data-route]').forEach((btn) => {
      btn.addEventListener('click', () => this.navigate(btn.dataset.route));
    });
  }
}

customElements.define('acme-app', AcmeApp);

