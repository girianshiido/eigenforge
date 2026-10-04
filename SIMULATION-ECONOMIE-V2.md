# EIGENFORGE — Recalibration économique V2

4 octobre 2026. Résultats obtenus initialement sur un modèle isolé. La grille V2 est désormais intégrée au jeu local ; GitHub et le site publié restent inchangés. Voir [INTEGRATION-ECONOMIE-V2.md](INTEGRATION-ECONOMIE-V2.md) pour les règles jouables, la migration et les vérifications.

## Résultat

La nouvelle grille corrige le principal défaut de V1 : **les changements de base sont maintenant utiles sans remettre l’ancien doublement des invariants.**

Le profil régulier termine les 68 ateliers en **13,6 heures simulées**, contre 77,8 heures avec V1. Le novice termine en 16,0 heures et l’expert en 11,3 heures.

Après chacun de ses redémarrages, le profil régulier retrouve 80 % de son ancienne production passive en **0 à 6,1 minutes** ; médiane : 2,6 minutes. Une unité des ateliers connus étant désormais conservée, l’ancienne mesure « retrouver un exemplaire du dernier atelier » serait artificiellement nulle : elle est remplacée ici par une mesure de puissance réelle, sans compter le boost temporaire.

Les cinq derniers cycles demandent encore **4,0 heures**, et le dernier cycle 19,8 minutes après son entrée. La fin ne s’efface plus en quelques minutes.

**Ce modèle est un candidat à tester en jeu, pas une preuve de qualité ludique.** Il assume désormais une progression avec changements de base réguliers : sans eux, le parcours est beaucoup plus long (66,5 h). Cette conséquence doit être affichée clairement dans la future interface.

## 1. Changements apportés au modèle

### Héritage étendu, mais borné

- Un changement conserve une unité de chaque atelier effectivement construit dans la partie précédente, au lieu de conserver seulement le générateur axial.
- Les trois niveaux de Base héritée portent ce plafond à 2, 3 puis 5 unités par atelier.
- Le nombre conservé ne dépasse jamais ce qui était réellement possédé. Un atelier inédit reste à zéro ; aucun cycle nouveau n’est offert.
- Les modules et les maîtrises d’atelier sont toujours remis à zéro. Leur reconstruction paie les vrais prix.
- Les coordonnées disponibles et le total produit dans la partie repartent à zéro.
- Les niveaux de Reconstruction s’appliquent aux dix premières unités de tous les ateliers archivés, pas uniquement aux huit premiers. Ils ne réduisent pas le prix d’un atelier inédit.
- L’héritage utilise les principes possédés avant le redémarrage ; un principe acheté avec les nouveaux points s’applique au redémarrage suivant.

La recomposition du réseau reste donc un choix économique. Elle n’oblige plus à rejouer pendant plusieurs heures tout le chemin déjà appris.

### Nouvelle courbe de prix et de production

Les quatre fondations gardent leurs prix et productions. Pour C ≥ 2 :

- Référence nominale de chapitre : `260 000 × 80^(C−2)`, au lieu de conserver les anciennes références croissant d’environ ×375 par cycle.
- Prix internes : référence × 1 ; 2,8 ; 7,84 ; 21,952.
- Production du premier atelier : référence divisée par `1 000 × rythme(C)`. Les suivants produisent ×2,6 à chaque pas.
- `rythme(C) = 1 + 0,15 × min(3,C−2) + 1,2 × max(0,C−5)`.
- Aux cycles 4, 8, 12, 15 et 17, le premier atelier coûte ×2,8 : sa construction matérialise la marche d’entrée. Les trois suivants restent au tarif interne normal.
- Les prix de l’ensemble des cycles 15/16/17 sont respectivement multipliés par 1,2/1,35/1,6, sans hausse automatique de leur production.
- Prix des unités supplémentaires ×1,18 ; modules, maîtrises et synergies bornées conservés.

La dernière correction est ciblée : les premières grilles rendaient encore les achats du cycle 17 trop rapides. Tous les prix d’un cycle restent non décroissants. Aux grandes marches, les deux premiers ateliers peuvent avoir le même prix ; le second bénéficie d’une meilleure production.

### Invariants maîtrisés

La formule logarithmique, la pénalité de répétition ×2 et le plafond C+1 restent présents. La référence est maintenant le premier prix V2 du cycle, avec un minimum de **100 000** au lieu de 750 000.

Les premiers redémarrages du parcours régulier donnent 2, 3 et 4 points : **9 points au total sur les trois premiers cycles**. Le parcours de collection en gagne 27 sur ces cycles. Aucun principe tardif ne peut être acheté simplement parce que le portefeuille est plein.

Les principes conservent leurs effets modérés et leurs paliers pédagogiques. Seuls les conforts ont été rapprochés du parcours courant :

| Principe | Coûts V2 | Cycles d’accès |
| --- | --- | --- |
| Modules automatiques | 3, 7, 12 | 3, 7, 11 |
| Anciens ateliers automatiques | 6, 12 | 5, 9 |

Le catalogue entier coûte **245 points** : 205 pour les sept principes existants et 40 pour les deux automatisations. Les plans restent une configuration gratuite.

### Débits monétaires exacts dans le prototype

Le portefeuille V2 possède une partie entière en BigInt et un reste fractionnaire séparé. Chaque prix entier calculé par le modèle est soustrait exactement de cette partie entière, même si l’affichage arrondi du total ne change pas.

Les taux de production et les calculs des prix nominaux restent des approximations numériques. Il ne s’agit pas d’une promesse de calcul symbolique exact : le contrôle porte sur le débit du **prix calculé**, pas sur une précision infinie de la formule de prix.

Tous les scénarios V2 enregistrent zéro débit inefficace dans ce registre. Depuis l’intégration locale, le jeu sérialise lui aussi les coordonnées entières séparément des fractions ; les achats groupés additionnent et débitent individuellement les prix entiers calculés.

## 2. Comparaison complète des profils

Les heures sont des durées de présence simulée, attentes comprises, pas la durée d’exécution du script. Exception : la ligne hors connexion indique le temps calendaire, dont la présence réelle simulée est précisée ensuite.

| Profil / stratégie | V1 | V2 | Ateliers connus | Changements V2 | Invariants gagnés | Points dépensés |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Régulier, 70 %, un changement par cycle | 77,8 h | 13,6 h | 68/68 | 16 | 68 | 67/245 |
| Novice, 40 %, un changement par cycle | 90,5 h | 16,0 h | 68/68 | 16 | 68 | 67/245 |
| Expert, 95 %, un changement par cycle | 65,5 h | 11,3 h | 68/68 | 16 | 68 | 67/245 |
| Sans aucun changement de base | 32,4 h | 66,5 h | 68/68 | 0 | 0 | 0/245 |
| Quatre changements, aux cycles 4/8/12/16 | 50,0 h | 31,7 h | 68/68 | 4 | 16 | 16/245 |
| Choix au hasard, 25 % | 93,4 h | 16,5 h | 68/68 | 16 | 68 | 67/245 |
| Sans réponses aux exercices | 16,5 h | 5,5 h | 12/68 | 0 | 0 | 0/245 |
| Redémarrage au premier point disponible | 168,0 h | 19,1 h | 68/68 | 108 | 108 | 104/245 |
| Collection des principes, jusqu’à trois changements par cycle | 159,7 h | 13,4 h | 68/68 | 48 | 258 | 245/245 |
| Automatisations désactivées | 77,7 h | 13,6 h | 68/68 | 16 | 68 | 67/245 |
| Principes clic/exercices prioritaires | 82,9 h | 15,7 h | 68/68 | 16 | 69 | 69/245 |
| Une heure présente / onze heures absente | 721,0 h | 120,7 h | 68/68 | 16 | 77 | 77/245 |

Le passif atteint les douze premiers ateliers, puis attend les validations de la frontière C4. « 5,5 h » n’est donc pas une durée d’achèvement.

Le scénario au premier point termine cette fois en 19,1 h, avec 108 redémarrages et 108 points : il est moins efficace que les parcours réguliers, mais il ne crée plus un piège interminable ni une explosion de points.

Le parcours de collection vise au maximum trois redémarrages par frontière, jusqu’à financer le catalogue. Les volumes visés donnent deux à six points, multipliés par la pénalité des répétitions. Il termine avec 48 changements : la collection étant financée avant la dernière frontière, des redémarrages supplémentaires au cycle 17 seraient inutiles.

Trois graines différentes donnent 13,56 h, 13,50 h, 13,36 h pour le profil régulier. Le résultat ne dépend pas d’un unique tirage favorable.

Le retour hors connexion termine après 5,0 jours calendaires, avec 10,7 heures de présence. Chaque absence de onze heures ne rémunère que deux heures de production ; elle n’accorde ni réponses ni validations.

## 3. Lisibilité du rythme

Profil régulier, premier achat historique de chaque atelier, valeurs en minutes :

| Cycle | Entrée cumulée | Marche depuis le dernier atelier précédent | Du premier au quatrième atelier | Moyenne entre achats internes |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1,3 | — | 18,4 | 6,1 |
| 2 | 35,1 | 15,5 | 29,4 | 9,8 |
| 3 | 77,5 | 13,0 | 27,2 | 9,1 |
| 4 | 127,2 | 22,4 | 18,3 | 6,1 |
| 5 | 157,5 | 12,1 | 21,1 | 7,0 |
| 6 | 187,7 | 9,1 | 26,8 | 8,9 |
| 7 | 227,6 | 13,0 | 30,5 | 10,2 |
| 8 | 283,0 | 24,9 | 31,1 | 10,4 |
| 9 | 331,1 | 17,0 | 36,6 | 12,2 |
| 10 | 388,0 | 20,2 | 40,5 | 13,5 |
| 11 | 448,4 | 19,9 | 44,0 | 14,7 |
| 12 | 525,0 | 32,6 | 29,7 | 9,9 |
| 13 | 574,6 | 19,8 | 39,0 | 13,0 |
| 14 | 631,3 | 17,7 | 41,7 | 13,9 |
| 15 | 704,3 | 31,3 | 24,1 | 8,0 |
| 16 | 746,3 | 17,9 | 28,1 | 9,4 |
| 17 | 794,0 | 19,7 | 19,8 | 6,6 |

Les marches incluent le changement de base, la reconstruction, les achats et les éventuelles validations. Aucune attente minimale n’est ajoutée par une minuterie.

Les quatre fondations sont découvertes en 19,6 minutes. Les marches ordinaires du parcours régulier se situent approximativement entre 9 et 20 minutes. Les marches C8, C12 et C15 demandent environ 25, 33 et 31 minutes ; C4 et C17 restent moins lourdes, environ 22 et 20 minutes.

À l’intérieur d’un cycle, les trois intervalles d’achat donnent des moyennes d’environ 6 à 15 minutes par nouvel atelier. Le milieu euclidien reste un peu plus lent que la cible initiale de 5–12 minutes : c’est un point à vérifier manuellement, pas une cible déclarée atteinte partout.

## 4. Financement des principes

Le parcours courant finit avec 68 points gagnés, 67 dépensés et les niveaux :

`3, 3, 2, 2, 3, 3, 3, 1, 1`

Ordre : Homogénéité, Somme directe, Gauss, Résonance, Image fidèle, Base héritée, Reconstruction, Modules automatiques, Anciens ateliers automatiques.

Contrairement à V1, ce joueur finance un premier niveau de chacune des deux automatisations. Le modèle exécute 1 943 achats automatiques : leur intérêt est le confort, pas un bonus gratuit de production.

Le parcours de collection finance les 245 points sans insister pendant 160 heures. Les derniers achats de chaque principe arrivent ainsi :

| Principe terminé | Cycle | Temps cumulé |
| --- | ---: | ---: |
| Homogénéité | 14 | 11,6 h |
| Somme directe | 14 | 10,9 h |
| Gauss | 16 | 12,9 h |
| Résonance | 15 | 12,3 h |
| Image fidèle | 14 | 11,3 h |
| Base héritée | 9 | 6,5 h |
| Reconstruction | 13 | 10,1 h |
| Modules automatiques | 11 | 9,0 h |
| Anciens ateliers automatiques | 9 | 6,5 h |

Tout le catalogue est donc financé au cycle 16, après environ 12,9 heures ; le parcours s’achève au dernier atelier du cycle 17. On ne peut pas tout acheter au cycle 3.

Le parcours de collection, bien équipé, est presque aussi rapide que le parcours courant (13,4 / 13,6 h), malgré davantage de redémarrages. Cela rend ces choix utiles, sans une accélération exponentielle. Il faudra vérifier que l’expérience de recomposition répétée reste agréable avec un vrai joueur.

## 5. Exercices et stratégie

Les règles de séries et de validations ne changent pas : trois bonnes réponses consécutives peuvent déclencher ×2 pendant 60 secondes, sans empilement ; trois tâches distinctes déjà accessibles valident les frontières sélectionnées. Une erreur rapporte zéro coordonnée mais ne retire aucune ressource ni maîtrise.

Le choix au hasard à 25 % reste capable de passer trois validations non consécutives à long terme. Il finit en 16,5 heures, contre 13,6 pour le régulier. Ce modèle ne prétend pas empêcher la devinette : il mesure son rendement économique. Le passif, lui, ne franchit pas C4.

L’orientation des principes vers le clic et les exercices donne 15,7 heures, contre 13,6 pour l’ordre privilégiant héritage et production. Plusieurs choix restent possibles, mais l’héritage est volontairement important dans ce parcours de recompositions.

Désactiver les automatisations change peu le temps avec les achats manuels optimisés à une seconde. Ce résultat ne mesure pas le nombre de gestes fatigants sur téléphone ; les futurs essais devront mesurer ce confort.

## 6. Calibration : variantes conservées

Chaque grille a été comparée avec et sans redémarrage, sans changer les profils pour favoriser la nouvelle version.

| Grille | Un changement par cycle | Aucun changement | Intérieur du dernier cycle |
| --- | ---: | ---: | ---: |
| A | 11,8 h | 36,5 h | 8,9 min |
| B | 16,1 h | 64,4 h | 11,9 min |
| C | 18,2 h | 74,5 h | 15,1 min |
| D | 21,5 h | 94,0 h | 16,6 min |
| E | 13,2 h | 60,5 h | 12,8 min |
| F | 12,8 h | 54,6 h | 15,1 min |
| G, retenue | 13,6 h | 66,5 h | 19,8 min |

A donnait une fin trop rapide. B/C/D ralentissaient trop le départ. E/F rendaient les premiers chapitres plus accessibles, mais le dernier cycle restait court. G conserve le départ d’E et renforce uniquement les trois derniers chapitres.

Le parcours sans redémarrage est plus lent en G qu’en V1 : **66,5 h contre 32,4 h**. C’est la contrepartie explicite d’un parcours désormais construit autour de recompositions régulières, pas un résultat à dissimuler. Si l’on veut qu’un joueur sans recomposition termine en 20–30 heures, cette grille doit encore être modifiée.

## 7. Vérifications et prochaine étape

- 14 scénarios complets pour G, avec trois graines du profil régulier.
- Aucun débordement numérique ; aucun invariant hors plafond C+1 ; aucune dépense de points supérieure au portefeuille.
- Zéro débit inefficace dans le registre entier V2.
- Archivage limité aux unités réellement possédées ; aucun atelier futur offert ; modules et maîtrises remis à zéro.
- Principes verrouillés par leurs cycles d’accès ; coûts des automatismes réellement débités.
- Boost sans cumul, indépendance des récompenses, absence de réponses/achats pendant les absences.
- La V1 reste reproductible contre son fichier de résultats initial : une régression vérifie ce témoin.
- **86 tests réussis**, aucun échec ; analyse des scripts et vérification des différences sans erreur.

Fichiers de reproduction :

- `scripts/economy-candidate-v2.mjs` : grille G et paramètres des autres variantes.
- `scripts/simulate-candidate-economy.mjs --version=v2` : les 14 scénarios.
- `scripts/calibrate-candidate-economy.mjs` : variantes A à G ; sélection possible avec `--candidate=G`.
- `SIMULATION-ECONOMIE-V2.json` : résultats numériques complets et grille retenue.
- `tests/candidate-recalibration.test.mjs` : invariants, archivage, portefeuille entier et régression V1/V2.

**Mise à jour après intégration locale :** les règles, le portefeuille entier, la migration et les indications d’interface sont installés localement. Les achats et les séries ont été vérifiés dans le navigateur, ainsi que le rendu à 390 px. Les durées ci-dessus restent des estimations de stratégie simulée, pas des chronométrages de joueurs humains ou un essai sur un iPhone physique. Aucune publication n’a été effectuée.
