# Déployer le site — guide pas à pas

Le site est **100 % statique** (HTML/CSS/JS, aucun build) : il se déploye sur
n'importe quel hébergeur statique en quelques minutes. Deux options gratuites
sont détaillées ici : **Netlify** (recommandé) et **GitHub Pages**.

> **Avant la première mise en ligne** : lancez la vérification
> ```powershell
> powershell -ExecutionPolicy Bypass -File scripts/check-deploy.ps1
> ```
> puis complétez les placeholders signalés (voir `README.md` §5) :
> coordonnées, numéro WhatsApp, nom de marque, favicon, descriptions des biens.

---

## Option A — Netlify (recommandé)

### A1. Méthode glisser-déposer (la plus rapide, 2 minutes)

1. Ouvrez [app.netlify.com/drop](https://app.netlify.com/drop) et créez un
   compte gratuit si nécessaire.
2. Glissez-déposez **le dossier du projet entier** (celui qui contient
   `index.html`) dans la zone prévue.
3. Netlify publie immédiatement sur une adresse du type
   `https://nom-aleatoire.netlify.app` — le site est en ligne.
4. Dans **Site settings → Change site name**, choisissez un nom lisible :
   `https://azur-immobilier.netlify.app`.

**Limites à connaître** : cette méthode ne publie pas les dossiers cachés
(`.nojekyll`, `.gitignore` — sans importance sur Netlify) et chaque mise à jour
se fait en redéposant le dossier à la main. Pour un flux continu, utilisez A2.

### A2. Méthode via Git (déploiement automatique à chaque `git push`)

1. Poussez le projet sur GitHub (voir §1 ci-dessous pour initialiser git).
2. Sur [app.netlify.com](https://app.netlify.com) : **Add new site →
   Import an existing project → GitHub** et autorisez l'accès.
3. Sélectionnez le dépôt. Netlify détecte le `netlify.toml` :
   - **Publish directory** : `.`
   - **Build command** : *(vide — aucun build)*
4. Cliquez **Deploy**. Chaque `git push` sur la branche choisie redéploie
   automatiquement le site.

### Ce que fait déjà `netlify.toml` pour vous

- **Aucun build** : publication directe du dossier.
- **Blocage de `/.freebuff/*`** (données locales, au cas où).
- **Redirection catch-all** : toute route inconnue sert `index.html`
  (utile le jour où vous ajoutez des pages).
- **Cache** : médias (`/assets/*`) cachés 1 an (toute modification passe par un
  nouveau déploiement) ; CSS/JS revalidés toutes les heures.

---

## Option B — GitHub Pages

GitHub Pages sert le site depuis **`https://<votre-pseudo>.github.io/<nom-du-depot>/`**
— les chemins du site étant tous relatifs, **aucune modification du code n'est
requise**. Le fichier `.nojekyll` déjà présent désactive le traitement Jekyll
(sinon les dossiers commençant par `_` seraient ignorés, et certains fichiers
pourraient être transformés).

### Prérequis commun : initialiser git et pousser sur GitHub

1. Créez un dépôt **vide** sur [github.com/new](https://github.com/new)
   (par ex. `azur-immobilier`), **sans** README ni .gitignore (ils existent déjà).
2. À la racine du projet :
   ```bash
   git init
   git add .
   git commit -m "Site vitrine immobilier — première version"
   git branch -M main
   git remote add origin https://github.com/<votre-pseudo>/azur-immobilier.git
   git push -u origin main
   ```
   `.gitignore` exclut déjà `.freebuff/` et `scripts/serve.pid`.

### B1. Via GitHub Actions (recommandé)

1. Sur GitHub : **Settings → Pages**.
2. Dans **Build and deployment → Source**, choisissez **GitHub Actions**.
3. Le déploiement se déclenche à chaque `git push` (workflow par défaut).
4. Après ~1 minute, le site est en ligne à l'adresse affichée dans
   **Settings → Pages** (URL finale du type
   `https://<pseudo>.github.io/azur-immobilier/`).

### B2. Via la branche `gh-pages`

Alternative sans Actions :
1. **Settings → Pages → Source : Deploy from a branch**, branche `main`,
   dossier `/ (root)`.
2. Le site se redéploie à chaque push sur `main`.

### Après le déploiement GitHub Pages

- Dans `index.html`, mettez à jour la balise `og:url` commentée (partage
  WhatsApp/Facebook : remplacez par l'adresse finale du site).
- **Limite importante** : GitHub Pages recommande des dépôts **≤ 1 Go** et
  signale les dépassements de bande passante au-delà de **100 Go/mois**.
  Les 3 vidéos originales (~210 Mo) pèsent lourd : optimisez-les d'abord
  (§3 ci-dessous) — avec elles optimisées (~24 Mo au total), vous restez
  très en dessous des limites.

---

## 3. Avant de publier : alléger les vidéos (fortement recommandé)

Les 3 MP4 originaux font **65–75 Mo** : sur un hébergement gratuit, c'est lent
à charger et cela épuise vite la bande passante. FFmpeg une fois installé :

```powershell
winget install Gyan.FFmpeg        # ou choco install ffmpeg
powershell -ExecutionPolicy Bypass -File scripts/optimize-videos.ps1
```

Résultat : `assets/videos/*-web.mp4` (~720p, ~8 Mo chacun, démarrage rapide
grâce à `+faststart`). **Puis** dans `index.html`, remplacez les 4 références
`assets/videos/<nom>.mp4` → `assets/videos/<nom>-web.mp4`
(hero, carte Bassam, 2 cartes visites — Grand Lahou et Jacqueville utilisent
leurs noms de fichiers d'origine).

Pour aller plus loin : hébergez les vidéos sur **Cloudinary** (plan gratuit
avec transcodage) ou **Mux** et remplacez les URL locales — le site les
supporte telles quelles dans les attributs `data-video`.

---

## 4. Domaine personnalisé

### Sur Netlify
1. **Domain management → Add a domain**, entrez `votre-domaine.ci`.
2. Suivez l'assistant : chez votre registrar, ajoutez l'enregistrement
   `CNAME` indiqué (ex. `www → azur-immobilier.netlify.app`) ou les serveurs
   DNS Netlify.
3. Le certificat **HTTPS Let's Encrypt est automatique**.

### Sur GitHub Pages
1. **Settings → Pages → Custom domain**, entrez `www.votre-domaine.ci`.
2. Chez votre registrar : `CNAME` `www → <pseudo>.github.io`.
3. Cochez **Enforce HTTPS** une fois le certificat émis.
4. Le fichier `CNAME` sera créé automatiquement dans le dépôt — commitez-le.

---

## 5. Après la mise en ligne — checklist

- [ ] Ouvrir le site dans un onglet privé : le hero s'affiche, aucune erreur
      visible.
- [ ] Tester une **visite vidéo** (le MP4 doit démarrer rapidement — sinon,
      les vidéos ne sont pas optimisées, §3).
- [ ] Tester le **formulaire** (doit ouvrir le logiciel de messagerie) et le
      **bouton WhatsApp** avec le vrai numéro.
- [ ] Partager l'URL dans WhatsApp pour vérifier l'image/le titre du
      **partage social** (à défaut, `og:url` n'est pas à jour).
- [ ] Lancer <https://pagespeed.web.dev> sur l'URL finale : viser
      **≥ 85 en mobile** (les miniatures sont optimisées, la vidéo n'est
      chargée qu'au clic).
- [ ] (Optionnel) Soumettre l'URL à [Google Search Console](https://search.google.com/search-console)
      pour l'indexation.

---

## 6. Mises à jour ultérieures

| Méthode | Comment mettre à jour |
|---|---|
| Netlify Drop | Redéposez le dossier sur app.netlify.com/drop |
| Netlify + Git | `git add . && git commit -m "…" && git push` → redéploiement auto |
| GitHub Pages | `git add . && git commit -m "…" && git push` → redéploiement auto |

Après ajout de nouvelles photos : `scripts/optimize-images.ps1` puis mettre à
jour `index.html`. Après ajout de vidéos : `scripts/optimize-videos.ps1` puis
mettre à jour les chemins dans `index.html`.

---

## 7. Dépannage rapide

| Symptôme | Cause probable / solution |
|---|---|
| Page blanche sur GitHub Pages | Un chemin absolu (`/css/...`) s'est glissé dans le HTML — la vérification `check-deploy.ps1` l'aurait signalé ; gardez tout en relatif |
| 404 sur les images | Vérifier la casse des noms : GitHub Pages est sensible à la casse (`BASSAM.mp4` ≠ `bassam.mp4`) — déjà renommés en minuscules dans ce projet |
| Vidéo qui ne démarre pas | Servez le site en HTTPS ou localhost ; certains navigateurs bloquent la lecture sur `file://` |
| Formulaire qui n'envoie rien | Le `mailto:` dépend du logiciel de messagerie configuré ; pour un vrai envoi serveur, brancher Formspree (README §6) |
| Ancien site affiché après mise à jour | Cache : Netlify → **Clear cache and deploy site** ; GitHub Pages attend ~1 min puis Ctrl+F5 |
| Site introuvable après création | GitHub Pages : vérifier que la source est bien **GitHub Actions** ou branche `main / root` |
