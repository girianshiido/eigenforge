# Simulation de l’économie candidate — EIGENFORGE

4 octobre 2026. Simulation isolée, sans modification des règles du jeu, des sauvegardes ou du site publié.

Cette page conserve les résultats de la première grille (V1). La recalibration et ses nouvelles mesures sont disponibles dans [SIMULATION-ECONOMIE-V2.md](SIMULATION-ECONOMIE-V2.md), sans installation dans le jeu à ce stade.

## Verdict

**Le candidat empêche l’explosion des invariants, mais il n’est pas équilibré et ne doit pas être intégré tel quel.** Le coût dominant est désormais la répétition des anciens ateliers après chaque changement de base.

Pour le profil régulier étudié, atteindre les 68 ateliers demande **32,4 heures sans redémarrage**, **50,0 heures avec quatre redémarrages**, et **77,8 heures avec un redémarrage par cycle**. Ces stratégies testées rendent les redémarrages environ 2,4 fois plus longs que l’absence de redémarrage, même si les nouvelles parties profitent ensuite de leur bonus.

L’achat de l’ensemble du catalogue permanent est effectivement possible, mais demande **159,7 heures**, 51 changements de base et 277 points gagnés pour 275 dépensés. Il ne faut pas confondre ce parcours de collection avec l’obligation de tout acheter pour finir.

## 1. Ce qui a réellement été simulé

- Les 68 ateliers et les 17 cycles, dans leur ordre actuel, jusqu’au dernier atelier ou jusqu’à une limite explicite.
- Les prix internes ×2,8, les productions internes ×2,6, les prix d’entrée inchangés, les unités successives ×1,18.
- Les cinq modules, leurs seuils/prix/effets, et les maîtrises au-delà de 200 unités. Le coût de chaque module est recalculé à partir du prix candidat de son atelier.
- Les gains de changement de base normalisés à la frontière, le plafond C+1 et le rendement divisé par 2 à chaque redémarrage supplémentaire de cette frontière.
- Le bonus permanent 1+0,2√I, les achats permanents, leur disponibilité par cycle, l’héritage et la reconstruction.
- De vraies réponses espacées dans le temps : réussites/erreurs tirées avec une graine reproductible, et non une moyenne permanente injectée dans la production.
- Les séries de trois réponses justes : ×2 pendant 60 secondes, sans empilement ni renouvellement pendant le boost actif. Les récompenses utilisent la production sans ce boost.
- Les validations des frontières C4, C8, C12, C15 et C17 : trois types de tâches distincts déjà introduits au cycle précédent. Les validations survivent aux changements de base.
- Les automatisations payant les vrais prix et suspendues hors connexion ; les absences donnent au maximum deux heures de production, sans réponses ni validations.

**Ce n’est pas une partie manuelle dans le navigateur.** Le simulateur prend les décisions d’achat selon une stratégie de rentabilité, avec priorité aux nouveaux ateliers. Il ne démontre pas qu’aucune meilleure stratégie humaine n’existe.

Les durées « actives » des scénarios continus sont des heures de jeu connecté simulé, comprenant les attentes et le temps entre questions. Elles ne sont pas des heures de manipulation effective, ni la durée réelle d’exécution du script.

## 2. Paramètres explicités pour rendre le projet simulable

L’audit précédent laissait plusieurs détails ouverts. Ils ont été concrétisés uniquement dans ce modèle :

- Synergies globales : 1+0,25n/(n+25). Synergies régionales du même type, plafonnées à +50 % pour les anciens coefficients de 4 %, et +37,5 % pour ceux de 3 %. Elles conservent leurs domaines actuels.
- Production passive permanente : +8 % par niveau ; clic : +15 % ; Gauss : 0,95 par niveau, avec plancher permanent 0,7 ; récompenses Image fidèle : +10 % par niveau.
- Résonance permanente : +8 % par niveau sur le facteur manuel du profil. La jauge tactile n’est pas simulée clic par clic ; le profil régulier utilise un facteur manuel 1, l’expert une borne favorable 3.
- Maîtrise pédagogique : les quatre secteurs sont désormais pris en compte, et le gain actuel de six points par bonne réponse est conservé pour ce test. Il ne s’agit pas encore d’une nouvelle mesure de couverture du programme.
- Niveaux des principes à six rangs : C1, C3, C5, C8, C11, C14 ; ceux à cinq rangs : C1, C3, C6, C10, C14. Héritage : C2/C5/C9 ; reconstruction : C2/C5/C9/C13.
- Automatisation des modules : C4/C8/C12, avec respectivement 1/3/5 modules éligibles. Anciens ateliers automatiques : C8/C12, cible 25/50 unités, uniquement dans les cycles déjà dépassés.
- Budget automatique : un achat au maximum par seconde, au plus 10 % du portefeuille pour un achat, avec réserve de 20 % du prochain atelier lorsque son achat est disponible. Aucun saut automatique vers un cycle inédit.
- Achats manuels : une action au maximum par seconde dans ces scénarios. Une action peut acheter un lot limité d’unités ; les lots s’arrêtent aux seuils utiles. Un achat non rentable à court terme peut être différé pour garder les coordonnées du nouvel atelier.
- Les choix de tâches aux frontières sont représentés par leurs types, pas par un solveur mathématique. Le taux de réussite est un paramètre de joueur ; 25 % représente le choix au hasard dans un QCM à quatre réponses.

Ces hypothèses sont consignées ici pour ne pas transformer des choix de simulation en décisions déjà approuvées pour le jeu.

## 3. Résultats des stratégies et profils

| Profil / stratégie | Temps simulé | Ateliers connus | Changements de base | Invariants historiques | Coût des principes achetés | Arrêt |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Régulier, 70 %, un redémarrage par cycle | 77,8 h | 68/68 | 16 | 74 | 73/275 | Terminé |
| Novice, 40 %, un redémarrage par cycle | 90,5 h | 68/68 | 16 | 74 | 73/275 | Terminé |
| Expert, 95 %, un redémarrage par cycle | 65,5 h | 68/68 | 16 | 74 | 73/275 | Terminé |
| Régulier, aucun redémarrage | 32,4 h | 68/68 | 0 | 0 | 0/275 | Terminé |
| Régulier, quatre redémarrages (C4, C8, C12, C16) | 50,0 h | 68/68 | 4 | 20 | 20/275 | Terminé |
| Choix aléatoires, 25 % | 93,4 h | 68/68 | 16 | 74 | 73/275 | Terminé |
| Passif, aucune réponse | 16,5 h | 12/68 | 0 | 0 | 0/275 | Frontière pédagogique C4 |
| Redémarrage dès le premier point | 168,0 h | 36/68 | 73 | 73 | 73/275 | Limite de 168 h |
| Collection, trois redémarrages par cycle | 159,7 h | 68/68 | 51 | 277 | 275/275 | Terminé |
| Régulier, automatisations désactivées | 77,7 h | 68/68 | 16 | 74 | 73/275 | Terminé |
| Régulier, principes clic/exercices prioritaires | 82,9 h | 68/68 | 16 | 74 | 74/275 | Terminé |
| 1 h présente / 11 h absente | 721,0 h | 68/68 | 16 | 74 | 73/275 | Terminé |

Le parcours régulier s’arrête après l’achat du dernier atelier, avant un éventuel redémarrage supplémentaire au cycle 17 : il comporte donc 16 changements de base. Le parcours « collection » poursuit jusqu’à pouvoir financer tous les principes.

Contrôle des tirages : trois graines différentes donnent 77,8 h, 77,3 h, 77,4 h pour le profil régulier. Le problème de durée n’est donc pas dû à un tirage défavorable isolé.

Le profil hors connexion termine après **30,0 jours calendaires**, soit **61,0 heures de présence simulée**. Les dix heures non productives de chaque longue absence restent bien dans le calendrier, mais ne sont pas rémunérées.

## 4. Répartition des temps entre cycles

Toutes les valeurs ci-dessous sont en minutes.

- « Marche » : intervalle entre le premier achat du quatrième atelier d’un cycle et le premier achat du premier atelier du suivant.
- Avec changements de base, cette marche **inclut la reconstruction**, les investissements et éventuellement les validations ; ce n’est pas une simple attente passive.
- « Intérieur » : intervalle entre le premier achat du premier atelier et le premier achat du quatrième atelier d’un cycle.
- Les valeurs sont des premiers accès historiques. Refaire un atelier ne crée pas une nouvelle entrée dans cette table.

| Cycle | Marche sans redémarrer | Intérieur sans redémarrer | Marche avec redémarrage | Intérieur avec redémarrage |
| --- | ---: | ---: | ---: | ---: |
| 1 | — | 18,4 | — | 18,4 |
| 2 | 12,5 | 46,0 | 52,9 | 37,8 |
| 3 | 53,6 | 66,3 | 75,8 | 39,1 |
| 4 | 67,3 | 67,0 | 143,6 | 37,8 |
| 5 | 57,4 | 60,0 | 162,0 | 28,2 |
| 6 | 58,8 | 64,7 | 204,6 | 27,5 |
| 7 | 56,5 | 66,4 | 244,9 | 26,8 |
| 8 | 53,8 | 61,4 | 223,7 | 23,9 |
| 9 | 59,6 | 67,2 | 250,1 | 21,4 |
| 10 | 68,1 | 75,2 | 277,6 | 20,9 |
| 11 | 72,8 | 79,8 | 309,5 | 22,5 |
| 12 | 55,4 | 76,3 | 341,7 | 19,2 |
| 13 | 103,4 | 78,8 | 365,2 | 17,9 |
| 14 | 83,7 | 72,4 | 380,6 | 16,3 |
| 15 | 48,7 | 56,1 | 393,4 | 11,1 |
| 16 | 46,1 | 32,2 | 427,9 | 8,4 |
| 17 | 29,3 | 28,5 | 427,0 | 7,9 |

Le profil régulier découvre les quatre fondations en 19,6 minutes ; novice : 23,2 minutes ; expert : 12,4 minutes.

La dernière marche avec redémarrage atteint 7,1 heures. Sans redémarrer, certaines marches dépassent tout de même une heure. Les anciens premiers prix n’ont donc pas été correctement recalibrés après le changement des productions et des synergies.

Les cinq derniers cycles demandent 7,9 heures sans redémarrage : ils ne sont plus avalés en moins de deux minutes comme dans l’ancien scénario actif. En revanche, leur progression n’est pas encore dans les cibles proposées.

## 5. Invariants et financement

### Le problème 44 → 88 est bien corrigé

Le parcours régulier reçoit 2, 3, puis 4 points lors de ses trois premiers redémarrages : **9 points historiques**, au lieu d’une suite qui double en fonction des anciens gains.

Le parcours de collection, avec trois redémarrages par frontière, reçoit au total 27 points sur les trois premiers cycles. Les niveaux tardifs des principes restent bloqués par leurs cycles d’accès, indépendamment du portefeuille.

Le modèle n’a enregistré aucun nombre infini ni dépassement de la précision entière des invariants. Tous les gains respectent C+1 ; les points dépensés ne relèvent pas le plafond.

### Mais le financement courant est maigre

Avec un redémarrage par cycle, le joueur arrive au dernier atelier avec **74 points historiques**, dont **73 dépensés** : seulement 27 % du coût intégral du catalogue. Ce n’est pas nécessairement mauvais pour une collection de fin de jeu, mais le joueur n’accède pas naturellement à la majorité des conforts promis.

Le parcours « collection » finance bien les 275 points, mais ses volumes 32/128/512 fois la référence sont trop exigeants tôt dans le jeu. **Les trois premiers redémarrages au cycle 1 demandent à eux seuls 29,1 heures.** La référence minimale de 750 000 et les plafonds de deux points rendent l’insistance au cycle 1 particulièrement peu rentable.

Les 277 points finaux, au lieu des 275 de l’enveloppe théorique, proviennent des volumes réellement produits lors de la construction et des achats : les seuils nominaux peuvent être déjà dépassés lorsqu’une famille de quatre ateliers est terminée. Les gains sont recalculés sur ces volumes réels.

Redémarrer dès le premier point n’est pas une stratégie viable dans le test : après une semaine continue, seuls 36 ateliers sont connus. Cela ne prouve pas un blocage définitif, mais montre que la règle punit fortement une stratégie pourtant facile à choisir dans l’interface.

## 6. Le coût de reconstruction domine

Dans le parcours régulier, **65,0 heures sur 77,8** sont consacrées à retrouver, après un redémarrage, au moins un exemplaire de l’atelier le plus avancé de la partie précédente.

Cette mesure n’exige même pas de restaurer ses anciens modules et niveaux : le coût d’un retour complet à la puissance précédente peut être plus élevé. À la fin, cette reconstruction minimale prend 7,0 heures.

L’héritage de quatre premières unités et les remises sur les dix premières unités des huit premiers ateliers aident le début, mais presque plus le parcours avancé. Réduire les revenus permanents sans élargir la reconstruction explique l’essentiel du désavantage des redémarrages.

Quatre redémarrages seulement, aux frontières 4/8/12/16, restent moins intéressants pour le temps total que l’absence de redémarrage : 50,0 contre 32,4 heures dans les stratégies testées.

## 7. Exercices et automatisations

### Les séries fonctionnent, mais ne suffisent pas

Part de temps connecté sous boost : 2,3 % pour le novice, 12,1 % pour le régulier, 27,2 % pour l’expert.

Les erreurs n’apportent aucune coordonnée et ne suppriment pas la maîtrise acquise. Le boost n’amplifie pas sa propre récompense. Le multiplicateur des récompenses est bien limité à deux ; le minimum de 24 coordonnées peut toutefois représenter plus de 24 secondes de faible production au début.

Un joueur sans réponse s’arrête à C4 après les 12 premiers ateliers : les validations jouent donc leur rôle. Les réponses au hasard permettent encore de franchir les paliers à long terme : trois succès non consécutifs ne constituent pas une protection contre la devinette. Le scénario à 25 % termine en 93,4 heures ; ce taux est une hypothèse de modèle, pas une observation de réponses réelles.

La progression économique étant si lente, les trois validations sont souvent déjà obtenues bien avant que les coordonnées de la frontière soient disponibles. Pour créer des marches pédagogiques intéressantes, il faudra calibrer leur place avec les coûts, pas seulement les ajouter à une attente de plusieurs heures.

### Le confort automatique reste trop tardif dans le parcours ordinaire

Le parcours régulier n’achète que le premier niveau des modules automatiques et aucun achat automatique d’ancien atelier. Le candidat promet donc un confort que sa propre économie finance peu.

Avec les actions manuelles optimisées à une seconde, activer ou désactiver l’automatisation ne change presque pas la durée totale (77,8 / 77,7 heures). Les deux scénarios gardent la même priorité d’achat des principes, pour isoler l’activation ; un joueur qui ne veut jamais l’utiliser pourrait dépenser ces points autrement.

Cette comparaison ne mesure pas le soulagement d’un humain sur téléphone. Elle montre surtout que les automatisations ne doivent pas être vendues comme un multiplicateur caché. Le parcours de collection exécute 15 717 achats automatiques, tous facturés selon la même règle que les achats manuels, sans aucun achat hors connexion.

## 8. Défaut numérique toujours présent

Les remises restent bornées : le facteur global ne passe pas sous 0,35 ; la reconstruction ciblée est traitée séparément. Aucun emballement multiplicatif illimité n’est conservé dans les synergies globales.

Néanmoins, les anciens prix d’entrée conduisent toujours à des portefeuilles de l’ordre de 10⁴⁵. À cette échelle, un achat très ancien et très petit ne change plus le nombre flottant représenté. Le modèle détecte 3 débits sans différence visible dans le parcours régulier et 82 dans celui de collection.

Ces coûts sont négligeables pour la courbe globale simulée, mais **le débit exact des achats ne peut pas être déclaré validé**. Une intégration doit corriger la représentation monétaire ou diminuer fortement l’échelle nominale. Les bornes économiques seules ne corrigent pas la précision des grands nombres.

## 9. Ce que je conseille de changer avant une nouvelle simulation

1. **Conserver les petits gains et les verrous progressifs**, sans remettre le doublement historique.
2. **Rendre la reconstruction utile jusqu’aux ateliers avancés** : héritage ou plans payants reconstruisant les anciens chapitres, réduction ciblée renouvelée, et achats automatiques accessibles plus tôt. Leur portée doit suivre la frontière, pas rester limitée aux huit premiers ateliers.
3. **Recalibrer les références d’entrée et les productions ensemble.** Garder les anciens premiers prix était un outil de diagnostic, pas un équilibre. Réduire les marches excessives et garder une progression interne lisible.
4. **Revoir le rendement des redémarrages volontaires**, surtout la référence minimale du début et la pénalité des répétitions. Montrer dans l’interface quand une reconstruction serait manifestement désavantageuse ; éviter un piège irréversible de mauvais redémarrages.
5. **Financer des premiers niveaux de confort dans le parcours normal**, puis réserver les derniers niveaux à la fin de jeu. Ne pas exiger le parcours de 51 redémarrages pour profiter du système.
6. **Garder séries et validations distinctes de la maîtrise.** Évaluer leur utilité une fois les marches économiques ramenées à une durée raisonnable ; ne pas pénaliser les erreurs en monnaie.
7. **Traiter la précision des coordonnées** avant d’affirmer que chaque achat est réellement débité à toutes les échelles.

Il ne faut pas adopter le candidat puis seulement augmenter toutes les récompenses pour compenser : cela réintroduirait l’accélération qui a motivé l’audit.

## 10. Reproduction et contrôles

- Moteur : `scripts/simulate-candidate-economy.mjs`.
- Règles isolées : `scripts/economy-candidate.mjs`.
- Résultats complets des 14 scénarios : `SIMULATION-ECONOMIE.json` ; comprennent les premiers achats de chaque atelier, les temps de cycles, les gains de chaque redémarrage, les sources de revenus et les paramètres de chaque scénario via leur identifiant.
- Lancer tous les scénarios : `node scripts/simulate-candidate-economy.mjs`.
- Sélectionner un scénario : `node scripts/simulate-candidate-economy.mjs --scenario=regular`.
- 81 tests réussis, aucun échec ; contrôles de répétabilité, prix/gains, disponibilité des principes, boost borné, frontière sans réponses et plafond hors connexion. L’analyse de ces scripts ne signale pas d’erreur de style et les différences ne contiennent pas d’erreur d’espacement.

Les tests prouvent la cohérence des règles simulées, **pas leur qualité ludique**. Les résultats ci-dessus sont au contraire une raison mesurée de ne pas intégrer cette première grille telle quelle.
