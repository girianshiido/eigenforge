# EIGENFORGE — Audit économique et proposition de refonte

**Note de suivi :** cet audit conserve les observations de l’ancienne économie. La nouvelle grille V2 est maintenant intégrée localement, sans publication : voir [INTEGRATION-ECONOMIE-V2.md](INTEGRATION-ECONOMIE-V2.md). Les passages « jeu actuel » ci-dessous se rapportent à l’état audité avant cette intégration.

4 octobre 2026. Référence : version publiée `a8575fd`, 68 ateliers et 17 cycles pédagogiques.

## Conclusion

L’économie ne tient pas sur l’ensemble du parcours. Deux problèmes distincts se superposent :

1. **Les changements de base permettent de terminer les principes permanents dès le cycle 3.** La simulation reproduit exactement le symptôme signalé par le joueur.
2. **La progression des ateliers est longue au début puis s’effondre à la fin.** L’accumulation de bonus multiplicatifs et les remises sans plancher suppriment les difficultés tardives.

Augmenter seulement les prix des principes ou des derniers ateliers ne résoudrait pas ces problèmes. Il faut modifier ensemble la création des invariants, les synergies, les paliers entre cycles et le rôle des exercices.

**Statut : pas de nouvelle économie installée.** Les scénarios de cet audit mesurent le jeu actuel. La proposition a ensuite fait l’objet de 14 simulations événementielles complètes, décrites dans `SIMULATION-ECONOMIE.md` : elle borne les invariants, mais coûte environ 77,8 h avec un redémarrage par cycle contre 32,4 h sans redémarrer. Elle n’est donc pas prête à être intégrée. Les seules modifications jouables restent les corrections d’exercices décrites en section 9.

**Mise à jour — V2 :** une seconde grille, avec héritage borné des ateliers connus et nouvelles frontières, est documentée dans [SIMULATION-ECONOMIE-V2.md](SIMULATION-ECONOMIE-V2.md). Le profil régulier atteint les 68 ateliers en 13,6 h simulées, retrouve 80 % de son ancienne production en au plus 6,1 minutes après un changement de base et gagne neuf invariants au total lors de ses trois premiers redémarrages. Le parcours sans redémarrage reste long (66,5 h). Ces nouveaux essais demeurent isolés du jeu ; les chiffres et propositions ci-dessous constituent l’audit initial, pas la grille V2.

## 1. Bien distinguer les trois progressions

- **Cycle pédagogique** : un chapitre de quatre ateliers. Il y en a 17.
- **Partie entre deux changements de base** : reconstruction du réseau, puis éventuel redémarrage. Il n’y a pas de limite actuelle au nombre de ces parties.
- **Base de l’espace représenté** : les quatre premiers ateliers ajoutent e₁, e₂, e₃, e₄. Leurs exemplaires supplémentaires et les ateliers suivants n’ajoutent pas de nouveaux vecteurs à cette base.

Un changement de base ne donne donc pas « un cycle de cours ». Il reconstruit le réseau et attribue des invariants. L’interface doit garder ces termes distincts.

## 2. Méthode et limites

Le simulateur utilise les vraies fonctions de production, coûts d’unités, modules, maîtrises, synergies, principes et redémarrage. Les achats sont sélectionnés automatiquement selon leur rendement, avec une seconde par achat dans cet audit.

Les questions sont moyennées à une toutes les 75 secondes. La maîtrise pédagogique et la résonance ne sont pas intégrées dynamiquement : les scénarios normaux les fixent à zéro/base ; le scénario expert impose leur maximum dès le départ, cinq clics par seconde et une question toutes les 65 secondes. C’est une borne favorable, pas une vraie partie de débutant.

La simulation ne reproduit ni le temps de réflexion, ni les erreurs humaines corrélées, ni une session Safari/iPhone. Les durées sont des estimations économiques, pas des chronométrages de jeu. La progression hors connexion est examinée dans les règles, pas simulée en sessions séparées.

Le simulateur achète les principes après le redémarrage. Un principe d’héritage nouvellement acheté s’applique au redémarrage suivant, comme dans le jeu.

## 3. Résultats mesurés

| Façon de jouer | Jusqu’au 68e atelier | Du début du cycle 13 au dernier atelier |
| --- | ---: | ---: |
| Sans redémarrer, toutes les réponses justes | 14,18 h | 1,84 min |
| Sans redémarrer, aucune question, rares clics | 20,41 h | 4,23 min |
| Sans redémarrer, réponses à 25 % de réussite | 17,34 h | 2,99 min |
| Borne expert, maîtrise et résonance maximales | 7,10 h | 1,22 min |
| Contrôle : suppression des remises entre ateliers | 14,66 h | 5,80 min |
| Contrôle : suppression des synergies de production | 51,41 h | 195,47 min |

Les contrôles ne changent que le simulateur, pas le jeu. Ils isolent la cause dominante : les synergies de production. Leur suppression totale rendrait en revanche le parcours beaucoup trop long ; il faut les borner, pas les supprimer.

### Profil des 17 cycles, sans redémarrage

« Entrée » mesure l’intervalle entre le premier achat du quatrième atelier précédent et celui du premier atelier nouveau. Elle inclut achats et accumulation, pas seulement attente passive. « Interne » mesure l’intervalle entre le premier et le quatrième atelier du même cycle.

| Cycle | Marche d’entrée | Progression interne |
| --- | ---: | ---: |
| 1 | — | 24,69 min |
| 2 | 20,08 min | 112,53 min |
| 3 | 40,18 min | 142,84 min |
| 4 | 49,44 min | 135,42 min |
| 5 | 38,33 min | 89,25 min |
| 6 | 19,71 min | 49,82 min |
| 7 | 14,41 min | 33,75 min |
| 8 | 9,33 min | 25,64 min |
| 9 | 5,50 min | 15,63 min |
| 10 | 4,92 min | 10,25 min |
| 11 | 1,64 min | 3,10 min |
| 12 | 0,48 min | 1,39 min |
| 13 | 0,44 min | 0,73 min |
| 14 | 0,15 min | 0,33 min |
| 15 | 0,08 min | 0,25 min |
| 16 | 0,08 min | 0,12 min |
| 17 | 0,03 min | 0,07 min |

Le rythme est inversé par rapport à l’objectif : certains premiers cycles s’étirent pendant plusieurs heures alors que les derniers ne laissent plus le temps de jouer leurs exercices.

## 4. Changements de base : pourquoi 44, puis 88 points sont possibles

Les règles actuelles sont :

`gain = min(floor(sqrt(coordonnées produites dans cette partie / 750 000)), invariants gagnés depuis le début + 1)`.

Les invariants dépensés restent dans le total historique. Dépenser n’abaisse donc pas le plafond suivant. Au plafond, les gains peuvent suivre 1, 2, 4, 8, 16, 32, 64, 128, 256…

- 44 points correspondent à au moins 1,452 milliard de coordonnées produites dans une partie, avec au moins 43 invariants historiques.
- 88 points correspondent à au moins 5,808 milliards, avec au moins 87 invariants historiques.
- Ces conditions ne tiennent pas compte du cycle pédagogique. Ce n’est pas un bug de compteur, mais un défaut de règle.

La capture suivante du joueur affiche 178 invariants disponibles, un gain proposé de 97 et un plafond de 352. Ce plafond correspond à 351 invariants historiques : le solde disponible n’est pas la référence. Elle confirme le même emballement sans nécessiter de lecture ni de modification de la sauvegarde.

La croissance exponentielle des prix et productions de chaque nouvel atelier fournit ces milliards de plus en plus facilement. Un plafond lié au portefeuille historique finit donc par suivre l’accélération au lieu de la maîtriser.

### Simulation des redémarrages au plafond

| Redémarrage | Points reçus | Total historique | Durée de la partie | Cycle le plus haut construit |
| --- | ---: | ---: | ---: | ---: |
| 1 | 1 | 1 | 42,77 min | 2 |
| 2 | 2 | 3 | 50,89 min | 2 |
| 3 | 4 | 7 | 49,16 min | 2 |
| 4 | 8 | 15 | 43,16 min | 2 |
| 5 | 16 | 31 | 28,41 min | 3 |
| 6 | 32 | 63 | 16,09 min | 3 |
| 7 | 64 | 127 | 12,07 min | 3 |
| 8 | 128 | 255 | 8,91 min | 3 |
| 9 | 256 | 511 | 7,35 min | 3 |

**Tous les principes sont terminés au neuvième redémarrage, au cycle 3, après 4 h 19 environ.** La partie reste ensuite intéressante par les ateliers/questions, mais le portefeuille permanent a presque perdu toute raison d’être.

À l’autre extrême, 120 redémarrages au premier point donnent seulement cinq ateliers construits après 8,64 h : recommencer systématiquement trop tôt piège le joueur. Il faut montrer ce compromis clairement, pas simplement annoncer « plafond atteint, changez de base ».

### Proposition de nouveaux invariants

Définir C comme le plus haut cycle effectivement construit au cours de l’historique, et r comme le nombre de redémarrages récompensés depuis l’ouverture de cette frontière.

`référence(C) = max(750 000, prix nominal du premier atelier du cycle C)`

`gain = min(C + 1, floor(log₂(1 + production de la partie / (référence(C) × 2ʳ))))`

L’ouverture d’un nouveau cycle remet r à zéro. Un changement sans gain n’est pas proposé. Les points dépensés ne changent pas la référence. Cette règle remplace explicitement l’ancien plafond « total historique + 1 ».

| Cycle atteint | Plafond par redémarrage |
| --- | ---: |
| 1 | 2 points |
| 3 | 4 points |
| 8 | 9 points |
| 12 | 13 points |
| 17 | 18 points |

Avec le volume qui donne actuellement 44 points au cycle 3, la formule candidate donne **3 points** ; avec celui donnant 88, elle donne **4 points**. Répéter le premier volume sans ouvrir de nouveau cycle donne 3, 3, 2, 1, puis 0 points : la reconstruction doit mener à une nouvelle frontière, pas à une ferme exponentielle d’invariants.

Le nombre de changements de base n’est pas artificiellement limité. Leur rendement diminue si l’on reste au même endroit. La force de cette diminution, ici 2ʳ, doit encore être comparée à une variante plus douce : ne pas rendre le prochain achat permanent impossible après une mauvaise décision.

Cible : un à trois changements de base utiles par cycle, et non un redémarrage à chaque petit point disponible. Ce n’est pas un quota ni une obligation : un joueur peut poursuivre sans redémarrer ou se reconstruire davantage, avec un rendement moins favorable à frontière inchangée.

Bonus permanent candidat : `1 + 0,2 × sqrt(total historique d’invariants)`. Les principes d’héritage, de reconstruction et d’automatisation rendent un redémarrage utile autrement que par ce seul multiplicateur.

Les tests valident les plafonds et exemples arithmétiques, **pas encore le rythme complet de cette formule en jeu**. Le changement de C exige une interface montrant l’objectif et le rendement du prochain redémarrage.

## 5. Gains, achats et synergies

### Causes actuelles

- Après les quatre fondations, prix ×4,4 et production ×4,28 à chaque atelier. Les frontières de chapitre n’ont pas de tarif spécifique.
- Chaque unité d’un atelier coûte 18 % de plus que la précédente. Ce mécanisme local est sain et peut rester.
- Les cinq modules donnent un multiplicateur total ×20. Ils constituent de bons objectifs intermédiaires, mais leur effet se multiplie ensuite avec tous les bonus globaux.
- Sept synergies globales de la forme `1 + 0,02 × niveau` se multiplient entre elles, en plus des synergies régionales.
- Cinq ateliers réducteurs donnent ensemble `0,99^(somme des niveaux)` sur les prix, modules et maîtrises : aucun plancher.

| Niveau uniforme des 68 ateliers, sans modules | Bonus de synergie total sur la production brute | Facteur de prix des ateliers réducteurs |
| --- | ---: | ---: |
| 10 | ×5,02 | ×0,605 |
| 100 | ×10 935 | ×0,00657 |
| 500 | ×409 230 591 | ×0,0000000000122 |

Ces configurations uniformes sont des tests de stress, pas le nombre d’unités possédées par un joueur normal. Elles montrent l’absence de borne.

### Refonte candidate

1. Garder chaque atelier utile, mais rendre ses synergies asymptotiques. Exemple global : `1 + 0,25 × niveau/(niveau+25)` ; un atelier donne au maximum +25 %. Sept de ces facteurs donnent moins de ×4,77, au lieu d’un produit sans borne. Les synergies régionales restent distinctes et bornées également.
2. Plancher à 50 % pour les remises entre ateliers ; plancher à 70 % pour les remises permanentes. Leur cumul ne passe pas sous 35 % du prix nominal. La reconstruction à prix réduit reste un avantage ciblé sur quelques premiers exemplaires, pas une remise universelle.
3. Garder les cinq modules et les maîtrises d’atelier. Ajuster leurs prix après mesure des nouvelles synergies ; ne pas multiplier tous les coûts indistinctement.
4. Distinguer la frontière d’un cycle de ses achats internes : références tarifaires internes candidates 1 ; 2,8 ; 7,84 ; 21,95, plutôt que 1 ; 4,4 ; 19,36 ; 85,18. Les productions internes candidates suivent ×2,6. Les références du premier atelier restent séparément calibrables.
5. Ne jamais imposer une attente minimale artificielle par minuterie. La marche doit provenir du coût, des améliorations à choisir et, à certains endroits, d’un objectif pédagogique explicite.

Le prototype tarifaire garde pour l’instant les premiers prix de chaque cycle. Cela crée une marche suivante d’environ ×17 sur le dernier prix précédent, contre ×2,8 à l’intérieur. C’est un outil de calibration, pas un équilibre prêt à publier : les références d’entrée et les productions doivent être ajustées ensemble.

### Cibles de rythme à vérifier ensuite

- Cycle 1 : 20–35 minutes pour découvrir les quatre premières fondations avec une activité normale.
- Cycles suivants : généralement 5–12 minutes par nouvel atelier après entrée dans le chapitre.
- Marches ordinaires : 10–25 minutes de progression active ; quelques marches structurantes : 25–45 minutes, avec des choix visibles pour les franchir.
- Après redémarrage : le trajet déjà parcouru doit se reconstruire sensiblement plus vite, mais la nouvelle frontière conserve sa difficulté.
- Une seule partie ne doit plus traverser cinq nouveaux cycles en quelques minutes ; elle peut en atteindre plusieurs si le joueur y consacre du temps.

Ces durées sont des objectifs de conception, pas des résultats déjà simulés pour le candidat. La reconstruction et le contenu nouveau doivent être chronométrés séparément.

## 6. Principes permanents : coûts et déblocage

### Catalogue actuel

| Principe | Prix successifs | Prix total |
| --- | --- | ---: |
| Homogénéité | 1, 2, 3, 4, 5, 6, 7, 8 | 36 |
| Somme directe | 2, 4, 6, 8, 10, 12, 14, 16 | 72 |
| Gauss | 3, 5, 7, 9, 11, 13 | 48 |
| Résonance | 2, 4, 6, 8, 10, 12 | 42 |
| Image fidèle | 3, 6, 9, 12, 15, 18 | 63 |
| Base héritée | 1, 3, 5 | 9 |
| Reconstruction | 2, 4, 6, 8, 10 | 30 |
| **Total** | Premier niveau de chacun : 14 points | **300** |

Tous les niveaux sont achetables sans exigence de cycle. Le catalogue est petit relativement aux invariants créés, et il ne propose aucun nouvel objectif une fois terminé.

### Catalogue candidat

| Principe | Prix proposés | Total |
| --- | --- | ---: |
| Homogénéité | 1, 2, 3, 5, 8, 12 | 31 |
| Somme directe | 2, 3, 5, 8, 12, 18 | 48 |
| Gauss | 2, 4, 7, 11, 16 | 40 |
| Résonance | 1, 2, 4, 6, 9 | 22 |
| Image fidèle | 2, 3, 5, 8, 12 | 30 |
| Base héritée | 1, 3, 6 | 10 |
| Reconstruction | 2, 4, 7, 11 | 24 |
| Modules automatiques | 6, 12, 20 | 38 |
| Anciens ateliers automatiques | 12, 20 | 32 |
| **Total** | Sept existants : 205 ; automatisations : 70 | **275** |

Le prix total n’est pas le mécanisme principal de protection. Les niveaux deviennent progressivement disponibles, par exemple aux cycles 1, 3, 5, 8, 11 et 14 pour un principe à six niveaux. Base héritée et automatisations ont des paliers propres. Aucun principe ne demande une notion avant qu’elle soit introduite.

Les prix ne sont pas simplement augmentés : les revenus beaucoup plus faibles et les paliers de progression rendent inutiles les coûts artificiellement énormes. Une première grille à 637 points a été rejetée après comparaison avec l’enveloppe de financement.

Contrôle de budget : trois redémarrages à chaque frontière, avec des productions nominales successives de 32, 128 puis 512 fois sa référence, donnent au total 275 points sur les 17 cycles, dont seulement 27 sur les trois premiers. Le catalogue ci-dessus peut donc être entièrement financé dans cette enveloppe, pas avant les derniers cycles. Ces volumes et ces 51 redémarrages constituent un contrôle comptable, **pas une durée de jeu ni une stratégie optimale démontrée**. Un joueur qui reconstruit moins doit choisir ses orientations ; il ne doit pas avoir besoin de tous les principes pour finir.

Il reste à vérifier que ces volumes sont atteignables dans le rythme visé, et que les premiers niveaux utiles arrivent assez vite. La grille doit être ajustée si la simulation complète ne finance pas les achats disponibles ; les recettes et les prix doivent changer ensemble.

Réduire également les effets universels : ordre de grandeur de +8 % de production passive par niveau, +15 % de clic, remises de prix limitées. Un principe de confort ne doit pas ajouter une nouvelle puissance multiplicative.

### Deux nouveaux achats et une fonction de confort

**Modules automatiques — cycles 4, 8, 12**

- Niveau 1 : achète automatiquement Calibration quand ses conditions sont satisfaites.
- Niveau 2 : ajoute Amplification et Couplage.
- Niveau 3 : ajoute Résonance et Stabilisation.
- Paie le vrai coût ; ne construit pas les niveaux nécessaires gratuitement.
- Un achat au maximum par seconde ; règle de budget et réserve pour le prochain atelier ; interrupteur global et par atelier.
- Ne touche pas aux maîtrises d’atelier ni aux principes permanents : ces gros choix restent volontaires.

**Anciens ateliers automatiques — cycles 8 et 12**

- Renforce les ateliers déjà connus, avec un niveau cible choisi, seulement dans les cycles inférieurs à la frontière actuelle.
- Ne franchit pas seul un nouveau cycle et ne consomme pas sa réserve de coordonnées.
- Limites de niveau, priorité et budget affichés ; aucune avalanche d’achats lors d’un retour hors connexion.

**Plans archivés — configuration gratuite, pas un troisième achat**

- Mémorise les modules et cibles choisis, puis prépare leur reconstruction.
- Ne donne pas les modules gratuitement et respecte leurs prérequis.
- Fonctionne manuellement sans acheter l’automatisation ; avec elle, devient une liste de priorités automatiquement exécutée.
- L’archivage étant le support de configuration des automatisations, le faire payer une troisième fois est redondant. Il est retenu comme fonction gratuite : seules les exécutions automatiques coûtent des invariants.

## 7. Exercices : aider réellement à franchir une marche

### Règle actuelle

Une bonne réponse donne au minimum 24 coordonnées, ou 20 secondes de production, multipliées par les bonus d’ateliers et Image fidèle. Une erreur donne encore au minimum 5 coordonnées, ou 5 secondes de production. Il n’existe pas de série de bonnes réponses.

À niveau uniforme 100 et avec Image fidèle au maximum, une bonne réponse représente **456 secondes de production** ; à niveau 500, **2 128 secondes**. Une question peut alors payer plusieurs minutes d’économie tout en arrivant toutes les 65–90 secondes.

Les erreurs font revenir la prochaine anomalie au plus tard dans 30 secondes. Le scénario à 25 % de réussite n’intègre pas ce raccourcissement : le bénéfice possible du clic au hasard peut donc être sous-estimé. Il faut retirer le gain économique de l’erreur, sans enlever de ressources déjà gagnées ni de maîtrise.

### Proposition

1. **Bonne réponse** : 12 secondes de production de référence, minimum 24 coordonnées, avec un multiplicateur total de récompense plafonné à ×2. L’erreur donne la correction, mais zéro coordonnée.
2. **Trois bonnes réponses consécutives** : « Résonance constructive », production ×2 pendant 60 secondes. Aucun cumul multiplicatif, aucune prolongation illimitée, aucune amplification des récompenses par le boost lui-même. Une erreur remet la série à zéro, pas la maîtrise acquise.
3. **Frontières pédagogiques** : entrées des cycles 4, 8, 12, 15 et 17 proposées comme marches structurantes. Au-delà des coordonnées, obtenir trois validations sur des types de tâches distincts issus du cycle déjà accessible. Les validations sont permanentes et ne doivent pas obligatoirement être consécutives.
4. Montrer « validations 1/3 » et le prochain objectif. Une mauvaise réponse donne un indice et permet de réessayer sans perte de monnaie. Aucun délai de réponse imposé.
5. Les exercices du nouveau cycle ne sont jamais requis avant l’ouverture de ce cycle. Les questionnaires du laboratoire ne créditent pas la partie.

Une personne passive peut préparer les coordonnées et améliorer son réseau, mais ces frontières explicites demandent réellement de résoudre des exercices. Les séries donnent un coup de pouce supplémentaire aux joueurs réguliers sans transformer chaque erreur en blocage.

La maîtrise persistante doit rester distincte de la série et de son multiplicateur temporaire. Aujourd’hui le bonus de production additionne Vecteurs, Bases et Applications, mais omet Matrices ; ce traitement doit être rendu cohérent. Les gains actuels de +6 points par réponse remplissent aussi rapidement les jauges : ne pas utiliser ces seules jauges comme preuve de couverture du programme.

## 8. Robustesse, sauvegardes et interface

- Hors connexion : plafond actuel de deux heures de production. Les gains alimentent aussi la production de la partie et donc les invariants. Montrer séparément gain hors ligne et rendement de redémarrage ; ils ne créditent aucune validation pédagogique ni série.
- Compteurs : le plafond `n + 1` atteint la limite des entiers exacts à très grande échelle. Des gains petits et normalisés évitent de demander des totaux astronomiques ; les compteurs d’invariants restent des entiers sûrs.
- Coordonnées : à très grandes valeurs, un petit achat peut ne plus diminuer visiblement un nombre flottant (`10⁴⁶ − 24 = 10⁴⁶` dans cette représentation). Les synergies doivent rester bornées même pour ces anciens ateliers bon marché. Si l’on exige un débit exact de ces petits achats, il faut une représentation de grandes décimales, pas seulement de meilleurs suffixes.
- Prix/prérequis : le cumul historique révèle un atelier mais il faut encore acheter son prédécesseur dans le réseau actuel. La carte doit distinguer « connu », « reconstructible » et « premier exemplaire construit ».
- Principes : afficher leur cycle d’accès, coût, effet réel et prochain niveau, avec seulement les prochains objectifs utiles mis en avant.
- Sauvegardes : ne pas retirer silencieusement les 44/88 points déjà gagnés. Une refonte change leur valeur et ne peut pas être convertie fidèlement sans historique détaillé des redémarrages. Prévoir une copie exportable de l’ancienne partie et une nouvelle économie versionnée ; conserver thème et historique pédagogique. Choisir explicitement avec le joueur entre nouvelle partie et migration compensée.
- Économie actuelle laissée inchangée pendant l’audit. Aucune sauvegarde lue, effacée ou modifiée ; aucune publication.

## 9. Variété des exercices signalés pendant l’audit

- La variante « aire du parallélogramme » de `basis-determinant` génère effectivement seulement u=(a,0), v=(0,b). À diversifier : vecteurs obliques indépendants, orientation négative, colinéarité et cas axis-aligned minoritaires. Le problème est identifié, pas corrigé pendant cet audit.
- La recherche de v dans u+2v=w était également figée. **Corrigée localement** : coefficients signés −4, −3, −2, 2, 3, 4 ; coordonnées entières ; tests des six variantes et de chaque distracteur en dimensions 2 et 3. Les écritures du type `+ -3v` sont évitées.
- La recherche de β dans w=αu+βv utilisait toujours u=(1,1), v=(1,−1). **Corrigée localement** : les deux vecteurs varient, restent indépendants, et leur déterminant non nul a une valeur absolue au plus égale à 6. La solution est vérifiée indépendamment par det(u,w)/det(u,v).
- L’ajout d’un vecteur utilisait le même r pour l’indice final et le rang, et permettait une famille à un seul vecteur. **Corrigé localement** : F contient explicitement deux à six vecteurs ; son rang est tiré séparément et peut être inférieur à son cardinal. Le vecteur ajouté reste extérieur à Vect(F), donc la réponse est le rang initial augmenté de un.

Ce point compte économiquement : une bonne réponse ne doit pas signifier reconnaître mécaniquement un patron toujours identique. Les validations aux frontières portent sur plusieurs types de tâches, et les rappels de cours figés restent espacés.

## 10. Ordre de mise en œuvre conseillé

1. Remplacer les invariants exponentiels par des gains normalisés à la frontière ; instrumenter chaque redémarrage.
2. Borner les synergies et les remises ; mesurer de nouveau les 17 cycles sans les confondre avec les redémarrages.
3. Calibrer tarifs d’entrée et progression interne, avec tous les modules/manières d’investir.
4. Intégrer récompenses bornées, séries et cinq frontières pédagogiques.
5. Débloquer les principes par progression ; ajouter d’abord Modules automatiques, puis évaluer les deux autres conforts.
6. Finaliser migration/interface ; tester en vrai sur petit écran avant publication.

### Critères d’acceptation

- Gains de redémarrage du cycle 3 plafonnés à quatre dans le candidat ; aucun principe tardif achetable au cycle 3.
- Aucun redémarrage conseillé qui ralentit le joueur sans donner un avantage utile. Comparer aussi l’absence de redémarrage et les reconstructions très fréquentes.
- Pas de multiplication infinie des séries ni de baisse des prix vers zéro.
- La progression interne d’un chapitre reste perceptible après sa première entrée ; les cinq derniers cycles ne s’effacent plus en moins de cinq minutes.
- Les scénarios doivent financer les niveaux de principes disponibles : coûts et recettes évalués ensemble, pas indépendamment.
- Tester novices à 40 %, joueurs réguliers à 70 %, experts à 95 %, passifs, clics au hasard, retours hors connexion, absence de redémarrage, dépenses alternatives et automatisation activée/désactivée.
- Mesurer temps jusqu’à chaque atelier, reconstruction, nouvelle frontière, récompenses totales par source, invariants par heure et moment de chaque achat permanent.
- Les erreurs ne détruisent ni ressources ni connaissances. Les paliers pédagogiques ne demandent jamais de notion future.
- Rendu lisible, montants français abrégés, même résultat en prévisualisation et après achat/redémarrage.

## 11. Reproduction

- `scripts/audit-economy.mjs` : huit scénarios du jeu actuel, achats de principes tracés, tous les temps de cycles et stress des bonus. Sélection : `--scenario=ceiling`, `single`, `passive`, `random`, `expert`, `no-discounts`, `no-synergies`, `immediate`.
- `scripts/economy-candidate.mjs` : fonctions arithmétiques candidates isolées ; elles ne sont importées par aucune page jouable.
- `tests/economy-candidate.test.mjs` : plafonds, rendements répétitifs, tarifs et bornes proposés.
- `tests/question-variants.test.mjs` : nouvelle variété et unicité des réponses de u ± kv = w.

Les résultats du candidat sont des vérifications de règles élémentaires. La prochaine étape est une simulation événementielle complète avec ses frontières, séries, nouveaux tarifs, achats permanents et automatisations avant de qualifier la refonte d’équilibrée.

Validation locale finale : compilation du jeu et de la version Pages réussie ; 77 tests réussis, aucun échec. Les règles économiques jouables demeurent inchangées et aucune publication n’a été effectuée pendant cet audit.
