# FE-MCP 0.3 — perfil propuesto

[Français](SPEC.md) · [English](SPEC.en.md) · Español

Este documento describe una **convención comunitaria experimental**, independiente de las normas de facturación. Define una interfaz para clientes MCP, no un nuevo canal de transmisión entre plataformas autorizadas.

## Modelo

Un `case_id` es un identificador estable de expediente dentro de **un servidor**. No sustituye los identificadores de factura, empresa o plataforma. El cliente que combina sistemas relaciona sus referencias y conserva `system` y `source`. Una factura puede tener estados simultáneos distintos en diferentes ámbitos; el servidor no debe inventar un estado global. En `fe_find_invoices`, `state_domain` vale `pa`, `commercial` o `accounting`; `current_state` sigue siendo libre **dentro de ese ámbito**.

Cada respuesta correcta usa `structuredContent`, se valida con el `outputSchema` publicado e incluye `profile_version: "0.3.0"` y `system`. Un hallazgo incluye `code`, `severity`, `rule_ref`, `evidence_refs` y `explanation`. `rule_ref` sigue `namespace:rule@version`, por ejemplo `demo:buyer-reference@1`. Las reglas `demo:*` no constituyen validación reglamentaria.

`issue_date`, `due_date` (que puede ser nulo), `facts[].observed_at`, `events[].at` y `expires_at` son fechas y horas RFC 3339 en **UTC con sufijo `Z`**. `seller_id` y `buyer_id` son `{ scheme, value } | null`, con `scheme` entre `siren`, `siret`, `vat`, `duns`, `gln`, `other`; `value` conserva el identificador de origen. El esquema no comprueba la validez real del identificador. Las pruebas usan `digest: { alg: "sha256", value: "..." } | null`. Solo se proporciona una huella si los bytes correspondientes están disponibles para el actor autorizado.

Los errores empresariales usan `isError: true`, un mensaje humano en `content` y un código estable en `_meta["fe-mcp/error"].code`. Códigos 0.3: `not_found`, `forbidden`, `unsupported_action`, `stale_revision`, `expired`, `idempotency_conflict`, `write_disabled`, `invalid_input`, `internal`. `structuredContent` se reserva para los éxitos porque el SDK lo valida con el `outputSchema` del resultado normal. Los errores del protocolo MCP son distintos y conservan sus propios códigos.

## Semántica de estados y alcance

`system` es el identificador estable y libre del servidor emisor, distinto de `state_domain`. El campo facultativo y anulable `system_role` vale `pa`, `erp`, `accounting` u `other`; un ERP puede exponer observaciones documentadas de una PA sin declararse PA. `current_state` conserva el valor nativo del sistema. `current_state_std` es facultativo, anulable y libre; solo contiene un valor recomendado si la correspondencia está justificada. Los clientes deben conservar el ámbito y la procedencia y aceptar valores desconocidos.

Vocabulario **recomendado, no impuesto por el esquema**:

| `state_domain` | Valores sugeridos de `current_state_std`                                                                                                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pa`           | `deposee`, `rejetee`, `refusee`, `encaissee`, `emise_par_plateforme`, `recue_par_plateforme`, `mise_a_disposition`, `prise_en_charge`, `completee`, `suspendue`, `en_litige`, `approuvee`, `approuvee_partiellement`, `paiement_transmis` |
| `commercial`   | `draft`, `issued`, `sent`, `disputed`, `cancelled`                                                                                                                                                                                        |
| `accounting`   | `not_booked`, `booked`, `matched`, `partially_paid`, `paid`                                                                                                                                                                               |

Para `pa`, la [ficha DGFiP 1-F-V (2025)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-1_f_v.pdf) identifica cuatro estados mínimos: depósito, rechazo por plataforma, rechazo por destinatario y cobro. Las demás etiquetas son ejemplos de ciclo de vida de las [especificaciones externas v2.1, § 2.8 (29 de julio de 2022)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/specification_externes_b2b/version_2-1_du_29_07_2022/dossier-de-specifications-externes-de-la-facturation-electronique-v2.1.pdf), **no** una lista normativa vigente. Según las [especificaciones externas v3.2 (30 de abril de 2026)](https://www.impots.gouv.fr/specifications-externes-b2b), el marco común de intercambio incluye XP Z12-012; compruebe esa norma y las reglas de la PA antes de cualquier correspondencia de producción. `commercial` y `accounting` son convenciones FE-MCP sin carácter reglamentario.

`transaction_type` es anulable (`b2b_domestic`, `b2c`, `b2b_international`, `payment_data`, `other`) y clasifica el expediente sin determinar obligaciones legales. El perfil describe un **expediente de factura de lectura**; no define envío de e-reporting, agregación de transacciones ni declaración de pagos. Las [especificaciones DGFiP v3.2](https://www.impots.gouv.fr/specifications-externes-b2b) cubren esos flujos distintos. Un expediente autónomo de datos de pago sin factura no se puede representar mediante `fe_get_invoice_case` 0.3.

`events[]` contiene `reason_code` y `reason_label` anulables. El código conserva un espacio de nombres de origen, por ejemplo `pa:format_invalid`, `buyer:missing_order_reference` o `commercial:price_dispute`. Son ejemplos, no un enum ni una equivalencia entre rechazo de PA, rechazo del comprador y disputa comercial. La etiqueta explica el motivo en el idioma de respuesta sin traducir los datos redactados por el usuario.

En `fe_get_invoice_case`, `recipient_directory_status` (`found`, `not_found`, `ambiguous`) y `recipient_pdp`/`routing_id` anulables ofrecen una **observación de solo lectura** del enrutamiento cuando existe. Son `null` si el servidor no tiene dicha observación, incluso fuera del ámbito PA. `recipient_pdp` y `routing_id` son identificadores opacos; `found` no demuestra entrega ni conformidad. La referencia no consulta ningún directorio real.

## Correspondencia indicativa EN 16931

| FE-MCP               | Término EN 16931                                | Límite                                                  |
| -------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `invoice.number`     | BT-1                                            | Número de factura                                       |
| `invoice.issue_date` | BT-2                                            | FE-MCP conserva un instante UTC; EN 16931 usa una fecha |
| `invoice.due_date`   | BT-9                                            | La misma diferencia entre fecha e instante              |
| `invoice.currency`   | BT-5                                            | Moneda de la factura                                    |
| `invoice.amount_due` | BT-115                                          | Importe pendiente; FE-MCP no valida la aritmética       |
| `invoice.seller_id`  | BT-29, BT-30 o BT-31 según naturaleza y esquema | Sin correspondencia automática garantizada              |
| `invoice.buyer_id`   | BT-46, BT-47 o BT-48 según naturaleza y esquema | Sin correspondencia automática garantizada              |

Esta tabla **no normativa** usa el [modelo EN 16931 vinculado a UBL de Peppol BIS Billing 3.0, edición de mayo de 2026](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/). `siren`/`siret` pueden ser identificadores legales o comerciales según contexto y perfil de factura. `vat` apunta al identificador del IVA solo si identifica realmente a esa parte. `duns`/`gln` requieren su propio esquema en el documento de destino. FE-MCP no convierte identificadores ni valida facturas EN 16931.

## Paginación

`fe_find_invoices` acepta un `query` vacío, un `limit` de 1 a 100 y un `cursor` opaco. Reutilizar el cursor con el **mismo** `query` y `limit` debe devolver la misma página mientras sea válido, sin duplicados de la página anterior. Los servidores pueden establecer una duración documentada; un cursor ilegible, modificado, caducado o usado con otros parámetros devuelve `invalid_input`. La referencia tiene tres expedientes sintéticos y cursores firmados válidos durante cinco minutos, invalidados al reiniciar.

## Llamadas

1. `fe_find_invoices(query, limit, cursor)` devuelve referencias de expedientes, su ámbito de estado y, en su caso, un cursor.
2. `fe_get_invoice_case(case_id)` devuelve factura, fechas, identificadores, hechos, eventos, pruebas y revisión. Cada hecho tiene una fuente y una fecha de observación.
3. `fe_check_invoice(case_id)` devuelve hallazgos documentados. El diagnóstico de un modelo no debe presentarse como hecho de un sistema ni como consejo fiscal seguro.
4. `fe_get_available_actions(case_id)` devuelve operaciones permitidas _en este sistema_ en el momento de la llamada. Pueden dejar de estar permitidas al ejecutarlas.
5. `fe_prepare_action(case_id, type, note)` crea una propuesta temporal con efecto previsto, revisión y caducidad. En la versión de referencia 0.3, el único `type` es `record_internal_note` en el ERP sintético.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` vuelve a comprobar permisos, caducidad y revisión, y devuelve un recibo estable. Repetir una propuesta no debe duplicar su efecto. La aprobación de demostración es un código local; una integración real necesita controles propios de identidad, delegación y aprobación en el servidor.

## Estados y permisos

`refused_by_buyer`, `issued` y `not_booked` son estados de **sistemas distintos** en el ejemplo. La nota interna de referencia no cambia ningún estado reglamentario ni ninguna factura emitida. Futuras acciones, como abonos, rechazos o estados de pago, necesitarían sus propios esquemas, permisos y pruebas empresariales; aquí no están implementadas.

Una implementación real debe aislar las empresas, autenticar al usuario, comprobar la delegación en **cada** llamada, limitar los datos devueltos y conservar un registro de auditoría. Las anotaciones MCP describen la intención; no conceden permisos. El servidor de referencia está destinado únicamente a datos sintéticos públicos y locales.

El campo `approval_code` **no es autoritativo**: su presencia no demuestra ningún permiso. El servidor debe verificar una aprobación vinculada al actor, la empresa, la propuesta, su efecto y una validez corta; en caso contrario, la ejecución devuelve `write_disabled` o `forbidden`. El código estático de la demostración no es un modelo de seguridad de producción.

## Compatibilidad y conformidad

Los nombres de herramientas y campos de esta versión son estables dentro del repositorio, sin reclamar carácter de norma oficial. Los proveedores pueden empezar con las llamadas de lectura y declarar no disponibles las escrituras. `bin/check.js` comprueba la forma y un escenario de lectura mediante stdio o HTTP Streamable; no demuestra cumplimiento de XP Z12-012/013/014 ni seguridad de producción.

`profile_version` es la versión del **contrato transmitido**; la etiqueta Git identifica una **publicación del repositorio**. Evolucionan por separado. El perfil 0.3.0 es incompatible con 0.2.0: `seller_id` y `buyer_id` pasan a ser objetos tipados anulables y `events[]` añade motivos anulables. Convierta cadenas antiguas a `{ scheme, value }` solo tras identificar con fiabilidad el esquema; en caso contrario use `null`. `z.literal("0.3.0")` exige `profile_version` en las seis salidas; consulte [CHANGELOG.es.md](CHANGELOG.es.md).
