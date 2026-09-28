# Historial de versiones

[Français](CHANGELOG.md) · [English](CHANGELOG.en.md) · Español

Las etiquetas Git versionan el repositorio; `profile_version` versiona el contrato FE-MCP transmitido. Estos números pueden diferir.

## v0.3.0 — perfil 0.3.0 — 28 de septiembre de 2026

- **Incompatible con 0.2.0**: `seller_id`/`buyer_id` pasan a `{ scheme, value } | null`. Convierta cadenas solo tras identificar con fiabilidad su esquema; en caso contrario use `null`.
- `z.literal` fija `profile_version` en las seis salidas. Se añaden `system_role`, `current_state_std`, `transaction_type`, motivos de eventos y observaciones de enrutamiento.
- Vocabulario de estados recomendado, alcance del e-reporting y correspondencia indicativa EN 16931 documentados en FR/EN/ES. Issues #12–#19.

## v0.2.0 — perfil 0.2.0 — 27 de septiembre de 2026

- **Incompatible con el perfil 0.1.0**: `digest_sha256` pasa a `digest: { alg, value } | null` y `state_domain` es obligatorio en la búsqueda.
- Fechas y horas UTC validadas, nuevas fechas e identificadores de factura y reglas referenciadas como `namespace:rule@version`.
- Códigos de error empresarial en `_meta["fe-mcp/error"].code`, independientes del mensaje traducido.
- Comprobador de conformidad HTTP Streamable con cabeceras de prueba y las mismas verificaciones que stdio; paginación real con cursores firmados y prueba de la segunda página.
- Prompt para proveedores y documentación actualizados en francés, inglés y español. Resuelve las incidencias #1 a #10.

## v0.1.1 — perfil 0.1.0 — 25 de septiembre de 2026

- Publicación del prompt de implementación para proveedores en tres idiomas; contrato transmitido sin cambios.

## v0.1.0 — perfil 0.1.0 — 25 de septiembre de 2026

- Primera publicación de seis herramientas, tres servidores sintéticos y el comprobador de conformidad stdio.
