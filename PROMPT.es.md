# Prompt de implementación FE-MCP para proveedores de software

[Français](PROMPT.md) · [English](PROMPT.en.md) · Español

Copie **todo el texto siguiente** en la IA de programación que trabaja en el repositorio de su software o servidor MCP. Déle acceso al código y a un entorno de pruebas con datos sintéticos. No se necesita acceso a producción para empezar.

---

Trabajas en el repositorio MCP de un proveedor de software. **Implementa el perfil comunitario FE-MCP 0.1.0** en este servidor usando los datos reales y los mecanismos de autorización del software; después demuestra la conformidad con un expediente de prueba sintético. Haz los cambios en el repositorio, ejecuta las pruebas y entrega un informe verificable. No actives la transmisión de facturas ni escrituras reglamentarias para cumplir este prompt.

## Lee el contrato antes de programar

- Repositorio público de referencia: `https://github.com/incwo/fe-mcp-profile/tree/v0.1.1`.
- Lee `SPEC.es.md`, `src/profile.js`, `src/reference.js`, `bin/check.js` y las pruebas del repositorio de referencia. El código de `src/profile.js` es la fuente exacta de nombres, parámetros y esquemas de la versión 0.1.0. No sustituyas silenciosamente los esquemas por otros «equivalentes».
- El perfil es una propuesta comunitaria por encima de MCP y de las API empresariales. No sustituye las plataformas autorizadas, XP Z12-013 ni las reglas fiscales aplicables.
- Usa el SDK MCP, el transporte, la autenticación y las convenciones existentes en tu repositorio. No añadas un segundo servidor ni otra pila tecnológica si puedes ampliar el servidor actual de forma limpia.

## Empieza con un inventario concreto

1. Localiza dónde se registran las herramientas MCP, los servicios de facturación, las posibles API de plataformas autorizadas, los modelos de factura/pedido/pago, los roles y delegaciones, y las pruebas existentes. Sigue las instrucciones locales del repositorio.
2. Prepara una tabla **campo FE-MCP → fuente empresarial → control de acceso → prueba disponible**. Separa claramente lo que sabe el software, lo que sabe la plataforma y lo que falta. No deduzcas un estado de la plataforma a partir de un estado del ERP o de contabilidad.
3. Elige un expediente sintético reproducible en una empresa de prueba. Asegúrate de que no revele facturas reales, datos de clientes ni secretos. Anota su `case_id` y el comando para iniciar el servidor MCP localmente.
4. Si falta información obligatoria, comunica la carencia y haz que falle explícitamente la llamada afectada. No inventes valores para superar el comprobador.

## Implementa las seis herramientas con sus nombres exactos

| Herramienta                | Comportamiento esperado                                                                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fe_find_invoices`         | Búsqueda paginada limitada a la empresa y a las facturas visibles para el actor; devuelve valores `case_id` estables en este servidor.                                                                                                                          |
| `fe_get_invoice_case`      | Devuelve factura, hechos, eventos, pruebas y revisión. Cada hecho tiene `source` y `observed_at`. Mantén separados los estados de la plataforma, comerciales y contables.                                                                                       |
| `fe_check_invoice`         | Devuelve solo hallazgos deterministas o claramente documentados, con `code`, `severity`, `rule_ref`, `evidence_refs` y `explanation`. Versiona las reglas; no presentes una sugerencia de IA como validación fiscal.                                            |
| `fe_get_available_actions` | Devuelve únicamente acciones realmente permitidas para este actor y expediente en este momento. Una lista vacía es válida.                                                                                                                                      |
| `fe_prepare_action`        | Prepara una acción tipada, su efecto anunciado, la revisión esperada y su caducidad; no cambia una factura emitida ni un estado reglamentario. Para la primera integración, admite solo `record_internal_note` si el software tiene realmente una nota interna. |
| `fe_execute_action`        | Vuelve a comprobar permisos, empresa, aprobación, caducidad y revisión al ejecutar; aplica el efecto una vez y devuelve un recibo estable. Si no existe una aprobación segura o la escritura correspondiente, rechaza explícitamente la ejecución.              |

En cada respuesta correcta, devuelve `structuredContent` conforme al `outputSchema` publicado, con `profile_version: "0.1.0"` y un `system` estable. Para un error empresarial o acceso denegado, devuelve un error MCP (`isError`) sin simular un éxito. Conserva los identificadores de origen y la procedencia; `case_id` es local al servidor, no un identificador fiscal universal. Proporciona `digest_sha256` solo si los bytes exactos de la prueba están disponibles para el mismo actor mediante un recurso MCP u otra vía autorizada y documentada; en caso contrario usa `null`.

## Permisos y escrituras: salvaguardas de producción

- Comprueba identidad, empresa, rol y delegación **en el servidor en cada llamada**, incluidas consultas, listas, pruebas y propuestas. El texto de un prompt, los argumentos proporcionados por un agente y las anotaciones MCP no conceden permisos. Evita también filtraciones entre empresas en errores, búsquedas y cursores.
- Reutiliza la autenticación existente. No pases un token de cliente MCP directamente a una plataforma autorizada u otra API salvo que el flujo de autorización de esa API lo permita. No registres secretos, originales ni adjuntos sensibles.
- El campo `approval_code` del perfil 0.1.0 **no es** una prueba de aprobación por sí solo. En producción, acepta únicamente una autorización verificable por el servidor, vinculada al actor, la empresa, el `proposal_id`, el efecto y una vida corta. Si tu arquitectura aún no lo permite, expón la herramienta pero deja la ejecución indisponible; no copies el código estático del servidor de demostración.
- Vincula `idempotency_key` al actor, la empresa y la operación; conserva los recibos tras reinicios y entre varias instancias. Rechaza el uso de una clave para otra propuesta. Impide duplicados con llamadas simultáneas.
- No crees abonos, rechazos de plataforma, estados de pago ni e-reporting en esta primera integración. Cada acción futura requiere su propio análisis empresarial, esquemas y permisos.

## Pruebas y criterios de aceptación

1. Añade pruebas de contrato para los nombres, parámetros, esquemas y salidas estructuradas de las **seis** herramientas. Prueba búsqueda/paginación, un expediente desconocido, las pruebas y la ausencia de cambios tras las consultas.
2. Prueba el aislamiento entre dos empresas y dos roles; verifica que un usuario no autorizado no vea expedientes, pruebas ni acciones. Prueba ejecución sin aprobación, propuestas caducadas, revisiones obsoletas, concurrencia y repetición idempotente. Si las escrituras no están disponibles, prueba el rechazo explícito.
3. Comprueba los mensajes dirigidos a usuarios en los idiomas del producto; ofrece al menos FR, EN y ES para textos nuevos si lo exigen las reglas del repositorio. Nunca traduzcas automáticamente datos de usuario.
4. Ejecuta el comprobador público **de solo lectura** contra el servidor local y el expediente sintético:

```sh
git clone https://github.com/incwo/fe-mcp-profile.git
cd fe-mcp-profile
npm ci
node bin/check.js --case-id ID_EXPEDIENTE_SINTETICO -- comando-para-iniciar-servidor-mcp argumentos
```

El comprobador actual espera un servidor MCP **stdio**. Si el tuyo usa HTTP, crea un adaptador stdio local de prueba o ejecuta las mismas aserciones mediante un cliente MCP HTTP; indica exactamente qué se probó. El comprobador verifica la forma y un escenario de lectura, no la seguridad ni el cumplimiento fiscal. Ejecuta también las pruebas y el formateador del repositorio del proveedor.

## Entrega esperada

Entrega los cambios de código, las pruebas y una breve documentación de integración. En el informe final incluye: (1) herramientas operativas y herramientas que rechazan deliberadamente las escrituras; (2) la tabla de correspondencia con fuentes de datos; (3) comando y resultados de prueba; (4) limitaciones concretas, incluidos datos de plataforma o delegaciones ausentes; y (5) acciones necesarias antes de un piloto real. No declares «conforme con la facturación electrónica» basándote solo en estas pruebas. No despliegues en producción sin instrucción explícita del proveedor.

---

**Primer piloto incwo previsto:** ejecutar este prompt en el repositorio MCP de incwo con una empresa de prueba y facturas sintéticas; después pasar el comprobador de solo lectura. Publicar este prompt aún no conecta incwo con una plataforma autorizada ni con otro proveedor.
