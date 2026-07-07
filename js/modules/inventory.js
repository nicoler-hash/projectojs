import { database } from '../services/api.js';

export async function initInventory(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <h2>Inventario</h2>
            <div class="flex gap-1">
                <button id="btn-add-stock" style="width: auto;">Ingresar Stock</button>
                <button id="btn-new-product" style="width: auto;">+ Nuevo Producto</button>
            </div>
        </div>
        
        <div id="alert-box" class="alert"></div>

        <div class="card" id="form-product-container" style="display: none;">
            <h3 id="form-product-title">Crear Producto / Materia Prima</h3>
            <form id="product-form">
                <label>Código</label>
                <input type="text" id="prod-id" required>
                
                <label>Nombre</label>
                <input type="text" id="prod-name" required>
                
                <label>Proveedor</label>
                <input type="text" id="prod-provider" required>

                <label>Tipo</label>
                <select id="prod-type" required>
                    <option value="raw">Materia Prima</option>
                    <option value="finished">Producto Terminado</option>
                </select>

                <div id="formula-section" style="display: none; border: 1px solid var(--border-color); padding: 1rem; margin-bottom: 1rem;">
                    <h4>Fórmula (Receta)</h4>
                    <p class="text-muted" style="font-size: 0.9rem; margin-bottom: 1rem;">Agregue las materias primas requeridas para producir 1 unidad de este producto.</p>
                    <div id="formula-items"></div>
                    <button type="button" id="btn-add-formula-item" style="width: auto; margin-top: 0.5rem;">+ Agregar Ingrediente</button>
                </div>

                <div class="flex gap-1">
                    <button type="submit">Guardar Producto</button>
                    <button type="button" class="btn-danger" id="btn-cancel-product">Cancelar</button>
                </div>
            </form>
        </div>

        <div class="card" id="form-stock-container" style="display: none;">
            <h3>Ingresar Stock</h3>
            <form id="stock-form">
                <label>Producto / Materia Prima</label>
                <select id="stock-prod-id" required>

                </select>
                
                <label>Cantidad a Ingresar</label>
                <input type="number" id="stock-amount" min="1" required>

                <div class="flex gap-1">
                    <button type="submit">Guardar Stock</button>
                    <button type="button" class="btn-danger" id="btn-cancel-stock">Cancelar</button>
                </div>
            </form>
        </div>

        <div class="card">
            <input type="text" id="search-filter" placeholder="Buscar por código o nombre...">
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Proveedor</th>
                        <th>Stock Actual</th>
                    </tr>
                </thead>
                <tbody id="inventory-tbody">

                </tbody>
            </table>
        </div>
    `;

    const alertBox = document.getElementById('alert-box');
    const tbody = document.getElementById('inventory-tbody');
    const searchFilter = document.getElementById('search-filter');
    

    const formProductContainer = document.getElementById('form-product-container');
    const formStockContainer = document.getElementById('form-stock-container');
    const productForm = document.getElementById('product-form');
    const stockForm = document.getElementById('stock-form');
    const prodType = document.getElementById('prod-type');
    const formulaSection = document.getElementById('formula-section');
    const formulaItems = document.getElementById('formula-items');
    
    let products = {};

    function showAlert(msg, type = 'error') {
        alertBox.textContent = msg;
        alertBox.className = `alert alert-${type} show`;
        setTimeout(() => { alertBox.className = 'alert'; }, 4000);
    }

    async function loadInventory() {
        try {
            products = await database.read('products') || {};
            renderTable();
            populateStockSelect();
        } catch (error) {
            showAlert('Error al cargar inventario: ' + error.message);
        }
    }

    function renderTable() {
        const filterText = searchFilter.value.toLowerCase();
        tbody.innerHTML = '';
        
        Object.values(products).forEach(prod => {
            if (prod.id.toLowerCase().includes(filterText) || prod.name.toLowerCase().includes(filterText)) {
                const tr = document.createElement('tr');
                const typeName = prod.type === 'raw' ? 'Materia Prima' : 'Producto Terminado';
                tr.innerHTML = `
                    <td>${prod.id}</td>
                    <td>${prod.name}</td>
                    <td>${typeName}</td>
                    <td>${prod.provider}</td>
                    <td><strong>${prod.stock || 0}</strong></td>
                `;
                tbody.appendChild(tr);
            }
        });
    }

    function populateStockSelect() {
        const select = document.getElementById('stock-prod-id');
        select.innerHTML = '<option value="">Seleccione un producto...</option>';
        Object.values(products).forEach(prod => {
            const option = document.createElement('option');
            option.value = prod.id;
            option.textContent = `[${prod.id}] ${prod.name}`;
            select.appendChild(option);
        });
    }

    function getRawMaterialsOptions() {
        let options = '<option value="">Seleccione materia prima...</option>';
        Object.values(products).forEach(prod => {
            if (prod.type === 'raw') {
                options += `<option value="${prod.id}">${prod.name}</option>`;
            }
        });
        return options;
    }

    searchFilter.addEventListener('input', renderTable);


    prodType.addEventListener('change', (e) => {
        if (e.target.value === 'finished') {
            formulaSection.style.display = 'block';
            formulaItems.innerHTML = '';
            addFormulaItem();
        } else {
            formulaSection.style.display = 'none';
        }
    });

    document.getElementById('btn-add-formula-item').addEventListener('click', addFormulaItem);

    function addFormulaItem() {
        const div = document.createElement('div');
        div.className = 'flex gap-1 items-center mb-1 formula-row';
        div.innerHTML = `
            <select class="formula-raw-id" style="margin-bottom: 0;" required>
                ${getRawMaterialsOptions()}
            </select>
            <input type="number" class="formula-qty" placeholder="Cantidad" min="0.01" step="0.01" style="margin-bottom: 0;" required>
            <button type="button" class="btn-danger btn-remove-formula" style="width: auto; margin-bottom: 0;">X</button>
        `;
        div.querySelector('.btn-remove-formula').addEventListener('click', () => div.remove());
        formulaItems.appendChild(div);
    }


    document.getElementById('btn-new-product').addEventListener('click', () => {
        formStockContainer.style.display = 'none';
        formProductContainer.style.display = 'block';
        productForm.reset();
        formulaSection.style.display = 'none';
    });

    document.getElementById('btn-cancel-product').addEventListener('click', () => {
        formProductContainer.style.display = 'none';
    });

    document.getElementById('btn-add-stock').addEventListener('click', () => {
        formProductContainer.style.display = 'none';
        formStockContainer.style.display = 'block';
        stockForm.reset();
    });

    document.getElementById('btn-cancel-stock').addEventListener('click', () => {
        formStockContainer.style.display = 'none';
    });


    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value.trim();
        const name = document.getElementById('prod-name').value.trim();
        const provider = document.getElementById('prod-provider').value.trim();
        const type = document.getElementById('prod-type').value;

        let formula = [];
        if (type === 'finished') {
            const rows = document.querySelectorAll('.formula-row');
            for (let row of rows) {
                const rawId = row.querySelector('.formula-raw-id').value;
                const qty = parseFloat(row.querySelector('.formula-qty').value);
                if (rawId && qty > 0) {
                    formula.push({ id: rawId, qty });
                }
            }
            if (formula.length === 0) {
                return showAlert('Un producto terminado debe tener al menos un ingrediente en su fórmula');
            }
        }

        try {
            const existing = await database.readOne('products', id);
            if (existing) {
                return showAlert('El código de producto ya existe');
            }

            const newProd = { id, name, provider, type, stock: 0 };
            if (type === 'finished') {
                newProd.formula = formula;
            }

            await database.create('products', id, newProd);
            showAlert('Producto creado exitosamente', 'success');
            formProductContainer.style.display = 'none';
            loadInventory();
        } catch (error) {
            showAlert('Error al guardar: ' + error.message);
        }
    });


    stockForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('stock-prod-id').value;
        const amount = parseFloat(document.getElementById('stock-amount').value);

        if (!id || amount <= 0) {
            return showAlert('Seleccione un producto y una cantidad válida');
        }

        try {
            const prod = await database.readOne('products', id);
            if (!prod) return showAlert('Producto no encontrado');

            const newStock = (prod.stock || 0) + amount;
            await database.update('products', id, { stock: newStock });
            
            showAlert(`Stock actualizado. Nuevo saldo: ${newStock}`, 'success');
            formStockContainer.style.display = 'none';
            loadInventory();
        } catch (error) {
            showAlert('Error al actualizar stock: ' + error.message);
        }
    });


    loadInventory();
}
