# Congre-Admin: Arquitectura de Notificaciones Locales

Para maximizar la privacidad y mantener el modelo de **Conocimiento Cero**, el sistema utiliza un modelo de "Pull" (tirar) en lugar de "Push" (empujar).

## 1. Mecanismo: Periodic Background Sync
El sistema se apoya en la [API de Sincronización Periódica](https://developer.mozilla.org/en-US/docs/Web/API/Web_Periodic_Background_Sync_API) nativa de las PWA.

- **Frecuencia:** Una vez cada **24 horas** (intervalo mínimo sugerido).
- **Consumo:** Bajo impacto en batería y datos, ya que solo descarga un fragmento de JSON sanitizado.

## 2. Flujo de Trabajo (Día a Día)

1. **Registro:** Al instalar la PWA, el Core solicita permiso de `notifications` y registra el `periodicSync` con una etiqueta `check-assignments`.
2. **Activación:** El navegador despierta al **Service Worker** una vez al día (preferiblemente cuando el dispositivo está en Wi-Fi y cargando).
3. **Fetch al Espejo Público:** El Service Worker realiza una petición anónima al **GSheet Público**:
   - `GET /gviz/tq?tq=SELECT...&sheet=Public_Asignaciones`
4. **Validación Privada:**
   - El Service Worker extrae el ID de usuario o el hash guardado localmente.
   - Busca coincidencias en los datos públicos descargados.
   - **Nota:** Los datos en el GSheet Público no contienen nombres reales, solo IDs o hashes.
5. **Notificación Local:** Si hay una coincidencia con fecha futura que no ha sido notificada previamente:
   ~~~javascript
   self.registration.showNotification('Nueva Asignación', {
     body: 'Tienes una asignación pendiente en el programa de reuniones.',
     icon: '/assets/icons/icon-192x192.png',
     tag: 'nueva-asig-' + id
   });
   ~~~

## 3. Ventajas de Privacidad
- **Sin Servidores Intermedios:** No se requieren servicios como Firebase Cloud Messaging (FCM) o OneSignal.
- **Anonimato Total:** El backend de Google Apps Script nunca sabe quién está consultando las notificaciones, solo que "alguien" leyó el archivo público.
- **Control del Usuario:** El usuario puede desactivar las notificaciones desde los ajustes del navegador sin afectar el funcionamiento de la App.

## 4. Limitaciones y Fallbacks
- **Soporte de Navegador:** La API es robusta en Chromium (Android/Chrome/Edge). En iOS, se notificará al usuario que debe abrir la App periódicamente para ver actualizaciones.
- **Engagement:** El navegador solo despierta al Service Worker si el usuario utiliza la aplicación con cierta frecuencia (Site Engagement Score).
