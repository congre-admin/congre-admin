# Congre-Admin: Especificación de Acceso y Despliegue

Congre-Admin está diseñado para ser una aplicación web estática (SPA) que se conecta a un backend flexible, permitiendo un despliegue sin servidores (Serverless) y de bajo costo.

## 1. Estrategia de Despliegue (Front-end)
- **Plataforma:** [GitHub Pages](https://pages.github.com/) es el host primario por defecto.
- **Repositorio de Código Fuente:** https://github.com/congre-admin/congre-admin
- **SitioPublicado:** https://github.com/congre-admin/congre-admin.github.io
- **Empaquetado:** Generado mediante `vite build`, produciendo archivos HTML/JS/CSS optimizados y minificados.
- **Service Workers:** Implementación de PWA para permitir:
    - Carga instantánea mediante caché local.
    - Icono en pantalla de inicio (A2HS).
    - Funcionamiento básico en condiciones de baja conectividad.

## 2. Configuración de Acceso Dinámico
Para evitar el "hardcoding" de credenciales y permitir que una misma instancia del front-end sirva a múltiples congregaciones, el sistema utiliza **Inyección de Parámetros vía URL**:

- **Parámetros Soportados:**
    - `api`: URL completa del Google Apps Script (backend).
    - `ssId`: ID de la Google Sheet Core (Orquestador).
    - `k`: (Opcional) Clave de invitación temporal para el enlace inicial.
- **Persistencia:** Una vez detectados en la URL, estos valores se guardan en el `localStorage` del navegador. El usuario puede navegar posteriormente a la URL base y el sistema recordará su configuración.

## 3. Configuración del Backend (Apps Script)
- **Despliegue:** El archivo `api.gs` se despliega como una **Web App**.
- **Permisos de Ejecución:** "Ejecutar como: Mí" (el administrador que creó el script) y "Quién tiene acceso: Cualquiera".
- **Solución CORS:** Google Apps Script no permite agregar headers CORS personalizados mediante `ContentService.setHeaders()`. El workaround funciona así:
  1. **Frontend:** Usar `Content-Type: text/plain` + `redirect: 'follow'` + `mode: 'cors'`
  2. **Backend:** No intentar agregar headers CORS - GAS los ignora
  - `text/plain` evita el preflight (OPTIONS request)
  - `redirect: 'follow'` permite seguir los redirects de GAS
  - Ver [DataService.md](./DataService.md) para la configuración exacta

## 4. Entornos de Desarrollo y Producción
- **Local:** `npm run dev` utiliza variables de entorno en un archivo `.env.local` para emular los parámetros de URL.
- **Producción:** GitHub Actions automatiza el despliegue a la rama `gh-pages` tras cada `push` a la rama principal.

## 5. Modelo de Seguridad en el Despliegue
- **HTTPS Obligatorio:** Todas las comunicaciones entre el cliente y el backend deben realizarse bajo TLS para proteger el intercambio de datos cifrados.
- **Aislamiento de Origen:** El modelo Zero-Knowledge asegura que, incluso si el host del front-end (GitHub) se viera comprometido, los atacantes no podrían descifrar los datos sensibles sin la Master Key que reside exclusivamente en el dispositivo del usuario.
