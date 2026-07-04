import { db } from '../../lib/firebase.js';
import { dispatch, AppEvents } from '../../lib/events.js';
import { safeTrim } from '../../lib/format.js';
import { collection, getDocs, doc, setDoc, updateDoc, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';

class ProductionView extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.products = [];
    this.production = [];
  }

  connectedCallback() {
    this.render();
    this.refreshProducts();

    this.shadowRoot.getElementById('btn-create-production')?.addEventListener('click', () => this.createProduction());
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ${productionCss()}
      </style>
      <div class="card">

        <div class="row" style="justify-content:space-between">
          <div class="col" style="gap:4px">
            <div style="font-weight:1000; font-size:18px">Módulo de producción</div>
            <div style="color:var(--muted); font-size:13px">Descuenta materias primas e incrementa productos terminados</div>
          </div>
        </div>

        <div style="height:12px"></div>

        <div class="grid-2">
          <div class="col">
            <div class="label">Producto a fabricar</div>
            <select id="prod-product" class="input"></select>
          </div>
          <div class="col">
            <div class="label">Cantidad a producir</div>
            <input id="prod-qty" class="input" type="number" min="1" step="1" placeholder="Ej: 10" />
          </div>
        </div>

        <div style="height:12px"></div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn btn-primary" id="btn-create-production" type="button">Generar proceso</button>
        </div>

        <div style="height:18px"></div>

        <div style="font-weight:1000">Resumen de procesos</div>
        <div style="height:10px"></div>
        <div id="production-list">Cargando...</div>
      </div>
    `;
  }

  async refreshProducts() {
    try {
      const snap = await getDocs(collection(db, 'productos'));
      this.products = snap.docs.map((d) => d.data());

      const select = this.shadowRoot.getElementById('prod-product');
      select.innerHTML = '';
      this.products
        .filter((p) => Array.isArray(p.formula) && p.formula.length)
        .forEach((p) => {
          const opt = document.createElement('option');
          opt.value = p.codigo;
          opt.textContent = `${p.nombre} (${p.codigo})`;
          select.appendChild(opt);
        });

      // If no products with formula, show message.
      if (!select.options.length) {
        select.innerHTML = '<option value="">No hay productos con fórmula</option>';
      }

      await this.refreshProduction();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }

  async refreshProduction() {
    try {
      const snap = await getDocs(collection(db, 'producciones'));
      const list = snap.docs.map((d) => d.data());
      // newest first
      list.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      this.production = list;

      this.shadowRoot.getElementById('production-list').innerHTML =
        list.length
          ? this.productionTemplate(list)
          : `<div style="color:var(--muted)">Aún no hay procesos generados.</div>`;
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'Error', message: err.message || String(err) });
    }
  }

  productionTemplate(list) {
    return `
      <div style="display:grid; gap:12px">
        ${list
          .slice(0, 20)
          .map((proc) => {
            const items = proc.resumen || [];
            return `
              <div class="card" style="padding:14px; box-shadow:none; background: rgba(255,255,255,.02)">
                <div class="row" style="justify-content:space-between; align-items:flex-start">
                  <div class="col" style="gap:4px">
                    <div style="font-weight:1000">Proceso #${proc.codigoProceso}</div>
                    <div style="color:var(--muted); font-size:13px">Producto: ${proc.productoCodigo} • Cantidad: ${proc.cantidad}</div>
                  </div>
                  <div class="badge badge-success">Creado</div>
                </div>

                <div style="height:10px"></div>
                <div class="label">Resumen</div>
                <table class="table" style="margin-top:8px">
                  <thead>
                    <tr>
                      <th>Materia prima / Producto</th>
                      <th>Cantidad usada / fabricada</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items
                      .map((it) => `<tr><td>${it.codigo}</td><td>${it.cantidad}</td></tr>`)
                      .join('')}
                  </tbody>
                </table>
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }

  async createProduction() {
    try {
      const productCodigo = safeTrim(this.shadowRoot.getElementById('prod-product').value);
      const qty = Number(this.shadowRoot.getElementById('prod-qty').value);
      if (!productCodigo) throw new Error('Selecciona un producto con fórmula');
      if (!Number.isFinite(qty) || qty <= 0) throw new Error('Cantidad inválida');

      const product = this.products.find((p) => String(p.codigo) === String(productCodigo));
      if (!product?.formula?.length) throw new Error('El producto seleccionado no tiene fórmula');

      const formula = product.formula; // [{codigo, cantidad}]

      const prodCounterRef = doc(db, 'meta', 'counters');
      const resumen = [];

      await runTransaction(db, async (tx) => {
        const counterSnap = await tx.get(prodCounterRef);
        const current = counterSnap.exists() ? Number(counterSnap.data().produccion ?? 0) : 0;
        const next = current + 1;

        // Validate stock for each ingredient
        for (const ing of formula) {
          const ingCodigo = safeTrim(ing.codigo);
          const ingCantPorUnidad = Number(ing.cantidad);
          const needed = ingCantPorUnidad * qty;
          const ingRef = doc(db, 'productos', ingCodigo);
          const ingSnap = await tx.get(ingRef);
          const stock = Number(ingSnap.data()?.stock ?? 0);
          if (stock < needed) {
            throw new Error(`Stock insuficiente para ${ingCodigo}. Necesitas ${needed}, hay ${stock}`);
          }
        }

        // Apply changes
        // 1) Decrease ingredients
        for (const ing of formula) {
          const ingCodigo = safeTrim(ing.codigo);
          const needed = Number(ing.cantidad) * qty;
          const ingRef = doc(db, 'productos', ingCodigo);
          const ingSnap = await tx.get(ingRef);
          const stock = Number(ingSnap.data()?.stock ?? 0);
          tx.update(ingRef, { stock: stock - needed });
          resumen.push({ codigo: ingCodigo, cantidad: -needed });
        }

        // 2) Increase finished product
        const finishedRef = doc(db, 'productos', productCodigo);
        const finishedSnap = await tx.get(finishedRef);
        const curStock = Number(finishedSnap.data()?.stock ?? 0);
        tx.set(finishedRef, { stock: curStock + qty }, { merge: true });
        resumen.push({ codigo: productCodigo, cantidad: qty });

        // 3) Store process
        const procRef = doc(collection(db, 'producciones'), String(next));
        tx.set(procRef, {
          codigoProceso: next,
          productoCodigo: productCodigo,
          cantidad: qty,
          resumen,
          formula,
          createdAt: serverTimestamp(),
        });

        tx.set(prodCounterRef, { produccion: next }, { merge: true });
      });

      dispatch(AppEvents.toast, { type: 'success', title: 'Producción creada', message: 'Inventario actualizado correctamente.' });
      await this.refreshProducts();
    } catch (err) {
      dispatch(AppEvents.toast, { type: 'danger', title: 'No se pudo producir', message: err.message || String(err) });
    }
  }
}

function productionCss(){
  return `
    .btn{font-family:var(--font);}
    .production-header{font-weight:1000; font-size:18px;}
    .production-subtitle{color:var(--muted); font-size:13px;}
  `;
}


customElements.define('acme-production-view', ProductionView);


