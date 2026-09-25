# FE-MCP Profile

**Una propuesta comunitaria para que los agentes accedan a los expedientes de facturación electrónica entre distintos proveedores de software.** Un pequeño vocabulario de herramientas MCP, un servidor de referencia con datos sintéticos y una comprobación de conformidad ejecutable.

[Français](README.md) · [English](README.en.md) · Español

> Versión exploratoria 0.1. Este proyecto no es una norma AFNOR, una plataforma autorizada ni una certificación de cumplimiento fiscal. No se conecta a ningún servicio real.

**Proveedores:** entregue el [prompt completo de implementación](PROMPT.es.md) a su IA de programación para añadir el perfil a su servidor MCP. Versiones [FR](PROMPT.md) y [EN](PROMPT.en.md).

## Por qué

Los formatos de factura y los intercambios con plataformas autorizadas ya cuentan con normas. El trabajo diario sigue repartido: una plataforma conoce un rechazo, el ERP conoce el pedido y la asesoría conoce el asiento. FE-MCP propone seis llamadas empresariales comunes con hechos documentados y acciones explícitas. Un cliente MCP autorizado puede conectarse por separado a los servidores de cada software y combinar sus respuestas. Los servidores no se comunican automáticamente entre sí.

## Pruébelo en dos minutos

Node.js 22+:

```sh
npm ci
npm run demo
npm run check
npm test
```

La demostración inicia tres servidores MCP locales reales (`pa`, `erp`, `accounting`) con **datos totalmente sintéticos**. Muestra una factura rechazada, una referencia de pedido encontrada en el ERP y la ausencia de asiento contable. No emite facturas ni contacta con terceros.

Cambiar el idioma: `node bin/demo.js --lang en` o `--lang es`. Salida JSON: `node bin/demo.js --json`. Iniciar un servidor por separado: `node bin/server.js --system pa --lang es` (transporte MCP stdio; la salida está destinada a un cliente MCP).

## Las seis herramientas

| Herramienta                | Función                                                                      |
| -------------------------- | ---------------------------------------------------------------------------- |
| `fe_find_invoices`         | Buscar expedientes y obtener identificadores estables                        |
| `fe_get_invoice_case`      | Leer factura, hechos, eventos, pruebas y procedencia                         |
| `fe_check_invoice`         | Obtener hallazgos respaldados por reglas y pruebas                           |
| `fe_get_available_actions` | Ver las acciones permitidas en este sistema                                  |
| `fe_prepare_action`        | Preparar una acción sin cambiar la factura                                   |
| `fe_execute_action`        | Ejecutar una propuesta con controles de autorización, versión e idempotencia |

El servidor de referencia solo permite escribir una **nota interna en el ERP**. Está desactivado por defecto y afecta únicamente a datos sintéticos. Las herramientas de lectura, el recurso de prueba y la verificación de su SHA-256 funcionan sin configuración. Consulte el [perfil detallado](SPEC.es.md).

## Comprobar otro servidor

El comprobador verifica las seis herramientas declaradas, sus esquemas, cuatro llamadas de lectura, la estabilidad de la revisión y la respuesta a un expediente desconocido. También verifica las huellas de los recursos `fe-demo://` cuando existen. Nunca llama a herramientas de escritura.

```sh
node bin/check.js --case-id FR-2026-0042 -- node /ruta/al/servidor.js
```

Un adaptador real debe aportar su propio expediente de prueba, sustituir el identificador después de `--case-id`, autenticar a cada actor y aplicar los permisos de cada empresa. El comprobador actual es un punto de partida para la interoperabilidad, no una auditoría reglamentaria ni de seguridad.

## Lugar en el ecosistema

FE-MCP se sitúa **por encima** de las API empresariales y de XP Z12-013. Las plataformas autorizadas conservan su papel legal de transmisión y recepción; los estados de la plataforma, comerciales y contables siguen siendo distintos. Este repositorio no sustituye al servidor existente [mcp-facture-electronique-fr](https://github.com/cmendezs/mcp-facture-electronique-fr), que expone interfaces de plataformas. El primer piloto previsto usa el servidor MCP de incwo y datos sintéticos; después podrá seguir una prueba entre dos proveedores y una asesoría.

Fuentes: [autoridad fiscal francesa — plataformas](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees), [especificaciones externas](https://www.impots.gouv.fr/specifications-externes-b2b), [arquitectura MCP](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture).

MIT · [Contribuir](CONTRIBUTING.md) · [Seguridad](SECURITY.md)
