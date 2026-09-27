# FE-MCP 0.2 — profil proposé

Français · [English](SPEC.en.md) · [Español](SPEC.es.md)

Ce document décrit une **convention communautaire expérimentale**, indépendante des normes de facturation. Il décrit une interface destinée aux clients MCP, pas un nouveau canal de transmission entre plateformes agréées.

## Modèle

Un `case_id` est l'identifiant stable d'un dossier dans **un serveur**. Il ne remplace ni l'identifiant de facture, ni le SIREN/SIRET, ni les identifiants PA. Le client qui compose plusieurs systèmes rapproche leurs références et conserve `system` et `source`. Une facture peut avoir plusieurs états simultanés dans des domaines différents ; un serveur ne doit pas en inventer un état global. Dans `fe_find_invoices`, `state_domain` vaut `pa`, `commercial` ou `accounting` ; `current_state` reste libre **à l'intérieur de ce domaine**.

Chaque réponse réussie utilise `structuredContent`, valide le `outputSchema` publié et comporte `profile_version: "0.2.0"` et `system`. Un constat comprend `code`, `severity`, `rule_ref`, `evidence_refs` et `explanation`. `rule_ref` suit `namespace:rule@version`, par exemple `demo:buyer-reference@1`. Les règles `demo:*` ne constituent aucune validation réglementaire.

Les champs `issue_date`, `due_date` (nullable), `facts[].observed_at`, `events[].at` et `expires_at` sont des dates/heures RFC 3339 en **UTC avec suffixe `Z`**. `seller_id` et `buyer_id` sont des identifiants légaux nullable ; la version 0.2 ne normalise pas encore leur système d'identification. Les preuves utilisent `digest: { alg: "sha256", value: "..." } | null`. Ne fournir une empreinte que si les octets correspondants sont accessibles à l'acteur autorisé.

Les erreurs métier utilisent `isError: true`, un message humain dans `content` et un code stable dans `_meta["fe-mcp/error"].code`. Codes 0.2 : `not_found`, `forbidden`, `unsupported_action`, `stale_revision`, `expired`, `idempotency_conflict`, `write_disabled`, `invalid_input`, `internal`. `structuredContent` reste réservé aux succès, car le SDK valide sa forme contre l'`outputSchema` du résultat normal. Les erreurs de protocole MCP, distinctes des erreurs métier du profil, gardent leurs propres codes.

## Pagination

`fe_find_invoices` accepte `query` vide, `limit` de 1 à 100 et un `cursor` opaque. Réutiliser le curseur avec le **même** `query` et `limit` doit rendre la même page tant qu'il est valide, sans doublon avec la page précédente. Le serveur peut fixer une durée de validité documentée ; un curseur illisible, modifié, expiré ou utilisé avec d'autres paramètres renvoie `invalid_input`. La référence propose trois dossiers synthétiques, des curseurs signés valables cinq minutes, invalidés au redémarrage.

## Appels

1. `fe_find_invoices(query, limit, cursor)` retourne des références de dossiers, leur domaine d'état et un curseur éventuel.
2. `fe_get_invoice_case(case_id)` retourne facture, dates, identifiants, faits, événements, preuves et révision. Chaque fait indique sa source et sa date d'observation.
3. `fe_check_invoice(case_id)` retourne des constats sourcés. Aucun diagnostic du modèle ne doit être présenté comme un fait d'un système ou comme un avis fiscal certain.
4. `fe_get_available_actions(case_id)` retourne les opérations permises _dans ce système_ au moment de l'appel. Cette liste ne garantit pas qu'elles seront encore permises lors de l'exécution.
5. `fe_prepare_action(case_id, type, note)` crée une proposition temporaire avec effet annoncé, révision attendue et expiration. Dans la référence 0.2, le seul `type` est `record_internal_note` dans l'ERP synthétique.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` revérifie droits, expiration et révision, puis rend un reçu stable. Une répétition de la même proposition ne doit pas doubler l'effet. L'approbation de démonstration est un code local ; une intégration réelle doit employer son propre contrôle d'identité, de délégation et d'approbation côté serveur.

## États et droits

`refused_by_buyer`, `issued` et `not_booked` sont des états de systèmes **distincts** dans l'exemple. La note interne de référence ne change aucun statut réglementaire et ne modifie aucune facture émise. Les futures actions comme avoir, refus ou statut d'encaissement exigeraient des schémas, des habilitations et des tests métier propres ; elles ne sont pas implémentées ici.

Une implémentation réelle doit isoler les entreprises, authentifier l'utilisateur, vérifier sa délégation à **chaque** appel, limiter les données renvoyées et conserver un journal d'audit. Les annotations MCP décrivent une intention ; elles ne confèrent aucun droit. Le serveur de référence n'est destiné qu'à des données publiques synthétiques locales.

Le champ `approval_code` est **non autoritatif** : sa présence ne prouve aucune autorisation. Le serveur doit vérifier une approbation liée à l'acteur, au tenant, à la proposition, à son effet et à une courte durée de validité ; sinon l'exécution renvoie `write_disabled` ou `forbidden`. Le code statique de la démo n'est pas un modèle de sécurité de production.

## Compatibilité et conformité

Les noms d'outils et les champs de cette version sont stables dans le dépôt, sans prétendre à une norme officielle. Les éditeurs peuvent démarrer par les appels de lecture et déclarer les écritures indisponibles. Le banc `bin/check.js` teste la forme et un scénario de lecture via stdio ou HTTP Streamable ; il ne prouve ni conformité à XP Z12-012/013/014, ni sécurité de production.

`profile_version` est la version du **contrat sur le fil** ; le tag Git est la version d'une **publication du dépôt**. Ils évoluent séparément. Le profil 0.2.0 est incompatible avec 0.1.0 (`digest_sha256` devient `digest` et `state_domain` est requis). Une évolution incompatible exige une nouvelle version de profil ; voir [CHANGELOG.md](CHANGELOG.md).
