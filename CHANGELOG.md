# Historique des versions

Français · [English](CHANGELOG.en.md) · [Español](CHANGELOG.es.md)

Le tag Git versionne le dépôt ; `profile_version` versionne le contrat FE-MCP échangé sur le fil. Ces deux numéros peuvent différer.

## v0.3.0 — profil 0.3.0 — 28 septembre 2026

- **Incompatible avec 0.2.0** : `seller_id`/`buyer_id` deviennent `{ scheme, value } | null`. Convertir les chaînes après identification fiable du schéma, sinon utiliser `null`.
- `profile_version` est verrouillé par `z.literal` sur les six sorties. Ajout de `system_role`, `current_state_std`, `transaction_type`, de motifs d’événement et d’observations de routage.
- Vocabulaire d’états recommandé, périmètre e-reporting et correspondance indicative EN 16931 documentés en FR/EN/ES. Issues #12 à #19.

## v0.2.0 — profil 0.2.0 — 27 septembre 2026

- **Incompatible avec le profil 0.1.0** : `digest_sha256` devient `digest: { alg, value } | null` et `state_domain` devient obligatoire dans la recherche.
- Dates/heures UTC validées, dates et identifiants de facture supplémentaires, règles référencées par `namespace:rule@version`.
- Erreurs métier codées dans `_meta["fe-mcp/error"].code`, indépendamment du message traduit.
- Banc de conformité HTTP Streamable avec en-têtes de test, même vérification qu'en stdio ; pagination réelle avec curseurs signés et test de la deuxième page.
- Documentation et prompt éditeur mis à jour en français, anglais et espagnol. Résolution des issues #1 à #10.

## v0.1.1 — profil 0.1.0 — 25 septembre 2026

- Publication du prompt d'implémentation destiné aux éditeurs en trois langues ; contrat sur le fil inchangé.

## v0.1.0 — profil 0.1.0 — 25 septembre 2026

- Première publication des six outils, de trois serveurs synthétiques et du banc de conformité stdio.
