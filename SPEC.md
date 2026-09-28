# FE-MCP 0.3 — profil proposé

Français · [English](SPEC.en.md) · [Español](SPEC.es.md)

Ce document décrit une **convention communautaire expérimentale**, indépendante des normes de facturation. Il décrit une interface destinée aux clients MCP, pas un nouveau canal de transmission entre plateformes agréées.

## Modèle

Un `case_id` est l'identifiant stable d'un dossier dans **un serveur**. Il ne remplace ni l'identifiant de facture, ni le SIREN/SIRET, ni les identifiants PA. Le client qui compose plusieurs systèmes rapproche leurs références et conserve `system` et `source`. Une facture peut avoir plusieurs états simultanés dans des domaines différents ; un serveur ne doit pas en inventer un état global. Dans `fe_find_invoices`, `state_domain` vaut `pa`, `commercial` ou `accounting` ; `current_state` reste libre **à l'intérieur de ce domaine**.

Chaque réponse réussie utilise `structuredContent`, valide le `outputSchema` publié et comporte `profile_version: "0.3.0"` et `system`. Un constat comprend `code`, `severity`, `rule_ref`, `evidence_refs` et `explanation`. `rule_ref` suit `namespace:rule@version`, par exemple `demo:buyer-reference@1`. Les règles `demo:*` ne constituent aucune validation réglementaire.

Les champs `issue_date`, `due_date` (nullable), `facts[].observed_at`, `events[].at` et `expires_at` sont des dates/heures RFC 3339 en **UTC avec suffixe `Z`**. `seller_id` et `buyer_id` valent `{ scheme, value } | null` avec `scheme` parmi `siren`, `siret`, `vat`, `duns`, `gln`, `other` ; `value` conserve l’identifiant source. Le schéma ne valide pas la réalité de l’identifiant. Les preuves utilisent `digest: { alg: "sha256", value: "..." } | null`. Ne fournir une empreinte que si les octets correspondants sont accessibles à l'acteur autorisé.

Les erreurs métier utilisent `isError: true`, un message humain dans `content` et un code stable dans `_meta["fe-mcp/error"].code`. Codes 0.3 : `not_found`, `forbidden`, `unsupported_action`, `stale_revision`, `expired`, `idempotency_conflict`, `write_disabled`, `invalid_input`, `internal`. `structuredContent` reste réservé aux succès, car le SDK valide sa forme contre l'`outputSchema` du résultat normal. Les erreurs de protocole MCP, distinctes des erreurs métier du profil, gardent leurs propres codes.

## Sémantique des états et périmètre

`system` est l’identifiant stable et libre du serveur émetteur, distinct de `state_domain`. `system_role` est facultatif et nullable (`pa`, `erp`, `accounting`, `other`) ; un ERP peut donc exposer des observations PA sourcées sans se présenter comme une PA. `current_state` conserve la valeur native du système. `current_state_std` est facultatif, nullable et libre ; il porte une valeur recommandée uniquement si la correspondance est justifiée. Les clients doivent toujours conserver le domaine et la provenance, et accepter les valeurs inconnues.

Vocabulaire **recommandé, non imposé par le schéma** :

| `state_domain` | Valeurs proposées pour `current_state_std`                                                                                                                                                                                                |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pa`           | `deposee`, `rejetee`, `refusee`, `encaissee`, `emise_par_plateforme`, `recue_par_plateforme`, `mise_a_disposition`, `prise_en_charge`, `completee`, `suspendue`, `en_litige`, `approuvee`, `approuvee_partiellement`, `paiement_transmis` |
| `commercial`   | `draft`, `issued`, `sent`, `disputed`, `cancelled`                                                                                                                                                                                        |
| `accounting`   | `not_booked`, `booked`, `matched`, `partially_paid`, `paid`                                                                                                                                                                               |

Pour `pa`, la [fiche DGFiP 1-F-V (2025)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/fiches_reforme/fiche-1_f_v.pdf) distingue quatre statuts minimaux de prise en charge : dépôt, rejet, refus et encaissée. Les autres libellés ci-dessus sont des exemples de cycle de vie issus du [dossier de spécifications externes v2.1, § 2.8 (29 juillet 2022)](https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/specification_externes_b2b/version_2-1_du_29_07_2022/dossier-de-specifications-externes-de-la-facturation-electronique-v2.1.pdf), **pas** une liste normative actuelle. Depuis les [spécifications externes v3.2 (30 avril 2026)](https://www.impots.gouv.fr/specifications-externes-b2b), le socle d’échange entre entreprises relève notamment de XP Z12-012 ; vérifier cette norme et les règles de la PA avant tout mapping de production. `commercial` et `accounting` sont des conventions FE-MCP, sans statut réglementaire.

`transaction_type` est nullable (`b2b_domestic`, `b2c`, `b2b_international`, `payment_data`, `other`) et classe le dossier sans déterminer à lui seul les obligations applicables. Le profil décrit un **dossier de facture en lecture** ; il ne définit ni dépôt de e-reporting, ni agrégation des transactions, ni déclaration de paiement. Les [spécifications DGFiP v3.2](https://www.impots.gouv.fr/specifications-externes-b2b) couvrent ces flux distincts. Un dossier autonome de données de paiement sans facture n’est pas représentable par `fe_get_invoice_case` 0.3.

`events[]` porte `reason_code` et `reason_label` nullable. Le code conserve le vocabulaire source avec un espace de noms, par exemple `pa:format_invalid`, `buyer:missing_order_reference` ou `commercial:price_dispute` ; ce sont des exemples, pas un enum ni une équivalence entre rejet de PA, refus de l’acheteur et litige commercial. Le libellé explique le motif dans la langue de réponse sans traduire les données rédigées par l’utilisateur.

Sur `fe_get_invoice_case`, `recipient_directory_status` (`found`, `not_found`, `ambiguous`) et `recipient_pdp`/`routing_id` nullable donnent une **observation en lecture** du routage quand elle existe. Ils valent `null` quand le serveur ne dispose pas de cette observation, notamment hors du domaine PA. `recipient_pdp` et `routing_id` sont des identifiants opaques ; `found` ne prouve ni livraison ni conformité. La référence n’interroge aucun annuaire réel.

## Correspondance indicative EN 16931

| FE-MCP               | Terme EN 16931                                     | Limite                                                   |
| -------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| `invoice.number`     | BT-1                                               | Numéro de facture                                        |
| `invoice.issue_date` | BT-2                                               | FE-MCP conserve un instant UTC ; EN 16931 porte une date |
| `invoice.due_date`   | BT-9                                               | Même distinction date / instant                          |
| `invoice.currency`   | BT-5                                               | Devise de facture                                        |
| `invoice.amount_due` | BT-115                                             | Montant dû, sans validation arithmétique par FE-MCP      |
| `invoice.seller_id`  | BT-29, BT-30 ou BT-31 selon la nature et le schéma | Aucune correspondance automatique garantie               |
| `invoice.buyer_id`   | BT-46, BT-47 ou BT-48 selon la nature et le schéma | Aucune correspondance automatique garantie               |

Table **non normative** basée sur le [modèle EN 16931 lié à UBL dans Peppol BIS Billing 3.0, édition mai 2026](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/). `siren`/`siret` peuvent représenter une identification légale ou commerciale selon le contexte et le profil de facture. `vat` pointe vers l’identifiant TVA uniquement s’il est effectivement celui de la partie. `duns`/`gln` nécessitent leur schéma d’identification propre dans le document cible. FE-MCP ne convertit pas les identifiants et ne valide pas une facture EN 16931.

## Pagination

`fe_find_invoices` accepte `query` vide, `limit` de 1 à 100 et un `cursor` opaque. Réutiliser le curseur avec le **même** `query` et `limit` doit rendre la même page tant qu'il est valide, sans doublon avec la page précédente. Le serveur peut fixer une durée de validité documentée ; un curseur illisible, modifié, expiré ou utilisé avec d'autres paramètres renvoie `invalid_input`. La référence propose trois dossiers synthétiques, des curseurs signés valables cinq minutes, invalidés au redémarrage.

## Appels

1. `fe_find_invoices(query, limit, cursor)` retourne des références de dossiers, leur domaine d'état et un curseur éventuel.
2. `fe_get_invoice_case(case_id)` retourne facture, dates, identifiants, faits, événements, preuves et révision. Chaque fait indique sa source et sa date d'observation.
3. `fe_check_invoice(case_id)` retourne des constats sourcés. Aucun diagnostic du modèle ne doit être présenté comme un fait d'un système ou comme un avis fiscal certain.
4. `fe_get_available_actions(case_id)` retourne les opérations permises _dans ce système_ au moment de l'appel. Cette liste ne garantit pas qu'elles seront encore permises lors de l'exécution.
5. `fe_prepare_action(case_id, type, note)` crée une proposition temporaire avec effet annoncé, révision attendue et expiration. Dans la référence 0.3, le seul `type` est `record_internal_note` dans l'ERP synthétique.
6. `fe_execute_action(proposal_id, approval_code, idempotency_key)` revérifie droits, expiration et révision, puis rend un reçu stable. Une répétition de la même proposition ne doit pas doubler l'effet. L'approbation de démonstration est un code local ; une intégration réelle doit employer son propre contrôle d'identité, de délégation et d'approbation côté serveur.

## États et droits

`refused_by_buyer`, `issued` et `not_booked` sont des états de systèmes **distincts** dans l'exemple. La note interne de référence ne change aucun statut réglementaire et ne modifie aucune facture émise. Les futures actions comme avoir, refus ou statut d'encaissement exigeraient des schémas, des habilitations et des tests métier propres ; elles ne sont pas implémentées ici.

Une implémentation réelle doit isoler les entreprises, authentifier l'utilisateur, vérifier sa délégation à **chaque** appel, limiter les données renvoyées et conserver un journal d'audit. Les annotations MCP décrivent une intention ; elles ne confèrent aucun droit. Le serveur de référence n'est destiné qu'à des données publiques synthétiques locales.

Le champ `approval_code` est **non autoritatif** : sa présence ne prouve aucune autorisation. Le serveur doit vérifier une approbation liée à l'acteur, au tenant, à la proposition, à son effet et à une courte durée de validité ; sinon l'exécution renvoie `write_disabled` ou `forbidden`. Le code statique de la démo n'est pas un modèle de sécurité de production.

## Compatibilité et conformité

Les noms d'outils et les champs de cette version sont stables dans le dépôt, sans prétendre à une norme officielle. Les éditeurs peuvent démarrer par les appels de lecture et déclarer les écritures indisponibles. Le banc `bin/check.js` teste la forme et un scénario de lecture via stdio ou HTTP Streamable ; il ne prouve ni conformité à XP Z12-012/013/014, ni sécurité de production.

`profile_version` est la version du **contrat sur le fil** ; le tag Git est la version d'une **publication du dépôt**. Ils évoluent séparément. Le profil 0.3.0 est incompatible avec 0.2.0 : `seller_id` et `buyer_id` deviennent des objets typés nullable et `events[]` ajoute les motifs nullable. Migrer les anciennes chaînes en `{ scheme, value }` après identification fiable du schéma, sinon `null`. La valeur de `profile_version` est imposée par `z.literal("0.3.0")` sur les six sorties ; voir [CHANGELOG.md](CHANGELOG.md).
