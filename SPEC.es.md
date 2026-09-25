# FE-MCP 0.1 — perfil propuesto

[Français](SPEC.md) · [English](SPEC.en.md) · Español

Este documento describe una **convención comunitaria experimental**, independiente de las normas de facturación. Define una interfaz para clientes MCP, no un nuevo canal de transmisión entre plataformas autorizadas.

## Modelo

Un `case_id` es un identificador estable de expediente dentro de **un servidor**. No sustituye los identificadores de factura, empresa o plataforma. El cliente que combina sistemas relaciona sus referencias y conserva `system` y `source`. Una factura puede tener estados simultáneos distintos en diferentes ámbitos; el servidor no debe inventar un estado global.

Cada respuesta correcta usa `structuredContent`, se valida con el `outputSchema` publicado e incluye `profile_version` y `system`. Las respuestas de error usan `isError` en vez de simular un éxito. Las listas se paginan. Un hallazgo incluye `code`, `severity`, `rule_ref`, `evidence_refs` y `explanation`. `rule_ref` debe identificar la versión de la regla aplicable; las reglas de demostración `demo:*` no constituyen validación reglamentaria.

## Llamadas

1. `fe_find_invoices(query, limit, cursor)` devuelve referencias de expedientes y, en su caso, un cursor.
2. `fe_get_invoice_case(case_id)` devuelve factura, hechos, eventos, pruebas y revisión. Cada hecho tiene una fuente y una fecha de observación. Solo se proporciona una huella SHA-256 cuando los bytes correspondientes están disponibles para verificarse.
3. `fe_check_invoice(case_id)` devuelve hallazgos documentados. El diagnóstico de un modelo no debe presentarse como hecho de un sistema ni como consejo fiscal seguro.
4. `fe_get_available_actions(case_id)` devuelve operaciones permitidas _en este sistema_ en el momento de la llamada. Pueden dejar de estar permitidas al ejecutarlas.
5. `fe_prepare_action(case_id, type, note)` crea una propuesta temporal con efecto previsto, revisión y caducidad. En la versión de referencia 0.1, el único `type` es `record_internal_note` en el ERP sintético.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` vuelve a comprobar permisos, caducidad y revisión, y devuelve un recibo estable. Repetir una propuesta no debe duplicar su efecto. La aprobación de demostración es un código local; una integración real necesita controles propios de identidad, delegación y aprobación en el servidor.

## Estados y permisos

`refused_by_buyer`, `issued` y `not_booked` son estados de **sistemas distintos** en el ejemplo. La nota interna de referencia no cambia ningún estado reglamentario ni ninguna factura emitida. Futuras acciones, como abonos, rechazos o estados de pago, necesitarían sus propios esquemas, permisos y pruebas empresariales; aquí no están implementadas.

Una implementación real debe aislar las empresas, autenticar al usuario, comprobar la delegación en **cada** llamada, limitar los datos devueltos y conservar un registro de auditoría. Las anotaciones MCP describen la intención; no conceden permisos. El servidor de referencia está destinado únicamente a datos sintéticos públicos y locales.

## Compatibilidad y conformidad

Los nombres de herramientas y campos de esta versión son estables dentro del repositorio, sin reclamar carácter de norma oficial. Los proveedores pueden empezar con las llamadas de lectura y declarar no disponibles las escrituras. `bin/check.js` comprueba la forma y un escenario de lectura; no demuestra cumplimiento de XP Z12-012/013/014 ni seguridad de producción. Un cambio incompatible exigirá una nueva versión del perfil.
