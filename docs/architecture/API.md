# Congre-Admin: Especificación de API (v1)

Esta es la definición formal de la interfaz entre el Frontend (Core) y el Backend (Data Provider).

## 1. Estructura de Petición
Todas las peticiones deben enviarse vía `POST` (excepto lecturas públicas simples) con un payload JSON:

~~~json
{
    "action": "string",
    "ssId": "string",
    "sessionToken": "string", // Opcional para login/público
    "payload": {} // Objeto variable según la acción
}
~~~

## 2. Acciones del Sistema

### A. Autenticación y Seguridad
- **`challenge`**: Solicita un desafío para Passkey/WebAuthn.
- **`login`**: Valida credenciales o firmas.
  - *Response:* `{ "sessionToken": "...", "wrapped_mk": "..." }`.
- **`register`**: Crea un nuevo usuario y guarda su `wrapped_mk`.

### B. Gestión de Datos
- **`batchGetData`**: Recupera múltiples tablas de un `ssId`.
  - *Payload:* `{ "sheets": ["Tabla1", "Tabla2"] }`.
- **`saveData`**: Operación *upsert* basada en el campo `id`.
  - *Payload:* `{ "sheet": "Nombre", "item": { "id": "...", ... } }`.
- **`deleteData`**: Borrado físico/lógico.
  - *Payload:* `{ "sheet": "Nombre", "id": "..." }`.

## 3. Códigos de Error
- `ERR_AUTH_INVALID`: Token de sesión expirado o inválido.
- `ERR_PERMISSION_DENIED`: El usuario no tiene el rol necesario para el `ssId` solicitado.
- `ERR_VALIDATION_FAILED`: Regla JSONata de backend rechazada.
- `ERR_RESOURCE_NOT_FOUND`: `ssId` o tabla no existe.

## 4. Handshake de Conocimiento Cero
1. El Cliente envía `username`.
2. El Servidor devuelve el `wrapped_mk` (Master Key cifrada con TOTP/Passkey).
3. El Cliente descifra el `wrapped_mk` localmente.
4. Toda comunicación posterior de campos `enc_` se realiza con la MK descifrada en el Cliente.
