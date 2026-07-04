import { db } from '../../lib/firebase.js';
import { dispatch, AppEvents } from '../../lib/events.js';
import { safeTrim, formatNumber } from '../../lib/format.js';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

class InventoryView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.products = [];
  }

  connectedCallback() {
    this.render();
    this.refresh();

    this.shadowRoot.getElementById('btn-add-product')?.addEventListener('click', () => this.openProductModal());
    this.shadowRoot.getElementById('btn-save-product')?.addEventListener('click', () => this.saveProduct());
    this.shadowRoot.getElementById('btn-increase-stock')?.addEventListener('click', () => this.increaseStock());
    this.shadowRoot.getElementById('btn-search')?.addEventListener('click', () => this.applyFilter());
    this.shadowRoot.getElementById('search-input')?.addEventListener('input', () => this.applyFilter());

    this.shadowRoot.querySelectorAll('button[data-inc]').forEach((b) => b.addEventListener('click', () => this.openStockModal(b.dataset.inc)));
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div class="card">


        <div class="row" style="justify-content:space-between">
          <div class="col" style="gap:4px">
            <div style="font-weight:1000; font-size:18px">Módulo de inventario</div>
            <div style="color:var(--muted); font-size:13px">Crear productos (con fórmula opcional) y aumentar saldo en stock</div>
          </div>
          <button class="btn btn-primary" id="btn-add-product" type="button">Nuevo producto</button>
        </div>

        <div style="height:12px"></div>

        <div class="grid-2" style="align-items:end">
          <div>
            <div class="label">Buscador</div>
            <input id="search-input" class="input" placeholder="Filtrar por código, nombre o proveedor" />
          </div>
          <div class="row" style="justify-content:flex-end">
            <button class="btn" id="btn-search" type="button">Filtrar</button>
          </div>
        </div>

        <div style="height:12px"></div>

        <div id="inventory-list">Cargando...</div>

        <acme-modal id="product-modal" title="Producto" open="false">
          <div class="grid-2">
            <div class="col">
              <acme-input label="Código" name="codigo" placeholder="Ej: P001" required></acme-input>
              <acme-input label="Nombre" name="nombre" placeholder="Ej: Galleta" required></acme-input>
              <acme-input label="Proveedor" name="proveedor" placeholder="Ej: La Granja" required></acme-input>
            </div>
            <div class="col">
              <acme-input label="Fórmula (JSON)" name="formula" placeholder='Ej: [{"codigo":"MANTEQUILLA","cantidad":100}]' ></acme-input>
              <div style="color:var(--muted); font-size:13px">Si el producto es materia prima, deja fórmula vacío.</div>
            </div>
          </div>

          <div class="modal-actions" slot="actions">
            <button class="btn" id="btn-cancel-product" type="button">Cancelar</button>
            <button class="btn btn-primary" id="btn-save-product" type="button">Guardar</button>
          </div>
        </acme-modal>

        <acme-modal id="stock-modal" title="Aumentar saldo" open="false">
          <div class="grid-2">
            <div class="col">
              <acme-input label="Código" name="codigo" placeholder="Ej: P001" required></acme-input>
              <acme-input label="Cantidad a aumentar" name="cantidad" type="number" placeholder="Ej: 250" required></acme-input>
            </div>
            <div class="col">
              <div class="label">Tip</div>
              <div style="color:var(--muted); font-size:13px">Incrementa stock existente (o crea stock si no existe).</div>
            </div>
          </div>
          <div class="modal-actions" slot="actions">
            <button class="btn" id="btn-cancel-stock" type="button">Cancelar</button>
            <button class="btn btn-success" id="btn-increase-stock" type="button">Incrementar</button>
          </div>
        </acme-modal>
      </div>
    `;

    this.productModal = this.shadowRoot.getElementById('product-modal');
    this.stockModal = this.shadowRoot.getElementById('stock-modal');

    this.shadowRoot.getElementById('btn-cancel-product')?.addEventListener('click', () => this.productModal.setAttribute('open', 'false'));
    this.shadowRoot.getElementById('btn-cancel-stock')?.addEventListener('click', () => this.stockModal.setAttribute('open', 'false'));
  }

  async refresh() {
    try {
      const colRef = collection(db, 'productos');
      const snap = await getDocs(colRef);
      const products = snap.docs.map((d) => d.data());
      // Each product will have stock in productos/{codigo}.stock
      this.products = products;
      this.applyFilter();

      this.shadowRoot.querySelectorAll('button[data-inc]').forEach((b) => b.addEventListener('click', () => this.openStockModal(b.dataset.inc)));
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
      this.shadowRoot.getElementById('inventory-list').innerHTML = 'Error cargando inventario';
    }
  }

  productRow(p) {
    const stock = typeof p.stock === 'number' ? p.stock : 0;
    const formula = p.formula ? 'Sí' : 'No';
    return `
      <tr>
        <td>${p.codigo}</td>
        <td>${p.nombre}</td>
        <td>${p.proveedor}</td>
        <td>${stock}</td>
        <td>${formula}</td>
        <td>
          <div class="row" style="gap:10px; flex-wrap:wrap">
            <button class="btn" data-inc="${p.codigo}" type="button">+ Stock</button>
          </div>
        </td>
      </tr>
    `;
  }

  applyFilter() {
    const q = safeTrim(this.shadowRoot.getElementById('search-input').value).toLowerCase();
    const list = !q
      ? this.products
      : this.products.filter((p) =>
          [p.codigo, p.nombre, p.proveedor].some((x) => String(x ?? '').toLowerCase().includes(q))
        );

    this.shadowRoot.getElementById('inventory-list').innerHTML = `
      ${list.length ? `<table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Proveedor</th>
            <th>Stock</th>
            <th>Fórmula</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${list.map((p) => this.productRow(p)).join('')}
        </tbody>
      </table>` : `<div style="color:var(--muted)">No hay resultados.</div>`}
    `;

    this.shadowRoot.querySelectorAll('button[data-inc]').forEach((b) => b.addEventListener('click', () => this.openStockModal(b.dataset.inc)));
  }

  openProductModal() {
    this.productModal.setAttribute('open', 'true');
    this._setModalFormDefaults(this.productModal);
  }

  openStockModal(codigo) {
    this.stockModal.setAttribute('open', 'true');
    const cmp = this.stockModal.querySelector('acme-input[name="codigo"]');
    if (cmp) cmp.setAttribute('value', codigo);
  }

  _setModalFormDefaults(modal) {
    modal.querySelectorAll('acme-input').forEach((i) => i.setAttribute('value', ''));
  }

  _getModalValues(modal) {
    const payload = {};
    modal.querySelectorAll('acme-input').forEach((cmp) => {
      const nm = cmp.getAttribute('name');
      payload[nm] = cmp.value;
    });
    return payload;
  }

  async saveProduct() {
    try {
      const payload = this._getModalValues(this.productModal);
      const codigo = safeTrim(payload.codigo);
      const nombre = safeTrim(payload.nombre);
      const proveedor = safeTrim(payload.proveedor);
      const formulaRaw = safeTrim(payload.formula);

      if (!codigo || !nombre || !proveedor) throw new Error('Código, nombre y proveedor son obligatorios');

      let formula = null;
      if (formulaRaw) {
        try {
          formula = JSON.parse(formulaRaw);
        } catch {
          throw new Error('La fórmula debe ser un JSON válido. Ejemplo: [{"codigo":"MANTEQUILLA","cantidad":100}]');
        }
      }

      const ref = doc(db, 'productos', codigo);
      await setDoc(ref, {
        codigo,
        nombre,
        proveedor,
        formula,
        stock: 0,
        updatedAt: (await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js')).serverTimestamp(),
      }, { merge: true });

      dispatch(AppEvents.toast, { type: 'success', title: 'Producto guardado', message: `Código ${codigo}` });
      this.productModal.setAttribute('open', 'false');
      await this.refresh();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }

  async increaseStock() {
    try {
      const payload = this._getModalValues(this.stockModal);
      const codigo = safeTrim(payload.codigo);
      const cantidad = Number(payload.cantidad);
      if (!codigo) throw new Error('Código obligatorio');
      if (!Number.isFinite(cantidad) || cantidad <= 0) throw new Error('Cantidad debe ser un número mayor a 0');

      const ref = doc(db, 'productos', codigo);
      const { getDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js');
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        await setDoc(ref, { codigo, nombre: '', proveedor: '', formula: null, stock: cantidad, createdAt: serverTimestamp() });
      } else {
        const cur = Number(snap.data().stock ?? 0);
        await setDoc(ref, { stock: cur + cantidad, updatedAt: serverTimestamp() }, { merge: true });
      }

      dispatch(AppEvents.toast, { type: 'success', title: 'Stock actualizado', message: `+${cantidad} para ${codigo}` });
      this.stockModal.setAttribute('open', 'false');
      await this.refresh();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }
}

function inventoryCss(){
  return `
    .btn{font-family:var(--font);}
    .inventory-header{font-weight:1000; font-size:18px;}
    .inventory-subtitle{color:var(--muted); font-size:13px;}
  `;
}


customElements.define('acme-inventory-view', InventoryView);


