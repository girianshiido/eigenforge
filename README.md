# EIGENFORGE

Forgez un espace vectoriel dans un jeu incrémental consacré à l’algèbre
linéaire des classes préparatoires MPSI et MP.

## Contenu actuel

- production manuelle et automatique de coordonnées ;
- bouton d’émission animé avec impulsion, onde et réponse tactile ;
- carte mathématique progressive : ressource brute en dimension 0, direction
  portée par \(u\) avec l’Émetteur, puis base \(B=(u,v)\) avec la Chambre ;
- animations lentes des directions, du plan et des grilles, avec un champ
  circulaire conservant ses proportions sur ordinateur et téléphone ;
- projection distincte des quatre vecteurs de la base, avec e₄ représenté en
  pointillés pour rappeler la limite d’une projection plane ;
- direction et longueur du vecteur u renouvelées à chaque forge, puis image
  f(u) animée selon une nouvelle direction lorsque l’application est active ;
- Émetteur vectoriel, Chambre des bases et Transformateur linéaire ;
- paliers de production ×2 à 10, 25 et 50 instruments, avec une première
  progression calibrée jusqu’au changement de base ;
- résonance, maîtrise et changement de base avec aperçu des pertes, éléments
  conservés et multiplicateur obtenu ;
- six principes permanents à renforcer avec les invariants : production
  manuelle ou passive, prix des ateliers, résonance, anomalies et héritage
  d’ateliers dimensionnels entre deux cycles ;
- quatrième cycle « Matrices et réduction » portant la forge à seize ateliers,
  avec encodage, produit, inversibilité et spectre ;
- cinquième cycle « Réduction spectrale · MP » portant la forge à vingt
  ateliers : polynôme caractéristique, espaces propres, diagonalisation et
  trigonalisation ;
- matrices 2×2 à 5×5 rendues comme de vraies grilles responsives dans les
  énoncés, les réponses et les corrections ;
- notation contextuelle des vecteurs : tuples compacts pour les coordonnées,
  vecteurs-colonnes dès qu’une matrice agit ou que les colonnes d’une
  représentation sont explicitées, y compris pour le résultat d’un produit
  matrice-vecteur ;
- perturbations sur l’image, le noyau, le rang et les trois inconnues du
  théorème du rang ;
- perturbations sur le produit matrice-vecteur, le produit de matrices 2×2, la
  matrice d’une application, l’inversibilité et les déterminants 2×2 ou 3×3
  calculables de tête ;
- progression conforme aux deux années : le socle MPSI précède les matrices
  par blocs et les valeurs propres, débloquées avec la Chambre spectrale MP ;
- déblocage progressif des exercices de réduction : chaque atelier MP ajoute
  sa propre famille au générateur au lieu d’ouvrir tout le chapitre d’un coup ;
- anomalies mathématiques générées sur les vecteurs, les bases et les
  applications linéaires ;
- rappels mathématiques affichés seulement lorsqu’ils apportent une information
  utile à la question ;
- composition typographique des expressions linéaires, sans coefficients 1
  inutiles ni doubles signes ;
- corrections avec méthode, interprétation géométrique et erreur fréquente ;
- navigation par onglets Réseau, Instruments, Anomalies et Atlas, avec barre
  inférieure sur téléphone et tablette en portrait ;
- sauvegarde locale et gains hors ligne plafonnés à deux heures ;
- installation comme application sur Android et iOS, avec icônes dédiées et
  cache hors ligne ;
- interface responsive pour ordinateur et téléphone.

## Version GitHub Pages

La commande `pnpm run build:pages` produit la version statique dans `docs/`.
Le site public est servi depuis la branche `main` et le dossier `/docs`.

## Développement local

```bash
pnpm install
pnpm run dev
```

## Vérification

```bash
pnpm run build
node --test tests/*.test.mjs
```
