import { dispatch, AppEvents } from '../../lib/events.js';
import { commonUiCss } from '../../lib/common-ui-css.js';
import { db } from '../../lib/firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { safeTrim } from '../../lib/format.js';

class UsersView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.refresh();

    this.shadowRoot.getElementById('btn-create-user')?.addEventListener('click', () => this.openCreate());
    this.shadowRoot.getElementById('btn-save-user')?.addEventListener('click', () => this.saveUser());
    this.shadowRoot.getElementById('btn-cancel-user')?.addEventListener('click', () => this.closeModal());
    this.shadowRoot.getElementById('btn-clear-form')?.addEventListener('click', () => this.clearForm());
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${commonUiCss()}${usersCss()}</style>
      <div class="card">



        <div class="row" style="justify-content:space-between">
          <div class="col" style="gap:4px">
            <div style="font-weight:1000; font-size:18px">Módulo de usuarios</div>
            <div style="color:var(--muted); font-size:13px">Crear / modificar / eliminar usuarios</div>
          </div>
          <button class="btn btn-primary" id="btn-create-user" type="button">Nuevo usuario</button>
        </div>

        <div style="height:12px"></div>

        <div id="users-list">Cargando...</div>

        <acme-modal id="user-modal" title="Usuario" open="false">
          <div class="grid-2">
            <div class="col">
              <acme-input label="Identificación" name="identificacion" placeholder="Ej: 123" required></acme-input>
              <acme-input label="Nombre completo" name="nombre" placeholder="Ej: Juan Pérez" required></acme-input>
            </div>
            <div class="col">
              <acme-input label="Cargo" name="cargo" placeholder="Ej: Operario" required></acme-input>
              <acme-input label="Contraseña" name="password" type="password" placeholder="••••••" required></acme-input>
            </div>
          </div>

          <div style="height:12px"></div>
          <div class="grid-2">
            <acme-input label="Confirmar contraseña" name="password2" type="password" placeholder="Repetir contraseña" required></acme-input>
            <div class="col">
              <div class="label">Acción</div>
              <div class="badge" id="mode-badge">Crear</div>
            </div>
          </div>

          <div slot="actions"></div>
          <div class="modal-actions" slot="actions">
            <button class="btn" id="btn-cancel-user" type="button">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-user" type="button">Guardar</button>
          </div>
        </acme-modal>
      </div>
    `;

    // Store references
    this.modal = this.shadowRoot.getElementById('user-modal');
    this.modeBadge = this.shadowRoot.getElementById('mode-badge');
  }

  async refresh() {
    try {
      const colRef = collection(db, 'users');
      const snap = await getDocs(colRef);
      const users = snap.docs.map((d) => d.data());

      this.users = users;
      this.shadowRoot.getElementById('users-list').innerHTML = this.tableTemplate(users);

      this._bindRowButtons();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
      this.shadowRoot.getElementById('users-list').innerHTML = 'Error cargando usuarios';
    }
  }

  tableTemplate(users) {
    if (!users.length) return `<div style="color:var(--muted)">No hay usuarios registrados.</div>`;

    return `
      <table class="table">
        <thead>
          <tr>
            <th>Identificación</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th style="width: 220px">Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${users
            .map(
              (u) => `
                <tr>
                  <td>${u.identificacion ?? ''}</td>
                  <td>${u.nombre ?? ''}</td>
                  <td>${u.cargo ?? ''}</td>
                  <td>
                    <div class="row" style="gap:10px; flex-wrap:wrap">
                      <button class="btn" data-edit="${u.identificacion}" type="button">Editar</button>
                      <button class="btn btn-danger" data-del="${u.identificacion}" type="button">Eliminar</button>
                    </div>
                  </td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  _bindRowButtons() {
    this.shadowRoot.querySelectorAll('button[data-edit]').forEach((b) => {
      b.addEventListener('click', () => this.openEdit(b.dataset.edit));
    });
    this.shadowRoot.querySelectorAll('button[data-del]').forEach((b) => {
      b.addEventListener('click', () => this.deleteUser(b.dataset.del));
    });
  }

  openCreate() {
    this.modal.setAttribute('open', 'true');
    this.modal.dataset.mode = 'create';
    this.modeBadge.textContent = 'Crear';
    this.clearForm();
  }

  async openEdit(identificacion) {
    const user = (this.users || []).find((u) => String(u.identificacion) === String(identificacion));
    this.modal.setAttribute('open', 'true');
    this.modal.dataset.mode = 'edit';
    this.modeBadge.textContent = 'Editar';
    this._setFormValue('identificacion', user.identificacion);
    this._setFormValue('nombre', user.nombre);
    this._setFormValue('cargo', user.cargo);
    // password fields cleared intentionally
    this._setFormValue('password', '');
    this._setFormValue('password2', '');
  }

  closeModal() {
    this.modal.setAttribute('open', 'false');
  }

  clearForm() {
    ['identificacion', 'nombre', 'cargo', 'password', 'password2'].forEach((n) => this._setFormValue(n, ''));
  }

  _setFormValue(name, value) {
    const cmp = this.shadowRoot.querySelector(`acme-input[name="${name}"]`);
    if (cmp) cmp.setAttribute('value', value);
  }

  _getFormValues() {
    const payload = {};
    this.shadowRoot.querySelectorAll('acme-input').forEach((cmp) => {
      const nm = cmp.getAttribute('name');
      if (!nm) return;
      payload[nm] = cmp.value;
    });
    return payload;
  }

  async saveUser() {
    const mode = this.modal.dataset.mode || 'create';
    const payload = this._getFormValues();

    try {
      // Double validation for password in create/edit.
      const identificacion = safeTrim(payload.identificacion);
      if (!identificacion) throw new Error('Identificación obligatoria');
      if (payload.password !== payload.password2) throw new Error('Las contraseñas no coinciden');

      const ref = doc(db, 'users', identificacion);
      const data = {
        identificacion,
        nombre: safeTrim(payload.nombre),
        cargo: safeTrim(payload.cargo),
        updatedAt: (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).serverTimestamp(),
      };

      // Update Firestore document. Firebase Auth password update isn't implemented here.
      // For a production-ready solution, use Firebase Admin SDK or re-create auth user.
      await setDoc(ref, data, { merge: true });

      dispatch(AppEvents.toast, { type: 'success', title: 'Guardado', message: mode === 'create' ? 'Usuario creado.' : 'Usuario actualizado.' });
      this.closeModal();
      this.clearForm();
      await this.refresh();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }

  async deleteUser(identificacion) {
    if (!confirm(`¿Eliminar usuario ${identificacion}?`)) return;
    try {
      await deleteDoc(doc(db, 'users', identificacion));
      dispatch(AppEvents.toast, { type: 'success', title: 'Eliminado', message: 'Usuario eliminado correctamente.' });
      await this.refresh();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }
}

function usersCss(){
  return `
    .users-header{font-weight:1000; font-size:18px;}
    .users-subtitle{color:var(--muted); font-size:13px;}
  `;
}


customElements.define('acme-users-view', UsersView);


