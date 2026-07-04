# TODO - Arreglo: Registro falla con “Missing or insufficient permissions”

## Paso 1
- Analizar Firestore Security Rules actuales (ya se confirmaron: todo denegado).

## Paso 2
- Actualizar `cloud.firestore.rules` para permitir:
  - lectura/escritura bajo `/users/{identificacion}` solo cuando el usuario esté autenticado
  - escritura de su propio documento (uid) y permitir crear si no existe

## Paso 3
- Asegurar que el registro establezca `uid` y que las rules usen ese campo.

## Paso 4
- Sugerir valores mínimos de reglas para login/registro.

## Paso 5
- Verificar flujo: registrar -> leer/escribir -> lista de usuarios.

