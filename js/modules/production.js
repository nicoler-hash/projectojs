import { database } from '../services/api.js';

export async function initProduction(container) {
    container.innerHTML = `
        <div class="flex justify-between items-center mb-1">
            <h2>Módulo de Producción</h2>
        </div>
        
        <div id="alert-box" class="alert"></div>

        <div class="card" id="form-prod-container">
            <h3>Registrar Producción</h3>
            <form id="production-form">
                <label>Producto a Fabricar</label>
                <select id="prod-id" required>

                </select>
                
                <label>Cantidad a Producir</label>
                <input type="number" id="prod-amount" min="1" required>

                <button type="submit" class="mt-1">Procesar Producción</button>
            </form>
        </div>

        <div class="card" id="summary-container" style="display: none; background-color: rgba(40, 167, 69, 0.1); border-color: var(--success-color);">
            <h3 style="color: #b9f6ca;">Resumen de Producción (Proceso #<span id="summary-process-id"></span>)</h3>
            <p><strong>Producto Fabricado:</strong> <span id="summary-prod-name"></span></p>
            <p><strong>Cantidad:</strong> <span id="summary-prod-qty"></span></p>
            
            <h4 class="mt-1">Materia Prima Utilizada:</h4>
            <ul id="summary-raw-materials" style="margin-left: 2rem; color: #e0e0e0;">

            </ul>
            <button id="btn-close-summary" class="mt-1" style="width: auto;">Nueva Producción</button>
        </div>
        
        <div class="card">
            <h3>Historial de Producción</h3>
            <table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Código</th>
                        <th>Usuario</th>
                    </tr>
                </thead>
                <tbody id="history-tbody"></tbody>
            </table>
        </div>
    `;

    const alertBox = document.getElementById('alert-box');
    const productionForm = document.getElementById('production-form');
    const prodSelect = document.getElementById('prod-id');
    const historyTbody = document.getElementById('history-tbody');
    

    const summaryContainer = document.getElementById('summary-container');
    const formProdContainer = document.getElementById('form-prod-container');
    const summaryProcessId = document.getElementById('summary-process-id');
    const summaryProdName = document.getElementById('summary-prod-name');
    const summaryProdQty = document.getElementById('summary-prod-qty');
    const summaryRawMaterials = document.getElementById('summary-raw-materials');

    let products = {};
    let processCount = 0;

    function showAlert(msg, type = 'error') {
        alertBox.textContent = msg;
        alertBox.className = `alert alert-${type} show`;
        setTimeout(() => { alertBox.className = 'alert'; }, 5000);
    }

    async function loadData() {
        try {
            products = await database.read('products') || {};
            const history = await database.read('production_history') || {};
            

            prodSelect.innerHTML = '<option value="">Seleccione producto...</option>';
            Object.values(products).forEach(prod => {
                if (prod.type === 'finished') {
                    const option = document.createElement('option');
                    option.value = prod.id;
                    option.textContent = `[${prod.id}] ${prod.name}`;
                    prodSelect.appendChild(option);
                }
            });


            historyTbody.innerHTML = '';
            let maxId = 0;

            const historyArray = Object.values(history)
                .sort((a, b) => {
                    const aAt = new Date(a.createdAt || a.date || 0).getTime();
                    const bAt = new Date(b.createdAt || b.date || 0).getTime();
                    return bAt - aAt; // más reciente -> más antiguo
                });

            historyArray.forEach(record => {
                if (record.id > maxId) maxId = record.id;
                const tr = document.createElement('tr');

                const createdAt = record.createdAt || record.date;
                const createdAtLabel = createdAt ? new Date(createdAt).toLocaleString() : '';

                tr.innerHTML = `
                    <td>${createdAtLabel}</td>
                    <td>${record.id}</td>
                    <td>${record.createdBy ?? ''}</td>
                `;
                historyTbody.appendChild(tr);
            });
            
            processCount = maxId;

        } catch (error) {
            showAlert('Error al cargar datos: ' + error.message);
        }
    }

    document.getElementById('btn-close-summary').addEventListener('click', () => {
        summaryContainer.style.display = 'none';
        formProdContainer.style.display = 'block';
        productionForm.reset();
    });

    productionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const prodId = prodSelect.value;
        const qty = parseFloat(document.getElementById('prod-amount').value);

        if (!prodId || qty <= 0) return showAlert('Datos inválidos');

        try {
            const product = products[prodId];
            if (!product || product.type !== 'finished') return showAlert('Producto no encontrado');
            
            if (!product.formula || product.formula.length === 0) {
                return showAlert('El producto no tiene fórmula configurada');
            }


            let insufficientMaterials = [];
            let requiredMaterials = [];

            for (const item of product.formula) {
                const rawProd = products[item.id];
                if (!rawProd) {
                    insufficientMaterials.push(`Desconocido [${item.id}]`);
                    continue;
                }
                const requiredQty = item.qty * qty;
                if ((rawProd.stock || 0) < requiredQty) {
                    insufficientMaterials.push(`${rawProd.name} (Faltan: ${requiredQty - (rawProd.stock || 0)})`);
                }
                requiredMaterials.push({
                    id: item.id,
                    name: rawProd.name,
                    qty: requiredQty
                });
            }

            if (insufficientMaterials.length > 0) {
                return showAlert('Stock insuficiente: ' + insufficientMaterials.join(', '));
            }


            for (const req of requiredMaterials) {
                const rawProd = products[req.id];
                const newStock = (rawProd.stock || 0) - req.qty;
                await database.update('products', req.id, { stock: newStock });
            }


            const newFinishedStock = (product.stock || 0) + qty;
            await database.update('products', product.id, { stock: newFinishedStock });


            processCount++;

            const currentUserRaw = localStorage.getItem('currentUser');
            const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
            const createdBy = currentUser?.id ?? 'desconocido';

            const createdAt = new Date().toISOString();
            const historyRecord = {
                id: processCount,
                productId: product.id,
                productName: product.name,
                qty: qty,
                materialsUsed: requiredMaterials,

                // Nuevos campos requeridos por el examen
                createdAt,
                createdBy,

                // Compatibilidad con registros anteriores
                date: createdAt
            };
            await database.create('production_history', processCount, historyRecord);


            formProdContainer.style.display = 'none';
            summaryContainer.style.display = 'block';
            
            summaryProcessId.textContent = processCount;
            summaryProdName.textContent = product.name;
            summaryProdQty.textContent = qty;
            
            summaryRawMaterials.innerHTML = '';
            requiredMaterials.forEach(req => {
                const li = document.createElement('li');
                li.textContent = `${req.qty} de ${req.name}`;
                summaryRawMaterials.appendChild(li);
            });

            showAlert('Producción registrada con éxito', 'success');
            

            await loadData();

        } catch (error) {
            showAlert('Error en el proceso productivo: ' + error.message);
        }
    });


    loadData();
}
