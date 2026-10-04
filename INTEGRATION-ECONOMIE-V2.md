# Économie V2 — intégration dans le jeu

La grille retenue après simulation est désormais utilisée par la page du jeu et incluse dans la version préparée pour publication sur GitHub Pages.

## Règles installées

- Nouvelles références de prix et de production pour les 17 cycles ; les quatre fondations gardent leurs tarifs.
- Synergies de production bornées ; remise d’ateliers au minimum ×0,5 et remise permanente au minimum ×0,7.
- Gains des changements de base rapportés au cycle le plus avancé, avec plafond numéro du cycle + 1. Chaque répétition à la même frontière double les seuils ; une première construction dans un nouveau cycle remet cette pénalité à zéro.
- Bonus permanent `1 + 0,2√n`, calculé sur les points gagnés au total, non sur le solde dépensable.
- Héritage d’une unité par atelier effectivement possédé ; Base héritée porte le plafond à 2, 3 puis 5, sans offrir d’unité jamais construite. Modules et maîtrises d’ateliers sont réinitialisés.
- Reconstruction réduit le prix des dix premières unités des ateliers archivés, pas celui des ateliers inédits.
- Principes permanents à coûts explicites et niveaux ouverts progressivement. Catalogue complet : 245 points, dont deux automatisations.
- Les achats automatiques restent payants, peuvent être désactivés, ne prennent pas plus de 10 % du portefeuille par achat et laissent une réserve de 20 % du coût du prochain atelier déjà accessible. Un achat maximum par seconde ; pas d’exécution lorsque la page est masquée ni pendant le calcul des gains hors connexion.
- Une bonne réponse rapporte au minimum 24 coordonnées, sinon 12 secondes de production de base, avec bonus borné. Une erreur rapporte zéro sans retirer de ressources.
- Trois bonnes réponses consécutives déclenchent ×2 sur la production passive pendant 60 secondes ; pas de cumul ni de prolongation pendant le boost. La série et le boost ne sont pas conservés à la réouverture.
- Les entrées des cycles 4, 8, 12, 15 et 17 demandent trois types distincts de questions réussis dans le cycle précédent. Les questions proposées à cette frontière concernent uniquement des ateliers déjà construits. Les validations sont persistantes et ne sont pas annulées par une erreur ou un changement de base.
- Gains hors connexion limités à deux heures, sans boost temporaire ni achat automatique.

## Portefeuille et anciennes sauvegardes

Les coordonnées entières sont sauvegardées comme une chaîne décimale et calculées avec des entiers de taille arbitraire pour les débits. Les fractions de coordonnées sont conservées séparément. L’affichage reste compact ; les taux de production et les prix nominaux restent des approximations numériques, mais un petit achat ne devient plus gratuit devant un très grand solde.

La sauvegarde active utilise `eigenforge-v3`. La première ouverture migre `eigenforge-v2` sans supprimer cette ancienne copie. Les coordonnées, ateliers, connaissances et points gagnés sont conservés. Les niveaux de principes dépassant le nouveau catalogue sont remboursés à leur ancien prix en points ; ils ne sont pas remboursés à nouveau lors des ouvertures suivantes. Un atelier déjà atteint n’est pas rétroactivement verrouillé par une nouvelle validation pédagogique.

Les points et soldes excessifs déjà obtenus dans l’ancienne économie ne sont pas confisqués. Une ancienne partie migrée ne constitue donc pas une mesure fiable du rythme d’une nouvelle partie. Le bouton d’effacement reste un choix explicite, avec confirmation, et efface aussi les anciennes clés pour éviter leur réimportation.

## Vérifications

Les tests de l’intégration comparent les 68 tarifs, productions, coûts et seuils permanents au modèle retenu. Ils couvrent également le débit d’achats groupés à très grands soldes, la sérialisation, le remboursement de migration, l’héritage, les frontières pédagogiques, les séries et les automatisations.

Une partie de test distincte a été ouverte sur `127.0.0.1`, séparément de la partie existante sur `localhost`. Le premier achat a bien réduit le solde et démarré la production. Les bonnes réponses ont accordé le gain annoncé et fait avancer la série. La prévisualisation du changement de base a été inspectée sans redémarrer la partie existante. À 390 px de large, les nouvelles indications et les compteurs sont lisibles, sans débordement horizontal.

Le boost a également été observé dans le navigateur après la troisième bonne réponse : production doublée, puis retour à la production normale après expiration. La prévisualisation indique désormais aussi la production de départ réelle, distincte du bonus permanent à ateliers identiques.

Validation de la version à publier : **99 tests réussis**, compilations du jeu et de la version statique réussies, contrôle des fichiers modifiés sans erreur de lint ni de différences. Le contrôle TypeScript global signale encore trois erreurs préexistantes de types Cloudflare dans `db/index.ts` et `worker/index.ts` ; il n’est donc pas annoncé comme validé. Ces erreurs ne concernent pas les nouveaux fichiers économiques ni la compilation statique testée.

Les résultats de parcours restent ceux de [la simulation V2](SIMULATION-ECONOMIE-V2.md) : environ 13,6 h pour la stratégie régulière avec changements de base, contre 66,5 h sans changement. Ce sont des estimations sous hypothèses de cadence, réussite et stratégie d’achat ; elles ne prouvent pas encore le ressenti d’une partie humaine complète ni le comportement tactile d’un iPhone réel.

Les règles antérieures restent dans `app/game-balance.ts` pour reproduire les audits historiques. Le jeu utilise `app/game-economy.ts`, `app/economy-state.ts` et `app/save-state.ts` ; les tests vérifient leur concordance avec le modèle V2.
