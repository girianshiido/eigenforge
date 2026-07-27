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
- Émetteur vectoriel, Chambre des bases et Transformateur linéaire ;
- paliers de production ×2 à 10, 25 et 50 instruments, avec une première
  progression calibrée jusqu’au changement de base ;
- résonance, maîtrise et changement de base avec aperçu des pertes, éléments
  conservés et multiplicateur obtenu ;
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
