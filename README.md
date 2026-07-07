# Gestión de Producción - Acme

Este proyecto es una aplicación web para automatizar el proceso de producción de la empresa Acme en la ciudad de Macondo. Fue construido utilizando HTML5, CSS (Vanilla) y JavaScript (Vanilla), siguiendo los requerimientos específicos de diseño (interfaz sencilla, estilos planos, rectangulares, colores oscuros planos) y arquitectura.

## Características

- **Autenticación (Login / Registro):** Registro de usuarios con doble validación de contraseña. Inicio de sesión mediante Número de Identificación y Contraseña. Control de sesión y validación estricta de campos.
- **Módulo de Usuarios:** Panel administrativo para crear, modificar, y eliminar usuarios (Roles: admin, operario).
- **Módulo de Inventario:** 
  - Gestión de productos (Materia Prima o Producto Terminado).
  - Definición de fórmulas/recetas para productos terminados basados en materias primas.
  - Incremento de stock directamente al inventario.
  - Buscador integrado en la tabla de inventario en tiempo real.
- **Módulo de Producción:** 
  - Ejecuta procesos productivos seleccionando el producto a fabricar y la cantidad.
  - Genera automáticamente un identificador consecutivo.
  - Valida existencias de materia prima y descuenta el stock acorde a la fórmula, incrementando el del producto terminado.
  - Presenta un resumen del proceso productivo indicando lo fabricado y las materias primas utilizadas.

## Tecnologías Utilizadas

- **HTML5:** Estructura semántica, un `index.html` sirviendo como Single Page Application.
- **CSS3:** Estilos completamente nativos cumpliendo con la directriz de: "interfaz sencilla, estilos planos, rectangulares, sin curvas redondeadas, colores oscuros planos, sin gradientes, ni emojis".
- **JavaScript (Vanilla):** Manejo de módulos, Web Components nativos (`acme-navbar`), y lógica de enrutamiento sin frameworks de terceros.
- **Firebase Realtime Database:** Arquitectura lista y conectada.

## Instrucciones para Ejecutar el Proyecto

1. **Clonar o descargar** este repositorio en tu máquina local.
2. Dado que el proyecto usa **ES Modules** (`<script type="module">`), necesitas ejecutarlo a través de un servidor HTTP local. Si abres el archivo `index.html` directamente en el navegador con el protocolo `file://`, te dará un error de CORS para los módulos.
   
   **Opciones rápidas para correr un servidor local:**
   - **Con VS Code:** Instala la extensión "Live Server" y haz clic en "Go Live" en el archivo `index.html`.
   - **Con Python:** Abre una terminal en la carpeta del proyecto y ejecuta `python -m http.server 8000` (visita `http://localhost:8000`).
   - **Con Node.js:** Si tienes npm instalado, ejecuta `npx serve .`

3. **Configuración de la Base de Datos (Firebase):**
   - El código para Firebase está completamente implementado en `js/firebase.js` y `js/services/api.js`.

4. **Flujo de Prueba Sugerido:**
   1. Regístrate en la pantalla principal creando un nuevo usuario.
   2. Inicia sesión con el usuario recién creado.
   3. Ve a "Inventario", crea una **Materia Prima** (ej. "Harina").
   4. Ingresa un stock de "100" a la "Harina".
   5. Crea un **Producto Terminado** (ej. "Galleta") y agrégale a su fórmula que requiere "1" unidad de "Harina".
   6. Ve a "Producción" y ordena producir "10" "Galletas".
   7. Observa el resumen de producción y verifica en la pestaña "Inventario" cómo el stock se ha movido correctamente (Harina baja en 10, Galleta sube en 10).

## Arquitectura del Código

- `index.html`: Shell principal.
- `styles/main.css`: Sistema de diseño.
- `js/app.js`: Enrutador y gestión del estado de sesión.
- `js/components/`: Web components como la barra de navegación.
- `js/modules/`: La lógica de negocio y presentación separada por dominios (`auth.js`, `users.js`, `inventory.js`, `production.js`).
- `js/services/api.js`: Abstracción (Wrapper) de la base de datos (con soporte nativo para el Realtime DB).
