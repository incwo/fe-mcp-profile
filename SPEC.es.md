# FE-MCP 0.2 — perfil propuesto

[Français](SPEC.md) · [English](SPEC.en.md) · Español

Este documento describe una **convención comunitaria experimental**, independiente de las normas de facturación. Define una interfaz para clientes MCP, no un nuevo canal de transmisión entre plataformas autorizadas.

## Modelo

Un `case_id` es un identificador estable de expediente dentro de **un servidor**. No sustituye los identificadores de factura, empresa o plataforma. El cliente que combina sistemas relaciona sus referencias y conserva `system` y `source`. Una factura puede tener estados simultáneos distintos en diferentes ámbitos; el servidor no debe inventar un estado global. En `fe_find_invoices`, `state_domain` vale `pa`, `commercial` o `accounting`; `current_state` sigue siendo libre **dentro de ese ámbito**.

Cada respuesta correcta usa `structuredContent`, se valida con el `outputSchema` publicado e incluye `profile_version: "0.2.0"` y `system`. Un hallazgo incluye `code`, `severity`, `rule_ref`, `evidence_refs` y `explanation`. `rule_ref` sigue `namespace:rule@version`, por ejemplo `demo:buyer-reference@1`. Las reglas `demo:*` no constituyen validación reglamentaria.

`issue_date`, `due_date` (que puede ser nulo), `facts[].observed_at`, `events[].at` y `expires_at` son fechas y horas RFC 3339 en **UTC con sufijo `Z`**. `seller_id` y `buyer_id` son identificadores legales que pueden ser nulos; la versión 0.2 aún no normaliza su sistema de identificación. Las pruebas usan `digest: { alg: "sha256", value: "..." } | null`. Solo se proporciona una huella si los bytes correspondientes están disponibles para el actor autorizado.

Los errores empresariales usan `isError: true`, un mensaje humano en `content` y un código estable en `_meta["fe-mcp/error"].code`. Códigos 0.2: `not_found`, `forbidden`, `unsupported_action`, `stale_revision`, `expired`, `idempotency_conflict`, `write_disabled`, `invalid_input`, `internal`. `structuredContent` se reserva para los éxitos porque el SDK lo valida con el `outputSchema` del resultado normal. Los errores del protocolo MCP son distintos y conservan sus propios códigos.

## Paginación

`fe_find_invoices` acepta un `query` vacío, un `limit` de 1 a 100 y un `cursor` opaco. Reutilizar el cursor con el **mismo** `query` y `limit` debe devolver la misma página mientras sea válido, sin duplicados de la página anterior. Los servidores pueden establecer una duración documentada; un cursor ilegible, modificado, caducado o usado con otros parámetros devuelve `invalid_input`. La referencia tiene tres expedientes sintéticos y cursores firmados válidos durante cinco minutos, invalidados al reiniciar.

## Llamadas

1. `fe_find_invoices(query, limit, cursor)` devuelve referencias de expedientes, su ámbito de estado y, en su caso, un cursor.
2. `fe_get_invoice_case(case_id)` devuelve factura, fechas, identificadores, hechos, eventos, pruebas y revisión. Cada hecho tiene una fuente y una fecha de observación.
3. `fe_check_invoice(case_id)` devuelve hallazgos documentados. El diagnóstico de un modelo no debe presentarse como hecho de un sistema ni como consejo fiscal seguro.
4. `fe_get_available_actions(case_id)` devuelve operaciones permitidas _en este sistema_ en el momento de la llamada. Pueden dejar de estar permitidas al ejecutarlas.
5. `fe_prepare_action(case_id, type, note)` crea una propuesta temporal con efecto previsto, revisión y caducidad. En la versión de referencia 0.2, el único `type` es `record_internal_note` en el ERP sintético.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` vuelve a comprobar permisos, caducidad y revisión, y devuelve un recibo estable. Repetir una propuesta no debe duplicar su efecto. La aprobación de demostración es un código local; una integración real necesita controles propios de identidad, delegación y aprobación en el servidor.

## Estados y permisos

`refused_by_buyer`, `issued` y `not_booked` son estados de **sistemas distintos** en el ejemplo. La nota interna de referencia no cambia ningún estado reglamentario ni ninguna factura emitida. Futuras acciones, como abonos, rechazos o estados de pago, necesitarían sus propios esquemas, permisos y pruebas empresariales; aquí no están implementadas.

Una implementación real debe aislar las empresas, autenticar al usuario, comprobar la delegación en **cada** llamada, limitar los datos devueltos y conservar un registro de auditoría. Las anotaciones MCP describen la intención; no conceden permisos. El servidor de referencia está destinado únicamente a datos sintéticos públicos y locales.

El campo `approval_code` **no es autoritativo**: su presencia no demuestra ningún permiso. El servidor debe verificar una aprobación vinculada al actor, la empresa, la propuesta, su efecto y una validez corta; en caso contrario, la ejecución devuelve `write_disabled` o `forbidden`. El código estático de la demostración no es un modelo de seguridad de producción.

## Compatibilidad y conformidad

Los nombres de herramientas y campos de esta versión son estables dentro del repositorio, sin reclamar carácter de norma oficial. Los proveedores pueden empezar con las llamadas de lectura y declarar no disponibles las escrituras. `bin/check.js` comprueba la forma y un escenario de lectura mediante stdio o HTTP Streamable; no demuestra cumplimiento de XP Z12-012/013/014 ni seguridad de producción.

`profile_version` es la versión del **contrato transmitido**; la etiqueta Git identifica una **publicación del repositorio**. Evolucionan por separado. El perfil 0.2.0 es incompatible con 0.1.0 (`digest_sha256` pasa a `digest` y `state_domain` es obligatorio). Un cambio incompatible exige una nueva versión del perfil; consulte [CHANGELOG.es.md](CHANGELOG.es.md).
