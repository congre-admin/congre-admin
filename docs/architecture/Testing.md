# Congre-Admin: Estrategia de Pruebas (Testing)

Esta guía define los niveles de validación obligatorios para garantizar la integridad, seguridad y el modelo de Conocimiento Cero del sistema.

## 1. Niveles de Pruebas

### A. Pruebas Unitarias (Vitest / Jest)
- **Criptografía:** Validar que `AES-GCM` cifra y descifra correctamente con IVs únicos.
- **Motores de Datos:** Validar que los adaptadores (GSheets, Local) transforman los objetos JSON de forma consistente.
- **Validaciones JSONata:** Probar cada expresión del catálogo contra payloads válidos e inválidos.

### B. Pruebas de Integración (React Testing Library)
- **DataService:** Simular respuestas del backend (Mock API) para validar el manejo de errores (`ERR_CONFLICT`, `ERR_AUTH_INVALID`).
- **Sync Queue:** Verificar que los cambios realizados en modo offline se persisten en `IndexedDB` y se envían al backend al recuperar la conexión.

### C. Pruebas de Extremo a Extremo (Playwright / Cypress)
- **Flujo de Login:** Validar el handshake completo: Desafío -> Firma -> Recibir `wrapped_mk` -> Descifrar MK localmente.
- **Privacidad:** Confirmar que en el "Modo Invitado" (sin login) los campos `enc_` no son visibles en el DOM ni en las peticiones de red.

## 2. Validación del Modelo de Conocimiento Cero
Es **obligatorio** realizar una prueba de "Caja Negra" en el backend:
1. Intentar leer un registro de la tabla `Personas` directamente desde el GSheet.
2. Confirmar que los campos `enc_apellido`, `enc_contacto` y `enc_servicio` son ilegibles (formato `iv:ciphertext`).

## 3. Entorno de Pruebas Automáticas
- **CI/CD:** Las pruebas unitarias y de integración deben ejecutarse automáticamente en cada `Pull Request` mediante GitHub Actions.
- **Cobertura:** Se recomienda una cobertura mínima del 80% en el `Core` y del 100% en las funciones criptográficas.
