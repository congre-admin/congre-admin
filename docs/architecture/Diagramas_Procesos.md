# Congre-Admin: Diagramas de Procesos y Workflows

Este documento describe visualmente los flujos de trabajo críticos del sistema utilizando la sintaxis de Mermaid.

## 1. Ciclo Mensual de Informes (Día 1 al 20)
Describe la interacción entre los responsables de grupo y el secretario para el cierre oficial.

```mermaid
sequenceDiagram
    participant SG as Superintendente de Grupo
    participant Core as Sistema (Core)
    participant Sec as Secretario
    participant GS as GSheet Core/Mirror

    Note over SG, Sec: Fase de Recolección (Día 1-10)
    SG->>Core: Carga informe mensual del grupo
    Core->>GS: Guarda registro con timestamp (_ts)
    Sec->>Core: Monitorea dashboard de cumplimiento
    Core-->>Sec: Muestra % de carga y lista de pendientes
    Sec->>Core: Pulsa "Reclamar vía WhatsApp"
    Core-->>Sec: Genera texto con nombres faltantes

    Note over Sec, GS: Fase de Cierre (Día 10-20)
    Sec->>Core: Inicia "Asistente de Cierre"
    Core->>GS: Busca informes sin cierreId
    Core-->>Sec: Resalta informes tardíos (basado en _ts)
    Sec->>Core: Marca informes a incluir en este envío
    Sec->>Core: Confirma "Cerrar Mes"
    Core->>GS: Vincula registros al cierreId y actualiza Novedades
    Core-->>Sec: Genera resumen visual para Sucursal
```

## 2. Proceso de Instalación (Setup Wizard)
Flujo de configuración inicial para una nueva congregación.

```mermaid
graph TD
    A[Inicio: URL vacía] --> B{¿Hay API en LocalStorage?}
    B -- No --> C[Paso 1: Ingresar URL de GAS]
    C --> D[Paso 2: Acción createResource]
    D --> E[GAS crea GSheet Core e inicializa tablas]
    E --> F[Paso 3: Registro de Super-Admin]
    F --> G[Cliente genera Master Key aleatoria]
    G --> H[Cliente cifra MK con clave de Password]
    H --> I[Acción register: Enviar wrapped_mk]
    I --> J[Paso 4: Generar Enlace Mágico]
    J --> K[Fin: Sistema Operativo]
```

## 3. Handshake de Conocimiento Cero (Login)
Cómo se recupera la llave maestra sin enviarla nunca al servidor.

```mermaid
sequenceDiagram
    participant U as Usuario (Navegador)
    participant B as Backend (GAS)
    
    U->>B: Petición login (username)
    B->>B: Valida permisos
    B-->>U: Entrega Salt y wrapped_mk
    Note over U: Deriva Wrapping Key localmente (PBKDF2)
    Note over U: Descifra la Master Key en memoria
    U->>B: Petición batchGetData (sessionToken)
    B-->>U: Entrega datos cifrados (iv:ciphertext)
    Note over U: Descifra campos enc_ para visualización
```

## 4. Confección de Programa de Reuniones
Flujo de trabajo para el Superintendente de Reunión VyM.

```mermaid
graph LR
    A[Elegir Semana] --> B[Editar Estructura]
    B --> C[Llamar Motor Sugerencias]
    C --> D{¿Hay filtros?}
    D -- Sí --> E[Intersección de Etiquetas Virtuales]
    E --> F[Ranking por Antigüedad/Carga]
    F --> G[Presentar Candidatos Sugeridos]
    G --> H[Confirmar Asignaciones]
    H --> I[Publicar al GSheet Mirror]
```
