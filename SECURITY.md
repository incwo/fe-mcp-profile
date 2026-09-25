# Sécurité · Security · Seguridad

## Français

Le serveur de référence manipule uniquement des données synthétiques en mémoire. Il n'authentifie pas d'utilisateurs et ne doit pas être exposé comme service de production. Ses écritures sont désactivées par défaut ; le code d'approbation local illustre un contrôle, sans constituer une délégation réelle. Une intégration doit vérifier identité, organisation, délégation et droits à chaque appel, isoler les entreprises, protéger les originaux et éviter toute fuite de jeton. Signalez une vulnérabilité via les avis de sécurité GitHub du dépôt, sans publier de secret dans une issue.

## English

The reference server handles only synthetic in-memory data. It does not authenticate users and must not be exposed as a production service. Writes are disabled by default; the local approval code illustrates a check but is not real delegation. An integration must check identity, organization, delegation and permissions on every call, isolate companies, protect originals and prevent token leakage. Report vulnerabilities through the repository's GitHub security advisories without publishing secrets in an issue.

## Español

El servidor de referencia solo maneja datos sintéticos en memoria. No autentica usuarios y no debe exponerse como servicio de producción. Las escrituras están desactivadas por defecto; el código de aprobación local ilustra un control, pero no es una delegación real. Una integración debe comprobar identidad, organización, delegación y permisos en cada llamada, aislar las empresas, proteger los originales y evitar fugas de tokens. Comunique las vulnerabilidades mediante los avisos de seguridad de GitHub del repositorio, sin publicar secretos en una incidencia.
