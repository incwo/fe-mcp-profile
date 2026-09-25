# FE-MCP Profile

**Proposition communautaire pour rendre les dossiers de facturation électronique accessibles aux agents, quel que soit l'éditeur.** Un petit vocabulaire d'outils MCP, un serveur de référence à données synthétiques et un banc de conformité exécutable.

Français · [English](README.en.md) · [Español](README.es.md)

> Version exploratoire 0.1. Ce projet n'est ni une norme AFNOR, ni une plateforme agréée, ni une certification de conformité fiscale. Aucun service réel n'est connecté.

## Pourquoi

Les formats de facture et les échanges avec les plateformes agréées disposent déjà de standards. Le travail quotidien reste dispersé : une PA connaît un refus, l'ERP connaît la commande et le cabinet connaît la comptabilisation. FE-MCP propose six appels métier communs, avec des faits sourcés et des actions explicites. Un client MCP autorisé peut connecter séparément les serveurs de ces logiciels et rapprocher leurs réponses. Il n'y a pas de communication automatique de serveur à serveur.

## Essayer en deux minutes

Node.js 22+ :

```sh
npm ci
npm run demo
npm run check
npm test
```

La démo lance trois vrais serveurs MCP locaux (`pa`, `erp`, `accounting`) sur **données entièrement synthétiques**. Elle montre un refus de facture, une référence de commande retrouvée dans l'ERP et l'absence d'écriture comptable. Elle n'émet aucune facture et ne contacte aucun tiers.

Changer la langue : `node bin/demo.js --lang en` ou `--lang es`. Sortie JSON : `node bin/demo.js --json`. Lancer un serveur séparément : `node bin/server.js --system pa --lang fr` (transport stdio MCP ; sortie destinée à un client MCP).

## Les six outils

| Outil                      | Sens                                                                           |
| -------------------------- | ------------------------------------------------------------------------------ |
| `fe_find_invoices`         | Rechercher des dossiers et obtenir leurs identifiants stables                  |
| `fe_get_invoice_case`      | Lire facture, faits, événements, preuves et provenance                         |
| `fe_check_invoice`         | Obtenir des constats avec règle et preuves                                     |
| `fe_get_available_actions` | Voir les actions autorisées dans ce système                                    |
| `fe_prepare_action`        | Préparer une action sans modifier la facture                                   |
| `fe_execute_action`        | Exécuter une préparation sous contrôle des droits, de version et d'idempotence |

Le serveur de référence n'autorise qu'une **note interne ERP** comme écriture. Elle est désactivée par défaut et porte uniquement sur les données synthétiques. Les outils de lecture, la ressource de preuve et la vérification de son SHA-256 fonctionnent sans configuration. Voir le [profil détaillé](SPEC.md).

## Vérifier un autre serveur

Le banc teste les six outils déclarés, leurs schémas, quatre appels de lecture, la stabilité de la révision et la réponse à un dossier inconnu. Il vérifie aussi les empreintes des ressources `fe-demo://` lorsqu'elles existent. Il n'appelle jamais les outils d'écriture.

```sh
node bin/check.js --case-id FR-2026-0042 -- node /chemin/vers/serveur.js
```

Un adaptateur réel doit fournir son propre dossier de test, remplacer l'identifiant après `--case-id`, authentifier chaque acteur et respecter les droits de chaque entreprise. Le banc actuel est un point de départ d'interopérabilité, pas un audit réglementaire ou de sécurité.

## Position dans l'écosystème

FE-MCP se place **au-dessus** des API métier et de la norme XP Z12-013. Les plateformes agréées conservent leur rôle légal de transmission et de réception ; les statuts PA, commerciaux et comptables restent distincts. Ce dépôt ne remplace pas le serveur existant [mcp-facture-electronique-fr](https://github.com/cmendezs/mcp-facture-electronique-fr), qui expose notamment des interfaces de PA. L'étape suivante visée est un pilote « dossier d'exception » avec deux éditeurs et un cabinet ; l'intégration incwo viendra après validation du profil.

Sources : [DGFiP — plateformes agréées](https://www.impots.gouv.fr/facturation-electronique-et-plateformes-agreees), [DGFiP — spécifications externes](https://www.impots.gouv.fr/specifications-externes-b2b), [architecture MCP](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture).

MIT · [Contribuer](CONTRIBUTING.md) · [Sécurité](SECURITY.md)
