# Acme Producción - Gestión (JavaScript + Web Components + Firebase)

## Descripción
Aplicación web responsive para la empresa Acme que gestiona:
- **Login / Registro** de usuarios por **identificación** y **contraseña**.
- **CRUD** de usuarios.
- **Inventario**: crear productos (materia prima o producto terminado) con **fórmula opcional** y **aumentar stock** por código.
- **Producción**: generar procesos con **consecutivo** desde 1, validando stock, descontando materias primas y aumentando producto terminado, y mostrando un **resumen**.

Base UI: **HTML + CSS + JavaScript** y **Web Components**.
Persistencia: **Firebase (Auth + Firestore)**.

## Estructura de archivos
- `index.html` - app shell
- `styles.css` - estilos globales
- `src/main.js` - registra Web Components y arranca
- `src/webcomponents/` - componentes de UI y vistas
- `src/lib/` - utilidades y acceso a Firebase

## Requisitos
- Navegador moderno con soporte para ES Modules y Web Components.
- Firebase configurado.

## Configuración de Firebase
1. Crear proyecto en Firebase.
2. Habilitar **Firebase Auth** (Email/Password).
3. Crear Firestore database.
4. Copiar los valores de `Project settings -> General`.
5. Reemplazar en: `src/lib/firebase.config.js`

```js
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_AUTH_DOMAIN',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_STORAGE_BUCKET',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
```

## Notas sobre el Login
Por limitación del flujo (identificación + password), el sistema mapea:
- `email = identificacion + '@acme.local'`

## Colecciones (Firestore)
- `users/{identificacion}`: `{ identificacion, nombre, cargo, uid, createdAt }`
- `productos/{codigo}`: `{ codigo, nombre, proveedor, formula|null, stock }`
- `producciones/{codigoProceso}`: `{ codigoProceso, productoCodigo, cantidad, resumen, formula, createdAt }`
- `meta/counters`: `{ produccion: <n> }`

## Ejecutar localmente
Se recomienda servir con un servidor estático (evita restricciones de ES Modules):

```bash
# desde /home/camper/ProyectoJS
python3 -m http.server 5500
```

Luego abrir:
- `http://localhost:5500/index.html`

## Funcionalidades principales
### Login
- Registrar usuario con doble validación de contraseña.
- Ingresar con identificación y contraseña.

### Usuarios (CRUD)
- Crear / editar / eliminar usuarios.

### Inventario
- Crear producto:
  - `codigo`, `nombre`, `proveedor`
  - `formula` opcional en formato JSON
    - Ejemplo:
    ```json
    [{"codigo":"MANTEQUILLA","cantidad":100},{"codigo":"HARINA","cantidad":100},{"codigo":"HUEVO","cantidad":1}]
    ```
- Aumentar stock por `codigo` y `cantidad`.
- Buscador por código/nombre/proveedor.

### Producción
- Seleccionar producto con fórmula.
- Cantidad a producir.
- Validación de stock para cada ingrediente.
- Transacción:
  - descontar materias primas
  - incrementar producto terminado
  - guardar proceso con resumen
- Mostrar resumen por proceso generado.

## Consideraciones
- Asegúrate de que los productos ingredientes de una fórmula existan en `productos`.
- Para un proyecto final, se recomienda mejorar seguridad/roles de Firestore y Auth (reglas) para que solo usuarios autorizados modifiquen datos.

