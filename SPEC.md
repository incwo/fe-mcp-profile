# FE-MCP 0.1 — profil proposé

Français · [English](SPEC.en.md) · [Español](SPEC.es.md)

Ce document décrit une **convention communautaire expérimentale**, indépendante des normes de facturation. Il décrit une interface destinée aux clients MCP, pas un nouveau canal de transmission entre plateformes agréées.

## Modèle

Un `case_id` est l'identifiant stable d'un dossier dans **un serveur**. Il ne remplace ni l'identifiant de facture, ni le SIREN/SIRET, ni les identifiants PA. Le client qui compose plusieurs systèmes rapproche leurs références et conserve `system` et `source`. Une facture peut avoir plusieurs statuts simultanés dans des domaines différents ; un serveur ne doit pas en inventer un statut global.

Chaque réponse réussie utilise `structuredContent`, valide le `outputSchema` publié et comporte `profile_version` et `system`. Les réponses d'erreur utilisent `isError` sans simuler un résultat réussi. Les listes sont paginées. Un constat comprend `code`, `severity`, `rule_ref`, `evidence_refs` et `explanation`. `rule_ref` doit identifier la version de règle applicable ; les règles de démonstration `demo:*` ne constituent aucune validation réglementaire.

## Appels

1. `fe_find_invoices(query, limit, cursor)` retourne des références de dossiers et un curseur éventuel.
2. `fe_get_invoice_case(case_id)` retourne facture, faits, événements, preuves et révision. Chaque fait indique sa source et sa date d'observation. Une empreinte SHA-256 n'est fournie que si les octets vérifiables sont accessibles.
3. `fe_check_invoice(case_id)` retourne des constats sourcés. Aucun diagnostic du modèle ne doit être présenté comme un fait d'un système ou comme un avis fiscal certain.
4. `fe_get_available_actions(case_id)` retourne les opérations permises _dans ce système_ au moment de l'appel. Cette liste ne garantit pas qu'elles seront encore permises lors de l'exécution.
5. `fe_prepare_action(case_id, type, note)` crée une proposition temporaire avec effet annoncé, révision attendue et expiration. Dans la référence 0.1, le seul `type` est `record_internal_note` dans l'ERP synthétique.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` revérifie droits, expiration et révision, puis rend un reçu stable. Une répétition de la même proposition ne doit pas doubler l'effet. L'approbation de démonstration est un code local ; une intégration réelle doit employer son propre contrôle d'identité, de délégation et d'approbation côté serveur.

## États et droits

`refused_by_buyer`, `issued` et `not_booked` sont des états de systèmes **distincts** dans l'exemple. La note interne de référence ne change aucun statut réglementaire et ne modifie aucune facture émise. Les futures actions comme avoir, refus ou statut d'encaissement exigeraient des schémas, des habilitations et des tests métier propres ; elles ne sont pas implémentées ici.

Une implémentation réelle doit isoler les entreprises, authentifier l'utilisateur, vérifier sa délégation à **chaque** appel, limiter les données renvoyées et conserver un journal d'audit. Les annotations MCP décrivent une intention ; elles ne confèrent aucun droit. Le serveur de référence n'est destiné qu'à des données publiques synthétiques locales.

## Compatibilité et conformité

Les noms d'outils et les champs de cette version sont stables dans le dépôt, sans prétendre à une norme officielle. Les éditeurs peuvent démarrer par les appels de lecture et déclarer les écritures indisponibles. Le banc `bin/check.js` teste la forme et un scénario de lecture ; il ne prouve ni conformité à XP Z12-012/013/014, ni sécurité de production. Une évolution incompatible entraînera une nouvelle version du profil.
