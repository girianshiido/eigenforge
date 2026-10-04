# EIGENFORGE — Audit de la progression complète

Audit du 4 octobre 2026, sur la version locale comprenant le nouveau bonus permanent et la reconstruction rapide. Le contrôle porte sur les règles de l’économie, pas sur les clics et gestes dans un navigateur. Aucune correction d’équilibrage supplémentaire n’a été appliquée pendant cet audit.

## Verdict

Les 68 ateliers sont accessibles, mais la fin du parcours s’emballe lorsqu’on conserve le réseau au lieu de redémarrer. Le bonus d’invariants n’est pas la cause principale : le cumul multiplicatif des synergies de production l’est. La précision des compteurs d’invariants est également insuffisante à très grande échelle.

## Parties simulées

| Stratégie | Durée jusqu’au 68e atelier | Résultat |
| --- | ---: | --- |
| Plafond, jusqu’au dernier atelier | 16,03 h | 68 ateliers ; 67 changements de base |
| Plafond, 80 changements dont après le dernier atelier | 16,03 h | 68 ateliers ; 80 changements de base |
| Sans changement de base | 14,17 h | 68 ateliers ; 0 changements de base |
| Actif : 5 clics/s, résonance et maîtrise maximales | 7,09 h | 68 ateliers ; 0 changements de base |
| Passif : rares clics, aucune réponse aux anomalies | 25,78 h | 68 ateliers ; 67 changements de base |
| Redémarrage au plus tôt : 120 gains de 1 invariant | Non atteint | 5 ateliers ; 120 changements de base |
| Sans redémarrage, une seconde par achat | 14,18 h | 68 ateliers |

Ces durées sont des estimations de modèle, pas des durées chronométrées sur un téléphone. Les achats sont choisis automatiquement selon leur rendement et les réponses correctes sont moyennées à une toutes les 75 secondes. Le scénario actif est une borne favorable : cinq clics par seconde, résonance maximale, maîtrise maximale et une réponse correcte toutes les 65 secondes. Le scénario passif ne résout aucune anomalie. Les achats sont instantanés dans les scénarios économiques ; le contrôle distinct ajoute une seconde par achat.

Le simulateur emploie les fonctions réelles de coût, modules, maîtrises, production, synergies, invariants et reconstruction. La maîtrise et la résonance sont approximées par des bornes explicites ; les exercices ne sont pas résolus par un joueur humain. Les avantages hérités des principes nouvellement achetés après un redémarrage ne sont appliqués qu’au suivant, conformément au jeu.

## Emballement des derniers cycles

Sans redémarrer, en comptant une seconde par achat, le début du cycle 13 est atteint à 14,15 h et le dernier atelier à 14,18 h. Les cinq derniers cycles occupent donc environ **111 secondes**.

Les contrôles suivants désactivent uniquement une catégorie de bonus dans le simulateur ; ils ne modifient pas le jeu :

| Contrôle | Durée totale | Temps du début du cycle 13 au dernier atelier |
| --- | ---: | ---: |
| Contrôle sans remises des ateliers | 14,66 h | 5,9 min |
| Contrôle sans synergies de production | 51,41 h | 195,3 min |

La forte différence lorsque les synergies de production sont neutralisées identifie leur cumul comme la cause dominante. Les réduire à des bonus bornés ou à rendements décroissants, tout en conservant leur intérêt initial, est la correction prioritaire. Les remises de prix devraient aussi avoir un plancher : cinq ateliers réducteurs au niveau 100 donnent déjà environ 99,34 % de réduction cumulée ; au niveau 500, le multiplicateur tombe à environ 1,22 × 10⁻¹¹.

## Changements de base et précision numérique

Dans la stratégie au plafond, le dernier atelier apparaît après 67 changements de base, vers 16 heures simulées. Poursuivre jusqu’à 80 changements ne rend pas les reconstructions instantanées : les cinq dernières durées vont d’environ 11,04 à 10,93 minutes. Tous les montants et débits contrôlés restent finis.

En revanche, au **54e changement de base**, le total d’invariants dépasse la plage des entiers exactement représentables par JavaScript. À 2⁵³, ajouter 1 ne change plus le nombre stocké. Le plafond « n + 1 » et les dépenses de petits montants ne sont donc plus fiables à cette échelle. Il faut soit changer la représentation des invariants, soit revoir la courbe pour ne pas imposer de tels totaux avant la fin du programme.

Redémarrer dès qu’un seul invariant est disponible n’est pas une stratégie de progression : après 120 redémarrages, seulement cinq ateliers ont été construits. Le plafond est bien respecté, mais la reconstruction répétée empêche d’atteindre les ateliers coûteux. La prévisualisation doit encourager des gains plus importants plutôt qu’un changement systématique au premier point.

## Déroulement du scénario au plafond

| Cycle d’ateliers | Début du cycle, temps simulé cumulé |
| --- | ---: |
| 1 | 0,00 h |
| 2 | 0,59 h |
| 3 | 3,57 h |
| 4 | 4,43 h |
| 5 | 5,07 h |
| 6 | 6,04 h |
| 7 | 6,88 h |
| 8 | 7,73 h |
| 9 | 8,80 h |
| 10 | 9,64 h |
| 11 | 10,48 h |
| 12 | 11,32 h |
| 13 | 12,13 h |
| 14 | 12,94 h |
| 15 | 13,73 h |
| 16 | 14,70 h |
| 17 | 15,47 h |

## Affichage des grandes valeurs

Le formateur partagé conserve k, M, Md, B, Qa… et étend les suffixes jusqu’à 1e306. Exemples : 1e48 → QiDc ; 1e54 → SpDc ; 1e63 → Vg ; 1e303 → Ct. Il est utilisé pour les coordonnées, productions, prix et compteurs d’invariants. Les arrondis sont reportés vers l’unité suivante, et les petites quantités d’invariants restent entières.

Cette amélioration d’affichage ne corrige pas la précision du stockage des invariants.

## Reproduire

Le script `scripts/audit-progression.mjs` exécute neuf scénarios et affiche les résultats en JSON. `--scenario=7` ne lance que le contrôle avec une seconde par achat ; `--scenario=8` et `--scenario=9` isolent les remises puis les synergies de production. Les scénarios au plafond jusqu’à la fin peuvent demander une à deux minutes de calcul chacun.

Les tests économiques existants restent valides après l’amélioration des contrôles du simulateur. Les tests de format vérifient les 102 groupes de mille représentables, les arrondis et le maximum fini de JavaScript.
