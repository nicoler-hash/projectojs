# TODO - Historial de producción (Acme)

- [x] Actualizar `production.js` para guardar `createdAt` y `createdBy` (id del usuario) en `production_history`.
- [x] Actualizar `production.js` para renderizar el historial con columnas: **Fecha**, **Código** (proceso id), **Usuario** (createdBy), orden **más reciente → más antiguo**.

- [x] Mantener compatibilidad con registros existentes: si vienen con `date`, tratarlos como alias de `createdAt`.
- [ ] Validar manualmente cargando la vista de Producción y creando 2 procesos para verificar el historial.
- [ ] Preparar commit y push a GitHub.

