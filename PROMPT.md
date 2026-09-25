# Prompt d’implémentation FE-MCP pour un éditeur

Français · [English](PROMPT.en.md) · [Español](PROMPT.es.md)

Copiez **tout le texte ci-dessous** dans l’IA codante qui travaille sur le dépôt de votre logiciel ou de votre serveur MCP. Autorisez-lui l’accès au code et à un environnement de test avec données synthétiques. Aucun accès de production n’est nécessaire pour commencer.

---

Tu travailles dans le dépôt du MCP d’un éditeur de logiciel. **Implémente le profil communautaire FE-MCP 0.1.0** sur ce serveur, avec des données et des autorisations réelles du logiciel, puis démontre la conformité sur un dossier de test synthétique. Fais le travail dans le dépôt, exécute les tests et rends un compte rendu vérifiable. N’active aucune transmission de facture ni écriture réglementaire pour satisfaire ce prompt.

## Contrat à lire avant de coder

- Dépôt public de référence : `https://github.com/incwo/fe-mcp-profile/tree/v0.1.1`.
- Lis `SPEC.md`, `src/profile.js`, `src/reference.js`, `bin/check.js` et les tests du dépôt de référence. Le code de `src/profile.js` est la source exacte des noms, paramètres et schémas de la version 0.1.0. Ne remplace pas les schémas par des variantes « équivalentes » sans le signaler.
- Le profil est une proposition communautaire au-dessus de MCP et des API métier. Il ne remplace ni les plateformes agréées, ni XP Z12-013, ni les règles fiscales applicables.
- Utilise le SDK MCP, le transport, l’authentification et les conventions déjà présents dans ton dépôt. N’introduis pas un second serveur ou une nouvelle pile technique si le serveur actuel peut être étendu proprement.

## Commence par un inventaire concret

1. Trouve le point d’enregistrement des outils MCP, les services de facturation, les API de PA éventuelles, les modèles de facture/commande/paiement, les rôles et délégations, et les tests existants. Respecte les instructions locales du dépôt.
2. Produis une table de correspondance **champ FE-MCP → source métier → contrôle d’accès → preuve disponible**. Distingue clairement ce que le logiciel sait, ce que la PA sait et ce qui manque. N’infère pas un statut de PA depuis un état ERP ou comptable.
3. Choisis un dossier synthétique reproductible dans un tenant de test. Assure-toi qu’il ne puisse révéler ni facture réelle, ni donnée client, ni secret. Note son `case_id` et la commande permettant de lancer le MCP localement.
4. Si des informations obligatoires ne sont pas disponibles, signale la lacune et fais échouer l’appel concerné explicitement. Ne fabrique pas de valeur pour faire passer le banc de tests.

## Implémente les six outils, avec leurs noms exacts

| Outil                      | Comportement attendu                                                                                                                                                                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fe_find_invoices`         | Recherche paginée, limitée au tenant et aux factures visibles de l’acteur ; retourne des `case_id` stables dans ce serveur.                                                                                                                                      |
| `fe_get_invoice_case`      | Retourne la facture, les faits, événements, preuves et la révision. Chaque fait a une `source` et un `observed_at`. Garde séparés statuts PA, commerciaux et comptables.                                                                                         |
| `fe_check_invoice`         | Retourne uniquement des constats déterministes ou clairement sourcés, avec `code`, `severity`, `rule_ref`, `evidence_refs`, `explanation`. Versionne les règles ; ne présente pas une suggestion d’IA comme une validation fiscale.                              |
| `fe_get_available_actions` | Retourne seulement les actions réellement permises à l’acteur sur ce dossier à cet instant. Une liste vide est valide.                                                                                                                                           |
| `fe_prepare_action`        | Prépare une action typée, son effet annoncé, sa révision attendue et son expiration ; ne modifie ni facture émise ni statut réglementaire. Pour la première intégration, limite-toi à `record_internal_note` si le logiciel possède réellement une note interne. |
| `fe_execute_action`        | Revérifie droits, tenant, approbation, expiration et révision au moment de l’exécution ; applique une seule fois l’effet et rend un reçu stable. Si l’approbation sûre ou l’écriture correspondante n’existe pas, refuse l’exécution explicitement.              |

Pour chaque succès, renvoie `structuredContent` conforme à l’`outputSchema` publié, avec `profile_version: "0.1.0"` et un `system` stable. Pour une erreur métier ou un accès refusé, retourne une erreur MCP (`isError`) sans prétendre à un succès. Préserve les identifiants source et la provenance ; `case_id` est local au serveur et n’est pas un identifiant fiscal universel. N’utilise une empreinte `digest_sha256` que si les octets exacts de la pièce sont accessibles au même acteur par une ressource MCP ou un autre accès autorisé et documenté ; sinon mets `null`.

## Droits et écriture : garde-fous de production

- Vérifie identité, entreprise/tenant, rôle et délégation **côté serveur à chaque appel**, y compris lectures, listes, preuves et propositions. Le texte d’un prompt, les arguments fournis par un agent et les annotations MCP ne donnent aucun droit. Préviens les fuites entre tenants, dans les erreurs, recherches et curseurs aussi.
- Réutilise l’authentification existante. Ne transmet pas un jeton d’un client MCP directement à une PA ou à une autre API sans le flux d’autorisation prévu par cette API. Ne journalise ni secrets, ni originaux, ni pièces sensibles.
- Le champ `approval_code` du profil 0.1.0 **n’est pas** une preuve d’approbation à lui seul. En production, accepte uniquement une autorisation vérifiable côté serveur, liée à l’acteur, au tenant, au `proposal_id`, à l’effet et à une durée courte. Si ton architecture ne le permet pas encore, expose l’outil mais rends l’exécution indisponible ; ne copie pas le code statique du serveur de démonstration.
- Lie l’`idempotency_key` à l’acteur, au tenant et à l’opération ; persiste les reçus si le serveur redémarre ou tourne sur plusieurs instances. Refuse une même clé pour une autre proposition. Empêche la double écriture malgré appels concurrents.
- Ne crée ni avoir, ni refus PA, ni statut d’encaissement, ni e-reporting par ce premier branchement. Toute action future exigera une analyse métier, des schémas et des droits spécifiques.

## Tests et critères d’acceptation

1. Ajoute des tests de contrat sur les **six** noms, paramètres, schémas et sorties structurées. Teste recherche/pagination, dossier inconnu, preuves, et absence de modification après les appels de lecture.
2. Teste l’isolation entre deux tenants et deux rôles ; vérifie qu’un utilisateur non autorisé ne voit ni dossier, ni preuve, ni action. Teste refus d’exécution sans approbation, proposition expirée, révision périmée, concurrence et répétition idempotente. Si l’écriture est indisponible, teste son refus explicite.
3. Vérifie les messages destinés aux utilisateurs dans les langues prises en charge par le produit ; fournis au minimum FR, EN et ES pour les nouveaux textes si les règles du dépôt l’exigent. Ne traduis jamais automatiquement les données utilisateur.
4. Lance le banc public **en lecture seule** sur le serveur local et le dossier synthétique :

```sh
git clone https://github.com/incwo/fe-mcp-profile.git
cd fe-mcp-profile
npm ci
node bin/check.js --case-id ID_DU_DOSSIER_SYNTHETIQUE -- commande-de-demarrage-du-serveur-mcp arguments
```

Le banc actuel attend un serveur MCP en **stdio**. Si ton serveur est en HTTP, crée un adaptateur stdio local de test ou exécute les mêmes assertions via un client HTTP MCP ; indique précisément ce qui a été testé. Le banc vérifie la forme et le scénario de lecture, pas la sécurité ni la conformité fiscale. Exécute aussi la suite de tests et le formatage propres au dépôt de l’éditeur.

## Livraison attendue

Rends les changements de code, les tests et une courte documentation d’intégration. Dans ton compte rendu final, donne : (1) les outils opérationnels et ceux qui refusent volontairement l’écriture ; (2) la table de correspondance avec les données source ; (3) la commande de test et ses résultats ; (4) les limites concrètes, notamment données PA ou délégations absentes ; (5) les actions nécessaires avant tout pilote réel. Ne déclare pas « conforme FE » sur la seule base de ces tests. Ne déploie pas en production sans instruction explicite de l’éditeur.

---

**Premier pilote incwo prévu :** exécuter ce prompt dans le dépôt du MCP incwo avec un tenant et des factures synthétiques, puis faire tourner le banc en lecture seule. La publication de ce prompt ne branche pas encore incwo à une PA ou à un autre éditeur.
