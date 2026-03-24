# Congre-Admin: Módulo de Informe a la Sucursal (Cierre Mensual)

Este módulo centraliza la consolidación de la actividad mensual y la gestión de la "cuenta corriente" de publicadores para el envío oficial a la sucursal.

## 1. Manifiesto del Módulo
-   **ID:** `admin_informe_sucursal`
-   **Sección:** `Administración`
-   **Icono:** `analytics`
-   **Tablas Requeridas:** `Cierres_Mensuales`, `Novedades_Publicadores`.
-   **Dependencias:** `admin_registros`, `personas`.

## 2. Estructura de Datos (Esquema)

### Registro de Novedad (`Novedades_Publicadores`)
~~~json
{
    "id": "nov_001",
    "personaId": "e1",
    "fecha": "2026-03-10",
    "tipo": "BAJA", // ALTA | BAJA
    "motivo": "Mudanza", // Bautismo, Mudanza, Fallecimiento, Inactivo a Activo, etc.
    "impacto": -1, // +1 o -1 para el total
    "enc_comentario": "iv:...", // Copia del comentario puesto en la ficha de persona
    "cierreId": null // Se completa al realizar el cierre mensual
}
~~~

## 3. Interfaz del Asistente de Cierre (Workflow)

El proceso de cierre se realiza entre el día 1 y 20 de cada mes:

### Paso 1: Revisión de Totales (Contabilidad)
-   **Saldo Inicial:** Total de publicadores del mes anterior.
-   **Novedades del Mes:** Lista de registros en `Novedades_Publicadores` con `cierreId == null`.
-   **Saldo Final:** Cálculo automático del nuevo total de publicadores.

### Paso 2: Consolidación de Actividad
-   **Informes a Tiempo:** Sumatoria de `Informes_Mensuales` del mes actual.
-   **Informes Tardíos:** Listado de informes de meses anteriores que aún no tienen `cierreId`. El sistema ofrece el botón "Incluir en este envío".

### Paso 3: Generación y Cierre
-   **Vista Previa:** Resumen en los tres grupos oficiales (A: Precursores, B: Auxiliares, C: Publicadores).
-   **Acción "Cerrar Mes":** 
    1. Crea el registro en `Cierres_Mensuales`.
    2. Vincula todos los informes y novedades procesados a ese `cierreId`.
    3. Genera el reporte visual para copiar a la plataforma oficial.

## 4. Reglas de Negocio (JSONata)

### Cálculo de Publicadores para Informe
`$sum(CierreAnterior.totalPublicadores) + $sum(NovedadesPendientes.impacto)`

### Validación de Integridad
`$count(InformesSinCierre[mes < $mesActual]) > 0`
*(Alerta al secretario de que hay informes olvidados de meses pasados).*
