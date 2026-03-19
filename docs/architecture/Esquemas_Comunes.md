# Congre-Admin: Esquemas de Datos Comunes

Para asegurar la interoperabilidad, todos los plugins y el Core deben seguir estas estructuras para datos transversales.

## 1. Registro de Auditoría (`Logs`)
Esta tabla reside en el **GSheet Core** y registra eventos críticos.

~~~json
{
    "id": "log-uuid",
    "ts": "2026-03-18T10:00:00Z",
    "userId": "u1",
    "action": "SAVE_DATA",
    "pluginId": "reuniones_programa",
    "details": "Cambio en el programa de la semana 01/03",
    "ip": "1.2.3.4",
    "severity": "info" // info, warn, error, critical
}
~~~

## 2. Estructura de Sesión (`Session`)
Emitida por el backend tras un login exitoso.

~~~json
{
    "token": "jwt-or-opaque-string",
    "expires": "2026-03-18T18:00:00Z",
    "user": {
        "id": "u1",
        "username": "admin@congre.com",
        "role": "admin"
    },
    "wrapped_mk": "iv:ciphertext"
}
~~~

## 3. Formato de Metadatos (Bolsa Flexible)
Se utiliza en `Personas`, `Territorios` y `Plantillas`.

~~~json
{
    "key": "string",
    "value": "any",
    "enc": "boolean", // Si debe cifrarse en el almacenamiento
    "type": "string" // text, date, number, json
}
~~~

## 4. Estándar GeoJSON (Predicación)
Para polígonos de territorios y manzanas, se sigue estrictamente el [RFC 7946](https://tools.ietf.org/html/rfc7946).

~~~json
{
    "type": "Feature",
    "geometry": {
        "type": "Polygon",
        "coordinates": [[[...]]]
    },
    "properties": {
        "id": "t1",
        "nombre": "Territorio 01",
        "color": "#ff0000"
    }
}
~~~
