# AZUR IMMOBILIER — Site de présentation immobilier

> 🚀 **Pour mettre le site en ligne**, suivez le guide pas à pas :
> [`DEPLOIEMENT.md`](DEPLOIEMENT.md) (Netlify ou GitHub Pages, vérification pré-déploiement incluse).

Site vitrine **HTML / CSS / JavaScript vanilla**, sans framework ni étape de build.
Il présente 4 propriétés (Jacqueville-Abreby, Grand-Bassam, Dabou, Grand Lahou)
avec galeries photos, visites vidéo à la demande et animations au scroll.

## 1. Lancer le site

Ouvrez simplement `index.html` dans un navigateur, ou servez le dossier
(recommandé pour les vidéos) :

```bash
# Exemple avec Python (si disponible)
python -m http.server 8000

# Ou avec Node (si disponible)
npx serve .
```

## 2. Structure du projet

```
index.html                  Page unique (toutes les sections)
css/style.css               Styles + animations (reveal, hero, responsive)
js/main.js                  Interactions (scroll, lightbox, vidéo, filtres)
favicon.svg                 Favicon (à remplacer par le logo du client)
scripts/optimize-images.ps1 Génération des miniatures web (Windows, sans dépendance)
scripts/serve.ps1              Mini serveur statique local de prévisualisation
assets/img/<bien>/          Photos ORIGINALES (4–6 Mo chacune — ne pas servir en prod)
assets/img/thumbs/          Photos OPTIMISÉES pour le site (~300 Ko, 1600 px)
assets/videos/              Visites vidéo (65–75 Mo — voir §4)
```

## 3. Performances — comment le site reste léger

- **Photos** : le site n'affiche que `assets/img/thumbs/` (~300 Ko/photo).
  Les originales ne sont utilisées que dans la lightbox, à la demande.
- **Vidéos** : **aucune vidéo n'est chargée à l'ouverture**. Le fichier MP4
  n'est téléchargé que lorsque le visiteur clique sur « Visite vidéo »
  (`preload="none"` + injection de `src` au clic, libération à la fermeture).
- **Lazy loading natif** : toutes les images hors écran ont `loading="lazy"`.
- **Polices** : Google Fonts avec `display=swap` ; repli propre hors ligne.

### Régénérer les miniatures après ajout de photos

```powershell
powershell -ExecutionPolicy Bypass -File scripts/optimize-images.ps1
```

Le script lit `assets/img/<bien>/*.jpg` et écrit `assets/img/thumbs/<bien>-NN.jpg`
(max 1600 px, qualité 80). Après ajout, référencer les nouvelles vignettes dans
`index.html` (galerie + cartes).

## 4. ⚠️ Optimisation des vidéos — action recommandée

Les 3 MP4 font **65 à 75 Mo** : trop lourd pour le web. Avec FFmpeg installé,
générer une version web (~8 Mo, qualité très correcte) :

```bash
ffmpeg -i "assets/videos/bassam.mp4" \
  -vf "scale=-2:720" -c:v libx264 -crf 26 -preset slow \
  -c:a aac -b:a 96k -movflags +faststart \
  "assets/videos/bassam-web.mp4"
```

Puis remplacer dans `index.html` les chemins `assets/videos/*.mp4` par les
versions `-web.mp4` (4 occurrences : hero, carte Bassam, cartes visites).
Idéalement, ajouter aussi une version WebM et des `<source>` multiples.

## 5. Placeholders à remplacer par le client

| Emplacement | Élément à personnaliser |
|---|---|
| `<title>` + meta description (`index.html`) | Nom réel de la société |
| `.brand-name` (header + footer) | Nom de marque (« Azur Immobilier » est un placeholder) |
| `favicon.svg` | Logo réel |
| Section Contact : téléphone, e-mail, adresse, lien WhatsApp | Coordonnées réelles (les liens `tel:` / `mailto:` / `wa.me` sont à mettre à jour) |
| Bouton WhatsApp flottant (`#wa-float` dans `index.html`) | Numéro réel dans l'URL `wa.me/…` **et** message pré-rempli après `?text=` (encoder les espaces en `%20`) |
| `mailto:contact@azur-immobilier.ci` dans `js/main.js` (§10) | Adresse d'envoi du formulaire |
| Descriptions des 4 biens (cartes) | Textes réels : superficie, chambres, prix, statut |
| `.signature-name` (section Portfolio) | Nom du dirigeant |
| Légendes `data-caption` de la galerie | Légendes précises par photo |

Les mentions visibles `[à compléter]` dans la page repèrent ces zones.

Autres placeholders :
- **Grand Lahou** n'a pas de photo dans les fichiers fournis : la carte du
  portfolio affiche une vignette vidéo et la section « Visites vidéo » utilise
  temporairement une photo de Grand-Bassam (`bassam-05.jpg`) comme visuel.
  Remplacer par une photo dédiée dès que disponible.
- `favicon.svg` est un logo générique « Azur » (cercle + vague).

## 6. Brancher le formulaire sur un vrai service

Le formulaire actuel ouvre un client mail (fonctionne partout, zéro backend).
Pour un envoi direct : créer un compte gratuit sur Formspree / Getform,
puis dans `index.html` remplacer l'attribut du formulaire :

```html
<form ... action="https://formspree.io/f/VOTRE_ID" method="POST">
```

et supprimer le bloc JS `initForm` (ou le laisser, il gère la validation).

## 7. Accessibilité & bonnes pratiques incluses

- Navigation clavier complète (lightbox : ←/→/Échap, focus piégé aux modales)
- `prefers-reduced-motion` : toutes les animations sont désactivées
- Liens d'évitement (`skip link`), aria-labels, contrastes AA
- Menu mobile accessible (`aria-expanded`), aucune dépendance JS externe
