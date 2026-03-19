# Congre-Admin: Especificación de Reportes y Formularios

Dada la arquitectura de **Conocimiento Cero**, todos los reportes se generan exclusivamente en el cliente (navegador) para asegurar que los datos sensibles nunca viajen descifrados al servidor.

## 1. Tipos de Reportes

### A. Formularios Oficiales (PDF Overlay)
Se utiliza un PDF base (plantilla) sobre el cual se imprimen los datos en coordenadas específicas o mediante campos de formulario existentes.
- **Uso:** S-21, S-88, Tarjetas de territorio oficiales.
- **Motor:** `pdf-lib` (JavaScript).

### B. Reportes Dinámicos (HTML/CSS)
Tablas y resúmenes generados dinámicamente que se convierten a PDF o se imprimen directamente.
- **Uso:** Listas de limpieza, programas semanales, informes de actividad.
- **Motor:** `jspdf` + `html2canvas` o impresión nativa del navegador.

### C. Etiquetas y Tarjetas (SVG/Canvas)
Ideal para elementos pequeños con diseño gráfico preciso.
- **Uso:** Credenciales, etiquetas de sobres, minitargetas de contacto.

## 2. Definición de un Reporte (Manifest)
Cada plugin que genere reportes debe incluirlos en su manifiesto bajo la clave `reports`.

~~~json
{
  "id": "reuniones_programa",
  "reports": [
    {
      "id": "programa_semanal_pdf",
      "nombre": "Programa Semanal (Oficial)",
      "tipo": "pdf_overlay",
      "template": "./assets/s140_template.pdf",
      "mapping": {
        "fecha": "$.semana.fechaInicio",
        "presidente": "$.reunion.asignaciones.presidente[0].nombre",
        "puntos_manzanas": "$.territorio.manzanas[*].id"
      },
      "coords": {
        "fecha": { "page": 1, "x": 100, "y": 750, "size": 10 },
        "presidente": { "page": 1, "x": 250, "y": 750, "size": 10 }
      }
    }
  ]
}
~~~

## 3. Flujo de Generación
1. **Selección:** El usuario elige el reporte desde el módulo.
2. **Transformación (JSONata):** El sistema aplica la expresión `mapping` del reporte sobre los datos actuales para generar un "Modelo de Reporte" plano.
3. **Descarga de Plantilla:** El Core descarga el archivo `.pdf` o `.svg` de la plantilla (si es necesario).
4. **Renderizado:** El motor de reportes combina la plantilla y el modelo de datos.
5. **Salida:** Se ofrece la descarga del archivo final o la previsualización en pantalla.

## 4. Sugerencia para la Creación de Reportes
Para crear la definición de un reporte nuevo:
1. Proporcionar el archivo PDF al agente de IA.
2. El agente identificará los campos o solicitará las coordenadas de los textos.
3. El agente generará el objeto `mapping` y `coords` compatible con el motor del Core.
